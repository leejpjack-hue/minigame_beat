# 尋秦記齊打交 — Game Manual

## What is this?

**尋秦記齊打交** is a 2.5D beat 'em up game inspired by Little Fighter 2, set in the world of the classic HK drama *A Step into the Past* (尋秦記). Fight through 4 stages of enemies across Qin dynasty battlefields, from the streets of Xianyang to the Emperor's throne room.

---

## Getting Started

### Run the game
```bash
npm install
npm run dev
```
Open the URL shown in terminal (default: `http://localhost:5173`).

### Game Flow
1. **Title Screen** → Press Enter or tap to start
2. **Character Select** → Pick your fighter (arrow keys or tap)
3. **Stage 1-4** → Fight through waves of enemies
4. **Victory!** → Clear all 4 stages to win

---

## Controls

### Desktop (Keyboard)

| Key | Action |
|---|---|
| **W/A/S/D** or **Arrow Keys** | Move (left/right/forward/back) |
| **Space** | Jump |
| **J** | Light Attack |
| **K** | Heavy / Special |
| **L** | Block (hold) |
| **R** | Restart (on Game Over) |
| **`** (backtick) | Toggle debug info |

### Combo Moves (Keyboard)

| Input | Move | Cost |
|---|---|---|
| **J → J → J** | 3-hit Light Chain | Free |
| **K** | Heavy Attack | Free |
| **→→ J** or **←← J** | Dash Attack | Free |
| **↑ K** | Up Special (uppercut/launcher) | MP |
| **↓ K** | Low Special (sweep/projectile) | MP |
| **↓→ J** | **Super Move** | 60 MP |
| **↓↓ L** | Buff Stance | — |
| **J** (while airborne) | Air Dive (some fighters) | Free |

### Block + Counter
- Hold **L** to block (reduces incoming damage by 80%)
- Release block and immediately attack for a counter window

### Mobile (Touch)
- **Left thumb zone**: Virtual D-pad for movement
- **Right thumb zone**: 4 buttons
  - **攻** = Light Attack
  - **跳** = Jump
  - **特** = Special
  - **防** = Block

---

## Fighters

### 項少龍 (Xiang Shao Long) — The Hero
- **Style**: Balanced all-rounder
- **HP**: 500 | **MP**: 100 | **Speed**: 160
- **Strength**: Easy to pick up, no weaknesses
- **Super**: 墨子劍法 — 7-hit barrage (60 MP)

### 連晉 (Lian Jin) — The Rival
- **Style**: Fast rushdown
- **HP**: 400 | **MP**: 80 | **Speed**: 200
- **Strength**: Fastest attacks, counter ability, ranged sword wave
- **Super**: 左手劍法 — 10-hit multi-strike (60 MP)

### 烏廷芳 (Wu Ting Fang) — The Agile Fighter
- **Style**: Aerial specialist
- **HP**: 350 | **MP**: 120 | **Speed**: 190
- **Strength**: **Double jump**, air dive attack, 360° whirl
- **Super**: 烏家拳 — 7-hit launcher (60 MP)

### 善柔 (Shan Rou) — The Assassin
- **Style**: Glass cannon
- **HP**: 300 | **MP**: 150 | **Speed**: 180
- **Strength**: Teleport backstab, dagger barrage, fastest chain
- **Super**: 暗殺術 — 8-hit wide assault (60 MP)

### 嬴政 (Ying Zheng) — The King
- **Style**: Tank powerhouse
- **HP**: 800 | **MP**: 200 | **Speed**: 120
- **Strength**: Super armor on charge, self-buff, **fullscreen super**
- **Super**: 天子之怒 — Screen-wide devastation (70 MP)

---

## Stages

### Stage 1: 咸陽城街道 (Xianyang Streets)
- **Theme**: City street brawl
- **Waves**: 3 waves of soldiers, archers, spearmen
- **Tip**: Learn the basics here. Archers kite — chase them down.

### Stage 2: 趙國質子府 (Zhao Palace)
- **Theme**: Palace courtyard
- **Waves**: 3 waves with elite guards
- **Miniboss**: 管中邪 — Fast swordsman, aggressive AI
- **Tip**: Block frequently. Elites combo, so don't get greedy.

### Stage 3: 秦長城邊境 (Qin Border Wall)
- **Theme**: Misty border fort
- **Waves**: 3 waves with cavalry and shieldmen
- **Miniboss**: 圖先 — Long-range spear fighter
- **Tip**: Cavalry charge in straight lines — sidestep (up/down) to dodge. Shieldmen block a lot — use throws or lows.

### Stage 4: 秦王大殿 (Qin Throne Room)
- **Theme**: Red and gold throne room
- **Boss**: 嫪毐 — **3-phase fight**
  - **Phase 1** (100-66%): Heavy slams
  - **Phase 2** (66-33%): Spawns minions, gains sweep attack
  - **Phase 3** (33-0%): Fullscreen quake, 1.5× speed, enraged
- **Tip**: Save your super for Phase 3. Kill adds quickly in Phase 2.

---

## Enemy Types

| Enemy | Threat | Strategy |
|---|---|---|
| 兵 (Soldier) | Low | Basic melee, easy to combo |
| 弓兵 (Archer) | Medium | Shoots arrows, runs away — chase and punish |
| 矛兵 (Spearman) | Medium | Long reach — approach from diagonal |
| 盾兵 (Shieldman) | High | Blocks 70% of attacks — use heavy/special to break guard |
| 騎兵 (Cavalry) | High | Fast charge attack — sidestep vertically |
| 精兵 (Elite) | High | Multi-hit combos — don't trade blows |

---

## Tips

1. **Chain your lights**: Tap J three times for the full L1→L2→L3 chain. Time it during the late window of each hit.
2. **Use specials often**: They cost MP but deal much more damage. MP regenerates slowly.
3. **Block is powerful**: 80% damage reduction. Use it between enemy attack patterns.
4. **Vertical dodging**: Moving up/down (Z-axis) dodges horizontal attacks and cavalry charges.
5. **Combo counter**: Keep hitting without a 2-second gap to build the combo counter for bonus text.
6. **Air dive** (烏廷芳): Jump, then press J in the air for a powerful downward dive.
7. **嬴政's Decree**: Use ↓↓L to buff ATK by 1.5× for 5 seconds before unleashing your super.
8. **Boss Phase 3**: When 嫪毐 turns red, he gains a fullscreen attack. Block it or get clear.

---

## Debug Mode

Press **`** (backtick) to toggle the debug overlay, which shows:
- Player position, state, HP/MP
- Current attack name and hitbox status
- Enemy count
- Hit combo counter

---

## Tech Info

- **Engine**: Phaser 3.80+
- **Language**: TypeScript 5.x
- **Build**: Vite 5.x
- **No external assets** — all sprites are procedurally generated colored rectangles with layered body parts
