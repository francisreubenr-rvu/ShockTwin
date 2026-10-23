# ShockTwin — Presentation Build Spec

**Version 0.1 · 23 October 2026 · 14 slides · 7:30 spoken + 0:30 buffer · SAP HackFest 2026**

## Production contract

Build an editable `presentations/ShockTwin_SAP_HackFest.pptx`, a matching PDF, PNG slide previews, a reproducible Python-pptx build script and font installation notes. `presentation.json` is the machine-readable content contract; script timings total exactly 450 seconds. Target delivery is approximately 120–140 spoken words/minute, with pauses and live clicks inside each allocation. Do not accelerate beyond intelligibility to fill an animation. Rehearse to the timing; no recorded speech duration is claimed by the script alone.

Use a **20 × 11.25 inch** 16:9 canvas. Coordinate values below are inches; multiply by 96 for a 1920×1080 reference. Generate fourteen unique full-bleed 1920×1080-or-larger scenes. Do not reuse, mirror or recolour one scene as another slide. All background prompts share the palette and negative-space contract. Images contain no text, charts, logos or watermarks. Bake a soft dark left gradient and top/bottom vignette into each placed background, preserving detail on the subject side.

Typography: Instrument Serif regular/italic for headlines, 90–110 pt on this canvas (up to 150 pt only on short headlines); tight 0.90–0.95 leading. Exact accent substring is italic and #FFB05C. Inter 22–28 pt for the single support sentence and card prose. DM Mono 11–15 pt for eyebrows, labels, nav and sources; 9–11 pt for dense sources. Silkscreen 30–56 pt for hero numerals. Ship regular/italic fonts and their licences in `presentations/fonts/` if embedding is unavailable. The PDF is the projector-safe visual reference. Never convert the headline/stat text to a picture.

**Global coordinates:** full-bleed background (0,0,20,11.25); hairline frame (0.35,0.35,19.30,10.55); logo/wordmark area (0.70,0.64,3.5,0.4); centered nav (7.00,0.68,7.0,0.35); counter (18.20,0.62,1.0,0.4). Eyebrow pill (0.80,1.55,fit-to-text,0.46). Standard headline box (0.80,2.30,9.1,4.3); exact line breaks must retain complete words. Support (0.85,6.65,8.4,0.85), maximum 24 words and at most one sentence. Standard right device/card zone (10.45,2.30,8.65,6.5); bottom stats band (0.85,8.00,18.25,2.1). Layout may use the bottom band when a long headline needs the whole left zone; no device overlaps the headline. Always keep at least 0.35 inch between text and adjacent cards.

**Chrome on every slide:** thin white frame at 45% opacity; native half-filled-circle logo plus SHOCKTWIN wordmark; nav Problem / ShockTwin / SAP / Impact, with active section underlined amber; native page counter `01 / 14` etc.; bottom-left `SAP HACKFEST 2026 · RV UNIVERSITY`; bottom-right `RESILIENT SUPPLY CHAINS`; bottom-center slide-specific source. Event/date/counter/phase ordinals are editorial metadata from the brief, not statistics. Place counter numerals over a tiny glass backing to honor the numeral treatment.

**Glass:** crop the exact background region behind each card, Gaussian blur it, composite a 12–20% white or near-black tint, clip to a 0.23–0.29-inch rounded rectangle, then place native editable text/shapes above it. Add a native 2 px-equivalent white hairline at 45% opacity. Label top-left, value below; inset content 0.22 inch. Every number, chart and diagram sits within glass, including the numerical hook headline region. Pill eyebrows have a frosted fill, amber dot and mono caps. White callout dot and outer ring are joined by a 2 px leader to a card; leaders must not cross text.

**Charts:** slides 03 and 05 use native PowerPoint line/bar charts. Slide 09 uses a native line chart populated from the real simulation API in addition to the real screenshot; save its input JSON for provenance. White strokes, transparent plot area, no top/right spines, faint gridlines and direct labels. Amber marks only the decisive point/series segment. No legend. Baseline and mitigation are labelled at their endpoints in white/amber according to the decisive-point rule; the day-18 failure marker is amber. All numerical axes/labels are within the chart's glass card and inherit its source. On-screen graph scores and table numbers inside app screenshots are sourced `Illustrative local app / synthetic model`; screenshots remain unaltered except cropping/scaling.

**Screenshots:** run Playwright at 1920×1080. Slide 08 captures real inferred shared-plant graph; slide 09 captures real baseline/mitigation curves; slide 10 captures actual ranked matches and a genuinely approved mock draft. Device screenshots may be placed as pictures, but surrounding title, captions, values and diagram labels remain native text. Never fabricate a screen or replace model scores. Document screenshot capture state/time and demo source in the run report.

**Honesty:** retain the exact requested headlines, with explicit qualifiers. Slide 02's $210B refers to the whole 2021 chip shortage, not damage attributable solely to the Renesas fire. Slide 05's “closed” is a rhetorical headline; the support and notes explicitly state disrupted, not literally closed. Slide 10's minutes is local workflow timing, not a promise of physical activation. Slide 14 is an aspiration, not a guarantee. Use exact 25.83% from the fact bank on slide 13; this intentionally avoids rounding the requested 25.8%. All collaboration/COVID original source gaps carry [VERIFY]. All demo results carry “Illustrative.”

**Validation:** render every slide using LibreOffice headless, export PDF and PNGs, inspect every slide at full size and in a contact sheet, and fix overflows, clipping, collisions, weak contrast and image-subject obstruction. Verify 14 unique backgrounds, 14 notes blocks, exact 450-second timing sum, native text/charts, actual screenshots, fonts bundle and source visibility. Re-render after repairs. Do not call the finished deck clean until it has been inspected.

## Timing and slide specifications

### 01 — See the shock before it hits.

**Target:** 25 seconds · 0:00–0:25 · Active nav: Problem.

**Headline:** See the shock before it hits. Set **“before it hits.”** in Instrument Serif italic, amber.

**Eyebrow:** `01 · VISION`.

**Only supporting sentence:** See the supply shock coming; borrow the capacity to survive it.

**Numbers/content cards and sources:**

- `PRODUCT` — **ShockTwin**. Source: Supplied brief.
- `TEAM` — **Francis Reuben R · Avaneesh · Affan · Vivek**. Source: Latest supplied team brief.

**Layout:** Headline left; product glass card lower-left; team glass card lower-right. White ring dot on ship (15.5,5.0), thin leader to product card. No data numeral outside glass. Apply the global coordinates; device cards begin at x=10.45. For slide 01, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A floating moss-covered cargo ship drifting among luminous coral clouds, viewed through a monumental dark sea cave; ship at right-middle, layered teal sea below, cave framing the scene and calm dark left wall for title.

**Footer source line:** Event, team and product: supplied brief · P-ID P2012988948

**Exact spoken notes (25 seconds):**

> Good morning. We are Francis, Avaneesh, Affan and Vivek from RV University. This is ShockTwin: see the supply shock coming, borrow the capacity to survive it. Imagine a supplier map that can reveal the dependency nobody showed you, rehearse its failure, and help you approve a practical response before your production line stops.

### 02 — One fire. $210 billion lost.

**Target:** 35 seconds · 0:25–1:00 · Active nav: Problem.

**Headline:** One fire. $210 billion lost. Set **“$210 billion lost.”** in Instrument Serif italic, amber.

**Eyebrow:** `02 · THE COST`.

**Only supporting sentence:** The total reflects the overall chip shortage in 2021, not the loss attributable to one fire.

**Numbers/content cards and sources:**

- `2021 CHIP SHORTAGE` — **$210B**. Source: AlixPartners, Sep 2021; overall shortage.
- `VEHICLES NOT BUILT` — **7.7M**. Source: AlixPartners, Sep 2021.
- `AUTOMOTIVE MCU SHARE` — **~30%**. Source: Reuters, Mar 2021; Renesas.

**Layout:** Headline left with glass scrim behind the $210B headline portion. Supporting sentence below. Two stat cards lower-left for 7.7M and ~30%; factory subject stays far right. Put year in source label/card. Apply the global coordinates; device cards begin at x=10.45. For slide 02, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. An abandoned cathedral-like automotive factory, vaulted roof and immense quiet assembly hall, unfinished cars at right, warm light crossing dusty lavender air, empty production line stretching into teal shadow; clear dark left aisle for title.

**Footer source line:** Reuters, Mar 2021 · AlixPartners, Sep 2021 · Overall shortage impact, not fire-only loss

**Exact spoken notes (35 seconds):**

> In March 2021, fire hit Renesas, a firm supplying about thirty percent of automotive microcontrollers. That concentration exposed how one upstream facility could affect many manufacturers. Separately, AlixPartners estimated the entire 2021 chip shortage cost automakers two hundred and ten billion dollars and seven point seven million vehicles. We are not attributing that whole loss to one fire. The lesson is that a small-looking upstream dependency can become a system-wide production problem.

### 03 — Most firms can't see past tier 1.

**Target:** 30 seconds · 1:00–1:30 · Active nav: Problem.

**Headline:** Most firms can't see past tier 1. Set **“past tier 1.”** in Instrument Serif italic, amber.

**Eyebrow:** `03 · VISIBILITY`.

**Only supporting sentence:** Beyond-tier-one visibility is shrinking when upstream exposure matters most.

**Numbers/content cards and sources:**

- `2022` — **56%**. Source: McKinsey Supply Chain Risk Survey 2024.
- `2023` — **37%**. Source: McKinsey Supply Chain Risk Survey 2024.
- `2024` — **30%**. Source: McKinsey Supply Chain Risk Survey 2024.

**Layout:** Headline upper-left; one wide glass native line-chart card lower-right. Direct labels 2022 56%, 2023 37%, 2024 30%; only latest point amber. No legend. Apply the global coordinates; device cards begin at x=10.45. For slide 03, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Native chart data:** x-axis 2022 / 2023 / 2024; y-axis 56 / 37 / 30 percent. Axis years and every point inherit McKinsey Supply Chain Risk Survey 2024. Label latest point amber.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A lantern-lit stone causeway vanishing into thick lavender sea fog, causeway beginning right foreground and disappearing toward upper center, coral dusk horizon, restrained amber lantern light; quiet dark water and fog at left.

**Footer source line:** McKinsey Supply Chain Risk Survey 2024

**Exact spoken notes (30 seconds):**

> Yet visibility is moving in the wrong direction. McKinsey's survey reports visibility beyond tier one falling from fifty-six percent in 2022, to thirty-seven percent, to thirty percent in 2024. This is not a forecast; it is the published survey series. If a purchasing dashboard stops at direct suppliers, it can display several alternatives while missing the single upstream dependency that makes them fail together.

### 04 — The danger sits below the surface.

**Target:** 30 seconds · 1:30–2:00 · Active nav: Problem.

**Headline:** The danger sits below the surface. Set **“below the surface.”** in Instrument Serif italic, amber.

**Eyebrow:** `04 · THE BLIND SPOT`.

**Only supporting sentence:** The shared dependency you cannot see can stop the production you can.

**Numbers/content cards and sources:**

- `DISRUPTIONS AT TIER 2+` — **~2/3**. Source: McKinsey [exact report VERIFY].
- `SEE TIER 3` — **~10%**. Source: McKinsey, 2022.
- `RESPONSE TIME` — **~2 weeks**. Source: McKinsey Supply Chain Risk Survey 2024.

**Layout:** Headline left; large ~2/3 glass card lower-right, callout anchored to underwater mass. Two compact cards below left for ~10% and ~2 weeks. Preserve iceberg silhouette. Apply the global coordinates; device cards begin at x=10.45. For slide 04, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A monumental iceberg in a teal sea shown in a believable cinematic above-and-below-water cutaway; small visible tip at upper right, huge hidden underwater mass at lower right, coral-lavender sky; calm deep dark water on left.

**Footer source line:** McKinsey [report details VERIFY] · McKinsey 2022 · McKinsey Supply Chain Risk Survey 2024

**Exact spoken notes (30 seconds):**

> The iceberg is the problem. About two-thirds of disruptions originate at tier two or deeper, according to McKinsey. Only about ten percent of firms see their tier-three suppliers, and the average response to a new disruption is about two weeks. These measures come from different published observations, not one experiment. ShockTwin asks a practical question: can a buyer identify a consequential hidden dependency and act while inventory still gives them time?

### 05 — The Red Sea closed. India paid.

**Target:** 30 seconds · 2:00–2:30 · Active nav: Problem.

**Headline:** The Red Sea closed. India paid. Set **“India paid.”** in Instrument Serif italic, amber.

**Eyebrow:** `05 · ROUTE RISK`.

**Only supporting sentence:** Disrupted shipping routes transmitted cost pressure to Indian supply chains; the sea was not literally closed.

**Numbers/content cards and sources:**

- `INDIA–EUROPE CONTAINER` — **$600 → $1,500**. Source: Reuters, Jan 2024; approximate costs.
- `SUEZ TRAFFIC` — **−57%**. Source: UNCTAD; from peak to Oct 2024.
- `SHANGHAI–EUROPE SPOT` — **+256%**. Source: UNCTAD, 2024.

**Layout:** Headline upper-left; native two-bar cost chart in glass lower-right, directly labelled $600 and $1,500. Two compact stats beneath left. Clarifying support must remain visible. Apply the global coordinates; device cards begin at x=10.45. For slide 05, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Native chart data:** two bars, `Earlier reported cost` 600 and `Later reported cost` 1500, USD/container; Reuters January 2024. Approximate figures, not a time-series extrapolation.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A container ship passing through a dramatic red-cliff strait, ship right-middle dwarfed by coral sandstone walls, teal water and lavender haze, amber late light on cliff rims; broad quiet shadow at left for editorial title.

**Footer source line:** Reuters, Jan 2024 · UNCTAD, 2024 · Different measures and periods

**Exact spoken notes (30 seconds):**

> The Red Sea illustrates how a distant route becomes a local cost. The sea was disrupted, not literally closed. UNCTAD reports Suez traffic down fifty-seven percent from its peak by October 2024 and Shanghai–Europe spot rates up two hundred and fifty-six percent. Reuters reported India–Europe container costs moving from about six hundred to fifteen hundred dollars in January. Different periods, different measures, one message: geography does not contain supply-chain consequences.

### 06 — Toyota survived because it had a map.

**Target:** 30 seconds · 2:30–3:00 · Active nav: Problem.

**Headline:** Toyota survived because it had a map. Set **“had a map.”** in Instrument Serif italic, amber.

**Eyebrow:** `06 · THE COUNTEREXAMPLE`.

**Only supporting sentence:** Mapping upstream dependencies can turn a hidden concentration into a decision.

**Numbers/content cards and sources:**

- `CRITICAL PARTS MAPPED` — **~1,500**. Source: Bloomberg Apr 2021 / Fortune Jan 2022.
- `US OUTPUT KEPT` — **~90%**. Source: Bloomberg Apr 2021 / Fortune Jan 2022.
- `GM UNITS CUT` — **~278,000**. Source: Bloomberg Apr 2021 / Fortune Jan 2022.

**Layout:** Headline left; three glass stat cards along lower band, clear of cartographer at far right. Leader from mapped-parts card toward valley threads. Apply the global coordinates; device cards begin at x=10.45. For slide 06, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A lone cartographer on a grassy hill at right overlooking a valley of faint glowing route threads beneath a snow volcano, teal valley shadows, lavender and coral dawn sky, warm amber map light; open left sky and hillside.

**Footer source line:** Bloomberg, Apr 2021 · Fortune, Jan 2022

**Exact spoken notes (30 seconds):**

> There is a useful counterexample. After 2011, Toyota mapped about fifteen hundred critical parts. During the chip crisis it kept US production near ninety percent, while GM cut about two hundred and seventy-eight thousand units. The cited reporting does not prove that mapping alone caused that difference. It shows why upstream knowledge deserves attention. Our aim is to make mapping actionable through a connected warning, rehearsal and response workflow.

### 07 — Meet ShockTwin.

**Target:** 20 seconds · 3:00–3:20 · Active nav: ShockTwin.

**Headline:** Meet ShockTwin. Set **“ShockTwin.”** in Instrument Serif italic, amber.

**Eyebrow:** `07 · DETECT · SIMULATE · RESPOND`.

**Only supporting sentence:** One connected loop: Detect, Simulate, Respond.

**Numbers/content cards and sources:**

- `01` — **Detect**. Source: Supplied product loop; ordinal.
- `02` — **Simulate**. Source: Supplied product loop; ordinal.
- `03` — **Respond**. Source: Supplied product loop; ordinal.

**Layout:** Headline upper-left; three equal glass cards lower band: 01 Detect, 02 Simulate, 03 Respond. These are product ordinals, not measured values. Keep constellation visible above. Apply the global coordinates; device cards begin at x=10.45. For slide 07, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A view through a vintage train window onto mountains at dusk, a subtle constellation network of warm lights in the sky over the right side, teal cabin frame and coral-lavender horizon; uncluttered dark left window/cabin area.

**Footer source line:** Product workflow: supplied brief · Implementation: repository

**Exact spoken notes (20 seconds):**

> Meet ShockTwin. Detect proposes hidden upstream links. Simulate translates a shock into material and order consequences. Respond brings CapacityMesh into that same workflow, finding spare capacity and preparing an action for human approval. We are demonstrating one product, with one continuous decision loop, rather than two disconnected tools.

### 08 — Find the suppliers you never knew.

**Target:** 40 seconds · 3:20–4:00 · Active nav: ShockTwin.

**Headline:** Find the suppliers you never knew. Set **“you never knew.”** in Instrument Serif italic, amber.

**Eyebrow:** `08 · 01 · DETECT`.

**Only supporting sentence:** Illustrative: three immediate suppliers share one hidden resin plant.

**Numbers/content cards and sources:**

- `IMMEDIATE SUPPLIERS` — **5**. Source: Illustrative seeded dataset.
- `SHARED UPSTREAM PLANT` — **1**. Source: Illustrative seeded dataset.
- `DEPENDENT SUPPLIERS` — **3 of 5**. Source: Illustrative seeded dataset.

**Layout:** Headline left; real 1920x1080 risk-map screenshot in right glass device card. Crop only app viewport/empty margin; do not redraw scores or hide Illustrative status. Lower-left compact card says 3 of 5. Ring leader to shared plant in screenshot. Apply the global coordinates; device cards begin at x=10.45. For slide 08, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Real screenshot assets:** `docs/screenshots/risk-map.png`. Capture from the running app after the relevant workflow action.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A vast night sky above layered teal mountains, tiny warm constellation points naturally converging above one distant valley plant on right; lavender twilight and a hint of coral horizon, restrained amber light; calm dark left sky.

**Footer source line:** Illustrative local demo · Synthetic GraphSAGE scores · Kosasih & Brintrup, IJPR 2022

**Exact spoken notes (40 seconds):**

> Meet Priya, our illustrative procurement head at a Bengaluru auto-parts manufacturer. She starts with five immediate suppliers. We run the model and reveal a candidate shared resin plant behind three of them. The dashed edges carry actual synthetic-model scores and evidence; they are hypotheses, not verified commercial relationships. Priya can confirm or reject them. Our GraphSAGE model is trained on synthetic data; its measured test results are labelled accordingly. The research basis is supplier-network link prediction by Kosasih and Brintrup, not a borrowed accuracy claim.

### 09 — War-game the storm before it lands.

**Target:** 45 seconds · 4:00–4:45 · Active nav: ShockTwin.

**Headline:** War-game the storm before it lands. Set **“before it lands.”** in Instrument Serif italic, amber.

**Eyebrow:** `09 · 02 · SIMULATE`.

**Only supporting sentence:** Illustrative: a day-three replacement switch avoids a line stop through the displayed simulation horizon.

**Numbers/content cards and sources:**

- `BASELINE STOCK-OUT` — **Day 18**. Source: Illustrative local simulation.
- `REPLACEMENT STARTS` — **Day 3**. Source: Illustrative local simulation.
- `HORIZON` — **30 days**. Source: Illustrative local simulation; design horizon.

**Layout:** Headline left; real simulator screenshot in right glass device card; native line chart in lower-left glass card with baseline and day-3 switch, direct labels and all daily points from actual API output. Day-18 failure point amber. Apply the global coordinates; device cards begin at x=10.45. For slide 09, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Real screenshot assets:** `docs/screenshots/simulator.png`. Capture from the running app after the relevant workflow action.

**Native chart data:** use all 31 daily points (day 0–30) returned by the actual default simulation. Default baseline starts 1,800 and reaches 0 on day 18; mitigation reaches 1,500 at day 3 and stays there under full replacement. Units, dates/day ticks and values are Illustrative, sourced to the real local API output. If implementation changes, update this spec and headline qualifier before export.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A powerful cyclone advancing toward a sunlit valley factory on far right, huge lavender storm spiral in the upper distance, teal hills and coral sky opening at the horizon, warm amber factory light; calm dark left slope for text.

**Footer source line:** Illustrative local simulation · Assumptions and real app result in screenshot

**Exact spoken notes (45 seconds):**

> Now we rehearse the cyclone. This is the real simulator, using illustrative inputs: eighteen hundred resin units and demand of one hundred units per day. Under the default full-loss shock, baseline stock reaches zero on day eighteen. Switch on replacement flow after day three, and the curve holds at fifteen hundred units because replacement covers daily demand. That avoids a line stop through this displayed horizon. It is conditional on timing, volume and availability, not a promise of endless continuity. We can change severity, duration and switch timing to see where the plan fails.

### 10 — Borrow capacity in minutes, not weeks.

**Target:** 45 seconds · 4:45–5:30 · Active nav: ShockTwin.

**Headline:** Borrow capacity in minutes, not weeks. Set **“in minutes,”** in Instrument Serif italic, amber.

**Eyebrow:** `10 · 03 · RESPOND · CAPACITYMESH`.

**Only supporting sentence:** CapacityMesh turns a qualified match into a human-approved draft; minutes describes the demo workflow, not physical activation.

**Numbers/content cards and sources:**

- `TRUCK EMPTY RUNNING` — **Up to 40%**. Source: DPIIT–NCAER Logistics Cost Assessment, 2025.
- `MANUFACTURING UTILISATION` — **74.6%**. Source: RBI OBICUS Q1 2026–27 [VERIFY source availability].
- `VENTILATORS / TIME` — **~60,000 / ~3 months**. Source: Supplied COVID sharing case [original source VERIFY].

**Layout:** Headline left; real ranked-match screenshot right-upper and real approved-draft screenshot right-lower, each device-framed glass. Three compact context cards bottom-left; preserve screenshot readability. Record separate states without implying simultaneous app view. Apply the global coordinates; device cards begin at x=10.45. For slide 10, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Real screenshot assets:** `docs/screenshots/capacitymesh.png`, `docs/screenshots/approval.png`. Capture from the running app after the relevant workflow action.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. An Indian highway at dusk with a few trucks on right, industrial rooftops across a teal valley linked by faint warm glowing threads, lavender and coral sky, amber road light; a broad dark quiet left hillside for typography.

**Footer source line:** DPIIT–NCAER 2025 · RBI OBICUS Q1 2026–27 [VERIFY] · COVID case source [VERIFY]

**Exact spoken notes (45 seconds):**

> CapacityMesh is the response step. We request suitable moulding capacity, inspect the eligible matches and see exactly how capability, distance, volume, lead time and price band affect ranking. Only minimal capacity envelopes are public; raw transactions stay private. Priya drafts a purchase order, reviews it in the inbox and approves it, leaving an audit trail. The local ERP is explicitly a mock. India's empty-running and utilisation figures suggest capacity worth investigating, while the ventilator collaboration shows precedent. They do not prove every idle asset is usable, and our minutes headline describes the demonstrated workflow, not physical production activation.

### 11 — Built on SAP BTP.

**Target:** 35 seconds · 5:30–6:05 · Active nav: SAP.

**Headline:** Built on SAP BTP. Set **“SAP BTP.”** in Instrument Serif italic, amber.

**Eyebrow:** `11 · SAP BTP`.

**Only supporting sentence:** One decision workflow, with human approval at the boundary of action.

**Numbers/content cards and sources:**

- `UI` — **SAPUI5 / Horizon**. Source: Project target/implementation.
- `AGENT` — **Build Process Automation**. Source: SAP target; local fallback.
- `APP` — **CAP / Node.js**. Source: Project target/implementation.
- `AI` — **AI Core / Gen AI Hub**. Source: SAP target; local GraphSAGE/template fallback.
- `DATA` — **HANA Cloud**. Source: SAP target; SQLite local.
- `SOURCE` — **Integration Suite / S/4HANA**. Source: SAP target; mocks local.

**Layout:** Headline left; six stacked glass layers at right: UI, Agent, App, AI, Data, Source. AI layer receives amber border/label; all other strokes white. Local/target qualifier remains in support/source. Apply the global coordinates; device cards begin at x=10.45. For slide 11, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A classical temple rising from a misty teal sea, temple on far right with six visually coherent terraces but no lettering, lavender-coral sky and warm amber light through columns; calm shaded left sea and sky.

**Footer source line:** SAP target architecture: project design · Live cloud integration [VERIFY]

**Exact spoken notes (35 seconds):**

> The target platform is SAP BTP. SAPUI5 provides the Horizon interface; CAP owns the domain services; HANA Cloud holds graph, vector and relational data; AI Core and AI Launchpad host the model; and Generative AI Hub supports bounded explanations. Integration Suite connects enterprise and external sources, while Build Process Automation routes approval. Today the complete local flow runs with SQLite and explicit mocks. Live SAP service bindings and purchasing semantics still require verification. Human authorization remains the final control.

### 12 — Designed step by step with empathy.

**Target:** 25 seconds · 6:05–6:30 · Active nav: SAP.

**Headline:** Designed step by step with empathy. Set **“with empathy.”** in Instrument Serif italic, amber.

**Eyebrow:** `12 · DESIGN THINKING`.

**Only supporting sentence:** Published cases informed the persona; interviews and a cluster pilot are planned.

**Numbers/content cards and sources:**

- `EMPATHIZE` — **Published cases + persona**. Source: Project process record.
- `DEFINE` — **Hidden dependency + response gap**. Source: Project process record.
- `IDEATE` — **One connected loop**. Source: Project process record.
- `PROTOTYPE` — **Working local app**. Source: Real build; validate before final export.
- `TEST` — **Engineering tests; interviews next**. Source: Project process record.

**Layout:** Headline upper-left; five glass phase cards arranged across lower half with short labels only. Stepping stones remain visible through gaps. No invented interview count. Apply the global coordinates; device cards begin at x=10.45. For slide 12, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. Five elegant stepping stones crossing a mirror lake toward a mountain on right, teal water reflecting lavender and coral dusk, amber light at the distant shore; spacious calm dark left reflection for headline.

**Footer source line:** Project process record · Published cases and persona; interviews planned

**Exact spoken notes (25 seconds):**

> We followed the five Design Thinking phases honestly. Empathy currently comes from published cases and our Priya persona, not completed interviews. We defined the hidden-dependency and response gap, explored a connected loop, built the prototype and tested its engineering flow. Next come interviews and a real cluster pilot. We will not present automated tests as customer validation.

### 13 — What resilience is worth.

**Target:** 30 seconds · 6:30–7:00 · Active nav: Impact.

**Headline:** What resilience is worth. Set **“resilience”** in Instrument Serif italic, amber.

**Eyebrow:** `13 · VALUE CONTEXT`.

**Only supporting sentence:** Published context motivates the product; these are not measured ShockTwin savings.

**Numbers/content cards and sources:**

- `DECADE DISRUPTION COST` — **~45%**. Source: MGI 2020; fraction of one year’s profits.
- `LEAD TIME` — **−30.8%**. Source: Collaboration study supplied in brief [original source VERIFY].
- `TRANSPORT COST` — **−25.83%**. Source: Collaboration study supplied in brief [original source VERIFY].
- `MONTH-LONG SHOCK` — **~Every 3.7 years**. Source: MGI, 2020.

**Layout:** Headline upper-left; four glass stats in a 2x2 grid occupying lower-right/center. Each includes its exact short source; original collaboration sources marked [VERIFY]. No implied ShockTwin savings. Apply the global coordinates; device cards begin at x=10.45. For slide 13, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A sunrise harbour with cargo vessels and cranes clustered at far right, broad teal water, lavender-coral dawn sky and restrained amber sunlight, painterly quiet sense of recovery; dark calm foreground and left sky.

**Footer source line:** MGI 2020 · Collaboration studies from brief [original sources VERIFY] · Not product results

**Exact spoken notes (30 seconds):**

> The stakes are substantial, but these are published context, not our results. McKinsey estimates month-long disruptions about every three point seven years and decade losses around forty-five percent of one year's profits. The brief also supplies collaboration-study reductions in lead time and transport cost; their original studies still need verification. We will measure ShockTwin by warning gained, mitigation time, qualified matches and completed human decisions, rather than borrow those percentages as promised savings.

### 14 — Never be surprised again.

**Target:** 30 seconds · 7:00–7:30 · Active nav: Impact.

**Headline:** Never be surprised again. Set **“surprised again.”** in Instrument Serif italic, amber.

**Eyebrow:** `14 · NEXT STEP`.

**Only supporting sentence:** Next: a BTP-connected prototype and a pilot with one Bengaluru auto-parts cluster.

**Numbers/content cards and sources:**

- `NEXT STEP` — **BTP + cluster pilot**. Source: Proposed project plan; no partner commitment.
- `TEAM` — **Francis Reuben R · Avaneesh · Affan · Vivek**. Source: Latest supplied brief.
- `P-ID` — **P2012988948**. Source: Supplied brief.

**Layout:** Headline left; next-step glass card lower-left and team/P-ID glass card lower-right. Keep maple/figure visible at far right. Aspirational headline explained in notes. Apply the global coordinates; device cards begin at x=10.45. For slide 14, lower-band cards divide the 18.25-inch width equally with 0.25-inch gutters; the one-sentence support remains outside the cards and clear of the chart.

**Background image prompt:** Cinematic painterly matte painting, hand-painted animation and classical landscape influences, slightly surreal yet coherent, 16:9 landscape, at least 1920x1080. Consistent teal, lavender and coral palette with warm amber light. One scene only. No text, numbers, logos, watermarks, UI or borders. Keep left 45 percent calm for typography and protect the main subject on the far right. A snow volcano under a lavender and coral sky, a red maple and small solitary figure on a green hill at far right, teal valley shadows and warm amber dawn; spacious calm left hillside and sky for closing title.

**Footer source line:** Team, P-ID and proposed next step: supplied brief · Pilot commitment [VERIFY]

**Exact spoken notes (30 seconds):**

> We want to make this workflow real for one Bengaluru auto-parts cluster: a BTP-connected prototype, authorized data, qualified capacity providers and a measured pilot. Our closing line is an aspiration, not a guarantee that every surprise disappears. ShockTwin helps teams see the supply shock coming and borrow the capacity to survive it. We are Francis, Avaneesh, Affan and Vivek. Thank you.

The spoken allocations total **7:30**. Keep **7:30–8:00** unallocated as buffer for transitions, a slow click or a brief recovery. Do not add another spoken closing paragraph.
