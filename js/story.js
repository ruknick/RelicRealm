// Story: title screen, character creation, the opening tale, chapter quests (Journal) and place introductions.
window.Story = (() => {
  const GAME = { title: 'Tile Realm', sub: 'The Shattered Crown', realm: 'Valdmoor' };

  // ---------- characters ----------
  const ORIGINS = {
    woodcutter: { icon: '🪓', name: 'Woodcutter', line: 'Raised among the pines. Your hatchet never leaves your belt.',
      gift: 'Hatchet: +1 pine on every wood match', give: st => { st.inventory.hatchet = 1; } },
    hunter:     { icon: '🏹', name: 'Hunter', line: 'You tracked deer through the forest long before you tracked goblins.',
      gift: 'Pine short bow + Skinning knife: +1 hide on every hide match', give: st => { st.inventory.knife = 1; App.addGear('bow1'); } },
    miner:      { icon: '⛏️', name: 'Miner', line: 'Your family worked the old shafts. You can smell ore in the dark.',
      gift: 'Miner\'s lamp: buried finds glimmer', give: st => { st.inventory.lamp = 1; } },
    fisher:     { icon: '🎣', name: 'Fisher', line: 'You grew up on the Sunlit Coast, mending nets and reading the tides.',
      gift: '2 Bottled chowder + 6 water', give: st => { st.inventory.chowder += 2; st.stockpile.water += 6; } },
  };
  const SKIN = ['#f3cfb0', '#e0b089', '#c68b5e', '#8d5a3b', '#5e3a24'];
  const HAIR = ['#2a1a10', '#5a3a1e', '#a0642c', '#d8b25a', '#b03a1e', '#d9d9d9'];
  const STYLES = { short: 'Short', long: 'Long', tied: 'Tied up', bald: 'Bald' };
  const BEARDS = { none: 'None', short: 'Stubble', full: 'Full beard' };
  const defaultLook = () => ({ skin: SKIN[1], hair: HAIR[1], style: 'short', beard: 'none' });

  // ---------- the opening tale ----------
  const INTRO = [
    { art: () => Lore.ART.crown(), title: 'The Old King\'s Crown', text: `Long ago, the realm of ${GAME.realm} was held together by the Old King's Crown: five relics of power set in gold. Forests grew tall, dwarf hammers rang in the hills, and pearls glittered along the coast.` },
    { art: () => Lore.ART.dragon(), title: 'Emberwyrm', text: 'Then the dragon came. Emberwyrm burned the king\'s hall to ash and shattered the Crown. Its five relic shards scattered across the land, and the dragon carried the king\'s gold back to its fire mountain.' },
    { art: () => Lore.ART.village(), title: 'The realm falls apart', text: 'Without the Crown, everything fell apart. Goblins crept out of the forest to raid and steal. The dwarves sealed their halls and trusted no one. In the chaos, your village of Ashford burned.' },
    { art: () => Lore.ART.hero(), title: '{name} of Ashford', text: 'Only you are left. You have a stone axe, a little courage, and the ashes of home. Build a camp. Gather. Forge. Find the five relic shards. When the Crown is whole again, climb the fire mountain and face Emberwyrm.' },
  ];

  // ---------- chapters ----------
  // Each chapter: who tells it, a few opening lines, goals checked against your save, a reward,
  // and a short ending that leaves a question open. Some end on a full-screen story panel.
  const st = () => App.state;
  const ownsTier = t => [...st().gear, ...Object.values(st().equip).filter(Boolean)].some(g => Data.ITEMS[g.id].tier >= t && !Data.ITEMS[g.id].spoil && Data.ITEMS[g.id].gear !== 'trinket');
  const landLv = k => Data.landLevel(st().lands[k].runs);
  const beat = k => ((st().bossWins || {})[k] || 0) > 0;
  const fl = k => !!(st().story && st().story.flags[k]);
  const count = k => (st().story && st().story.counts && st().story.counts[k]) || 0;
  const hasAmulet = () => [...st().gear, st().equip.amulet].filter(Boolean).some(g => Data.ITEMS[g.id].gear === 'trinket');
  const CHAPTERS = [
    { id: 'prologue', title: 'Prologue · From the Ashes', teller: 'maren',
      intro: ['Ashford is ash. But you\'re alive, {name}, and so are a handful of us.', '"Wood first. Walls second. Grief can wait."'],
      goals: [
        { text: 'Gather in the 🌲 Whispering Wood', spot: 'forest', done: () => st().lands.forest.runs >= 1 },
        { text: 'Craft anything at the ⚒ Workshop', spot: 'craft', done: () => fl('crafted') },
        { text: 'Fortify 🏰 Your Camp', spot: 'camp', done: () => fl('fortify') },
      ],
      reward: { label: 'Leather cap + 20 XP', give: () => { App.addGear('helmet1'); App.addXP(20); } },
      outro: ['Smoke rises from a camp that wasn\'t here yesterday.', 'Maren hands you a bowl of something hot. "Good. Now we need proper food."'] },
    { id: 'bread', title: 'Chapter 1 · Bread and Water', teller: 'maren',
      intro: ['"We\'re starving, child. The old Ashford farms still stand — wheat, apples, chickens."', '"Bring me grain and water, and I\'ll show you bread."'],
      goals: [
        { text: 'Gather in the 🌾 Golden Fields', spot: 'farm', done: () => st().lands.farm.runs >= 1 },
        { text: 'Bake Trail bread in the 🍲 Kitchen', spot: 'kitchen', done: () => fl('cooked') },
        { text: 'Eat packed food on a trip (pack it at 🏰 Your Camp)', spot: 'camp', done: () => fl('ateTrip') },
      ],
      reward: { label: 'Leather gloves + 25 XP', give: () => { App.addGear('gloves1'); App.addXP(25); } },
      outro: ['Maren turns a coin in her fingers — an Ashford penny, found in a goblin\'s pocket.', '"Goblins don\'t spend coins. So who\'s paying them?"'] },
    { id: 'tracks', title: 'Chapter 2 · Tracks in the Mud', teller: 'maren',
      intro: ['Goblins keep creeping round the camp at night.', '"Drive them off — and keep your eyes open for where they come from."'],
      goals: [
        { text: 'Defeat 3 goblin raiders in the Forest', spot: 'forest', done: () => count('goblins') >= 3 },
        { text: 'Open a locked chest (find its key on the board)', spot: 'forest', done: () => fl('chest') },
        { text: 'Reach Whispering Wood Lv 5', spot: 'forest', done: () => landLv('forest') >= 5 },
      ],
      reward: { label: '2 Old keys + 30 XP', give: () => { st().inventory.key += 2; App.addXP(30); } },
      outro: ['Fresh tracks lead deeper into the wood. Something heavy was dragged between them.', '"Follow them," says Maren. "Carefully."'] },
    { id: 'bell', title: 'Chapter 3 · The Stolen Bell', teller: 'maren',
      intro: ['The tracks lead to a goblin keep walled with stolen Ashford timber.', '"Take it back," says Maren. "And build us a wall — they\'ll want revenge."'],
      goals: [
        { text: 'Take the first goblin keep', spot: 'forest', done: () => st().enemyWins.goblin >= 1 },
        { text: 'Build a stone wall at the ⚒ Workshop', spot: 'craft', done: () => (st().inventory.wall || 0) > 0 || Object.values((st().camp || {}).cells || {}).includes('wall') },
      ],
      reward: { label: 'Wooden buckler + 40 XP', give: () => { App.addGear('shield1'); App.addXP(40); } },
      panel: 'bell',
      outro: ['Inside the keep: Ashford\'s church bell. Maren turns it over and goes very quiet.', '"That bell rang over my wedding. And goblins can\'t write."'] },
    { id: 'grak', title: 'Chapter 4 · Grak\'s Drums', teller: 'bram',
      intro: ['Bram wipes his hands on his apron. "Drums in the wood every night. That\'s Grak, the Warchief."', '"Big, loud, and he swings a dwarf-made axe. Don\'t let him hit you."'],
      goals: [{ text: 'Defeat Grak in the Warchief\'s Clearing (Forest Lv 6)', spot: 'forest', done: () => beat('warchief') }],
      reward: { label: '6 Oak + 50 XP', give: () => { st().stockpile.oak += 6; App.addXP(50); } },
      outro: ['Grak\'s axe is dwarf-made, all right. The runes on it belong to a dwarf clan.', 'Bram frowns. "Dwarves don\'t trade with goblins. Something stinks."'] },
    { id: 'ore', title: 'Chapter 5 · Fire and Ore', teller: 'bram',
      intro: ['"I need real metal," says Bram. "The Iron Hills are full of ore — if the dwarves let you near it."', '"Build me a smelter."'],
      goals: [
        { text: 'Gather in the ⛏️ Iron Hills', spot: 'mine', done: () => st().lands.mine.runs >= 1 },
        { text: 'Build the Smelter (Lv 8)', spot: 'craft', done: () => !!st().stations.smelter },
        { text: 'Have 5 iron bars', spot: 'craft', done: () => st().stockpile.ironbar >= 5 || !!st().stations.forge },
      ],
      reward: { label: '8 Coal + 50 XP', give: () => { st().stockpile.coal += 8; App.addXP(50); } },
      outro: ['In the hills a dwarf captain, Thrain Ironbeard, threw you out at axe-point.', '"Thief," he called you. Thief of what?'] },
    { id: 'forge', title: 'Chapter 6 · The Forge', teller: 'bram',
      intro: ['"Now a proper forge," says Bram, very nearly smiling. "Iron, not wood. Iron!"'],
      goals: [
        { text: 'Build the Forge (Lv 10)', spot: 'craft', done: () => !!st().stations.forge },
        { text: 'Forge any iron gear', spot: 'craft', done: () => ownsTier(2) },
      ],
      reward: { label: 'Iron gauntlets + 60 XP', give: () => { App.addGear('gloves2'); App.addXP(60); } },
      outro: ['The forge roars. Bram turns an old Ashford coin over in the firelight: stamped on the back, a tiny silver seal.', '"Seen that mark before," he mutters. "Can\'t think where."'] },
    { id: 'salt', title: 'Chapter 7 · Salt and Pearls', teller: 'wren',
      intro: ['A girl with red hair is mending nets on the shore. "I\'m Wren. You\'re the one rebuilding Ashford?"', '"Help me with the crabs and I\'ll show you where the pearls hide."'],
      goals: [
        { text: 'Gather on the 🌊 Sunlit Coast', spot: 'ocean', done: () => st().lands.ocean.runs >= 1 },
        { text: 'Find a pearl', spot: 'ocean', done: () => !!st().seen.pearl || st().stockpile.pearl > 0 },
        { text: 'Craft 2 💧 Water flasks', spot: 'craft', done: () => st().inventory.flask >= 2 },
      ],
      reward: { label: '2 Sapphires + 60 XP', give: () => { st().stockpile.sapphire += 2; App.addXP(60); } },
      outro: ['Wren\'s grandfather watches you from his doorway and says nothing.', '"He saw something the night Ashford burned," Wren whispers. "He won\'t say what."'] },
    { id: 'crab', title: 'Chapter 8 · The King of the Shore', teller: 'wren',
      intro: ['"The King Crab has taken the harbour," says Wren. "No boat goes out while he sits on the reef."'],
      goals: [{ text: 'Defeat the King Crab (Coast Lv 8)', spot: 'ocean', done: () => beat('kingcrab') }],
      reward: { label: '6 Crab shells + 70 XP', give: () => { st().stockpile.shell += 6; App.addXP(70); } },
      outro: ['The boats go out again, and Wren\'s grandfather finally talks:', '"A tall ship. A silver sail. Loading the king\'s crates by torchlight, the night Ashford burned."'] },
    { id: 'stones', title: 'Chapter 9 · Stones of Power', teller: 'ysolde',
      intro: ['"Sit, sit." Madame Ysolde shuffles her cards. "The gems remember the Crown, darling. Wear one."', '"And look for the silver seal. Always the silver seal."'],
      goals: [
        { text: 'Find a gem in the Iron Hills', spot: 'mine', done: () => ['emerald', 'sapphire', 'ruby'].some(k => st().seen[k] || st().stockpile[k] > 0) },
        { text: 'Smelt a silver bar', spot: 'craft', done: () => st().stockpile.silverbar > 0 || hasAmulet() },
        { text: 'Craft an amulet', spot: 'craft', done: () => hasAmulet() },
      ],
      reward: { label: '4 Silver + 80 XP', give: () => { st().stockpile.silver += 4; App.addXP(80); } },
      outro: ['Ysolde turns her last card: a ship with a silver sail.', '"Ah," she says softly. "Him." And she won\'t say another word.'] },
    { id: 'thrain', title: 'Chapter 10 · Thrain\'s Test', teller: 'thrain',
      intro: ['Thrain blocks the road. "Ye want into our halls? Prove ye\'re no thief."', '"Take one of our strongholds — fairly — and wear proper armor while ye do it."'],
      goals: [
        { text: 'Take a dwarf stronghold', spot: 'mine', done: () => st().enemyWins.dwarf >= 1 },
        { text: 'Wear armor in every slot (helmet, body, gloves, legs, shield)', done: () => ['helmet', 'body', 'gloves', 'legs', 'shield'].every(k => st().equip[k]) },
      ],
      reward: { label: '6 Iron bars + 100 XP', give: () => { st().stockpile.ironbar += 6; App.addXP(100); } },
      outro: ['Thrain lowers his axe. "Ye fight well for a surface-dweller."', '"Come to the Dwarven Forge. There\'s something ye should know."'] },
    { id: 'hammer', title: 'Chapter 11 · The Missing Hammer', teller: 'thrain',
      intro: ['"Years ago our great hammer was stolen," says Thrain. "The only tool in the realm that could cut the Crown\'s gold."', '"Learn our steel. Then help me find who took it."'],
      goals: [
        { text: 'Build the Dwarven Forge (Lv 20)', spot: 'craft', done: () => !!st().stations.dforge },
        { text: 'Forge any steel gear', spot: 'craft', done: () => ownsTier(3) },
      ],
      reward: { label: 'Steel helm + 120 XP', give: () => { App.addGear('helmet3'); App.addXP(120); } },
      panel: 'oath',
      outro: ['Thrain watches your first steel cool. "Good."', '"The Golem guards the empty hammer vault. It saw the thief."'] },
    { id: 'golem', title: 'Chapter 12 · The Golem\'s Vault', teller: 'thrain',
      intro: ['"The Golem has stood in the hammer vault for a hundred years," says Thrain. "It lets no one pass. Not even me."'],
      goals: [{ text: 'Defeat the Golem (Iron Hills Lv 12)', spot: 'mine', done: () => beat('golem') }],
      reward: { label: '2 Emeralds + 140 XP', give: () => { st().stockpile.emerald += 2; App.addXP(140); } },
      outro: ['Carved on the vault wall by the Golem\'s own stone hand: a man in fine robes, holding the hammer.', 'On his finger, a silver ring.'] },
    { id: 'kings', title: 'Chapter 13 · Two Kings', teller: 'thrain',
      intro: ['"Both kings were paid by the same man," Thrain growls. "I\'d stake my beard on it."', '"Clear the keeps, climb to their halls, and make them talk."'],
      goals: [
        { text: 'Defeat the Goblin King (Forest Lv 35)', spot: 'forest', done: () => beat('goblinking') },
        { text: 'Defeat the Dwarf King (Iron Hills Lv 35)', spot: 'mine', done: () => beat('dwarfking') },
      ],
      reward: { label: '2 Gold bars + 200 XP', give: () => { st().stockpile.goldbar += 2; App.addXP(200); } },
      panel: 'kings',
      outro: ['Two letters. One seal. One name: M.', 'Maren goes pale. "Morvane," she whispers. "The King\'s steward."'] },
    { id: 'crown', title: 'Chapter 14 · The Old King\'s Crown', teller: 'maren',
      intro: ['"Five shards, gold bars, and Bram\'s best work," says Maren. "Let\'s make the Crown whole."'],
      goals: [{ text: 'Forge the 👑 Old King\'s Crown (5 shards + 3 gold bars)', spot: 'craft', done: () => st().inventory.crown > 0 }],
      reward: { label: '3 Elderwood + 200 XP', give: () => { st().stockpile.elderwood += 3; App.addXP(200); } },
      panel: 'crown',
      outro: ['The Crown glows — but one socket stays empty.', '"The binding stone," Maren says quietly. "Whoever holds it holds the dragon\'s chain."'] },
    { id: 'star', title: 'Chapter 15 · Starsilver', teller: 'bram',
      intro: ['"Only starsilver bites dragon scale," says Bram. "I\'ll need the Star Anvil — and you to bring me the metal."'],
      goals: [
        { text: 'Build the Star Anvil (Lv 35)', spot: 'craft', done: () => !!st().stations.staranvil },
        { text: 'Forge any mythic gear', spot: 'craft', done: () => ownsTier(4) },
      ],
      reward: { label: '250 XP', give: () => { App.addXP(250); } },
      outro: ['Bram hands you the finished blade without a word.', 'Then: "Come back. That\'s an order."'] },
    { id: 'dragon', title: 'Chapter 16 · Emberwyrm', teller: 'maren',
      intro: ['"Climb the fire mountain," says Maren. "Take water. Take your ward. And come home."'],
      goals: [
        { text: 'Carry 3 💧 Water flasks', spot: 'craft', done: () => st().inventory.flask >= 3 },
        { text: 'Carry an Elderwood ward', spot: 'craft', done: () => st().inventory.elderward > 0 },
        { text: 'Defeat Emberwyrm in the 🐉 Dragon\'s Lair', spot: 'lair', done: () => fl('dragonSlain') },
      ],
      reward: null,
      panel: 'chain',
      outro: ['The dragon flies free into the smoke. In its hoard you find the Old King\'s journal.', 'Its last page names the one who did all this: Morvane.'] },
    { id: 'beyond', title: 'Epilogue · Beyond the Realm', teller: 'journal',
      intro: ['"If anyone reads this: it was Morvane. Find the regalia. Put it right."', 'Morvane sailed beyond the map with the Lost Regalia. To follow him you\'ll need the whole Wayfarer\'s Chart — and a boat.'],
      goals: [{ text: 'Complete the Wayfarer\'s Chart', done: () => (st().chart || 0) >= Data.CHART_PIECES }],
      reward: null,
      outro: ['To be continued…'] },
  ];

  // First visit to each place on the map.
  const PLACES = {
    forest: { title: '🌲 The Whispering Forest', text: 'Pine and oak grow thick here, and older trees grow deeper in. Goblins hide among the trunks, and thieves have been known to snatch a full sack and run.' },
    mine:   { title: '⛏️ The Iron Hills', text: 'The dwarves dug these hills for a thousand years before they sealed their doors. Ore and coal are everywhere, and deep in the stone, gems still glint.' },
    farm:   { title: '🌾 The Golden Fields', text: 'The old Ashford farms survived the fire: wheat to your waist, apple trees heavy with fruit, and chickens that never stay where you put them. No monsters here — just hard, honest work and a full larder.' },
    ocean:  { title: '🌊 The Sunlit Coast', text: 'Waves wash up driftwood, fish and the occasional oyster. Fresh water from the springs here is the only thing known to stop dragonfire.' },
    goblin: { title: '🔥 Goblin Village', text: 'A ramshackle camp of stolen timber, still smelling of Ashford smoke. Their keep is hidden in the fog, so scout it out before they break your camp.' },
    dwarf:  { title: '⚒️ Dwarf Stronghold', text: 'Stone halls behind iron gates. The dwarves wear iron and steel; bring a weapon that can bite through it.' },
    camp:   { title: '🏰 Your Camp', text: 'All that\'s left of Ashford: a keep, a loot chest, and room to build. Raiders will come while you\'re away. Make them work for it.' },
    fair: { title: '🎪 The Harvest Fair', text: 'Somebody found the old bunting. Somebody else found a wheel. Now Ashford holds a fair — pies, silly hats and fortunes. Nothing here will win a war, but it might win a smile.' },
    kitchen: { title: '🍲 The Kitchen', text: 'A cook-fire, a pot and a bread oven, rescued from the old Ashford inn. Raw berries keep you going; a hot meal keeps you alive.' },
    craft:  { title: '⚒ The Workshop', text: 'An old anvil pulled from the ashes, a forge, a bench. Everything you gather becomes something here.' },
  };

  // What each place teaches the first time you arrive, in the voice of whoever lives there.
  const LESSONS = {
    craft: { who: 'bram', lines: ['So you found my Workshop. Bring me what you gather and I\'ll make you something useful.', 'Tools break obstacles. Weapons fight monsters. Armor takes the hits. Better metal beats tougher things: wood, then iron, then steel.', 'New recipes unlock as you level up. Tap one to see what it needs.'] },
    kitchen: { who: 'maren', lines: ['My kitchen. Raw berries keep you going, but a hot meal keeps you alive.', 'Cook here, then pack your food at Your Camp before a trip. On the board, tap 🍖 to eat.'] },
    camp: { who: 'maren', lines: ['This is all that\'s left of Ashford: your keep, your bank, your walls.', 'Everything you gather is banked here. Pack food for the road from the Storehouse below the camp.', 'Raiders will come for your bank one day. Craft walls at the Workshop and place them around the keep.'] },
    fair: { who: 'ysolde', lines: ['Welcome, darling! Find golden tickets on your travels and bring them here.', 'One ticket, one round on the fairground. Match the gold stars to win spins of the wheel — hats, capes, pies… and something very lucky, if the wheel likes you.'] },
    forest: { who: 'maren', lines: ['The Whispering Wood. Pine, hide and berries — and goblins among the trunks.', 'Matches bring home what\'s on the board. Stumps need your axe; goblins need your weapon. Head home whenever you like.'] },
    farm: { who: 'maren', lines: ['The old Ashford farms! Wheat, apples, eggs — and chickens that never stay where you put them.', 'No monsters here. Just honest work and a full larder.'] },
    mine: { who: 'maren', lines: ['The Iron Hills. Ore and coal for Bram\'s smelter, and gems deep in the rock.', 'Boulders and veins need a pick. And mind the cave goblins.'] },
    ocean: { who: 'maren', lines: ['The Sunlit Coast. Fish, fresh water, driftwood — and pearls, if you\'re patient.', 'Water is the only thing that stops dragonfire. Remember that.'] },
  };

  function ensure() {
    const s = st();
    if (!s.story) s.story = { chapter: 0, flags: {}, places: {}, introSeen: false };
    s.story.flags ||= {}; s.story.places ||= {};
    return s.story;
  }
  const fill = t => t.replace(/\{name\}/g, (st().profile && st().profile.name) || 'Warrior');
  const flag = k => { const s = ensure(); if (!s.flags[k]) { s.flags[k] = true; App.save(); } };

  // ---------- title screen ----------
  function title() {
    const has = !!(App.state.profile);
    const legacy = !has && (App.state.xp > 0 || App.state.gear.length > 3);   // a save from before characters existed
    const el = document.getElementById('screen-title');
    el.innerHTML = `<div class="title-wrap">
        <div class="title-art">${Art.WORLD.replace(/wm([A-Z])/g, 'wt$1')}</div>
        <div class="title-card">
          <div class="title-crown">👑</div>
          <h1 class="game-title">${GAME.title}</h1>
          <div class="game-sub">${GAME.sub}</div>
          ${has ? `<button class="big" id="t-continue">▶ Continue <small>${App.state.profile.name} · Level ${App.level}</small></button>` : ''}
          ${legacy ? `<button class="big" id="t-legacy">▶ Continue <small>Level ${App.level} · create your character, keep your progress</small></button>` : ''}
          <button class="big ${has || legacy ? 'alt' : ''}" id="t-new">✨ New game</button>
          <button class="big alt" id="t-slots">👥 Adventurers <small>switch or start another · slot ${App.slot} of 3</small></button>
          ${has ? '<button class="link" id="t-intro">Watch the story again</button>' : ''}
          <p class="cloud-status" id="cloud-status">${App.cloudStatus()}</p>
          <button class="link" id="t-move">💾 Move your save</button>
        </div></div>`;
    App.go('title');
    const on = (id, f) => { const b = document.getElementById(id); if (b) { b.onclick = f; b.disabled = !App.cloudReady; } };
    on('t-continue', () => { App.go('home'); });
    on('t-move', () => App.moveSave());
    on('t-slots', () => App.pickSlot());
    on('t-legacy', () => create(true));
    on('t-intro', () => intro(() => App.go('home')));
    on('t-new', async () => {
      if (has || legacy) {
        const c = await App.choose({ title: 'Start a new game?', html: `<p>Starting over here replaces ${has ? `<b>${App.state.profile.name}</b>'s` : 'your current'} journey: level, items, camp, everything.</p><p class="hint">To keep it, start your new adventurer in another slot instead.</p>`,
          buttons: [{ id: 'slot', label: '👥 Use another slot (keep this one)' }, { id: 'yes', label: 'Replace this journey', cls: 'danger' }, { id: 'no', label: 'Keep playing', cls: 'alt' }] });
        if (c === 'slot') { App.pickSlot(); return; }
        if (c !== 'yes') return;
      }
      create();
    });
  }

  // ---------- character creation ----------
  let draft = null;
  function create(keepSave = false) {
    draft = { name: '', origin: 'woodcutter', ...defaultLook(), keepSave };
    App.go('create');
    renderCreate();
  }
  function renderCreate() {
    const el = document.getElementById('screen-create');
    const swatches = (key, list) => list.map(c => `<button class="swatch${draft[key] === c ? ' on' : ''}" data-k="${key}" data-v="${c}" style="background:${c}"></button>`).join('');
    const chips = (key, obj) => Object.entries(obj).map(([v, l]) => `<button class="chip-btn${draft[key] === v ? ' on' : ''}" data-k="${key}" data-v="${v}">${l}</button>`).join('');
    el.innerHTML = `<h2 class="create-h">Create your warrior</h2>
      <div class="create-top">
        <div class="create-fig">${Hero.figure({ look: draft, bare: true })}</div>
        <div class="create-look">
          <label class="lbl">Name</label>
          <input id="c-name" maxlength="14" placeholder="Your name" value="${draft.name.replace(/"/g, '&quot;')}" autocomplete="off">
          <label class="lbl">Skin</label><div class="swatches">${swatches('skin', SKIN)}</div>
          <label class="lbl">Hair</label><div class="swatches">${swatches('hair', HAIR)}</div>
          <div class="chips">${chips('style', STYLES)}</div>
          <div class="chips">${chips('beard', BEARDS)}</div>
        </div>
      </div>
      <label class="lbl">Who were you in Ashford?</label>
      <div class="origins">${Object.entries(ORIGINS).map(([k, o]) => `<button class="origin${draft.origin === k ? ' on' : ''}" data-o="${k}">
        <span class="o-icon">${o.icon}</span><span class="o-body"><b>${o.name}</b><small>${o.line}</small><em>Starts with: ${o.gift}</em></span></button>`).join('')}</div>
      <button class="big" id="c-go" ${draft.name.trim() ? '' : 'disabled'}>⚔️ Begin the journey</button>
      <button class="link" id="c-back">← Back</button>`;
    const name = document.getElementById('c-name');
    name.oninput = () => { draft.name = name.value; document.getElementById('c-go').disabled = !name.value.trim(); };
    el.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { draft[b.dataset.k] = b.dataset.v; renderCreate(); }; });
    el.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => { draft.origin = b.dataset.o; renderCreate(); }; });
    document.getElementById('c-back').onclick = () => title();
    document.getElementById('c-go').onclick = () => {
      const profile = { name: draft.name.trim().slice(0, 14), origin: draft.origin, look: { skin: draft.skin, hair: draft.hair, style: draft.style, beard: draft.beard } };
      if (draft.keepSave) { App.state.profile = profile; App.save(); intro(() => App.go('home')); return; }
      App.newGame(profile);
      ORIGINS[profile.origin].give(App.state);
      App.save();
      intro(() => { App.go('home'); });
    };
  }

  // ---------- the tale, panel by panel ----------
  function intro(done) {
    const el = document.getElementById('story');
    let i = 0;
    const show = () => {
      const p = INTRO[i];
      el.innerHTML = `<div class="story-panel book-page" data-page="${i + 1}">
          <div class="story-art lore-art">${typeof p.art === 'function' ? p.art() : p.art}</div>
          <h2>${fill(p.title)}</h2><p>${fill(p.text)}</p>
          <div class="story-dots">${INTRO.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
          <button class="big" id="s-next">${i < INTRO.length - 1 ? 'Next →' : 'Begin ⚔️'}</button>
          ${i < INTRO.length - 1 ? '<button class="link" id="s-skip">Skip</button>' : ''}
        </div>`;
      el.classList.remove('hidden');
      document.getElementById('s-next').onclick = () => { if (++i < INTRO.length) show(); else finish(); };
      const skip = document.getElementById('s-skip');
      if (skip) skip.onclick = finish;
    };
    const finish = () => { el.classList.add('hidden'); ensure().introSeen = true; App.save(); done?.(); };
    show();
  }

  // ---------- chapters ----------
  const chapter = () => CHAPTERS[Math.min(ensure().chapter, CHAPTERS.length - 1)];
  // Called on returning to the map: finish the chapter if every goal is met.
  // Saves from before the story rewrite: move to the matching new chapter (finishing any whose goals
  // are already met, quietly), and mark the land tales already passed as read (they stay in the Journal).
  const OLD_CHAPTER = [0, 2, 5, 7, 13, 16];
  function migrate() {
    const s = ensure();
    if (s.v === 2) return;
    s.v = 2;
    if (App.state.profile) {
      let c = OLD_CHAPTER[Math.min(s.chapter || 0, OLD_CHAPTER.length - 1)];
      while (c < CHAPTERS.length - 1 && CHAPTERS[c].goals.every(g => g.done())) c++;
      s.chapter = c;
      s.tales ||= {};
      ['forest', 'mine', 'ocean', 'farm'].forEach(k => { s.tales[k] = Math.min(35, Math.floor(landLv(k) / 5) * 5); });
      if ((s.tales.forest || 0) >= 15 && !s.flags.pip) s.flags.pip = 'spared';
    }
    App.save();
  }

  // Called on the map: tell what piled up (tales, pages), then finish chapters whose goals are met.
  let checking = false;
  async function check() {
    if (checking || !App.state.profile) return;
    checking = true;
    try {
      const s = ensure();
      migrate();
      await Lore.playQueued();
      s.shown ||= {};
      if (!s.shown[s.chapter]) {   // the current chapter's opening lines, once
        s.shown[s.chapter] = true; App.save();
        const ch = CHAPTERS[s.chapter];
        await Lore.say({ who: ch.teller, title: `📜 ${ch.title}`, lines: [...ch.intro, goalList(ch)] });
      }
      while (s.chapter < CHAPTERS.length - 1 && CHAPTERS[s.chapter].goals.every(g => g.done())) {
        const ch = CHAPTERS[s.chapter];
        s.chapter++;
        ch.reward?.give();
        App.save();
        Sound.sfx('victory');
        await Lore.say({ who: ch.teller, title: `✓ ${ch.title}`, lines: [...ch.outro, ...(ch.reward ? [`<span class="reward">Reward: <b>${ch.reward.label}</b></span>`] : [])] });
        if (ch.panel) await Lore.panel(ch.panel);
        const next = CHAPTERS[s.chapter];
        s.shown[s.chapter] = true; App.save();
        await Lore.say({ who: next.teller, title: `📜 ${next.title}`, lines: [...next.intro, goalList(next)] });
      }
    } finally { checking = false; }
    if (!document.getElementById('screen-home').classList.contains('hidden')) World.render();
  }
  const goalList = ch => `<ul class="goals">${ch.goals.map(g => `<li class="${g.done() ? 'done' : ''}">${g.done() ? '✓' : '○'} ${g.text}</li>`).join('')}</ul>`;

  // A one-line banner on the map with the next thing to do.
  function banner() {
    if (!App.state.profile) return '';
    const ch = chapter(), next = ch.goals.find(g => !g.done());
    return `<button class="quest-banner" id="quest-banner"><span>📜 ${ch.title}</span><small>${next ? next.text : 'All done! Return to the map.'}</small></button>`;
  }

  // The Journal: Chapters · Tales of the lands · Lost pages · People.
  let jtab = 'chapters';
  function journal() {
    const s = ensure(), el = document.getElementById('journal-list');
    migrate();
    const pages = (s.pages || []).length, people = Object.keys(s.met || {}).length;
    const tabs = [['chapters', 'Chapters', `${Math.min(s.chapter + 1, CHAPTERS.length)}/${CHAPTERS.length}`], ['tales', 'Tales', 'of the lands'], ['pages', 'Pages', `${pages}/${Lore.PAGES.length}`], ['people', 'People', `${people} met`]];
    let body = '';
    if (jtab === 'chapters') {
      body = CHAPTERS.map((ch, i) => {
        if (i > s.chapter) return `<div class="jchap locked"><b>${ch.title.split('·')[0]}· ???</b></div>`;
        const done = i < s.chapter, T = Lore.CAST[ch.teller];
        return `<div class="jchap${done ? ' done' : ' now'}"><div class="jc-title">${done ? '✓ ' : ''}${ch.title}</div>
          <div class="jc-teller"><span class="remark-pic">${T.pic()}</span>told by ${T.name}</div>
          ${ch.intro.map(l => `<p class="story-text">${fill(l)}</p>`).join('')}${goalList(ch)}
          ${done && ch.outro ? ch.outro.map(l => `<p class="story-text outro">${fill(l)}</p>`).join('') : ''}
          ${ch.reward ? `<p class="reward">${done ? 'Earned' : 'Reward'}: ${ch.reward.label}</p>` : ''}</div>`;
      }).join('') + '<button class="link" id="j-intro">📖 Read the opening tale again</button><br><button class="link" id="j-tips">💬 Show Maren\'s tips again</button>';
    } else if (jtab === 'tales') body = Lore.talesHtml();
    else if (jtab === 'pages') body = Lore.pagesHtml();
    else body = Lore.peopleHtml();
    el.innerHTML = `<div class="jtabs">${tabs.map(([id, label, sub]) => `<button class="jtab${jtab === id ? ' on' : ''}" data-jt="${id}">${label}<small>${sub}</small></button>`).join('')}</div>${body}`;
    el.querySelectorAll('[data-jt]').forEach(b => { b.onclick = () => { jtab = b.dataset.jt; journal(); }; });
    const ji = document.getElementById('j-intro');
    if (ji) ji.onclick = () => intro();
    const jt = document.getElementById('j-tips');
    if (jt) jt.onclick = () => { App.state.tips = {}; App.save(); jt.textContent = '✓ Maren will show her tips again on your next trips'; };
  }

  // Count something the story is waiting for (e.g. goblins defeated).
  function countUp(k, n = 1) { const s = ensure(); s.counts ||= {}; s.counts[k] = (s.counts[k] || 0) + n; App.save(); }

  // Introduce a place the first time you travel there.
  async function visit(id) {
    const s = ensure(), p = PLACES[id];
    if (!p || s.places[id]) return;
    s.places[id] = true;
    App.save();
    const L = LESSONS[id];
    await Lore.say({ who: L ? L.who : 'maren', title: p.title, lines: L ? L.lines : [p.text] });
  }

  // Which map spot the story wants you at next (it glows on the map early on).
  const nextSpot = () => { const g = chapter().goals.find(x => !x.done()); return g && g.spot; };

  return { nextSpot, GAME, ORIGINS, title, create, intro, check, banner, journal, visit, flag, ensure, countUp, CHAPTERS, migrate };
})();
