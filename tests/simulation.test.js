const test = require('node:test');
const assert = require('node:assert/strict');
const seed = require('../db/demo-data.json');
const { simulateNetwork } = require('../srv/lib/simulation');

function fixture() {
  const normalize = (record) => ({ ...record, id: record.ID });
  const links = seed.Links.map((link) => ({
    ...normalize(link),
    source: link.sourceId,
    target: link.targetId,
  }));
  for (let i = 1; i <= 3; i += 1) {
    links.push({
      id: `unit-hidden-${i}`,
      source: 'resin-plant',
      target: `s${i}`,
      materialId: 'resin',
      dependencyShare: 1,
      inferred: true,
      reviewStatus: 'confirmed',
      confidence: 0.8,
    });
  }
  return {
    nodes: [...seed.Companies, ...seed.Suppliers, ...seed.Plants].map(normalize),
    links,
    inventory: seed.Inventory.map(normalize),
    orders: seed.Orders.map(normalize),
  };
}

const input = {
  shockType: 'cyclone',
  nodeId: 'resin-plant',
  materialId: 'resin',
  duration: 28,
  severity: 1,
  switchDay: 3,
  replacementVolume: 100,
  includeInferred: true,
  horizon: 30,
};
const stockOn = (series, day) => series.find((point) => point.day === day).stock;

test('full shared-plant loss exhausts baseline on day 18; day-3 full replacement preserves stock through horizon', () => {
  const result = simulateNetwork(fixture(), input);
  assert.equal(result.daysToStockout, 18);
  assert.equal(result.mitigatedDaysToStockout, null);
  assert.equal(stockOn(result.baselineSeries, 0), 1800);
  assert.equal(stockOn(result.baselineSeries, 17), 100);
  assert.equal(stockOn(result.baselineSeries, 18), 0);
  assert.equal(stockOn(result.mitigatedSeries, 3), 1500);
  assert.equal(stockOn(result.mitigatedSeries, 30), 1500);
  assert.equal(result.baselineSeries.length, 31);
  assert.ok(result.baselineSeries.every((point) => point.stock >= 0));
  assert.ok(result.revenueAtRisk >= 0);
});

test('half-severity loss leaves stock above zero through the default 30-day horizon', () => {
  const result = simulateNetwork(fixture(), { ...input, severity: 0.5, replacementVolume: 0 });
  assert.equal(result.daysToStockout, null);
  assert.equal(stockOn(result.baselineSeries, 28), 400);
  assert.equal(stockOn(result.baselineSeries, 30), 400);
});

test('recovery after seven days stops the burn rather than continuing an artificial outage', () => {
  const result = simulateNetwork(fixture(), { ...input, duration: 7, replacementVolume: 0 });
  assert.equal(result.daysToStockout, null);
  assert.equal(stockOn(result.baselineSeries, 7), 1100);
  assert.equal(stockOn(result.baselineSeries, 30), 1100);
});

test('late or insufficient replacement is not presented as a successful rescue', () => {
  const late = simulateNetwork(fixture(), { ...input, switchDay: 20 });
  assert.equal(late.mitigatedDaysToStockout, 18);
  const insufficient = simulateNetwork(fixture(), {
    ...input,
    duration: 30,
    replacementVolume: 20,
  });
  assert.ok(insufficient.mitigatedDaysToStockout > 18);
  assert.ok(insufficient.mitigatedDaysToStockout <= 30);
});

test('zero severity creates no artificial risk or inventory loss', () => {
  const result = simulateNetwork(fixture(), { ...input, severity: 0 });
  assert.equal(result.daysToStockout, null);
  assert.ok(result.baselineSeries.every((point) => point.stock === 1800));
  assert.equal(result.revenueAtRisk, 0);
});

test('rejected inferred relationships never transmit loss; confirmed relationships remain usable when proposed edges are excluded', () => {
  const rejected = fixture();
  rejected.links
    .filter((link) => link.inferred)
    .forEach((link) => {
      link.reviewStatus = 'rejected';
    });
  const rejectedResult = simulateNetwork(rejected, input);
  assert.equal(rejectedResult.daysToStockout, null);
  assert.equal(stockOn(rejectedResult.baselineSeries, 30), 1800);
  const confirmedResult = simulateNetwork(fixture(), { ...input, includeInferred: false });
  assert.equal(confirmedResult.daysToStockout, 18);
});

test('all four shock types use the same bounded physical model', () => {
  for (const shockType of ['cyclone', 'portClosure', 'strike', 'fire']) {
    const result = simulateNetwork(fixture(), { ...input, shockType });
    assert.equal(result.daysToStockout, 18, shockType);
  }
});

test('invalid scenario bounds are rejected instead of generating misleading curves', () => {
  for (const change of [
    { severity: -0.1 },
    { severity: 1.1 },
    { duration: -1 },
    { replacementVolume: -1 },
    { horizon: 100000 },
    { shockType: 'unknown' },
  ]) {
    assert.throws(() => simulateNetwork(fixture(), { ...input, ...change }));
  }
});

test('order exposure counts missed outage deliveries once and excludes covered boundary/recovery orders', () => {
  const network = fixture();
  network.orders.push({
    id: 'unit-boundary-order',
    materialId: 'resin',
    quantity: 100,
    dueDay: 18,
    value: 10000,
    currency: 'INR',
  });
  const result = simulateNetwork(network, input);
  assert.deepEqual(result.ordersAtRisk.map((order) => order.id).sort(), ['order-2', 'order-3']);
  assert.equal(result.revenueAtRisk, 560000);
  assert.equal(result.currency, 'INR');
  assert.equal(
    result.ordersAtRisk.some((order) => order.dueDay === 29),
    false,
  );
  assert.equal(
    result.ordersAtRisk.some((order) => order.dueDay === 18),
    false,
  );
});

test('cyclic material dependencies fail explicitly instead of hanging or silently ignoring loss', () => {
  const network = fixture();
  network.links.push({
    id: 'unit-cycle',
    source: 'buyer',
    target: 'resin-plant',
    materialId: 'resin',
    dependencyShare: 1,
    inferred: false,
    reviewStatus: 'known',
  });
  assert.throws(() => simulateNetwork(network, input), /cycle/i);
});
