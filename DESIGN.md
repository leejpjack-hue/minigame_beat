# 尋秦記齊打交 — Technical Design Document

## Overview

**尋秦記齊打交** is a 2.5D side-scrolling beat 'em up inspired by Little Fighter 2, themed around the classic HK drama *A Step into the Past* (尋秦記). Built with **Phaser 3 + TypeScript + Vite**.

- **Genre**: 2.5D beat 'em up (LF2-style)
- **Resolution**: 800×450 (16:9), Phaser.Scale.FIT for responsive
- **Physics**: Arcade (zero gravity — jumps are sinusoidal arcs)
- **Art**: 100% procedural canvas sprites (no external assets)
- **Platforms**: Browser (desktop + mobile touch)

---

## Architecture

### Scene Pipeline

```
BootScene → MenuScene → CharacterSelectScene → StageScene (×4) → VictoryScene
```

| Scene | Role |
|---|---|
| **BootScene** | Generates all procedural fighter/enemy sprites (3 poses each), shadow, aliases. Transitions to Menu. |
| **MenuScene** | Title screen with pulsing "尋秦記齊打交". Enter/tap → CharacterSelect. |
| **CharacterSelectScene** | 5-card grid with stat preview bars. Stores fighter in registry, passes to StageScene. |
| **StageScene** | Main game loop. Wires all systems: player input, combat, AI, projectiles, HUD, wave manager. |
| **VictoryScene** | "恭喜通關!" after clearing all 4 stages. Enter/tap → back to character select. |

### File Structure

```
src/
├── main.ts                          # Entry: new Phaser.Game(gameConfig)
├── config/
│   ├── gameConfig.ts                # Phaser config: scenes, physics, scale
│   └── constants.ts                 # All tunable numbers, colors
├── enums/
│   ├── SceneKeys.ts                 # Boot / Menu / CharacterSelect / Stage / Victory
│   ├── CharacterState.ts            # idle / walk / jump / attack / hurt / dead / block
│   ├── Direction.ts                 # Left(-1) / Right(1)
│   ├── FighterName.ts               # 5 fighter ID strings
│   └── ComboInput.ts                # U / D / L / R / A / K / J / S
├── scenes/
│   ├── BootScene.ts                 # Procedural sprite generation
│   ├── MenuScene.ts                 # Title screen
│   ├── CharacterSelectScene.ts      # Fighter selection
│   ├── StageScene.ts                # Main gameplay (orchestrator)
│   └── VictoryScene.ts              # End screen
├── characters/
│   ├── BaseCharacter.ts             # Abstract: HP/MP, state machine, jump arc, hitbox window
│   ├── PlayerCharacter.ts           # Light chains, combo dispatch, per-fighter action mapping
│   ├── EnemyCharacter.ts            # AI-controlled, type-def driven
│   ├── fighters/
│   │   ├── FighterStats.ts          # Stats interface + DEFAULT_STATS
│   │   ├── FighterArtSpec.ts        # Visual spec per fighter (colors, build, weapon, hair)
│   │   ├── FighterMoves.ts          # Full movesets: L1/L2/L3, heavy, 4 specials per fighter
│   │   ├── XiangShaoLong.ts         # Balanced all-rounder
│   │   ├── LianJin.ts               # Fast rushdown
│   │   ├── WuTingFang.ts            # Agile aerial (double jump)
│   │   ├── ShanRou.ts               # Glass cannon assassin
│   │   ├── YingZheng.ts             # Tank powerhouse
│   │   └── index.ts                 # ALL_FIGHTERS barrel export
│   └── enemies/
│       ├── EnemyTypes.ts            # 10 enemy types + 10 hitbox definitions
│       └── BossCharacter.ts         # 3-phase boss with add spawning
├── systems/
│   ├── StateMachine.ts              # Generic FSM with transition guards
│   ├── CombatSystem.ts              # Per-frame hitbox/hurtbox AABB, damage, knockback
│   ├── ComboParser.ts               # 300ms sliding-window input sequence matcher
│   ├── AIController.ts              # 9 AI personalities, 8 action states
│   ├── ZDepthSorter.ts              # Sorts by groundY for 2.5D depth
│   ├── StageManager.ts              # 4 stages, wave spawning, progression
│   ├── ProjectileSystem.ts          # Ranged projectile travel + hit detection
│   └── ParticlePool.ts              # Object pool for hit spark particles
└── ui/
    ├── HealthBar.ts                 # HP bar with delayed red fill tween
    ├── MPBar.ts                     # MP bar (blue)
    ├── ComboIndicator.ts            # Escalating combo text (2 HIT! → GODLIKE!)
    ├── StageHUD.ts                  # Composes HP/MP/ComboIndicator
    └── VirtualDpad.ts               # Mobile touch controls (d-pad + 4 buttons)
```

---

## Core Systems

### 1. State Machine (`StateMachine.ts`)

Generic typed FSM with:
- **Transition guards**: `canTransitionFrom` whitelist per state
- **Lifecycle hooks**: `onEnter`, `onUpdate`, `onExit`
- **Force transition**: Bypasses guards (used for hurt/dead interrupts)
- **State duration tracking**: `getStateDuration()` for timing-based logic

Character states: `Idle → Walk → Jump → Attack → Hurt → Dead → Block`

### 2. 2.5D Z-Depth (`ZDepthSorter.ts`)

- **groundY**: Logical depth position (280–400 walkable band)
- **jumpHeight**: Visual lift via sinusoidal arc (`sin(progress × π)`)
- **Sprite y** = `groundY - jumpHeight`
- **Shadow** stays at `groundY`
- **Depth sort** uses `groundY` (not visual y), so jumping doesn't change render order

### 3. Combat System (`CombatSystem.ts`)

Per-frame collision pipeline:
1. Iterate attacking characters with active hitboxes
2. Look up hitbox from `FighterMoves` (player) or `ENEMY_HITBOXES` (enemy)
3. Calculate hitbox rectangle from character position + facing + offset
4. Check AABB overlap with each defender's hurtbox (body rectangle)
5. **Hit cooldown** prevents multi-tap: `(attacker, defender, attackName) → expiry frame`
6. Resolve: `damage = max(1, atk × atkMultiplier - def)`, knockback, hitstun
7. Visual: hit flash (white tint 100ms), particle burst, screen shake for heavy hits

Special move flags:
- **projectile**: Spawns a traveling rectangle via ProjectileSystem
- **multiHit**: Multiple damage ticks at intervals within one attack
- **superArmor**: Take damage but don't interrupt attack state
- **travel**: Gap-closer (lerp x over duration)
- **teleportBehind**: Brief alpha blink, position swap in subclass
- **selfBuff**: Applies atkMultiplier for a duration (no attack state entered)
- **fullscreen**: Hitbox spans full screen width

### 4. Combo Parser (`ComboParser.ts`)

Sliding-window input buffer (300ms):
- Records `ComboInput` tokens with timestamps
- Matches sequences longest-first to prevent short matches shadowing long ones
- 8 defined combos: Super (D→↓→J / D→→↓J), Buff (↓↓S), Low Special (↓→K / ↓K), Up Special (↑K), Dash Attack (→→J / ←←J)

### 5. AI Controller (`AIController.ts`)

9 personality presets:
| Personality | Aggression | Reaction | Block | Special |
|---|---|---|---|---|
| normal | 0.4 | 800ms | 10% | — |
| elite | 0.7 | 500ms | 30% | comboCount: 2 |
| boss | 0.9 | 300ms | 50% | — |
| archer | 0.55 | 700ms | 5% | kite (retreat when close) |
| spearman | 0.6 | 600ms | 20% | — |
| shield | 0.35 | 700ms | 70% | shieldCounter |
| cavalry | 0.85 | 400ms | 5% | chargeLine (straight dash) |
| miniboss_lj | 0.85 | 350ms | 40% | — |
| miniboss_tx | 0.7 | 450ms | 40% | — |

Decision loop: evaluate distance to target + own HP% + random roll → choose action (Idle/Patrol/Chase/Attack/Retreat/Block/Kite/ChargeLine).

### 6. Boss System (`BossCharacter.ts`)

3-phase boss (嫪毐):
- **Phase 1** (100-66% HP): Normal slam attacks
- **Phase 2** (66-33% HP): "盛怒" — gains `boss_sweep` attack, spawns 2 minion adds every 15s
- **Phase 3** (33-0% HP): "狂化" — gains `boss_quake` fullscreen attack, 1.5× speed, 1.3× atk, red tint, camera shake

Phase transitions trigger camera flash. Floating phase banner above boss.

### 7. Projectile System (`ProjectileSystem.ts`)

- Manages traveling rectangles (arrows, sword waves, daggers)
- Per-frame: move by speed × direction, track distance traveled
- Hit detection: AABB overlap against opposing faction characters
- Expire on range exceeded or screen bounds

### 8. Stage Manager (`StageManager.ts`)

4 stages with wave-based progression:

| # | Stage | Theme | Waves | Special |
|---|---|---|---|---|
| 1 | 咸陽城街道 | City streets | 3 | Mixed soldier/archer/spearman |
| 2 | 趙國質子府 | Palace courtyard | 3 | Elite guards, miniboss 管中邪 |
| 3 | 秦長城邊境 | Border wall | 3 | Cavalry + shieldman, miniboss 圖先 |
| 4 | 秦王大殿 | Throne room | 3 | 3-phase boss 嫪毐 |

Each wave spawns enemies with correct `EnemyTypeDef`, attaches `AIController`, registers with CombatSystem/ZDepthSorter. Boss waves use `BossCharacter` with `onSpawnAdd` hooks.

---

## Character Design

### Playable Fighters

| Fighter | HP | MP | Spd | Atk | Def | Jump | Special Trait |
|---|---|---|---|---|---|---|---|
| 項少龍 | 500 | 100 | 160 | 30 | 20 | 80 | Balanced |
| 連晉 | 400 | 80 | 200 | 35 | 10 | 70 | Fast, counter |
| 烏廷芳 | 350 | 120 | 190 | 22 | 15 | 100 | **Double jump**, air dive |
| 善柔 | 300 | 150 | 180 | 40 | 8 | 85 | Teleport backstab, projectiles |
| 嬴政 | 800 | 200 | 120 | 45 | 30 | 65 | Super armor, fullscreen super |

### Per-Fighter Movesets

**項少龍** (Balanced):
| Move | Input | MP | Notes |
|---|---|---|---|
| L1→L2→L3 | J×3 | 0 | 3-hit chain, escalating damage/knockback |
| Heavy | K | 0 | Single powerful swing |
| Flying Knee | →→J / K | 15 | Gap-closer (120px travel) |
| Uppercut | ↑K | 25 | Vertical launcher |
| Sweep Stomp | ↓K | 30 | Wide low hitbox |
| Super 墨子劍法 | ↓→J | 60 | 7-hit multi-hit barrage |

**連晉** (Rushdown):
| Move | Input | MP | Notes |
|---|---|---|---|
| L1→L2→L3 | J×3 | 0 | Fast 3-hit sword combo |
| Heavy | K | 0 | Upward launcher |
| Phantom Step | →→J / K | 20 | Gap-closer (150px), fastest special |
| Sword Wave | ↓K | 30 | Ranged projectile (speed 420, range 300) |
| Counter | Block+K | 15 | High damage counter-attack |
| Super 左手劍法 | ↓→J | 60 | 10-hit multi-hit |

**烏廷芳** (Aerial):
| Move | Input | MP | Notes |
|---|---|---|---|
| L1→L2→L3 | J×3 | 0 | Quick 3-hit (lowest damage) |
| Heavy | K | 0 | Wide swing |
| Pounce | →→J / K | 15 | Gap-closer (140px) |
| Air Dive | J (airborne) | 0 | **Air-only** downward dive |
| Whirl | ↓K | 25 | 360° multi-hit (6 hits) |
| Super 烏家拳 | ↓→J | 60 | 7-hit launcher multi-hit |

**善柔** (Assassin):
| Move | Input | MP | Notes |
|---|---|---|---|
| L1→L2→L3 | J×3 | 0 | Fastest chain (240ms frames) |
| Heavy | K | 0 | Quick heavy |
| Backstab | →→J / K | 20 | Teleport behind target |
| Dagger Throw | ↓K | 15 | 3-hit projectile barrage |
| Bleed Combo | Block+K | 25 | 8-hit rapid multi-hit |
| Super 暗殺術 | ↓→J | 60 | 8-hit wide multi-hit |

**嬴政** (Powerhouse):
| Move | Input | MP | Notes |
|---|---|---|---|
| L1→L2→L3 | J×3 | 0 | Slow but heavy |
| Heavy | K | 0 | Wide 100px ground slam |
| King Charge | →→J / K | 20 | Gap-closer + **super armor** |
| Imperial Palm | ↓K | 30 | 80px wide hitbox |
| Decree 秦王令 | Block+K | 30 | Self-buff: 1.5× ATK for 5s |
| Super 天子之怒 | ↓→J | 70 | **Fullscreen** (800px wide), 90 damage |

### Enemy Types

| ID | NameZH | HP | Atk | AI | Special |
|---|---|---|---|---|---|
| soldier | 兵 | 200 | 12 | normal | Basic melee |
| archer | 弓兵 | 150 | 10 | archer | **Projectile** (arrow), kiting AI |
| spearman | 矛兵 | 300 | 18 | spearman | Long reach (68px hitbox) |
| shieldman | 盾兵 | 400 | 14 | shield | 70% block chance, high defense |
| cavalry | 騎兵 | 350 | 25 | cavalry | Charge-line AI, high speed (260) |
| elite | 精兵 | 500 | 28 | elite | Multi-hit combos |
| boss | 將軍 | 1200 | 40 | boss | Phase boss attacks |
| miniboss_lj | 管中邪 | 1000 | 30 | miniboss_lj | Fast (210 speed) |
| miniboss_tx | 圖先 | 1200 | 35 | miniboss_tx | Long range thrust |
| boss_lao | 嫪毐 | 2000 | 40 | boss | **3-phase** with add spawning |

---

## Procedural Art System (`SpriteGenerator.ts` + `FighterArtSpec.ts`)

All visuals are generated at runtime via `CanvasTexture`:

### Fighter Sprites
Per-fighter visual spec includes:
- **Skin/robe/hair/trim colors**
- **Body proportions**: shoulder width, waist width, head radius
- **Hair style**: short / topknot / braid / ponytail / crown / helmet
- **Weapon**: none / sword / dagger / fan / royalblade / spear / bow / shield_axe / cavalry / hammer

3 poses generated: `idle` (standing), `walk` (one-leg-forward), `attack` (arm-extended)

### Enemy Sprites
10 unique enemy sprites with weapon-appropriate visuals and helmet/topknot hair.

### Shadows
Elliptical semi-transparent shadow for ground reference.

---

## Input System

### Desktop (Keyboard)
| Key | Action |
|---|---|
| WASD / Arrow Keys | Movement (4-directional + Z-axis depth) |
| Space | Jump |
| J | Light attack (chains L1→L2→L3) |
| K | Heavy / Special modifier |
| L | Block (hold) / Counter window |
| ↓→J | Super move |
| ↑K | Up special |
| ↓K | Low special |
| →→J | Dash attack |
| ↓↓S | Buff stance |
| ` | Toggle debug overlay |

### Mobile (Touch)
- **Left side**: Virtual d-pad (circle + directional arrows)
- **Right side**: 4 action buttons — 攻(Attack), 跳(Jump), 特(Special), 防(Block)
- Multi-touch via pointer ID tracking
- Auto-detected on touch devices, hidden on desktop

### Combo Detection
All inputs feed into `ComboParser` with a 300ms sliding window. Directional inputs (WASD/arrows) are also recorded so sequences like ↓→J are detected. Longest match wins.

---

## UI System

| Component | Description |
|---|---|
| **HealthBar** | Green/yellow/red color-coded. Delayed red fill animation (200ms lag). HP text label. |
| **MPBar** | Blue fill bar. MP text label. |
| **ComboIndicator** | Escalating text: 2 HIT! → 3 HIT! → 5 COMBO! → GREAT! → AMAZING! → INCREDIBLE! → UNSTOPPABLE! → GODLIKE! Color shifts at 5 (orange) and 8 (red) hits. Scale bounce + float animation. |
| **StageHUD** | Composes all bars + combo indicator. Player bars top-left, enemy bars top-right. |
| **VirtualDpad** | Touch controls, camera-fixed (scrollFactor 0), depth 900+. |
