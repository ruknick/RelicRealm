// Shared game data: resources, items, materials, weapons, finds, recipes, spoils.
window.Data = (() => {
  const RESOURCES = {
    wood:  { label: 'Wood' },
    stone: { label: 'Stone' },
    hide:  { label: 'Hide' },
    food:  { label: 'Food' },
    gold:  { label: 'Gold' },
    iron:  { label: 'Iron' },
    coal:  { label: 'Coal' },
    water: { label: 'Water' },
  };

  // kind: weapon (tap to use; uses = charges per craft), tool (passive, permanent), defense, spoil, trinket
  const ITEMS = {
    // Tier 1 — Camp
    club:   { name: 'Club', icon: '🏏', weapon: true, uses: 1, desc: 'Clubs goblins & dwarves, smashes wooden defenses.' },
    sling:  { name: 'Sling', icon: '🪃', weapon: true, uses: 1, desc: 'Hits any defense or creature for 1, even through fog.' },
    stoneaxe:  { name: 'Stone axe', icon: '🪓', weapon: true, uses: 2, desc: 'Chops stumps & thornbushes (2 dmg). Only axes can.' },
    stonepick: { name: 'Stone pick', icon: '⛏️', weapon: true, uses: 2, desc: 'Breaks boulders & ore veins (2 dmg). Only pickaxes can.' },
    fence:  { name: 'Wooden fence', icon: '🪵', desc: 'Defense: wood, 1 HP. Cheap blocker. 1 pt.' },
    wall:   { name: 'Stone wall', icon: '🧱', desc: 'Defense: stone, 2 HP. 2 pts.' },
    trap:   { name: 'Pit trap', icon: '🕳️', desc: 'Defense: hidden — an attacker who finds it loses a move. 1 pt.' },
    palisade: { name: 'Spiked palisade', icon: '🔱', desc: 'Defense: wood, 2 HP. Every hit costs the attacker a move. 2 pts.' },
    tower:  { name: 'Watchtower', icon: '🗼', desc: 'Defense: wood, 2 HP. Every 3 moves it may drive attackers back. 2 pts.' },
    gate:   { name: 'Iron gate', icon: '🚪', desc: 'Defense: iron, 3 HP. Goblins can barely dent it. 3 pts, max 2.' },
    // Tier 2 — Forge (multi-use)
    axe:     { name: 'Iron axe', icon: '🪓', weapon: true, uses: 3, desc: '4 dmg to wood & thorns, and cleaves 1 into anything next to it. Stumps give bonus wood.' },
    pickaxe: { name: 'Pickaxe', icon: '⛏️', weapon: true, uses: 3, desc: '4 dmg to stone, 2 to iron, and cracks 1 into neighbours. Mines double ore.' },
    sword:   { name: 'Iron sword', icon: '⚔️', weapon: true, uses: 3, desc: '3 dmg to goblins & dwarves, 2 to any keep.' },
    // Tools — passive, permanent
    hatchet: { name: 'Hatchet', icon: '🪚', tool: true, desc: '+1 wood on every wood match.' },
    knife:   { name: 'Skinning knife', icon: '🔪', tool: true, desc: '+1 hide on every hide match.' },
    lamp:    { name: 'Miner\'s lamp', icon: '🏮', tool: true, desc: 'Buried finds glimmer so you can dig them up.' },
    // Found while gathering
    key:        { name: 'Old key', icon: '🗝️', art: 'key1', weapon: true, uses: 1, desc: 'Opens bronze chests and iron gates.' },
    goldkey:    { name: 'Gold key', icon: '🔑', art: 'key2', weapon: true, uses: 1, desc: 'Opens gold & bronze chests and iron gates.' },
    crystalkey: { name: 'Crystal key', icon: '💠', art: 'key3', weapon: true, uses: 1, desc: 'Opens any chest — crystal chests hold the rarest loot.' },
    // Goblin spoils
    firepot:   { name: 'Goblin firepot', icon: '🔥', weapon: true, uses: 1, spoil: 'goblin', desc: 'Burns a 3x3 area: 2 dmg to wood & plants, clears fog.' },
    shiv:      { name: 'Goblin shiv', icon: '🗡️', weapon: true, uses: 2, spoil: 'goblin', desc: '2 dmg to creatures.' },
    drum:      { name: 'War drum', icon: '🥁', spoil: 'goblin', desc: '+3 moves in a raid.' },
    blueprint: { name: 'Palisade blueprint', icon: '📜', spoil: 'goblin', desc: 'Unlocks the Spiked palisade defense.' },
    // Dwarf spoils
    dpick:     { name: 'Dwarven pick', icon: '⚒️', weapon: true, uses: 3, spoil: 'dwarf', desc: 'Smashes stone & iron in one blow, and 2 into neighbours.' },
    ale:       { name: 'Dwarf ale', icon: '🍺', spoil: 'dwarf', desc: '+3 moves in a raid.' },
    runestone: { name: 'Runestone', icon: '🪨', spoil: 'dwarf', desc: 'Place in your camp: +1 HP to every defense touching it. 1 pt.' },
    cartbp:    { name: 'Mine-cart blueprint', icon: '🛤️', spoil: 'dwarf', desc: 'Unlocks the Mine-cart defense.' },
    // Relic
    crown:     { name: 'Old King\'s Crown', icon: '👑', trinket: true, desc: 'Legendary. Raiders start 2 moves behind.' },
    // Prepared for the Dragon's Lair
    flask:     { name: 'Water flask', icon: '💧', prep: true, desc: 'Douses lava and dragonfire in the Dragon\'s Lair (coming soon).' },
  };

  // How much a match does to each material (1 per match next to it).
  const MATCH_DMG = { wood: 1, stone: 1, creature: 1, other: 1, plant: 0, iron: 0 };

  // Weapon damage by material. fog: can reach into fog. area: 3x3.
  const WEAPONS = {
    club:    { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0 },
    stoneaxe:  { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0 },
    stonepick: { stone: 2, iron: 1, wood: 1, plant: 1, creature: 0, other: 1 },
    sling:   { wood: 1, plant: 1, creature: 1, other: 1, stone: 1, iron: 1, fog: true },
    axe:     { wood: 4, plant: 4, creature: 1, other: 1, stone: 0, iron: 0, splash: 1 },
    pickaxe: { stone: 4, iron: 2, wood: 1, plant: 1, creature: 0, other: 1, splash: 1 },
    sword:   { creature: 3, wood: 1, plant: 1, other: 1, stone: 1, iron: 1, keep: 2 },
    firepot: { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0, fog: true, area: true },
    shiv:    { creature: 2, wood: 1, plant: 1, other: 0, stone: 0, iron: 0 },
    dpick:   { stone: 9, iron: 9, wood: 2, plant: 2, creature: 1, other: 2, splash: 2 },
    key:        { unlock: 1 },
    goldkey:    { unlock: 2 },
    crystalkey: { unlock: 3 },
  };
  // Forest stumps & thornbushes need an axe; rock needs a pickaxe.
  const TOOL_GROUPS = { axe: ['stoneaxe', 'axe'], pick: ['stonepick', 'pickaxe', 'dpick'] };
  // What a match does to a piece: nothing to tool-only obstacles, creatures, thorns or iron.
  function matchDamage(piece) {
    if (piece.toolOnly || piece.mat === 'creature') return 0;
    return MATCH_DMG[piece.mat] ?? 1;
  }
  function weaponDamage(w, piece) {
    const W = WEAPONS[w];
    if (!W) return 0;
    if (W.unlock) return piece.lock && W.unlock >= (piece.lockTier || 1) ? 99 : 0;
    if (piece.keyOnly) return 0;          // locked chests open only with a key
    if (piece.toolOnly && !TOOL_GROUPS[piece.toolOnly].includes(w)) return 0;   // right tool for the job
    if (piece.kind === 'keep' && W.keep) return Math.max(W.keep, W[piece.mat] || 0);
    return W[piece.mat] || 0;
  }
  const MAT_LABEL = { wood: 'wood', stone: 'stone', iron: 'iron', plant: 'thorns', creature: 'creatures', other: 'that' };

  // Buried finds per land (weights).
  const FINDS = {
    forest: [['cache', 30], ['basket', 20], ['lostclub', 12], ['scrap', 15], ['key', 13], ['shard', 10]],
    mine:   [['orepocket', 30], ['coalseam', 20], ['nugget', 15], ['scrap', 15], ['key', 10], ['shard', 10]],
    ocean:  [['pearl', 25], ['barrel', 25], ['nugget', 15], ['key', 15], ['shard', 12], ['basket', 8]],
  };
  const FIND_INFO = {   // desc is shown under the name when you dig it up
    cache:     { icon: '🎁', name: 'Hidden cache', desc: 'Someone\'s stash — +3 supplies' },
    basket:    { icon: '🧺', name: 'Food basket', desc: '+3 food for your next raid' },
    lostclub:  { icon: '🏏', name: 'Lost club', desc: 'Added to your weapons' },
    scrap:     { icon: '🗺️', name: 'Map scrap', desc: 'Collect 3 to reveal a raid target' },
    key:       { icon: '🗝️', name: 'Old key', desc: 'Opens a locked chest or iron gate' },
    shard:     { icon: '💎', name: 'Relic shard', desc: 'A piece of the Old King\'s Crown' },
    orepocket: { icon: '⛓️', name: 'Ore pocket', desc: '+3 iron' },
    coalseam:  { icon: '🪨', name: 'Coal seam', desc: '+3 coal' },
    nugget:    { icon: '✨', name: 'Gold nuggets', desc: '+3 gold', art: 'gold' },
    sling:     { icon: '🪃', name: 'Old sling', desc: 'Added to your weapons' },
    pearl:     { icon: '🦪', name: 'Pearl', desc: '+4 gold' },
    barrel:    { icon: '🛢️', name: 'Fresh-water barrel', desc: '+3 water' },
  };

  function rollFrom(list) {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [id, w] of list) if ((roll -= w) < 0) return id;
    return list[0][0];
  }

  const SPOILS = {
    goblin: ['firepot', 'scraps', 'shiv', 'drum', 'blueprint'],
    dwarf:  ['dpick', 'ingots', 'ale', 'runestone', 'cartbp'],
  };

  const RECIPES = [
    // Key upgrades: combine keys (items) with materials.
    { id: 'goldkey',    tier: 'keys', cost: { gold: 6 }, items: { key: 2 } },
    { id: 'crystalkey', tier: 'keys', cost: { water: 5, coal: 3 }, items: { goldkey: 2 } },
    { id: 'club',  tier: 1, cost: { wood: 5 } },
    { id: 'sling', tier: 1, cost: { wood: 4, hide: 3 } },
    { id: 'stoneaxe', tier: 1, cost: { wood: 4, stone: 3 } },
    { id: 'stonepick', tier: 1, cost: { wood: 3, stone: 4 } },
    { id: 'fence', tier: 1, cost: { wood: 6 }, defense: true },
    { id: 'wall',  tier: 1, cost: { stone: 12 }, defense: true },
    { id: 'trap',  tier: 1, cost: { wood: 4, hide: 2 }, defense: true },
    { id: 'tower', tier: 1, cost: { wood: 8, hide: 2 }, defense: true },
    { id: 'palisade', tier: 1, cost: { wood: 6, iron: 1 }, defense: true, needs: 'palisade' },
    { id: 'gate', tier: 2, cost: { iron: 5, wood: 1, water: 1 }, defense: true },
    { id: 'axe',     tier: 2, cost: { wood: 4, iron: 3, water: 2 } },
    { id: 'pickaxe', tier: 2, cost: { wood: 3, iron: 4, water: 2 } },
    { id: 'sword',   tier: 2, cost: { hide: 2, iron: 5, coal: 2, water: 2 } },
    { id: 'flask',   tier: 'prep', cost: { water: 4, hide: 1 } },
    { id: 'hatchet', tier: 'tool', cost: { wood: 6, iron: 2 } },
    { id: 'knife',   tier: 'tool', cost: { wood: 2, iron: 3 } },
    { id: 'lamp',    tier: 'tool', cost: { coal: 4, iron: 2, gold: 2 } },
  ];

  // ---------- progression ----------
  const backpackSize = L => Math.min(80, 30 + 5 * (L - 1));
  // Each land levels up every 2 runs you finish there.
  const landLevel = runs => Math.min(10, 1 + Math.floor(runs / 2));
  // Enemies rank up every 2 raids you win against them.
  const enemyTier = wins => Math.min(4, 1 + Math.floor(wins / 2));
  const TIER_NAMES = { goblin: ['Scouts', 'Warriors', 'Raiders', 'Warband'], dwarf: ['Miners', 'Guards', 'Ironclads', 'Lords'] };
  const CHEST_TIERS = { 1: 'Bronze', 2: 'Gold', 3: 'Crystal' };

  // ---------- player levels ----------
  // Total XP needed to reach level L: 30, 90, 180, 300, 450, 630, ...
  const xpForLevel = L => 15 * (L - 1) * L;
  const levelFromXp = xp => { let L = 1; while (xp >= xpForLevel(L + 1)) L++; return L; };
  // How gathering boards scale with level. Tougher boards also bury more treasure.
  function levelInfo(L) {
    return {
      startObstacles: Math.min(10, 4 + Math.floor((L - 1) * 0.75)),
      growEvery: L < 2 ? 0 : Math.max(3, 8 - L),          // a new obstacle every N moves (0 = never)
      hpBonus: L >= 7 ? 2 : L >= 4 ? 1 : 0,               // extra HP on stumps, thorns, boulders, veins
      buried: Math.min(6, 3 + Math.floor((L - 1) / 3)),
    };
  }
  const XP = { match: 1, obstacle: 3, find: 5, chase: 8, discover: 5, craft: 5, craft2: 10, raidWin: 40, raidWinDwarf: 60, loot: 10, retreat: 10 };

  const MATERIAL_INFO = {
    wood:  { from: 'Forest logs, Coast driftwood, stumps (axe)', use: 'Clubs, slings, axes, fences, towers' },
    stone: { from: 'Forest & Iron Hills rocks, boulders (pickaxe)', use: 'Stone tools, stone walls' },
    hide:  { from: 'Forest pelts', use: 'Slings, swords, pit traps, flasks' },
    food:  { from: 'Forest berries, Coast fish', use: 'Marching to raids (3–4 per raid)' },
    gold:  { from: 'Gold nuggets everywhere, pearls, chests', use: 'Miner\'s lamp — more to come' },
    iron:  { from: 'Iron Hills ore, ore veins, spoils', use: 'Tier 2 weapons, iron gates, tools' },
    coal:  { from: 'Iron Hills coal', use: 'Swords, the miner\'s lamp' },
    water: { from: 'Sunlit Coast', use: 'Quenching forged iron, water flasks for the Dragon\'s Lair' },
  };

  return { backpackSize, landLevel, enemyTier, TIER_NAMES, CHEST_TIERS, MATERIAL_INFO, matchDamage, TOOL_GROUPS, xpForLevel, levelFromXp, levelInfo, XP, RESOURCES, ITEMS, MATCH_DMG, WEAPONS, weaponDamage, MAT_LABEL, FINDS, FIND_INFO, rollFrom, SPOILS, RECIPES };
})();
