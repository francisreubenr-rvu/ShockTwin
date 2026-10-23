# ShockTwin presentation QA

## Content and provenance review

The final rendered export passed an independent check against `docs/presentation.json` and the supplied fact bank:

- 14 editable PowerPoint slides, 14 speaker-note blocks and a 14-page PDF.
- Every headline, supporting sentence and exact spoken script is present. Stored note allocations total **450 seconds (7:30)**; the spoken script contains **994 words**, leaving the requested 30-second pitch buffer.
- Full team display includes **Francis Reuben R, Avaneesh, Affan and Vivek**. The closing P-ID is **P2012988948**.
- Three native PowerPoint charts retain the exact data: visibility **56 / 37 / 30%**, container costs **$600 / $1,500**, and both **31-point** simulation series from the real saved API response.
- The chip-shortage total is explicitly separated from the Renesas fire; the Red Sea support/notes say disrupted rather than literally closed; “minutes” describes the demo workflow; the close is aspirational.
- Demo values carry **Illustrative** labels. SAP service layers distinguish the live-cloud target from local SQLite, model/template fallbacks and ERP/workflow mocks. Empathy is described as published cases plus persona, with interviews planned.
- Collaboration figures retain **25.83%** and **30.8%** with unresolved original sources marked `[VERIFY]`; they are not presented as ShockTwin results. RBI and COVID source gaps remain marked `[VERIFY]`.

`docs/DECK_CONTENT_CHECK.json` records the actual slide/PDF text, notes, timing and chart-data checks. The checker compared XML/PDF content, not only the input specification.

## Real app image verification

All four app images were traced to the actual capture provenance. Source hashes match the capture log and builder log. The slide compositions are pixel-identical to the source RGB content after the disclosed crops, and those composition images are embedded in the PowerPoint:

| Slide | Source | Transformation |
|---|---|---|
| 08 | `docs/screenshots/risk-map.png` | Crop `(270, 353, 1588, 892)` to focus on the genuine supplier graph; no data alteration. |
| 09 | `docs/screenshots/simulator.png` | RGB PNG re-encoding; no crop or data alteration. |
| 10 | `docs/screenshots/capacitymesh.png` | Crop `(270, 400, 1882, 1019)` to expose the real ranked match cards. |
| 10 | `docs/screenshots/approval.png` | Crop `(270, 353, 1882, 935)` to expose the actual approved mock draft and audit event. |

The original five captures remain at **1920×1080**, with actual API JSON, UTC actions, synthetic model scores and SHA-256 hashes in `docs/SCREENSHOT_PROVENANCE.json`. No AI-generated UI or fabricated transaction is used. The GIF is an explicitly labelled slideshow of the real captured states.

## Rendering and typography

The production deck canvas is **20×11.25 inches**. All fourteen production backgrounds and all fourteen slide previews are **1920×1080**. The manifest records fourteen distinct background hashes. Headline sizes range from **100 to 146 pt**, within the specified editorial range.

The four font families and their OFL licences are bundled under `fonts/`; the PDF contains the intended Instrument Serif regular/italic, Inter, DM Mono and Silkscreen faces. PowerPoint font embedding is unavailable through python-pptx; install the supplied fonts for editing and use the PDF for projector-safe appearance.

All fourteen slides were visually inspected at full 1920×1080 resolution across review passes; changed slides were inspected again after repairs. The final corrected chart labels and latest-value marker on slides 03/05 were approved. No text overflow, card collisions or weak-contrast findings remain in this reviewed export.

The final PDF font inspection found exactly the four intended families, across six faces: Instrument Serif regular/italic, Inter regular/semibold, DM Mono and Silkscreen. Earlier default chart fonts and the minus-glyph fallback were corrected. Visibility labels 56% / 37% / 30% and cost labels $600 / $1,500 are displayed directly; all simulation points remain native chart data.

The final content/provenance check completed at **15:32 UTC on 23 October 2026**, with **zero unresolved findings**. Exact PowerPoint/PDF hashes, font names, source-image pixel checks and all 1920×1080 dimension checks are recorded in `docs/DECK_CONTENT_CHECK.json`. This QA statement applies to those hashed exports; re-run the checks after rebuilding.

## Material limits

Published source detail marked `[VERIFY]` still requires original-source verification. The deck demonstrates the tested local workflow with Illustrative data and a synthetic-trained model; it does not claim a live SAP deployment, measured customer savings, validated real-world link accuracy or an agreed pilot. The 7:30 duration is a speaker allocation and script, not a measured recording.
