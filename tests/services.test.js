const test = require('node:test');
const assert = require('node:assert/strict');
const cds = require('@sap/cds');
const express = require('express');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let temporaryDirectory;
const repo = require('../srv/lib/repository');

let erp;
let failDecision = false;
let remoteDrafts = 0;
const remote = new Map();
const identity = (roles = ['Buyer', 'Planner'], tenant = 'demo', actor = 'Priya') => ({
  tenant,
  user: new cds.User({ id: actor, roles, attr: { tenantId: tenant } }),
});
async function action(service, event, input, who = identity()) {
  return cds.services[service].tx(who, async (tx) => {
    const result = await tx.send(
      event,
      input === undefined ? {} : { payload: JSON.stringify(input) },
    );
    return typeof result === 'string' ? JSON.parse(result) : result;
  });
}
function status(expected) {
  return (error) => Number(error.status || error.statusCode || error.code) === expected;
}
async function scenarioAndMatch() {
  const scenario = await action('SimulationService', 'simulate', {});
  const result = await action('MeshService', 'findMatches', {
    capacityType: 'moulding',
    radiusKm: 150,
    volume: 100,
    startDate: '2026-10-26',
    endDate: '2026-11-22',
    scenarioId: scenario.id,
  });
  return { scenario, match: result.matches[0] };
}
async function draft(key = 'unit-response-1') {
  const { scenario, match } = await scenarioAndMatch();
  const input = { scenarioId: scenario.id, matchId: match.id, idempotencyKey: key };
  return { input, record: await action('POService', 'createDraft', input) };
}

test.before(async () => {
  process.env.ML_URL = 'http://127.0.0.1:1';
  process.env.LLM_API_KEY = '';
  const model = await cds.load(['db', 'srv']);
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'shocktwin-test-'));
  await cds.deploy(model).to({
    kind: 'sqlite',
    impl: path.resolve(__dirname, '../srv/lib/tenant-sqlite.js'),
    credentials: { url: path.join(temporaryDirectory, 'test.sqlite') },
  });
  await cds.serve('all').from(model).in(express());
  const mock = express();
  mock.use(express.json());
  mock.get('/', (_req, res) => {
    res.set('x-csrf-token', 'unit-csrf').json({ service: 'isolated test ERP' });
  });
  mock.post('/PurchaseOrder', (req, res) => {
    assert.equal(req.get('x-csrf-token'), 'unit-csrf');
    assert.ok(req.get('x-shocktwin-tenant'));
    const externalId = `UNIT-PO-${++remoteDrafts}`;
    remote.set(externalId, { status: 'pending', quantity: req.body.quantity });
    res.json({ d: { PurchaseOrder: externalId, Status: 'pending' } });
  });
  mock.post('/PurchaseOrder/:id/decision', (req, res) => {
    if (failDecision) return res.status(503).json({ error: 'Intentional dependency failure' });
    const record = remote.get(req.params.id);
    if (!record) return res.status(404).json({ error: 'Missing test ERP record' });
    record.status = req.body.decision;
    res.json({ d: { PurchaseOrder: req.params.id, Status: record.status } });
  });
  erp = await new Promise((resolve) => {
    const server = mock.listen(0, '127.0.0.1', () => resolve(server));
  });
  process.env.S4_URL = `http://127.0.0.1:${erp.address().port}`;
});
test.beforeEach(async () => {
  failDecision = false;
  remoteDrafts = 0;
  remote.clear();
  await repo.resetData(cds.db);
});
test.after(async () => {
  if (erp) await new Promise((resolve) => erp.close(resolve));
  if (cds.db) await cds.db.disconnect();
  if (temporaryDirectory) fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('RiskService keeps hidden state private before inference and preserves the graph when ML is unavailable', async () => {
  const before = await action('RiskService', 'getState');
  assert.equal(
    before.nodes.some((node) => node.id === 'resin-plant'),
    false,
  );
  assert.equal(before.nodes.filter((node) => node.tier === 1).length, 5);
  await assert.rejects(action('RiskService', 'infer', {}), status(502));
  const after = await action('RiskService', 'getState');
  assert.deepEqual(after.links, before.links);
  assert.deepEqual(after.nodes, before.nodes);
});

test('RiskService review is role-protected, tenant-isolated and audited', async () => {
  await cds.db.run(
    cds.ql.INSERT.into('shocktwin.Links').entries({
      tenantId: 'demo',
      ID: 'unit-proposed',
      illustrative: true,
      sourceId: 'resin-plant',
      targetId: 's1',
      materialId: 'resin',
      dependencyShare: 1,
      inferred: true,
      confidence: 0.8,
      evidence: '["Unit-test fixture, not model output"]',
      reviewStatus: 'proposed',
    }),
  );
  await assert.rejects(
    action(
      'RiskService',
      'decideLink',
      {
        id: 'unit-proposed',
        decision: 'confirmed',
      },
      identity(['Buyer']),
    ),
    status(403),
  );
  await assert.rejects(
    action(
      'RiskService',
      'decideLink',
      {
        id: 'unit-proposed',
        decision: 'confirmed',
      },
      identity(['Planner'], 'other-tenant'),
    ),
    status(404),
  );
  const accepted = await action('RiskService', 'decideLink', {
    id: 'unit-proposed',
    decision: 'confirmed',
  });
  assert.equal(accepted.link.reviewStatus, 'confirmed');
  const events = await action('POService', 'auditEvents');
  assert.ok(
    events.events.some(
      (event) =>
        event.entityId === 'unit-proposed' &&
        event.actor === 'Priya' &&
        event.action === 'LINK_REVIEWED',
    ),
  );
});

test('SimulationService rejects unauthorized execution and cannot read another tenant graph', async () => {
  await assert.rejects(
    action('SimulationService', 'simulate', {}, identity(['CapacityProvider'])),
    status(403),
  );
  await assert.rejects(
    action('SimulationService', 'simulate', {}, identity(['Planner'], 'other-tenant')),
    status(404),
  );
  const scenario = await action('SimulationService', 'simulate', { severity: 0 });
  assert.equal(scenario.daysToStockout, null);
  const other = await action(
    'RiskService',
    'getState',
    undefined,
    identity(['Planner'], 'other-tenant'),
  );
  assert.deepEqual(other.scenarios, []);
  assert.deepEqual(other.orders, []);
});

test('MeshService publishes only allowlisted envelopes and denies unauthorized or owner-spoofing writes', async () => {
  const publicData = await action('MeshService', 'listListings');
  assert.equal(publicData.listings.length, 6);
  assert.ok(
    publicData.listings.every(
      (listing) =>
        !Object.hasOwn(listing, 'volumeDaily') &&
        !Object.hasOwn(listing, 'tenantId') &&
        !Object.hasOwn(listing, 'exactUnitPrice'),
    ),
  );
  const input = {
    capacityType: 'moulding',
    location: { name: 'Illustrative test location', latitude: 13, longitude: 77.6 },
    startDate: '2026-10-26',
    endDate: '2026-11-22',
    priceBand: 'medium',
  };
  await assert.rejects(
    action('MeshService', 'publishListing', input, identity(['Buyer'])),
    status(403),
  );
  await assert.rejects(
    action(
      'MeshService',
      'publishListing',
      {
        ...input,
        tenantId: 'spoofed-provider',
        volumeDaily: 999,
      },
      identity(['CapacityProvider'], 'provider-new'),
    ),
    status(400),
  );
  const result = await action(
    'MeshService',
    'publishListing',
    input,
    identity(['CapacityProvider'], 'provider-new', 'Provider User'),
  );
  assert.equal(result.listing.capacityType, 'moulding');
  assert.equal(Object.hasOwn(result.listing, 'volumeDaily'), false);
  const stored = await repo.one(cds.db, 'CapacityListings', 'provider-new', result.listing.id);
  assert.equal(stored.tenantId, 'provider-new');
  assert.equal(
    stored.volumeDaily,
    0,
    'Public publication alone must not invent private available capacity',
  );
});

test('MeshService rejects foreign scenario references and returns bounded score breakdowns', async () => {
  const result = await action('MeshService', 'findMatches', {});
  assert.equal(result.matches.length, 3);
  for (const match of result.matches) {
    assert.ok(match.score >= 0 && match.score <= 1);
    assert.deepEqual(Object.keys(match.breakdown).sort(), [
      'capability',
      'distance',
      'leadTime',
      'priceBand',
      'volume',
    ]);
  }
  const foreign = await action('SimulationService', 'simulate', {});
  await assert.rejects(
    action(
      'MeshService',
      'findMatches',
      { scenarioId: foreign.id },
      identity(['Planner'], 'other-tenant'),
    ),
    status(404),
  );
});

test('POService creates one remote/local draft for an idempotency key and rejects mismatched key reuse', async () => {
  const { input, record } = await draft();
  assert.equal(record.status, 'pending');
  assert.equal(record.mode, 'mock');
  const replay = await action('POService', 'createDraft', input);
  assert.equal(replay.id, record.id);
  assert.equal(remoteDrafts, 1);
  await assert.rejects(
    action('POService', 'createDraft', {
      ...input,
      matchId: 'different-match',
    }),
    status(409),
  );
});

test('POService human approval is role-protected, tenant-isolated, final once and audited', async () => {
  const { record } = await draft();
  const input = { id: record.id, decision: 'approved' };
  await assert.rejects(action('POService', 'decide', input, identity(['Planner'])), status(403));
  await assert.rejects(
    action('POService', 'decide', input, identity(['Buyer'], 'other-tenant')),
    status(404),
  );
  const approved = await action('POService', 'decide', input);
  assert.equal(approved.status, 'approved');
  assert.equal(remote.get(record.externalId).status, 'approved');
  await assert.rejects(action('POService', 'decide', input), status(409));
  const audit = await action('POService', 'auditEvents');
  const approvals = audit.events.filter(
    (event) => event.entityId === record.id && event.action === 'PO_APPROVED',
  );
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0].actor, 'Priya');
  assert.ok(approvals[0].timestamp);
  const hidden = await action(
    'POService',
    'listDrafts',
    undefined,
    identity(['Buyer'], 'other-tenant'),
  );
  assert.deepEqual(hidden.draftPOs, []);
});

test('POService rejection retains its reason and never becomes an approved purchase', async () => {
  const { record } = await draft();
  const rejected = await action('POService', 'decide', {
    id: record.id,
    decision: 'rejected',
    reason: 'Tooling qualification pending',
  });
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.reason, 'Tooling qualification pending');
  assert.equal(remote.get(record.externalId).status, 'rejected');
});

test('POService persists explicit integration failure and permits a controlled retry without inventing approval', async () => {
  const { record } = await draft();
  failDecision = true;
  const failed = await action('POService', 'decide', { id: record.id, decision: 'approved' });
  assert.equal(failed.status, 'integrationError');
  assert.equal(failed.retryable, true);
  assert.equal(remote.get(record.externalId).status, 'pending');
  const inbox = await action('POService', 'listDrafts');
  assert.equal(inbox.draftPOs.find((item) => item.id === record.id).status, 'integrationError');
  await assert.rejects(
    action('POService', 'decide', { id: record.id, decision: 'rejected' }),
    status(409),
  );
  failDecision = false;
  const retried = await action('POService', 'decide', { id: record.id, decision: 'approved' });
  assert.equal(retried.status, 'approved');
});

test('CAP actions reject JSON null and arrays with a validation error', async () => {
  for (const value of [null, [], ['cyclone']]) {
    await assert.rejects(action('SimulationService', 'simulate', value), status(400));
    await assert.rejects(action('MeshService', 'findMatches', value), status(400));
  }
});

test('an ambiguous downstream commitment blocks both retry and an opposite decision until reconciliation', async () => {
  const { record } = await draft();
  await cds.db.run(
    cds.ql
      .UPDATE('shocktwin.DraftPOs')
      .set({
        status: 'integrationError',
        requestedDecision: 'approved',
        integrationError: 'ERP_AMBIGUOUS_COMMIT: Unit-test ambiguity fixture',
      })
      .where({ tenantId: 'demo', ID: record.id }),
  );
  for (const decision of ['approved', 'rejected']) {
    await assert.rejects(action('POService', 'decide', { id: record.id, decision }), status(409));
  }
  assert.equal(remote.get(record.externalId).status, 'pending');
});
