# ShockTwin pitch assets

The finished deck is `ShockTwin_SAP_HackFest.pptx`, with a matching projector-safe PDF, fourteen 1920×1080 PNG previews and `previews/contact-sheet.png`.

The PowerPoint keeps headlines, labels, figures, borders and charts editable. App screenshots and painterly backgrounds are images. Three charts are native PowerPoint charts: published visibility, India–Europe container cost, and the real local simulation series.

## Rebuild

Install the fonts as described in [fonts/INSTALL.md](fonts/INSTALL.md), then:

```bash
python -m pip install -r presentations/requirements.txt
python presentations/build_deck.py --render
```

The export step requires LibreOffice headless and `pdftoppm` on `PATH`. In the build workspace, `/workspace/.tools/soffice` is also detected. Install these tools normally on another laptop. Font embedding is unavailable through python-pptx, so the bundled static fonts and PDF preserve the appearance.

The builder consumes the fourteen distinct `backgrounds/slide-01.png` … `slide-14.png` images, the real screenshot files under `docs/screenshots/`, exact content/timings from `docs/presentation.json`, and `docs/screenshots/simulation-result.json`. It stops if an input is absent. Raw background generation provenance and original images are retained alongside the production backgrounds.

`manifest.json` records inputs, hashes, the native chart count and timing validation. `layout-report.json` records native text boxes and measured fit checks. After every rebuild inspect all previews; automated fit checks do not replace visual review. `QA.md` records the review and material limitations.

All business data in app screenshots and the simulation chart is **Illustrative**. Model scores originate from synthetic-data training and do not establish real supplier relationships. Published figures retain their supplied source lines; unresolved original source details remain `[VERIFY]`.
