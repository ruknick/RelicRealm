// Shared game data: resources, items, gear & the hardness rule, finds, recipes, spoils, progression.
window.Data = (() => {
  // primary: shown in the top stockpile bar. The rest live in the Items screen.
  const RESOURCES = {
    wood:      { label: 'Pine', primary: true },
    stone:     { label: 'Stone', primary: true },
    hide:      { label: 'Hide', primary: true },
    food:      { label: 'Berries', primary: true },
    gold:      { label: 'Gold', primary: true },
    iron:      { label: 'Iron ore', primary: true },
    coal:      { label: 'Coal', primary: true },
    water:     { label: 'Water', primary: true },
    oak:       { label: 'Oak' },
    ironwood:  { label: 'Ironwood' },
    elderwood: { label: 'Elderwood' },
    silver:    { label: 'Silver' },
    starsilver:{ label: 'Starsilver' },
    charcoal:  { label: 'Charcoal' },
    steel:     { label: 'Steel bar' },
    ironbar:   { label: 'Iron bar' },
    silverbar: { label: 'Silver bar' },
    leather:   { label: 'Leather' },
    scrapiron: { label: 'Scrap iron' },
    shell:     { label: 'Crab shell' },
    starbar:   { label: 'Starsilver bar' },
    herring:   { label: 'Herring' },
    mushroom:  { label: 'Wild mushrooms' },
    salmon:    { label: 'Salmon' },
    honey:     { label: 'Wild honey' },
    swordfish: { label: 'Swordfish' },
    kingfish:  { label: 'Golden kingfish' },
    dragonscale: { label: 'Dragon scale' },
    pearl:     { label: 'Pearl' },
    coral:     { label: 'Coral' },
    goldbar:   { label: 'Gold bar' },
    emerald:   { label: 'Emerald' },
    sapphire:  { label: 'Sapphire' },
    ruby:      { label: 'Ruby' },
  };

  // ---------- gear: wield it, it wears down ----------
  // Tier 1 = wood/stone, 2 = iron, 3 = steel, 4 = mythic (future).
  const TIER_LABEL = { 1: 'Wood', 2: 'Iron', 3: 'Steel', 4: 'Mythic' };
  const DURABILITY = { 1: 4, 2: 8, 3: 14, 4: 25 };
  const TYPE_INFO = {
    baxe:   { cls: 'weapon', what: 'Battle-axe', trait: 'cleaves half damage into monsters beside the target' },
    sword:  { cls: 'weapon', what: 'Sword', trait: '+1 damage on every hit' },
    bow:    { cls: 'weapon', what: 'Bow', trait: 'hits every monster in the column' },
    waxe:   { cls: 'tool', what: 'Wood-axe', trait: 'chops stumps, bushes, kelp & wooden defenses' },
    pick:   { cls: 'tool', what: 'Pick', trait: 'breaks rock, ore veins, coral & stone defenses' },
    hammer: { cls: 'tool', what: 'Hammer', trait: 'smashes any built defense: walls, gates, towers, keeps' },
    spear:  { cls: 'weapon', what: 'Spear', trait: 'pierces: also hits the monsters directly above & below' },
    // Armor: worn, not swung. It takes the blows monsters aim at you; gloves add energy.
    helmet: { cls: 'armor', what: 'Helmet', trait: 'takes blows to the head' },
    body:   { cls: 'armor', what: 'Body armor', trait: 'takes most of the blows aimed at you' },
    legs:   { cls: 'armor', what: 'Leg armor', trait: 'takes blows to the legs' },
    gloves: { cls: 'armor', what: 'Gloves', trait: 'start every board with extra ⚡' },
    shield: { cls: 'armor', what: 'Shield', trait: 'catches blows before they reach you' },
    amulet: { cls: 'trinket', what: 'Amulet', trait: '' },
  };
  const ARMOR_LABEL = { 1: 'Leather', 2: 'Iron', 3: 'Steel', 4: 'Mythic' };
  const gloveEnergy = g => (g ? ITEMS[g.id].tier : 0);
  const gear = (name, type, tier, extra = {}) => {
    const cls = TYPE_INFO[type].cls;
    const what = cls === 'weapon' ? 'monsters only' : cls === 'tool' ? 'obstacles & defenses only' : `armor (hardness ${tier})`;
    const trait = type === 'gloves' ? `start every board with +${tier} ⚡` : TYPE_INFO[type].trait;
    return { name, type, tier, gear: cls, dur: cls === 'armor' ? DURABILITY[tier] : 0, art: `gear:${type}:${tier}`,
      desc: `${(cls === 'armor' ? ARMOR_LABEL : TIER_LABEL)[tier]} tier · ${what} · ${trait}.`, ...extra };
  };
  // Every slot on your warrior. Weapon & tool are swung; the rest are worn.
  // Where the five relic shards come from: master each land, or beat each enemy's mightiest rank.
  const SHARDS = [
    { id: 'forest', icon: '🌲', name: 'Forest', how: 'Reach Lv 35 in the Forest' },
    { id: 'mine',   icon: '⛏️', name: 'Iron Hills', how: 'Reach Lv 35 in the Iron Hills' },
    { id: 'ocean',  icon: '🌊', name: 'Sunlit Coast', how: 'Reach Lv 35 on the Sunlit Coast' },
    { id: 'goblin', icon: '🔥', name: 'Goblin Village', how: 'Beat the Goblin Warband (their top rank)' },
    { id: 'dwarf',  icon: '⚒️', name: 'Dwarf Stronghold', how: 'Beat the Dwarf Lords (their top rank)' },
  ];
  const SLOTS = ['helmet', 'amulet', 'body', 'gloves', 'legs', 'shield', 'weapon', 'tool'];
  const slotOf = id => { const it = ITEMS[id]; return it.gear === 'armor' ? it.type : it.gear === 'trinket' ? 'amulet' : it.gear; };
  const tierLabel = id => { const it = ITEMS[id]; return it.gem ? RESOURCES[it.gem].label : it.sea ? 'Sea' : (it.gear === 'armor' ? ARMOR_LABEL : TIER_LABEL)[it.tier]; };
  // The power of the amulet you wear ('earth' | 'tide' | 'fury'), or null.
  const amuletPower = () => { const g = window.App?.state?.equip?.amulet; return g ? ITEMS[g.id].power : null; };

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
    // Mythic (Star Anvil, Lv 35): the only gear that bites through dragon scale
    sword4: gear('Starsilver blade', 'sword', 4),
    bow4:   gear('Elderwood greatbow', 'bow', 4),
    shiv:  gear('Goblin shiv', 'sword', 2, { spoil: 'goblin' }),
    // Sea gear: iron-strength without a forge, each with a trick. Bane: hits its foes as one tier stronger.
    coralspear: gear('Coral spear', 'spear', 2, { sea: true, bane: 'sea',
      desc: 'Sea gear · iron strength, no forge needed · pierces the monsters above & below · bane of sea creatures (crabs now, worse things later).' }),
    pearlsabre: gear('Pearl sabre', 'sword', 2, { sea: true, light: true, bane: 'shadow', art: 'gear:psabre:2',
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
    dpick: gear('Dwarven pick', 'pick', 3, { spoil: 'dwarf' }),
    // Amulets: gemstones on a silver chain. Worn at the neck; they give your matches extra power.
    amulet1: gear('Rootstone amulet', 'amulet', 1, { gem: 'emerald', power: 'earth',
      desc: 'Emerald · earth power: your matches chip ANY obstacle or defense beside them — stumps, rocks, coral, even iron.' }),
    amulet2: gear('Tidestone amulet', 'amulet', 2, { gem: 'sapphire', power: 'tide',
      desc: 'Sapphire · tide power: matches of 4+ and chains give +1 more ⚡, blasts give +1 more.' }),
    amulet3: gear('Emberstone amulet', 'amulet', 3, { gem: 'ruby', power: 'fury',
      desc: 'Ruby · fury power: when a match strikes a monster beside it, your weapon hits for +2.' }),
    // Armor
    helmet1: gear('Leather cap', 'helmet', 1),      body1: gear('Leather jerkin', 'body', 1),
    legs1:   gear('Leather leggings', 'legs', 1),   gloves1: gear('Leather gloves', 'gloves', 1),
    shield1: gear('Wooden buckler', 'shield', 1),
    shellshield: gear('Shellback buckler', 'shield', 2, { sea: true, art: 'gear:shield:2', desc: 'Sea gear · iron-strong crab shell, no forge needed · catches blows before they reach you.' }),
    helmet2: gear('Iron helm', 'helmet', 2),        body2: gear('Iron mail', 'body', 2),
    legs2:   gear('Iron greaves', 'legs', 2),       gloves2: gear('Iron gauntlets', 'gloves', 2),
    shield2: gear('Iron-rimmed shield', 'shield', 2),
    helmet3: gear('Steel helm', 'helmet', 3),       body3: gear('Steel plate', 'body', 3),
    legs3:   gear('Steel greaves', 'legs', 3),      gloves3: gear('Steel gauntlets', 'gloves', 3),
    shield3: gear('Steel tower shield', 'shield', 3),
    helmet4: gear('Starsilver helm', 'helmet', 4),   body4: gear('Starsilver plate', 'body', 4),
    legs4:   gear('Starsilver greaves', 'legs', 4),  gloves4: gear('Starsilver gauntlets', 'gloves', 4),
    shield4: gear('Elderwood ward-shield', 'shield', 4, { desc: 'Mythic tier · armor (hardness 4) · elderwood never burns: catches dragonfire.' }),
    grakaxe: gear('Grak\'s war-axe', 'baxe', 2, { art: 'gear:baxe:2', desc: 'Won from Grak the Warchief · iron-strong, no forge needed · cleaves half damage into monsters beside the target.' }),
    golemheart: gear('Heart of Stone', 'amulet', 2, { gem: 'emerald', power: 'stone', art: 'gear:amulet:1',
      desc: 'Pried from the Stone Golem · stone power: +8 max ❤️.' }),
    sirenpearl: gear('Siren\'s Pearl', 'amulet', 3, { gem: 'pearl', power: 'siren', art: 'gear:amulet:2',
      desc: 'Won from the Siren Queen · siren power: every match of 4 or more heals you 1 ❤️.' }),
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
    drum:       { name: 'War drum', icon: '🥁', spoil: 'goblin', desc: 'Beat it as you raid: their defenders wait 3 moves longer.' },
    blueprint:  { name: 'Palisade blueprint', icon: '📜', spoil: 'goblin', desc: 'Unlocks the Spiked palisade defense.' },
    ale:        { name: 'Dwarf ale', icon: '🍺', spoil: 'dwarf', desc: 'Share it with the guards as you raid: their defenders wait 3 moves longer.' },
    runestone:  { name: 'Runestone', icon: '🪨', spoil: 'dwarf', desc: 'Place in your camp: +1 HP to every defense touching it. 1 pt.' },
    cartbp:     { name: 'Mine-cart blueprint', icon: '🛤️', spoil: 'dwarf', desc: 'Unlocks the Mine-cart defense.' },
    crown:      { name: 'Old King\'s Crown', icon: '👑', trinket: true, desc: 'Legendary. Forged from the five relic shards and gold. On raids their defenders wait 2 moves longer, and the way to Emberwyrm opens.' },
    // Provisions
    bread:      { name: 'Trail bread', icon: '🍞', special: true, instant: true, heal: 5, desc: 'Berry-studded bread: +5 ❤️.' },
    chowder:    { name: 'Fish chowder', icon: '🍲', art: 'chowder', special: true, instant: true, heal: 8, desc: 'Herring chowder in a bottle: +8 ❤️.' },
    honeycake:  { name: 'Honey cake', icon: '🍯', special: true, instant: true, heal: 12, desc: 'Sweet and filling: +12 ❤️.' },
    salmonpie:  { name: 'Salmon & mushroom pie', icon: '🥧', special: true, instant: true, heal: 15, desc: 'A proper hot pie: +15 ❤️.' },
    swordsteak: { name: 'Swordfish steak', icon: '🐟', special: true, instant: true, heal: 20, desc: 'Grilled over coals: +20 ❤️.' },
    feast:      { name: 'Kingfish feast', icon: '👑', special: true, instant: true, heal: 40, desc: 'A feast fit for the Old King: +40 ❤️.' },
    // Dragon prep
    flask:      { name: 'Water flask', icon: '💧', prep: true, special: true, desc: 'Throw it to douse lava and flood-water in a 3x3 area.' },
    elderward:  { name: 'Elderwood ward', icon: '🛡️', prep: true, desc: 'Carry it into the Dragon\'s Lair: dragonfire burns you for half.' },
  };

  // ---------- the hardness rule ----------
  // Every target has a hardness (its armor or material). Gear at or above it hits fully (and harder the
  // higher it is); gear below it still chips away, just far more slowly.
  const MAT_HARD = { plant: 1, wood: 1, stone: 1, iron: 3, other: 1 };
  const hardness = p => p.hard ?? (p.mat === 'creature' ? (p.armor || 1) : MAT_HARD[p.mat] ?? 1);
  const STEP_DMG = [1, 2, 4, 6, 8];
  const WEAPON_BASE = { 1: 3, 2: 6, 3: 10, 4: 15 };     // weapon damage per hit by tier
  const UNDER_WEAPON = [1, 0.5, 0.25, 0.12];             // fraction when your weapon is 1/2/3 tiers below their armor
  const UNDER_TOOL = [1, 0.34, 0.2, 0.1];                // tools chip at things too hard for them
  const strength = L => Math.floor(L / 5);               // +1 weapon damage every 5 levels

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
    if (G.gear === 'weapon') {
      const base = WEAPON_BASE[G.tier] + (G.type === 'sword' ? 1 : 0) + strength(window.App?.level || 1);
      const mult = diff >= 0 ? 1 + 0.25 * Math.min(diff, 3) : UNDER_WEAPON[Math.min(-diff, 3)];
      return Math.max(1, Math.round(base * mult));
    }
    if (diff < 0) return UNDER_TOOL[Math.min(-diff, 3)];
    return STEP_DMG[Math.min(diff, 4)];
  }
  // Under-geared? (for a warning toast)
  const underGeared = (id, p) => ITEMS[id] && ITEMS[id].tier + (ITEMS[id].bane && p.kin === ITEMS[id].bane ? 1 : 0) < hardness(p);
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
    return 'That can\'t be hurt that way.';
  }

  // Matches still chip at built things; never at monsters, natural obstacles or iron.
  const MATCH_DMG = { wood: 1, stone: 1, other: 1, plant: 0, iron: 0, creature: 0 };
  function matchDamage(piece) {
    if (piece.mat === 'creature' || piece.keyOnly) return 0;
    if (amuletPower() === 'earth') return Math.max(1, MATCH_DMG[piece.mat] ?? 1);   // Rootstone: matches chip anything
    if (piece.toolOnly) return 0;
    if (hardness(piece) >= 4) return 0;
    return MATCH_DMG[piece.mat] ?? 1;
  }

  // Specials: firepots and keys.
  const WEAPONS = {
    firepot: { wood: 2, plant: 2, creature: 2, other: 1, stone: 0, iron: 0, fog: true, area: true },
    flask:   { other: 9, area: true },
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
  const FAMILY = { mushroom: 'berries', honey: 'berries', salmon: 'fish', swordfish: 'fish', kingfish: 'fish', oak: 'wood', ironwood: 'wood', elderwood: 'wood', silver: 'ore', starsilver: 'ore', pearl: 'fish', emerald: 'stone', sapphire: 'stone', ruby: 'stone' };
  // Rares that only show up in one land (gems glint in Iron Hills rock, not forest stones).
  const RARE_LAND = { emerald: 'mine', sapphire: 'mine', ruby: 'mine' };
  const family = t => FAMILY[t] || t;
  // Spawn weight (per 100 of that family) for each rare type by land level: a teaser first, then common.
  const RARE = {
    oak:        L => (L <= 5 ? 3 : L <= 9 ? 12 : L <= 15 ? 22 : 30),
    ironwood:   L => (L <= 12 ? 0 : L <= 19 ? 3 : L <= 26 ? 16 : 26),
    elderwood:  L => (L <= 24 ? 0 : L <= 30 ? 3 : 12),
    silver:     L => (L <= 5 ? 3 : L <= 9 ? 12 : L <= 15 ? 20 : 28),
    starsilver: L => (L <= 24 ? 0 : L <= 30 ? 3 : 12),
    pearl:      L => (L <= 6 ? 5 : L <= 15 ? 10 : 15),
    mushroom:   L => (L <= 4 ? 6 : L <= 12 ? 12 : 16),
    honey:      L => (L <= 11 ? 0 : L <= 20 ? 4 : 9),
    salmon:     L => (L <= 5 ? 4 : L <= 14 ? 12 : 18),
    swordfish:  L => (L <= 14 ? 0 : L <= 24 ? 4 : 9),
    kingfish:   L => (L <= 24 ? 0 : L <= 30 ? 2 : 5),
    emerald:    L => (L <= 6 ? 4 : L <= 15 ? 7 : 9),
    sapphire:   L => (L <= 6 ? 1 : L <= 15 ? 4 : 7),
    ruby:       L => (L <= 11 ? 0 : L <= 20 ? 2 : 5),
  };
  const RARE_INFO = {
    oak:        { use: 'Oak hafts for iron gear, longbows — and burned into charcoal for steel.' },
    ironwood:   { use: 'Hafts for steel gear and the ironwood war bow.' },
    elderwood:  { use: 'Elderwood never burns — the key to surviving dragonfire.' },
    silver:     { use: 'Crystal keys and silver amulet chains.' },
    starsilver: { use: 'The mythic metal. After the dragon, it forges legends.' },
    pearl:      { use: 'Pearls glow in the dark. Forge a Pearl sabre — light, quick, and deadly to creatures of the dark.' },
    coral:      { use: 'Hard as iron, no forge needed. Carve a Coral spear — bane of sea creatures.' },
    emerald:    { use: 'Set it in silver for a Rootstone amulet: your matches chip any obstacle.' },
    sapphire:   { use: 'Set it in silver for a Tidestone amulet: big matches charge more ⚡.' },
    ruby:       { use: 'Set it in silver for an Emberstone amulet: match-strikes on monsters hit harder.' },
    mushroom:   { use: 'Better than berries (+3 ❤️), and the heart of a salmon pie.' },
    honey:      { use: 'Wild honey (+5 ❤️) — bake it into honey cakes.' },
    salmon:     { use: 'A fine fish (+5 ❤️) — bake it into a salmon & mushroom pie.' },
    swordfish:  { use: 'A great fish (+8 ❤️) — grill it into a swordfish steak.' },
    kingfish:   { use: 'The rarest fish in the sea (+12 ❤️) — the heart of a Kingfish feast.' },
    scrapiron:  { use: 'Goblins carry bits of looted metal. Smelt 3 into an iron bar at the Smelter.' },
    shell:      { use: 'Hard as iron. Five make a Shellback buckler at the Workbench.' },
  };

  // ---------- finds ----------
  const FINDS = {
    forest: [['cache', 30], ['basket', 22], ['lostclub', 10], ['scrap', 15], ['key', 3], ['nugget', 12]],
    mine:   [['orepocket', 32], ['coalseam', 22], ['nugget', 26], ['scrap', 15], ['key', 2]],
    ocean:  [['pearl', 26], ['barrel', 26], ['nugget', 30], ['key', 3], ['basket', 12]],
  };
  const FIND_INFO = {
    cache:     { icon: '📦', name: 'Hidden cache', desc: 'Someone\'s stash — +3 supplies', art: 'cache' },
    basket:    { icon: '🧺', name: 'Food basket', desc: '+3 food', art: 'basket' },
    lostclub:  { icon: '🪓', name: 'Lost battle-axe', desc: 'A wooden battle-axe — added to your gear', art: 'gear:baxe:1' },
    scrap:     { icon: '🗺️', name: 'Map scrap', desc: 'Collect 3 to reveal a raid target', art: 'mapscrap' },
    key:       { icon: '🗝️', name: 'Old key', desc: 'Opens a locked chest or iron gate', art: 'key1' },
    shard:     { icon: '💎', art: 'relicshard', name: 'Relic shard', desc: 'A piece of the Old King\'s Crown — earned by mastering a land' },
    orepocket: { icon: '⛏️', name: 'Ore pocket', desc: '+3 iron ore', art: 'orepocket' },
    coalseam:  { icon: '⚫', name: 'Coal seam', desc: '+3 coal', art: 'coalseam' },
    nugget:    { icon: '✨', name: 'Gold nuggets', desc: '+3 gold', art: 'gold' },
    sling:     { icon: '🏹', name: 'Old short bow', desc: 'A pine short bow — added to your gear', art: 'gear:bow:1' },
    pearl:     { icon: '🦪', name: 'Oyster', desc: '+1 pearl, +2 gold', art: 'pearl' },
    barrel:    { icon: '💧', name: 'Fresh-water barrel', desc: '+3 water', art: 'barrel' },
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
  // station: which crafting station you need (see STATIONS). Metals must be smelted into bars first.
  const RECIPES = [
    // Smelting & tanning: raw materials become bars and leather
    { id: 'leather',  tier: 'smelt', station: 'workbench', name: 'Tan leather', icon: '🟫', cost: { hide: 2, wood: 1 }, makes: { leather: 1 }, desc: 'Cure hides over an oak-bark fire into tough leather.' },
    { id: 'ironbar',  tier: 'smelt', station: 'smelter', name: 'Smelt iron bars', icon: '▬', cost: { iron: 2, coal: 1 }, makes: { ironbar: 1 }, desc: 'Melt iron ore down into a bar for the forge.' },
    { id: 'scrapbar', tier: 'smelt', station: 'smelter', name: 'Smelt scrap iron', icon: '▬', cost: { scrapiron: 3, coal: 1 }, makes: { ironbar: 1 }, desc: 'Goblin junk melts down into good iron.' },
    { id: 'silverbar', tier: 'smelt', station: 'smelter', name: 'Smelt silver bars', icon: '▬', cost: { silver: 2, coal: 1 }, makes: { silverbar: 1 }, desc: 'For amulet chains and crystal keys.' },
    { id: 'goldbar',  tier: 'smelt', station: 'smelter', name: 'Smelt a gold bar', icon: '🟨', cost: { gold: 6, coal: 1 }, makes: { goldbar: 1 }, desc: 'Melt gold nuggets down into a bar fit for a crown.' },
    { id: 'charcoal', tier: 'smelt', station: 'smelter', name: 'Burn charcoal', icon: '⚫', cost: { oak: 2 }, makes: { charcoal: 3 }, desc: 'Slow-burn oak into charcoal for steel.' },
    { id: 'starbar',  tier: 'smelt', station: 'dforge', name: 'Smelt starsilver bars', icon: '✨', cost: { starsilver: 3, charcoal: 2 }, makes: { starbar: 1 }, desc: 'The mythic metal — only a dwarven fire can melt it.' },
    { id: 'steel',    tier: 'smelt', station: 'dforge', name: 'Forge steel bars', icon: '🔩', cost: { ironbar: 2, charcoal: 2, water: 1 }, makes: { steel: 1 }, desc: 'Iron bars + charcoal, folded and quenched — the dwarven way.' },
    { id: 'goldkey',    tier: 'keys', station: 'workbench', cost: { gold: 6 }, items: { key: 2 } },
    { id: 'crystalkey', tier: 'keys', station: 'forge', cost: { silverbar: 1, water: 3 }, items: { goldkey: 2 } },
    { id: 'crown',    tier: 'crown', station: 'forge', cost: { goldbar: 3 }, shards: 5 },
    // Weapons
    { id: 'baxe1', tier: 'weapon', station: 'workbench', cost: { wood: 4, leather: 1 } },
    { id: 'bow1',  tier: 'weapon', station: 'workbench', cost: { wood: 3, leather: 1 } },
    { id: 'baxe2', tier: 'weapon', station: 'forge', cost: { ironbar: 3, oak: 2 } },
    { id: 'sword2', tier: 'weapon', station: 'forge', cost: { ironbar: 3, oak: 1, leather: 1 } },
    { id: 'bow2',  tier: 'weapon', station: 'forge', cost: { oak: 4, leather: 1, ironbar: 1 } },
    { id: 'baxe3', tier: 'weapon', station: 'dforge', cost: { steel: 3, ironwood: 2 } },
    { id: 'sword3', tier: 'weapon', station: 'dforge', cost: { steel: 3, ironwood: 1, leather: 1 } },
    { id: 'bow3',  tier: 'weapon', station: 'dforge', cost: { ironwood: 4, leather: 1, steel: 1 } },
    { id: 'sword4', tier: 'weapon', station: 'staranvil', cost: { starbar: 4, elderwood: 1, leather: 1 } },
    { id: 'bow4',   tier: 'weapon', station: 'staranvil', cost: { elderwood: 5, starbar: 1, leather: 1 } },
    { id: 'coralspear', tier: 'weapon', station: 'workbench', cost: { coral: 5, wood: 2, leather: 1 } },
    { id: 'pearlsabre', tier: 'weapon', station: 'forge', cost: { pearl: 3, ironbar: 2, oak: 1 } },
    // Tools
    { id: 'waxe1', tier: 'tool', station: 'workbench', cost: { wood: 3, stone: 3 } },
    { id: 'pick1', tier: 'tool', station: 'workbench', cost: { wood: 3, stone: 4 } },
    { id: 'hammer1', tier: 'tool', station: 'workbench', cost: { wood: 2, stone: 5 } },
    { id: 'waxe2', tier: 'tool', station: 'forge', cost: { ironbar: 2, oak: 1 } },
    { id: 'pick2', tier: 'tool', station: 'forge', cost: { ironbar: 2, oak: 1 } },
    { id: 'hammer2', tier: 'tool', station: 'forge', cost: { ironbar: 3, oak: 1 } },
    { id: 'waxe3', tier: 'tool', station: 'dforge', cost: { steel: 2, ironwood: 1 } },
    { id: 'pick3', tier: 'tool', station: 'dforge', cost: { steel: 2, ironwood: 1 } },
    { id: 'hammer3', tier: 'tool', station: 'dforge', cost: { steel: 3, ironwood: 1 } },
    // Armor
    { id: 'helmet1', tier: 'armor', station: 'workbench', cost: { leather: 2 } },
    { id: 'body1',   tier: 'armor', station: 'workbench', cost: { leather: 4 } },
    { id: 'legs1',   tier: 'armor', station: 'workbench', cost: { leather: 3 } },
    { id: 'gloves1', tier: 'armor', station: 'workbench', cost: { leather: 1 } },
    { id: 'shield1', tier: 'armor', station: 'workbench', cost: { wood: 4, leather: 1 } },
    { id: 'shellshield', tier: 'armor', station: 'workbench', cost: { shell: 5, leather: 1 } },
    { id: 'helmet2', tier: 'armor', station: 'forge', cost: { ironbar: 2, leather: 1 } },
    { id: 'body2',   tier: 'armor', station: 'forge', cost: { ironbar: 5, leather: 2 } },
    { id: 'legs2',   tier: 'armor', station: 'forge', cost: { ironbar: 3, leather: 1 } },
    { id: 'gloves2', tier: 'armor', station: 'forge', cost: { ironbar: 1, leather: 1 } },
    { id: 'shield2', tier: 'armor', station: 'forge', cost: { ironbar: 2, oak: 2 } },
    { id: 'helmet3', tier: 'armor', station: 'dforge', cost: { steel: 2, leather: 1 } },
    { id: 'body3',   tier: 'armor', station: 'dforge', cost: { steel: 4, leather: 2 } },
    { id: 'legs3',   tier: 'armor', station: 'dforge', cost: { steel: 3, leather: 1 } },
    { id: 'gloves3', tier: 'armor', station: 'dforge', cost: { steel: 1, leather: 1 } },
    { id: 'shield3', tier: 'armor', station: 'dforge', cost: { steel: 2, ironwood: 2 } },
    { id: 'helmet4', tier: 'armor', station: 'staranvil', cost: { starbar: 3, leather: 1 } },
    { id: 'body4',   tier: 'armor', station: 'staranvil', cost: { starbar: 6, leather: 2 } },
    { id: 'legs4',   tier: 'armor', station: 'staranvil', cost: { starbar: 4, leather: 1 } },
    { id: 'gloves4', tier: 'armor', station: 'staranvil', cost: { starbar: 2, leather: 1 } },
    { id: 'shield4', tier: 'armor', station: 'staranvil', cost: { elderwood: 4, starbar: 2 } },
    // Amulets
    { id: 'amulet1', tier: 'amulet', station: 'forge', cost: { emerald: 2, silverbar: 1, leather: 1 } },
    { id: 'amulet2', tier: 'amulet', station: 'forge', cost: { sapphire: 2, silverbar: 2, leather: 1 } },
    { id: 'amulet3', tier: 'amulet', station: 'forge', cost: { ruby: 2, silverbar: 2, goldbar: 1 } },
    // Defenses
    { id: 'fence', tier: 'def', station: 'workbench', cost: { wood: 6 }, defense: true },
    { id: 'trap',  tier: 'def', station: 'workbench', cost: { wood: 4, hide: 2 }, defense: true },
    { id: 'wall',  tier: 'def', station: 'workbench', cost: { stone: 12 }, defense: true },
    { id: 'tower', tier: 'def', station: 'workbench', cost: { wood: 8, leather: 1 }, defense: true },
    { id: 'palisade', tier: 'def', station: 'workbench', cost: { wood: 6, ironbar: 1 }, defense: true, needs: 'palisade' },
    { id: 'gate', tier: 'def', station: 'forge', cost: { ironbar: 3, oak: 1 }, defense: true },
    { id: 'bulwark', tier: 'def', station: 'dforge', cost: { steel: 2, stone: 6 }, defense: true },
    // Kit, provisions, dragon prep
    { id: 'hatchet', tier: 'kit', station: 'workbench', cost: { wood: 6, ironbar: 1 } },
    { id: 'knife',   tier: 'kit', station: 'workbench', cost: { wood: 2, ironbar: 1 } },
    { id: 'lamp',    tier: 'kit', station: 'workbench', cost: { coal: 4, ironbar: 1, gold: 2 } },
    { id: 'bread',   tier: 'food', station: 'workbench', cost: { food: 3, wood: 1 } },
    { id: 'chowder', tier: 'food', station: 'workbench', cost: { herring: 3, water: 2 } },
    { id: 'honeycake', tier: 'food', station: 'workbench', cost: { honey: 2, food: 2, wood: 1 } },
    { id: 'salmonpie', tier: 'food', station: 'workbench', cost: { salmon: 2, mushroom: 2, wood: 1 } },
    { id: 'swordsteak', tier: 'food', station: 'workbench', cost: { swordfish: 1, coal: 1 } },
    { id: 'feast',   tier: 'food', station: 'workbench', cost: { kingfish: 1, honey: 1, salmon: 1 } },
    { id: 'flask',   tier: 'prep', station: 'workbench', cost: { water: 4, leather: 1 } },
    { id: 'elderward', tier: 'prep', station: 'workbench', cost: { elderwood: 3, water: 2 } },
  ];

  // ---------- crafting stations (built at your camp) ----------
  const STATIONS = {
    workbench: { icon: '🪵', name: 'Workbench', lv: 1, cost: {}, desc: 'Wood & stone tools, leather, fences, traps, meals.' },
    smelter:   { icon: '🔥', name: 'Smelter', lv: 8, cost: { stone: 10, coal: 4 }, desc: 'Smelt ore into bars: iron, silver and gold. Burns charcoal.' },
    forge:     { icon: '⚒️', name: 'Forge', lv: 10, cost: { stone: 12, ironbar: 4, coal: 4 }, desc: 'Iron weapons, tools & armor, gates, amulets, the Crown.' },
    dforge:    { icon: '🏔️', name: 'Dwarven Forge', lv: 20, cost: { stone: 20, ironbar: 10, coal: 10 }, needs: 'dwarfwin',
      desc: 'Thrain Ironbeard teaches you the dwarven way: steel bars, steel gear, bulwarks.' },
    staranvil: { icon: '✨', name: 'Star Anvil', lv: 35, cost: { stone: 30, starbar: 4, coal: 15 },
      desc: 'Mythic starsilver & elderwood gear — the only metal that bites through dragon scale.' },
  };
  const STATION_ORDER = ['workbench', 'smelter', 'forge', 'dforge', 'staranvil'];


  // ---------- food: lowest to finest. Each counts as one ration for marching; finer food heals more. ----------
  const FOODS = { food: 2, herring: 3, mushroom: 3, salmon: 5, honey: 5, swordfish: 8, kingfish: 12 };
  const FOOD_ORDER = Object.keys(FOODS);   // eaten / spent lowest first

  // ---------- progression ----------
  // Eras: wood & leather (Lv 1–9), iron (10–19), steel (20–34), mythic (35+).
  const ERA = L => (L < 10 ? 1 : L < 20 ? 2 : L < 35 ? 3 : 4);
  const ERA_NAME = { 1: 'Wood & Leather', 2: 'Iron', 3: 'Steel', 4: 'Mythic' };
  const LAND_MAX = 35;
  const backpackSize = L => Math.min(100, 30 + 2 * (L - 1));
  const maxHp = L => 10 + 2 * Math.floor(L / 2);
  const landLevel = runs => Math.min(LAND_MAX, 1 + Math.floor(runs * 2 / 3));
  const enemyTier = wins => Math.min(4, 1 + Math.floor(wins / 2));
  const TIER_NAMES = { goblin: ['Scouts', 'Warriors', 'Raiders', 'Warband'], dwarf: ['Miners', 'Guards', 'Ironclads', 'Lords'] };
  // What enemies carry at each rank: goblins wood → iron, dwarves iron → steel. Armor is their hardness.
  const ENEMY_GEAR = { goblin: [1, 1, 2, 2], dwarf: [2, 2, 3, 3] };
  const ENEMY_ARMOR = { goblin: [1, 1, 2, 2], dwarf: [2, 2, 3, 3] };
  const TROOP_HP = { goblin: r => 8 + 4 * (r - 1), dwarf: r => 14 + 5 * (r - 1) };
  const CHEST_TIERS = { 1: 'Bronze', 2: 'Gold', 3: 'Crystal' };
  // How hard a blow lands on you, by the attacker's weapon tier (before your armor).
  const ATTACK = { 1: 2, 2: 4, 3: 6, 4: 8 };

  // Roaming monsters on gathering boards: more of them, sooner, tougher as the land levels up (1–35).
  const landEra = L => (L < 10 ? 1 : L < 20 ? 2 : 3);
  const monsterPlan = L => ({
    start: Math.min(3, Math.floor(L / 6)),                // on the board when you arrive
    every: Math.max(3, 8 - Math.floor(L / 6)),            // a new one every N moves
    max: Math.min(6, 2 + Math.floor(L / 7)),              // most on the board at once
    hp: Math.round(7 + L * 0.5),
    armor: landEra(L), weapon: landEra(L),                // wood → iron (Lv 10) → steel (Lv 20)
    attackEvery: 3,                                       // each one swings at you every N moves (first swing 2 moves after it appears)
  });

  // Revenge: win raids (or leave goblins alive) and they'll come for your Storehouse.
  const GRUDGE_FULL = 6, REVENGE_WARN_TRIPS = 2, REVENGE_COOLDOWN = 3, REVENGE_MOVES = 30;

  // Levels start quick, then each one takes a good deal longer.
  const xpForLevel = L => (L <= 1 ? 0 : Math.round(7.5 * Math.pow(L - 1, 2.1)));
  const levelFromXp = xp => { let L = 1; while (xp >= xpForLevel(L + 1)) L++; return L; };
  function levelInfo(L) {
    return {
      startObstacles: Math.min(10, 4 + Math.floor((L - 1) * 0.25)),
      growEvery: L < 2 ? 0 : Math.max(3, 8 - Math.floor(L / 5)),
      hpBonus: L >= 21 ? 2 : L >= 11 ? 1 : 0,
      buried: Math.min(6, 3 + Math.floor((L - 1) / 9)),
    };
  }
  const XP = { match: 1, obstacle: 3, find: 5, chase: 8, monster: 6, discover: 5, craft: 5, craft2: 10, raidWin: 40, raidWinDwarf: 60, loot: 10, retreat: 10 };

  const MATERIAL_INFO = {
    wood:  { from: 'Forest pine logs, Coast driftwood, stumps (wood-axe)', use: 'Wooden weapons, stone tools, fences, towers' },
    stone: { from: 'Forest & Iron Hills rocks, boulders (pick)', use: 'Stone tools, stone walls, bulwarks' },
    hide:  { from: 'Forest pelts', use: 'Tanned into leather; pit traps' },
    food:  { from: 'Forest berries', use: 'The plainest food (+2 ❤️) · trail bread · marching to raids' },
    herring:   { from: 'Sunlit Coast: the common fish', use: 'Food (+3 ❤️) · fish chowder' },
    mushroom:  { from: 'Forest: among the berries (rare)', use: RARE_INFO.mushroom.use },
    honey:     { from: 'Forest Lv 12+: among the berries', use: RARE_INFO.honey.use },
    salmon:    { from: 'Sunlit Coast: among the fish (rare)', use: RARE_INFO.salmon.use },
    swordfish: { from: 'Sunlit Coast Lv 15+', use: RARE_INFO.swordfish.use },
    kingfish:  { from: 'Sunlit Coast Lv 25+ (very rare)', use: RARE_INFO.kingfish.use },
    gold:  { from: 'Gold nuggets everywhere, oysters, chests', use: 'Gold bars, gold keys, the miner\'s lamp' },
    goldbar: { from: 'Smelted from gold nuggets (Workshop)', use: 'The Old King\'s Crown' },
    iron:  { from: 'Iron Hills ore, iron veins, spoils', use: 'Smelt into iron bars (Smelter)' },
    coal:  { from: 'Iron Hills coal', use: 'Fuel for every bar you smelt' },
    ironbar: { from: 'Smelter: iron ore or goblin scrap iron', use: 'Iron gear, iron armor, gates, steel' },
    silverbar: { from: 'Smelter: silver ore', use: 'Amulet chains, crystal keys' },
    leather: { from: 'Workbench: tanned from hide', use: 'Armor, bows, sword grips, flasks' },
    scrapiron: { from: 'Goblin raiders & cave goblins drop it', use: 'Smelts into iron bars' },
    shell: { from: 'Shore crabs drop it', use: 'The Shellback buckler (sea shield)' },
    starbar: { from: 'Dwarven Forge: starsilver ore + charcoal', use: 'Mythic gear at the Star Anvil' },
    dragonscale: { from: 'Slaying Emberwyrm', use: 'Beyond the Known Realm… (coming)' },
    water: { from: 'Sunlit Coast', use: 'Quenching iron & steel, water flasks' },
    oak:   { from: 'Forest (rare at first, common from Lv 3)', use: RARE_INFO.oak.use },
    ironwood:  { from: 'Forest Lv 3+ (rare), common from Lv 5', use: RARE_INFO.ironwood.use },
    elderwood: { from: 'Deep forest, Lv 5+', use: RARE_INFO.elderwood.use },
    silver:     { from: 'Iron Hills (rare at first, common from Lv 3)', use: RARE_INFO.silver.use },
    starsilver: { from: 'Iron Hills Lv 5+', use: RARE_INFO.starsilver.use },
    charcoal:   { from: 'Burned oak (Workshop)', use: 'Forging steel' },
    steel:      { from: 'Dwarven Forge: iron bars + charcoal', use: 'Steel gear and bulwarks' },
    pearl:      { from: 'Sunlit Coast: pearl tiles among the fish, oysters in kelp & coral', use: RARE_INFO.pearl.use },
    coral:      { from: 'Sunlit Coast: break coral with a pick', use: RARE_INFO.coral.use },
    emerald:    { from: 'Iron Hills: glints among the stones (rare)', use: RARE_INFO.emerald.use },
    sapphire:   { from: 'Iron Hills: glints among the stones (rarer)', use: RARE_INFO.sapphire.use },
    ruby:       { from: 'Iron Hills Lv 4+: deep in the stones (rarest)', use: RARE_INFO.ruby.use },
  };

  return {
    RESOURCES, ITEMS, FOODS, FOOD_ORDER, TIER_LABEL, ARMOR_LABEL, gloveEnergy, STATIONS, STATION_ORDER, ERA, ERA_NAME, LAND_MAX, maxHp, strength, ATTACK, TROOP_HP, underGeared, landEra,
    GRUDGE_FULL, REVENGE_WARN_TRIPS, REVENGE_COOLDOWN, REVENGE_MOVES, SHARDS, SLOTS, slotOf, tierLabel, amuletPower, RARE_LAND, DURABILITY, TYPE_INFO, hardness, gearDamage, gearRefusal, matchDamage, MATCH_DMG,
    WEAPONS, weaponDamage, MAT_LABEL, FAMILY, family, RARE, RARE_INFO, FINDS, FIND_INFO, rollFrom, SPOILS, RECIPES,
    backpackSize, landLevel, enemyTier, monsterPlan, TIER_NAMES, ENEMY_GEAR, ENEMY_ARMOR, CHEST_TIERS, xpForLevel, levelFromXp, levelInfo, XP, MATERIAL_INFO,
  };
})();
