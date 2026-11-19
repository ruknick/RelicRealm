// Gathering boards (Forest, Iron Hills): match for resources, dig up buried finds,
// break obstacles with the right weapon, chase a runaway, discover a raid target.
window.Gather = (() => {
  // ---------- tuning knobs ----------
  const SIZE = 7;
  const MOVES = 20;
  // Backpack size grows with your level (Data.backpackSize).
  const STAR_CHANCE = 0.03;          // wild tile (4-matches also make one)
  const GOLD_CHANCE = 0.04;          // coin tile
  const BURIED = 3;                  // hidden finds per board
  const DISCOVER_AFTER = 2, DISCOVER_CHANCE = 0.05;   // tracks / rune stone
  const EVENT_AFTER = 3, EVENT_CHANCE = 0.10;         // thief / runaway cart
  const points = len => (len >= 5 ? 3 : len === 4 ? 2 : 1);   // +1 on chain reactions

  const P = {
    stump:   { kind: 'stump',   label: '', mat: 'wood',     hp: 2, art: 'stump', toolOnly: 'axe' },
    thorn:   { kind: 'thorn',   label: '', mat: 'plant',    hp: 1, art: 'thorn', toolOnly: 'axe' },
    locked:  { kind: 'locked',  label: '', mat: 'iron',     hp: 1, lock: true, keyOnly: true, art: 'locked' },
    boulder: { kind: 'boulder', label: '', mat: 'stone',    hp: 3, art: 'boulder', toolOnly: 'pick' },
    vein:    { kind: 'vein',    label: '', mat: 'stone',    hp: 3, art: 'vein', toolOnly: 'pick' },
    thief:   { kind: 'thief',   label: '', mat: 'creature', hp: 1, art: 'thief' },
    cart:    { kind: 'cart',    label: '', mat: 'wood',     hp: 1, art: 'cart' },
    coral:   { kind: 'coral',   label: '', mat: 'stone',    hp: 2, art: 'coral', toolOnly: 'pick' },
    kelp:    { kind: 'kelp',    label: '', mat: 'plant',    hp: 1, art: 'kelp', toolOnly: 'axe' },
    haybale: { kind: 'haybale', label: '', mat: 'plant',    hp: 2, art: 'haybale', toolOnly: 'axe' },
    molehill:{ kind: 'molehill',label: '', mat: 'stone',    hp: 1, art: 'molehill', toolOnly: 'pick' },
    pig:     { kind: 'pig',     label: '', mat: 'creature', hp: 1, art: 'pig' },
    crab:    { kind: 'crab',    label: '', mat: 'creature', hp: 1, art: 'crab', kin: 'sea' },
    monster: { kind: 'monster', label: '', mat: 'creature', hp: 1 },
    tracks:  { kind: 'tracks',  label: '', mat: 'other',    hp: 1, art: 'tracks' },
    fairticket: { kind: 'fairticket', label: '', mat: 'other', hp: 1, art: 'fairticket' },
    rune:    { kind: 'rune',    label: '', mat: 'other',    hp: 1, art: 'rune' },
  };


  const LANDS = {
    forest: {
      name: 'Forest', icon: '🌲', music: 'forest',
      weights: { wood: 18, stone: 18, hide: 18, berries: 16, leaves: 30 },
      gives: { wood: 'wood', stone: 'stone', hide: 'hide', berries: 'food', gold: 'gold' },
      bag: ['wood', 'stone', 'hide', 'food', 'gold'],
      obstacles: n => [...Array.from({ length: n }, (_, i) => (i % 2 ? 'thorn' : 'stump')), ...(Math.random() < 0.4 ? ['locked'] : [])],
      grow: () => (Math.random() < 0.6 ? 'thorn' : 'stump'),
      growMsg: { thorn: '🌿 A thornbush sprouts up!', stump: '🌳 A tree falls — a new stump!' },
      event: { piece: 'thief', msg: '🏃 A goblin thief grabbed a sack and is running! Catch it →', loot: ['wood', 'stone', 'hide', 'food'] },
      discover: { piece: 'tracks', enemy: 'goblin', spot: '🐾 Fresh goblin tracks! Match next to them to follow.' },
      monster: { name: 'goblin raider', art: 'goblin', icon: `<span class="ico">${Art.piece('goblin')}</span>` },
      finds: 'forest',
      hint: 'Match 3+ to gather. Wield a wood-axe for stumps & thornbushes. Oak & rarer woods sparkle among the logs.',
    },
    mine: {
      name: 'Iron Hills', icon: '⛏️', music: 'mine',
      weights: { stone: 18, ore: 17, coal: 17, gravel: 26, bones: 22 },
      gives: { stone: 'stone', ore: 'iron', coal: 'coal', gold: 'gold' },
      bag: ['stone', 'iron', 'coal', 'gold'],
      obstacles: n => [...Array.from({ length: n }, (_, i) => (i % 2 ? 'vein' : 'boulder')), ...(Math.random() < 0.5 ? ['locked'] : [])],
      grow: () => (Math.random() < 0.7 ? 'boulder' : 'vein'),
      growMsg: { boulder: '🪨 Rocks tumble from the ceiling!', vein: '✨ A new ore vein glints in the wall!' },
      event: { piece: 'cart', msg: '⛏️ A runaway ore cart! Stop it before it rolls off →', loot: ['iron', 'coal', 'stone'] },
      discover: { piece: 'rune', enemy: 'dwarf', spot: 'ᚱ A cracked rune stone… match next to it to read it.' },
      monster: { name: 'cave goblin', art: 'gbrute', icon: '👹' },
      finds: 'mine',
      hint: 'Match ore for iron and coal. Wield a pick for boulders & veins. Silver glints in the ore, gems in the stone.',
    },
  };
  LANDS.ocean = {
    name: 'Sunlit Coast', icon: '🌊', music: 'ocean',
    weights: { water: 18, fish: 17, driftwood: 15, sand: 28, seaweed: 22 },
    gives: { water: 'water', fish: 'herring', driftwood: 'wood', gold: 'gold' },
    bag: ['water', 'herring', 'wood', 'gold'],
    obstacles: n => [...Array.from({ length: n }, (_, i) => (i % 2 ? 'kelp' : 'coral')), ...(Math.random() < 0.4 ? ['locked'] : [])],
    grow: () => (Math.random() < 0.5 ? 'coral' : 'kelp'),
    growMsg: { coral: '🪸 Coral grows over the rocks!', kelp: '🌿 A tangle of kelp washes ashore!' },
    event: { piece: 'crab', msg: '🦀 A giant crab snatched some loot! Only a weapon can stop it →', loot: ['water', 'herring', 'gold'] },
    discover: null,
    monster: { name: 'shore crab', art: 'crab', icon: '🦀', kin: 'sea', hpMul: 1.2 },
    finds: 'ocean',
    hint: 'Water quenches iron; fish feed your raids. Pick coral for coral, cut kelp for oysters. Pearls shimmer among the fish.',
  };
  // ---------- each land's own blocker (arrives at land Lv 5) ----------
  const BLOCKERS = {
    forest: { kind: 'vine', name: 'creeping vines', hp: 1, spreads: true, rows: [1, 6],
      intro: '🌿 New: <b>Creeping vines!</b> They choke a tile and spread every few moves. Match beside them to tear them out.' },
    mine: { kind: 'crystal', name: 'crystal clusters', hp: 2, spreads: false, rows: [1, 6], give: 'silver',
      intro: '💎 New: <b>Crystal clusters!</b> They take two matches beside them to shatter — and hide a little silver.' },
    farm: { kind: 'thistle', name: 'thistles', hp: 1, spreads: true, rows: [1, 6],
      intro: '🌱 New: <b>Thistles!</b> They choke the field and spread every few moves. Match beside them to pull them up.' },
    ocean: { kind: 'barnacle', name: 'barnacle rocks', hp: 1, spreads: true, rows: [4, 6], give: 'shell',
      intro: '🐚 New: <b>Barnacles!</b> They crust over the shore rows and spread with the tide. Match beside them to scrape them off.' },
  };
  const BLOCKER_LV = 5;
  const blockerCount = L => (L < BLOCKER_LV ? 0 : Math.min(7, 2 + Math.floor((L - BLOCKER_LV) / 6)));
  const spreadEvery = L => Math.max(3, 6 - Math.floor(L / 10));

  // ---------- trip goals: two per trip, 1-3 stars ----------
  const GOAL_RES = { farm: ['wheat', 'apple'], forest: ['wood', 'hide', 'food'], mine: ['iron', 'coal', 'stone'], ocean: ['herring', 'water', 'wood'] };
  const BREAK = { farm: ['haybale', 'molehill'], forest: ['stump', 'thorn'], mine: ['boulder', 'vein'], ocean: ['coral', 'kelp'] };
  const BREAK_NAME = { farm: 'hay bales or molehills', forest: 'stumps or thornbushes', mine: 'boulders or veins', ocean: 'coral or kelp' };
  const STAR_RARE = { farm: 'egg', forest: 'oak', mine: 'silver', ocean: 'pearl' };
  function makeGoals(L) {
    const res = pick(GOAL_RES[land.key]);
    const goals = [{ type: 'collect', key: res, need: Math.min(16, 6 + Math.floor(L / 4)), have: 0,
      text: n => `Gather ${n} ${label(res)}` }];
    const second = [
      { type: 'break', need: Math.min(4, 2 + Math.floor(L / 8)), have: 0, text: n => `Break ${n} ${BREAK_NAME[land.key]}` },
      { type: 'slay', need: Math.min(4, 1 + Math.floor(L / 8)), have: 0, text: n => `${land.monster.harmless ? 'Catch' : 'Defeat'} ${n} ${land.monster.name}${n > 1 ? 's' : ''}` },
    ];
    if (L >= BLOCKER_LV) second.push({ type: 'blocker', need: Math.min(8, 3 + Math.floor(L / 6)), have: 0, text: n => `Clear ${n} ${BLOCKERS[land.key].name}` });
    goals.push(pick(second));
    return goals;
  }
  function goalProgress(type, key, n = 1) {
    if (!run || !run.goals) return;
    run.goals.forEach(gl => {
      if (gl.type !== type || (gl.key && gl.key !== key) || gl.have >= gl.need) return;
      gl.have = Math.min(gl.need, gl.have + n);
      if (gl.have >= gl.need) {
        gl.doneAt = run.moves;
        board.toast(`🎯 Goal complete: ${gl.text(gl.need)}!`, 'win', 2000);
        Sound.sfx('rare');
      }
    });
    hudGoals();
  }
  const starsNow = () => {
    const done = run.goals.filter(x => x.have >= x.need);
    return done.length === 2 ? (done.every(x => x.doneAt >= 5) && !run.extraUsed ? 3 : 2) : done.length;
  };
  function hudGoals() {
    const el = document.getElementById('g-goals');
    if (!el || !run) return;
    el.innerHTML = '🎯 ' + run.goals.map(x => `<span class="gl${x.have >= x.need ? ' done' : ''}">${x.text(x.need)} <b>${x.have}/${x.need}</b></span>`).join('')
      + `<span class="gl-stars">${'★'.repeat(starsNow())}${'☆'.repeat(3 - starsNow())}</span>`;
  }

  function addBlocker(r, c, appear = false) {
    const B = BLOCKERS[land.key];
    return board.addPiece({ kind: B.kind, label: '', mat: 'other', hp: B.hp, art: B.kind }, r, c, 1, appear);
  }
  function blockerSpots() {
    const [lo, hi] = BLOCKERS[land.key].rows;
    return board.tileCells(r => r >= lo && r <= hi);
  }
  async function spreadBlockers() {
    const B = BLOCKERS[land.key];
    if (!B.spreads || run.landLv < BLOCKER_LV || ++run.sinceSpread < spreadEvery(run.landLv)) return;
    run.sinceSpread = 0;
    const have = board.piecesOf(B.kind);
    if (!have.length || have.length >= 10) return;
    const [lo, hi] = B.rows;
    const from = pick(have);
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [from.r + dr, from.c + dc])
      .filter(([r, c]) => r >= lo && r <= hi && c >= 0 && c < SIZE && board.isTile(board.grid[r][c]));
    if (!opts.length) return;
    const [r, c] = pick(opts);
    addBlocker(r, c, true);
    board.render();
    board.toast({ forest: '🌿 The vines creep further!', farm: '🌱 The thistles spread!', ocean: '🐚 The tide spreads the barnacles!' }[land.key], 'alert', 1400);
    await board.wait(300);
  }

  // The Golden Fields: a peaceful farm. Resources only — no boss, no raid.
  LANDS.farm = {
    name: 'Golden Fields', icon: '🌾', music: 'home',
    weights: { wheat: 22, apple: 18, hay: 32, clover: 28 },
    gives: { wheat: 'wheat', apple: 'apple', gold: 'gold' },
    bag: ['wheat', 'apple', 'meat', 'gold'],
    obstacles: n => [...Array.from({ length: n }, (_, i) => (i % 2 ? 'molehill' : 'haybale')), ...(Math.random() < 0.35 ? ['locked'] : [])],
    grow: () => (Math.random() < 0.5 ? 'haybale' : 'molehill'),
    growMsg: { haybale: '🌾 Another hay bale gets stacked in the field!', molehill: '🕳️ A mole pops up!' },
    event: { piece: 'pig', msg: '🐖 A pig broke out of its pen! Catch it before it bolts →', loot: ['meat', 'meat', 'apple'] },
    discover: null,
    monster: { name: 'chicken', art: 'chicken', icon: '🐔', harmless: true },
    finds: 'farm',
    hint: 'Wheat bakes bread; apples and chickens feed you. Chop hay bales with a wood-axe, dig molehills with a pick. Eggs hide in the hay.',
  };

  const TOOL_BONUS = { wood: 'hatchet', hide: 'knife' };

  let board = null;
  let run = null;
  let land = LANDS.forest;

  const label = t => Data.RESOURCES[t].label;
  const bagTotal = () => land.bag.reduce((s, t) => s + run.backpack[t], 0);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const has = k => App.state.inventory[k] > 0;
  const midOf = p => [p.r, p.c + Math.floor(p.w / 2)];

  const SCALES = ['stump', 'thorn', 'boulder', 'vein', 'coral', 'kelp', 'haybale', 'molehill'];
  function addObstacle(kind, r, c, appear = false) {
    const spec = { ...P[kind] };
    if (SCALES.includes(kind)) spec.hp += run.lv.hpBonus;
    // Tougher stumps and richer veins appear as the land levels up (they need better tools).
    const L = run.landLv, roll2 = Math.random();
    if (kind === 'stump') {
      const t = L >= 12 && roll2 < 0.25 ? 3 : L >= 10 && roll2 < 0.5 ? 2 : L >= 6 && roll2 < 0.15 ? 2 : 1;
      // Ironwood stumps are tough but an iron wood-axe can fell them (no steel needed to get started on steel).
      Object.assign(spec, { hard: Math.min(t, 2), wood: ['wood', 'oak', 'ironwood'][t - 1], art: ['stump', 'stumpoak', 'stumpiron'][t - 1] });
    }
    if (kind === 'vein') {
      const t = L >= 25 && roll2 < 0.25 ? 3 : L >= 10 && roll2 < 0.45 ? 2 : L >= 6 && roll2 < 0.1 ? 2 : 1;
      Object.assign(spec, { hard: t, ore: ['iron', 'silver', 'starsilver'][t - 1], art: ['vein', 'veinsilver', 'veinstar'][t - 1] });
    }
    if (kind === 'locked') {
      // Higher land levels bring gold and crystal chests.
      const L = run.landLv, roll = Math.random();
      spec.lockTier = L >= 20 && roll < 0.3 ? 3 : L >= 10 && roll < 0.55 ? 2 : 1;
      spec.art = ['locked', 'lockedgold', 'lockedcrystal'][spec.lockTier - 1];
    }
    return board.addPiece(spec, r, c, 1, appear);
  }
  function xp(n, why) {
    const lv = App.addXP(n);
    run.xp += n;
    hudLevel();
    if (lv) board.renderHealth(true);   // the level-up card (shown by App) also restores your health
  }
  function hudLevel() {
    const st = App.state, L = App.level;
    const a = Data.xpForLevel(L), b = Data.xpForLevel(L + 1);
    document.getElementById('g-level').innerHTML = `⭐ ${L} <span class="xpbar"><i style="width:${Math.round((st.xp - a) / (b - a) * 100)}%"></i></span> · ${land.icon} Lv ${run.landLv}`;
  }

  const needsKey = () => board.piecesOf('locked').length > 0 && App.state.inventory.key < 1;

  function randType() {
    const roll = Math.random();
    if (roll < STAR_CHANCE) return 'star';
    if (roll < STAR_CHANCE + GOLD_CHANCE) return 'gold';
    const W = land.weights;
    const total = Object.values(W).reduce((a, b) => a + b, 0);
    let x = Math.random() * total, type = Object.keys(W)[0];
    for (const [t, w] of Object.entries(W)) if ((x -= w) < 0) { type = t; break; }
    // Rarer woods / ores sprinkle in, more often as the land levels up.
    if (run) {
      let y = Math.random() * 100 / (App.state.inventory.horseshoe ? 1.15 : 1);   // Golden Horseshoe: rares 15% more often
      for (const [rare, fam] of Object.entries(Data.FAMILY)) {
        if (fam !== type || (Data.RARE_LAND[rare] && Data.RARE_LAND[rare] !== land.key)) continue;
        if ((y -= Data.RARE[rare](run.landLv)) < 0) return rare;
      }
    }
    return type;
  }

  // ---------- backpack ----------
  function addToBackpack(type, n, cell, delay = 0) {
    goalProgress('collect', type, n);
    if (!(type in run.backpack)) { run.extra[type] = (run.extra[type] || 0) + n; App.state.stockpile[type] += n; App.save(); board.float(cell, `+${n} ${label(type)}`, 'gain', delay); return; }
    const add = Math.min(n, run.cap - used());
    if (add > 0) {
      run.backpack[type] += add;
      board.float(cell, `+${add} ${label(type)}`, type === 'gold' ? 'gold' : 'gain', delay);
    }
    if (add < n) {
      run.overflow += n - add;
      if (add === 0) board.float(cell, 'Full!', 'loss', delay);
    }
    if (used() >= run.cap && !run.fullWarned) {
      run.fullWarned = true;
      board.toast('Backpack full! Head home when you\'re ready.', 'win', 2600);
    }
    hud();
  }

  // ---------- finds ----------
  function applyFind(id, cell, delay = 0) {
    const info = Data.FIND_INFO[id];
    const st = App.state;
    let detail = '';
    switch (id) {
      case 'cache': for (let i = 0; i < 3; i++) addToBackpack(pick(['wood', 'stone', 'hide']), 1, cell, delay + i * 200); break;
      case 'basket': addToBackpack(land.key === 'ocean' ? 'herring' : land.key === 'farm' ? 'apple' : 'food', 3, cell, delay); break;
      case 'sack': addToBackpack('wheat', 4, cell, delay); break;
      case 'eggs': addToBackpack('egg', 3, cell, delay); break;
      case 'orepocket': addToBackpack('iron', 3, cell, delay); break;
      case 'coalseam': addToBackpack('coal', 3, cell, delay); break;
      case 'nugget': addToBackpack('gold', 3, cell, delay); break;
      case 'pearl': addToBackpack('pearl', 1, cell, delay); addToBackpack('gold', 2, cell, delay + 200); discoverMaterial('pearl', cell); break;
      case 'barrel': addToBackpack('water', 3, cell, delay); break;
      case 'lostclub': App.addGear('baxe1'); break;
      case 'sling': App.addGear('bow1'); break;
      case 'key': st.inventory.key++; break;
      case 'chart': detail = App.grantChart(); break;
      case 'page': { const n = Lore.findPage(); detail = n ? `Page ${n} of the Old King's diary — read it when you get home.` : ''; break; }
      case 'runescrap':
      case 'scrap': {
        const enemy = id === 'runescrap' ? 'dwarf' : 'goblin';
        st.scraps[enemy]++;
        detail = `${st.scraps[enemy]}/3 to a hidden ${enemy === 'dwarf' ? 'dwarf cache' : 'goblin stash'}`;
        if (st.scraps[enemy] >= 3) {   // a full map leads to their loot, not a new keep (keeps come every 5 land levels)
          st.scraps[enemy] -= 3;
          const spoil = App.rollSpoil(enemy);
          App.grantSpoil(spoil);
          addToBackpack('gold', 10, cell, delay + 200);
          detail = `map complete — you dig up their stash: 10 gold + ${App.spoilName(spoil)}!`;
        }
        break;
      }
      default: break;
    }
    App.save();
    run.finds.push(`${info.icon} ${info.name}`);
    if (id === 'key' && board.piecesOf('locked').some(c => c.lockTier === 1)) detail = 'Now tap 🗝️ Old key, then the locked chest!';
    board.celebrate(cell, { icon: info.art ? Art.any(info.art) : info.icon, title: `${info.name}!`, sub: detail || info.desc, rare: id === 'shard' || id === 'chart' });
    xp(Data.XP.find);
    board.renderWeapons();
    board.renderPieces();
  }

  // Backpack slots in use: what you've gathered plus the food you packed at camp.
  const used = () => bagTotal() + App.pouchTotal();

  // ---------- HUD ----------
  function hud() {
    document.getElementById('g-moves').textContent = run.moves;
    document.querySelector('#screen-gather .moves').classList.toggle('low', run.moves <= 5);
    document.getElementById('bp-total').textContent = used();
    document.getElementById('bp-drawer').classList.toggle('full', used() >= run.cap);
    document.getElementById('bp-fill').style.width = Math.min(100, used() / run.cap * 100) + '%';
    if (packOpen) renderPack();
    document.getElementById('g-exit').classList.toggle('glow', run.fullWarned);
    const keyHere = [...board.buried.values()].includes('key');
    const chest = board.piecesOf('locked')[0];
    const canOpen = chest && ['key', 'goldkey', 'crystalkey'].some(k => App.state.inventory[k] > 0 && Data.WEAPONS[k].unlock >= chest.lockTier);
    document.getElementById('g-finds').textContent = `🔍 ${board.buried.size} buried` +
      (chest ? (canOpen ? ' · 🔑 can open!' : chest.lockTier > 1 ? ` · 🔒 ${Data.CHEST_TIERS[chest.lockTier]} key` : keyHere ? ' · 🔒 key buried' : '') : '');
    const ev = run.eventPiece && !run.eventPiece.gone;
    document.getElementById('gather-hint').textContent = board.armedHint() ||
      (ev ? ({ forest: 'Catch the thief: only a weapon can stop it!', mine: 'Stop the cart: match next to it or hit it!', ocean: 'Stop the crab: only a weapon can!', farm: 'Catch the pig before it bolts!' }[land.key])
        : land.discover && board.piecesOf(land.discover.piece).length ? land.discover.spot : land.hint);
  }

  function buildBackpack() {
    document.getElementById('bp-cap').textContent = `/${Data.backpackSize(App.level)}`;
    setPack(packOpen);
    document.getElementById('bp-btn').onclick = () => { setPack(!packOpen); };
  }
  // The backpack drawer under the board: open or closed (remembered on this device).
  let packOpen = (() => { try { return localStorage.getItem('rr-pack-open') !== '0'; } catch (e) { return true; } })();
  function setPack(open) {
    packOpen = open;
    try { localStorage.setItem('rr-pack-open', open ? '1' : '0'); } catch (e) { /* ignore */ }
    document.getElementById('bp-drawer').classList.toggle('open', open);
    document.getElementById('bp-chev').textContent = open ? '▾' : '▴';
    if (open && run) renderPack();
  }

  // The backpack, opened over the board.
  const TILE_OF = { apple: 'apple', wheat: 'wheat', meat: 'meat', herring: 'fish', wood: 'wood', stone: 'stone', hide: 'hide', food: 'berries', gold: 'gold', iron: 'ore', coal: 'coal', water: 'water' };
  // Everything you've picked up this trip, one stack per kind.
  function renderPack() {
    const stack = (t, n, extra) => `<div class="bp-stack${extra ? ' sent' : ''}" title="${label(t)}"><span class="gem art g-${TILE_OF[t] || t}">${Art.tile(TILE_OF[t] || t)}</span><b>${n}</b><small>${label(t)}</small></div>`;
    const bag = land.bag.filter(t => run.backpack[t] > 0).map(t => stack(t, run.backpack[t]));
    const extra = Object.entries(run.extra || {}).filter(([, n]) => n > 0).map(([t, n]) => stack(t, n, true));
    const food = App.pouchList().map(k => `<div class="bp-stack packed" title="${App.foodName(k)}">${Data.ITEMS[k] ? `<span class="wicon">${Data.ITEMS[k].art ? Art.piece(Data.ITEMS[k].art) : Data.ITEMS[k].icon}</span>` : `<span class="gem art g-${TILE_OF[k] || k}">${Art.tile(TILE_OF[k] || k)}</span>`}<b>${App.pouch()[k]}</b><small>${App.foodName(k)}</small></div>`);
    document.getElementById('bp-pop').innerHTML = (bag.length || extra.length || food.length)
      ? `<div class="bp-stacks">${food.join('')}${bag.join('')}${extra.join('')}</div>${run.overflow ? `<p class="bp-note">${run.overflow} more didn't fit.</p>` : ''}`
      : '<p class="bp-note">Empty — make matches to fill it.</p>';
  }

  // First time you collect a rare material: a big reveal explaining what it's for.
  function discoverMaterial(type, cell) {
    const st = App.state;
    if (st.seen[type]) return;
    st.seen[type] = true;
    App.save();
    board.celebrate(cell, { icon: Art.tile(type), title: `${Data.RESOURCES[type].label} discovered!`, sub: Data.RARE_INFO[type].use, rare: true, kicker: '✦ New material ✦' });
  }

  // ---------- roaming monsters ----------
  // A new enemy keep waits to be found at every 5th land level (Lv 5, 10, 15 …), one at a time.
  const keepWaiting = (enemy, L) => Math.floor(L / 5) > App.state.enemyWins[enemy] + App.state.marked[enemy];
  const DWARF = { name: 'dwarf guard', art: 'guard', icon: '⚒️', hpMul: 1.35 };
  function spawnMonster(appear = true) {
    const spots = board.tileCells(r => r >= 1);
    if (!spots.length) return null;
    const [r, c] = pick(spots), plan = run.mon;
    // Deeper in the Iron Hills, dwarf guards patrol alongside the cave goblins.
    const M = land.key === 'mine' && run.landLv >= 8 && Math.random() < 0.5 ? DWARF : land.monster;
    const carries = run.keyCarrier && !board.piecesOf('monster').some(x => x.carriesKey);
    if (carries) run.keyCarrier = false;
    const hp = M.harmless ? 3 + Math.floor(run.landLv / 6) : Math.round(plan.hp * (M.hpMul || 1));
    const p = board.addPiece({ ...P.monster, hp, armor: M.harmless ? 1 : plan.armor, weapon: plan.weapon, art: M.art, kin: M.kin, name: M.name, age: 1, carriesKey: carries }, r, c, 1, appear);
    monLabel(p);
    if (carries && appear) setTimeout(() => board.toast(`🗝️ That ${M.name} has the chest key! Take it down.`, 'alert', 2600), 1500);
    if (appear) {
      board.render();
      if (!run.told.monster) {
        run.told.monster = true;
        board.toast(`${M.icon} A ${M.name} appears! It blocks the board and will pick your pack — tap it to swing (costs ⚡).`, 'alert', 3200);
      } else board.toast(`${M.icon} Another ${M.name}!`, 'alert', 1400);
    }
    return p;
  }
  // What each land's monsters carry: scrap iron (goblins), gems & rune scraps (cave goblins), shells & pearls (crabs).
  function monsterDrops(p, cell) {
    const M = land.monster, got = [];
    App.bountyEvent(`kill:${land.key}`);
    const name = M.name[0].toUpperCase() + M.name.slice(1);
    const gain = (t, n, d) => { addToBackpack(t, n, cell, d); got.push(`${n} ${label(t)}`); };
    if (land.key === 'farm') { gain('meat', 1 + Math.floor(Math.random() * 2), 0); if (Math.random() < 0.3) gain('egg', 1, 200); }
    else if (land.key === 'ocean') { gain('shell', 1 + Math.floor(Math.random() * 2), 0); if (Math.random() < 0.12) gain('pearl', 1, 200); }
    else gain('scrapiron', 1 + Math.floor(Math.random() * 2) + (p.armor >= 2 ? 1 : 0), 0);
    if (land.key === 'mine' && Math.random() < 0.2) {
      const gem = Data.rollFrom([['emerald', 6], ['sapphire', 3], ['ruby', run.landLv >= 12 ? 2 : 0]]);
      gain(gem, 1, 250); discoverMaterial(gem, cell);
    }
    board.toast(`${M.icon} ${name} ${M.harmless ? 'caught' : 'defeated'}! ${M.harmless ? 'You get' : 'It dropped'} ${got.join(' & ')}.`, 'win');
    if (p.carriesKey) applyFind('key', cell, 300);
    else if ((land.key === 'forest' || land.key === 'mine') && Math.random() < (land.key === 'forest' ? 0.25 : 0.15)) applyFind(land.key === 'mine' ? 'runescrap' : 'scrap', cell, 300);
    if (land.key === 'forest' || land.key === 'mine') discoverMaterial('scrapiron', cell);
  }

  // Out of health: you stagger home, dropping half of what you carried.
  function collapse() {
    if (run.ended) return;
    land.bag.forEach(t => { run.lost = (run.lost || 0) + Math.ceil(run.backpack[t] / 2); run.backpack[t] = Math.floor(run.backpack[t] / 2); });
    finish('collapse');
  }

  // Each monster wears a countdown: ⚔️2 = it strikes you in 2 moves.
  function monLabel(m) {
    if (land.monster.harmless) { m.label = m.carriesKey ? '🗝️' : ''; m.cls = ''; return; }
    const left = run.mon.attackEvery - (m.age % run.mon.attackEvery);
    m.label = `${m.carriesKey ? '🗝️' : ''}⚔️${left}`;
    m.cls = left === 1 ? 'readying' : '';
  }

  async function monstersAct() {
    const mons = board.piecesOf('monster');
    let stole = 0;
    for (const m of mons) {
      m.age++;
      // Wander to a neighbouring tile now and then.
      if (Math.random() < 0.5) {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [m.r + dr, m.c + dc])
          .filter(([r, c]) => r >= 1 && r < SIZE && c >= 0 && c < SIZE && board.isTile(board.grid[r][c]));
        if (opts.length) { const [r, c] = pick(opts); board.movePiece(m, r, c); }
      }
      // Chickens don't fight back — they wander off after a while.
      if (land.monster.harmless) {
        if (m.age >= 9 && !m.carriesKey) { board.removePiece(m, 'fog-out'); board.float([m.r, m.c], 'flapped off!', 'loss'); }
        continue;
      }
      // Every few moves, each one swings at you.
      if (m.age % run.mon.attackEvery === 0) {
        const hit = App.hurtPlayer(m.weapon || 1, run.mon.extra || 0);
        board.float([m.r, m.c], hit.asleep ? '💤' : hit.dmg ? `⚔️ −${hit.dmg} ❤️` : '🛡️ blocked', hit.dmg ? 'loss' : 'gain');
        stole += hit.dmg;
        if (!run.told.armorNote && hit.note) { run.told.armorNote = true; setTimeout(() => board.toast(`🛡️ ${hit.note[0].toUpperCase() + hit.note.slice(1)}.`, '', 2000), 700); }
        if (hit.down) break;
      }
      monLabel(m);
    }
    if (stole) {
      const wrap = document.getElementById('gather-wrap');
      wrap.classList.remove('ouch'); void wrap.offsetWidth; wrap.classList.add('ouch');
      board.toast(`💢 −${stole} ❤️ — ${App.state.hp}/${App.maxHp} left`, 'alert', 1600);
      board.renderHealth(true);
      Sound.sfx('slash');
      if (!run.told.attack) { run.told.attack = true; setTimeout(() => board.toast(`${land.monster.icon} Monsters strike when their ⚔️ countdown hits zero! Kill them first — or eat 🍖 to heal.`, 'alert', 3200), 1700); }
    }
    if (App.state.hp <= 0) { await board.wait(500); collapse(); return; }
    // More arrive as the land grows wilder.
    if (++run.sinceMon >= run.mon.every && mons.length < run.mon.max) {
      run.sinceMon = 0;
      spawnMonster(true);
      Sound.sfx('drums');
      await board.wait(350);
    }
    if (mons.length) board.render();
  }

  // ---------- events ----------
  function spawnOn(kind, filter, msg, kindOfToast = 'alert') {
    const spots = board.tileCells(filter);
    if (!spots.length) return null;
    const [r, c] = pick(spots);
    const spec = { ...P[kind] };
    if (spec.mat === 'creature') Object.assign(spec, { hp: 5 + Math.floor(run.landLv / 3), armor: Data.landEra(run.landLv) });
    const p = board.addPiece(spec, r, c, 1, true);
    board.render();
    board.toast(msg, kindOfToast, 2600);
    return p;
  }

  async function discover() {
    const enemy = land.discover.enemy;
    const cfg = Battle.CONFIG[enemy];
    Sound.sfx('reveal');
    board.smoke();
    board.toast(cfg.foundBanner, 'alert', 2200);
    await board.wait(1400);
    const canRaid = App.state.hp > 0;
    const choice = await App.choose({
      title: `${cfg.icon} ${cfg.foundTitle}`,
      html: `<p>${cfg.foundText}</p>
             <p>${App.pouchLine()}</p>`,
      buttons: [
        { id: 'raid', label: '⚔️ Raid now', cls: 'danger', disabled: !canRaid },
        { id: 'mark', label: '📍 Mark it on the map' },
        { id: 'ignore', label: 'Keep gathering', cls: 'alt' },
      ],
    });
    if (choice === 'raid') {
      finish('raid');
    } else if (choice === 'mark') {
      App.state.marked[enemy]++;
      App.save();
      run.marked = true;
      board.toast('📍 Marked on your map. Raid it from home.', 'win');
    }
  }

  async function moveEvent() {
    const p = run.eventPiece;
    if (!p || p.gone) return;
    if (p.c + 1 >= SIZE) {
      board.removePiece(p, 'fog-out');
      board.toast({ forest: 'The thief got away with the sack!', mine: 'The cart rolled off down the tunnel…', ocean: 'The crab scuttled into the sea!', farm: 'The pig bolted into the hedgerow!' }[land.key], 'alert');
      run.eventPiece = null;
      Sound.sfx('nope');
      return;
    }
    if (!board.movePiece(p, p.r, p.c + 1)) {
      // Blocked — try to slip diagonally.
      const opts = [p.r - 1, p.r + 1].filter(r => r >= 0 && r < SIZE && board.isTile(board.grid[r][p.c + 1]));
      if (opts.length) board.movePiece(p, pick(opts), p.c + 1);
    }
    Sound.sfx('swap');
    await board.wait(250);
  }

  // ---------- board hooks ----------
  const hooks = {
    canPlay: () => !!run && !run.ended && run.moves > 0,
    onMove: () => { run.moves--; run.movesMade++; hud(); coach('move'); },
    onAte: () => hud(),
    onMatch(runs, step) {
      coach('match');
      for (const ri of runs) {
        const res = land.gives[ri.type];
        if (!res) {   // filler tiles — but a rare one hidden among them (eggs in the hay) still counts
          ri.cells.forEach(([r, c]) => { const t = board.grid[r][c]; if (t && Data.FAMILY[t.type]) { addToBackpack(t.type, 1, [r, c], 150); discoverMaterial(t.type, [r, c]); } });
          continue;
        }
        if (res === 'gold') Sound.sfx('coin');
        let n = points(ri.cells.length) + (step > 1 ? 1 : 0);
        if (TOOL_BONUS[res] && has(TOOL_BONUS[res])) n += 1;
        addToBackpack(res, n, ri.cells[Math.floor(ri.cells.length / 2)]);
        xp(Data.XP.match);
        // Each rare wood / ore tile in the match gives one of that material.
        ri.cells.forEach(([r, c]) => {
          const t = board.grid[r][c];
          if (!t || !Data.FAMILY[t.type]) return;
          addToBackpack(t.type, 1, [r, c], 150);
          discoverMaterial(t.type, [r, c]);
        });
      }
    },
    onPieceHit(p, n, src, w) {
      if (src !== 'match') coach('swing');
      const dmg = src === 'match' ? n * Data.matchDamage(p) : n;
      if (dmg <= 0) {
        const tip = p.toolOnly === 'axe' ? '🪓 Matches can\'t clear that — wield a wood-axe (🛠️ slot) and tap it.'
          : p.toolOnly === 'pick' ? '⛏️ Matches can\'t break rock — wield a pick (🛠️ slot) and tap it.'
          : p.mat === 'creature' ? `⚔️ Matches alone can't stop the ${p.kind} — wield a weapon strong enough for it.`
          : (p.lockTier || 1) > 1 ? `🔒 A ${Data.CHEST_TIERS[p.lockTier]} chest — bring a ${Data.CHEST_TIERS[p.lockTier]} key (upgrade keys in the Workshop).`
          : '🔒 Locked tight! Its key is buried somewhere on this board — dig it up.';
        if (!run.told[p.toolOnly || p.kind]) { run.told[p.toolOnly || p.kind] = true; board.toast(tip, '', 3000); }
        return;
      }
      const cell = midOf(p);
      if (p.kind === 'vein') {
        const mined = (Math.ceil(p.hp) - Math.ceil(Math.max(0, p.hp - dmg))) * ((Data.ITEMS[w]?.tier || 1) >= 2 ? 2 : 1);
        if (mined > 0) addToBackpack(p.ore || 'iron', mined, cell);
        if (p.ore && p.ore !== 'iron') discoverMaterial(p.ore, cell);
      }
      if (!board.hurt(p, dmg)) return;
      if (BREAK[land.key].includes(p.kind)) goalProgress('break');
      if (p.kind === 'monster') { goalProgress('slay'); if (land.key === 'forest') Story.countUp('goblins'); }
      if (p.kind === BLOCKERS[land.key].kind) {
        goalProgress('blocker');
        const B = BLOCKERS[land.key];
        if (B.give && Math.random() < (B.give === 'silver' ? 0.6 : 0.35)) addToBackpack(B.give, 1, cell);
      }
      xp(p.kind === 'monster' ? Data.XP.monster : p.kind === 'thief' || p.kind === 'cart' || p.kind === 'crab' ? Data.XP.chase : p.kind === 'tracks' || p.kind === 'rune' ? Data.XP.discover : Data.XP.obstacle);
      switch (p.kind) {
        case 'stump':
          {
            const big = (Data.ITEMS[w]?.tier || 1) >= 2, wood = p.wood || 'wood';
            addToBackpack(wood, big ? 5 : 3, cell);
            board.toast(`🪓 ${big ? 'Clean chop' : 'Stump chopped'}! +${big ? 5 : 3} ${Data.RESOURCES[wood].label}`);
            if (wood !== 'wood') discoverMaterial(wood, cell);
          }
          break;
        case 'fairticket':
          Fair.earn(1);
          run.finds.push('🎟️ A golden fair ticket — play it at the Harvest Fair!');
          board.toast('🎟️ Golden ticket! Play it at the 🎪 Harvest Fair.', 'win', 2400);
          Sound.sfx('rare');
          break;
        case 'thorn':
        case 'kelp': applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 150); break;
        case 'coral':
          {
            const n = (Data.ITEMS[w]?.tier || 1) >= 2 ? 3 : 2;
            addToBackpack('coral', n, cell);
            board.toast(`🪸 Coral cracked! +${n} coral`);
            discoverMaterial('coral', cell);
          }
          if (Math.random() < 0.3) applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 300);
          break;
        case 'haybale': addToBackpack('wheat', 3, cell); board.toast('🌾 Hay bale chopped! +3 wheat'); break;
        case 'molehill':
          addToBackpack('apple', 1, cell);
          if (Math.random() < 0.45) applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 300);
          break;
        case 'boulder':
          addToBackpack('stone', 2, cell);
          if (Math.random() < 0.35) applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 300);
          break;
        case 'vein': board.toast('Vein mined out!'); break;
        case 'locked': {
          Story.flag('chest');
          const t = p.lockTier || 1;
          addToBackpack('gold', [6, 12, 20][t - 1], cell);
          board.toast(`🔓 The ${Data.CHEST_TIERS[t].toLowerCase()} chest creaks open!`, 'win');
          applyFind(Data.rollFrom([['nugget', 45], ['sling', 20], [land.discover ? 'scrap' : 'pearl', 20], ['lostclub', 15]]), cell);
          if (t >= 2) applyFind(t === 3 ? 'nugget' : Data.rollFrom([['nugget', 50], ['key', 50]]), cell);
          if (Math.random() < (t === 3 ? 0.35 : t === 2 ? 0.08 : 0)) applyFind('chart', cell);
          if (t === 3) {
            const k = App.rollSpoil(Math.random() < 0.5 ? 'goblin' : 'dwarf');
            board.celebrate(cell, { icon: '💠', title: App.grantSpoil(k), sub: 'From the crystal chest!', rare: true });
          }
          break;
        }
        case 'pig':
        case 'thief':
        case 'crab':
        case 'cart':
          for (let i = 0; i < 4; i++) addToBackpack(pick(land.event.loot), 1, cell, i * 180);
          board.toast({ thief: 'Caught the thief! You take the sack.', cart: 'Cart stopped! You grab the ore.', crab: 'Crab defeated! You take its haul.', pig: 'Pig caught! Fresh meat for the larder.' }[p.kind], 'win');
          if (needsKey() && Math.random() < 0.6) applyFind('key', cell);
          else if (Math.random() < 0.35) applyFind(pick(['lostclub', 'sling', 'scrap']), cell);
          run.eventPiece = null;
          Sound.sfx('victory');
          break;
        case 'monster': {
          run.slain++;
          monsterDrops(p, cell);
          break;
        }
        case 'tracks':
        case 'rune': run.followed = true; break;
        default: break;
      }
      hud();
    },
    onFind(id, cell) { applyFind(id, cell); },
    onPieceTap(p) {
      const msg = {
        stump: `${Data.RESOURCES[p.wood || 'wood'].label} stump (${p.hp} HP, hardness ${p.hard || 1}). Needs a ${Data.TIER_LABEL[p.hard || 1]}+ wood-axe.`,
        thorn: `Thornbush (${p.hp} HP) — something's inside! Only an axe can cut it.`,
        locked: (p.lockTier || 1) > 1
          ? `${Data.CHEST_TIERS[p.lockTier]} chest — needs a ${Data.CHEST_TIERS[p.lockTier]} key or better. Upgrade keys in the Workshop.`
          : App.state.inventory.key > 0 ? 'Bronze chest — tap 🗝️ Old key, then tap the chest!' : 'Bronze chest. Its key is buried somewhere on this board — clear tiles to dig it up.',
        boulder: `Boulder (${p.hp} HP). Only a pickaxe can break it. Sometimes hides a find.`,
        vein: `${Data.RESOURCES[p.ore || 'iron'].label} vein (hardness ${p.hard || 1}). Needs a ${Data.TIER_LABEL[p.hard || 1]}+ pick. Every hit gives ore.`,
        thief: 'A goblin thief! Only a weapon can stop it — Club, Sling, Sword… before it escapes!',
        cart: 'A runaway cart full of ore! Stop it before it rolls off.',
        tracks: 'Goblin tracks — match next to them to follow.',
        fairticket: 'A golden fair ticket! Match right next to it to grab it.',
        rune: 'A cracked rune stone — match next to it to read it.',
        coral: `Coral (${p.hp} HP). Only a pick can break it — gives coral for sea gear, sometimes an oyster.`,
        kelp: `Kelp tangle (${p.hp} HP) — something's caught in it! Only an axe can cut it.`,
        haybale: `Hay bale (${p.hp} HP). Chop it with a wood-axe for wheat.`,
        molehill: 'A molehill. Dig it with a pick — moles bury all sorts of things.',
        thistle: 'Thistles — they spread every few moves. Match beside them to pull them up.',
        pig: 'A runaway pig! Catch it with a weapon before it bolts off the board.',
        vine: 'Creeping vines — they spread every few moves. Match beside them to tear them out.',
        crystal: `Crystal cluster (${p.hp} HP) — match beside it to chip it. It hides silver.`,
        barnacle: 'Barnacles crusting the shore — they spread with the tide. Match beside them to scrape them off.',
        crab: 'A giant crab with stolen loot! Only a weapon can stop it before it reaches the sea. Coral spears hit it extra hard.',
      }[p.kind];
      board.toast(msg || 'Match next to it.', '', 2800);
    },
    onArm: () => hud(),
    async afterAction(wasMove) {
      if (run.followed && !run.discovered) {
        run.discovered = true;
        await discover();
        if (run.ended) return;
      }
      if (wasMove) {
        await moveEvent();
        await monstersAct();
        if (run.ended) return;
        await spreadBlockers();
        if (!run.eventSpawned && run.movesMade >= EVENT_AFTER && Math.random() < EVENT_CHANCE) {
          run.eventSpawned = true;
          run.eventPiece = spawnOn(land.event.piece, (r, c) => c === 0 && r >= 1, land.event.msg);
        }
        if (run.lv.growEvery && ++run.sinceGrow >= run.lv.growEvery) {
          run.sinceGrow = 0;
          const n = board.pieces.filter(x => SCALES.includes(x.kind)).length;
          const spots = board.tileCells(r => r >= 1);
          if (n < 12 && spots.length) {
            const kind = land.grow();
            const [r, c] = pick(spots);
            addObstacle(kind, r, c, true);
            board.render();
            board.toast(land.growMsg[kind], 'alert');
            Sound.sfx(kind === 'boulder' ? 'break' : 'reveal');
            await board.wait(450);
          }
        }
        // About one trip in three, a golden fair ticket blows onto the board.
        if (run.ticketAt && !run.ticketSpawned && run.movesMade >= run.ticketAt) {
          run.ticketSpawned = true;
          spawnOn('fairticket', (r, c) => r >= 1 && r <= 5, '🎟️ A golden fair ticket blew in! Match next to it to grab it.', 'win');
        }
        // Every 5 land levels a new enemy keep can be found: its tracks (or rune stone) turn up on the next trip.
        if (land.discover && !run.discoverSpawned && run.movesMade >= DISCOVER_AFTER && keepWaiting(land.discover.enemy, run.landLv)) {
          run.discoverSpawned = true;
          spawnOn(land.discover.piece, (r, c) => r >= 1 && r <= 4 && c >= 1 && c <= 5, land.discover.spot);
        }
        await board.ensurePlayable();
      }
      hud();
      if (run.moves <= 0 && !run.ended) {
        await board.wait(500);
        if (await offerMore()) hud();
        else finish('moves');
      }
    },
  };

  // ---------- one more go? ----------
  // Out of moves with a goal almost done: offer 5 more (the first each day is free).
  async function offerMore() {
    if (run.extraUsed || run.ended) return false;
    const left = run.goals.filter(g => g.have < g.need);
    if (!left.length || !left.every(g => g.need - g.have <= Math.max(2, Math.ceil(g.need * 0.3)))) return false;
    const today = new Date().toDateString(), free = App.state.freeMoves !== today;
    const cost = 10 + run.landLv, gold = App.state.stockpile.gold;
    if (!free && gold < cost) return false;
    run.extraUsed = true;
    const c = await App.choose({
      title: 'So close!',
      html: `<div class="trip-goals">${left.map(g => `<div>○ ${g.text(g.need)} <b>${g.have}/${g.need}</b> — just ${g.need - g.have} to go</div>`).join('')}</div>
        <p>Keep going with <b>5 more moves</b>?</p>${free ? '<p class="reward">Your first one today is free!</p>' : `<p class="hint">You have ${gold} gold.</p>`}`,
      buttons: [{ id: 'more', label: free ? '+5 moves — free' : `+5 moves — ${cost} gold` }, { id: 'home', label: 'Head home', cls: 'alt' }],
    });
    if (c !== 'more') return false;
    if (free) App.state.freeMoves = today; else App.state.stockpile.gold -= cost;
    run.moves += 5;
    App.save();
    Sound.sfx('coin');
    board.toast('+5 moves — finish it!', 'win', 1600);
    board.scheduleHint();
    return true;
  }

  // ---------- first-trip coaching ----------
  const COACH = [
    { text: '<b>Swap two touching tiles</b> to line up 3 or more of a kind. Try the glowing pair on the board!', until: 'match' },
    { text: 'Matches fill your <b>backpack</b> and charge your <b>⚡ energy</b>. With enough energy, <b>tap a stump</b> to chop it with your axe — or tap a goblin to fight it.', until: 'swing', moves: 8 },
    { text: 'Meet the <b>🎯 goals</b> at the top for stars and rewards. Tap <b>Head home</b> any time — everything in your backpack goes to your Storehouse.', until: 'none', moves: 5 },
  ];
  function coach(ev) {
    const s = App.state;
    if (!run || s.tut == null || s.tut >= COACH.length || land.key !== 'forest') return;
    if (ev === 'start') { run.coachAt = run.movesMade; showCoach(); return; }
    const step = COACH[s.tut];
    if (ev === step.until || ev === 'ok' || (ev === 'move' && step.moves && run.movesMade - run.coachAt >= step.moves)) {
      s.tut++;
      App.save();
      run.coachAt = run.movesMade;
      showCoach();
    }
  }
  function showCoach() {
    const el = document.getElementById('coach'), step = run && !run.ended && land.key === 'forest' && COACH[App.state.tut];
    if (!step) { el.classList.add('hidden'); return; }
    el.innerHTML = `<span class="coach-n">${App.state.tut + 1}/${COACH.length}</span><p>${step.text}</p><button class="small" id="coach-ok">Got it</button>`;
    el.classList.remove('hidden');
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    document.getElementById('coach-ok').onclick = () => coach('ok');
    if (App.state.tut === 0) board.scheduleHint(600);
  }

  // ---------- end of run ----------
  const tripReward = r => (r.stars ? `<p class="reward">Goal reward: ${[
    `${5 + Math.floor(r.landLv / 2)} gold`, r.stars >= 2 ? `${15 + r.landLv * 2} XP` : '', r.stars >= 3 ? `reward chest (10 gold + 2 ${Data.RESOURCES[STAR_RARE[land.key]].label})` : ''].filter(Boolean).join(' · ')}</p>` : '<p class="hint">No goals met this time.</p>');
  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    showCoach();
    land.bag.forEach(t => { App.state.stockpile[t] += run.backpack[t]; });
    App.save();
    if (reason === 'raid') { App.prepareRaid(land.discover.enemy, { fromField: true }); return; }
    const survivors = board.piecesOf('monster').length;
    const warn = App.tripDone(land.key, { survivors, monster: land.monster });
    App.bountyEvent(`trip:${land.key}`);
    const rows = land.bag.map(t => `<tr><td>${label(t)}</td><td class="${run.backpack[t] ? 'pos' : ''}">+${run.backpack[t]}</td></tr>`).join('');
    const notes = [];
    if (run.marked) notes.push(`📍 You marked a ${App.ENEMY_NAME[land.discover.enemy]} on your map.`);
    else if (run.discoverSpawned && !run.discovered) notes.push('You left something unexplored…');
    if (board.buried.size) notes.push(`${board.buried.size} find${board.buried.size > 1 ? 's' : ''} stayed buried.`);
    if (run.overflow) notes.push(`${run.overflow} more didn't fit in your backpack.`);
    if (run.slain) notes.push(`${land.monster.icon} ${run.slain} ${land.monster.name}${run.slain > 1 ? 's' : ''} defeated.`);
    if (survivors && (land.key === 'forest' || land.key === 'mine')) notes.push(`${land.monster.icon} ${survivors} ${land.monster.name}${survivors > 1 ? 's' : ''} got away — they'll report back to their kin.`);
    if (run.lost) notes.unshift(`💀 <b>You collapsed</b> and dropped ${run.lost} things on the way home.`);
    notes.push(`❤️ ${App.state.hp}/${App.maxHp} after resting at camp.`);
    if (warn) notes.unshift(warn);
    // Trip goals: stars and their rewards.
    const stars = reason === 'collapse' ? Math.min(1, starsNow()) : starsNow();
    const L = run.landLv, rew = [];
    if (stars >= 1) { App.state.stockpile.gold += 5 + Math.floor(L / 2); rew.push(`${5 + Math.floor(L / 2)} gold`); }
    if (stars >= 2) { const x = 15 + L * 2; App.addXP(x); run.xp += x; rew.push(`${x} XP`); }
    if (stars >= 3) { const rr = STAR_RARE[land.key]; App.state.stockpile[rr] += 2; App.state.stockpile.gold += 10; rew.push(`a reward chest: 10 gold + 2 ${Data.RESOURCES[rr].label}`); }
    run.stars = stars;
    const best = App.state.bestStars = App.state.bestStars || {};
    best[land.key] = Math.max(best[land.key] || 0, stars);
    notes.unshift(`⭐ +${run.xp} XP · Level ${App.level}`);
    const rec = App.state.lands[land.key];
    rec.runs += stars >= 3 ? 2 : 1;   // a ★★★ trip tames the land twice as fast
    const newLv = Data.landLevel(rec.runs);
    Lore.landProgress(land.key, run.landLv, newLv);
    if (newLv > run.landLv) notes.unshift(`${land.icon} <b>The ${land.name} grows wilder — now Lv ${newLv}!</b> More obstacles, tougher chests, richer finds.`);
    if (land.discover && Math.floor(newLv / 5) > Math.floor(run.landLv / 5) && keepWaiting(land.discover.enemy, newLv))
      notes.unshift(`${land.discover.enemy === 'goblin' ? '🐾 <b>Goblins are on the move!</b> Their tracks will turn up on your next Forest trip — follow them to a new keep.' : 'ᚱ <b>Dwarf runes glow in the hills!</b> Find the rune stone on your next Iron Hills trip to locate a new stronghold.'}`);
    Object.values(Boss.CONFIG).filter(c => c.unlock && !c.deep && c.unlock.land === land.key && run.landLv < c.unlock.lv && newLv >= c.unlock.lv)
      .forEach(c => notes.unshift(`${c.icon} <b>${c.place} found!</b> Tap the ${land.name} on the map to face ${c.short}.`));
    if (newLv >= Data.LAND_MAX && Data.SHARDS.some(x => x.id === land.key) && App.grantShard(land.key)) { notes.unshift(`💎 <b>Relic shard!</b> You've mastered the ${land.name} — its shard reveals itself to you (${App.state.shards}/5).`); Sound.sfx('rare'); }
    App.save();
    App.choose({
      title: reason === 'collapse' ? 'You collapsed!' : reason === 'moves' ? 'Out of moves' : 'Back home safe',
      html: `<div class="trip-stars">${'<span>★</span>'.repeat(run.stars)}${'<span class="off">★</span>'.repeat(3 - run.stars)}</div>
             <div class="trip-goals">${run.goals.map(x => `<div class="${x.have >= x.need ? 'done' : ''}">${x.have >= x.need ? '✓' : '○'} ${x.text(x.need)} <b>${x.have}/${x.need}</b></div>`).join('')}
             <small>★ one goal · ★★ both · ★★★ both with 5+ moves to spare</small></div>
             ${tripReward(run)}
             <table class="sum-table"><thead><tr><th></th><th>Banked</th></tr></thead><tbody>${rows}</tbody></table>
             ${run.finds.length ? `<div class="sum-spoils"><b>Finds</b><br>${run.finds.join('<br>')}</div>` : ''}
             ${notes.length ? `<p class="sum-notes">${notes.join('<br>')}</p>` : ''}`,
      buttons: [{ id: 'again', label: `${land.icon} Gather again` }, { id: 'home', label: 'Home', cls: 'alt' }],
    }).then(c => (c === 'again' && App.state.hp > 0 ? App.go('gather', { land: land.key }) : App.go('home')));
  }

  // ---------- public ----------
  function init() {
    Object.entries(LANDS).forEach(([k, l]) => { l.key = k; });
    board = new Board({ rows: SIZE, cols: SIZE, wrap: document.getElementById('gather-wrap'), randType, hooks });
    document.getElementById('g-exit').onclick = () => {
      if (!run || run.ended || board.busy) return;
      finish('home');
    };
  }

  function start({ land: key = 'forest' } = {}) {
    land = LANDS[key];
    document.getElementById('screen-gather').dataset.land = key;
    document.getElementById('g-title').textContent = `${land.icon} ${land.name}`;
    buildBackpack();
    board.reset();
    const landLv = Data.landLevel(App.state.lands[key].runs);
    const lv = Data.levelInfo(landLv);
    run = {
      lv, landLv, cap: Data.backpackSize(App.level), xp: 0, sinceGrow: 0,
      moves: MOVES, movesMade: 0, backpack: Object.fromEntries(land.bag.map(t => [t, 0])), overflow: 0, fullWarned: false,
      finds: [], told: {}, eventPiece: null, eventSpawned: false,
      discoverSpawned: false, followed: false, discovered: false, marked: false, ended: false,
      mon: Data.monsterPlan(landLv), sinceMon: 0, slain: 0, sinceSpread: 0, extra: {},
      ticketAt: Math.random() < 0.34 ? 3 + Math.floor(Math.random() * 10) : 0, ticketSpawned: false,
    };
    run.goals = makeGoals(landLv);
    document.getElementById('coach').classList.add('hidden');
    // Obstacles first (rows 1-6), then tiles, then buried finds under random tiles.
    const used = new Set();
    for (const kind of land.obstacles(lv.startObstacles)) {
      let r, c;
      do { r = 1 + Math.floor(Math.random() * (SIZE - 1)); c = Math.floor(Math.random() * SIZE); } while (used.has(`${r},${c}`));
      used.add(`${r},${c}`);
      addObstacle(kind, r, c);
    }
    board.fillEmpty();
    for (let i = 0; i < run.mon.start; i++) spawnMonster(false);
    for (let i = 0, spots0 = blockerSpots().sort(() => Math.random() - 0.5); i < blockerCount(landLv) && i < spots0.length; i++) addBlocker(...spots0[i]);
    if (landLv >= BLOCKER_LV && !(App.state.seenBlockers || {})[key]) {
      App.state.seenBlockers = { ...(App.state.seenBlockers || {}), [key]: true };
      App.save();
      setTimeout(() => App.choose({ title: 'A new obstacle', html: `<p>${BLOCKERS[key].intro}</p>`, buttons: [{ id: 'ok', label: 'Got it' }] }), 900);
    }
    const spots = board.tileCells().sort(() => Math.random() - 0.5).slice(0, lv.buried);
    spots.forEach(([r, c]) => board.buried.set(`${r},${c}`, Data.rollFrom(Data.FINDS[land.finds])));
    // Now and then, a lost page of the Old King's diary is buried here (in order, about one trip in six).
    if (spots.length && Lore.nextPage() && Math.random() < 0.17) { const [r, c] = spots.at(-1); board.buried.set(`${r},${c}`, 'page'); }
    // A bronze chest's Old key is on the same board: buried, or carried by one of the monsters.
    const chest = board.piecesOf('locked')[0];
    if (chest && chest.lockTier === 1 && ![...board.buried.values()].includes('key')) {
      if (Math.random() < 0.5) { const [r, c] = spots[0]; board.buried.set(`${r},${c}`, 'key'); }
      else {
        const m = board.piecesOf('monster')[0];
        if (m) { m.carriesKey = true; monLabel(m); } else run.keyCarrier = true;
      }
    }
    board.setFrame(key);
    Art.setScene(key);
    board.showBuried = has('lamp');
    board.renderWeapons(document.getElementById('gather-weapons'));
    board.render();
    board.renderBuried();
    board.scheduleHint();
    hud();
    hudLevel();
    hudGoals();
    coach('start');
    if (!App.pouchTotal()) { const r0 = run; setTimeout(() => { if (run === r0 && !run.ended) board.toast('🍖 You packed no food — you can\'t heal on this trip. Pack some at Your Camp\'s Storehouse.', 'alert', 3200); }, 2700); }
    Sound.music(land.music);
    if (App.state.debug.discoverNow && land.discover) {
      run.discoverSpawned = true;
      spawnOn(land.discover.piece, (r, c) => r >= 1 && r <= 4 && c >= 1 && c <= 5, land.discover.spot);
    } else if (App.state.debug.eventNow) {
      run.eventSpawned = true;
      run.eventPiece = spawnOn(land.event.piece, (r, c) => c === 0 && r >= 1, land.event.msg);
    } else if (chest) {
      board.toast(chest.lockTier > 1 ? `✨ A ${Data.CHEST_TIERS[chest.lockTier]} chest! It needs a ${Data.CHEST_TIERS[chest.lockTier]} key…` : '🔒 A locked chest! Its key is buried somewhere here…', 'alert', 2800);
    } else {
      board.toast(`${land.icon} ${land.name}: ${lv.buried} finds are buried somewhere…`, '', 2400);
    }
  }

  return { init, start, LANDS, get board() { return board; }, get run() { return run; } };
})();
