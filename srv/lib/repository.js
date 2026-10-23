'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {
  cds,
  normalize,
  graphLink,
  parse,
  scenarioView,
  auditView,
  production,
} = require('./common');
const { SELECT, DELETE, INSERT } = cds.ql;
const entity = (name) => `shocktwin.${name}`;
async function rows(db, name, tenantId) {
  return db.run(SELECT.from(entity(name)).where({ tenantId }));
}
async function one(db, name, tenantId, ID) {
  if (typeof ID !== 'string' || !ID) return undefined;
  return db.run(SELECT.one.from(entity(name)).where({ tenantId, ID }));
}
async function network(db, tenantId) {
  const [companies, suppliers, plants, links, inventory, orders] = await Promise.all(
    ['Companies', 'Suppliers', 'Plants', 'Links', 'Inventory', 'Orders'].map((name) =>
      rows(db, name, tenantId),
    ),
  );
  return {
    companies,
    suppliers,
    plants,
    nodes: [
      ...companies.map((r) => ({ ...normalize(r), type: 'company', tier: 0 })),
      ...suppliers.map((r) => ({ ...normalize(r), type: 'supplier' })),
      ...plants.map((r) => ({ ...normalize(r), type: 'plant', tier: 2 })),
    ],
    links: links.map(graphLink),
    inventory: inventory.map(normalize),
    orders: orders.map(normalize),
  };
}
function concentrations(net) {
  const tier1 = new Set(net.suppliers.map((s) => s.ID));
  const groups = new Map();
  for (const link of net.links.filter((l) => l.reviewStatus !== 'rejected'))
    if (tier1.has(link.target) && !tier1.has(link.source)) {
      const key = `${link.source}:${link.materialId}`;
      if (!groups.has(key))
        groups.set(key, { nodeId: link.source, materialId: link.materialId, targets: new Set() });
      groups.get(key).targets.add(link.target);
    }
  return [...groups.values()]
    .filter((group) => group.targets.size > 1)
    .map(({ nodeId, materialId, targets }) => {
      const relevant = net.suppliers.filter((s) => s.materialId === materialId).length;
      return {
        nodeId,
        materialId,
        affectedTier1: targets.size,
        totalTier1: tier1.size,
        materialTier1: relevant,
        concentration: targets.size / Math.max(1, relevant),
        risk: targets.size >= 3 ? 'high' : 'medium',
        illustrative: true,
      };
    });
}
function modelMetadata() {
  try {
    const m = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../ml/model/metrics.json'), 'utf8'),
    );
    return {
      version: m.modelVersion || m.version || 'synthetic-graphsage-v1',
      trainingDomain: 'synthetic',
      metrics: m,
      displayThreshold: 0.6,
      reviewThreshold: 0.8,
    };
  } catch {
    return {
      version: 'synthetic-graphsage-v1',
      trainingDomain: 'synthetic',
      metricsSource: 'ml/model/metrics.json',
      displayThreshold: 0.6,
      reviewThreshold: 0.8,
    };
  }
}
async function state(db, ctx, user) {
  const net = await network(db, ctx.tenantId);
  const [shocks, scenarios, drafts, events, materials] = await Promise.all(
    ['Shocks', 'Scenarios', 'DraftPOs', 'AuditEvents', 'Materials'].map((name) =>
      rows(db, name, ctx.tenantId),
    ),
  );
  const inferredPlants = new Set(net.links.filter((l) => l.inferred).map((l) => l.source));
  const nodes = net.nodes.filter((n) => !n.hidden || inferredPlants.has(n.id));
  const model = modelMetadata();
  const roles = ['Buyer', 'Planner', 'CapacityProvider', 'Admin'].filter((role) => user?.is(role));
  return {
    meta: {
      illustrative: true,
      mode: production() ? 'production' : 'local',
      tenantId: ctx.tenantId,
      user: { id: ctx.actor, name: ctx.actor, roles, tenantId: ctx.tenantId },
      model,
    },
    company: normalize(net.companies[0]) ?? null,
    nodes,
    links: net.links,
    singlePointsOfFailure: concentrations(net),
    signals: shocks.map(normalize),
    inventory: net.inventory,
    materials: materials.map(normalize),
    orders: net.orders,
    scenarios: scenarios.map(scenarioView).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    draftPOs: drafts.map(normalize).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    audit: events.map(auditView).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    model,
  };
}
async function resetData(db) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../db/demo-data.json'), 'utf8'));
  for (const name of [...Object.keys(data)].reverse()) await db.run(DELETE.from(entity(name)));
  for (const [name, values] of Object.entries(data))
    if (values.length) await db.run(INSERT.into(entity(name)).entries(values));
  return { illustrative: true, reset: true };
}
module.exports = {
  rows,
  one,
  network,
  concentrations,
  state,
  entity,
  modelMetadata,
  resetData,
  parse,
};
