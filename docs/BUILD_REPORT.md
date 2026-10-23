# ShockTwin — build and verification report

**Verified local workflow · 23 October 2026 · Illustrative business data**

The local ShockTwin app completes Detect → Simulate → Respond → Approve using a real synthetic-trained GraphSAGE endpoint, CAP services and SQLite, locally served SAPUI5/OpenUI5 Horizon assets, local signal/ERP mocks and an auditable human decision. A headless Chromium browser replayed the actual UI at 1920×1080 and checked the API responses behind each action. No live SAP procurement action was performed.

## What was verified

| Command / check      | Actual result                      | Scope                                                                                                                                   |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`           | **31 passed, 0 failed, 0 skipped** | 20 domain outcome tests and 11 CAP service integration tests using an isolated temporary SQLite database and isolated HTTP ERP fixture. |
| `npm run test:ml`    | **4 passed**                       | Saved-model loading, bounded real predictions, synthetic split/provenance checks; see actual test implementation.                       |
| `npm run test:e2e`   | **Passed**                         | Real browser workflow, actual API outputs, local Horizon CSS served as `text/css`, and zero browser JavaScript errors.                  |
| `/health`            | **HTTP 200, UP**                   | Database plus ML, S/4HANA mock and signals dependencies were available.                                                                 |
| Local Horizon assets | **HTTP 200**                       | Compiled theme CSS is served locally; the app does not require a public UI5 CDN after setup.                                            |

The final local run used the **better-sqlite3 12.11.1** override for Node 24 compatibility; the complete test chain exited successfully, and `/health` remained UP afterward. The verified runtime is Node.js **24.19.0**, Python **3.12.14**, CAP **8.9.10**, and Playwright Chromium **141.0.7390.37**. Node 20.19+/Python 3.11 are the documented local minimum/CI versions (the production router targets Node 22/24); this local run does not independently prove every supported-platform combination. Initial verification exposed missing browser binaries, native SQLite bindings, an invalid host-language tag, missing compiled theme CSS and a no-argument CAP action dispatch issue; these were corrected before the passing browser run.

`npm run demo` also passed all five API replay steps and produced eight audit events in the reset Illustrative tenant.

## Evidence from the actual browser flow

1. Detect returned three real model-scored candidate resin links with finite confidence in `[0,1]`; the UI displayed confidence/evidence and persisted human confirmations.
2. The default Illustrative cyclone returned baseline stock-out on day 18. Full replacement after day 3 held stock at 1,500 units at day 3 and day 30; mitigated stock-out was `null`/beyond horizon.
3. Matching returned three eligible moulding responses within the requested 150 km radius, with transparent factors.
4. Draft PO creation returned `pending` and `mode: mock` through the local ERP adapter.
5. The UI approved the draft; the service persisted approved status and a corresponding audit event. No browser JavaScript errors occurred.

These are functional test outcomes on seeded data, not operational capacity activation, customer savings or real supplier-network validation.

## Responsive UI verification

A final real-browser check at **390×844** confirmed a 390-pixel mobile content width, zero page JavaScript errors, and working menu navigation to Simulator. The scroll-container minimum-width correction prevents the earlier 636-pixel clipping; the graph pans horizontally inside its card. Desktop workflow verification used the actual app at 1920×1080. These are recorded viewport checks, not a formal accessibility audit.

## Meaningful boundary checks

The domain tests cover full/partial/zero loss, recovery, insufficient/late replacement, excluded rejected links, confirmed-link inclusion, all four shock types, cycle rejection, order allocation boundaries and non-duplicated revenue exposure. The default seeded orders due on days 20 and 25 produce INR 560,000 of Illustrative exposure; a day-18 covered-boundary order and day-29 recovered delivery are excluded.

Matching tests cover capability/date/volume/radius eligibility, honest empty results, public-envelope data minimization, deterministic ordering, distance calculation and impossible-date validation. Risk tests distinguish three-of-five descriptive exposure from material-specific concentration, avoid duplicate inflation and exclude rejected links.

CAP integration tests verify role denial, cross-tenant isolation, ML-unavailable graph preservation, allowlisted provider publication, foreign scenario rejection, JSON shape validation, idempotent draft creation, key-reuse conflicts, final approval/rejection, audit persistence, controlled same-decision retry and blocking ambiguous commitments pending reconciliation. These are service-level controls; a production penetration test and live XSUAA integration remain [VERIFY].

## Model evaluation provenance

The saved model and measured metrics are in `ml/model/`, including `weights.pt`, `metrics.json`, `split.json` and `REPORT.md`. Results are explicitly labelled **Synthetic-data results**. The held-out synthetic split uses shared nodes and patterned material/geography features; it is not a temporal or held-out-company real-world evaluation. Confidence is an uncalibrated model score, and feature evidence is not causal attribution. No research-paper accuracy number or real supplier accuracy is claimed.

## Start and replay

```bash
npm install
npm run seed
npm run dev
```

Open **http://localhost:4004**. For a headless host, use `NO_OPEN=1 npm run dev`. The launcher starts CAP on 4004, ERP mock on 4005, signals on 4006 and ML on 8000. With the app running, `npm run demo` resets and replays the local Illustrative workflow; [DEMO.md](../DEMO.md) gives the exact UI clicks and saved-PDF fallback.

For browser tests on a fresh machine, install Chromium once with `npx playwright install chromium` (or `--with-deps` on a Linux host missing browser libraries), then run `npm run test:e2e`.

## Packaging and dependency checks

The final local MTA build passed and produced `mta_archives/shocktwin_0.1.0.mtar`, including the compiled official Horizon CSS. The archive contains Express 4.22.3, the better-sqlite3 12.11.1 override and application router 23.3.0; the production router targets Node 22/24. This proves local packaging, not a live Cloud Foundry deployment.

`npm audit --omit=dev` reported zero current advisories for the root production dependency tree and the application-router dependency tree at this check. This is an advisory scan, not a penetration test or compliance certification. `npm run lint` passed and `npm run format:check` confirmed that all matched files use the configured Prettier style after the final documentation sync.

The editable deck, PDF and pitch captures belong to phase 6; their visual/export validation is reported with the presentation artifacts.

## Known limitations

- Business records, graph hypotheses, signals, capacities, prices, quantities, orders and scenario outputs are Illustrative. The local mock approval is not a real SAP purchase.
- Live Cloud Foundry/HANA/XSUAA service bindings, S/4HANA purchasing semantics, Integration Suite flows, BPA activation, AI Core deployment and Generative AI Hub are [VERIFY]. No SAP account/credentials were configured for this local verification.
- The GNN was evaluated on synthetic data. Real hidden links require authorized evidence, calibration and human review.
- Simulation is deterministic, material-specific and finite-horizon; it simplifies BOMs, substitutions, restarts, supplier qualification and shared inventory allocation.
- Capacity federation uses minimal envelopes and local private constraints. A real network requires provider consent, freshness, qualification, contracts and privacy/antitrust review.
- The 10,000-node scale and proposed service levels are design targets; no such load/uptime benchmark was run.
- Formal accessibility/security/legal compliance and a customer pilot remain [VERIFY]. Published disruption/collaboration statistics are context, not ShockTwin impact claims.
