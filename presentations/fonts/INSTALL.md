# ShockTwin presentation fonts

Install the bundled `.ttf` files before editing the PowerPoint file. The PDF and PNG previews preserve the approved appearance without requiring font installation.

- **Windows:** select the static font files, right-click, Install for all users.
- **macOS:** open the static fonts in Font Book and choose Install.
- **Linux:** copy the static fonts into `~/.local/share/fonts/shocktwin/`, then run `fc-cache -f`.

Use Instrument Serif Regular/Italic, Inter Regular/SemiBold, DM Mono Regular/Medium and Silkscreen Regular. `Inter-Variable.ttf` is retained as the upstream source; use the two static Inter instances for consistent LibreOffice/PowerPoint rendering. They were instantiated at optical size 24 and weights 400/600 with fontTools.

These fonts originate in the official Google Fonts repository (`https://github.com/google/fonts/tree/main/ofl/`). Their separate SIL Open Font License files are included. No font embedding is claimed: python-pptx does not provide a reliable font-embedding API. All headline, label and statistic text remains editable.
