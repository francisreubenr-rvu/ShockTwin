# ShockTwin — Product Requirements Document

| Field   | Value                                                                                 |
| ------- | ------------------------------------------------------------------------------------- |
| Product | ShockTwin, with CapacityMesh as its response capability                               |
| Version | 0.1                                                                                   |
| Owners  | Francis Reuben R, Avaneesh, Affan, Vivek — B.Tech CSE, RV University                  |
| Date    | 23 October 2026                                                                       |
| Status  | Hackathon MVP contract; production integrations and service levels require validation |
| Event   | SAP HackFest 2026, RV University college round, Bengaluru                             |
| Track   | Resilient Supply Chains                                                               |
| Pitch   | **See the supply shock coming. Borrow the capacity to survive it.**                   |

## 1. Problem statement

Procurement teams can know their immediate suppliers while remaining unaware that apparently independent suppliers depend on the same upstream plant. When that plant fails, a buyer must establish the true exposure, work out when inventory will run out, find qualified alternatives, and authorize a response across disconnected systems. Visibility that does not lead to an executable response leaves the production line exposed.

ShockTwin connects **Detect → Simulate → Respond → Approve** in one decision workflow. Detect proposes hidden supplier links with confidence and evidence. Simulate translates a specific disruption into inventory, order and revenue consequences. Respond uses CapacityMesh to rank published spare capacity. Approve produces an auditable human decision on a draft purchase order. CapacityMesh is a response step within ShockTwin, not a separate product or pitch.

This MVP demonstrates the workflow using **Illustrative** company, supplier, inventory, signal, capacity, order and price data. It does not establish real supplier relationships, predict a real cyclone, guarantee production continuity or demonstrate realized financial savings.

## 2. Why now

| Evidence from the supplied fact bank                                                                                                                                         | Product implication                                                                                                                                     | Source     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Visibility beyond tier 1 fell from 56% in 2022 to 37% in 2023 to 30% in 2024; only 33% invest in early-warning systems; response to a new disruption averages about 2 weeks. | Make upstream exposure and time remaining visible in the same workspace.                                                                                | [F2]       |
| About 10% of firms see tier-3 suppliers; about two-thirds of disruptions originate at tier 2 or deeper.                                                                      | Surface upstream hypotheses rather than assume tier-1 diversity equals resilience.                                                                      | [F3], [F4] |
| Renesas supplied about 30% of automotive microcontrollers in March 2021. Separately, the overall 2021 chip shortage cost automakers $210B in revenue and 7.7M vehicles.      | Connect a concentrated dependency to a business decision, without attributing the entire chip-shortage loss to one fire.                                | [F1]       |
| Disruptions lasting a month or more occur about every 3.7 years; over a decade they cost about 45% of one year's profits.                                                    | Rehearsal and response deserve a repeatable workflow. These are published context, not ShockTwin impact estimates.                                      | [F5]       |
| India truck empty running is up to 40%; manufacturing capacity utilisation is 74.6%.                                                                                         | Investigate whether available assets can become a qualified response, with no assumption that every unused asset is suitable or commercially available. | [F9]       |
| GNN link prediction has been studied on a real automotive supply network.                                                                                                    | Use the research as a method basis; evaluate this implementation independently on synthetic data.                                                       | [F8]       |

The 74.6% utilisation figure is supplied as RBI OBICUS Q1 2026–27; publication availability and exact series must be checked before external use [VERIFY]. Statistical context is not a product-performance claim.

## 3. Target users and personas

| Persona                                           | Situation and decision                                                                                                           | Needed outcome                                                                                                         | Access                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Priya, procurement head**                       | Illustrative persona at a mid-size Bengaluru auto-parts manufacturer; knows five immediate suppliers and owns response approval. | Understand shared upstream dependency, compare mitigation options, approve or reject a draft with evidence.            | Buyer                                        |
| **Supply-chain planner**                          | Maintains material coverage and rehearses disruptions.                                                                           | Inspect inferred links, adjust scenario severity/duration, understand time-to-stock-out and affected orders.           | Planner                                      |
| **Logistics manager at a capacity-provider firm** | Publishes available transport, warehouse or manufacturing capacity while protecting commercial data.                             | Share a minimal listing, understand its availability and receive qualified interest without exposing raw transactions. | CapacityProvider                             |
| **Plant manager**                                 | Needs reliable material flow and must assess whether alternate production is operationally suitable.                             | Review capacity fit and production-continuity assumptions before procurement commits.                                  | Planner; Buyer only if separately authorized |
| **Tenant administrator**                          | Manages access and operational controls.                                                                                         | Assign roles, inspect audit events and manage tenant configuration.                                                    | Admin                                        |

These personas are design hypotheses. No customer interviews or pilot commitments are claimed.

## 4. Jobs to be done

1. When a new signal threatens a supplier location, help me identify the materials and orders that share the exposure so I can prioritize a response.
2. When a graph proposes an unknown upstream relationship, show its confidence and evidence so I can confirm or reject it instead of treating AI output as fact.
3. When I change a shock's duration, severity or mitigation timing, show the resulting stock trajectory so I can compare alternatives on explicit assumptions.
4. When my own network cannot absorb a shock, find capacity that meets capability, distance, timing and volume constraints so I can evaluate a practical alternative.
5. When an alternative looks viable, draft the procurement action and route it to an authorized human so I can act without losing accountability.
6. When I offer spare capacity, disclose only the information needed for matching so my raw transactions and unrelated commercial relationships remain private.

## 5. Goals and non-goals

### Goals

- Deliver a coherent, replayable five-step local demo with no SAP account or LLM key required.
- Reveal an **Illustrative** hidden resin plant shared by three of Priya's five tier-1 suppliers, using actual synthetic-trained GNN inference and an explicit review state.
- Explain a simulated line stop on day 18 without mitigation and demonstrate continuity through the displayed horizon when full replacement flow begins on day 3 (**Illustrative**).
- Rank capacity candidates transparently, create a draft through an adapter, and record approval or rejection with an audit trail.
- Preserve a clear boundary between measured local behavior, synthetic model evaluation, proposed SAP production capabilities and [VERIFY] deployment prerequisites.
- Keep code, setup instructions, demo script, architecture and presentation behavior consistent.

### Non-goals for v0.1

- Autonomous purchase commitment, automatic supplier qualification, automatic payment, or approval without an authorized human.
- Claiming inferred links are verified commercial relationships or that synthetic model metrics transfer to real networks.
- Live, comprehensive global customs ingestion, real-time weather forecasting, production multi-enterprise federation or a licensed financial-risk model.
- Demonstrating real customer savings, model accuracy without measured evaluation, legal compliance certification or a production uptime guarantee.
- Replacing ERP, APS, transport-management systems or SAP Business Network.
- Sharing raw purchase orders, invoices, supplier-specific demand, internal inventory or competitor strategy through CapacityMesh.

## 6. User stories and acceptance criteria

### Detect

**D1 — Review the known network.** As Priya, I want my immediate suppliers and known dependencies visible before I run detection.

- **Given** the seeded tenant, **when** I open the risk map, **then** I see my company, five tier-1 suppliers, three known tier-2 relationships, a visible “Illustrative” disclosure, and a distinction between known and inferred relationships.
- **Given** no inference has run, **when** I inspect the graph, **then** hidden candidate edges are not represented as confirmed links.

**D2 — Surface and review hidden relationships.** As a planner, I want a model-supported hypothesis that I can inspect.

- **Given** the local ML endpoint is healthy and the synthetic-trained weights exist, **when** I run Detect, **then** candidate relationships return a confidence score, model/version provenance, evidence features and a one-sentence explanation.
- **Given** a candidate crosses the configured display threshold, **when** the graph updates, **then** its edge is dashed amber and its confidence and unconfirmed state are visible.
- **Given** the demonstration fixture and trained model, **when** inference is run, **then** the three seeded hidden relationships are available for review; if a measured score fails the threshold, the UI reports the actual result rather than substituting a fabricated score.
- **Given** a proposed relationship, **when** I confirm or reject it, **then** its review state persists, an audit event records the action, and rejected links do not silently become confirmed simulation dependencies.
- **Given** inference fails, **when** Detect is requested, **then** the app shows a recoverable error and retains the last known graph; any optional cached inference is labelled as cached, never live inference.

### Simulate

**S1 — Quantify exposure.** As a planner, I want to simulate a disruption before inventory is exhausted.

- **Given** the resin material has 18 days of inventory at the seeded daily burn rate, **when** I run the default total-loss cyclone without mitigation for a horizon exceeding 18 days, **then** inventory reaches zero on day 18 and the UI labels the result “Illustrative.”
- **Given** a shock type of cyclone, port closure, strike or fire, **when** I adjust duration and severity within validated bounds and run, **then** the response contains the input assumptions, downstream capacity effects, material inventory series, days-to-stock-out, orders at risk and revenue at risk.
- **Given** an inferred relationship is included, **when** simulation runs, **then** the result discloses that unconfirmed links affect the scenario and allows the user to distinguish hypothesis-based exposure from confirmed exposure.
- **Given** full replacement flow equal to the affected daily requirement begins on day 3, **when** I compare mitigated and unmitigated curves, **then** mitigated stock remains at its day-3 level while replacement covers demand, and no line stop occurs within the displayed horizon. This is not an indefinite guarantee.
- **Given** lower volume, later switching or insufficient duration, **when** I rerun, **then** the curve follows the supplied assumptions rather than always showing success.
- **Given** invalid severity, duration or switch-day input, **when** I submit, **then** the service rejects the request with a useful validation error and no corrupt scenario is saved.

### Respond

**R1 — Find qualified spare capacity.** As Priya, I want a ranked response set with understandable tradeoffs.

- **Given** six seeded listings within 300 km, including three moulding candidates within 150 km, **when** I search for the required capacity, **then** eligible results are ranked by distance, capability fit, available volume, lead time and price band, and each result exposes its score breakdown.
- **Given** an incompatible capacity type or unavailable date range, **when** matching runs, **then** it is excluded or explicitly marked ineligible, never silently presented as a viable response.
- **Given** the federated public listing interface, **when** another tenant reads a listing, **then** only capacity type, location, available dates and price band are exposed. Detailed matching constraints are evaluated privately by the provider/local adapter; raw transactions remain private.
- **Given** no candidates satisfy the request, **when** matching finishes, **then** the UI shows an empty state with the active constraints and allows the planner to revise them.

**R2 — Draft a procurement action.** As Priya, I want a reviewable draft for the chosen candidate.

- **Given** an eligible match, **when** I choose “Draft PO,” **then** the service creates a draft through the S/4HANA adapter, records its source match and scenario, and puts it in the approvals inbox.
- **Given** a repeated request with the same idempotency key, **when** it is retried, **then** the same draft is returned rather than a duplicate commitment.
- **Given** a local run, **when** the draft is created, **then** the UI identifies the local mock and never implies a real ERP purchase was placed.

### Approve

**A1 — Keep commitment human controlled.** As a Buyer, I want the final decision to be explicit and auditable.

- **Given** a pending draft and Buyer authorization, **when** I approve, **then** its status changes once, an audit entry records actor, timestamp, draft identifier and old/new status, and the adapter/workflow result is visible.
- **Given** a pending draft, **when** I reject with a reason, **then** it becomes rejected, no purchase is committed, and the reason is retained in the audit history.
- **Given** a previously decided draft, **when** another approve/reject request arrives, **then** the service returns a conflict or the existing idempotent result without creating another decision.
- **Given** a user without Buyer authorization or another tenant's draft identifier, **when** approval is attempted, **then** access is denied and no state changes.
- **Given** a production integration error, **when** approval delivery fails, **then** the draft remains in an explicit retryable state; approval is not displayed as successful before the downstream outcome is known.

## 7. Functional requirements

P0 is required for the local hackathon flow. P1 adds pilot readiness. P2 is later production expansion. A production-target requirement does not imply that its remote service is provisioned in this repository.

| ID    | Priority | Requirement and completion evidence                                                                                                                                                                                          |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | P0       | Seed/reset one isolated Illustrative tenant, five tier-1 suppliers, three known tier-2 links, hidden resin plant, inventory, orders, six listings and cyclone signal reproducibly.                                           |
| FR-2  | P0       | Provide a Horizon-themed SAPUI5 shell/launchpad sandbox with risk map, simulator, CapacityMesh and approvals views; app navigation preserves workflow state.                                                                 |
| FR-3  | P0       | Expose tenant-scoped graph queries and single-point-of-failure/concentration indicators with the scoring rule visible in the architecture.                                                                                   |
| FR-4  | P0       | Train and save a PyTorch Geometric GraphSAGE or GAT link predictor on a reproducible synthetic graph using negative sampling and a held-out evaluation split.                                                                |
| FR-5  | P0       | Serve actual model predictions with confidence scores and top evidence features; store model version and publish measured synthetic-data metrics with split limitations.                                                     |
| FR-6  | P0       | Render inferred edges as dashed amber, distinguish confidence from review status, and persist human confirm/reject actions.                                                                                                  |
| FR-7  | P0       | Display an Illustrative cyclone signal; support mock news/weather and an optional configurable live-signal adapter without requiring it for local operation.                                                                 |
| FR-8  | P0       | Simulate cyclone, port closure, strike and fire using adjustable severity and duration; propagate capacity loss through dependency shares and burn down material inventory.                                                  |
| FR-9  | P0       | Return baseline and mitigation inventory curves, time-to-survive, time-to-recover assumptions, affected orders and revenue exposure with units, horizon and Illustrative labels.                                             |
| FR-10 | P0       | Publish a minimal capacity envelope and rank matches by explicit weighted factors; show both eligibility and score breakdown.                                                                                                |
| FR-11 | P0       | Create a draft PO with source references and an idempotency key using the local S/4HANA mock adapter.                                                                                                                        |
| FR-12 | P0       | Provide a local approval workflow with approve/reject, role checks, transition validation and audit history; retry preserves the original decision, while ambiguous downstream commitment requires reconciliation.           |
| FR-13 | P0       | Provide deterministic one-sentence risk/link/match explanations when no LLM key is configured; optionally call an OpenAI-compatible endpoint locally. Never let LLM prose alter numeric simulation output or authorize a PO. |
| FR-14 | P0       | Provide SQLite persistence, CAP Node.js services, local mocks and a working ML endpoint under the documented development commands; external network access is unnecessary after dependency installation.                     |
| FR-15 | P0       | Include unit tests for risk, simulation, matching and PO workflow; a GNN smoke test; and one browser/API end-to-end replay through approved draft.                                                                           |
| FR-16 | P0       | Provide lint/format configuration and CI, a reset-and-replay demo command, exact live-demo clicks and a 60-second offline fallback.                                                                                          |
| FR-17 | P0       | Include production profile/configuration for HANA Cloud, XSUAA and Cloud Foundry MTA packaging; document prerequisite entitlements and mark unverified remote deployment as [VERIFY].                                        |
| FR-18 | P1       | Connect tenant-authorized S/4HANA master, purchase-order and inventory data through SAP Integration Suite and destination-based credentials.                                                                                 |
| FR-19 | P1       | Connect PO drafting/approval to SAP Build Process Automation and the real API_PURCHASEORDER_PROCESS_SRV contract, with authenticated retries and downstream reconciliation.                                                  |
| FR-20 | P1       | Deploy model serving/training through SAP AI Core and AI Launchpad, and use Generative AI Hub for risk scoring and explanations subject to configured availability.                                                          |
| FR-21 | P1       | Add SAP HANA graph queries, vector search for authorized news embeddings, operational dashboards and a benchmark at 10,000 supplier nodes.                                                                                   |
| FR-22 | P1       | Establish capacity-provider consent, qualification, freshness and private eligibility evaluation before opening a real cluster pilot.                                                                                        |
| FR-23 | P2       | Expand federation, privacy-preserving partner discovery and scenario calibration using authorized real datasets.                                                                                                             |
| FR-24 | P2       | Add multi-material, multi-period planning, substitute qualification, transport-booking drafts and negotiated capacity reservations.                                                                                          |

## 8. Non-functional requirements

All numbers in this table are **proposed engineering targets**, not measured results or external statistics. The run report must state what was actually measured.

| Area              | v0.1 requirement                                                                                                                                                                                         | Pilot/production validation                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency           | Seeded graph reads and matching target p95 ≤2 seconds; seeded simulation target p95 ≤3 seconds; warm ML inference target p95 ≤5 seconds on a documented local machine. Show progress and bounded errors. | Benchmark realistic node/edge and concurrent-user distributions; define latency budget per dependency [VERIFY].                                |
| Data privacy      | Tenant filters on every private read/write; no raw transactions in public capacity responses, browser logs, LLM prompts or evidence exports. Use Illustrative data locally.                              | Provider contracts, data minimization, retention/deletion and cross-border processing review under DPDP Act 2023 [VERIFY legal applicability]. |
| Explainability    | Every inferred link has confidence, evidence, model/version and human-review state. Synthetic confidence is an uncalibrated model score until calibration is validated.                                  | Calibrate on authorized real data and document threshold tradeoffs; never label a link “true” because its score is high.                       |
| Auditability      | Append an audit event for inference review, draft creation and every approval transition, with actor, UTC time, tenant, correlation ID and before/after state.                                           | Durable SAP Audit Log integration, retention and tamper controls [VERIFY].                                                                     |
| Role-based access | Buyer approves; Planner runs risk/scenarios; CapacityProvider manages its own listings; Admin manages tenant configuration. Local identities are explicitly development-only.                            | XSUAA JWT validation and role collections; negative authorization tests against real bindings.                                                 |
| Uptime            | Local demo has health checks, deterministic fallbacks and a documented offline path; no availability claim.                                                                                              | Proposed monthly target 99.5% after service-plan, failover and operating-model validation [VERIFY]; not a current SLA.                         |
| Scale             | Functional seed remains small and inspectable. Schema/API design must allow pagination and independent model jobs.                                                                                       | Benchmark 10,000 supplier nodes with stated edge count, query workload, memory and latency before claiming support.                            |
| Reliability       | Idempotent draft creation; explicit state transitions; graceful ML/LLM/integration failures; no silent success on downstream failure.                                                                    | Retry/backoff, dead-letter handling, workflow reconciliation and recovery drills.                                                              |
| Security          | Secrets stay in environment/bindings; input is validated; tenant identity comes from trusted auth, not an arbitrary production request header; no auto-approval.                                         | Threat model, penetration test, dependency review and secure destination configuration [VERIFY].                                               |
| Accessibility     | Keyboard-operable controls, visible focus, textual equivalents for charts/graph state, status announced where feasible, and sufficient contrast.                                                         | Formal WCAG 2.2 AA audit [VERIFY]; do not claim certification.                                                                                 |
| Maintainability   | Versioned schema, lockfiles, repeatable seed, meaningful service tests and synchronized docs.                                                                                                            | Migration/rollback rehearsal and integration contract tests.                                                                                   |

## 9. Success metrics

Metrics are instrument definitions. No baseline, customer outcome or target attainment is claimed. The demo uses Illustrative data, and recorded local timings must be identified as local measurements.

| Metric                                  | Definition and denominator                                                                                                             | Measurement and interpretation                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Time-to-detect                          | Elapsed time from accepted signal/inference request to a displayed, reviewable risk finding.                                           | Service timestamps and correlation ID; report warm/cold separately and exclude upstream signal-publication delay only if explicitly stated. |
| Hidden links surfaced per 100 suppliers | Reviewable candidate links / distinct suppliers in the evaluated network ×100.                                                         | Report candidates, confirmations, rejections and unreviewed counts separately. More candidates alone is not better.                         |
| Days of warning gained                  | Projected stock-out timestamp minus the earliest actionable finding timestamp; compare to a documented baseline process if one exists. | Scenario-derived warning is Illustrative; real warning gain requires time-stamped pilot evidence.                                           |
| Time-to-mitigation                      | Time from actionable finding to a human-approved response, plus a separate measure to actual capacity activation.                      | Do not substitute draft creation for operational mitigation. Local demo measures workflow time only.                                        |
| Capacity match rate                     | Requests with at least one eligible, available candidate / all valid capacity requests.                                                | Include zero-match requests; distinguish match suggestion, provider acceptance and fulfilled capacity.                                      |
| PO approval rate                        | Approved drafts / decided drafts; also show pending and rejected drafts.                                                               | Use a fixed observation window; approval is not evidence that the PO was fulfilled or useful.                                               |
| Model quality guardrail                 | Precision, recall and/or ROC-AUC/AP measured on the actual held-out synthetic split, with negative-sampling and leakage caveats.       | Publish only computed values and label **Synthetic-data results**. No research-paper accuracy is asserted.                                  |
| Operational guardrail                   | Failed or duplicated drafts, unauthorized attempts and unresolved integration errors.                                                  | A successful flow must not conceal duplicate commitments or access-control failures.                                                        |

Pilot success thresholds will be agreed after user interviews and baseline collection [VERIFY]. For the hackathon, the primary completion criterion is a reproducible, tested end-to-end workflow rather than a claimed business KPI improvement.

## 10. MVP scope and roadmap

### Hackathon MVP

The local app runs without a SAP account using CAP/SQLite, a freestyle SAPUI5 Horizon interface with locally served OpenUI5 assets and a Fiori launchpad-style sandbox, a local S/4HANA OData mock, mock signals, a real synthetic-trained GNN endpoint, deterministic LLM fallback and local approval workflow. All supplier relationships, signals, capacities, quantities, inventory, orders, price bands and scenario outputs are visibly **Illustrative**. The repository includes SAP deployment descriptors and production adapter boundaries; production provisioning and remote integration are separately verified tasks.

**Frontend contract clarification:** SAP Build Apps is a separate low-code runtime, not a source generator for SAPUI5. The hackathon implementation is authored as SAPUI5 freestyle/Horizon. An optional SAP Build Apps companion and annotation-backed Fiori elements administration are post-MVP integration options [VERIFY]; the team must not claim that the SAPUI5 application was generated by SAP Build Apps. This correction preserves the requested SAP user experience without misrepresenting the tooling.

The mandatory narrative is:

1. Priya sees five suppliers and opens the shared-dependency investigation.
2. Detect surfaces the hidden resin plant; Priya inspects confidence/evidence and confirms the relevant link hypotheses.
3. A cyclone scenario shows day-18 stock-out without action and continuity through the selected horizon with a day-3 full replacement switch.
4. CapacityMesh finds and explains eligible moulding capacity within 150 km; Priya creates a draft.
5. Priya approves the draft, and the inbox and audit trail show the outcome.

### Post-hackathon roadmap

| Stage                           | Outcome                                                                                                                                                          | Exit evidence                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Pilot preparation               | Interview buyers, planners, plant managers and providers in one Bengaluru auto-parts cluster; validate data access, listing consent and operational constraints. | Interview synthesis, signed participation/access terms and agreed baseline metrics [VERIFY].          |
| SAP-connected pilot             | Replace mocks with authorized S/4HANA/Business Network feeds, SAP Build Process Automation and AI Core/Generative AI Hub bindings.                               | Real integration contract tests, tenant/access tests, human approval evidence and deployment runbook. |
| Model and simulation validation | Evaluate authorized real links, confidence calibration, lead times, dependency shares and inventory behavior.                                                    | Held-out evaluation and documented failure modes; planner review of scenario assumptions.             |
| Production readiness            | Benchmark 10,000 nodes, add durable operations, security/privacy review and capacity freshness controls.                                                         | Load report, recovery drill, audit-retention policy and pilot outcome review.                         |
| Expansion                       | Multi-material substitution, booking drafts and broader federated discovery.                                                                                     | Customer-validated prioritization, legal review and measured response outcomes.                       |

No dates, commitments, partner participation or cost savings are promised by this roadmap.

## 11. SAP Design Thinking summary

| Phase         | Work represented in v0.1                                                                                                                                                 | Honest next step                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Empathize** | Published disruption cases and the Illustrative Priya persona establish a provisional view of procurement pain. No interviews have been conducted as part of this brief. | Interview procurement, planning, plant and capacity-provider users; observe an actual disruption response [VERIFY]. |
| **Define**    | Frame the problem as hidden shared dependencies plus slow translation from warning to an approved response.                                                              | Confirm the problem statement and the decision-maker's authority with users.                                        |
| **Ideate**    | Connect link inference, scenario propagation, spare-capacity matching and human approval in one product loop.                                                            | Test whether this sequence matches the team's real decision process and required qualifications.                    |
| **Prototype** | Build the seeded local workflow and a SAP BTP target architecture; record real app screenshots for the pitch.                                                            | Provision SAP services and replace each mock under a controlled pilot.                                              |
| **Test**      | Run service, model-smoke and end-to-end demo tests; inspect readability and failure states. These are engineering tests, not customer validation.                        | Run moderated usability sessions and compare pilot outcomes with the baseline.                                      |

## 12. Risks and mitigations

| Risk                                  | Consequence                                              | Mitigation and residual limitation                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data sparsity and incomplete tiers    | Missing edges or misleading concentration scores.        | Combine authorized sources, expose provenance and missingness, abstain when evidence is weak. Real coverage remains [VERIFY].                                             |
| False-positive inferred links         | Unnecessary escalation or wrong scenario exposure.       | Label hypotheses, display confidence/evidence, offer confirm/reject and separate confirmed from inferred analysis. Human confirmation can itself be mistaken.             |
| Synthetic-to-real domain gap          | Strong synthetic metrics may not generalize.             | Publish actual synthetic results with split design; do not claim real-world accuracy; validate on an authorized network before use.                                       |
| Trust between competitors             | Providers may withhold or misrepresent capacity.         | Minimal public envelope, provider-controlled disclosure, qualification and bilateral confirmation. Federation does not eliminate commercial trust requirements.           |
| CapacityMesh cold start               | No viable alternatives during a disruption.              | Start with a focused cluster and prequalified providers; show zero-match states and non-mesh options. No network-size claim.                                              |
| Privacy and sensitive commercial data | Harm from exposed transactions or personal data.         | Tenant isolation, least privilege, minimal LLM payloads, retention controls and DPDP review. Legal compliance remains subject to counsel [VERIFY].                        |
| Antitrust                             | Capacity sharing could facilitate improper coordination. | Do not expose competitor demand, detailed cost structures or future pricing strategy; use bilateral qualification and legal review before real federation [VERIFY].       |
| Model confidence misread as certainty | Users trust an unsupported upstream relationship.        | Explain scores as model outputs, disclose training domain and preserve review status; calibrate before pilot use.                                                         |
| Simplified simulation                 | Wrong stock-out or revenue estimate.                     | Display burn rates, dependency shares, disruption duration, horizon and replacement assumptions; run sensitivity checks; validate with planners.                          |
| ERP/workflow failures                 | Duplicate drafts or ambiguous commitment.                | Idempotency keys, explicit pending/error states, retry/reconciliation and audit events. Production behavior must be contract-tested.                                      |
| LLM hallucination or prompt injection | Misleading explanations or data leakage.                 | Deterministic fallback, structured bounded output, no authority to change simulation/approval, allowlisted context and no raw documents in shared prompts.                |
| Trial service entitlements            | Deployment may be blocked or differ by region/plan.      | Keep local flow independent; validate service names, plans, quotas, API access and AI availability before the pitch [VERIFY].                                             |
| Pitch headline overstatement          | Judges infer unsupported causal claims or guarantees.    | Notes must clarify that $210B is total chip-shortage impact, the Red Sea was disrupted rather than literally closed, and demo continuity is conditional and Illustrative. |

## 13. Open questions

These questions are recorded for the pilot; they do not block the authorized local hackathon build.

1. Which S/4HANA edition, API version, communication arrangement and purchasing document type will the pilot use? [VERIFY]
2. Which SAP BTP trial region and entitlements provide HANA Cloud, AI Core, Build Process Automation, Integration Suite and Generative AI Hub? [VERIFY]
3. Which real transaction, customs and supplier datasets can the team legally access, retain and use for model training? [VERIFY]
4. What confidence threshold and human-review capacity balance missed dependencies against false alerts on a real network? [VERIFY]
5. Who confirms an inferred relationship, and what evidence is sufficient for a “confirmed” label? [VERIFY]
6. How will moulding qualification, tooling compatibility, quality certification, available volume and provider lead time be validated privately? [VERIFY]
7. What tenant boundary, residency, retention, deletion and consent policies apply to each participant? [VERIFY]
8. Which approval limits, segregation-of-duties rules and ERP commitment semantics apply? [VERIFY]
9. What is the baseline time from signal to operational mitigation, and which pilot KPIs matter most to users? [VERIFY]
10. What is the original study behind the collaboration figures, and what settings/denominators do they describe? [VERIFY]
11. Can the supplied RBI Q1 2026–27 utilisation figure and all published source details be verified before public distribution? [VERIFY]
12. Who will sponsor the proposed Bengaluru auto-parts cluster pilot? No partner or pilot commitment is claimed. [VERIFY]

## 14. Evidence register and claim rules

Use the supplied fact bank as the only source of external quantitative claims. Exact article titles, URLs, sample definitions and publication details not supplied here are [VERIFY]; this document does not fabricate them. Source labels are sufficient for traceability to the brief and must be carried into speaker notes or footnotes.

| ID  | Supplied source and permitted claim                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Reuters, March 2021: Renesas supplied about 30% of automotive microcontrollers. AlixPartners, September 2021: the 2021 chip shortage cost automakers $210B in revenue and 7.7M vehicles. The latter is not solely the loss caused by the Renesas fire.                            |
| F2  | McKinsey Supply Chain Risk Survey 2024: visibility beyond tier 1 was 56% (2022), 37% (2023), 30% (2024); only 33% invest in early warning; average response is about 2 weeks.                                                                                                     |
| F3  | McKinsey, 2022: about 10% of firms see their tier-3 suppliers.                                                                                                                                                                                                                    |
| F4  | McKinsey: about two-thirds of disruptions originate at tier 2 or deeper. Exact report details [VERIFY].                                                                                                                                                                           |
| F5  | McKinsey Global Institute, 2020: month-or-longer disruptions about every 3.7 years; decade cost about 45% of one year's profits; prolonged shock can erase 30–50% of annual EBITDA.                                                                                               |
| F6  | UNCTAD, Red Sea 2024: Suez traffic down 57% from peak by October 2024; Shanghai–Europe spot rates up 256%. Reuters, January 2024: India–Europe container cost about $600 to $1,500. These measures have different periods and must not be presented as one controlled comparison. |
| F7  | Bloomberg, April 2021; Fortune, January 2022: Toyota mapped about 1,500 critical parts after 2011 and kept US production near 90% during the chip crisis, while GM cut about 278,000 units.                                                                                       |
| F8  | Kosasih & Brintrup, International Journal of Production Research, 2022: GNN link prediction on a real automotive supply network. No paper AUC or accuracy is supplied or claimed.                                                                                                 |
| F9  | DPIIT–NCAER Logistics Cost Assessment, 2025: India truck empty running up to 40%; NCAER–DPIIT 2025 estimate: logistics cost 7.97% of GDP. RBI OBICUS, Q1 2026–27: manufacturing capacity utilisation 74.6%. Never use the older 14% logistics-cost figure.                        |
| F10 | Collaboration studies supplied in brief: 25.83% transport-cost reduction; 16–53% asset-sharing savings; 30.8% lead-time reduction. Original studies and applicability [VERIFY]. These are not ShockTwin results.                                                                  |
| F11 | Supplied COVID capacity-sharing case: Skanray and Mahindra, among others, helped India produce about 60,000 ventilators in about three months. Original source details [VERIFY].                                                                                                  |

**Claim rule:** all seeded business values, model-fixture relationships and simulated outcomes carry “Illustrative.” Actual implementation test results carry their test environment and scope. Proposed targets carry “target.” Anything else not established by the fact bank or a recorded test is [VERIFY].
