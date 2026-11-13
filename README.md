# RelicRealm — Warrior Match-3 prototype

A basic browser prototype of the core loop: gather → craft → fortify → raid.
It's plain HTML/CSS/JS with no build step and no backend. Progress is saved in `localStorage`.

## Run it
- Open `index.html` in a browser, **or**
- Serve the folder: `python3 -m http.server 8000`, then open `http://<your-computer-ip>:8000`

## Files
- `js/board.js`: shared match-3 engine (tiles, fixed pieces, gravity, weapons, input)
- `js/forest.js`: Forest gathering board
- `js/battle.js`: Goblin Village battle board
- `js/main.js`: save data, home screen, popups, raid prep
- `js/craft.js`: Camp Workshop (Tier 1 crafting + forge animation)
- `js/sound.js`: music and sound effects, generated in the browser (no audio files)

Each game file has its tuning knobs at the top.

## Forest (gathering)
- 7x7 board, 20 moves, 30-slot backpack. Resources are banked when you head home.
- Tiles (5 main types, so matches come easily):
  - Wood, Stone, Hide (~18% each)
  - **Berries → Food** (~16%)
  - Leaves are filler (~30%)
  - **🪙 Coin** tile → Gold (4%)
  - **🌈★ Star** (3%): wild, completes any match. One star can finish two matches at once (wood-wood-★-stone-stone). Stars also appear on the battle board.
- 3/4/5-match = 1/2/3, +1 on chain reactions.
- **🐾 Goblin tracks** sometimes appear (about 3 in 5 runs). Match next to them to follow them to a goblin village, then:
  - **Raid now:** costs 3 food
  - **Mark it on the map:** raid it later from home
  - **Keep gathering**

## Match specials (both boards)
- **4-match** leaves a wild ★ star behind.
- **5-match** = **line blast**: clears the whole row or column and hits every defense in it.
- Chain reactions show "Nice! / Great! / Awesome!".
- After 4 idle seconds, a possible move wiggles as a hint.

## Crafting (Camp Workshop, Tier 1)
| Item | Cost | Use |
|---|---|---|
| Club | 5 wood | Clears 1 tile (forest or raid) |
| Sling | 4 wood, 3 hide | Hits a tile or defense |
| Wooden fence | 6 wood | Defense (for Fortify, later) |
| Stone wall | 12 stone | Defense, 2 hits (for Fortify, later) |
| Pit trap | 4 wood, 2 hide | Defense (for Fortify, later) |

Crafting plays a forge animation: resources fly onto the anvil, 3 hammer strikes with sparks, then the item appears.

## Sound
🔊 button at the top right: music + effects → effects only → off. There's a calm folk tune for home and the forest and a drum march for raids.

## Goblin Village (battle)
- 7x9 board. The top 4 rows are **fog**. Match next to fog to reveal what's underneath.
- The layout is shuffled every raid:
  - Keep (3 wide, 5 HP) with fences on each side
  - Watchtower (2 HP)
  - Loot chest
  - A third fence
  - 2 hidden pit traps (−1 move when you uncover one with a match)
  - A buried chest
  - Sometimes a prisoner (+3 moves when freed)
- **Goblins act every 3 moves** and do one of these:
  - throw a spear (blocks a tile)
  - sneak a goblin in (each goblin repairs the keep +1 every goblin turn)
  - rebuild a broken fence

  A standing watchtower adds an extra spear each goblin turn.
- 20 moves (+3 with a War drum).
- Breaking the keep = **victory**: a guaranteed goblin spoil and +3 gold. You can keep playing for the loot chest after that.
- **Retreat** keeps what you've grabbed. Running out of moves loses it all.
- Stars:
  - ★ open the loot chest
  - ★ break the keep
  - ★ both, with moves left
- Goblin spoils (can't be crafted):
  - firepot (3x3 blast)
  - shiv (2 uses)
  - rusty iron scraps (+3 iron)
  - war drum (+3 raid moves)
  - palisade blueprint

## Debug (home screen)
- "Goblin tracks appear right away"
- "+1 marked village & +5 food", to jump straight into a raid
- "+20 of every resource", to try crafting

## Not built yet
Dwarf Stronghold, Quarry, Tier 2+ crafting, fortify editor, goblins raiding your board, PvP.
