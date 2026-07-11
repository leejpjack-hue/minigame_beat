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
| **J → J → J** | 3-hit Light Chain (cancel after ~45% of each hit) | Free |
| **J → J → K** | Light Finisher (special ender from chain) | MP |
| **K** | Heavy Attack (can special-cancel from late lights) | Free |
| **K → K** | Heavy Burst (maps to a special) | MP |
| **→→** or **←←** | Dash (i-frames, cancels attacks) | Free |
| **→→ J** or **←← J** | Dash Attack | MP |
| **→ K** or **← K** | Forward Special | MP |
| **↑ K** | Up Special (uppercut / pounce / palm) | MP |
| **↓ K** or **↓→ K** | Low Special (sweep / wave / whirl) | MP |
| **←↓ K** | Back Special | MP |
| **↓→ J** / **→↓→ J** / **↓↑ J** | **Super Move** | 60–70 MP |
| **↓↓ L** | Buff Stance (ATK up) | MP |
| **L → K** | Counter (best during / just after block) | MP |
| **J** (airborne) | Air Dive (烏廷芳) | Free |

### Cancel Windows
- **Light chain**: press J again after ~45% of the current light to advance L1→L2→L3
- **Special cancel**: from late L1/L2/L3 or Heavy, input a special/super without waiting for idle
- **Dash cancel**: double-tap →/← during an attack to dodge-cancel

### Block + Counter
- Hold **L** to block (reduces incoming damage by 80%)
- Release block → **280ms counter window** (or press **K** while still blocking / **L→K**)

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

## Stages (5 stages × 5 denser waves)

Characters drawn from 《尋秦記》 (A Step into the Past).

### Stage 1: 咸陽城街道 (Xianyang Streets)
- **Theme**: City street brawl — larger packs (4–7 per wave)
- **Grunts**: 兵 / 矛兵 / 盾兵 / 弓兵 / 刺客
- **Mini-boss**: 將軍 (wave 5) + escort
- **Tip**: Learn the basics. Archers kite — chase them down.

### Stage 2: 趙國質子府 (Zhao Palace)
- **Theme**: Zhao court intrigue
- **Grunts**: 趙衛, 刺客, 盾兵
- **Small bosses**:
  - **郭開** — dirty tricks / poison projectiles
  - **趙穆** — Marquis of Zhao, heavy guard
  - **管中邪 + 圖先** (dual) — fast sword + long spear
- **Tip**: Clear assassins first, then focus the named boss.

### Stage 3: 秦長城邊境 (Qin Border Wall)
- **Theme**: Border war with cavalry storms
- **Small bosses**:
  - **成蟜** — rebel prince, aggressive duelist
  - **李牧** — legendary Zhao general (long reach)
- **Tip**: Sidestep (up/down) cavalry charges. Don't trade with 李牧 at spear range.

### Stage 4: 秦王大殿前殿 (Throne Approach)
- **Theme**: Qin power struggle
- **Grunts**: 禁軍 (palace guard)
- **Small bosses**:
  - **呂不韋** — Chancellor tank
  - **荊軻** — glass-cannon assassin
  - **樊於期 + 燕丹** (dual)
  - **王翦** — Qin great general
- **Tip**: 荊軻 dies fast but hits hard — burst him down.

### Stage 5: 秦王大殿 (Qin Throne Room)
- **Theme**: Final gauntlet
- **Rematches**: 管中邪 / 荊軻 / 成蟜, then 呂不韋 + 王翦
- **Final boss**: **嫪毐** — 3-phase fight (+ honor guard)
  - Phase 1: Heavy slams
  - Phase 2: Spawns minions, sweep
  - Phase 3: Fullscreen quake, enraged
- **Tip**: Save super for Phase 3. Kill adds in Phase 2.

---

## Enemy Types

### Grunts
| Enemy | Threat | Strategy |
|---|---|---|
| 兵 (Soldier) | Low | Basic melee, easy to combo |
| 弓兵 (Archer) | Medium | Shoots arrows, kites — chase and punish |
| 矛兵 (Spearman) | Medium | Long reach — approach from diagonal |
| 盾兵 (Shieldman) | Medium | Brief guards — special cancel / dash around |
| 騎兵 (Cavalry) | High | Straight charge — sidestep vertically |
| 精兵 (Elite) | High | Multi-hit combos — don't trade |
| 刺客 (Assassin) | High | Fast glass cannons — burst them |
| 趙衛 / 禁軍 | High | Tough palace troops |

### Named small bosses (尋秦記)
| Character | Style |
|---|---|
| 管中邪 | Fast sword rushdown |
| 圖先 | Long spear keep-away |
| 趙穆 | Armored marquis pressure |
| 郭開 | Poison darts + kiting |
| 李牧 | Elite general, long thrust |
| 呂不韋 | Tank chancellor |
| 成蟜 | Aggressive rebel prince |
| 荊軻 | Assassin glass cannon |
| 樊於期 | Heavy Yan general |
| 燕丹 | Mid-range prince |
| 王翦 | Super-armor Qin general |
| 嫪毐 | Final 3-phase boss |

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
