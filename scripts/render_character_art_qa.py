"""Render asset and browser/reference comparison evidence for visual QA."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "design-reference/qa"
QA.mkdir(parents=True, exist_ok=True)
fighters = ["xiang_shao_long", "lian_jin", "wu_ting_fang", "shan_rou", "ying_zheng"]
poses = ["idle", "walk", "attack"]
sheet = Image.new("RGB", (2000, 1080), "#0a0a2e")
draw = ImageDraw.Draw(sheet)
for row, pose in enumerate(poses):
    for column, fighter in enumerate(fighters):
        asset = Image.open(ROOT / f"public/assets/characters/{fighter}_{pose}.png").convert("RGBA")
        asset = asset.crop(asset.getchannel("A").getbbox())
        ratio = min(360 / asset.width, 280 / asset.height)
        asset = asset.resize((round(asset.width * ratio), round(asset.height * ratio)), Image.Resampling.NEAREST)
        x = column * 400 + (400 - asset.width) // 2
        y = row * 360 + 305 - asset.height
        sheet.paste(asset, (x, y), asset)
        draw.text((column * 400 + 20, row * 360 + 325), f"{fighter} / {pose}", fill="white")
sheet.save(QA / "all-character-poses.png")

implementation = QA / "character-select-final.png"
if implementation.exists():
    before = Image.open(ROOT / "design-reference/current-character-select.png").convert("RGB")
    after = Image.open(implementation).convert("RGB")
    comparison = Image.new("RGB", (2560, 720), "#0a0a2e")
    comparison.paste(before.resize((1280, 720)), (0, 0))
    comparison.paste(after.resize((1280, 720)), (1280, 0))
    comparison.save(QA / "original-vs-updated-select.png")

    target = Image.open(ROOT / "design-reference/option-3-selected.png").convert("RGB")
    style_comparison = Image.new("RGB", (1672, 1882), "#0a0a2e")
    style_comparison.paste(target, (0, 0))
    style_comparison.paste(after.resize((1672, 941), Image.Resampling.NEAREST), (0, 941))
    style_comparison.save(QA / "option-3-vs-implementation.png")

    # Focus on the actual reference illustrations and browser-rendered cards.
    # This is QA evidence only; game sprites are individually generated assets.
    focused = Image.new("RGB", (1672, 800), "#0a0a2e")
    reference_region = target.crop((0, 225, 1672, 680))
    reference_region.thumbnail((1672, 400))
    focused.paste(reference_region, ((1672 - reference_region.width) // 2, 0))
    card_region = after.crop((95, 155, 1175, 320))
    card_region = card_region.resize((1672, 255), Image.Resampling.NEAREST)
    focused.paste(card_region, (0, 460))
    ImageDraw.Draw(focused).text((20, 425), "Selected Option 3 above / browser-rendered character art below", fill="white")
    focused.save(QA / "character-art-focused-comparison.png")
print(QA)
