const test = require('node:test');
const assert = require('node:assert/strict');
const seed = require('../db/demo-data.json');
const { rankListings, publicListing, haversine } = require('../srv/lib/matching');

const buyer = seed.Companies[0];
const request = {
  capacityType: 'moulding',
  radiusKm: 150,
  volume: 100,
  startDate: '2026-10-26',
  endDate: '2026-11-22',
};
const listings = () => structuredClone(seed.CapacityListings);

test('the default request finds three nearby moulding options, deterministically ranked', () => {
  const results = rankListings(listings(), request, buyer);
  assert.equal(results.length, 3);
  assert.ok(results.every((match) => match.eligible));
  assert.ok(results.every((match) => match.distanceKm <= 150));
  assert.ok(results.every((match) => match.capacityType === 'moulding'));
  assert.deepEqual(results, rankListings(listings(), request, buyer));
  for (let i = 1; i < results.length; i += 1) {
    assert.ok(results[i - 1].score >= results[i].score);
  }
});

test('insufficient volume, incompatible capability and unavailable dates do not masquerade as matches', () => {
  assert.equal(rankListings(listings(), { ...request, volume: 1000 }, buyer).length, 0);
  assert.equal(rankListings(listings(), { ...request, capacityType: 'supplier' }, buyer).length, 0);
  assert.equal(
    rankListings(
      listings(),
      {
        ...request,
        startDate: '2027-01-01',
        endDate: '2027-02-01',
      },
      buyer,
    ).length,
    0,
  );
});

test('very small search radius returns an honest empty response', () => {
  assert.equal(rankListings(listings(), { ...request, radiusKm: 1 }, buyer).length, 0);
});

test('public listings cannot leak price, volume, ownership or commercial constraints', () => {
  const envelope = publicListing(listings()[0]);
  const serialized = JSON.stringify(envelope);
  for (const key of [
    'tenantId',
    'providerName',
    'volumeDaily',
    'leadTimeDays',
    'capabilityFit',
    'exactUnitPrice',
    'qualification',
  ]) {
    assert.equal(Object.hasOwn(envelope, key), false, key);
  }
  assert.ok(envelope.id || envelope.ID);
  assert.equal(envelope.capacityType, 'moulding');
  assert.ok(envelope.location);
  assert.ok(envelope.startDate);
  assert.ok(envelope.endDate);
  assert.ok(envelope.priceBand);
  assert.equal(serialized.includes('900'), false);
});

test('distance calculation has zero identity and a plausible Bengaluru-Hosur distance', () => {
  assert.equal(haversine(12.9716, 77.5946, 12.9716, 77.5946), 0);
  const distance = haversine(12.9716, 77.5946, 12.7409, 77.8253);
  assert.ok(distance > 30 && distance < 45);
});

test('matching rejects invalid demand and date bounds', () => {
  for (const change of [
    { volume: -1 },
    { volume: 0 },
    { radiusKm: -1 },
    { startDate: 'not-a-date' },
    { startDate: '2026-12-01', endDate: '2026-11-01' },
  ]) {
    assert.throws(() => rankListings(listings(), { ...request, ...change }, buyer));
  }
});

test('impossible ISO-shaped dates produce a validation error rather than an internal RangeError', () => {
  assert.throws(
    () =>
      rankListings(
        listings(),
        {
          ...request,
          startDate: '2026-99-99',
        },
        buyer,
      ),
    (error) => error.status === 400,
  );
});
