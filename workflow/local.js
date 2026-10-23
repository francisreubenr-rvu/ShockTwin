const crypto = require('node:crypto');
const definition = require('./approval-definition.json');
function production() {
  return process.env.NODE_ENV === 'production' || process.env.CDS_ENV === 'production';
}
function validateDecision(status, decision) {
  if (!definition.decisions.includes(decision)) {
    const error = new Error('Decision must be approved or rejected');
    error.code = 'VALIDATION_ERROR';
    error.status = error.statusCode = 400;
    throw error;
  }
  if (status !== 'pending') {
    const error = new Error('Only a pending purchase draft can be decided');
    error.code = 'INVALID_TRANSITION';
    error.status = error.statusCode = 409;
    throw error;
  }
  return decision;
}
function configError(message) {
  const error = new Error(message);
  error.code = 'WORKFLOW_CONFIGURATION_ERROR';
  error.status = error.statusCode = 502;
  return error;
}
async function post(url, body) {
  if (!url?.startsWith('https://') || !process.env.BPA_API_TOKEN)
    throw configError('Production workflow requires HTTPS and an authorized BPA token');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.BPA_API_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw configError(`Approval workflow rejected operation (HTTP ${response.status})`);
  if (response.status === 204) return {};
  return response.json();
}
async function routeDraft(draft) {
  if (!production())
    return {
      workflowId: `local-${draft.id || draft.ID || crypto.randomUUID()}`,
      provider: 'local',
      status: 'pending',
    };
  if (!process.env.BPA_API_URL || !process.env.BPA_DEFINITION_ID)
    throw configError('Configure BPA_API_URL and BPA_DEFINITION_ID before production drafting');
  const result = await post(`${process.env.BPA_API_URL.replace(/\/$/, '')}/workflow-instances`, {
    definitionId: process.env.BPA_DEFINITION_ID,
    context: {
      draftId: draft.id || draft.ID,
      tenantId: draft.tenantId,
      status: 'pending',
      purchasingAuthority: 'Buyer',
    },
  });
  return { workflowId: result.id, provider: 'sap-bpa', status: 'pending' };
}
async function decideDraft(draft, decision) {
  validateDecision(draft.status, decision);
  if (production()) {
    // A tenant-specific Integration Suite/BPA decision bridge resolves the actual user task.
    // SAP process exports and task identifiers differ by account; no task URL is invented here.
    if (!process.env.BPA_DECISION_URL)
      throw configError(
        'Production approval requires a configured BPA_DECISION_URL bridge and tested Buyer authorization',
      );
    await post(process.env.BPA_DECISION_URL, {
      draftId: draft.id || draft.ID,
      tenantId: draft.tenantId,
      decision,
      idempotencyKey: `${draft.id || draft.ID}:${decision}`,
    });
  }
  return { status: decision, provider: production() ? 'sap-bpa' : 'local' };
}
module.exports = { validateDecision, routeDraft, decideDraft };
