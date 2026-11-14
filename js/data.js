// Shared game data: resources, items, gear & the hardness rule, finds, recipes, spoils, progression.
window.Data = (() => {
  // primary: shown in the top stockpile bar. The rest live in the Items screen.
  const RESOURCES = {
    wood:      { label: 'Pine', primary: true },
    stone:     { label: 'Stone', primary: true },
    hide:      { label: 'Hide', primary: true },
    food:      { label: 'Food', primary: true },
    gold:      { label: 'Gold', primary: true },
    iron:      { label: 'Iron', primary: true },
    coal:      { label: 'Coal', primary: true },
    water:     { label: 'Water', primary: true },
    oak:       { label: 'Oak' },
    ironwood:  { label: 'Ironwood' },
    elderwood: { label: 'Elderwood' },
    silver:    { label: 'Silver' },
    starsilver:{ label: 'Starsilver' },
    charcoal:  { label: 'Charcoal' },
    steel:     { label: 'Steel' },
    pearl:     { label: 'Pearl' },
    coral:     { label: 'Coral' },
  };

  // ---------- gear: wield it, it wears down ----------
  // Tier 1 = wood/stone, 2 = iron, 3 = steel, 4 = mythic (future).
  const TIER_LABEL = { 1: 'Wood', 2: 'Iron', 3: 'Steel', 4: 'Mythic' };
  const DURABILITY = { 1: 4, 2: 8, 3: 14, 4: 25 };
  const TYPE_INFO = {
    baxe:   { cls: 'weapon', what: 'Battle-axe', trait: 'cleaves 1 into monsters beside the target' },
    sword:  { cls: 'weapon', what: 'Sword', trait: '+1 damage on every hit' },
    bow:    { cls: 'weapon', what: 'Bow', trait: 'hits every monster in the column' },
    waxe:   { cls: 'tool', what: 'Wood-axe', trait: 'chops stumps, bushes, kelp & wooden defenses' },
    pick:   { cls: 'tool', what: 'Pick', trait: 'breaks rock, ore veins, coral & stone defenses' },
    hammer: { cls: 'tool', what: 'Hammer', trait: 'smashes any built defense: walls, gates, towers, keeps' },
    spear:  { cls: 'weapon', what: 'Spear', trait: 'pierces: also hits the monsters directly above & below' },
    // Armor: worn, not swung. Helmet / body / legs / shield add shield hearts to your keep in a raid; gloves add energy.
    helmet: { cls: 'armor', what: 'Helmet', trait: '+1 🛡 on your keep in raids' },
    body:   { cls: 'armor', what: 'Body armor', trait: '+2 🛡 on your keep in raids' },
    legs:   { cls: 'armor', what: 'Leg armor', trait: '+1 🛡 on your keep in raids' },
    gloves: { cls: 'armor', what: 'Gloves', trait: 'start every board with extra ⚡' },
    shield: { cls: 'armor', what: 'Shield', trait: '+1 🛡 on your keep in raids — the first layer they hit' },
  };
  const ARMOR_LABEL = { 1: 'Leather', 2: 'Iron', 3: 'Steel', 4: 'Mythic' };
  const WARD = { helmet: 1, body: 2, legs: 1, shield: 1, gloves: 0 };
  const gloveEnergy = g => (g ? ITEMS[g.id].tier : 0);
  const gear = (name, type, tier, extra = {}) => {
    const cls = TYPE_INFO[type].cls;
    const what = cls === 'weapon' ? 'monsters only' : cls === 'tool' ? 'obstacles & defenses only' : `armor (hardness ${tier})`;
    const trait = type === 'gloves' ? `start every board with +${tier} ⚡` : TYPE_INFO[type].trait;
    return { name, type, tier, gear: cls, dur: DURABILITY[tier], art: `gear:${type}:${tier}`,
      desc: `${(cls === 'armor' ? ARMOR_LABEL : TIER_LABEL)[tier]} tier · ${what} · ${trait}.`, ...extra };
  };
  // Every slot on your warrior. Weapon & tool are swung; the rest are worn.
  const SLOTS = ['helmet', 'body', 'gloves', 'legs', 'shield', 'weapon', 'tool'];
  const slotOf = id => { const it = ITEMS[id]; return it.gear === 'armor' ? it.type : it.gear; };
  const tierLabel = id => { const it = ITEMS[id]; return it.sea ? 'Sea' : (it.gear === 'armor' ? ARMOR_LABEL : TIER_LABEL)[it.tier]; };

  const ITEMS = {
    // Weapons (monsters only)
    baxe1: gear('Wooden battle-axe', 'baxe', 1),
    bow1:  gear('Pine short bow', 'bow', 1),
    baxe2: gear('Iron battle-axe', 'baxe', 2),
    sword2: gear('Iron sword', 'sword', 2),
    bow2:  gear('Oak longbow', 'bow', 2),
    baxe3: gear('Steel battle-axe', 'baxe', 3),
    sword3: gear('Steel sword', 'sword', 3),
    bow3:  gear('Ironwood war bow', 'bow', 3),
    shiv:  gear('Goblin shiv', 'sword', 2, { dur: 6, spoil: 'goblin' }),
    // Sea gear: iron-strength without a forge, each with a trick. Bane: hits its foes as one tier stronger.
    coralspear: gear('Coral spear', 'spear', 2, { dur: 6, sea: true, bane: 'sea',
      desc: 'Sea gear · iron strength, no forge needed · pierces the monsters above & below · bane of sea creatures (crabs now, worse things later).' }),
    pearlsabre: gear('Pearl sabre', 'sword', 2, { dur: 10, sea: true, light: true, bane: 'shadow', art: 'gear:psabre:2',
      desc: 'Sea gear · light: swings cost 1 less ⚡ · +1 damage · its pearl glows — bane of creatures of the dark (Deep Tunnels, coming).' }),
    // Tools (obstacles & defenses only)
    waxe1: gear('Stone wood-axe', 'waxe', 1),
    pick1: gear('Stone pick', 'pick', 1),
    hammer1: gear('Stone hammer', 'hammer', 1),
    waxe2: gear('Iron wood-axe', 'waxe', 2),
    pick2: gear('Iron pick', 'pick', 2),
    hammer2: gear('Iron hammer', 'hammer', 2),
    waxe3: gear('Steel wood-axe', 'waxe', 3),
    pick3: gear('Steel pick', 'pick', 3),
    hammer3: gear('Steel hammer', 'hammer', 3),
    dpick: gear('Dwarven pick', 'pick', 3, { dur: 12, spoil: 'dwarf' }),
    // Armor
    helmet1: gear('Leather cap', 'helmet', 1),      body1: gear('Leather jerkin', 'body', 1),
    legs1:   gear('Leather leggings', 'legs', 1),   gloves1: gear('Leather gloves', 'gloves', 1),
    shield1: gear('Wooden buckler', 'shield', 1),
    helmet2: gear('Iron helm', 'helmet', 2),        body2: gear('Iron mail', 'body', 2),
    legs2:   gear('Iron greaves', 'legs', 2),       gloves2: gear('Iron gauntlets', 'gloves', 2),
    shield2: gear('Iron-rimmed shield', 'shield', 2),
    helmet3: gear('Steel helm', 'helmet', 3),       body3: gear('Steel plate', 'body', 3),
    legs3:   gear('Steel greaves', 'legs', 3),      gloves3: gear('Steel gauntlets', 'gloves', 3),
    shield3: gear('Steel tower shield', 'shield', 3),
    // Defenses
    fence:    { name: 'Wooden fence', icon: '🪵', desc: 'Defense: wood (hardness 1), 2 HP. 1 pt.' },
    trap:     { name: 'Pit trap', icon: '🕳️', desc: 'Defense: hidden — an attacker who finds it loses a move. 1 pt.' },
    wall:     { name: 'Stone wall', icon: '🧱', desc: 'Defense: stone (hardness 2), 4 HP — wood-armed goblins can barely scratch it. 2 pts.' },
    palisade: { name: 'Spiked palisade', icon: '🔱', desc: 'Defense: wood, 3 HP. Every hit costs the attacker a move. 2 pts.' },
    tower:    { name: 'Watchtower', icon: '🗼', desc: 'Defense: wood, 3 HP. Every 3 moves it may drive attackers back. 2 pts.' },
    gate:     { name: 'Iron gate', icon: '🚪', desc: 'Defense: iron (hardness 3), 4 HP. Only steel can dent it. 3 pts, max 2.' },
    bulwark:  { name: 'Steel bulwark', icon: '🛡️', desc: 'Defense: steel (hardness 4), 5 HP. Stops even steel-armed dwarves. 4 pts, max 2.' },
    // Kit — passive, permanent
    hatchet: { name: 'Hatchet', icon: '🪚', kit: true, desc: '+1 pine on every wood match.' },
    knife:   { name: 'Skinning knife', icon: '🔪', kit: true, desc: '+1 hide on every hide match.' },
    lamp:    { name: 'Miner\'s lamp', icon: '🏮', kit: true, desc: 'Buried finds glimmer so you can dig them up.' },
    // Specials (one use, tap to arm)
    key:        { name: 'Old key', icon: '🗝️', art: 'key1', special: true, desc: 'Opens bronze chests and iron gates.' },
    goldkey:    { name: 'Gold key', icon: '🔑', art: 'key2', special: true, desc: 'Opens gold & bronze chests and iron gates.' },
    crystalkey: { name: 'Crystal key', icon: '💠', art: 'key3', special: true, desc: 'Opens any chest — crystal chests hold the rarest loot.' },
    firepot:    { name: 'Goblin firepot', icon: '🔥', special: true, spoil: 'goblin', desc: 'Burns a 3x3 area: hurts wood, plants & monsters, clears fog.' },
    drum:       { name: 'War drum', icon: '🥁', spoil: 'goblin', desc: 'Raiders start 3 moves behind.' },
    blueprint:  { name: 'Palisade blueprint', icon: '📜', spoil: 'goblin', desc: 'Unlocks the Spiked palisade defense.' },
    ale:        { name: 'Dwarf ale', icon: '🍺', spoil: 'dwarf', desc: 'Raiders start 3 moves behind.' },
    runestone:  { name: 'Runestone', icon: '🪨', spoil: 'dwarf', desc: 'Place in your camp: +1 HP to every defense touching it. 1 pt.' },
    cartbp:     { name: 'Mine-cart blueprint', icon: '🛤️', spoil: 'dwarf', desc: 'Unlocks the Mine-cart defense.' },
    crown:      { name: 'Old King\'s Crown', icon: '👑', trinket: true, desc: 'Legendary. Raiders start 2 moves behind.' },
    // Provisions
    chowder:    { name: 'Bottled chowder', icon: '🍲', art: 'chowder', special: true, instant: true, desc: 'Drink it mid-raid: your camp\'s keep gets 2 ♥ back.' },
    // Dragon prep
    flask:      { name: 'Water flask', icon: '💧', prep: true, desc: 'Douses lava and dragonfire in the Dragon\'s Lair (coming soon).' },
    elderward:  { name: 'Elderwood ward', icon: '🛡️', prep: true, desc: 'Elderwood never burns. Shields you from dragonfire (coming soon).' },
  };

  // ---------- the hardness rule ----------
  // Every target has a hardness; your gear's tier must be at least that high.
  // Equal = 1 damage, one tier higher = 2, two = 4, three = 6.
  const MAT_HARD = { plant: 1, wood: 1, stone: 1, iron: 3, other: 1 };
  const hardness = p => p.hard ?? (p.mat === 'creature' ? (p.armor || 1) : MAT_HARD[p.mat] ?? 1);
  const STEP_DMG = [1, 2, 4, 6, 8];

  function gearDamage(id, p) {
    const G = ITEMS[id];
    if (!G || !G.gear || !p || p.kind === 'fog' || p.keyOnly) return 0;
    if (G.gear === 'weapon') { if (p.mat !== 'creature') return 0; }
    else {
      if (p.mat === 'creature') return 0;
      const ok = G.type === 'waxe' ? (p.mat === 'wood' || p.mat === 'plant')
        : G.type === 'pick' ? p.mat === 'stone'
        : !!p.struct;                                   // hammer: built defenses of any material
      if (!ok) return 0;
    }
    const bane = G.bane && p.kin === G.bane ? 1 : 0;   // bane gear hits its foes a tier harder
    const diff = G.tier + bane - hardness(p);
    if (diff < 0) return 0;
    return STEP_DMG[Math.min(diff, 4)] + (G.type === 'sword' ? 1 : 0);
  }
  // Why a piece of gear can't hurt something (for the toast).
  function gearRefusal(id, p) {
    const G = ITEMS[id];
    if (p.keyOnly) return 'Locked — only a key opens it.';
    if (p.kind === 'fog') return 'You can\'t reach into the fog — match next to it.';
    if (G.gear === 'weapon' && p.mat !== 'creature') return `Weapons only hurt monsters — equip a tool for that.`;
    if (G.gear === 'tool' && p.mat === 'creature') return `Tools can't fight — equip a weapon for monsters.`;
    if (gearDamage(id, { ...p, hard: 0 }) === 0) {
      const need = p.mat === 'wood' || p.mat === 'plant' ? 'a wood-axe' : p.mat === 'stone' ? 'a pick' : 'a hammer';
      return `A ${TYPE_INFO[G.type].what.toLowerCase()} can't break that — try ${need}${p.struct ? ' or a hammer' : ''}.`;
    }
    return `Too hard! That needs ${TIER_LABEL[hardness(p)]} gear or better.`;
  }

  // Matches still chip at built things; never at monsters, natural obstacles or iron.
  const MATCH_DMG = { wood: 1, stone: 1, other: 1, plant: 0, iron: 0, creature: 0 };
  function matchDamage(piece) {
    if (piece.toolOnly || piece.mat === 'creature') return 0;
    if (hardness(piece) >= 4) return 0;
    return MATCH_DMG[piece.mat] ?? 1;
  }

  // Specials: firepots and keys.
  const WEAPONS = {
    firepot: { wood: 2, plant: 2, creature: 2, other: 1, stone: 0, iron: 0, fog: true, area: true },
    key:        { unlock: 1 },
    goldkey:    { unlock: 2 },
    crystalkey: { unlock: 3 },
  };
  function weaponDamage(w, piece) {
    const W = WEAPONS[w];
    if (!W) return 0;
    if (W.unlock) return piece.lock && W.unlock >= (piece.lockTier || 1) ? 99 : 0;
    if (piece.keyOnly) return 0;
    return W[piece.mat] || 0;
  }
  const MAT_LABEL = { wood: 'wood', stone: 'stone', iron: 'iron', plant: 'thorns', creature: 'creatures', other: 'that' };

  // ---------- tile families: rarer woods & ores match with the common one ----------
  const FAMILY = { oak: 'wood', ironwood: 'wood', elderwood: 'wood', silver: 'ore', starsilver: 'ore', pearl: 'fish' };
  const family = t => FAMILY[t] || t;
  // Spawn weight (per 100 of that family) for each rare type by land level: a teaser first, then common.
  const RARE = {
    oak:        L => (L <= 2 ? 3 : L <= 4 ? 18 : 30),
    ironwood:   L => (L <= 2 ? 0 : L <= 4 ? 3 : L <= 6 ? 16 : 26),
    elderwood:  L => (L <= 4 ? 0 : L <= 6 ? 3 : 12),
    silver:     L => (L <= 2 ? 3 : L <= 4 ? 18 : 28),
    starsilver: L => (L <= 4 ? 0 : L <= 6 ? 3 : 12),
    pearl:      L => (L <= 2 ? 5 : L <= 4 ? 10 : 15),
  };
  const RARE_INFO = {
    oak:        { use: 'Oak hafts for iron gear, longbows — and burned into charcoal for steel.' },
    ironwood:   { use: 'Hafts for steel gear and the ironwood war bow.' },
    elderwood:  { use: 'Elderwood never burns — the key to surviving dragonfire.' },
    silver:     { use: 'Crystal keys today; silvered gear is coming.' },
    starsilver: { use: 'The mythic metal. After the dragon, it forges legends.' },
    pearl:      { use: 'Pearls glow in the dark. Forge a Pearl sabre — light, quick, and deadly to creatures of the dark.' },
    coral:      { use: 'Hard as iron, no forge needed. Carve a Coral spear — bane of sea creatures.' },
  };

  // ---------- finds ----------
  const FINDS = {
    forest: [['cache', 30], ['basket', 20], ['lostclub', 12], ['scrap', 15], ['key', 13], ['shard', 10]],
    mine:   [['orepocket', 30], ['coalseam', 20], ['nugget', 15], ['scrap', 15], ['key', 10], ['shard', 10]],
    ocean:  [['pearl', 25], ['barrel', 25], ['nugget', 15], ['key', 15], ['shard', 12], ['basket', 8]],
  };
  const FIND_INFO = {
    cache:     { icon: '🎁', name: 'Hidden cache', desc: 'Someone\'s stash — +3 supplies' },
    basket:    { icon: '🧺', name: 'Food basket', desc: '+3 food for your next raid' },
    lostclub:  { icon: '🪓', name: 'Lost battle-axe', desc: 'A wooden battle-axe — added to your gear' },
    scrap:     { icon: '🗺️', name: 'Map scrap', desc: 'Collect 3 to reveal a raid target' },
    key:       { icon: '🗝️', name: 'Old key', desc: 'Opens a locked chest or iron gate' },
    shard:     { icon: '💎', name: 'Relic shard', desc: 'A piece of the Old King\'s Crown' },
    orepocket: { icon: '⛓️', name: 'Ore pocket', desc: '+3 iron' },
    coalseam:  { icon: '🪨', name: 'Coal seam', desc: '+3 coal' },
    nugget:    { icon: '✨', name: 'Gold nuggets', desc: '+3 gold', art: 'gold' },
    sling:     { icon: '🏹', name: 'Old short bow', desc: 'A pine short bow — added to your gear' },
    pearl:     { icon: '🦪', name: 'Oyster', desc: '+1 pearl, +2 gold', art: 'pearl' },
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

  // ---------- recipes ----------
  // tier: 'keys' | 'smelt' | 'weapon' | 'tool' | 'kit' | 'prep'; defense: true for camp defenses.
  // items: other items consumed; makes: resources produced instead of an item.
  const RECIPES = [
    { id: 'goldkey',    tier: 'keys', cost: { gold: 6 }, items: { key: 2 } },
    { id: 'crystalkey', tier: 'keys', cost: { silver: 2, water: 3 }, items: { goldkey: 2 } },
    { id: 'charcoal', tier: 'smelt', name: 'Burn charcoal', icon: '⚫', cost: { oak: 2 }, makes: { charcoal: 3 }, desc: 'Slow-burn oak into charcoal for the forge.' },
    { id: 'steel',    tier: 'smelt', name: 'Forge steel', icon: '🔩', cost: { iron: 3, charcoal: 2, water: 1 }, makes: { steel: 1 }, desc: 'Iron + charcoal, quenched in water.' },
    { id: 'baxe1', tier: 'weapon', cost: { wood: 4, hide: 1 } },
    { id: 'bow1',  tier: 'weapon', cost: { wood: 3, hide: 2 } },
    { id: 'baxe2', tier: 'weapon', cost: { iron: 4, oak: 2, water: 1 } },
    { id: 'sword2', tier: 'weapon', cost: { iron: 5, oak: 1, hide: 1, water: 1 } },
    { id: 'bow2',  tier: 'weapon', cost: { oak: 4, hide: 2 } },
    { id: 'baxe3', tier: 'weapon', cost: { steel: 3, ironwood: 2 } },
    { id: 'sword3', tier: 'weapon', cost: { steel: 3, ironwood: 1, hide: 1 } },
    { id: 'bow3',  tier: 'weapon', cost: { ironwood: 4, hide: 2, steel: 1 } },
    { id: 'coralspear', tier: 'weapon', cost: { coral: 5, wood: 2, hide: 1 } },
    { id: 'pearlsabre', tier: 'weapon', cost: { pearl: 3, iron: 3, oak: 1, water: 1 } },
    { id: 'waxe1', tier: 'tool', cost: { wood: 3, stone: 3 } },
    { id: 'pick1', tier: 'tool', cost: { wood: 3, stone: 4 } },
    { id: 'hammer1', tier: 'tool', cost: { wood: 2, stone: 5 } },
    { id: 'waxe2', tier: 'tool', cost: { iron: 3, oak: 1, water: 1 } },
    { id: 'pick2', tier: 'tool', cost: { iron: 4, oak: 1, water: 1 } },
    { id: 'hammer2', tier: 'tool', cost: { iron: 4, oak: 1, water: 1 } },
    { id: 'waxe3', tier: 'tool', cost: { steel: 2, ironwood: 1 } },
    { id: 'pick3', tier: 'tool', cost: { steel: 2, ironwood: 1 } },
    { id: 'hammer3', tier: 'tool', cost: { steel: 3, ironwood: 1 } },
    { id: 'helmet1', tier: 'armor', cost: { hide: 3 } },
    { id: 'body1',   tier: 'armor', cost: { hide: 5 } },
    { id: 'legs1',   tier: 'armor', cost: { hide: 4 } },
    { id: 'gloves1', tier: 'armor', cost: { hide: 2 } },
    { id: 'shield1', tier: 'armor', cost: { wood: 4, hide: 1 } },
    { id: 'helmet2', tier: 'armor', cost: { iron: 3, hide: 1, water: 1 } },
    { id: 'body2',   tier: 'armor', cost: { iron: 6, hide: 2, water: 1 } },
    { id: 'legs2',   tier: 'armor', cost: { iron: 4, hide: 1, water: 1 } },
    { id: 'gloves2', tier: 'armor', cost: { iron: 2, hide: 1 } },
    { id: 'shield2', tier: 'armor', cost: { iron: 3, oak: 2 } },
    { id: 'helmet3', tier: 'armor', cost: { steel: 2, hide: 1 } },
    { id: 'body3',   tier: 'armor', cost: { steel: 4, hide: 2 } },
    { id: 'legs3',   tier: 'armor', cost: { steel: 3, hide: 1 } },
    { id: 'gloves3', tier: 'armor', cost: { steel: 1, hide: 1 } },
    { id: 'shield3', tier: 'armor', cost: { steel: 2, ironwood: 2 } },
    { id: 'fence', tier: 'def', cost: { wood: 6 }, defense: true },
    { id: 'trap',  tier: 'def', cost: { wood: 4, hide: 2 }, defense: true },
    { id: 'wall',  tier: 'def', cost: { stone: 12 }, defense: true },
    { id: 'tower', tier: 'def', cost: { wood: 8, hide: 2 }, defense: true },
    { id: 'palisade', tier: 'def', cost: { wood: 6, iron: 1 }, defense: true, needs: 'palisade' },
    { id: 'gate', tier: 'def', cost: { iron: 5, oak: 1, water: 1 }, defense: true },
    { id: 'bulwark', tier: 'def', cost: { steel: 2, stone: 6 }, defense: true },
    { id: 'hatchet', tier: 'kit', cost: { wood: 6, iron: 2 } },
    { id: 'knife',   tier: 'kit', cost: { wood: 2, iron: 3 } },
    { id: 'lamp',    tier: 'kit', cost: { coal: 4, iron: 2, gold: 2 } },
    { id: 'chowder', tier: 'food', cost: { food: 3, water: 2 } },
    { id: 'flask',   tier: 'prep', cost: { water: 4, hide: 1 } },
    { id: 'elderward', tier: 'prep', cost: { elderwood: 3, water: 2 } },
  ];

  // ---------- progression ----------
  const backpackSize = L => Math.min(80, 30 + 5 * (L - 1));
  const landLevel = runs => Math.min(10, 1 + Math.floor(runs / 2));
  const enemyTier = wins => Math.min(4, 1 + Math.floor(wins / 2));
  const TIER_NAMES = { goblin: ['Scouts', 'Warriors', 'Raiders', 'Warband'], dwarf: ['Miners', 'Guards', 'Ironclads', 'Lords'] };
  // What enemies carry at each rank: goblins wood → iron, dwarves iron → steel. Armor is their hardness.
  const ENEMY_GEAR = { goblin: [1, 1, 2, 2], dwarf: [2, 2, 3, 3] };
  const ENEMY_ARMOR = { goblin: [1, 1, 2, 2], dwarf: [2, 2, 3, 3] };
  const CHEST_TIERS = { 1: 'Bronze', 2: 'Gold', 3: 'Crystal' };

  const xpForLevel = L => 15 * (L - 1) * L;
  const levelFromXp = xp => { let L = 1; while (xp >= xpForLevel(L + 1)) L++; return L; };
  function levelInfo(L) {
    return {
      startObstacles: Math.min(10, 4 + Math.floor((L - 1) * 0.75)),
      growEvery: L < 2 ? 0 : Math.max(3, 8 - L),
      hpBonus: L >= 7 ? 2 : L >= 4 ? 1 : 0,
      buried: Math.min(6, 3 + Math.floor((L - 1) / 3)),
    };
  }
  const XP = { match: 1, obstacle: 3, find: 5, chase: 8, discover: 5, craft: 5, craft2: 10, raidWin: 40, raidWinDwarf: 60, loot: 10, retreat: 10 };

  const MATERIAL_INFO = {
    wood:  { from: 'Forest pine logs, Coast driftwood, stumps (wood-axe)', use: 'Wooden weapons, stone tools, fences, towers' },
    stone: { from: 'Forest & Iron Hills rocks, boulders (pick)', use: 'Stone tools, stone walls, bulwarks' },
    hide:  { from: 'Forest pelts', use: 'Bows, swords, pit traps, flasks' },
    food:  { from: 'Forest berries, Coast fish', use: 'Marching to raids (3–4 per raid), Bottled chowder (heals your keep mid-raid)' },
    gold:  { from: 'Gold nuggets everywhere, pearls, chests', use: 'Gold keys, the miner\'s lamp' },
    iron:  { from: 'Iron Hills ore, iron veins, spoils', use: 'Iron gear, iron gates, steel' },
    coal:  { from: 'Iron Hills coal', use: 'The miner\'s lamp' },
    water: { from: 'Sunlit Coast', use: 'Quenching iron & steel, water flasks' },
    oak:   { from: 'Forest (rare at first, common from Lv 3)', use: RARE_INFO.oak.use },
    ironwood:  { from: 'Forest Lv 3+ (rare), common from Lv 5', use: RARE_INFO.ironwood.use },
    elderwood: { from: 'Deep forest, Lv 5+', use: RARE_INFO.elderwood.use },
    silver:     { from: 'Iron Hills (rare at first, common from Lv 3)', use: RARE_INFO.silver.use },
    starsilver: { from: 'Iron Hills Lv 5+', use: RARE_INFO.starsilver.use },
    charcoal:   { from: 'Burned oak (Workshop)', use: 'Forging steel' },
    steel:      { from: 'Forged at the Workshop', use: 'Steel gear and bulwarks' },
    pearl:      { from: 'Sunlit Coast: pearl tiles among the fish, oysters in kelp & coral', use: RARE_INFO.pearl.use },
    coral:      { from: 'Sunlit Coast: break coral with a pick', use: RARE_INFO.coral.use },
  };

  return {
    RESOURCES, ITEMS, TIER_LABEL, ARMOR_LABEL, WARD, gloveEnergy, SLOTS, slotOf, tierLabel, DURABILITY, TYPE_INFO, hardness, gearDamage, gearRefusal, matchDamage, MATCH_DMG,
    WEAPONS, weaponDamage, MAT_LABEL, FAMILY, family, RARE, RARE_INFO, FINDS, FIND_INFO, rollFrom, SPOILS, RECIPES,
    backpackSize, landLevel, enemyTier, TIER_NAMES, ENEMY_GEAR, ENEMY_ARMOR, CHEST_TIERS, xpForLevel, levelFromXp, levelInfo, XP, MATERIAL_INFO,
  };
})();
