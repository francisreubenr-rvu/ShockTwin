'use strict';
require('dotenv').config();
const cds = require('@sap/cds');
const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { production } = require('./srv/lib/common');
cds.middlewares.add(
  (req, res, next) => {
    if (!production()) {
      const tenant = req.headers['x-demo-tenant'] || 'demo';
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(tenant))
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid development tenant' } });
      const roles = String(req.headers['x-demo-role'] ?? 'Buyer,Planner')
        .split(',')
        .map((r) => r.trim())
        .filter((r) => ['Buyer', 'Planner', 'CapacityProvider', 'Admin'].includes(r));
      cds.context.user = new cds.User({
        id: String(req.headers['x-demo-user'] || 'Priya').slice(0, 100),
        roles,
        attr: { tenantId: tenant },
      });
      cds.context.tenant = tenant;
    }
    next();
  },
  { after: 'auth' },
);
cds.on('bootstrap', (app) => {
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.correlationId = /^[\w-]{1,100}$/.test(req.headers['x-correlation-id'] || '')
      ? req.headers['x-correlation-id']
      : randomUUID();
    res.set('x-correlation-id', req.correlationId);
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/resources', express.static(path.join(__dirname, 'publicresources'), { maxAge: '1d' }));
  app.use(
    '/resources',
    express.static(path.join(__dirname, '.runtime', 'ui5', 'resources'), { maxAge: '1d' }),
  );
  for (const pkg of [
    'sap.ui.core',
    'sap.m',
    'sap.f',
    'sap.ui.layout',
    'sap.ui.unified',
    'sap.ui.table',
    'sap.tnt',
    'themelib_sap_horizon',
  ])
    app.use(
      '/resources',
      express.static(path.join(__dirname, 'node_modules/@openui5', pkg, 'src'), { maxAge: '1d' }),
    );
  app.use('/vendor/d3', express.static(path.join(__dirname, 'node_modules/d3/dist')));
  app.get('/vendor/d3.min.js', (req, res) =>
    res.sendFile(path.join(__dirname, 'node_modules/d3/dist/d3.min.js')),
  );
  app.use('/app', express.static(path.join(__dirname, 'app')));
  app.use(express.static(path.join(__dirname, 'app')));
  app.get('/health/live', (req, res) =>
    res.json({ status: 'UP', process: 'running', mode: production() ? 'production' : 'local' }),
  );
  app.get('/health', async (req, res) => {
    let database = false;
    try {
      if (cds.db) {
        await cds.db.run(cds.ql.SELECT.from('shocktwin.Companies').columns('ID').limit(1));
        database = true;
      }
    } catch {
      /* Health response reports unavailable DB. */
    }
    if (production())
      return res.status(database ? 200 : 503).json({
        status: database ? 'DATABASE_UP' : 'DEGRADED',
        database,
        dependencies: {
          ml: 'not-probed',
          s4: 'not-probed',
          signals: 'not-probed',
          workflow: 'not-probed',
        },
        remoteReadiness: 'unverified',
        mode: 'production',
      });
    const targets = {
      ml: process.env.ML_URL || 'http://127.0.0.1:8000',
      s4: process.env.S4_URL || 'http://127.0.0.1:4005',
      signals: process.env.SIGNALS_URL || 'http://127.0.0.1:4006',
    };
    const entries = await Promise.all(
      Object.entries(targets).map(async ([key, url]) => {
        try {
          const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
          return [key, response.ok];
        } catch {
          return [key, false];
        }
      }),
    );
    const dependencies = Object.fromEntries(entries);
    const ready = database && Object.values(dependencies).every(Boolean);
    res.status(ready ? 200 : 503).json({
      status: ready ? 'UP' : 'DEGRADED',
      database,
      dependencies,
      mode: production() ? 'production' : 'local',
      illustrative: !production(),
    });
  });
});
cds.on('served', () => {
  const app = cds.app;
  const router = express.Router();
  router.use(express.json({ limit: '128kb' }));
  router.use((req, res, next) => {
    if (
      req.method !== 'GET' &&
      req.headers.origin &&
      ((!production() && req.headers.origin !== `${req.protocol}://${req.get('host')}`) ||
        (production() &&
          process.env.PUBLIC_APP_ORIGIN &&
          req.headers.origin !== process.env.PUBLIC_APP_ORIGIN))
    )
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cross-origin mutations are not allowed',
          correlationId: req.correlationId,
        },
      });
    if (!production() && req.headers['x-csrf-token'] === 'Fetch')
      res.set('x-csrf-token', 'development-stateless-api');
    next();
  });
  function action(method, route, serviceName, event, data = (req) => req.body || {}) {
    router[method](route, async (req, res) => {
      const started = Date.now();
      try {
        const service = cds.services[serviceName];
        const value = await service.tx(
          { user: cds.context.user, tenant: cds.context.tenant },
          (tx) =>
            tx.send({
              event,
              data: service.actions[event]?.params?.payload
                ? { payload: JSON.stringify(data(req)) }
                : {},
              headers: { ...req.headers, 'x-correlation-id': req.correlationId },
            }),
        );
        const result = typeof value === 'string' ? JSON.parse(value) : value;
        res.status(result?.error ? 502 : 200).json(result);
        console.info(
          JSON.stringify({
            action: event,
            status: result?.error ? 'integration-error' : 'ok',
            durationMs: Date.now() - started,
            correlationId: req.correlationId,
          }),
        );
      } catch (error) {
        const status = Number(
          error.status ||
            error.statusCode ||
            (Number(error.code) >= 400 && Number(error.code) <= 599 ? error.code : 500),
        );
        const safeStatus = status >= 400 && status <= 599 ? status : 500;
        res.status(safeStatus).json({
          error: {
            code:
              typeof error.code === 'string' && !/^\d+$/.test(error.code)
                ? error.code
                : 'INTERNAL_ERROR',
            message:
              safeStatus < 500
                ? error.message
                : safeStatus === 502
                  ? error.message
                  : 'An internal operation failed. Use the correlation ID to investigate.',
            correlationId: req.correlationId,
          },
        });
        console.error(
          JSON.stringify({
            action: event,
            status: safeStatus,
            code: error.code || 'INTERNAL_ERROR',
            durationMs: Date.now() - started,
            correlationId: req.correlationId,
          }),
        );
      }
    });
  }
  action('get', '/state', 'RiskService', 'getState');
  action('post', '/risk/infer', 'RiskService', 'infer');
  action('post', '/risk/links/:id/decision', 'RiskService', 'decideLink', (req) => ({
    ...req.body,
    id: req.params.id,
  }));
  action('post', '/simulations', 'SimulationService', 'simulate');
  action('get', '/mesh/listings', 'MeshService', 'listListings');
  action('post', '/mesh/listings', 'MeshService', 'publishListing');
  action('post', '/mesh/matches', 'MeshService', 'findMatches');
  action('get', '/pos', 'POService', 'listDrafts');
  action('post', '/pos', 'POService', 'createDraft');
  action('post', '/pos/:id/decision', 'POService', 'decide', (req) => ({
    ...req.body,
    id: req.params.id,
  }));
  action('get', '/audit', 'POService', 'auditEvents');
  if (!production())
    router.post('/demo/reset', async (req, res) => {
      try {
        const result = await cds.db.tx((tx) => require('./srv/lib/repository').resetData(tx));
        try {
          await fetch(`${process.env.S4_URL || 'http://127.0.0.1:4005'}/reset`, {
            method: 'POST',
            signal: AbortSignal.timeout(2000),
          });
        } catch {
          /* Local ERP can reset on its own next start. */
        }
        res.json(result);
      } catch {
        res.status(500).json({
          error: {
            code: 'RESET_FAILED',
            message: 'Local Illustrative reset failed',
            correlationId: req.correlationId,
          },
        });
      }
    });
  router.use((req, res) =>
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Unknown API endpoint',
        correlationId: req.correlationId,
      },
    }),
  );
  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    return res.status(error.type === 'entity.parse.failed' ? 400 : 500).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request JSON could not be parsed',
        correlationId: req.correlationId,
      },
    });
  });
  app.use('/api', cds.middlewares.before, router);
});
module.exports = cds.server;
if (require.main === module)
  cds
    .server({
      service: 'all',
      from: ['db', 'srv'],
      cors: false,
      health: false,
      index: false,
      static: false,
    })
    .then((server) => {
      console.info(
        `ShockTwin ready at http://localhost:${server.address().port} · Illustrative local data`,
      );
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
