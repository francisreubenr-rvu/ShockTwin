'use strict';
const { cds, context, allow, payload, audit, randomUUID } = require('./lib/common');
const repo = require('./lib/repository');
const { simulateNetwork } = require('./lib/simulation');
module.exports = cds.service.impl(function () {
  this.on('simulate', async (req) => {
    allow(req, 'Planner');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    const net = await repo.network(db, ctx.tenantId);
    const result = simulateNetwork(net, input);
    result.id = randomUUID();
    result.createdAt = new Date().toISOString();
    await db.run(
      cds.ql.INSERT.into(repo.entity('Scenarios')).entries({
        tenantId: ctx.tenantId,
        ID: result.id,
        illustrative: true,
        shockType: result.assumptions.shockType,
        nodeId: result.assumptions.nodeId,
        materialId: result.assumptions.materialId,
        input: JSON.stringify(input),
        result: JSON.stringify(result),
        createdAt: result.createdAt,
      }),
    );
    await audit(db, ctx, 'SCENARIO_SIMULATED', 'Scenario', result.id, null, {
      daysToStockout: result.daysToStockout,
      mitigatedDaysToStockout: result.mitigatedDaysToStockout,
    });
    return JSON.stringify(result);
  });
});
