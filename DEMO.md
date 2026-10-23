# ShockTwin — live demo and fallback

**All business data and outcomes are Illustrative.** The demo uses a real synthetic-trained link predictor and local ERP/workflow mocks. It does not place a real purchase order.

## Before the room opens

Run `npm install && npm run seed && npm run dev` from the repository root. Wait for CAP (4004), the ERP mock (4005), signals (4006) and ML (8000) to report ready. Open http://localhost:4004 in a browser at full width. Dependencies, OpenUI5 assets and saved model weights are local after installation; unplugging the network does not prevent this local flow. Leave optional LLM credentials unset for deterministic explanations.

Run `npm run demo` once for an API rehearsal, then `npm run seed` before the live UI rehearsal so Priya starts with a clean network and empty inbox. Do not reseed during the pitch. Check that the presentation PDF and app screenshots are available on the projector laptop. Close unrelated browser tabs and keep one local app tab ready.

## Five exact steps

| Step                          | Clicks                                                                                                                                                                               | Show and say                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Know the direct network   | Open **Risk map** (`#risk-map`).                                                                                                                                                     | “Priya sees five immediate suppliers. All data in this demonstration is Illustrative.”                                                                                               |
| 2 — Reveal the shared plant   | Click **Detect hidden links**. Wait for inference. Inspect the shared resin plant and **Model confidence** cards. Use **Confirm link** on each relevant proposed resin relationship. | “The dashed amber links are model hypotheses. Actual scores and evidence are visible; a person confirms them.” Do not describe synthetic confidence as real-world accuracy.          |
| 3 — Rehearse the shock        | Open **Simulator** (`#simulator`). Keep cyclone, duration 28 days, severity 100%, switch day 3 and full replacement defaults. Click **Run scenario**.                                | “Without action, resin reaches zero on day 18. Replacement after day 3 holds the remaining stock through this 30-day horizon.” Point to both curves and the Illustrative disclosure. |
| 4 — Find and draft a response | Open **CapacityMesh** (`#capacitymesh`). Keep moulding, 150 km and volume 100 defaults. Click **Find capacity**. Inspect the top match's score factors. Click its **Draft PO**.      | “We rank eligible capacity by capability, distance, volume, lead time and price band. Only minimal envelopes are public. This is a mock ERP draft, awaiting human approval.”         |
| 5 — Keep the decision human   | Open **Approvals** (`#approvals`). Select the pending draft if needed. Click **Approve**. Inspect the approved status and audit row.                                                 | “Priya approves. The system records who changed what, and when. No autonomous purchasing.”                                                                                           |

The graph, screen state and scores must be the actual runtime result. If a candidate is absent or an integration fails, say so and take the recovery path; do not narrate an action that did not happen.

## 60-second fallback if the network or demo machine fails

External network loss alone should not affect the installed local app. If it remains healthy, run the same five clicks quickly: **Detect hidden links → confirm → Run scenario → Find capacity → Draft PO → Approve**, spending about ten seconds on each transition and ten seconds on the conclusion. State that the system is operating locally with mock ERP and Illustrative data.

If the local runtime or projector browser fails, switch immediately to the saved deck PDF. Spend 20 seconds on slide 08's real risk-map capture, 15 seconds on slide 09's real simulation capture, 15 seconds on slide 10's real match/approved-draft captures, then 10 seconds on the human-control conclusion. Say: “These are captures from the tested local app; this fallback is a recorded walkthrough, not a live transaction.” The PDF and screenshots must be copied to the laptop before the event.

## Recovery between rehearsals

Stop the launcher with Ctrl+C. Run `npm run seed`, then `npm run dev`. If a port is occupied, close the previous local process or use documented port settings consistently. Check `/health` and actual service logs before retrying. An ML failure must remain visible; optional LLM failure may use the labelled deterministic template. Never approve a real procurement action while presenting the local demo.

## Evidence to retain

Keep the test report, model metrics labelled Synthetic-data results, actual API simulation JSON, 1920×1080 app screenshots and screenshot-capture metadata alongside the presentation. The pitch notes total 7:30, leaving 30 seconds for slow clicks or recovery. Source statistics belong in slide notes/footers; the live demo proves workflow behavior, not customer savings.
