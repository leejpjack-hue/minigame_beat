# Character artwork QA

Date: 2026-08-26

final result: passed

## Enemy art, round backdrops, and props QA (second pass, same date)

Result: passed.

Scope: the eight grunt enemy sprites, seven round backdrops across all
5 stages × 5 waves, and the crate/lantern breakables. Named minibosses and
the boss intentionally remain procedural art (future pass).

Method and evidence (screenshots under `design-reference/qa/`):

- All seven background PNGs are served with HTTP 200 and are opaque RGB
  1600 × 900 (curl against the dev server, one request per file).
- In-browser verification at 1280 × 720, dev server `http://127.0.0.1:8888/`.
  Each stage was started directly through the exposed `window.__GAME__`
  debug handle and screenshotted: stage 1 market (`enemy-bg-stage1-market`),
  stage 2 garden (`enemy-bg-stage2-zhao-garden`), stage 3 border
  (`enemy-bg-stage3-border-wall`), stage 4 palace (`enemy-bg-stage4-palace-approach`),
  stage 5 throne hall (`enemy-bg-stage5-throne-hall`). The stage-1 wave-3
  round switch to vermilion court was triggered through the same scene event
  bridge the wave system uses and captured after the crossfade settled
  (`enemy-bg-stage1-wave3-vermilion`); the caption updated to
  ROUND 03 / 25 · 朱門外街 with no double-image artifacts.
- Compact landscape 844 × 390 CSS px: FIT canvas letterboxes horizontally;
  backdrop, round caption, HUD, and touch controls stay inside the viewport
  (`enemy-bg-compact-844x390`).

Defects found and fixed during this pass:

1. [P1, resolved] `elite`, `assassin`, `zhaoguard`, and `cavalry` raster
   sprites had no entries in `CharacterSpriteMetrics.json`, so they rendered
   at native 112 px instead of their intended display height and towered over
   the measured grunt types. The manifest script now measures every raster in
   `public/assets/{characters,enemies,props}` and records canvas dimensions;
   `fitCharacterArt` validates the sprite canvas against the recorded size
   (previously hardcoded 96 × 112, which also silently disabled prop sizing).
   Re-verified in `enemy-bg-stage2-after-metrics-fix.png` and
   `enemy-bg-stage3-after-metrics-fix.png`; the breakable lantern/crate fit
   calls are now effective (`enemy-bg-lantern-zoom.png`).
2. [P2, resolved] Boot requested a PNG for every enemy key although only the
   eight grunt files exist, logging 14 404s per boot before the procedural
   fallback ran. The loader now only requests `RASTER_ENEMY_SPRITES`.
3. Environment note: Homebrew Node 25 was broken against simdjson 4.x
   (`libsimdjson.29.dylib` missing). A local symlink
   `libsimdjson.29.dylib -> libsimdjson.33.dylib` unblocked builds/tests;
   `brew reinstall node` is the durable fix and still needs to be run.

Checks: `npm run test:art` 20/20 after the manifest changes; `npm run build`
passes (TypeScript + Vite; the large-Phaser-bundle warning is pre-existing
and informational).

Limits: miniboss/boss art, per-round background illustration unique to every
wave (current mapping re-uses seven scenes with zoom/focus reframing), and
background PNG weight (≈1.2–1.9 MB each; a pngquant pass would shrink them)
are follow-up polish, not blockers.

---

## Original character art pass

Date: 2026-08-26

final result: passed

Scope: the five playable fighters, each with idle, walk, and attack artwork,
integrated into the existing selection screen, menu, and gameplay. This is an
art-integration acceptance check, not a full-game gameplay/accessibility audit.

## Findings

No actionable P0/P1/P2 artwork-integration findings remain. All five fighters
retain the selected Option 3 identity and original palette, with more detailed
hair, faces, outfits, and weapons. Transparent sprites fit the existing cards
without clipping. Gameplay uses the same assets and preserves combat stats and
collision dimensions.

## Source, implementation, and normalization

- Source visual truth: `design-reference/option-3-selected.png` — 1672 × 941 px
  standalone character concept. It is an art-direction reference, not a UI mock.
- Existing UI baseline: `design-reference/current-character-select.png` —
  1280 × 720 px, default 1P selection, Xiang Shao Long selected.
- Final implementation: `design-reference/qa/character-select-final.png` —
  1280 × 720 px, same state, dark theme, all five cards visible.
- Local implementation: `http://127.0.0.1:8888/`.
- Browser viewport: 1280 × 720 CSS px, device pixel ratio 1. Phaser's logical
  canvas is 800 × 450 and scales to fit at 1.6×. Source UI and implementation
  screenshots therefore have matching pixel dimensions; no density conversion
  is required for the UI comparison.
- Full-view combined evidence: `design-reference/qa/original-vs-updated-select.png`
  (2560 × 720; original left, implementation right). Both were opened together
  and visually compared, not judged from separate images or code alone.
- Art-direction combined evidence: `design-reference/qa/option-3-vs-implementation.png`
  (1672 × 1882; selected reference above, implementation below). The UI screenshot
  is resized to the reference width for composition; this is not a pixel-exact
  comparison of their different scene layouts.
- Focused comparison: `design-reference/qa/character-art-focused-comparison.png`
  places the actual reference illustration crop above the browser-rendered card
  artwork. This makes outfit, face, silhouette, outline, and weapon differences
  readable. Image regions are enlarged for inspection, not used as game assets.
- All-pose inspection: `design-reference/qa/all-character-poses.png` — 2000 × 1080.
  All fifteen sprites were inspected against the dark game background for
  complete silhouettes, transparency, edge quality, palette, and pose consistency.

## Required fidelity surfaces

| Surface | Result |
| --- | --- |
| Fonts and typography | Existing monospace family, Chinese fallback, sizes, hierarchy, weights, and copy are retained. Nearest-neighbor rendering supports the selected pixel direction. Card names remain readable, without new wrapping or truncation. |
| Spacing and layout rhythm | Original five-card grid, title, mode controls, stats, and Back control are retained. Foot baselines are normalized. The confirmation prompt now sits in the available space to the right of stats instead of overlapping MP. All assets remain fully inside their cards, including Ying Zheng's crown and weapons. |
| Colors and tokens | Navy background, yellow P1, cyan P2, and existing stat-bar colors are unchanged. Blue/tan, black/red, pink/yellow, green/black, and gold/black/red character palettes match the reference and original identities. |
| Image quality and fidelity | Real generated raster assets are used, not vector/CSS approximations. Every final asset is 96 × 112 RGBA. No visible keyed backdrop, checkerboard, rectangular matte, missing weapon, or clipped limb remains. Pixel edges are intentionally crisp. Individual sprite poses differ from the concept sheet to face consistently right and support gameplay. |
| Copy and content | Character names, bilingual title, stats, mode labels, and control instructions are preserved. No design-brief text or generated labels appear inside the artwork. |

Expected differences: the selected concept is a large isolated lineup; the
implementation places individually generated, lower-resolution production
sprites inside the existing game UI. Fine details are simplified at gameplay
size. Idle/walk/attack are three discrete pose textures, matching the existing
game state system, not a new multi-frame animation system.

## Interaction and responsive verification

- Menu → character select: passed.
- Back → menu → character select re-entry: passed after the stale-card fix.
- Click a different fighter and update its highlight/stats: passed.
- 1P confirmation and stage start: passed. Screenshot:
  `design-reference/qa/combat-lian-idle.png`.
- 2P mode, lock Wu Ting Fang as P1, choose Ying Zheng as P2, and start the stage:
  passed. Evidence: `design-reference/qa/character-select-2p.png` and
  `design-reference/qa/combat-2p-final.png`. Both new sprites render together,
  fully visible, at consistent ground alignment.
- Compact landscape: passed at 844 × 390 CSS px, device pixel ratio 1.
  Screenshot: `design-reference/qa/character-select-compact.png`.
  The existing FIT canvas measures approximately 693.33 × 390 CSS px with
  horizontal letterboxing. All five cards, stat rows, mode controls, confirmation
  prompt, and Back control remain within the viewport.
- Browser console: fresh-session error entries checked; zero errors after fixes.
  Earlier diagnostic errors were excluded using the clean-reload timestamp.
- Asset regression checks: `npm run test:art` — 20/20 passed (PNG dimensions,
  RGBA format, alignment ranges, and base/idle metadata aliases).
- Production build: `npm run build` — passed TypeScript and Vite. The existing
  large Phaser bundle warning remains informational.
- Whitespace check: `git diff --check` — passed.

## Comparison and fix history

1. Initial integration: different transparent margins and weapon overhang made
   naive canvas-based sizing unsuitable. Normalized each sprite's visible height
   and lower-body anchor, then applied the same metrics to menu, preview,
   gameplay, and afterimage rendering. Inspected the complete pose contact sheet
   and the final focused browser/reference comparison; consistent baselines and
   no clipping remain.
2. [P2, resolved] Selection confirmation text overlapped the MP row in the
   baseline and first integrated screen. Evidence:
   `design-reference/qa/character-select-before-fix.png` and the left half of
   `design-reference/qa/original-vs-updated-select.png`. Moved the prompt to
   logical position (580, 350). Re-captured the same 1280 × 720 default selection;
   the right half of that combined comparison and `character-select-final.png`
   show clear separation. The compact viewport and longer P2 prompt also fit.
3. [P1, resolved] Reopening character select accessed destroyed card objects and
   caused a runtime error. Reset scene-owned card/stat collections in `create()`.
   Retested Back/re-entry with fresh console logs and a correctly rendered
   selection screen. This was a lifecycle defect uncovered during visual testing.
4. Final full-view and focused comparison: no further actionable P0/P1/P2
   differences in the scoped character update. Production build and all asset
   checks passed after the final fallback-size guard and comment correction.

## Limits and follow-up polish

- Full-stage completion, every fighter's combo sequence, and frame-by-frame
  capture of each walk/attack transition were not exhaustively tested. All
  fifteen pose assets are loaded through the existing pose-key system and were
  inspected on the contact sheet. Short attack-capture attempts were not used
  as acceptance evidence when the browser captured idle or a different state.
- Enemies and environments retain their original procedural graphics; updating
  them would be a separate art pass.
- Existing gameplay HUD label overlap and visible debug state labels are outside
  this character-art change. They are not evidence of a new art regression and
  should be addressed in a separate gameplay-UI cleanup.
- P3: a future multi-frame animation pass could make the existing discrete
  walk/attack pose changes smoother; it is not required for this asset update.

## Implementation checklist

- [x] Fifteen project-local production sprites and preserved generation masters.
- [x] Existing texture keys, stats, controls, and collision behavior retained.
- [x] Selection, menu, gameplay, and afterimage integration.
- [x] Full-view and focused reference/implementation comparison.
- [x] 1P/2P start, selection re-entry, compact viewport, and console checks.
- [x] Asset tests and production build.
- [x] Prompt set and asset maintenance notes in `design-reference/ART-DIRECTION.md`.
- [ ] Optional future work: enemy art, multi-frame animation, or gameplay-HUD polish.
