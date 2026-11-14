// Gathering boards (Forest, Iron Hills): match for resources, dig up buried finds,
// break obstacles with the right weapon, chase a runaway, discover a raid target.
window.Gather = (() => {
  // ---------- tuning knobs ----------
  const SIZE = 7;
  const MOVES = 20;
  const BACKPACK = 30;
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
    tracks:  { kind: 'tracks',  label: '', mat: 'other',    hp: 1, art: 'tracks' },
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
      finds: 'forest',
      hint: 'Match 3+ to gather. Stumps & thornbushes need an axe — thornbushes hide finds.',
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
      finds: 'mine',
      hint: 'Match ore for iron and coal for the forge. Only pickaxes break boulders & mine veins.',
    },
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

  const SCALES = ['stump', 'thorn', 'boulder', 'vein'];
  function addObstacle(kind, r, c, appear = false) {
    const spec = { ...P[kind] };
    if (SCALES.includes(kind)) spec.hp += run.lv.hpBonus;
    return board.addPiece(spec, r, c, 1, appear);
  }
  function xp(n, why) {
    const lv = App.addXP(n);
    run.xp += n;
    hudLevel();
    if (lv) {
      board.celebrate([3, 3], { icon: '⭐', title: `Level ${lv}!`, sub: App.levelPerks(lv), rare: true, kicker: '✦ Level up ✦' });
    }
  }
  function hudLevel() {
    const st = App.state, L = App.level;
    const a = Data.xpForLevel(L), b = Data.xpForLevel(L + 1);
    document.getElementById('g-level').innerHTML = `⭐ Lv ${L} <span class="xpbar"><i style="width:${Math.round((st.xp - a) / (b - a) * 100)}%"></i></span>`;
  }

  const needsKey = () => board.piecesOf('locked').length > 0 && App.state.inventory.key < 1;

  function randType() {
    const roll = Math.random();
    if (roll < STAR_CHANCE) return 'star';
    if (roll < STAR_CHANCE + GOLD_CHANCE) return 'gold';
    const W = land.weights;
    const total = Object.values(W).reduce((a, b) => a + b, 0);
    let x = Math.random() * total;
    for (const [type, w] of Object.entries(W)) if ((x -= w) < 0) return type;
    return Object.keys(W)[0];
  }

  // ---------- backpack ----------
  function addToBackpack(type, n, cell, delay = 0) {
    if (!(type in run.backpack)) { App.state.stockpile[type] += n; App.save(); board.float(cell, `+${n} ${label(type)}`, 'gain', delay); return; }
    const add = Math.min(n, BACKPACK - bagTotal());
    if (add > 0) {
      run.backpack[type] += add;
      board.float(cell, `+${add} ${label(type)}`, type === 'gold' ? 'gold' : 'gain', delay);
    }
    if (add < n) {
      run.overflow += n - add;
      if (add === 0) board.float(cell, 'Full!', 'loss', delay);
    }
    if (bagTotal() >= BACKPACK && !run.fullWarned) {
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
      case 'basket': addToBackpack('food', 3, cell, delay); break;
      case 'orepocket': addToBackpack('iron', 3, cell, delay); break;
      case 'coalseam': addToBackpack('coal', 3, cell, delay); break;
      case 'nugget': addToBackpack('gold', 3, cell, delay); break;
      case 'lostclub': st.inventory.club++; break;
      case 'sling': st.inventory.sling++; break;
      case 'key': st.inventory.key++; break;
      case 'scrap': {
        const enemy = land.discover.enemy;
        st.scraps[enemy]++;
        detail = `${st.scraps[enemy]}/3 to a ${App.ENEMY_NAME[enemy]}`;
        if (st.scraps[enemy] >= 3) {
          st.scraps[enemy] -= 3;
          st.marked[enemy]++;
          detail = `map complete — a ${App.ENEMY_NAME[enemy]} is marked!`;
        }
        break;
      }
      case 'shard': {
        st.shards++;
        detail = `${st.shards}/5 of the Old King's Crown`;
        if (st.shards >= 5) { st.shards -= 5; st.inventory.crown++; detail = 'the Old King\'s Crown is complete! 👑'; }
        break;
      }
      default: break;
    }
    App.save();
    run.finds.push(`${info.icon} ${info.name}`);
    if (id === 'key' && board.piecesOf('locked').length) detail = 'Now tap 🗝️ Old key, then the locked chest!';
    board.celebrate(cell, { icon: info.art ? Art.tile(info.art) : info.icon, title: `${info.name}!`, sub: detail || info.desc, rare: id === 'shard' || id === 'key' });
    xp(Data.XP.find);
    board.renderWeapons();
    board.renderPieces();
  }

  // ---------- HUD ----------
  function hud() {
    document.getElementById('g-moves').textContent = run.moves;
    document.querySelector('#screen-gather .moves').classList.toggle('low', run.moves <= 5);
    land.bag.forEach(t => { const e = document.getElementById('bp-' + t); if (e) e.textContent = run.backpack[t]; });
    document.getElementById('bp-total').textContent = bagTotal();
    document.getElementById('backpack').classList.toggle('full', bagTotal() >= BACKPACK);
    document.getElementById('g-exit').classList.toggle('glow', run.fullWarned);
    const keyHere = [...board.buried.values()].includes('key');
    document.getElementById('g-finds').textContent = `🔍 ${board.buried.size} buried` +
      (board.piecesOf('locked').length ? (App.state.inventory.key > 0 ? ' · 🗝️ you have a key!' : keyHere ? ' · 🔒 its key is buried here' : '') : '');
    const ev = run.eventPiece && !run.eventPiece.gone;
    document.getElementById('gather-hint').textContent = board.armedHint() ||
      (ev ? (land === LANDS.forest ? 'Catch the thief: only a weapon can stop it!' : 'Stop the cart: match next to it or hit it!')
        : board.piecesOf(land.discover.piece).length ? land.discover.spot : land.hint);
  }

  function buildBackpack() {
    document.getElementById('backpack').innerHTML =
      `<span class="bp-label">🎒 <b id="bp-total">0</b>/${BACKPACK}</span>` +
      land.bag.map(t => `<span class="bp-item"><span class="chip c-${t}"></span><b id="bp-${t}">0</b></span>`).join('');
  }

  // ---------- events ----------
  function spawnOn(kind, filter, msg, kindOfToast = 'alert') {
    const spots = board.tileCells(filter);
    if (!spots.length) return null;
    const [r, c] = pick(spots);
    const p = board.addPiece(P[kind], r, c, 1, true);
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
    const food = App.state.stockpile.food + (run.backpack.food || 0);
    const canRaid = food >= cfg.foodCost;
    const choice = await App.choose({
      title: `${cfg.icon} ${cfg.foundTitle}`,
      html: `<p>${cfg.foundText}</p>
             <p>Raiding costs <b>${cfg.foodCost} food</b> — you have <b>${food}</b>.</p>
             ${canRaid ? '' : '<p class="hint">Not enough food to raid now. Mark it and come back.</p>'}`,
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
      board.toast(land === LANDS.forest ? 'The thief got away with the sack!' : 'The cart rolled off down the tunnel…', 'alert');
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
    onMove: () => { run.moves--; run.movesMade++; hud(); },
    onMatch(runs, step) {
      for (const ri of runs) {
        const res = land.gives[ri.type];
        if (!res) continue;   // filler tiles
        if (res === 'gold') Sound.sfx('coin');
        let n = points(ri.cells.length) + (step > 1 ? 1 : 0);
        if (TOOL_BONUS[res] && has(TOOL_BONUS[res])) n += 1;
        addToBackpack(res, n, ri.cells[Math.floor(ri.cells.length / 2)]);
        xp(Data.XP.match);
      }
    },
    onPieceHit(p, n, src, w) {
      const dmg = src === 'match' ? n * Data.matchDamage(p) : n;
      if (dmg <= 0) {
        const tip = p.toolOnly === 'axe' ? '🪓 Only an axe can clear stumps & thornbushes — craft a Stone axe in the Workshop.'
          : p.toolOnly === 'pick' ? '⛏️ Only a pickaxe can break rock — craft a Stone pick in the Workshop.'
          : p.kind === 'thief' ? '🗡️ Only a weapon can stop the thief — Club, Sling, Sword…'
          : '🔒 Locked tight! Its key is buried somewhere on this board — dig it up.';
        if (!run.told[p.toolOnly || p.kind]) { run.told[p.toolOnly || p.kind] = true; board.toast(tip, '', 3000); }
        return;
      }
      const cell = midOf(p);
      if (p.kind === 'vein') {
        const mined = Math.min(dmg, p.hp) * (w === 'stonepick' ? 1 : 2);
        addToBackpack('iron', mined, cell);
      }
      if (!board.hurt(p, dmg)) return;
      xp(p.kind === 'thief' || p.kind === 'cart' ? Data.XP.chase : p.kind === 'tracks' || p.kind === 'rune' ? Data.XP.discover : Data.XP.obstacle);
      switch (p.kind) {
        case 'stump':
          addToBackpack('wood', w === 'axe' ? 5 : 3, cell);
          board.toast(w === 'axe' ? '🪓 Clean chop! +5 wood' : '🪓 Stump chopped! +3 wood');
          break;
        case 'thorn': applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 150); break;
        case 'boulder':
          addToBackpack('stone', 2, cell);
          if (Math.random() < 0.35) applyFind(Data.rollFrom(Data.FINDS[land.finds]), cell, 300);
          break;
        case 'vein': board.toast('Vein mined out!'); break;
        case 'locked':
          addToBackpack('gold', 6, cell);
          board.toast('🔓 The chest creaks open!', 'win');
          applyFind(Data.rollFrom([['shard', 45], ['sling', 20], ['scrap', 20], ['lostclub', 15]]), cell);
          break;
        case 'thief':
        case 'cart':
          for (let i = 0; i < 4; i++) addToBackpack(pick(land.event.loot), 1, cell, i * 180);
          board.toast(p.kind === 'thief' ? 'Caught the thief! You take the sack.' : 'Cart stopped! You grab the ore.', 'win');
          if (needsKey() && Math.random() < 0.6) applyFind('key', cell);
          else if (Math.random() < 0.35) applyFind(pick(['lostclub', 'sling', 'scrap']), cell);
          run.eventPiece = null;
          Sound.sfx('victory');
          break;
        case 'tracks':
        case 'rune': run.followed = true; break;
        default: break;
      }
      hud();
    },
    onFind(id, cell) { applyFind(id, cell); },
    onPieceTap(p) {
      const msg = {
        stump: `Old stump (${p.hp} HP). Only an axe can chop it — Stone axe or Iron axe.`,
        thorn: `Thornbush (${p.hp} HP) — something's inside! Only an axe can cut it.`,
        locked: App.state.inventory.key > 0 ? 'Locked chest — tap 🗝️ Old key, then tap the chest!' : 'Locked chest. Its key is buried somewhere on this board — clear tiles to dig it up.',
        boulder: `Boulder (${p.hp} HP). Only a pickaxe can break it. Sometimes hides a find.`,
        vein: 'Ore vein — only a pickaxe can mine it. Every hit gives iron (Iron pickaxe: double).',
        thief: 'A goblin thief! Only a weapon can stop it — Club, Sling, Sword… before it escapes!',
        cart: 'A runaway cart full of ore! Stop it before it rolls off.',
        tracks: 'Goblin tracks — match next to them to follow.',
        rune: 'A cracked rune stone — match next to it to read it.',
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
        if (!run.discoverSpawned && run.movesMade >= DISCOVER_AFTER && Math.random() < DISCOVER_CHANCE) {
          run.discoverSpawned = true;
          spawnOn(land.discover.piece, (r, c) => r >= 1 && r <= 4 && c >= 1 && c <= 5, land.discover.spot);
        }
        await board.ensurePlayable();
      }
      hud();
      if (run.moves <= 0 && !run.ended) {
        await board.wait(500);
        finish('moves');
      }
    },
  };

  // ---------- end of run ----------
  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    land.bag.forEach(t => { App.state.stockpile[t] += run.backpack[t]; });
    App.save();
    if (reason === 'raid') { App.prepareRaid(land.discover.enemy, { fromField: true }); return; }
    const rows = land.bag.map(t => `<tr><td>${label(t)}</td><td class="${run.backpack[t] ? 'pos' : ''}">+${run.backpack[t]}</td></tr>`).join('');
    const notes = [];
    if (run.marked) notes.push(`📍 You marked a ${App.ENEMY_NAME[land.discover.enemy]} on your map.`);
    else if (run.discoverSpawned && !run.discovered) notes.push('You left something unexplored…');
    if (board.buried.size) notes.push(`${board.buried.size} find${board.buried.size > 1 ? 's' : ''} stayed buried.`);
    if (run.overflow) notes.push(`${run.overflow} more didn't fit in your backpack.`);
    notes.unshift(`⭐ +${run.xp} XP · Level ${App.level}`);
    App.choose({
      title: reason === 'moves' ? 'Out of moves' : 'Back home safe',
      html: `<table class="sum-table"><thead><tr><th></th><th>Banked</th></tr></thead><tbody>${rows}</tbody></table>
             ${run.finds.length ? `<div class="sum-spoils"><b>Finds</b><br>${run.finds.join('<br>')}</div>` : ''}
             ${notes.length ? `<p class="sum-notes">${notes.join('<br>')}</p>` : ''}`,
      buttons: [{ id: 'again', label: `${land.icon} Gather again` }, { id: 'home', label: 'Home', cls: 'alt' }],
    }).then(c => (c === 'again' ? App.go('gather', { land: land.key }) : App.go('home')));
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
    const lv = Data.levelInfo(App.level);
    run = {
      lv, xp: 0, sinceGrow: 0,
      moves: MOVES, movesMade: 0, backpack: Object.fromEntries(land.bag.map(t => [t, 0])), overflow: 0, fullWarned: false,
      finds: [], told: {}, eventPiece: null, eventSpawned: false,
      discoverSpawned: false, followed: false, discovered: false, marked: false, ended: false,
    };
    // Obstacles first (rows 1-6), then tiles, then buried finds under random tiles.
    const used = new Set();
    for (const kind of land.obstacles(lv.startObstacles)) {
      let r, c;
      do { r = 1 + Math.floor(Math.random() * (SIZE - 1)); c = Math.floor(Math.random() * SIZE); } while (used.has(`${r},${c}`));
      used.add(`${r},${c}`);
      addObstacle(kind, r, c);
    }
    board.fillEmpty();
    const spots = board.tileCells().sort(() => Math.random() - 0.5).slice(0, lv.buried);
    spots.forEach(([r, c]) => board.buried.set(`${r},${c}`, Data.rollFrom(Data.FINDS[land.finds])));
    // A locked chest always has its key buried somewhere on the same board.
    if (board.piecesOf('locked').length && ![...board.buried.values()].includes('key')) {
      const [r, c] = spots[0];
      board.buried.set(`${r},${c}`, 'key');
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
    Sound.music(land.music);
    if (App.state.debug.discoverNow) {
      run.discoverSpawned = true;
      spawnOn(land.discover.piece, (r, c) => r >= 1 && r <= 4 && c >= 1 && c <= 5, land.discover.spot);
    } else if (App.state.debug.eventNow) {
      run.eventSpawned = true;
      run.eventPiece = spawnOn(land.event.piece, (r, c) => c === 0 && r >= 1, land.event.msg);
    } else if (board.piecesOf('locked').length) {
      board.toast('🔒 A locked chest! Its key is buried somewhere here…', 'alert', 2800);
    } else {
      board.toast(`${land.icon} ${land.name}: ${lv.buried} finds are buried somewhere…`, '', 2400);
    }
  }

  return { init, start, LANDS, get board() { return board; }, get run() { return run; } };
})();
