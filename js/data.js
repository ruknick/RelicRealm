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
  };

  // kind: weapon (tap to use; uses = charges per craft), tool (passive, permanent), defense, spoil, trinket
  const ITEMS = {
    // Tier 1 — Camp
    club:   { name: 'Club', icon: '🏏', weapon: true, uses: 1, desc: 'Strong vs wood & thornbushes. Useless on stone/iron.' },
    sling:  { name: 'Sling', icon: '🪃', weapon: true, uses: 1, desc: 'Hits anything for 1, even through fog.' },
    fence:  { name: 'Wooden fence', icon: '🪵', desc: 'Defense: blocks a tile, 1 hit.' },
    wall:   { name: 'Stone wall', icon: '🧱', desc: 'Defense: blocks a tile, 2 hits.' },
    trap:   { name: 'Pit trap', icon: '🕳️', desc: 'Defense: attacker loses a move.' },
    // Tier 2 — Forge (multi-use)
    axe:     { name: 'Iron axe', icon: '🪓', weapon: true, uses: 3, desc: '4 dmg to wood & thorns, and cleaves 1 into anything next to it. Stumps give bonus wood.' },
    pickaxe: { name: 'Pickaxe', icon: '⛏️', weapon: true, uses: 3, desc: '4 dmg to stone, 2 to iron, and cracks 1 into neighbours. Mines double ore.' },
    sword:   { name: 'Iron sword', icon: '⚔️', weapon: true, uses: 3, desc: '3 dmg to goblins & dwarves, 2 to any keep.' },
    // Tools — passive, permanent
    hatchet: { name: 'Hatchet', icon: '🪚', tool: true, desc: '+1 wood on every wood match.' },
    knife:   { name: 'Skinning knife', icon: '🔪', tool: true, desc: '+1 hide on every hide match.' },
    lamp:    { name: 'Miner\'s lamp', icon: '🏮', tool: true, desc: 'Buried finds glimmer so you can dig them up.' },
    // Found while gathering
    key:     { name: 'Old key', icon: '🗝️', weapon: true, uses: 1, desc: 'Opens a locked chest or iron gate.' },
    // Goblin spoils
    firepot:   { name: 'Goblin firepot', icon: '🔥', weapon: true, uses: 1, spoil: 'goblin', desc: 'Burns a 3x3 area: 2 dmg to wood & plants, clears fog.' },
    shiv:      { name: 'Goblin shiv', icon: '🗡️', weapon: true, uses: 2, spoil: 'goblin', desc: '2 dmg to creatures.' },
    drum:      { name: 'War drum', icon: '🥁', spoil: 'goblin', desc: '+3 moves in a raid.' },
    blueprint: { name: 'Palisade blueprint', icon: '📜', spoil: 'goblin', desc: 'Unlocks the Spiked palisade defense.' },
    // Dwarf spoils
    dpick:     { name: 'Dwarven pick', icon: '⚒️', weapon: true, uses: 3, spoil: 'dwarf', desc: 'Smashes stone & iron in one blow, and 2 into neighbours.' },
    ale:       { name: 'Dwarf ale', icon: '🍺', spoil: 'dwarf', desc: '+3 moves in a raid.' },
    runestone: { name: 'Runestone', icon: '🪨', spoil: 'dwarf', desc: '+1 HP to your walls (for Fortify).' },
    cartbp:    { name: 'Mine-cart blueprint', icon: '🛤️', spoil: 'dwarf', desc: 'Unlocks the Mine-cart defense.' },
    // Relic
    crown:     { name: 'Old King\'s Crown', icon: '👑', trinket: true, desc: 'Legendary. +2 moves in every raid.' },
  };

  // How much a match does to each material (1 per match next to it).
  const MATCH_DMG = { wood: 1, stone: 1, creature: 1, other: 1, plant: 0, iron: 0 };

  // Weapon damage by material. fog: can reach into fog. area: 3x3.
  const WEAPONS = {
    club:    { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0 },
    sling:   { wood: 1, plant: 1, creature: 1, other: 1, stone: 1, iron: 1, fog: true },
    axe:     { wood: 4, plant: 4, creature: 1, other: 1, stone: 0, iron: 0, splash: 1 },
    pickaxe: { stone: 4, iron: 2, wood: 1, plant: 1, creature: 0, other: 1, splash: 1 },
    sword:   { creature: 3, wood: 1, plant: 1, other: 1, stone: 1, iron: 1, keep: 2 },
    firepot: { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0, fog: true, area: true },
    shiv:    { creature: 2, wood: 1, plant: 1, other: 0, stone: 0, iron: 0 },
    dpick:   { stone: 9, iron: 9, wood: 2, plant: 2, creature: 1, other: 2, splash: 2 },
    key:     { unlock: true },
  };
  function weaponDamage(w, piece) {
    const W = WEAPONS[w];
    if (!W) return 0;
    if (W.unlock) return piece.lock ? 99 : 0;
    if (piece.keyOnly) return 0;          // locked chests open only with a key
    if (piece.kind === 'keep' && W.keep) return Math.max(W.keep, W[piece.mat] || 0);
    return W[piece.mat] || 0;
  }
  const MAT_LABEL = { wood: 'wood', stone: 'stone', iron: 'iron', plant: 'thorns', creature: 'creatures', other: 'that' };

  // Buried finds per land (weights).
  const FINDS = {
    forest: [['cache', 30], ['basket', 20], ['lostclub', 12], ['scrap', 15], ['key', 13], ['shard', 10]],
    mine:   [['orepocket', 30], ['coalseam', 20], ['nugget', 15], ['scrap', 15], ['key', 10], ['shard', 10]],
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
    nugget:    { icon: '🪙', name: 'Gold nuggets', desc: '+3 gold' },
    sling:     { icon: '🪃', name: 'Old sling', desc: 'Added to your weapons' },
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
    { id: 'club',  tier: 1, cost: { wood: 5 } },
    { id: 'sling', tier: 1, cost: { wood: 4, hide: 3 } },
    { id: 'fence', tier: 1, cost: { wood: 6 }, defense: true },
    { id: 'wall',  tier: 1, cost: { stone: 12 }, defense: true },
    { id: 'trap',  tier: 1, cost: { wood: 4, hide: 2 }, defense: true },
    { id: 'axe',     tier: 2, cost: { wood: 4, iron: 3 } },
    { id: 'pickaxe', tier: 2, cost: { wood: 3, iron: 4 } },
    { id: 'sword',   tier: 2, cost: { hide: 2, iron: 5, coal: 2 } },
    { id: 'hatchet', tier: 'tool', cost: { wood: 6, iron: 2 } },
    { id: 'knife',   tier: 'tool', cost: { wood: 2, iron: 3 } },
    { id: 'lamp',    tier: 'tool', cost: { coal: 4, iron: 2, gold: 2 } },
  ];

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

  return { xpForLevel, levelFromXp, levelInfo, XP, RESOURCES, ITEMS, MATCH_DMG, WEAPONS, weaponDamage, MAT_LABEL, FINDS, FIND_INFO, rollFrom, SPOILS, RECIPES };
})();
