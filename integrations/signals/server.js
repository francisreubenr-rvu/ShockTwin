const express = require('express');
require('dotenv').config();
const { getSignals, scoreNews } = require('./adapter');
const app = express();
app.use(express.json({ limit: '100kb' }));
app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'signals',
    mode: process.env.LIVE_SIGNALS_URL ? 'optional-live' : 'illustrative',
  }),
);
app.get(['/signals', '/'], async (_req, res) => res.json(await getSignals()));
app.post('/score', (req, res) =>
  res.json({ ...scoreNews(req.body.headline), illustrative: !process.env.LIVE_SIGNALS_URL }),
);
app.listen(Number(process.env.SIGNALS_PORT || 4006), '127.0.0.1', () =>
  console.log(
    `Signals feed on ${process.env.SIGNALS_PORT || 4006}; offline fixture labelled Illustrative`,
  ),
);
