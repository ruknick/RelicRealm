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
| `js/main.js` | Save data, navigation, popups, raid prep, spoils |
| `js/world.js` | World map home screen — tap a place to travel there |
| `js/items.js` | Items screen: Special · Materials · Gear |
| `js/camp.js` | Your camp: Fortify editor + the AI that raids it |
| `js/sound.js` | Music and sound effects, generated in the browser (home, forest, mine, battle themes) |
| `js/art.js` | Vector art: tiles, obstacles (ore cart, stump, thornbush…), themed board frames, scene backgrounds |

## Gear: weapons, tools, specials
The tray under every board has three areas:
- **⚡ Energy meter** (max 10, start each board with 3). Every match line adds +1, with +1 more for a 4+ line or a chain, and +2 for each blast.
- **Weapon slot:** monsters only. Tap a monster to swing: **2 ⚡** (3 for steel), +1 for bows. Free assist: when a match clears **next to** a monster, your weapon strikes it for free.
- **Tool slot:** obstacles and defenses only. Wood axe for wood and plants, pick for stone and ore, hammer for anything built (walls, gates, keeps). Tap to use, which costs energy the same way.
- **Specials row:** firepot, keys, flasks and so on, used once.
- Tap a slot to **swap** to other gear in your pack.

**Hardness rule:** every target has a hardness (wood 1 · iron 2 · steel 3 · bulwark 4). Damage = gear tier vs hardness: −1 → 1, equal → 2, +1 → 4, +2 → 6, +3 → 8 (swords +1). Gear 2+ tiers below the target bounces off. Matches only chip soft built things.

**Weapons & tools never wear out.** Energy is what limits them. But **lose a raid and they may carry off the weapon you were wielding**: 60% if they break your keep, 40% if time runs out, 25% if you retreat. Raid them again and open their loot chest to win it back. Only **armor** wears down (as it blocks raiders), and the Workshop repair bench mends it.

## 🧍 Your warrior: full-body gear
Tap **🧍 Gear** under any board, or **🧍 Warrior** on the map. It opens a figure with seven slots: **helmet, body, gloves, legs, shield, weapon, tool**. Tap a slot to wear, swap or take off pieces; the figure updates to show what you wear.
- **Armor** comes in **Leather** (hide), **Iron** (iron + hide/oak, quenched) and **Steel** tiers. Craft it in the Workshop's Armor section.
- In a raid, worn armor adds **🛡 shield hearts** on your keep: shield +1 (the first layer they hit), helmet +1, body +2, legs +1. Raiders must break these before the keep's ♥.
- Shield hearts use the hardness rule. Raiders whose weapons are weaker than your armor only get through half the time; stronger weapons hit harder.
- Each 🛡 they break costs that piece 1 durability. Repair armor at the Workshop.
- **Gloves** add starting ⚡ on every board (+1 leather, +2 iron, +3 steel).
- The Warrior screen, raid prep and Fortify show how many moves each raider needs to break your camp, with and without armor:

| Average moves to break your camp | Goblin Scouts | Goblin Raiders | Dwarf Miners | Dwarf Ironclads |
|---|---|---|---|---|
| No armor | 19 | 12 | 15 | 12 |
| Full leather | 26 | 17 | 21 | 17 |
| Full iron | 29 | 18 | 21 | 17 |
| Full steel | 29 | 22 | 25 | 18 |

## 📿 Gems & amulets
- **Emerald, sapphire and ruby** glint among the stones in the Iron Hills only. Ruby appears from Lv 4. They match with stone.
- Set two gems in **silver** at the Workshop to make an amulet, and wear it in the 🧍 Warrior **amulet** slot:
  - **Rootstone** (emerald, earth): matches chip ANY obstacle or defense beside them, even tool-only ones and iron.
  - **Tidestone** (sapphire, tide): matches of 4+ and chains give +1 more ⚡; blasts +1 more.
  - **Emberstone** (ruby, fury): when a match strikes a monster beside it, your weapon hits for +1.

## Wood & ore tiers
- **Wood:** Pine → **Oak** → **Ironwood** → **Elderwood**. **Ore:** iron → **silver** → **starsilver**.
- Rare tiles appear rarely at first, then more often as the land's level rises. They match with their family (oak matches pine).
- Stumps and veins get tougher with level (oak/ironwood stumps, silver/starsilver veins) and need a better tool.
- **Smelting:** 2 oak → 3 charcoal · 3 iron + 2 charcoal + 1 water → 1 steel.
- Hafts need the right wood: iron gear uses oak, steel gear uses ironwood.

## Sunlit Coast extras
- **Pearls** shimmer among the fish (more often as the Coast levels up), and **oysters** hide in kelp and coral (+1 pearl, +2 gold).
- **Coral:** break coral reefs with a pick (2 coral, or 3 with an iron pick).
- **Sea gear** (Workshop), iron strength with a trick:
  - **Coral spear** (5 coral, 2 pine, 1 hide), no forge needed. Pierces the monsters above and below the target, and is the bane of sea creatures (+1 tier vs crabs and future sea monsters).
  - **Pearl sabre** (3 pearl, 3 iron, 1 oak, 1 water). Light, so swings cost 1 less ⚡. It's the bane of creatures of the dark (coming in the Deep Tunnels).
- **Bottled chowder** (3 food, 2 water): drink it mid-raid from the specials row for +2 ♥ on your camp's keep. It's free and doesn't use a move.

## Enemies by rank
- Goblins carry **wood** gear at low ranks and **iron** at high ranks. Dwarves carry **iron**, then **steel**. Their armor follows the same tiers.
- Stone walls stop wood-armed goblins. The **steel bulwark** (hardness 4) stops almost everything.

## World map
The home screen is a map. Tap a place and your warrior token travels there:
- 🌲 **Forest**, ⛏️ **Iron Hills**, 🌊 **Sunlit Coast**: gathering lands
- 🏰 **Your Camp** (Fortify) and 🔨 **Workshop**
- 🔥 **Goblin Village** and ⚒️ **Dwarf Stronghold**: they appear and pulse once marked
- 🐉 **Dragon's Lair**: the volcano, coming next

🎒 **Items** has three tabs:
- **Special:** keys, maps, relic shards and the crown, goblin and dwarf spoils
- **Materials:** what each one is for and where to find it
- **Gear:** weapons, tools, defenses, dragon prep

## Gathering boards
| | 🌲 Forest | ⛏️ Iron Hills | 🌊 Sunlit Coast |
|---|---|---|---|
| Tiles | wood, stone, hide, berries→food, leaves (filler) | stone, ore→iron, coal, gravel & bones (filler) | water, fish→food, driftwood→wood, sand & seaweed (filler) |
| Obstacles | stumps & thornbushes (axe) | boulders & ore veins (pickaxe) | coral (pickaxe, +gold), kelp tangles (axe, hide a find) |
| Runaway event | goblin thief (weapon) | runaway ore cart | giant crab with loot (weapon) |
| Discovery | 🐾 tracks → Goblin Village | ᚱ rune stone → Dwarf Stronghold | — |
| Finds | caches, food baskets, map scraps, keys, shards | ore pockets, coal seams, nuggets, map scraps, keys, shards | pearls, water barrels, nuggets, keys, shards |

**Water** quenches forged iron (Tier 2 weapons and iron gates need 1–2) and makes **Water flasks** for the Dragon's Lair.

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

## Progression
- **Backpack** grows with your player level: 30, then +5 per level (max 80).
- **Each land has its own level.** It goes up every 2 runs there (max 10) and drives the obstacle count, regrowth, toughness and buried finds. It's shown on the map.
- **Chest tiers** at higher land levels:

| Land level | Chests | Loot |
|---|---|---|
| any | 🟫 Bronze | 6 gold + a find. Its Old key is always buried on the board |
| 3+ | 🟨 Gold (about 55%) | 12 gold + 2 finds |
| 6+ | 🟦 Crystal (about 30%) | 20 gold + a relic shard + a spoil |

  Gold and crystal chests need keys you bring. In the Workshop, upgrade **2 Old keys + 6 gold → Gold key**, and **2 Gold keys + 5 water + 3 coal → Crystal key**. A better key opens any lower chest.
- **Enemy ranks** go up every 2 wins against them:
  - Goblins: Scouts → Warriors → Raiders → Warband
  - Dwarves: Miners → Guards → Ironclads → Lords

  Each rank adds keep HP, minion HP and wall HP, and makes the camp attackers hit harder and arrive faster. Troops get bigger, and from rank 3 they become goblin brutes and gold-armored dwarf lords. Win gold scales with rank, and rank 3+ adds an extra spoil.

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
- **Repair bench** at the top: worn gear back to full for half its recipe.
- **Weapons & tools** by tier (wood / iron / steel). New gear is equipped automatically if it's better.
- **Smelting** (charcoal, steel), **key upgrades**, **defenses** (incl. bulwark), **kit** (hatchet, knife, lamp), **dragon prep**.

## Debug (home screen)
- Make tracks or a rune stone appear right away, or the thief or cart.
- +1 marked village and stronghold, +8 food.
- +20 of every resource.
- ⭐ +1 level.

## Not built yet
Real PvP (needs a server), Deep Tunnels (dark mine + lamp), story/journal, Dragon's Lair, elder tier gear.
