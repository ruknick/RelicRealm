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
    axe:     { name: 'Iron axe', icon: '🪓', weapon: true, uses: 3, desc: '3 dmg to wood & plants. Chopping stumps gives bonus wood.' },
    pickaxe: { name: 'Pickaxe', icon: '⛏️', weapon: true, uses: 3, desc: '3 dmg to stone, 2 to iron. Mines extra ore from veins.' },
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
    dpick:     { name: 'Dwarven pick', icon: '⚒️', weapon: true, uses: 3, spoil: 'dwarf', desc: 'Smashes stone & iron in one blow.' },
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
    axe:     { wood: 3, plant: 3, creature: 1, other: 1, stone: 0, iron: 0 },
    pickaxe: { stone: 3, iron: 2, wood: 1, plant: 1, creature: 0, other: 1 },
    sword:   { creature: 3, wood: 1, plant: 1, other: 1, stone: 1, iron: 1, keep: 2 },
    firepot: { wood: 2, plant: 2, creature: 1, other: 1, stone: 0, iron: 0, fog: true, area: true },
    shiv:    { creature: 2, wood: 1, plant: 1, other: 0, stone: 0, iron: 0 },
    dpick:   { stone: 9, iron: 9, wood: 2, plant: 2, creature: 1, other: 2 },
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

  return { RESOURCES, ITEMS, MATCH_DMG, WEAPONS, weaponDamage, MAT_LABEL, FINDS, FIND_INFO, rollFrom, SPOILS, RECIPES };
})();
