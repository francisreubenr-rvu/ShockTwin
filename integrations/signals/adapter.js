const fixture = require('./feed.json');
function scoreNews(headline) {
  const text = String(headline || '').toLowerCase();
  const tokens = ['cyclone', 'fire', 'closure', 'strike', 'flood', 'shutdown'];
  const found = tokens.filter((word) => text.includes(word));
  return {
    riskScore: found.length ? Math.min(1, 0.55 + 0.15 * found.length) : 0.1,
    explanation: found.length
      ? `The signal mentions ${found.join(', ')}; a planner must verify location and operational relevance.`
      : 'No configured disruption keyword was detected; this is not a guarantee of safety.',
    mode: 'deterministic',
  };
}
async function getSignals() {
  if (!process.env.LIVE_SIGNALS_URL) return fixture;
  try {
    const url = new URL(process.env.LIVE_SIGNALS_URL);
    if (!['https:', 'http:'].includes(url.protocol))
      throw new Error('Unsupported signals protocol');
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Feed unavailable');
    const body = await response.json();
    const signals = Array.isArray(body) ? body : body.signals;
    if (!Array.isArray(signals) || signals.length > 500)
      throw new Error('Feed does not match the bounded signals schema');
    return {
      illustrative: false,
      source: 'Configured external signal adapter; verify source authority',
      signals: signals.map((item) => ({
        id: String(item.id || ''),
        type: String(item.type || 'news'),
        nodeId: String(item.nodeId || ''),
        location: String(item.location || ''),
        headline: String(item.headline || '').slice(0, 500),
        observedAt: item.observedAt,
        ...scoreNews(item.headline),
        illustrative: false,
      })),
    };
  } catch {
    return {
      ...fixture,
      fallbackReason:
        'Configured live feed unavailable; using clearly labelled Illustrative demo signals.',
    };
  }
}
module.exports = { getSignals, scoreNews };
