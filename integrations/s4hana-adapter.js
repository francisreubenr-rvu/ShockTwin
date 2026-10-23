const production = () =>
  process.env.CDS_ENV === 'production' || process.env.NODE_ENV === 'production';
function integrationError(message, code = 'ERP_INTEGRATION_ERROR') {
  const error = new Error(message);
  error.code = code;
  error.status = 502;
  error.statusCode = 502;
  return error;
}
async function settings() {
  let url = process.env.S4_URL || (!production() ? 'http://127.0.0.1:4005' : undefined);
  let token = process.env.S4_ACCESS_TOKEN;
  const destinationName = process.env.S4_DESTINATION_NAME;
  if (production() && destinationName) {
    let services;
    try {
      services = JSON.parse(process.env.VCAP_SERVICES || '{}');
    } catch {
      throw integrationError('Invalid destination service binding');
    }
    const binding = Object.values(services)
      .flat()
      .find(
        (service) =>
          service.label === 'destination' || (service.tags || []).includes('destination'),
      );
    if (!binding?.credentials) throw integrationError('Destination service binding is required');
    const credentials = binding.credentials;
    const auth = await fetch(`${credentials.url.replace(/\/$/, '')}/oauth/token`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${credentials.clientid}:${credentials.clientsecret}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15000),
    });
    if (!auth.ok) throw integrationError('Destination service authorization failed');
    const authBody = await auth.json();
    const target = await fetch(
      `${credentials.uri.replace(/\/$/, '')}/destination-configuration/v1/destinations/${encodeURIComponent(destinationName)}`,
      {
        headers: { authorization: `Bearer ${authBody.access_token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!target.ok) throw integrationError('Configured S/4HANA destination could not be resolved');
    const resolved = await target.json();
    url = resolved.destinationConfiguration?.URL;
    token = resolved.authTokens?.find((item) => item.type === 'Bearer')?.value || token;
    if (!token) throw integrationError('Destination must provide an OAuth Bearer token');
  }
  if (!url) throw integrationError('S/4HANA URL or destination is not configured');
  if (production() && (!url.startsWith('https://') || !token))
    throw integrationError('Production S/4HANA requires HTTPS and authorized OAuth configuration');
  return { base: url.replace(/\/$/, ''), token };
}
async function csrf(config, tenantId) {
  const headers = {
    'x-csrf-token': 'Fetch',
    'x-shocktwin-tenant': tenantId || 'demo',
    accept: 'application/json',
  };
  if (config.token) headers.authorization = `Bearer ${config.token}`;
  const response = await fetch(config.base, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw integrationError('S/4HANA CSRF session initialization failed');
  const token = response.headers.get('x-csrf-token');
  if (!token) throw integrationError('S/4HANA did not return a CSRF token');
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean);
  const cookie = cookies.map((item) => item.split(';')[0]).join('; ');
  return {
    ...headers,
    'x-csrf-token': token,
    ...(cookie ? { cookie } : {}),
    'content-type': 'application/json',
  };
}
async function mutate(path, payload, tenantId, commitsPurchase = false) {
  const config = await settings();
  const headers = await csrf(config, tenantId);
  let response;
  try {
    response = await fetch(`${config.base}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    if (commitsPurchase)
      throw integrationError(
        'ERP_AMBIGUOUS_COMMIT: SAP delivery outcome is unknown; an operator must reconcile the stable external reference before any retry',
        'ERP_AMBIGUOUS_COMMIT',
      );
    throw integrationError('S/4HANA is unavailable; the operation has not been acknowledged');
  }
  if (!response.ok) {
    if (commitsPurchase && response.status >= 500)
      throw integrationError(
        'ERP_AMBIGUOUS_COMMIT: SAP returned a server error after purchase dispatch; reconcile before retrying',
        'ERP_AMBIGUOUS_COMMIT',
      );
    throw integrationError(
      `S/4HANA rejected the operation (HTTP ${response.status}); review before retrying`,
    );
  }
  let body;
  try {
    body = await response.json();
  } catch {
    if (commitsPurchase)
      throw integrationError(
        'ERP_AMBIGUOUS_COMMIT: SAP purchase response was unreadable; reconcile before retrying',
        'ERP_AMBIGUOUS_COMMIT',
      );
    throw integrationError('S/4HANA returned an unreadable response; reconcile before retrying');
  }
  return body.d || body;
}
async function findCommittedPurchase(reference, tenantId) {
  const config = await settings();
  const headers = { accept: 'application/json', 'x-shocktwin-tenant': tenantId || 'demo' };
  if (config.token) headers.authorization = `Bearer ${config.token}`;
  const query = new URLSearchParams({
    $format: 'json',
    $select: 'PurchaseOrder,CorrespncExternalReference',
    $filter: `CorrespncExternalReference eq '${String(reference).replace(/'/g, "''")}'`,
  });
  let response;
  try {
    response = await fetch(`${config.base}/A_PurchaseOrder?${query}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw integrationError('S/4HANA reconciliation query unavailable; no purchase was dispatched');
  }
  if (!response.ok)
    throw integrationError(
      'S/4HANA external-reference reconciliation is unavailable; validate this API filter before enabling production approval',
    );
  const body = await response.json();
  const matches = body.d?.results || body.value;
  if (!Array.isArray(matches))
    throw integrationError(
      'S/4HANA reconciliation response is invalid; no purchase was dispatched',
    );
  if (matches.length > 1)
    throw integrationError(
      'ERP_AMBIGUOUS_COMMIT: Multiple SAP purchases share the external reference; operator reconciliation required',
      'ERP_AMBIGUOUS_COMMIT',
    );
  return matches[0]?.PurchaseOrder || null;
}
async function createDraft(payload) {
  if (production()) {
    // Durable CAP draft is the pre-commit record. This API does not assume a SAP draft facility.
    await settings();
    return { externalId: `PENDING-${payload.id || payload.ID}`, mode: 'sap-pending' };
  }
  const result = await mutate('/PurchaseOrder', payload, payload.tenantId);
  return { externalId: result.PurchaseOrder, mode: 'mock' };
}
async function decideDraft(externalId, decision, payload = {}) {
  if (!['approved', 'rejected'].includes(decision))
    throw integrationError('Unsupported purchase decision', 'INVALID_DECISION');
  if (!production()) {
    const result = await mutate(
      `/PurchaseOrder/${encodeURIComponent(externalId)}/decision`,
      { decision },
      payload.tenantId,
    );
    return { status: result.Status, externalId: result.PurchaseOrder };
  }
  if (decision === 'rejected') return { status: 'rejected', externalId };
  if (!externalId.startsWith('PENDING-')) return { status: 'approved', externalId };
  for (const key of ['S4_COMPANY_CODE', 'S4_PURCHASING_ORG', 'S4_PURCHASING_GROUP', 'S4_PLANT'])
    if (!process.env[key])
      throw integrationError(`Production purchasing configuration missing: ${key}`);
  if (!payload.supplierRef || !Number.isFinite(Number(payload.quantity)))
    throw integrationError('Approved procurement payload is incomplete');
  const document = {
    CompanyCode: process.env.S4_COMPANY_CODE,
    PurchaseOrderType: 'NB',
    Supplier: payload.supplierRef,
    PurchasingOrganization: process.env.S4_PURCHASING_ORG,
    PurchasingGroup: process.env.S4_PURCHASING_GROUP,
    DocumentCurrency: payload.currency || 'INR',
    CorrespncExternalReference: payload.id || payload.ID,
    to_PurchaseOrderItem: {
      results: [
        {
          PurchaseOrderItem: '10',
          Material: payload.materialId || 'resin',
          Plant: process.env.S4_PLANT,
          OrderQuantity: String(payload.quantity),
          PurchaseOrderQuantityUnit: payload.unit || 'EA',
        },
      ],
    },
  };
  const existing = await findCommittedPurchase(payload.id || payload.ID, payload.tenantId);
  if (existing) return { status: 'approved', externalId: existing };
  const result = await mutate('/A_PurchaseOrder', document, payload.tenantId, true);
  if (!result.PurchaseOrder)
    throw integrationError(
      'ERP_AMBIGUOUS_COMMIT: S/4HANA response lacks a purchase order identifier; operator reconciliation required',
      'ERP_AMBIGUOUS_COMMIT',
    );
  return { status: 'approved', externalId: result.PurchaseOrder };
}
module.exports = { createDraft, decideDraft };
