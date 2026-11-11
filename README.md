# RelicRealm — Warrior Match-3 prototype

A basic browser prototype of the core loop: gather → craft → fortify → raid.
It's plain HTML/CSS/JS with no build step and no backend. Progress is saved in `localStorage`.

## Run it
- Open `index.html` in a browser, **or**
- Serve the folder: `python3 -m http.server 8000`, then open `http://<your-computer-ip>:8000`

## What's in it now
**Forest trail** (`js/forest.js`, the tuning knobs are at the top of the file)
- 7x7 match-3. Resource tiles (wood, stone, hide) spawn ~11% each, filler tiles (leaves, mushroom, berries) ~22% each, and gold 2%.
- Filler matches clear tiles but give nothing.
- 3/4/5-match = 1/2/3 resources, +1 on chain reactions.
- Backpack holds 15 per run. Resources only reach your stockpile when you head home.
- 30 moves. Every 3 matches you walk one row down the trail.
- An encounter is rolled secretly per run and starts entering from the top after 6 rows:
  - 60% nothing
  - 20% abandoned camp (chest, +3 resources)
  - 12% goblin scouts (fence, 2 HP keep, small chest; 25% spoils)
  - 8% goblin village (3-wide 5 HP keep, 2 fences, pit trap, loot chest; guaranteed spoils)
- Matches next to encounter pieces damage them. A pit trap costs 1 move when matched next to.
- Fight or flee:
  - Fleeing before any damage keeps the whole backpack.
  - Fleeing after attacking, or running out of moves while goblins stand, loses half the backpack.
  - Breaking the keep wins.
- Goblin spoils (cannot be crafted):
  - firepot (3x3 blast)
  - rusty iron scraps (+3 iron)
  - shiv (2 uses)
  - war drum (+3 raid moves, for later)
  - palisade blueprint (unlocks Spiked palisade, for later)

**Weapons in the forest**: a Club clears a tile, a Sling hits a tile or a defense, a Firepot blasts 3x3, a Shiv clears a tile per use. Using a weapon doesn't cost a move.

**Debug panel** (home screen): force the next encounter, and optionally skip the walk so the encounter is on the board from the start.

## Not built yet
Crafting, Fortify editor, Raid Goblin Village screen, simulated goblin raid on your board.
A new save starts with 1 Club and 1 Sling for testing.
