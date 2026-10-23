'use strict';
const {
  cds,
  context,
  allow,
  payload,
  fail,
  text,
  normalize,
  parse,
  audit,
  auditView,
  randomUUID,
} = require('./lib/common');
const repo = require('./lib/repository');
function adapter() {
  return require('../integrations/s4hana-adapter');
}
function workflow() {
  return require('../workflow/local');
}
module.exports = cds.service.impl(function () {
  this.on('listDrafts', async (req) => {
    allow(req, 'Buyer', 'Planner', 'Admin');
    const ctx = context(req);
    const rows = await repo.rows(cds.tx(req), 'DraftPOs', ctx.tenantId);
    return JSON.stringify({
      draftPOs: rows.map(normalize).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  });
  this.on('auditEvents', async (req) => {
    allow(req, 'Buyer', 'Planner', 'Admin', 'CapacityProvider');
    const ctx = context(req);
    const rows = await repo.rows(cds.tx(req), 'AuditEvents', ctx.tenantId);
    return JSON.stringify({
      events: rows.map(auditView).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    });
  });
  this.on('createDraft', async (req) => {
    allow(req, 'Buyer');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    const key = text(input.idempotencyKey, 'Idempotency key', 120);
    const existing = await db.run(
      cds.ql.SELECT.one
        .from(repo.entity('DraftPOs'))
        .where({ tenantId: ctx.tenantId, idempotencyKey: key }),
    );
    if (existing) {
      if (
        existing.matchId !== input.matchId ||
        (existing.scenarioId || null) !== (input.scenarioId || null)
      )
        fail(409, 'Idempotency key is already used for another response', 'IDEMPOTENCY_CONFLICT');
      return JSON.stringify({ ...normalize(existing), idempotent: true });
    }
    const match = await repo.one(db, 'Matches', ctx.tenantId, input.matchId);
    if (!match || !match.eligible) fail(404, 'Eligible capacity match was not found', 'NOT_FOUND');
    const scenarioId = input.scenarioId || match.scenarioId;
    if (scenarioId && !(await repo.one(db, 'Scenarios', ctx.tenantId, scenarioId)))
      fail(404, 'Scenario was not found', 'NOT_FOUND');
    if (match.scenarioId && scenarioId !== match.scenarioId)
      fail(400, 'Match and scenario references do not agree');
    const listing = await repo.one(db, 'CapacityListings', match.providerTenantId, match.listingId);
    if (!listing || !listing.active)
      fail(409, 'Capacity listing is no longer available', 'CAPACITY_UNAVAILABLE');
    const request = parse(match.request, {});
    const row = {
      tenantId: ctx.tenantId,
      ID: randomUUID(),
      illustrative: true,
      matchId: match.ID,
      scenarioId: scenarioId || null,
      idempotencyKey: key,
      supplierRef: listing.ID,
      quantity: request.volume || 100,
      currency: 'INR',
      priceBand: listing.priceBand,
      status: 'pending',
      externalId: null,
      mode: 'mock',
      createdBy: ctx.actor,
      createdAt: new Date().toISOString(),
      correlationId: ctx.correlationId,
    };
    try {
      const remote = await adapter().createDraft({
        ...normalize(row),
        tenantId: ctx.tenantId,
        materialId: 'resin',
      });
      row.externalId = remote.externalId || remote.ID || remote.id;
      row.mode = remote.mode || 'mock';
      await workflow().routeDraft({ ...normalize(row), tenantId: ctx.tenantId });
    } catch {
      fail(
        502,
        'Procurement draft could not be routed; no successful draft is reported. Retry using the same idempotency key.',
        'ERP_DRAFT_ERROR',
      );
    }
    await db.run(cds.ql.INSERT.into(repo.entity('DraftPOs')).entries(row));
    const event = await audit(db, ctx, 'PO_DRAFTED', 'DraftPO', row.ID, null, {
      status: row.status,
      mode: row.mode,
      externalId: row.externalId,
    });
    return JSON.stringify({ ...normalize(row), auditEventId: event.id });
  });
  this.on('decide', async (req) => {
    allow(req, 'Buyer');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    if (!['approved', 'rejected'].includes(input.decision))
      fail(400, 'Decision must be approved or rejected');
    const row = await repo.one(db, 'DraftPOs', ctx.tenantId, input.id);
    if (!row) fail(404, 'Draft purchase order was not found', 'NOT_FOUND');
    if (row.integrationError?.startsWith('ERP_AMBIGUOUS_COMMIT:'))
      fail(
        409,
        'ERP outcome is ambiguous; manual reconciliation is required before another decision',
        'RECONCILIATION_REQUIRED',
      );
    if (row.status !== 'pending' && row.status !== 'integrationError')
      fail(409, 'This draft already has a final decision', 'INVALID_TRANSITION');
    if (
      input.reason !== undefined &&
      (typeof input.reason !== 'string' || input.reason.length > 1000)
    )
      fail(400, 'Decision reason must be at most 1000 characters');
    if (
      row.status === 'integrationError' &&
      row.requestedDecision &&
      row.requestedDecision !== input.decision
    )
      fail(409, 'Retry must preserve the original purchasing decision', 'INVALID_TRANSITION');
    const before = row.status;
    const claimed = await db.run(
      cds.ql
        .UPDATE(repo.entity('DraftPOs'))
        .set({ status: 'processing', requestedDecision: input.decision })
        .where({ tenantId: ctx.tenantId, ID: row.ID, status: before }),
    );
    if (!claimed) fail(409, 'Another approver is deciding this draft', 'INVALID_TRANSITION');
    try {
      const draft = { ...normalize(row), status: 'pending', tenantId: ctx.tenantId };
      await workflow().decideDraft(draft, input.decision);
      const remote = await adapter().decideDraft(row.externalId, input.decision, draft);
      row.status = input.decision;
      row.decidedAt = new Date().toISOString();
      row.reason = input.reason || '';
      row.integrationError = '';
      if (remote?.externalId) row.externalId = remote.externalId;
      await db.run(
        cds.ql
          .UPDATE(repo.entity('DraftPOs'))
          .set({
            status: row.status,
            decidedAt: row.decidedAt,
            reason: row.reason,
            integrationError: '',
            externalId: row.externalId,
          })
          .where({ tenantId: ctx.tenantId, ID: row.ID }),
      );
      const event = await audit(
        db,
        ctx,
        input.decision === 'approved' ? 'PO_APPROVED' : 'PO_REJECTED',
        'DraftPO',
        row.ID,
        before,
        { status: row.status, reason: row.reason, externalId: row.externalId },
      );
      return JSON.stringify({ ...normalize(row), draft: normalize(row), auditEventId: event.id });
    } catch (error) {
      row.status = 'integrationError';
      const message =
        error.code === 'ERP_AMBIGUOUS_COMMIT' ||
        String(error.message).startsWith('ERP_AMBIGUOUS_COMMIT:')
          ? 'ERP_AMBIGUOUS_COMMIT: Downstream outcome is unknown; manual reconciliation is required before retry.'
          : 'Downstream decision delivery failed before successful confirmation; inspect and retry the same decision.';
      await db.run(
        cds.ql
          .UPDATE(repo.entity('DraftPOs'))
          .set({ status: row.status, integrationError: message })
          .where({ tenantId: ctx.tenantId, ID: row.ID }),
      );
      await audit(db, ctx, 'PO_INTEGRATION_FAILED', 'DraftPO', row.ID, before, row.status);
      return JSON.stringify({
        ...normalize(row),
        integrationError: message,
        retryable: !message.startsWith('ERP_AMBIGUOUS_COMMIT:'),
        reconciliationRequired: message.startsWith('ERP_AMBIGUOUS_COMMIT:'),
        error: { code: 'ERP_DECISION_ERROR', message },
      });
    }
  });
});
