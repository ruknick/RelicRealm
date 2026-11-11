# RelicRealm — Warrior Match-3 prototype

A basic browser prototype of the core loop: gather → craft → fortify → raid.
It's plain HTML/CSS/JS with no build step and no backend. Progress is saved in `localStorage`.

## Run it
- Open `index.html` in a browser, **or**
- Serve the folder (handy for testing on a phone on the same Wi‑Fi):
  `python3 -m http.server 8000`, then open `http://<your-computer-ip>:8000`

## Status
- [x] 1. Forest level: 7x7 match-3 with a stockpile (3/4/5-match = 3/6/9), 20 moves, end summary
- [x] 2. Goblin ambush: an 8% chance per move. Each goblin steals 1 resource per move. Beat it with an adjacent match (bonus loot) or a weapon (tap the weapon, then the goblin)
- [ ] 3. Crafting + inventory
- [ ] 4. Raid the Goblin Village
- [ ] 5. Fortify editor
- [ ] 6. Simulated goblin raid on your board

A new save starts with 1 Club and 1 Sling for testing. Crafting replaces this in step 3.
