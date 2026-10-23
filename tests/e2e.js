const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ensureRuntime, request, delay } = require('./helpers/runtime');

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:4004';
const errors = [];
let browser;
let runtime;

async function clickedResponse(page, route, click) {
  const pending = page.waitForResponse(
    (response) => response.url().endsWith(route) && response.request().method() === 'POST',
    { timeout: 90000 },
  );
  await click();
  const response = await pending;
  const body = await response.json();
  assert.equal(response.ok(), true, JSON.stringify(body));
  await page.waitForTimeout(200);
  return body;
}

async function main() {
  runtime = await ensureRuntime(base);
  const reset = await request(base, '/api/demo/reset', {});
  assert.equal(reset.response.ok, true, JSON.stringify(reset.body));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, locale: 'en-US' });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/#risk-map', { waitUntil: 'networkidle', timeout: 60000 });
  const theme = await page.request.get(base + '/resources/sap/m/themes/sap_horizon/library.css');
  assert.equal(theme.status(), 200, 'Local Horizon CSS must be available');
  assert.match(theme.headers()['content-type'] || '', /text\/css/);
  const detect = page.getByRole('button', { name: 'Detect hidden links', exact: true });
  await detect.waitFor({ state: 'visible', timeout: 45000 });
  assert.match(await page.locator('body').innerText(), /Illustrative/);
  await page.locator('[data-testid="supplier-graph"]').waitFor({ state: 'visible' });

  const inference = await clickedResponse(page, '/api/risk/infer', () => detect.click());
  const hidden = inference.links.filter((link) => (link.source || link.sourceId) === 'resin-plant');
  assert.equal(hidden.length, 3, 'Actual model must return the three demo candidates');
  assert.ok(
    hidden.every(
      (link) => Number.isFinite(link.confidence) && link.confidence >= 0 && link.confidence <= 1,
    ),
  );
  assert.match(await page.locator('body').innerText(), /Model confidence/);
  for (let index = 0; index < hidden.length; index += 1) {
    const response = page.waitForResponse(
      (item) =>
        item.url().includes('/api/risk/links/') &&
        item.url().endsWith('/decision') &&
        item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm link', exact: true }).first().click();
    assert.equal((await response).ok(), true);
    await delay(200);
  }
  console.log(
    'PASS: real inference returned three bounded-score links; human confirmation persisted.',
  );

  await page.goto(base + '/#simulator', { waitUntil: 'networkidle' });
  const scenario = await clickedResponse(page, '/api/simulations', () =>
    page.getByRole('button', { name: 'Run scenario', exact: true }).click(),
  );
  assert.equal(scenario.daysToStockout, 18);
  assert.equal(scenario.mitigatedDaysToStockout, null);
  assert.equal(scenario.mitigatedSeries.find((point) => point.day === 3).stock, 1500);
  assert.equal(scenario.mitigatedSeries.find((point) => point.day === 30).stock, 1500);
  await page.locator('[data-testid="simulation-chart"]').waitFor({ state: 'visible' });
  assert.match(await page.locator('body').innerText(), /18/);
  console.log(
    'PASS: real simulator returned day-18 baseline stock-out and day-3 replacement continuity.',
  );

  await page.goto(base + '/#capacitymesh', { waitUntil: 'networkidle' });
  const matches = await clickedResponse(page, '/api/mesh/matches', () =>
    page.getByRole('button', { name: 'Find capacity', exact: true }).click(),
  );
  assert.equal(matches.matches.length, 3);
  assert.ok(matches.matches.every((match) => match.eligible && match.distanceKm <= 150));
  await page.locator('.stMatchCard').first().waitFor({ state: 'visible' });
  const draft = await clickedResponse(page, '/api/pos', () =>
    page.getByRole('button', { name: 'Draft PO', exact: true }).first().click(),
  );
  const draftRecord = draft.draftPO || draft.draft || draft;
  assert.equal(draftRecord.status, 'pending');
  assert.equal(draftRecord.mode, 'mock');
  console.log('PASS: three eligible local matches ranked; adapter-backed mock draft created.');

  await page.waitForURL('**/#approvals');
  await page.locator('.stDraftCard').first().waitFor({ state: 'visible' });
  const decision = await clickedResponse(page, `/api/pos/${draftRecord.id}/decision`, () =>
    page.getByRole('button', { name: 'Approve', exact: true }).first().click(),
  );
  const approved = decision.draftPO || decision.draft || decision;
  assert.equal(approved.status, 'approved');
  assert.match(await page.locator('body').innerText(), /approved/i);
  const audit = await request(base, '/api/audit');
  assert.equal(audit.response.ok, true);
  assert.ok(
    audit.body.events.some(
      (event) => event.entityId === draftRecord.id && /APPROV/i.test(event.action),
    ),
    'Approval must have a persisted audit event',
  );
  assert.deepEqual(errors, [], 'No browser JavaScript errors are allowed');
  console.log('PASS: human approval persisted with an audit event; no browser JavaScript errors.');
  console.log('ShockTwin end-to-end demo passed (Illustrative local data; mock ERP).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (runtime) runtime.stop();
  });
