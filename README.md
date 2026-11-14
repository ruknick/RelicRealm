# RelicRealm — Warrior Match-3 prototype

A browser prototype of the core loop: **gather → find → craft → raid**.
It's plain HTML/CSS/JS with no build step and no backend. Progress is saved in `localStorage`.

## Run it
- Open `index.html` in a browser, **or**
- Serve the folder: `python3 -m http.server 8000`, then open `http://<your-computer-ip>:8000`

## Files
| File | What |
|---|---|
| `js/data.js` | Resources, items, **materials & weapon damage**, finds, spoils, recipes |
| `js/board.js` | Shared match-3 engine: tiles, fixed pieces, gravity, wild stars, specials, weapons, buried finds |
| `js/gather.js` | Gathering boards: **Forest** and **Iron Hills** |
| `js/battle.js` | Battle boards: **Goblin Village** and **Dwarf Stronghold** |
| `js/craft.js` | Workshop (Tier 1, Tier 2, Tools) with the forge animation |
| `js/main.js` | Save data, home screen, popups, raid prep, spoils |
| `js/sound.js` | Music and sound effects, generated in the browser (home, forest, mine, battle themes) |
| `js/art.js` | Vector art: tiles, obstacles (ore cart, stump, thornbush…), themed board frames, scene backgrounds |

## Right tool for the job
- **Forest stumps & thornbushes:** only **axes** (Stone axe, Iron axe). Matches and other weapons do nothing.
- **Mine boulders & ore veins:** only **pickaxes** (Stone pick, Pickaxe, Dwarven pick).
- **Goblins & dwarves** (the thief, raid goblins, dwarf guards): only **weapons** hurt them, not matches. A keep is repaired by at most +1 per enemy turn.
- **Locked chests:** only a key.

## Materials: why weapons matter
Every obstacle and defense is made of something:
- **Matches** do 1 damage to wood, stone, creatures and other pieces, and **nothing to thorns or iron**.
- **Weapons** do damage according to what the target is made of:

| Weapon | Wood | Thorns | Stone | Iron | Creatures | Notes |
|---|---|---|---|---|---|---|
| 🏏 Club (T1) | 2 | 2 | 0 | 0 | 1 | |
| 🪃 Sling (T1) | 1 | 1 | 1 | 1 | 1 | reaches into fog |
| 🪓 Iron axe (T2, 3 uses) | 3 | 3 | 0 | 0 | 1 | stumps give +5 wood |
| ⛏️ Pickaxe (T2, 3 uses) | 1 | 1 | 3 | 2 | 0 | ore veins give double iron |
| ⚔️ Iron sword (T2, 3 uses) | 1 | 1 | 1 | 1 | 3 | 2 damage to any keep |
| 🔥 Firepot (goblin spoil) | 2 | 2 | 0 | 0 | 1 | 3x3 area, burns fog |
| ⚒️ Dwarven pick (dwarf spoil, 3 uses) | 2 | 2 | 9 | 9 | 1 | |
| 🗝️ Old key (found) | – | – | – | – | – | opens locked chests and iron gates |

Tapping a weapon on something it can't hurt tells you so and doesn't use it up.

## Gathering boards
| | 🌲 Forest | ⛏️ Iron Hills |
|---|---|---|
| Tiles | wood, stone, hide, berries→food, leaves (filler) | stone, ore→iron, coal, gravel & bones (filler) |
| Obstacles | stumps (wood), thornbushes (hide a find), sometimes a locked chest | boulders (stone), ore veins (each hit = iron), sometimes a locked chest |
| Runaway event | 🏃 goblin thief with a sack | 🛒 runaway ore cart |
| Discovery | 🐾 tracks → Goblin Village | ᚱ rune stone → Dwarf Stronghold |

**Locked chests open only with a key.** When one appears, its key is always buried somewhere on the same board. A goblin thief may also be carrying it. Dig it up, then tap 🗝️ and the chest.

Every find plays a **reveal**: dirt bursts out of the tile, the item flies to the centre in a burst of light with a fanfare, and keys and relic shards count as rare finds.

Both lands also have:
- **3 buried finds per board**, dug up when you clear the tile above one: caches, food baskets, ore pockets, coal seams, gold nuggets, lost clubs, **old keys**, **map scraps** (3 complete a map that marks a raid target) and **relic shards** (5 make the 👑 Old King's Crown, +2 moves in every raid).
- Wild ★ stars (3%) and 🪙 coins (4%).
- A 4-match makes a star and a 5-match blasts a whole line.
- 20 moves and a 30-slot backpack.

## Battle boards (7x9, fog over the top 4 rows, layout shuffled every raid)
| | 🔥 Goblin Village | ⚒️ Dwarf Stronghold |
|---|---|---|
| Cost / moves | 3 food / 20 | 4 food / 22 |
| Built from | wood | stone & iron |
| Keep | KEEP (wood, 5 HP) with fences | GREAT HALL (stone, 6 HP), walled in by stone walls and an **iron gate** |
| Hidden in the fog | watchtower, loot chest, buried chest, pit traps, sometimes a prisoner (+3 moves) | ballista, vault, gem chest, rockfall traps, **the gate key** |
| Every 3 moves | spears, sneaking goblins (repair the keep), rebuilt fences | ballista bolts, armored guards (2 HP, repair the hall), shored-up walls, rebuilt walls |
| Spoils (can't be crafted) | firepot, shiv, war drum, iron scraps, palisade blueprint | dwarven pick, dwarf ale, runestone, iron ingots, mine-cart blueprint |

War drum and dwarf ale each give +3 moves when used at raid prep.

## Levels
You earn XP from:
- resource matches (1)
- breaking obstacles (3)
- finds (5)
- following tracks or a rune stone (5)
- catching the thief or cart (8)
- crafting (5, or 10 for Tier 2)
- raids: a win is 40 (60 for dwarves), opening the loot chest or vault adds 10, and a retreat gives 10

Levels need 30, 90, 180, 300, 450… total XP. As you level up, the gathering boards fight back:

| Level | Start obstacles | New obstacle every | Obstacle HP | Buried finds |
|---|---|---|---|---|
| 1 | 4 | – | base | 3 |
| 2 | 4 | 6 moves | base | 3 |
| 4 | 6 | 4 moves | +1 | 4 |
| 7 | 8 | 3 moves | +2 | 5 |
| 10+ | 10 | 3 moves | +2 | 6 |

Thornbushes sprout and trees fall in the forest. Rocks tumble from the ceiling and new ore veins appear in the mine. Tier 2 weapons hit harder (axe 4 vs wood, pickaxe 4 vs stone) and **cleave** 1 damage into neighbouring obstacles, so they clear crowded high-level boards much faster than a club.

## 🏰 Your camp & the Siege Race
**Fortify:** place your crafted defenses in the top 4 rows of your 7x9 camp, around your **Keep** (6 HP) and your **📦 loot chest**. Raiders come from the bottom. The point budget is 5 + your level, up to 16.

| Defense | Pts | HP | Effect |
|---|---|---|---|
| 🪵 Fence | 1 | 2 | cheap blocker |
| 🕳️ Pit trap | 1 | – | hidden; the attacker loses a move |
| 🧱 Stone wall | 2 | 4 | sturdy |
| 🔱 Spiked palisade | 2 | 3 | each hit costs the attacker a move (needs the goblin blueprint) |
| 🗼 Watchtower | 2 | 3 | every 3 moves, 60% chance to drive attackers back |
| 🚪 Iron gate | 3 | 4 | goblins rarely dent it (max 2) |
| 🪨 Runestone | 1 | 1 | +1 HP to every defense touching it (dwarf spoil) |

New players get 2 fences and a pit trap, already placed. The screen shows how many moves goblins and dwarves would need to break your keep.

**Siege Race (every raid):**
- You attack their base while their AI attacks your camp. There's no move budget: **fewest moves to break the other keep wins**.
- After 40 moves, whoever did more keep damage wins.
- Each of your moves (including weapon uses) gives them a move. Hidden traps on their side give them an extra one.
- **Big combos and line blasts throw rubble** in their way (they lose a move). Their big hits throw rubble onto your board.
- Freeing a prisoner sabotages them (−2 moves). War drum, dwarf ale and the Crown give you a head start.
- **Loot chests hold special items** (keys, map scraps, relic shards). Open theirs before you break their keep to take some. If they open yours, they take some of yours.
- **Lose** and they plunder 10% of your storehouse.
- Stars: ★ win · ★ open their chest · ★ your chest stays safe.

## Workshop
- **Tier 1 · Camp:** Club 5 wood · Sling 4 wood, 3 hide · **Stone axe** 4 wood, 3 stone (2 uses, 2 dmg) · **Stone pick** 3 wood, 4 stone (2 uses, 2 dmg)
- **Tier 2 · Forge:** Iron axe 4 wood, 3 iron · Pickaxe 3 wood, 4 iron · Iron sword 2 hide, 5 iron, 2 coal
- **Tools (passive, permanent):** Hatchet (+1 wood per wood match) · Skinning knife (+1 hide) · Miner's lamp (buried finds glimmer)
- **Defenses (for Fortify, later):** Wooden fence · Stone wall · Pit trap

## Debug (home screen)
- Make tracks or a rune stone appear right away, or the thief or cart.
- +1 marked village and stronghold, +8 food.
- +20 of every resource.
- ⭐ +1 level.

## Not built yet
Real PvP (needs a server), Volcano land, Tier 3+.
