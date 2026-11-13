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

## Workshop
- **Tier 1 · Camp:** Club 5 wood · Sling 4 wood, 3 hide
- **Tier 2 · Forge:** Iron axe 4 wood, 3 iron · Pickaxe 3 wood, 4 iron · Iron sword 2 hide, 5 iron, 2 coal
- **Tools (passive, permanent):** Hatchet (+1 wood per wood match) · Skinning knife (+1 hide) · Miner's lamp (buried finds glimmer)
- **Defenses (for Fortify, later):** Wooden fence · Stone wall · Pit trap

## Debug (home screen)
- Make tracks or a rune stone appear right away, or the thief or cart.
- +1 marked village and stronghold, +8 food.
- +20 of every resource.

## Not built yet
Fortify editor, goblins and dwarves raiding your board, PvP, Tier 3+.
