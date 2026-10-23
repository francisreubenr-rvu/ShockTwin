const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const directory = __dirname;
const root = path.resolve(directory, '../..');
const base = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4004';
const provenance = {
  label: 'Illustrative local app captures',
  capturedAt: new Date().toISOString(),
  baseUrl: base,
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  browser: 'Playwright Chromium',
  captureMethod: 'Actual browser UI actions; unmodified viewport screenshots',
  businessData: 'Illustrative',
  erpMode: 'mock',
  modelDomain: 'synthetic',
  actions: [],
  captures: [],
  pageErrors: [],
};
let browser;
async function post(route, payload) {
  const response = await fetch(base + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });
  const result = await response.json();
  assert.equal(response.ok, true, JSON.stringify(result));
  return result;
}
async function click(page, route, name, first = false) {
  const pending = page.waitForResponse(
    (response) => response.url().endsWith(route) && response.request().method() === 'POST',
    { timeout: 90000 },
  );
  const button = page.getByRole('button', { name, exact: true });
  await (first ? button.first() : button).click();
  const response = await pending;
  const result = await response.json();
  assert.equal(response.ok(), true, JSON.stringify(result));
  provenance.actions.push({ timestamp: new Date().toISOString(), route, button: name });
  await page.waitForTimeout(300);
  return result;
}
async function settle(page) {
  await page.waitForTimeout(500);
  const toast = page.locator('.sapMMessageToast').last();
  if (await toast.count()) await toast.waitFor({ state: 'hidden', timeout: 6000 });
  await page.waitForTimeout(300);
}
async function capture(page, filename, state) {
  await settle(page);
  await page.mouse.click(1000, 104);
  await page.waitForTimeout(100);
  const file = path.join(directory, filename);
  await page.screenshot({ path: file, fullPage: false, animations: 'disabled' });
  provenance.captures.push({
    filename: `docs/screenshots/${filename}`,
    timestamp: new Date().toISOString(),
    route: page.url(),
    state,
    width: 1920,
    height: 1080,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  });
}
async function main() {
  await post('/api/demo/reset', {});
  provenance.actions.push({
    timestamp: new Date().toISOString(),
    route: '/api/demo/reset',
    meaning: 'Reset local Illustrative fixture only',
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'en-US',
  });
  page.on('pageerror', (error) => provenance.pageErrors.push(error.message));
  await page.goto(base + '/#risk-map', { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Detect hidden links', exact: true })
    .waitFor({ state: 'visible' });
  const inference = await click(page, '/api/risk/infer', 'Detect hidden links');
  assert.equal(inference.links.length, 3);
  provenance.model = inference.model;
  provenance.actualLinkScores = inference.links.map((link) => ({
    id: link.id,
    source: link.source,
    target: link.target,
    confidence: link.confidence,
    reviewStatus: link.reviewStatus,
    evidence: link.evidence,
  }));
  fs.writeFileSync(
    path.join(directory, 'inference-result.json'),
    JSON.stringify(inference, null, 2) + '\n',
  );
  await page.locator('[data-testid="supplier-graph"]').waitFor({ state: 'visible' });
  await capture(
    page,
    'risk-map.png',
    'Three actual synthetic-model candidates proposed; dashed amber graph edges; before human confirmation',
  );
  for (let index = 0; index < 3; index += 1) {
    const pending = page.waitForResponse(
      (response) =>
        response.url().includes('/api/risk/links/') &&
        response.url().endsWith('/decision') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm link', exact: true }).first().click();
    const response = await pending;
    assert.equal(response.ok(), true);
    provenance.actions.push({
      timestamp: new Date().toISOString(),
      route: new URL(response.url()).pathname,
      button: 'Confirm link',
    });
    await page.waitForTimeout(300);
  }
  await page.goto(base + '/#simulator', { waitUntil: 'networkidle' });
  const scenario = await click(page, '/api/simulations', 'Run scenario');
  assert.equal(scenario.daysToStockout, 18);
  assert.equal(scenario.mitigatedDaysToStockout, null);
  assert.equal(scenario.mitigatedSeries.find((point) => point.day === 3).stock, 1500);
  assert.equal(scenario.mitigatedSeries.find((point) => point.day === 30).stock, 1500);
  fs.writeFileSync(
    path.join(directory, 'simulation-result.json'),
    JSON.stringify(scenario, null, 2) + '\n',
  );
  provenance.scenarioId = scenario.id;
  provenance.simulation = {
    assumptions: scenario.assumptions,
    daysToStockout: scenario.daysToStockout,
    mitigatedDaysToStockout: scenario.mitigatedDaysToStockout,
    revenueAtRisk: scenario.revenueAtRisk,
    currency: scenario.currency,
  };
  await page.locator('[data-testid="simulation-chart"]').waitFor({ state: 'visible' });
  await capture(
    page,
    'simulator.png',
    'Actual default cyclone, duration 28, severity 1, day-3 replacement; baseline exhaustion day 18',
  );
  await page.goto(base + '/#capacitymesh', { waitUntil: 'networkidle' });
  const matches = await click(page, '/api/mesh/matches', 'Find capacity');
  assert.equal(matches.matches.length, 3);
  fs.writeFileSync(
    path.join(directory, 'matches-result.json'),
    JSON.stringify(matches, null, 2) + '\n',
  );
  provenance.matches = matches.matches.map((match) => ({
    id: match.id,
    listingId: match.listingId,
    score: match.score,
    distanceKm: match.distanceKm,
  }));
  await page.locator('.stMatchCard').first().waitFor({ state: 'visible' });
  await capture(
    page,
    'capacitymesh.png',
    'Three actual eligible moulding matches within 150 km and transparent rank factors',
  );
  const result = await click(page, '/api/pos', 'Draft PO', true);
  const draft = result.draftPO || result.draft || result;
  assert.equal(draft.status, 'pending');
  await page.waitForURL('**/#approvals');
  await page.locator('.stDraftCard').first().waitFor({ state: 'visible' });
  await capture(
    page,
    'approval-pending.png',
    'Actual pending mock ERP draft before explicit human approval',
  );
  const decisionResult = await click(page, `/api/pos/${draft.id}/decision`, 'Approve', true);
  const decision = decisionResult.draftPO || decisionResult.draft || decisionResult;
  assert.equal(decision.status, 'approved');
  assert.equal(decision.mode, 'mock');
  provenance.draft = {
    id: draft.id,
    externalId: decision.externalId,
    status: decision.status,
    mode: decision.mode,
    createdBy: decision.createdBy,
    decidedAt: decision.decidedAt,
  };
  await capture(
    page,
    'approval.png',
    'Actual approved mock PO and persisted audit trail after human Approve action',
  );
  assert.deepEqual(provenance.pageErrors, []);
  fs.writeFileSync(
    path.join(root, 'docs/SCREENSHOT_PROVENANCE.json'),
    JSON.stringify(provenance, null, 2) + '\n',
  );
  console.log(
    JSON.stringify(
      {
        captures: provenance.captures.map((item) => item.filename),
        actualScores: provenance.actualLinkScores,
        simulation: provenance.simulation,
        approval: provenance.draft,
        pageErrors: provenance.pageErrors,
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
  });
