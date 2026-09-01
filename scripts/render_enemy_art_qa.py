"""Render the complete enemy roster and command-tier QA contact sheets."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "design-reference/qa"
QA.mkdir(parents=True, exist_ok=True)

ROSTER = [
    "sprite_enemy_soldier",
    "sprite_enemy_archer",
    "sprite_enemy_spearman",
    "sprite_enemy_shieldman",
    "sprite_enemy_cavalry",
    "sprite_enemy_elite",
    "sprite_enemy_assassin",
    "sprite_enemy_zhaoguard",
    "sprite_enemy_qinguard",
    "sprite_enemy_general",
    "sprite_enemy_minilj",
    "sprite_enemy_minitx",
    "sprite_enemy_zhaomu",
    "sprite_enemy_guokai",
    "sprite_enemy_limu",
    "sprite_enemy_lubuwei",
    "sprite_enemy_chengjiao",
    "sprite_enemy_jingke",
    "sprite_enemy_fanyuqi",
    "sprite_enemy_yandan",
    "sprite_enemy_wangjian",
    "sprite_boss_lao",
]

COMMAND_TIER = ROSTER[8:]


def render_sheet(keys: list[str], columns: int, cell_w: int, cell_h: int, target: str) -> Image.Image:
    rows = (len(keys) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "#080822")
    draw = ImageDraw.Draw(sheet)
    for index, key in enumerate(keys):
        asset_path = ROOT / f"public/assets/enemies/{key}.png"
        asset = Image.open(asset_path).convert("RGBA")
        bounds = asset.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{asset_path} has no visible pixels")
        asset = asset.crop(bounds)
        ratio = min((cell_w - 42) / asset.width, (cell_h - 50) / asset.height)
        asset = asset.resize(
            (round(asset.width * ratio), round(asset.height * ratio)),
            Image.Resampling.NEAREST,
        )
        column = index % columns
        row = index // columns
        x = column * cell_w + (cell_w - asset.width) // 2
        y = row * cell_h + cell_h - 38 - asset.height
        sheet.paste(asset, (x, y), asset)
        label = key.removeprefix("sprite_enemy_").removeprefix("sprite_boss_")
        draw.text((column * cell_w + 14, row * cell_h + cell_h - 25), label, fill="#ffffff")
    sheet.save(QA / target)
    return sheet


render_sheet(ROSTER, 6, 270, 250, "all-enemy-roster.png")
command_sheet = render_sheet(COMMAND_TIER, 4, 350, 250, "senior-boss-roster.png")

reference_path = ROOT / "design-reference/option-3-selected.png"
if reference_path.exists():
    reference = Image.open(reference_path).convert("RGB")
    command_scaled = command_sheet.resize(
        (reference.width, round(command_sheet.height * reference.width / command_sheet.width)),
        Image.Resampling.NEAREST,
    )
    comparison = Image.new("RGB", (reference.width, reference.height + command_scaled.height), "#080822")
    comparison.paste(reference, (0, 0))
    comparison.paste(command_scaled, (0, reference.height))
    ImageDraw.Draw(comparison).text(
        (18, reference.height + 12),
        "Selected cute character direction above / complete senior and boss enemy tier below",
        fill="#ffffff",
    )
    comparison.save(QA / "option-3-vs-senior-boss-roster.png")

live_path = QA / "enemy-command-stage-start.png"
market_reference_path = ROOT / "design-reference/enemy-background-concepts/lantern-market.png"
if live_path.exists() and market_reference_path.exists():
    live = Image.open(live_path).convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS)
    market_reference = Image.open(market_reference_path).convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS)
    live_comparison = Image.new("RGB", (2560, 720), "#080822")
    live_comparison.paste(market_reference, (0, 0))
    live_comparison.paste(live, (1280, 0))
    live_comparison.save(QA / "lantern-market-vs-live.png")

print(QA)
