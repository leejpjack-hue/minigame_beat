# Option 3 character artwork

The selected direction is detailed, cute HD pixel art that preserves the five
playable fighters' existing colors, hairstyles, and weapons. Enemies, stages,
combat rules, collision sizes, names, and stats are unchanged.

## Round backdrops, enemy art, and props (second pass)

Each of the 25 rounds now plays in front of one of seven screen-sized
illustrated arenas (`src/config/RoundArt.ts` maps stage × wave to scene, zoom,
and focus; `src/utils/RoundBackdrop.ts` crossfades when a wave starts).

- Painted masters (AI-generated from the approved concepts): `market.png`
  (from `enemy-background-concepts/lantern-market.png`) and `moon_gate.png`
  (from `moonlit-gate.png`) at 1672 × 941, finals 1600 × 900 NEAREST.
- Derived masters: `vermilion_court`, `zhao_garden`, `border_wall`,
  `palace_approach`, `throne_hall` are deterministic re-tones of the painted
  masters plus procedural set pieces (lanterns, bamboo, ridge lines and a
  beacon fire, grand stairs and pillars, ceiling/throne/carpet). Rebuild them
  with `python3 scripts/make_background_variants.py`. The vermilion-court
  concept in `enemy-background-concepts/` is the style reference for that
  scene family; the concept itself contains mockup characters and HUD, so it
  was re-derived from the clean moon-gate master instead of cleaned.
- Enemy raster art: the eight grunt types (soldier, archer, spearman,
  shieldman, cavalry, elite, assassin, zhaoguard) ship as PNGs in
  `public/assets/enemies/`; named minibosses and bosses stay procedural until
  a later art pass. `RASTER_ENEMY_SPRITES` in `EnemyTypes.ts` lists which keys
  have files so the boot loader never requests a missing PNG.
- Props: `art_crate` and `art_lantern` breakables. The lantern is generated
  by the same variants script; both masters live in `design-reference/masters/props/`.
- `scripts/build_character_manifest.py` records visible height, lower-body
  anchor, and canvas size for every raster sprite (fighters, enemies, props)
  into `CharacterSpriteMetrics.json`; `fitCharacterArt` validates the sprite's
  canvas against the recorded size so procedural fallbacks that share a key
  are never mis-scaled.

## Delivered assets

Fifteen individually generated PNGs live in `public/assets/characters/`:
`{xiang_shao_long,lian_jin,wu_ting_fang,shan_rou,ying_zheng}_{idle,walk,attack}.png`.
Each is 96 × 112 RGBA with real transparency, nearest-neighbor scaling, and
four pixels of bottom clearance. The base `sprite_<fighter>` key aliases idle.
All three existing pose keys remain compatible with the game.

Generated masters are preserved in `design-reference/masters/`. The chosen
visual reference is `design-reference/option-3-selected.png`; the original
game screenshot is `design-reference/current-character-select.png`.

Generation used the **built-in Image Gen tool**, not the fallback CLI/API.
The reference image's checkerboard was baked into its pixels, so individual
production masters used a flat chroma-key background, removed mechanically.
No final character was cut out of the five-character concept sheet.

## Production prompt set (consolidated)

Every asset combines the common brief, one character description, and one pose
description below. The selected Option 3 image was the style reference; each
fighter's completed idle image also anchored its walk and attack variants.

```text
Use case: stylized-concept
Asset type: single playable character sprite for a 2D beat-em-up game
Primary request: preserve the supplied Option 3 character identity and cute
chibi proportions, adding crisp, readable pixel detail.
Style: HD pixel art; deliberate square pixel clusters; dark outline; restrained
three-step shading; large expressive eyes; detailed hair, clothing, and weapon.
Composition: exactly one full-body fighter, facing right in a three-quarter
gameplay view; feet, hair, hands, and weapon entirely inside the image with margin.
Background: one flat chroma-key color, green for all except magenta for Shan Rou.
Constraints: preserve the reference palette, outfit, hairstyle, and weapon;
consistent head/body proportions across poses; no scenery, text, label,
watermark, checkerboard, ground shadow, extra fighter, or cropped body part.
```

| Fighter | Identity and details | Idle | Walk | Attack |
| --- | --- | --- | --- | --- |
| Xiang Shao Long / 項少龍 | Short black hair; blue jacket with white trim; tan trousers; dark shoes; unarmed | Relaxed ready stance, fists raised | Rightward stride with natural arm counter-swing | Forward punch, other fist guarding |
| Lian Jin / 連晉 | Black topknot with red tie; black tunic with red fasteners; red trousers; silver sword | Sword-ready stance | Rightward step, sword held safely forward | Dynamic forward sword slash |
| Wu Ting Fang / 烏廷芳 | Brown braided hair; pink top; yellow trousers; decorative gold-and-pink fan | Fan open beside her | Rightward step with braid following motion | Forward fan strike with a confident cute expression |
| Shan Rou / 善柔 | Black ponytail with green tie; forest-green tunic; black trousers; short silver dagger | Compact dagger-ready stance | Light rightward step, ponytail trailing | Low forward dagger lunge |
| Ying Zheng / 嬴政 | Black hair; flat rectangular gold ceremonial crown and bead fringe; gold robe; red sash; black-and-gold lower garment; gold blade | Regal fighting stance | Measured rightward stride | Forward golden-blade attack, crown and outfit unchanged |

## Asset preparation and maintenance

Python 3 with Pillow is needed only to rebuild assets/QA images; the game does
not need Python at runtime. Run commands from the project root.

```sh
python3 scripts/prepare_character_sprite.py design-reference/masters/xiang_shao_long_idle.png public/assets/characters/xiang_shao_long_idle.png --key green
# Use --key magenta for Shan Rou, then rebuild all alignment metadata:
python3 scripts/build_character_manifest.py
python3 scripts/render_character_art_qa.py
npm run test:art
npm run build
```

`prepare_character_sprite.py` performs chroma-key removal, nearest-neighbor
resizing, and canvas alignment only. `CharacterSpriteMetrics.json` records
visible height and a lower-body anchor so pose changes and weapon overhang do
not cause obvious foot sliding. `fitCharacterArt` applies these metrics to
selection previews, menu silhouettes, gameplay, and afterimages while leaving
the original combat hitboxes untouched.

The production build includes only the small final assets, not the masters or
QA evidence. See the project-root `design-qa.md` for verification and limits.
