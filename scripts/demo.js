require('dotenv').config();
const base = process.env.DEMO_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4004}`;
async function request(path, payload) {
  const headers = { 'content-type': 'application/json' };
  if (payload !== undefined) headers['x-csrf-token'] = 'Fetch';
  const response = await fetch(base + path, {
    method: payload === undefined ? 'GET' : 'POST',
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${path}: ${result.error?.message || response.status}`);
  return result;
}
async function main() {
  console.log('Resetting only the local Illustrative tenant. Keep npm run dev running.');
  await request('/api/demo/reset', {});
  let state = await request('/api/state');
  console.log(
    `1. Known network: ${state.nodes.filter((node) => node.tier === 1).length} tier-1 suppliers (Illustrative).`,
  );
  const inferred = await request('/api/risk/infer', {});
  const links = inferred.links.filter(
    (link) => link.source === 'resin-plant' || link.sourceId === 'resin-plant',
  );
  if (links.length !== 3)
    throw new Error(`Expected three actual model candidates; received ${links.length}.`);
  for (const link of links)
    await request(`/api/risk/links/${link.id || link.ID}/decision`, { decision: 'confirmed' });
  console.log(`2. Detect: reviewed ${links.length} hidden resin links.`);
  const scenario = await request('/api/simulations', {
    shockType: 'cyclone',
    duration: 28,
    severity: 1,
    switchDay: 3,
    includeInferred: true,
  });
  console.log(
    `3. Simulate: baseline stock-out day ${scenario.daysToStockout}; mitigated ${scenario.mitigatedDaysToStockout === null ? 'no stock-out in horizon' : scenario.mitigatedDaysToStockout} (Illustrative).`,
  );
  const result = await request('/api/mesh/matches', {
    capacityType: 'moulding',
    radiusKm: 150,
    volume: 100,
    startDate: '2026-10-26',
    endDate: '2026-11-22',
    scenarioId: scenario.id,
  });
  if (!result.matches.length) throw new Error('No eligible capacity match for demo request.');
  const match = result.matches[0];
  const draft = await request('/api/pos', {
    matchId: match.id,
    scenarioId: scenario.id,
    idempotencyKey: 'priya-demo-response-1',
  });
  console.log(
    `4. Respond: top match ${match.listingId}, draft ${draft.id} pending human approval.`,
  );
  const approved = await request(`/api/pos/${draft.id}/decision`, { decision: 'approved' });
  state = await request('/api/state');
  console.log(
    `5. Approve: ${approved.status || approved.draftPO?.status || 'approved'}; ${(state.audit || []).length} audited events. Local mock only.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  console.error('Start the app first: NO_OPEN=1 npm run dev');
  process.exitCode = 1;
});
