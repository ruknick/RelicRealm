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
    { art: '👑', title: 'The Old King\'s Crown', text: `Long ago, the realm of ${GAME.realm} was held together by the Old King's Crown: five relics of power set in gold. Forests grew tall, dwarf hammers rang in the hills, and pearls glittered along the coast.` },
    { art: '🐉', title: 'Emberwyrm', text: 'Then the dragon came. Emberwyrm burned the king\'s hall to ash and shattered the Crown. Its five relic shards scattered across the land, and the dragon carried the king\'s gold back to its fire mountain.' },
    { art: '🔥', title: 'The realm falls apart', text: 'Without the Crown, everything fell apart. Goblins crept out of the forest to raid and steal. The dwarves sealed their halls and trusted no one. In the chaos, your village of Ashford burned.' },
    { art: '⚔️', title: '{name} of Ashford', text: 'Only you are left. You have a stone axe, a little courage, and the ashes of home. Build a camp. Gather. Forge. Find the five relic shards. When the Crown is whole again, climb the fire mountain and face Emberwyrm.' },
  ];

  // ---------- chapters ----------
  // Each objective is checked against your save; finishing them all completes the chapter.
  const st = () => App.state;
  const ownsTier = t => [...st().gear, ...Object.values(st().equip).filter(Boolean)].some(g => Data.ITEMS[g.id].tier >= t && !Data.ITEMS[g.id].spoil && Data.ITEMS[g.id].gear !== 'trinket');
  const CHAPTERS = [
    {
      id: 'prologue', title: 'Prologue · From the Ashes',
      intro: 'Ashford is gone, but the forest still stands, and so do you. Start again: gather what you can, forge something useful, and raise a camp the raiders can\'t simply walk into.',
      goals: [
        { text: 'Gather in the 🌲 Forest', done: () => st().lands.forest.runs >= 1 },
        { text: 'Craft anything at the 🔨 Workshop', done: () => !!st().story.flags.crafted },
        { text: 'Fortify 🏰 Your Camp', done: () => !!st().story.flags.fortify },
      ],
      reward: { label: '🧢 Leather cap + 20 XP', give: () => { App.addGear('helmet1'); App.addXP(20); } },
      outro: 'Smoke rises from your new camp. As you bank the fire, you notice small, clawed footprints in the mud by the trees, and a stolen Ashford cooking pot dropped beside them. Goblins.',
    },
    {
      id: 'goblins', title: 'Chapter 1 · Goblin Trouble',
      intro: 'The goblins who looted Ashford are still out there. Follow their tracks through the forest, find their village, and take back what\'s yours.',
      goals: [
        { text: 'Find a 🔥 Goblin Village (follow 🐾 tracks in the Forest)', done: () => st().marked.goblin > 0 || st().enemyWins.goblin > 0 },
        { text: 'Win a raid on the Goblin Village', done: () => st().enemyWins.goblin >= 1 },
      ],
      reward: { label: '🗝️ Old key + 30 XP', give: () => { st().inventory.key++; App.addXP(30); } },
      outro: 'Among the goblin loot you find a torn map with a dwarf rune scratched on it and a note in goblin scrawl: "shards only show for the strongest." Whatever it means, the dwarves in the hills may know more.',
    },
    {
      id: 'dwarves', title: 'Chapter 2 · Iron in the Hills',
      intro: 'Wood and stone won\'t be enough against what\'s coming. The Iron Hills hold ore and coal, and somewhere under them the dwarves guard their halls, and maybe a relic shard.',
      goals: [
        { text: 'Gather in the ⛏️ Iron Hills', done: () => st().lands.mine.runs >= 1 },
        { text: 'Forge any iron gear (weapon, tool or armor)', done: () => ownsTier(2) },
        { text: 'Win a raid on a ⚒️ Dwarf Stronghold', done: () => st().enemyWins.dwarf >= 1 },
      ],
      reward: { label: '⛑️ Iron helm + 40 XP', give: () => { App.addGear('helmet2'); App.addXP(40); } },
      outro: 'The dwarf chief, Thrain Ironbeard, lowers his axe. "Ye fight well for a surface-dweller. Emberwyrm burned our forges too, ye know. Fire must be met with water. Go to the coast, and learn."',
    },
    {
      id: 'coast', title: 'Chapter 3 · Salt and Pearls',
      intro: 'Thrain\'s advice leads you to the Sunlit Coast. Fresh water is the only thing that stops dragonfire, and the old fishers say the sea gives up treasures to the patient.',
      goals: [
        { text: 'Gather on the 🌊 Sunlit Coast', done: () => st().lands.ocean.runs >= 1 },
        { text: 'Find a pearl', done: () => !!st().seen.pearl || st().stockpile.pearl > 0 },
        { text: 'Craft 2 💧 Water flasks', done: () => st().inventory.flask >= 2 },
      ],
      reward: { label: '💎 2 Sapphires + 50 XP', give: () => { st().stockpile.sapphire += 2; App.addXP(50); } },
      outro: 'An old fisher watches you fill your flasks. "Water\'ll douse the flames, aye. But to stand in front of that wyrm, you\'ll want wood that never burns: elderwood, from the deep forest. And you\'ll want the Crown."',
    },
    {
      id: 'crown', title: 'Chapter 4 · The Old King\'s Crown',
      intro: 'The relic shards are bound to the land itself. Each one reveals itself only to someone who has mastered its place: the deepest forest, the richest hills, the farthest coast, and the mightiest goblin and dwarf war-bands. Master them all, melt gold into bars, and forge the Crown anew.',
      goals: [
        { text: 'Earn all 5 💎 relic shards (Lv 10 in each land, beat the goblin & dwarf top ranks)', done: () => Object.keys(st().shardFrom || {}).length >= 5 || st().inventory.crown > 0 },
        { text: 'Forge the 👑 Old King\'s Crown (5 shards + 3 gold bars)', done: () => st().inventory.crown > 0 },
        { text: 'Forge any steel gear', done: () => ownsTier(3) },
        { text: 'Wear armor in every slot (helmet, body, gloves, legs, shield)', done: () => ['helmet', 'body', 'gloves', 'legs', 'shield'].every(s => st().equip[s]) },
      ],
      reward: { label: '🌳 3 Elderwood + 80 XP', give: () => { st().stockpile.elderwood += 3; App.addXP(80); } },
      outro: 'The Crown is whole. When you lift it, the five relics glow, and far to the north the fire mountain answers with a rumble. Emberwyrm knows you\'re coming.',
    },
    {
      id: 'dragon', title: 'Chapter 5 · Emberwyrm',
      intro: 'Everything has led here. Gather water, elderwood and steel, then climb the fire mountain. Lava spreads across the dragon\'s lair, and Emberwyrm sleeps on the king\'s stolen gold.',
      goals: [
        { text: 'Carry 3 💧 Water flasks', done: () => st().inventory.flask >= 3 },
        { text: 'Craft an 🛡️ Elderwood ward', done: () => st().inventory.elderward > 0 },
        { text: 'Defeat Emberwyrm in the 🐉 Dragon\'s Lair (coming in the next update)', done: () => false },
      ],
      reward: null,
      outro: '',
    },
  ];

  // First visit to each place on the map.
  const PLACES = {
    forest: { title: '🌲 The Whispering Forest', text: 'Pine and oak grow thick here, and older trees grow deeper in. Goblins hide among the trunks, and thieves have been known to snatch a full sack and run.' },
    mine:   { title: '⛏️ The Iron Hills', text: 'The dwarves dug these hills for a thousand years before they sealed their doors. Ore and coal are everywhere, and deep in the stone, gems still glint.' },
    ocean:  { title: '🌊 The Sunlit Coast', text: 'Waves wash up driftwood, fish and the occasional oyster. Fresh water from the springs here is the only thing known to stop dragonfire.' },
    goblin: { title: '🔥 Goblin Village', text: 'A ramshackle camp of stolen timber, still smelling of Ashford smoke. Their keep is hidden in the fog, so scout it out before they break your camp.' },
    dwarf:  { title: '⚒️ Dwarf Stronghold', text: 'Stone halls behind iron gates. The dwarves wear iron and steel; bring a weapon that can bite through it.' },
    camp:   { title: '🏰 Your Camp', text: 'All that\'s left of Ashford: a keep, a loot chest, and room to build. Raiders will come while you\'re away. Make them work for it.' },
    craft:  { title: '🔨 The Workshop', text: 'An old anvil pulled from the ashes, a forge, a bench. Everything you gather becomes something here.' },
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
          ${has ? '<button class="link" id="t-intro">Watch the story again</button>' : ''}
        </div></div>`;
    App.go('title');
    const on = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
    on('t-continue', () => { App.go('home'); });
    on('t-legacy', () => create(true));
    on('t-intro', () => intro(() => App.go('home')));
    on('t-new', async () => {
      if (has || legacy) {
        const c = await App.choose({ title: 'Start a new game?', html: `<p>This replaces ${has ? `<b>${App.state.profile.name}</b>'s` : 'your current'} journey: level, items, camp, everything.</p>`,
          buttons: [{ id: 'yes', label: 'Start over', cls: 'danger' }, { id: 'no', label: 'Keep playing', cls: 'alt' }] });
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
      el.innerHTML = `<div class="story-panel">
          <div class="story-art">${p.art}</div>
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
  async function check() {
    const s = ensure();
    if (!App.state.profile || s.chapter >= CHAPTERS.length - 1) return;
    const ch = CHAPTERS[s.chapter];
    if (!ch.goals.every(g => g.done())) return;
    s.chapter++;
    ch.reward?.give();
    App.save();
    Sound.sfx('victory');
    await App.choose({ title: `✓ ${ch.title}`, html: `<p class="story-text">${fill(ch.outro)}</p><p class="reward">Reward: <b>${ch.reward.label}</b></p>`, buttons: [{ id: 'ok', label: 'Continue →' }] });
    const next = CHAPTERS[s.chapter];
    await App.choose({ title: `📜 ${next.title}`, html: `<p class="story-text">${fill(next.intro)}</p>${goalList(next)}`, buttons: [{ id: 'ok', label: 'Onward' }] });
    App.go('home');
  }
  const goalList = ch => `<ul class="goals">${ch.goals.map(g => `<li class="${g.done() ? 'done' : ''}">${g.done() ? '✓' : '○'} ${g.text}</li>`).join('')}</ul>`;

  // A one-line banner on the map with the next thing to do.
  function banner() {
    if (!App.state.profile) return '';
    const ch = chapter(), next = ch.goals.find(g => !g.done());
    return `<button class="quest-banner" id="quest-banner"><span>📜 ${ch.title}</span><small>${next ? next.text : 'All done! Return to the map.'}</small></button>`;
  }

  function journal() {
    const s = ensure(), el = document.getElementById('journal-list');
    el.innerHTML = CHAPTERS.map((ch, i) => {
      if (i > s.chapter) return `<div class="jchap locked"><b>${ch.title.split('·')[0]}· ???</b></div>`;
      const done = i < s.chapter;
      return `<div class="jchap${done ? ' done' : ' now'}"><div class="jc-title">${done ? '✓ ' : ''}${ch.title}</div>
        <p class="story-text">${fill(ch.intro)}</p>${goalList(ch)}
        ${done && ch.outro ? `<p class="story-text outro">${fill(ch.outro)}</p>` : ''}
        ${ch.reward ? `<p class="reward">${done ? 'Earned' : 'Reward'}: ${ch.reward.label}</p>` : ''}</div>`;
    }).join('') + '<button class="link" id="j-intro">📖 Read the opening tale again</button>';
    document.getElementById('j-intro').onclick = () => intro();
  }

  // Introduce a place the first time you travel there.
  async function visit(id) {
    const s = ensure(), p = PLACES[id];
    if (!p || s.places[id]) return;
    s.places[id] = true;
    App.save();
    await App.choose({ title: p.title, html: `<p class="story-text">${fill(p.text)}</p>`, buttons: [{ id: 'ok', label: 'Go on' }] });
  }

  return { GAME, ORIGINS, title, create, intro, check, banner, journal, visit, flag, ensure };
})();
