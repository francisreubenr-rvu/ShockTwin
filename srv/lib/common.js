'use strict';
const cds = require('@sap/cds');
const { randomUUID } = require('node:crypto');
function production() {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.CDS_ENV === 'production' ||
    cds.env.profiles?.includes('production')
  );
}
function fail(status, message, code = 'VALIDATION_ERROR') {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  throw e;
}
function context(req) {
  const tenantId = req.tenant || req.user?.attr?.tenantId || (!production() ? 'demo' : null);
  if (!tenantId) fail(401, 'Authenticated tenant context is required', 'UNAUTHENTICATED');
  return {
    tenantId,
    actor: req.user?.id || 'Priya',
    correlationId: req.headers?.['x-correlation-id'] || req.id || randomUUID(),
  };
}
function allow(req, ...roles) {
  if (!roles.some((role) => req.user?.is(role)))
    fail(403, `Required role: ${roles.join(' or ')}`, 'FORBIDDEN');
}
function payload(req) {
  let value = req.data || {};
  if (typeof req.data?.payload === 'string') {
    try {
      value = JSON.parse(req.data.payload);
    } catch {
      fail(400, 'Request payload must be valid JSON');
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail(400, 'Request payload must be a JSON object');
  return value;
}
function normalize(row) {
  if (!row) return row;
  const r = { ...row, id: row.ID };
  delete r.ID;
  delete r.tenantId;
  return r;
}
function parse(value, fallback = null) {
  if (value == null) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}
function graphLink(row) {
  const r = normalize(row);
  r.source = row.sourceId;
  r.target = row.targetId;
  r.evidence = parse(row.evidence, []);
  delete r.sourceId;
  delete r.targetId;
  return r;
}
function number(value, name, min, max, fallback) {
  const n = value === undefined ? fallback : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max)
    fail(400, `${name} must be between ${min} and ${max}`);
  return n;
}
function text(value, name, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    fail(400, `${name} is required and must be at most ${max} characters`);
  return value.trim();
}
async function audit(db, ctx, action, entityType, entityId, before, after) {
  const row = {
    tenantId: ctx.tenantId,
    ID: randomUUID(),
    illustrative: !production(),
    actor: ctx.actor,
    action,
    entityType,
    entityId,
    before: JSON.stringify(before ?? null),
    after: JSON.stringify(after ?? null),
    timestamp: new Date().toISOString(),
    correlationId: ctx.correlationId,
  };
  await db.run(cds.ql.INSERT.into('shocktwin.AuditEvents').entries(row));
  return normalize(row);
}
function auditView(row) {
  const r = normalize(row);
  r.before = parse(row.before);
  r.after = parse(row.after);
  return r;
}
function scenarioView(row) {
  return { ...parse(row.result, {}), id: row.ID, createdAt: row.createdAt };
}
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(12000),
    headers: { 'content-type': 'application/json', ...options.headers },
  });
  if (!res.ok) fail(502, `Dependency returned HTTP ${res.status}`, 'DEPENDENCY_ERROR');
  return res.json();
}
module.exports = {
  cds,
  production,
  fail,
  context,
  allow,
  payload,
  normalize,
  parse,
  graphLink,
  number,
  text,
  audit,
  auditView,
  scenarioView,
  fetchJSON,
  randomUUID,
};
