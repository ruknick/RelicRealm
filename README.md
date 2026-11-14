# Tile Realm: The Shattered Crown (match-3 prototype)

A browser prototype of the core loop: **gather → find → craft → raid**.
It's plain HTML/CSS/JS with no build step and no backend. Progress is saved in `localStorage`.

## Look & layout
- **Old-world theme:** parchment cards with ink text, brass and red-wax buttons, serif lettering, on a dark wood background, matching the hand-inked map.
- **No totals bar:** your banked resources live in the **🏦 Storehouse** at Your Camp (also in Items → Materials). Workshop costs show how many you have in brackets.
- **🎒 Backpack button** on gathering boards shows the count (e.g. 3/40). Tap it to open your pack over the board.
- The sound toggle sits on the map screen next to Journal, Warrior and Items.

## The story
**Tile Realm: The Shattered Crown.** The Old King's Crown held the realm of Valdmoor together until the dragon **Emberwyrm** burned the king's hall and shattered it into five relic shards. Goblins raid, the dwarves have sealed their halls, and your village of Ashford burned. Rebuild, find the shards, forge the Crown and face the dragon.

- **Title screen:** Continue or New game. Saves made before characters existed can continue and keep their progress.
- **Create your warrior:** pick a name, skin, hair colour and style, beard, and an **origin** with a starting gift:
  - Woodcutter: hatchet
  - Hunter: bow + skinning knife
  - Miner: lamp
  - Fisher: chowder + water
- **The opening tale:** four story panels. You can replay them from the title screen or the Journal.
- **📜 Journal and chapters:** each chapter has goals tied to what you already do. Finishing all of a chapter's goals plays its ending, gives a reward and opens the next chapter. A banner on the map shows your next goal.
  - **Prologue · From the Ashes:** forage, craft, fortify.
  - **Ch 1 · Goblin Trouble:** find and raid the goblin village.
  - **Ch 2 · Iron in the Hills:** mine, forge iron, beat the dwarves (meet Thrain Ironbeard).
  - **Ch 3 · Salt and Pearls:** coast, pearls, water flasks.
  - **Ch 4 · The Old King's Crown:** earn 5 shards, forge the Crown, forge steel, wear full armor.

### 💎 Relic shards & the Crown
Shards are never random drops. Each one reveals itself when you **master** an environment:
- **Forest, Iron Hills, Sunlit Coast:** reach land Lv 10 (about 18 trips each).
- **Goblin Village, Dwarf Stronghold:** beat their top rank (Warband / Lords).

The Workshop smelts **gold bars** (6 gold + 1 coal) and forges the **Old King's Crown** from **5 shards + 3 gold bars**. Raiders who open your loot chest can steal gold bars (never shards). The Items screen tracks which shards you've earned.

### 🗺️ The map
A hand-inked parchment map of Valdmoor, with a fogged southern edge: **Beyond the Known Realm**. That's where post-dragon regions (swamp giants, spider tunnels, frost, barrows) will appear.
  - **Ch 5 · Emberwyrm:** flasks, an elderwood ward, the Dragon's Lair (next update).
- **Places introduce themselves** with a short story the first time you travel there.

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
| `js/hero.js` | Warrior screen: the full-body figure, gear slots, health & eating |
| `js/boss.js` | Boss lairs: Grak, the Stone Golem, the Siren Queen and Emberwyrm |
| `js/bounty.js` | The bounty board: rotating jobs and rewards |
| `js/story.js` | Title screen, character creation, the opening tale, Journal chapters, place stories |
| `js/camp.js` | Your camp: Fortify editor, Storehouse, grudges and the live revenge raids |
| `js/sound.js` | Music and sound effects, generated in the browser (home, forest, mine, battle themes) |
| `js/art.js` | Vector art: tiles, obstacles (ore cart, stump, thornbush…), themed board frames, scene backgrounds |

## How it plays

### Levels & eras (start quick, then climb steeply)
| Era | Player levels | Gear | Station you unlock |
|---|---|---|---|
| 🪵 Wood & Leather | 1–9 | wooden weapons, stone tools, leather armor | Workbench (start) · **Smelter at Lv 8** |
| ⚒️ Iron | 10–19 | iron weapons, tools, mail | **Forge at Lv 10** |
| 🛡️ Steel | 20–34 | steel gear, plate, bulwarks | **Dwarven Forge at Lv 20** (beat the dwarves once; Thrain teaches you) |
| ✨ Mythic | 35+ | after the dragon | — |

- XP needed: Lv 2 = 8, Lv 5 = 138, Lv 10 ≈ 760, Lv 20 ≈ 3,600, Lv 35 ≈ 12,300.
- **Every level:** +max ❤️ (every 2 levels), +1 weapon damage (every 5), +2 backpack.

### ⚔️ Combat
- Weapons do **3 (wood) / 6 (iron) / 10 (steel)** damage, plus strength. Swords get +1. Hits vary ±1, and 10% are **critical** (×2).
- **Under-geared isn't hopeless:** one tier below the target's armor does ½ damage, two tiers ¼. Tools chip at things too hard for them in the same way.
- A goblin scout (~8–10 HP) takes **~3 hits with wood**, 2 with iron, 1 with steel.
- Swings cost ⚡: **1 for wood gear**, 2 for iron and steel, +1 for bows, −1 for light blades.
- A match beside a monster is a **free half-strength strike** with your weapon.

### ❤️ Health & 🍖 food
- Your health carries between trips. **Resting at camp** after a trip heals 3.
- **Monsters strike at you** every few moves. Each blow lands on a random spot (body, helmet, legs or shield):
  - Armor there that's **better** than their weapon turns it aside.
  - **Equal** armor takes most of it.
  - Worse armor helps a little.
  - Armor wears with each blow; repair it at the Workshop.
- **Eat:** 🍖 on any board or in 🧍 Warrior (1 food → +2), **Trail bread** (+5), **Bottled chowder** (+8).
- **At 0 ❤️** you collapse and stagger home, dropping half your backpack.

### 👺 Monsters on gathering boards
Goblin raiders (Forest), cave goblins (Iron Hills), shore crabs (Coast). Lands go up to **Lv 35**, and monsters scale with the land's level:
- **Numbers:** up to 3 on the board when you arrive, a new one every 8 → 3 moves, at most 2 → 6.
- **Toughness:** HP 7 → 25, and armor goes wood → iron (Lv 10) → steel (Lv 20).

**Why hunt them:**
- They hit you.
- They drop **scrap iron** (smelts into iron bars). Cave goblins can drop gems, and crabs drop **crab shell** (Shellback buckler).
- Forest goblins drop **map scraps** that lead to their village.
- Sometimes one carries the **chest key** (🗝️).
- Survivors report back and add to the goblins' grudge.

### 🔥 Bars & stations
- **Every metal recipe needs bars.** At the Smelter: 2 iron ore + 1 coal → iron bar, 3 scrap iron + 1 coal → iron bar, silver → silver bars, 6 gold + 1 coal → gold bar, oak → charcoal.
- **Steel:** 2 iron bars + 2 charcoal + 1 water, at the Dwarven Forge.
- **Leather:** 2 hide + 1 pine at the Workbench. It's used for armor, bows and grips.
- **All ×N** smelts everything you can afford in one tap.
- **Locked recipes still show,** marked "Requires the Forge (Lv 10)".

### 🗡️ Raids (solo)
- You go into their village and **break their keep** before their troops wear you down.
  - At most 3 troops strike you per enemy turn.
  - Higher ranks have tougher troops and act more often.
- Big combos make their defenders stagger (their next turn comes a move later).
- **Stars:** break their keep · open their loot chest · finish above half health.
- **Losing or fleeing** may let them carry off your weapon. Open their loot chest on a later raid to win it back.

### 😠 Revenge raids
- **What raises a grudge:** winning raids (+3), losing (+1), and goblins left alive on gathering boards (+⅓ each).
- **The warning:** at 6, a war party forms and you're warned **2 trips ahead**. At most one every 3 trips.
- **The attack:** when they arrive, you **watch it happen live** on your camp map. Raiders swarm the open ground and hammer the front line.
  - They give up after 30 moves.
  - If they break into the **Storehouse** (your keep), they take 10–19% of everything banked.
  - If they open the loot chest, they take gold bars, keys or map scraps.
  - Destroyed defenses are lost.
- **Fortify** shows how often your camp would hold right now, and both grudge meters.

### 🔑 Keys
Old keys are no longer "rare."
- A bronze chest's key is **on the same board**: buried, or carried by a monster.
- Random key finds are much rarer.

### 🐉 Boss lairs
Both are open from the map whenever you like, and both can be fought again (smaller rewards after the first win).

**The Dragon's Lair, against Emberwyrm** (520 HP, mythic scales, hardness 4):
- Anything below mythic does a fraction of its damage. The **Old King's Crown** dims its scales by one tier.
- Every 4 moves it breathes fire down a column (lava, plus a burn on you), hatches **whelps**, or spreads the lava.
- 💧 **Water flasks** douse lava in a 3x3 area, and an 🛡️ **Elderwood ward** halves the fire.
- **First kill:** gold, gold bars, starsilver, elderwood and **dragon scales**, plus the story's ending.

**The Siren's Grotto, against Nerissa the Siren Queen** (130 HP, iron-strong, a sea creature):
- It appears once the **Sunlit Coast reaches Lv 8**.
- Her **song** drains your ⚡, the **tide** floods tiles, her trident strikes, and **shore crabs** fight for her.
- Coral spears hit her harder.
- **First win:** the **Siren's Pearl** amulet (matches of 4+ heal 1 ❤️), plus pearls, coral and shells.

### 👺 Land bosses
Each land has a boss whose lair shows up on the map (as a rumor until then) once the land grows:

| Boss | Lair | Unlocks | Fight | First-win prize |
|---|---|---|---|---|
| **Grak the Goblin Warchief** (90 HP, wood-tough) | Warchief's Clearing | Forest Lv 6 | war-cries bring raiders, barricades, axe charges | **Grak's war-axe**: iron strength, no forge |
| **The Stone Golem** (200 HP, iron-hard) | Golem's Deep | Iron Hills Lv 12 | quakes drop rocks, heavy slams, mends itself; cave goblins | **Heart of Stone**: amulet, +8 max ❤️ |
| **Nerissa, the Siren Queen** (130 HP) | Siren's Grotto | Sunlit Coast Lv 8 | song drains ⚡, tide floods, crabs | **Siren's Pearl** |

Bosses can be fought again for smaller rewards.

### 📋 Bounty board
The **Bounty board** (on the map under your quest) always has three jobs, such as "Slay 6 goblin raiders," "Smelt 5 iron bars," "Win a raid on a dwarf stronghold" or "Defeat the Golem." Finish one and claim gold, XP and sometimes a key, meal or flask, and a new job is posted. Jobs only ask for things you've unlocked.

### ✨ Mythic gear
The **Star Anvil** (Lv 35) forges starsilver weapons and armor from **starsilver bars** (smelted at the Dwarven Forge). They are the only gear that cuts through dragon scale at full strength.

### 💎 Relic shards
**Reach Lv 35** in the Forest, Iron Hills and Sunlit Coast, and beat the goblin and dwarf **top ranks**. Then 5 shards + 3 gold bars forge the Old King's Crown.

## Debug (home screen)
- Make tracks or a rune stone appear right away, or the thief or cart.
- +1 marked village and stronghold, +8 food.
- +20 of every resource.
- ⭐ +1 level.

## Not built yet
Real PvP (needs a server), Deep Tunnels (dark mine + lamp), post-dragon lands beyond the known realm (swamp giants, spiders, frost, barrows), uses for dragon scales.
