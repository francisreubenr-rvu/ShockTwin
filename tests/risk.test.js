const test = require('node:test');
const assert = require('node:assert/strict');
const seed = require('../db/demo-data.json');
const { concentrations } = require('../srv/lib/repository');

function network() {
  return {
    suppliers: structuredClone(seed.Suppliers),
    links: [1, 2, 3].map((index) => ({
      id: `unit-hidden-${index}`,
      source: 'resin-plant',
      target: `s${index}`,
      materialId: 'resin',
      reviewStatus: 'proposed',
    })),
  };
}

test('risk separates three-of-five descriptive exposure from full critical-resin concentration', () => {
  const risks = concentrations(network());
  assert.equal(risks.length, 1);
  assert.equal(risks[0].nodeId, 'resin-plant');
  assert.equal(risks[0].affectedTier1, 3);
  assert.equal(risks[0].totalTier1, 5);
  assert.equal(risks[0].concentration, 1);
  assert.equal(risks[0].risk, 'high');
});

test('rejected or duplicated edges cannot inflate concentration', () => {
  const graph = network();
  graph.links.push(structuredClone(graph.links[0]));
  assert.equal(concentrations(graph)[0].affectedTier1, 3);
  graph.links
    .filter((link) => link.target !== 's1')
    .forEach((link) => {
      link.reviewStatus = 'rejected';
    });
  assert.deepEqual(concentrations(graph), []);
});

test('concentration uses the affected material supplier set rather than a fixed resin denominator', () => {
  const graph = network();
  graph.suppliers[4].materialId = 'steel';
  graph.links = ['s4', 's5'].map((target) => ({
    source: 'steel-plant',
    target,
    materialId: 'steel',
    reviewStatus: 'known',
  }));
  const result = concentrations(graph);
  assert.equal(result.length, 1);
  assert.equal(result[0].affectedTier1, 2);
  assert.equal(result[0].concentration, 1);
});
