'use strict';
const { fail, number } = require('./common');
function simulateNetwork(network, input = {}) {
  const shockType = input.shockType ?? 'cyclone';
  if (!['cyclone', 'portClosure', 'port closure', 'strike', 'fire'].includes(shockType))
    fail(400, 'Unsupported shock type');
  const duration = number(input.duration, 'Duration', 1, 90, 28);
  const severity = number(input.severity, 'Severity', 0, 1, 1);
  const horizon = number(input.horizon, 'Horizon', 1, 90, 30);
  if (!Number.isInteger(duration) || !Number.isInteger(horizon))
    fail(400, 'Duration and horizon must be whole days');
  const switchDay =
    input.switchDay === null ? null : number(input.switchDay, 'Switch day', 0, 90, 3);
  if (switchDay !== null && !Number.isInteger(switchDay))
    fail(400, 'Switch day must be a whole day');
  const replacementVolume = number(input.replacementVolume, 'Replacement volume', 0, 1000000, 100);
  const materialId = input.materialId ?? 'resin';
  const nodeId = input.nodeId ?? 'resin-plant';
  const includeInferred = input.includeInferred ?? true;
  if (typeof includeInferred !== 'boolean') fail(400, 'includeInferred must be boolean');
  const item = network.inventory.find((i) => i.materialId === materialId);
  if (!item) fail(404, 'Material inventory was not found', 'NOT_FOUND');
  const initial = number(item.onHand, 'Inventory', 0, 1e12, 0);
  const dailyDemand = number(item.dailyBurn, 'Daily burn', 0.000001, 1e9, 100);
  const eligible = network.links.filter(
    (l) =>
      l.materialId === materialId &&
      l.reviewStatus !== 'rejected' &&
      (!l.inferred || l.reviewStatus === 'confirmed' || includeInferred),
  );
  const nodes = new Set(network.nodes.map((n) => n.id ?? n.ID));
  if (!nodes.has(nodeId)) fail(404, 'Shocked node was not found', 'NOT_FOUND');
  nodes.add('buyer');
  const incoming = new Map();
  const outgoing = new Map();
  const indegree = new Map([...nodes].map((id) => [id, 0]));
  for (const l of eligible) {
    const source = l.source ?? l.sourceId;
    const target = l.target ?? l.targetId;
    const share = number(l.dependencyShare, 'Dependency share', 0, 1, undefined);
    if (!nodes.has(source) || !nodes.has(target)) continue;
    if (!incoming.has(target)) incoming.set(target, []);
    incoming.get(target).push({ source, share });
    if (!outgoing.has(source)) outgoing.set(source, []);
    outgoing.get(source).push(target);
    indegree.set(target, indegree.get(target) + 1);
  }
  const queue = [...nodes].filter((id) => indegree.get(id) === 0);
  const topology = [];
  while (queue.length) {
    const id = queue.shift();
    topology.push(id);
    for (const next of outgoing.get(id) ?? []) {
      indegree.set(next, indegree.get(next) - 1);
      if (!indegree.get(next)) queue.push(next);
    }
  }
  if (topology.length !== nodes.size)
    fail(
      400,
      'The material dependency graph contains a cycle; resolve it before simulation',
      'CYCLIC_GRAPH',
    );
  const loss = new Map();
  for (const id of topology)
    loss.set(
      id,
      id === nodeId
        ? severity
        : Math.min(
            1,
            (incoming.get(id) ?? []).reduce(
              (sum, e) => sum + (loss.get(e.source) ?? 0) * e.share,
              0,
            ),
          ),
    );
  const buyerLoss = loss.get('buyer') ?? 0;
  const baselineSeries = [{ day: 0, stock: initial }];
  const mitigatedSeries = [{ day: 0, stock: initial }];
  const dailyBaseline = new Map();
  let baseline = initial;
  let mitigated = initial;
  let daysToStockout = initial === 0 ? 0 : null;
  let mitigatedDaysToStockout = initial === 0 ? 0 : null;
  for (let day = 1; day <= horizon; day += 1) {
    const lost = day <= duration ? buyerLoss : 0;
    const inbound = dailyDemand * (1 - lost);
    const replacement =
      switchDay !== null && day > switchDay && day <= duration
        ? Math.min(replacementVolume, dailyDemand * lost)
        : 0;
    const available = baseline + inbound;
    dailyBaseline.set(day, available);
    baseline = Math.max(0, baseline + inbound - dailyDemand);
    mitigated = Math.max(0, mitigated + inbound + replacement - dailyDemand);
    baselineSeries.push({ day, stock: +baseline.toFixed(6) });
    mitigatedSeries.push({ day, stock: +mitigated.toFixed(6) });
    if (baseline <= 1e-6 && daysToStockout === null) daysToStockout = day;
    if (mitigated <= 1e-6 && mitigatedDaysToStockout === null) mitigatedDaysToStockout = day;
  }
  const ordersAtRisk = network.orders
    .filter(
      (o) =>
        o.materialId === materialId &&
        o.dueDay >= 0 &&
        o.dueDay <= horizon &&
        (dailyBaseline.get(o.dueDay) ?? initial) < o.quantity,
    )
    .map((o) => ({
      id: o.id ?? o.ID,
      customerRef: o.customerRef,
      dueDay: o.dueDay,
      quantity: o.quantity,
      value: Number(o.value),
      currency: o.currency,
    }));
  const warnings = [
    'Illustrative deterministic model; stock-out is the end-of-day exhaustion boundary.',
    'Replacement assumes qualified, available capacity and is limited to the displayed horizon.',
  ];
  if (eligible.some((l) => l.inferred && l.reviewStatus === 'proposed'))
    warnings.push('Unconfirmed inferred links are included in this hypothesis-based scenario.');
  if (!buyerLoss)
    warnings.push(
      'No active material path from the shocked node to the buyer; no supply loss propagated.',
    );
  return {
    illustrative: true,
    assumptions: {
      shockType: shockType === 'port closure' ? 'portClosure' : shockType,
      nodeId,
      materialId,
      duration,
      severity,
      switchDay,
      horizon,
      dailyDemand,
      replacementVolume,
      includeInferred,
      initialInventory: initial,
      propagatedLoss: buyerLoss,
      restartLeadTime: 0,
    },
    daysToStockout,
    mitigatedDaysToStockout,
    timeToSurvive: daysToStockout,
    timeToRecover: duration,
    baselineSeries,
    mitigatedSeries,
    ordersAtRisk,
    revenueAtRisk: ordersAtRisk.reduce((sum, o) => sum + o.value, 0),
    currency: 'INR',
    downstreamCapacity: [...loss]
      .filter(([, value]) => value > 0)
      .map(([id, value]) => ({ nodeId: id, loss: value, remainingCapacity: 1 - value })),
    warnings,
  };
}
module.exports = { simulateNetwork };
