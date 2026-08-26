#!/usr/bin/env python3
"""Derive the five remaining round backdrops (and the lantern prop) from the
two painted masters plus procedural overlays.

The painted masters market.png / moon_gate.png are AI-generated concept art.
Each output below re-uses their painterly pixel texture and re-tones it for a
different location on the journey, then adds small procedural set pieces
(bamboo, ridges, stairs, throne, ...). Deterministic: no RNG.

Outputs (both re-runnable):
  design-reference/masters/backgrounds/<name>.png  1672x941 derived master
  public/assets/backgrounds/<name>.png             1600x900 NEAREST final
  design-reference/masters/props/lantern.png       40x56 RGBA prop master
  public/assets/props/lantern.png                  40x56 RGBA prop
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MASTER_DIR = ROOT / "design-reference" / "masters" / "backgrounds"
PROP_MASTER_DIR = ROOT / "design-reference" / "masters" / "props"
FINAL_BG_DIR = ROOT / "public" / "assets" / "backgrounds"
FINAL_PROP_DIR = ROOT / "public" / "assets" / "props"

W, H = 1672, 941

# 4x4 ordered dither so ramp recolors keep the painted pixel-cluster feel.
_BAYER = np.array(
    [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float64
) / 16.0
BAYER = np.tile(_BAYER, (H // 4 + 1, W // 4 + 1))[:H, :W]

VERMILION = [(46, 12, 10), (88, 24, 16), (130, 38, 22), (172, 56, 30), (206, 84, 42), (232, 124, 58)]
JADE = [(14, 30, 20), (24, 48, 31), (38, 72, 43), (58, 100, 57), (88, 132, 74), (122, 166, 94)]
WARM_STONE = [(58, 42, 34), (88, 64, 50), (122, 90, 68), (160, 122, 90), (198, 158, 116)]
CARPET = [(70, 14, 12), (104, 22, 16), (140, 32, 22), (176, 46, 30)]
GOLD = (212, 164, 84)
GOLD_DIM = (150, 110, 58)

_YY, _XX = np.mgrid[0:H, 0:W]


def load_master(name: str) -> np.ndarray:
    return np.asarray(Image.open(MASTER_DIR / f"{name}.png").convert("RGB"), dtype=np.float64)


def to_hsv(rgb_arr: np.ndarray):
    r, g, b = rgb_arr[..., 0], rgb_arr[..., 1], rgb_arr[..., 2]
    mx = rgb_arr.max(axis=-1)
    mn = rgb_arr.min(axis=-1)
    diff = mx - mn
    v = mx
    s = np.where(mx > 0, diff / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx)
    m = (mx == r) & (diff > 0)
    h[m] = (60 * ((g - b) / diff)[m]) % 360
    m = (mx == g) & (diff > 0)
    h[m] = 60 * ((b - r) / diff)[m] + 120
    m = (mx == b) & (diff > 0)
    h[m] = 60 * ((r - g) / diff)[m] + 240
    return h, s, v


def ramp_recolor(img: np.ndarray, mask: np.ndarray, ramp) -> np.ndarray:
    """Recolor masked pixels onto a luminance ramp, preserving local detail."""
    ramp = np.asarray(ramp, dtype=np.float64)
    lum = img @ np.array([0.299, 0.587, 0.114])
    vals = lum[mask]
    if vals.size == 0:
        return img
    lo, hi = np.percentile(vals, [2, 98])
    t = np.clip((lum - lo) / max(1e-6, hi - lo), 0, 1)
    t = np.clip(t + (BAYER - 0.5) * 0.10, 0, 1)
    pos = t * (len(ramp) - 1)
    i0 = np.floor(pos).astype(int)
    i1 = np.minimum(i0 + 1, len(ramp) - 1)
    f = (pos - i0)[..., None]
    color = ramp[i0] * (1 - f) + ramp[i1] * f
    out = img.copy()
    out[mask] = color[mask]
    return out


def add_glow(img: np.ndarray, cx, cy, r, color, strength=1.0) -> None:
    d = np.sqrt((_XX - cx) ** 2 + (_YY - cy) ** 2) / r
    fall = np.clip(1 - d, 0, 1) ** 2 * strength
    img += fall[..., None] * np.asarray(color, dtype=np.float64)


def structure_mask(img: np.ndarray, y0=300, y1=590, sat_max=0.34, val_min=12) -> np.ndarray:
    """Low-saturation pixels inside the architecture band (stone/wood/plaster)."""
    _, s, v = to_hsv(img)
    band = np.zeros((H, W), dtype=bool)
    band[y0:y1, :] = True
    return band & (s < sat_max) & (v > val_min)


def mask_from_draw(draw_fn) -> np.ndarray:
    canvas = Image.new("L", (W, H), 0)
    draw_fn(ImageDraw.Draw(canvas))
    return np.asarray(canvas, dtype=np.float64) / 255.0 > 0.5


def paint(img: np.ndarray, mask: np.ndarray, color) -> None:
    img[mask] = np.asarray(color, dtype=np.float64)


def outline_mask(mask: np.ndarray) -> np.ndarray:
    """1px dilation minus the mask itself."""
    dil = mask.copy()
    dil[1:, :] |= mask[:-1, :]
    dil[:-1, :] |= mask[1:, :]
    dil[:, 1:] |= mask[:, :-1]
    dil[:, :-1] |= mask[:, 1:]
    return dil & ~mask


# --------------------------------------------------------------------------
# Scene derivations
# --------------------------------------------------------------------------

def make_vermilion() -> np.ndarray:
    """Stage-1/4 vermilion court gate: moon gate re-lacquered red + gold."""
    img = load_master("moon_gate")
    img = ramp_recolor(img, structure_mask(img), VERMILION)
    # Deepen the sky a touch toward dusk plum.
    sky = _YY < 300
    img[sky] *= np.array([1.06, 0.98, 0.98])
    # Warm up the gate lanterns/windows: saturated warm pixels glow harder.
    _, s, v = to_hsv(img)
    warm = (s > 0.35) & (v > 90) & (_YY > 280)
    img[warm] = np.clip(img[warm] * np.array([1.10, 1.02, 0.90]), 0, 255)
    # Two extra hanging lanterns flanking the gate opening.
    for cx in (560, 1112):
        body = mask_from_draw(lambda d, cx=cx: d.ellipse([cx - 13, 420, cx + 13, 462], fill=255))
        img[body] = (168, 32, 22)
        core = mask_from_draw(lambda d, cx=cx: d.ellipse([cx - 7, 429, cx + 7, 453], fill=255))
        img[core] = (232, 110, 52)
        img[outline_mask(body)] = (40, 10, 8)
        cap = mask_from_draw(lambda d, cx=cx: d.rectangle([cx - 8, 414, cx + 8, 420], fill=255))
        img[cap] = GOLD_DIM
        add_glow(img, cx, 441, 58, (200, 90, 40), 0.5)
    return np.clip(img, 0, 255)


def make_zhao_garden() -> np.ndarray:
    """Stage-2 Zhao mansion garden: market re-toned jade + bamboo groves."""
    img = load_master("market")
    img = ramp_recolor(img, structure_mask(img), JADE)
    # Ground path: cool it toward mossy slate.
    ground = _YY > 620
    img[ground] *= np.array([0.88, 0.98, 0.92])
    img = np.clip(img, 0, 255)

    def bamboo(cx, base_y, height, lean=6):
        stems = []
        for k, dx in enumerate((-14, 0, 13)):
            top = base_y - height + (k * 9)
            x0 = cx + dx
            x1 = x0 + lean
            seg = mask_from_draw(lambda d, x0=x0, x1=x1, t=top, b=base_y: d.line([(x0, t), (x1, b)], fill=255, width=4))
            stems.append(seg)
            img[seg] = (34, 66, 44)
            for node_y in range(top + 18, base_y, 26):
                node = mask_from_draw(
                    lambda d, x0=x0, x1=x1, ny=node_y: d.line([(x0 - 1, ny), (x1 + 1, ny)], fill=255, width=2))
                img[node] = (56, 96, 62)
            # leaf clusters from upper nodes
            for node_y in range(top + 24, base_y - 40, 34):
                for sgn in (-1, 1):
                    ex = x1 + sgn * (20 + (node_y % 3) * 4)
                    ey = node_y - 12 - (node_y % 2) * 6
                    leaf = mask_from_draw(
                        lambda d, x0=x1, y0=node_y, ex=ex, ey=ey: d.polygon(
                            [(x0, y0), (ex, ey), (x0 + sgn * 3, y0 + 5)], fill=255))
                    img[leaf] = (28, 78, 48) if sgn < 0 else (36, 92, 56)
        for seg in stems:
            img[outline_mask(seg)] = (12, 26, 18)

    for cx, base in ((120, 640), (268, 662), (1408, 648), (1560, 630)):
        bamboo(cx, base, 250 + (cx % 60), lean=5 + (cx % 7) - 3)

    # Low hedge clumps along the structure baseline.
    for cx in (520, 700, 980, 1160):
        hedge = mask_from_draw(lambda d, cx=cx: d.ellipse([cx - 46, 596, cx + 46, 648], fill=255))
        hi = mask_from_draw(lambda d, cx=cx: d.ellipse([cx - 30, 602, cx + 22, 630], fill=255))
        img[hedge] = (22, 52, 33)
        img[hi] = (34, 72, 44)
        img[outline_mask(hedge)] = (10, 24, 16)
    return np.clip(img, 0, 255)


def make_border_wall() -> np.ndarray:
    """Stage-3 Great Wall border: moon gate in cold mist + ridge lines."""
    img = load_master("moon_gate")
    # Cold slate grade for grey stone; keep warm lantern light intact.
    _, s, _ = to_hsv(img)
    cold = np.clip(img * np.array([0.80, 0.92, 1.12]) - 6, 0, 255) * 0.94
    keep = np.clip((s - 0.15) / 0.25, 0, 1)[..., None]
    img = img * keep + cold * (1 - keep)

    def ridge(base_y, amp, freq, phase, color):
        xs = np.arange(0, W + 8, 8)
        ys = base_y + amp * (np.sin(xs / freq + phase) + 0.5 * np.sin(xs / (freq * 0.53) + phase * 1.7))
        poly = [(int(x), float(y)) for x, y in zip(xs, ys)]
        poly += [(W + 8, base_y + 44), (-8, base_y + 44)]
        m = mask_from_draw(lambda d, poly=poly: d.polygon(poly, fill=255)) & (_YY < 318)
        edge = mask_from_draw(lambda d, poly=poly: d.line(poly[: len(poly) - 2], fill=255, width=2)) & (_YY < 318)
        img[m] = color
        img[edge] = tuple(min(255, c + 16) for c in color)

    ridge(300, 34, 210, 1.2, (34, 44, 66))
    ridge(322, 26, 150, 4.0, (46, 58, 84))
    # Pale mist-moon upper left.
    disc = mask_from_draw(lambda d: d.ellipse([214, 64, 306, 156], fill=255))
    img[disc] = (214, 224, 238)
    shade = mask_from_draw(lambda d: d.ellipse([238, 78, 306, 146], fill=255))
    img[shade] = (182, 196, 216)
    add_glow(img, 260, 110, 150, (140, 160, 190), 0.4)
    # Beacon tower on the right wall with a watch fire.
    tower = mask_from_draw(lambda d: d.polygon([(1318, 470), (1444, 470), (1430, 330), (1332, 330)], fill=255))
    hip = mask_from_draw(lambda d: d.polygon([(1320, 330), (1442, 330), (1410, 288), (1352, 288)], fill=255))
    img[tower] = (58, 70, 96)
    img[hip] = (40, 50, 72)
    for y in (366, 402, 438):
        slit = mask_from_draw(lambda d, y=y: d.rectangle([1372, y, 1392, y + 10], fill=255))
        img[slit] = (30, 38, 56)
    img[outline_mask(tower)] = (22, 28, 44)
    bowl = mask_from_draw(lambda d: d.rectangle([1358, 272, 1406, 288], fill=255))
    img[bowl] = (70, 60, 60)
    fire = mask_from_draw(lambda d: d.ellipse([1366, 246, 1398, 276], fill=255))
    img[fire] = (232, 128, 44)
    add_glow(img, 1382, 258, 90, (220, 120, 50), 0.6)
    return np.clip(img, 0, 255)


def make_palace_approach(vermilion: np.ndarray) -> np.ndarray:
    """Stage-4 palace approach: richer court + grand stair + gate pillars."""
    img = vermilion.copy()
    h, s, v = to_hsv(img)
    img = img * (0.92 + 0.18 * s[..., None])
    # Grand stair centered on the gate opening.
    steps = [
        (566, 700, 1106, 742),
        (596, 664, 1076, 702),
        (626, 628, 1046, 664),
        (656, 594, 1016, 628),
    ]
    for i, (x0, y0, x1, y1) in enumerate(steps):
        step = mask_from_draw(lambda d, b=(x0, y0, x1, y1): d.rectangle(list(b), fill=255))
        img[step] = WARM_STONE[min(i + 1, 3)]
        lip = mask_from_draw(lambda d, b=(x0, y0, x1, y1): d.rectangle([b[0], b[1], b[2], b[1] + 5], fill=255))
        img[lip] = WARM_STONE[4]
        img[outline_mask(step)] = (34, 22, 16)
    # Flanking pillars with gold collars.
    for cx in (330, 1342):
        pil = mask_from_draw(lambda d, cx=cx: d.rectangle([cx - 17, 330, cx + 17, 640], fill=255))
        img[pil] = (150, 42, 26)
        lite = mask_from_draw(lambda d, cx=cx: d.rectangle([cx - 17, 330, cx - 8, 640], fill=255))
        img[lite] = (184, 62, 34)
        for y in (352, 600):
            collar = mask_from_draw(lambda d, cx=cx, y=y: d.rectangle([cx - 21, y, cx + 21, y + 10], fill=255))
            img[collar] = GOLD_DIM
        cap = mask_from_draw(lambda d, cx=cx: d.rectangle([cx - 26, 316, cx + 26, 332], fill=255))
        img[cap] = (108, 30, 20)
        img[outline_mask(pil)] = (34, 10, 8)
    return np.clip(img, 0, 255)


def make_throne_hall(vermilion: np.ndarray) -> np.ndarray:
    """Stage-5 throne hall interior: ceiling, lantern rows, throne, carpet."""
    img = vermilion.copy()
    # Sky band becomes a dark interior ceiling gradient; blend the cut so no
    # horizon seam or leftover distant roofline survives at the junction.
    grad = np.clip(_YY / 336.0, 0, 1)[..., None]
    ceil_color = (24, 9, 9) * (1 - grad) + (64, 20, 15) * grad
    full = _YY < 310
    blend = (_YY >= 310) & (_YY < 336)
    img[full] = ceil_color[full]
    w = (((_YY - 310) / 26.0)[..., None] * 0.85)[blend]
    img[blend] = img[blend] * w + ceil_color[blend] * (1 - w)
    # Rows of hanging palace lanterns.
    for row_y, count in ((110, 6), (178, 5), (246, 6)):
        gap = W / (count + 1)
        for i in range(count):
            cx = int(gap * (i + 1))
            chain = mask_from_draw(lambda d, cx=cx, y=row_y: d.line([(cx, row_y - 26), (cx, row_y)], fill=255, width=2))
            img[chain] = GOLD_DIM
            body = mask_from_draw(lambda d, cx=cx, y=row_y: d.ellipse([cx - 11, row_y, cx + 11, row_y + 26], fill=255))
            img[body] = (168, 34, 22)
            core = mask_from_draw(lambda d, cx=cx, y=row_y: d.ellipse([cx - 6, row_y + 6, cx + 6, row_y + 20], fill=255))
            img[core] = (240, 150, 70)
            img[outline_mask(body)] = (36, 10, 8)
            add_glow(img, cx, row_y + 13, 46, (210, 110, 50), 0.4)
    # Throne dais + high-back throne silhouette at the gate.
    dais = mask_from_draw(lambda d: d.polygon([(700, 620), (972, 620), (942, 560), (730, 560)], fill=255))
    img[dais] = (96, 24, 18)
    img[outline_mask(dais)] = (36, 10, 8)
    seat = mask_from_draw(
        lambda d: d.polygon([(806, 470), (866, 470), (878, 566), (794, 566)], fill=255))
    img[seat] = (120, 30, 22)
    for y in range(478, 566, 14):
        trim = mask_from_draw(lambda d, y=y: d.rectangle([800, y, 872, y + 3], fill=255))
        img[trim] = GOLD
    img[outline_mask(seat)] = (30, 8, 6)
    add_glow(img, 836, 520, 120, (180, 90, 40), 0.28)
    # Red carpet runway down the middle.
    carpet = (_XX > 656) & (_XX < 1016) & (_YY > 616)
    img[carpet] = np.clip(img[carpet] * 0.55, 0, 255)
    ramp = np.asarray(CARPET, dtype=np.float64)
    shade = (np.clip((_YY - 616) / 325.0, 0, 1) * (len(ramp) - 1)).astype(int)
    img[carpet] = ramp[np.clip(shade[carpet], 0, len(ramp) - 1)]
    for cx in (656, 1016):
        border = (_XX > cx - 8) & (_XX < cx + 8) & (_YY > 616)
        img[border] = GOLD_DIM
    return np.clip(img, 0, 255)


# --------------------------------------------------------------------------
# Lantern breakable prop
# --------------------------------------------------------------------------

def make_lantern() -> Image.Image:
    pw, ph = 40, 56
    im = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ink = (26, 8, 8, 255)
    d.line([(20, 0), (20, 6)], fill=ink, width=2)
    d.rectangle([13, 6, 27, 11], fill=(150, 110, 58, 255), outline=ink)
    d.ellipse([7, 11, 33, 41], fill=(170, 34, 24, 255), outline=ink)
    d.ellipse([12, 15, 28, 37], fill=(214, 60, 36, 255))
    d.ellipse([16, 20, 24, 32], fill=(255, 186, 96, 255))
    d.line([7, 22, 12, 20], fill=ink, width=1)
    d.line([33, 22, 28, 20], fill=ink, width=1)
    d.rectangle([14, 41, 26, 46], fill=(150, 110, 58, 255), outline=ink)
    d.line([(20, 46), (20, 52)], fill=(170, 34, 24, 255), width=2)
    d.line([(16, 50), (24, 50)], fill=(212, 164, 84, 255), width=2)
    return im


# --------------------------------------------------------------------------
# Driver
# --------------------------------------------------------------------------

def save_master_and_final(arr: np.ndarray, name: str) -> None:
    master = Image.fromarray(arr.astype(np.uint8), "RGB")
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_BG_DIR.mkdir(parents=True, exist_ok=True)
    master.save(MASTER_DIR / f"{name}.png", format="PNG")
    final = master.resize((1600, 900), resample=Image.Resampling.NEAREST)
    final.save(FINAL_BG_DIR / f"{name}.png", format="PNG")
    print(f"{name}: master 1672x941 + final 1600x900")


def main() -> None:
    vermilion = make_vermilion()
    save_master_and_final(vermilion, "vermilion_court")
    save_master_and_final(make_zhao_garden(), "zhao_garden")
    save_master_and_final(make_border_wall(), "border_wall")
    save_master_and_final(make_palace_approach(vermilion), "palace_approach")
    save_master_and_final(make_throne_hall(vermilion), "throne_hall")

    lantern = make_lantern()
    PROP_MASTER_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_PROP_DIR.mkdir(parents=True, exist_ok=True)
    lantern.save(PROP_MASTER_DIR / "lantern.png", format="PNG")
    lantern.save(FINAL_PROP_DIR / "lantern.png", format="PNG")
    print("lantern: 40x56 RGBA prop")


if __name__ == "__main__":
    main()
