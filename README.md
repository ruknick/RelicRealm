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

Each game file has its tuning knobs at the top.

## Forest (gathering)
- 7x7 board, 20 moves, 15-slot backpack. Resources are banked when you head home.
- Tiles:
  - Wood, Stone, Hide (~12% each)
  - **Berries → Food** (~14%)
  - Leaves and Mushrooms are filler (~25% each)
  - **🪙 Coin** tile → Gold (4%)
  - **🌈★ Star** (2%): wild, completes any match. One star can finish two matches at once (wood-wood-★-stone-stone). Stars also appear on the battle board.
- 3/4/5-match = 1/2/3, +1 on chain reactions.
- **🐾 Goblin tracks** sometimes appear (about 3 in 5 runs). Match next to them to follow them to a goblin village, then:
  - **Raid now:** costs 3 food
  - **Mark it on the map:** raid it later from home
  - **Keep gathering**

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

## Not built yet
Dwarf Stronghold, Quarry, crafting, fortify editor, goblins raiding your board, PvP.
A new save starts with 1 Club and 1 Sling for testing.
