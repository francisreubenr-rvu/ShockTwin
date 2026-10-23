'use strict';
const { cds, context, allow, payload, fail, graphLink, audit, fetchJSON } = require('./lib/common');
const repo = require('./lib/repository');
const { explain, scoreNews } = require('./lib/explanations');
module.exports = cds.service.impl(function () {
  this.on('getState', async (req) => {
    allow(req, 'Buyer', 'Planner', 'CapacityProvider', 'Admin');
    const ctx = context(req);
    return JSON.stringify(await repo.state(cds.tx(req), ctx, req.user));
  });
  this.on('infer', async (req) => {
    allow(req, 'Planner');
    const ctx = context(req);
    const db = cds.tx(req);
    const net = await repo.network(db, ctx.tenantId);
    if (!net.companies.length) fail(404, 'No company network exists for this tenant', 'NOT_FOUND');
    const candidates = net.plants
      .flatMap((plant) =>
        net.suppliers
          .filter(
            (supplier) =>
              supplier.materialId === plant.materialId &&
              !net.links.some(
                (link) => link.source === plant.ID && link.target === supplier.ID && !link.inferred,
              ),
          )
          .map((supplier) => ({
            source: plant.ID,
            target: supplier.ID,
            materialId: plant.materialId,
          })),
      )
      .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
    let response;
    try {
      response = await fetchJSON(`${process.env.ML_URL || 'http://127.0.0.1:8000'}/predict`, {
        method: 'POST',
        body: JSON.stringify({ nodes: net.nodes, links: net.links, candidates }),
      });
    } catch {
      fail(
        502,
        'Link inference is unavailable; the saved graph has been preserved. Check the ML endpoint and retry.',
        'ML_UNAVAILABLE',
      );
    }
    if (!Array.isArray(response.predictions))
      fail(502, 'The model returned an invalid prediction envelope', 'ML_INVALID_RESPONSE');
    const threshold = response.model?.displayThreshold ?? 0.6;
    const links = [];
    const suppressed = [];
    for (const prediction of response.predictions) {
      const idx = candidates.findIndex(
        (c) => c.source === prediction.source && c.target === prediction.target,
      );
      if (
        idx < 0 ||
        typeof prediction.confidence !== 'number' ||
        !Number.isFinite(prediction.confidence) ||
        prediction.confidence < 0 ||
        prediction.confidence > 1
      )
        fail(502, 'The model returned an invalid candidate or score', 'ML_INVALID_RESPONSE');
      if (prediction.confidence < threshold) {
        suppressed.push({ ...prediction, reason: 'Below configured display threshold' });
        continue;
      }
      const ID = `hidden-${idx + 1}`;
      const existing = await repo.one(db, 'Links', ctx.tenantId, ID);
      const evidence = Array.isArray(prediction.evidence)
        ? prediction.evidence.filter((e) => typeof e === 'string').slice(0, 5)
        : [];
      const fallback =
        prediction.explanation ||
        'Shared material and location features suggest this candidate resin dependency; human confirmation is required.';
      const explanation = await explain(
        'inferred-link',
        { evidence, trainingDomain: 'synthetic', reviewStatus: 'proposed' },
        fallback,
      );
      const row = {
        tenantId: ctx.tenantId,
        ID,
        illustrative: true,
        sourceId: prediction.source,
        targetId: prediction.target,
        materialId: candidates[idx].materialId,
        dependencyShare: 1,
        inferred: true,
        confidence: prediction.confidence,
        evidence: JSON.stringify(evidence),
        explanation: explanation.text,
        reviewStatus: existing?.reviewStatus || 'proposed',
        modelVersion: response.model?.version || 'synthetic-graphsage-v1',
      };
      await db.run(cds.ql.UPSERT.into(repo.entity('Links')).entries(row));
      links.push(graphLink(row));
    }
    const updated = await repo.network(db, ctx.tenantId);
    const signals = await repo.rows(db, 'Shocks', ctx.tenantId);
    const riskExplanation = signals.length ? await scoreNews(signals[0]) : null;
    await audit(db, ctx, 'LINK_INFERENCE_COMPLETED', 'Network', 'buyer', null, {
      surfaced: links.length,
      suppressed: suppressed.length,
      modelVersion: response.model?.version,
    });
    return JSON.stringify({
      illustrative: true,
      nodes: updated.nodes.filter((n) => links.some((link) => link.source === n.id)),
      links,
      suppressed,
      singlePointsOfFailure: repo.concentrations(updated),
      model: response.model || repo.modelMetadata(),
      riskExplanation,
    });
  });
  this.on('decideLink', async (req) => {
    allow(req, 'Planner');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    if (!['confirmed', 'rejected'].includes(input.decision))
      fail(400, 'Link decision must be confirmed or rejected');
    const row = await repo.one(db, 'Links', ctx.tenantId, input.id);
    if (!row || !row.inferred) fail(404, 'Inferred link was not found', 'NOT_FOUND');
    if (row.reviewStatus === input.decision)
      return JSON.stringify({ link: graphLink(row), idempotent: true });
    const before = row.reviewStatus;
    await db.run(
      cds.ql
        .UPDATE(repo.entity('Links'))
        .set({ reviewStatus: input.decision })
        .where({ tenantId: ctx.tenantId, ID: row.ID }),
    );
    row.reviewStatus = input.decision;
    const event = await audit(db, ctx, 'LINK_REVIEWED', 'Link', row.ID, before, input.decision);
    return JSON.stringify({ link: graphLink(row), auditEventId: event.id });
  });
});
