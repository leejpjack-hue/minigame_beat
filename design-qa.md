# Senior and boss enemy design QA

**Findings**

- No actionable P0, P1, or P2 differences remain in the command-tier enemy
  pass. All 14 previously procedural Qin guard, general, named-miniboss, and
  final-boss textures now use detailed raster art that matches the selected
  cute HD pixel direction.

**Comparison target and evidence**

- Source visual truth:
  `design-reference/option-3-selected.png` (1672 × 941) for cute character
  proportions, face treatment, outline weight, and pixel-detail density;
  `design-reference/enemy-background-concepts/lantern-market.png`
  (1672 × 941) for the in-game enemy scale and environmental treatment.
- Browser-rendered implementation:
  `design-reference/qa/enemy-command-stage-start.png` (1280 × 720), Round 1,
  Wave 1 after Menu → Character Select → 1P start.
- Browser viewport: 1280 × 720 CSS px, device pixel ratio 2. The captured PNG
  is 1280 × 720; the 1672 × 941 source was normalized to the same 1280 × 720
  pixel dimensions before full-view comparison.
- Full-view combined evidence:
  `design-reference/qa/lantern-market-vs-live.png` (2560 × 720), source on the
  left and current browser implementation on the right, matched to the same
  round, theme, crop, and 16:9 state.
- Focused asset evidence:
  `design-reference/qa/senior-boss-roster.png` (1400 × 1000) enlarges every
  command-tier production sprite on the game navy; transparency, weapon edges,
  rank silhouette, pixel clusters, and foot anchors are readable at inspection
  scale. `design-reference/qa/option-3-vs-senior-boss-roster.png` places the
  selected character direction and final command-tier sprites in one combined
  comparison input.
- Complete-roster evidence:
  `design-reference/qa/all-enemy-roster.png` covers all 22 raster enemy types.

**Required fidelity surfaces**

- Fonts and typography: existing monospace HUD and bilingual UI remain
  unchanged. Boss names and wave banners continue to use the current game text
  system; no brief text or generated labels appear inside any sprite.
- Spacing and layout rhythm: no UI or gameplay layout changed. Every asset is a
  96 × 112 canvas with at least four transparent pixels of production margin;
  crowns, plumes, swords, spears, and Lao Ai's hammer remain inside the canvas.
  Existing compact evidence at `design-reference/qa/enemy-command-compact.png`
  confirms the FIT canvas remains usable at 844 × 390 without clipped controls.
- Colors and visual tokens: each enemy preserves its code-defined main/accent
  palette. Higher-rank enemies add gold, robe, lamellar, plume, and crown detail
  without drifting from the navy, red, brown, violet, blue, green, and gold
  identities used by gameplay.
- Image quality and asset fidelity: all final enemy images are real generated
  PNG assets, not CSS/SVG/div approximations. All 22 are 96 × 112 RGBA with
  clean alpha, nearest-neighbor rendering, crisp outlines, and no keyed halo,
  matte rectangle, shadow, watermark, clipped equipment, or extra figure.
  Fan Yuqi used a magenta key so his green armour was preserved cleanly.
- Copy and content: enemy names, stats, weapons, wave membership, attack types,
  AI personalities, hitboxes, score behavior, and round progression are
  unchanged. The reference mock shows a mixed demonstration lineup; the live
  Round 1 data intentionally spawns four soldiers, preserving actual game rules.

**Interaction and technical verification**

- Menu start with Enter: passed.
- Character selection and 1P confirmation with Space: passed.
- Stage start, Round 1 backdrop, enemy spawn, player HUD, touch controls, and
  shared character renderer: passed in the in-app browser.
- Fresh browser console errors: zero.
- Raster regression checks: `npm run test:art` — 42/42 passed, including all 22
  enemy PNGs, RGBA format, 96 × 112 dimensions, alignment metrics, and fighter
  pose checks.
- Production build: `npm run build` — passed TypeScript and Vite. The existing
  informational Phaser bundle-size warning remains unrelated to this art pass.
- Whitespace check: `git diff --check` — passed.

**Comparison history**

1. Initial gap: only eight common enemies had raster art; Qin guard, general,
   eleven named minibosses, and Lao Ai fell back to the old procedural style.
   Fix: generated and integrated 14 separate command-tier assets and expanded
   `RASTER_ENEMY_SPRITES` to the complete 22-enemy roster.
2. Asset edge pass: long weapons and high crowns/plumes could have clipped at
   gameplay scale, and green chroma key could damage Fan Yuqi's armour.
   Fix: every asset was post-processed into the common canvas with production
   padding; Fan Yuqi used a magenta key. The focused roster shows the corrected
   complete silhouettes and clean alpha.
3. Post-fix browser pass: reloaded the app, completed Menu → Select → Stage,
   captured the current Round 1 state, compared it in one combined image with
   the matching source concept, and confirmed zero browser errors. No further
   P0/P1/P2 mismatch was found.

**Open Questions**

- None for this scoped art replacement.

**Implementation Checklist**

- [x] Replace every procedural senior/miniboss/boss visual with production art.
- [x] Preserve each enemy's palette, weapon, rank, stats, and behavior.
- [x] Rebuild alignment metadata and complete-roster QA sheets.
- [x] Pass asset tests, production build, browser flow, and console checks.

**Follow-up Polish**

- P3: a future multi-frame animation pass could give named enemies bespoke walk
  and attack frames; the current game intentionally uses the shared subtle
  walk/attack bob and tilt around each detailed raster pose.

final result: passed
