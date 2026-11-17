# Item breakdown: what we have, what it does, what to keep

This is a review of every item and resource in Tile Realm, with notes on what earns its place and what to merge or cut later.
The full recipe and resource tables, generated from the game data, are the appendices at the bottom.

## The count today

| Kind | How many | Notes |
|---|---|---|
| Resources (raw + refined) | 38 | 8 basic, 15 rares, 7 bars/refined, 8 foods |
| Weapons | 15 | 10 crafted by tier, 2 sea, 1 boss, 2 raid spoils |
| Tools | 10 | wood-axe, pick, hammer × 3 tiers, + Dwarven pick |
| Armor | 21 | 5 slots × 4 tiers, + Shellback buckler |
| Amulets | 5 | 3 crafted (gem + silver), 2 from bosses |
| Keys | 3 | Old → Gold → Crystal |
| Food dishes | 8 | plus 10 raw foods eaten straight from the Storehouse |
| Camp defenses | 7 | plus the Runestone booster |
| Kit (passive helpers) | 3 | Hatchet, Skinning knife, Miner's lamp |
| Board items | 4 | Firepot, Water flask, keys used on the board |
| Raid boosts / unlocks | 4 | War drum, Dwarf ale, two blueprints |
| Story / boss prep | 2 | Old King's Crown, Elderwood ward |

**Roughly 115 different things.** That's a lot for a phone game, and some of them overlap or don't do anything yet.

## How the gear system works (the core idea)

- **Tiers:** Wood/Leather (1) → Iron (2) → Steel (3) → Mythic/Starsilver (4). Each tier matches an era of levels: 1–9, 10–19, 20–34, 35+.
- **Weapons hit monsters; tools hit obstacles.** A weapon or tool can only damage things of its tier or lower at full strength. Hitting something harder does a fraction of the damage (½, ¼, ⅛ for weapons).
- **Weapon types:** the battle-axe cleaves its neighbours, the sword gets +1 damage, and the bow hits the whole column.
- **Tool types:**
  - the **wood-axe** chops stumps, bushes and kelp
  - the **pick** breaks rock, veins and coral
  - the **hammer** smashes built defenses on raids
- **Armor** wears down as it takes hits (4 / 8 / 14 / 25 hits by tier). **Gloves** also add starting ⚡.
- **Stations gate the tiers:**
  - Workbench: wood and leather
  - Smelter (Lv 8): bars
  - Forge (Lv 10): iron
  - Dwarven Forge (Lv 20, after a dwarf win): steel
  - Star Anvil (Lv 35): mythic

This part is solid and is the most original thing in the game. Keep it.

## Problems found

### Things that do nothing (or point at content that doesn't exist)
1. **Mine-cart blueprint** (dwarf spoil) unlocks a "Mine-cart defense" that was never built. **Cut it, or build the defense.**
2. **Dragon scale** drops from Emberwyrm but nothing uses it ("Beyond the Known Realm… coming"). **Keep it for the Beyond lands, or give it a use now,** e.g. a dragonscale armor upgrade.
3. **Pearl sabre** mentions the "Deep Tunnels, coming", and the **Coral spear** mentions "worse later". **Reword them until those places exist.**

### Duplicates and overlaps
4. **Elderwood ward** (boss-prep item) vs **Elderwood ward-shield** (mythic shield). Both are "elderwood that stops dragonfire". **Merge:** the shield does the job, so drop the prep item, or make the ward a one-use version for players without the shield.
5. **War drum** and **Dwarf ale** do exactly the same thing (defenders wait 3 moves longer). **Merge into one raid boost,** or give the ale a different effect (e.g. +1 ⚡ per turn on the raid).
6. **Hammers** (3 tiers) are only used for breaking defenses on raids, which the wood-axe and pick partly do already. **Consider cutting the hammer line,** so the pick breaks stone defenses and the axe breaks wooden ones. That's 3 fewer items and one less "wrong tool" moment.
7. **Two kinds of scrap:**
   - The goblin spoil "Rusty iron scraps" gives iron ore directly.
   - The **Scrap iron** resource has to be smelted.
   - The dwarf spoil "Dwarven ingots" gives *ore*, not bars.

   **Unify them:** scrap → Scrap iron (smelt it), ingots → actual iron bars.
8. **Coal vs charcoal.** Coal smelts iron, silver and gold; charcoal (burned from oak) is needed for steel and starsilver. Two fuels is a lot to learn. **Option:** keep charcoal as the "better fuel" but explain it clearly, or drop it and make steel cost coal + oak.

### Items with only one use
9. **Pearl, Coral, Crab shell and Scrap iron** each feed a single recipe. That's fine for rares, but each could gain a second use. For example, pearls in amulets or the Crown, and coral in sea defenses.
10. **Apples and Berries** are only eaten raw; no recipe uses them. An **apple pie** or **berry tart** would make the farm feel more useful.
11. **Wild mushrooms** are used in a single dish.

### Gaps in the weapon line-up
12. There's **no wood-tier sword** and **no mythic battle-axe.** Each tier has a slightly different set, so players can't simply "upgrade my axe". **Fill the grid** (axe, sword and bow at every tier) or deliberately make each tier offer two of the three.
13. **Goblin shiv** is iron-tier but uses the same picture as the Iron sword. It needs its own art, or it could become the wood-tier sword.

### Too many foods?
14. There are **10 raw foods + 8 dishes**. Raw food is eaten lowest-first automatically, so most players never think about it. **Suggestion:** keep the dishes (they're the level-gated upgrades) but group the raw foods in the Storehouse as one "Larder" number.

## Suggested trimmed set (for discussion)

| Category | Now | Suggested | Change |
|---|---|---|---|
| Tools | 10 | 7 | drop the hammer line |
| Weapons | 15 | 15 | fill the gaps instead of adding more |
| Raid boosts | 4 | 2 | merge drum/ale, cut the mine-cart blueprint |
| Boss prep | 2 | 1 | merge the Elderwood ward into the shield |
| Scrap/ingot spoils | 3 kinds | 1 | everything becomes Scrap iron or iron bars |
| Foods | 18 | 18 | show raw foods as one Larder total |

This removes about 8 items and fixes every "does nothing" case, without touching the core loop.

---
## Appendix A · Every recipe (from the game data)

### Smelting & materials

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Tan leather → 1 Leather | Workbench | — | 2 Hide, 1 Pine | Cure hides over an oak-bark fire into tough leather. |
| Smelt iron bars → 1 Iron bar | Smelter | — | 2 Iron ore, 1 Coal | Melt iron ore down into a bar for the forge. |
| Smelt scrap iron → 1 Iron bar | Smelter | — | 3 Scrap iron, 1 Coal | Goblin junk melts down into good iron. |
| Smelt silver bars → 1 Silver bar | Smelter | — | 2 Silver, 1 Coal | For amulet chains and crystal keys. |
| Smelt a gold bar → 1 Gold bar | Smelter | — | 6 Gold, 1 Coal | Melt gold nuggets down into a bar fit for a crown. |
| Burn charcoal → 3 Charcoal | Smelter | — | 2 Oak | Slow-burn oak into charcoal for steel. |
| Smelt starsilver bars → 1 Starsilver bar | Dwarven Forge | — | 3 Starsilver, 2 Charcoal | The mythic metal — only a dwarven fire can melt it. |
| Forge steel bars → 1 Steel bar | Dwarven Forge | — | 2 Iron bar, 2 Charcoal, 1 Water | Iron bars + charcoal, folded and quenched — the dwarven way. |

### Weapons

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Wooden battle-axe | Workbench | — | 4 Pine, 1 Leather | Wood tier · monsters only · cleaves half damage into monsters beside the target. |
| Pine short bow | Workbench | — | 3 Pine, 1 Leather | Wood tier · monsters only · hits every monster in the column. |
| Iron battle-axe | Forge | — | 3 Iron bar, 2 Oak | Iron tier · monsters only · cleaves half damage into monsters beside the target. |
| Iron sword | Forge | — | 3 Iron bar, 1 Oak, 1 Leather | Iron tier · monsters only · +1 damage on every hit. |
| Oak longbow | Forge | — | 4 Oak, 1 Leather, 1 Iron bar | Iron tier · monsters only · hits every monster in the column. |
| Steel battle-axe | Dwarven Forge | — | 3 Steel bar, 2 Ironwood | Steel tier · monsters only · cleaves half damage into monsters beside the target. |
| Steel sword | Dwarven Forge | — | 3 Steel bar, 1 Ironwood, 1 Leather | Steel tier · monsters only · +1 damage on every hit. |
| Ironwood war bow | Dwarven Forge | — | 4 Ironwood, 1 Leather, 1 Steel bar | Steel tier · monsters only · hits every monster in the column. |
| Starsilver blade | Star Anvil | — | 4 Starsilver bar, 1 Elderwood, 1 Leather | Mythic tier · monsters only · +1 damage on every hit. |
| Elderwood greatbow | Star Anvil | — | 5 Elderwood, 1 Starsilver bar, 1 Leather | Mythic tier · monsters only · hits every monster in the column. |
| Coral spear | Workbench | — | 5 Coral, 2 Pine, 1 Leather | Sea gear · iron strength, no forge needed · pierces the monsters above & below · bane of sea creatures (crabs now, worse things later). |
| Pearl sabre | Forge | — | 3 Pearl, 2 Iron bar, 1 Oak | Sea gear · light: swings cost 1 less ⚡ · +1 damage · its pearl glows — bane of creatures of the dark (Deep Tunnels, coming). |

### Tools

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Stone wood-axe | Workbench | — | 3 Pine, 3 Stone | Wood tier · obstacles & defenses only · chops stumps, bushes, kelp & wooden defenses. |
| Stone pick | Workbench | — | 3 Pine, 4 Stone | Wood tier · obstacles & defenses only · breaks rock, ore veins, coral & stone defenses. |
| Stone hammer | Workbench | — | 2 Pine, 5 Stone | Wood tier · obstacles & defenses only · smashes any built defense: walls, gates, towers, keeps. |
| Iron wood-axe | Forge | — | 2 Iron bar, 1 Oak | Iron tier · obstacles & defenses only · chops stumps, bushes, kelp & wooden defenses. |
| Iron pick | Forge | — | 2 Iron bar, 1 Oak | Iron tier · obstacles & defenses only · breaks rock, ore veins, coral & stone defenses. |
| Iron hammer | Forge | — | 3 Iron bar, 1 Oak | Iron tier · obstacles & defenses only · smashes any built defense: walls, gates, towers, keeps. |
| Steel wood-axe | Dwarven Forge | — | 2 Steel bar, 1 Ironwood | Steel tier · obstacles & defenses only · chops stumps, bushes, kelp & wooden defenses. |
| Steel pick | Dwarven Forge | — | 2 Steel bar, 1 Ironwood | Steel tier · obstacles & defenses only · breaks rock, ore veins, coral & stone defenses. |
| Steel hammer | Dwarven Forge | — | 3 Steel bar, 1 Ironwood | Steel tier · obstacles & defenses only · smashes any built defense: walls, gates, towers, keeps. |

### Armor

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Leather cap | Workbench | 1 | 2 Leather | Leather tier · armor (hardness 1) · takes blows to the head. |
| Leather jerkin | Workbench | 8 | 4 Leather | Leather tier · armor (hardness 1) · takes most of the blows aimed at you. |
| Leather leggings | Workbench | 6 | 3 Leather | Leather tier · armor (hardness 1) · takes blows to the legs. |
| Leather gloves | Workbench | 2 | 1 Leather | Leather tier · armor (hardness 1) · start every board with +1 ⚡. |
| Wooden buckler | Workbench | 4 | 4 Pine, 1 Leather | Leather tier · armor (hardness 1) · catches blows before they reach you. |
| Shellback buckler | Workbench | — | 5 Crab shell, 1 Leather | Sea gear · iron-strong crab shell, no forge needed · catches blows before they reach you. |
| Iron helm | Forge | 10 | 2 Iron bar, 1 Leather | Iron tier · armor (hardness 2) · takes blows to the head. |
| Iron mail | Forge | 18 | 5 Iron bar, 2 Leather | Iron tier · armor (hardness 2) · takes most of the blows aimed at you. |
| Iron greaves | Forge | 16 | 3 Iron bar, 1 Leather | Iron tier · armor (hardness 2) · takes blows to the legs. |
| Iron gauntlets | Forge | 12 | 1 Iron bar, 1 Leather | Iron tier · armor (hardness 2) · start every board with +2 ⚡. |
| Iron-rimmed shield | Forge | 14 | 2 Iron bar, 2 Oak | Iron tier · armor (hardness 2) · catches blows before they reach you. |
| Steel helm | Dwarven Forge | 20 | 2 Steel bar, 1 Leather | Steel tier · armor (hardness 3) · takes blows to the head. |
| Steel plate | Dwarven Forge | 32 | 4 Steel bar, 2 Leather | Steel tier · armor (hardness 3) · takes most of the blows aimed at you. |
| Steel greaves | Dwarven Forge | 29 | 3 Steel bar, 1 Leather | Steel tier · armor (hardness 3) · takes blows to the legs. |
| Steel gauntlets | Dwarven Forge | 23 | 1 Steel bar, 1 Leather | Steel tier · armor (hardness 3) · start every board with +3 ⚡. |
| Steel tower shield | Dwarven Forge | 26 | 2 Steel bar, 2 Ironwood | Steel tier · armor (hardness 3) · catches blows before they reach you. |
| Starsilver helm | Star Anvil | 35 | 3 Starsilver bar, 1 Leather | Mythic tier · armor (hardness 4) · takes blows to the head. |
| Starsilver plate | Star Anvil | 40 | 6 Starsilver bar, 2 Leather | Mythic tier · armor (hardness 4) · takes most of the blows aimed at you. |
| Starsilver greaves | Star Anvil | 38 | 4 Starsilver bar, 1 Leather | Mythic tier · armor (hardness 4) · takes blows to the legs. |
| Starsilver gauntlets | Star Anvil | 36 | 2 Starsilver bar, 1 Leather | Mythic tier · armor (hardness 4) · start every board with +4 ⚡. |
| Elderwood ward-shield | Star Anvil | 37 | 4 Elderwood, 2 Starsilver bar | Mythic tier · armor (hardness 4) · elderwood never burns: catches dragonfire. |

### Amulets

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Rootstone amulet | Forge | — | 2 Emerald, 1 Silver bar, 1 Leather | Emerald · earth power: your matches chip ANY obstacle or defense beside them — stumps, rocks, coral, even iron. |
| Tidestone amulet | Forge | — | 2 Sapphire, 2 Silver bar, 1 Leather | Sapphire · tide power: matches of 4+ and chains give +1 more ⚡, blasts give +1 more. |
| Emberstone amulet | Forge | — | 2 Ruby, 2 Silver bar, 1 Gold bar | Ruby · fury power: when a match strikes a monster beside it, your weapon hits for +2. |

### Keys

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Gold key | Workbench | — | 6 Gold, 2 Old key | Opens gold & bronze chests and iron gates. |
| Crystal key | Forge | — | 1 Silver bar, 3 Water, 2 Gold key | Opens any chest — crystal chests hold the rarest loot. |

### The Crown

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Old King's Crown | Forge | — | 3 Gold bar, 5 relic shards | Legendary. Forged from the five relic shards and gold. On raids their defenders wait 2 moves longer, and the way to Emberwyrm opens. |

### Camp defenses

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Wooden fence | Workbench | — | 6 Pine | Defense: wood (hardness 1), 2 HP. 1 pt. |
| Pit trap | Workbench | — | 4 Pine, 2 Hide | Defense: hidden — an attacker who finds it loses a move. 1 pt. |
| Stone wall | Workbench | — | 12 Stone | Defense: stone (hardness 2), 4 HP — wood-armed goblins can barely scratch it. 2 pts. |
| Watchtower | Workbench | — | 8 Pine, 1 Leather | Defense: wood, 3 HP. Every 3 moves it may drive attackers back. 2 pts. |
| Spiked palisade | Workbench | — | 6 Pine, 1 Iron bar | Defense: wood, 3 HP. Every hit costs the attacker a move. 2 pts. |
| Iron gate | Forge | — | 3 Iron bar, 1 Oak | Defense: iron (hardness 3), 4 HP. Only steel can dent it. 3 pts, max 2. |
| Steel bulwark | Dwarven Forge | — | 2 Steel bar, 6 Stone | Defense: steel (hardness 4), 5 HP. Stops even steel-armed dwarves. 4 pts, max 2. |

### Kit (passive helpers)

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Hatchet | Workbench | — | 6 Pine, 1 Iron bar | +1 pine on every wood match. |
| Skinning knife | Workbench | — | 2 Pine, 1 Iron bar | +1 hide on every hide match. |
| Miner's lamp | Workbench | — | 4 Coal, 1 Iron bar, 2 Gold | Buried finds glimmer so you can dig them up. |

### Food

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Trail bread | Workbench | 1 | 2 Wheat, 1 Water | Plain wheat bread: +5 ❤️. |
| Roast chicken | Workbench | 5 | 2 Meat, 1 Pine | Spit-roasted over a wood fire: +10 ❤️. |
| Farmhouse pie | Workbench | 15 | 2 Meat, 2 Wheat, 1 Eggs | Meat, wheat and egg under a golden crust: +18 ❤️. |
| Fish chowder | Workbench | 3 | 3 Herring, 2 Water | Herring chowder in a bottle: +8 ❤️. |
| Honey cake | Workbench | 9 | 2 Wild honey, 1 Wheat, 1 Eggs | Sweet and filling: +12 ❤️. |
| Salmon & mushroom pie | Workbench | 12 | 2 Salmon, 2 Wild mushrooms, 1 Pine | A proper hot pie: +15 ❤️. |
| Swordfish steak | Workbench | 20 | 1 Swordfish, 1 Coal | Grilled over coals: +20 ❤️. |
| Kingfish feast | Workbench | 28 | 1 Golden kingfish, 1 Wild honey, 1 Salmon | A feast fit for the Old King: +40 ❤️. |

### Boss prep

| Makes | Station | Level | Cost | What it does |
|---|---|---|---|---|
| Water flask | Workbench | — | 4 Water, 1 Leather | Throw it to douse lava and flood-water in a 3x3 area. |
| Elderwood ward | Workbench | — | 3 Elderwood, 2 Water | Carry it into the Dragon's Lair: dragonfire burns you for half. |

### Not craftable (won, found or starter)

| Item | Where from | What it does |
|---|---|---|
| Goblin shiv | Goblin raid spoil | Iron tier · monsters only · +1 damage on every hit. |
| Dwarven pick | Dwarf raid spoil | Steel tier · obstacles & defenses only · breaks rock, ore veins, coral & stone defenses. |
| Grak's war-axe | Boss reward | Won from Grak the Warchief · iron-strong, no forge needed · cleaves half damage into monsters beside the target. |
| Heart of Stone | Boss reward | Pried from the Stone Golem · stone power: +8 max ❤️. |
| Siren's Pearl | Boss reward | Won from the Siren Queen · siren power: every match of 4 or more heals you 1 ❤️. |
| Old key | Buried finds, chests, rewards | Opens bronze chests and iron gates. |
| Goblin firepot | Goblin raid spoil | Burns a 3x3 area: hurts wood, plants & monsters, clears fog. |
| War drum | Goblin raid spoil | Beat it as you raid: their defenders wait 3 moves longer. |
| Palisade blueprint | Goblin raid spoil | Unlocks the Spiked palisade defense. |
| Dwarf ale | Dwarf raid spoil | Share it with the guards as you raid: their defenders wait 3 moves longer. |
| Runestone | Dwarf raid spoil | Place in your camp: +1 HP to every defense touching it. 1 pt. |
| Mine-cart blueprint | Dwarf raid spoil | Unlocks the Mine-cart defense. |

## Appendix B · Every resource: where it comes from, what uses it

| Resource | Used in |
|---|---|
| Pine | Tan leather, Wooden battle-axe, Pine short bow, Coral spear, Stone wood-axe, Stone pick, Stone hammer, Wooden buckler, Wooden fence, Pit trap, Watchtower, Spiked palisade, Hatchet, Skinning knife, Roast chicken, Salmon & mushroom pie |
| Stone | Stone wood-axe, Stone pick, Stone hammer, Stone wall, Steel bulwark, build Smelter, build Forge, build Dwarven Forge, build Star Anvil |
| Hide | Tan leather, Pit trap |
| Berries | eaten raw (+2 ❤️) |
| Gold | Smelt a gold bar, Gold key, Miner's lamp |
| Iron ore | Smelt iron bars |
| Coal | Smelt iron bars, Smelt scrap iron, Smelt silver bars, Smelt a gold bar, Miner's lamp, Swordfish steak, build Smelter, build Forge, build Dwarven Forge, build Star Anvil |
| Water | Forge steel bars, Crystal key, Trail bread, Fish chowder, Water flask, Elderwood ward |
| Oak | Burn charcoal, Iron battle-axe, Iron sword, Oak longbow, Pearl sabre, Iron wood-axe, Iron pick, Iron hammer, Iron-rimmed shield, Iron gate |
| Ironwood | Steel battle-axe, Steel sword, Ironwood war bow, Steel wood-axe, Steel pick, Steel hammer, Steel tower shield |
| Elderwood | Starsilver blade, Elderwood greatbow, Elderwood ward-shield, Elderwood ward |
| Silver | Smelt silver bars |
| Starsilver | Smelt starsilver bars |
| Charcoal | Smelt starsilver bars, Forge steel bars |
| Steel bar | Steel battle-axe, Steel sword, Ironwood war bow, Steel wood-axe, Steel pick, Steel hammer, Steel helm, Steel plate, Steel greaves, Steel gauntlets, Steel tower shield, Steel bulwark |
| Iron bar | Forge steel bars, Iron battle-axe, Iron sword, Oak longbow, Pearl sabre, Iron wood-axe, Iron pick, Iron hammer, Iron helm, Iron mail, Iron greaves, Iron gauntlets, Iron-rimmed shield, Spiked palisade, Iron gate, Hatchet, Skinning knife, Miner's lamp, build Forge, build Dwarven Forge |
| Silver bar | Crystal key, Rootstone amulet, Tidestone amulet, Emberstone amulet |
| Leather | Wooden battle-axe, Pine short bow, Iron sword, Oak longbow, Steel sword, Ironwood war bow, Starsilver blade, Elderwood greatbow, Coral spear, Leather cap, Leather jerkin, Leather leggings, Leather gloves, Wooden buckler, Shellback buckler, Iron helm, Iron mail, Iron greaves, Iron gauntlets, Steel helm, Steel plate, Steel greaves, Steel gauntlets, Starsilver helm, Starsilver plate, Starsilver greaves, Starsilver gauntlets, Rootstone amulet, Tidestone amulet, Watchtower, Water flask |
| Scrap iron | Smelt scrap iron |
| Crab shell | Shellback buckler |
| Starsilver bar | Starsilver blade, Elderwood greatbow, Starsilver helm, Starsilver plate, Starsilver greaves, Starsilver gauntlets, Elderwood ward-shield, build Star Anvil |
| Herring | eaten raw (+3 ❤️); Fish chowder |
| Wheat | Trail bread, Farmhouse pie, Honey cake |
| Apples | eaten raw (+2 ❤️) |
| Eggs | eaten raw (+2 ❤️); Farmhouse pie, Honey cake |
| Meat | eaten raw (+3 ❤️); Roast chicken, Farmhouse pie |
| Wild mushrooms | eaten raw (+3 ❤️); Salmon & mushroom pie |
| Salmon | eaten raw (+5 ❤️); Salmon & mushroom pie, Kingfish feast |
| Wild honey | eaten raw (+5 ❤️); Honey cake, Kingfish feast |
| Swordfish | eaten raw (+8 ❤️); Swordfish steak |
| Golden kingfish | eaten raw (+12 ❤️); Kingfish feast |
| Dragon scale | **nothing yet** |
| Pearl | Pearl sabre |
| Coral | Coral spear |
| Gold bar | Old King's Crown, Emberstone amulet |
| Emerald | Rootstone amulet |
| Sapphire | Tidestone amulet |
| Ruby | Emberstone amulet |
