"""Record opaque bounds and a lower-body anchor for each character pose."""

import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
metrics = {}
paths = [
    path
    for folder in ("characters", "enemies", "props")
    for path in sorted((ROOT / f"public/assets/{folder}").glob("*.png"))
]
for path in paths:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    left, top, right, bottom = alpha.getbbox()
    anchor_pixels = [
        x + 0.5
        for y in range(top + round((bottom - top) * 0.72), bottom)
        for x in range(left, right)
        if alpha.getpixel((x, y)) > 127
    ]
    anchor_x = sum(anchor_pixels) / len(anchor_pixels)
    metric = {
        "artHeight": bottom - top,
        "originX": round(anchor_x / image.width, 5),
        "originY": round(bottom / image.height, 5),
        "canvasWidth": image.width,
        "canvasHeight": image.height,
    }
    prefix = "sprite_" if path.parent.name == "characters" else "art_" if path.parent.name == "props" else ""
    metrics[f"{prefix}{path.stem}"] = metric
    if path.parent.name == "characters" and path.stem.endswith("_idle"):
        metrics[f"sprite_{path.stem[:-5]}"] = metric

target = ROOT / "src/characters/fighters/CharacterSpriteMetrics.json"
target.write_text(json.dumps(metrics, indent=2) + "\n")
print(f"Wrote {len(metrics)} texture metrics to {target}")
