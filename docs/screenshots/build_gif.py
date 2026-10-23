"""Create a GIF walkthrough from unchanged, real Playwright viewport captures."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

DIRECTORY = Path(__file__).resolve().parent
ROOT = DIRECTORY.parents[1]
NAMES = ["risk-map.png", "simulator.png", "capacitymesh.png", "approval-pending.png", "approval.png"]
DURATIONS = [4000, 5000, 5000, 3000, 5000]
frames = []
for name in NAMES:
    with Image.open(DIRECTORY / name) as source:
        assert source.size == (1920, 1080), (name, source.size)
        frame = source.convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS)
        frames.append(frame.quantize(colors=256, method=Image.Quantize.MEDIANCUT))
output = DIRECTORY / "demo.gif"
frames[0].save(output, save_all=True, append_images=frames[1:], duration=DURATIONS, loop=0, disposal=2, optimize=False)
provenance_path = ROOT / "docs" / "SCREENSHOT_PROVENANCE.json"
provenance = json.loads(provenance_path.read_text())
provenance["gif"] = {
    "path": "docs/screenshots/demo.gif",
    "createdAt": datetime.now(timezone.utc).isoformat(),
    "description": "Slideshow of real captured app states, not a continuous cursor recording or live transaction",
    "sourceFrames": ["docs/screenshots/" + name for name in NAMES],
    "frameDurationsMs": DURATIONS,
    "width": 1280,
    "height": 720,
    "transformations": ["Proportional downscale", "GIF palette quantization"],
    "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
}
provenance_path.write_text(json.dumps(provenance, indent=2) + "\n")
print(output, output.stat().st_size, "bytes")
