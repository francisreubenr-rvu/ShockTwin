const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config();
const root = path.resolve(__dirname, '../..');
const stateFile = path.join(root, '.runtime', 's4-mock.json');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'db', 'demo-data.json'), 'utf8'));
const app = express();
app.use(express.json({ limit: '100kb' }));
let purchaseOrders = [];
try {
  purchaseOrders = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch {}
function save() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(purchaseOrders, null, 2));
}
function tenant(req) {
  return req.get('x-shocktwin-tenant') || 'demo';
}
function error(res, status, message) {
  return res
    .status(status)
    .json({ error: { code: String(status), message: { lang: 'en', value: message } } });
}
function serialize(record) {
  return {
    PurchaseOrder: record.externalId,
    Status: record.status,
    Supplier: record.supplierRef,
    Material: record.materialId,
    Quantity: record.quantity,
    Currency: record.currency,
    PriceBand: record.priceBand,
    Illustrative: true,
    CreatedAt: record.createdAt,
  };
}
app.use((req, res, next) => {
  if ((req.get('x-csrf-token') || '').toLowerCase() === 'fetch') {
    res.set('x-csrf-token', 'shocktwin-local-mock-token');
    res.cookie('shocktwin_s4_session', 'illustrative', { httpOnly: true, sameSite: 'strict' });
  }
  next();
});
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'S/4HANA local mock', illustrative: true }),
);
app.post('/reset', (_req, res) => {
  purchaseOrders = [];
  save();
  res.json({ reset: true, illustrative: true });
});
const router = express.Router();
router.get('/', (_req, res) =>
  res.json({
    d: { EntitySets: ['A_PurchaseOrder', 'PurchaseOrder', 'Supplier', 'Material', 'Inventory'] },
    illustrative: true,
  }),
);
router.get('/$metadata', (_req, res) =>
  res.type('application/xml').send(`<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx"><edmx:DataServices m:DataServiceVersion="2.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"><Schema Namespace="ShockTwinMock" xmlns="http://schemas.microsoft.com/ado/2008/09/edm"><EntityType Name="PurchaseOrder"><Key><PropertyRef Name="PurchaseOrder"/></Key><Property Name="PurchaseOrder" Type="Edm.String" Nullable="false"/><Property Name="Status" Type="Edm.String"/><Property Name="Supplier" Type="Edm.String"/><Property Name="Material" Type="Edm.String"/><Property Name="Quantity" Type="Edm.Double"/><Property Name="Currency" Type="Edm.String"/><Property Name="Illustrative" Type="Edm.Boolean"/></EntityType><EntityType Name="Supplier"><Key><PropertyRef Name="Supplier"/></Key><Property Name="Supplier" Type="Edm.String" Nullable="false"/><Property Name="SupplierName" Type="Edm.String"/></EntityType><EntityType Name="Material"><Key><PropertyRef Name="Material"/></Key><Property Name="Material" Type="Edm.String" Nullable="false"/><Property Name="MaterialName" Type="Edm.String"/><Property Name="BaseUnit" Type="Edm.String"/></EntityType><EntityType Name="Inventory"><Key><PropertyRef Name="Material"/></Key><Property Name="Material" Type="Edm.String" Nullable="false"/><Property Name="OnHand" Type="Edm.Double"/><Property Name="DailyBurn" Type="Edm.Double"/></EntityType><EntityContainer Name="Container" m:IsDefaultEntityContainer="true"><EntitySet Name="PurchaseOrder" EntityType="ShockTwinMock.PurchaseOrder"/><EntitySet Name="A_PurchaseOrder" EntityType="ShockTwinMock.PurchaseOrder"/><EntitySet Name="Supplier" EntityType="ShockTwinMock.Supplier"/><EntitySet Name="Material" EntityType="ShockTwinMock.Material"/><EntitySet Name="Inventory" EntityType="ShockTwinMock.Inventory"/></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>`),
);
router.get(['/PurchaseOrder', '/A_PurchaseOrder'], (req, res) => {
  const records = purchaseOrders.filter((record) => record.tenantId === tenant(req)).map(serialize);
  res.json({ d: { results: records }, illustrative: true });
});
router.get(/^\/(?:A_)?PurchaseOrder\('([^']+)'\)$/, (req, res) => {
  const record = purchaseOrders.find(
    (item) => item.externalId === req.params[0] && item.tenantId === tenant(req),
  );
  if (!record) return error(res, 404, 'Purchase order not found');
  res.json({ d: serialize(record), illustrative: true });
});
router.post(['/PurchaseOrder', '/A_PurchaseOrder'], (req, res) => {
  if (req.get('x-csrf-token') !== 'shocktwin-local-mock-token')
    return error(res, 403, 'Fetch the mock CSRF token first');
  const payload = req.body;
  if (
    !payload ||
    typeof payload.idempotencyKey !== 'string' ||
    !Number.isFinite(payload.quantity) ||
    payload.quantity <= 0
  )
    return error(res, 400, 'A positive quantity and idempotency key are required');
  const existing = purchaseOrders.find(
    (item) => item.tenantId === tenant(req) && item.idempotencyKey === payload.idempotencyKey,
  );
  if (existing) return res.json({ d: serialize(existing), illustrative: true });
  const record = {
    externalId: `MOCK-${crypto.randomUUID()}`,
    tenantId: tenant(req),
    idempotencyKey: payload.idempotencyKey,
    quantity: payload.quantity,
    materialId: payload.materialId,
    supplierRef: payload.supplierRef,
    currency: payload.currency || 'INR',
    priceBand: payload.priceBand,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  purchaseOrders.push(record);
  save();
  res.status(201).json({ d: serialize(record), illustrative: true });
});
router.post('/PurchaseOrder/:id/decision', (req, res) => {
  if (req.get('x-csrf-token') !== 'shocktwin-local-mock-token')
    return error(res, 403, 'Fetch the mock CSRF token first');
  const record = purchaseOrders.find(
    (item) => item.externalId === req.params.id && item.tenantId === tenant(req),
  );
  if (!record) return error(res, 404, 'Purchase order not found');
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision))
    return error(res, 400, 'Decision must be approved or rejected');
  if (record.status !== 'pending' && record.status !== decision)
    return error(res, 409, 'Purchase order has already been decided');
  record.status = decision;
  record.decidedAt = new Date().toISOString();
  save();
  res.json({ d: serialize(record), illustrative: true });
});
router.get('/Supplier', (req, res) =>
  res.json({
    d: {
      results: seed.Suppliers.filter((item) => item.tenantId === tenant(req)).map((item) => ({
        Supplier: item.ID,
        SupplierName: item.name,
        Illustrative: true,
      })),
    },
  }),
);
router.get('/Material', (req, res) =>
  res.json({
    d: {
      results: seed.Materials.filter((item) => item.tenantId === tenant(req)).map((item) => ({
        Material: item.ID,
        MaterialName: item.name,
        BaseUnit: item.unit,
        Illustrative: true,
      })),
    },
  }),
);
router.get('/Inventory', (req, res) =>
  res.json({
    d: {
      results: seed.Inventory.filter((item) => item.tenantId === tenant(req)).map((item) => ({
        Material: item.materialId,
        OnHand: item.onHand,
        DailyBurn: item.dailyBurn,
        Illustrative: true,
      })),
    },
  }),
);
app.use(
  [
    '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
    '/odata/v2/API_PURCHASEORDER_PROCESS_SRV',
    '/',
  ],
  router,
);
app.use((err, _req, res, _next) => error(res, err.status || 500, 'Invalid mock request'));
app.listen(Number(process.env.S4_MOCK_PORT || 4005), '127.0.0.1', () =>
  console.log(`Illustrative S/4HANA mock on ${process.env.S4_MOCK_PORT || 4005}`),
);
