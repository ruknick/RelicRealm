// Forest trail: match-3 gathering while walking a trail, with random encounters.
window.Forest = (() => {
  // ---------- tuning knobs ----------
  const SIZE = 7;
  const MOVES = 30;
  const BACKPACK = 15;          // max resources carried per run
  const WALK_EVERY = 3;         // matches per step along the trail
  const ROWS_BEFORE = 6;        // steps walked before an encounter starts entering
  const GOLD_CHANCE = 0.02;
  // Spawn weights for everything except gold: each resource ~11%, each filler ~22%.
  const TILE_WEIGHTS = { wood: 11, stone: 11, hide: 11, leaves: 22, mushroom: 22, berries: 22 };
  const points = len => (len >= 5 ? 3 : len === 4 ? 2 : 1);   // +1 more on chain reactions

  const BASIC = ['wood', 'stone', 'hide'];
  const BAG_TYPES = ['wood', 'stone', 'hide', 'gold'];
  const FILLER = ['leaves', 'mushroom', 'berries'];   // match normally, give no resources
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const WEIGHT_TOTAL = Object.values(TILE_WEIGHTS).reduce((a, b) => a + b, 0);

  // Layout rows are written top → bottom; they enter the board bottom row first.
  //   K = keep (3 wide)  k = small keep  F = fence  T = pit trap
  //   L = loot chest (spoils)  c = small chest  C = camp chest
  const ENCOUNTERS = {
    nothing: { weight: 60, name: 'Nothing', rows: [] },
    camp:    { weight: 20, name: 'Abandoned camp', fight: false,
               banner: 'You stumble on an abandoned camp…', rows: ['...C...'] },
    scouts:  { weight: 12, name: 'Goblin scouts', fight: true, spoilChance: 0.25,
               banner: 'Goblin scouts on the trail ahead!', rows: ['...k...', '..F.c..'] },
    village: { weight: 8, name: 'Goblin village', fight: true, spoilChance: 1,
               banner: 'You spot smoke through the trees…', rows: ['.FKKKF.', '...L...', '....T..'] },
  };
  const PIECE_DEFS = {
    K: { kind: 'keep',  label: 'KEEP',  hp: 5 },
    k: { kind: 'keep',  label: 'KEEP',  hp: 2 },
    F: { kind: 'fence', label: 'FENCE', hp: 1 },
    T: { kind: 'trap',  label: 'TRAP',  hp: 1 },
    L: { kind: 'chest', label: 'LOOT',  hp: 1, loot: 'spoil' },
    c: { kind: 'chest', label: '',      hp: 1, loot: 2 },
    C: { kind: 'chest', label: '',      hp: 1, loot: 3 },
  };
  const SPOILS = ['firepot', 'scraps', 'shiv', 'drum', 'blueprint'];

  const LINES = [];
  for (let r = 0; r < SIZE; r++) LINES.push(Array.from({ length: SIZE }, (_, c) => [r, c]));
  for (let c = 0; c < SIZE; c++) LINES.push(Array.from({ length: SIZE }, (_, r) => [r, c]));

  const ABORT = Symbol('abort');
  let session = 0;

  let grid = [];
  const els = new Map();        // tile id -> element
  const pieceEls = new Map();   // piece id -> element
  let nextId = 1;
  let run = null;               // everything about the current trip
  let busy = false;
  let selected = null;
  let armed = null;
  let pointer = null;
  let boardEl, fxEl, toastEl, toastTimer;

  // ---------- helpers ----------
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const label = t => App.RESOURCES[t].label;
  const zero = () => ({ wood: 0, stone: 0, hide: 0, gold: 0 });
  const isPiece = t => !!t && t.type === 'piece';
  const isTile = t => !!t && t.type !== 'piece';
  const bagTotal = () => BAG_TYPES.reduce((s, t) => s + run.backpack[t], 0);
  const enc = () => ENCOUNTERS[run.enc];
  const fightOn = () => enc().fight && run.revealed && !run.won;

  function wait(tok, ms) {
    return new Promise((res, rej) => setTimeout(() => (tok === session ? res() : rej(ABORT)), ms));
  }
  function go(promise) {
    promise.catch(e => { if (e !== ABORT) { console.error(e); busy = false; } });
  }
  function randType() {
    if (Math.random() < GOLD_CHANCE) return 'gold';
    let roll = Math.random() * WEIGHT_TOTAL;
    for (const [type, w] of Object.entries(TILE_WEIGHTS)) if ((roll -= w) < 0) return type;
    return 'leaves';
  }
  function newTile(type) {
    return { id: nextId++, type: type || randType() };
  }
  function rollEncounter() {
    const forced = App.state.debug.encounter;
    if (forced && forced !== 'random') return forced;
    let roll = Math.random() * 100;
    for (const [k, e] of Object.entries(ENCOUNTERS)) if ((roll -= e.weight) < 0) return k;
    return 'nothing';
  }

  // ---------- board logic ----------
  function runLenThrough(r, c, type) {
    let best = 0;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      let n = 1;
      for (const s of [1, -1]) {
        let rr = r + dr * s, cc = c + dc * s;
        while (inBounds(rr, cc) && isTile(grid[rr][cc]) && grid[rr][cc].type === type) { n++; rr += dr * s; cc += dc * s; }
      }
      best = Math.max(best, n);
    }
    return best;
  }
  function safeType(r, c) {
    for (let i = 0; i < 30; i++) {
      const t = randType();
      if (runLenThrough(r, c, t) < 3) return t;
    }
    return randType();
  }

  function findRuns() {
    const runs = [];
    for (const line of LINES) {
      let i = 0;
      while (i < SIZE) {
        const [r, c] = line[i];
        const t = grid[r][c];
        let j = i + 1;
        if (isTile(t)) {
          while (j < SIZE) {
            const [r2, c2] = line[j];
            const u = grid[r2][c2];
            if (isTile(u) && u.type === t.type) j++; else break;
          }
          if (j - i >= 3) runs.push({ type: t.type, cells: line.slice(i, j) });
        }
        i = j;
      }
    }
    return runs;
  }

  function swap([r1, c1], [r2, c2]) {
    const t = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = t;
  }

  function hasMove() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = c + dc;
          if (!inBounds(r2, c2)) continue;
          const a = grid[r][c], b = grid[r2][c2];
          if (!isTile(a) || !isTile(b) || a.type === b.type) continue;
          swap([r, c], [r2, c2]);
          const ok = runLenThrough(r, c, b.type) >= 3 || runLenThrough(r2, c2, a.type) >= 3;
          swap([r, c], [r2, c2]);
          if (ok) return true;
        }
      }
    }
    return false;
  }

  // Tiles fall past fixed encounter pieces; new tiles drop in from the top.
  function collapse() {
    for (let c = 0; c < SIZE; c++) {
      const free = [];
      for (let r = SIZE - 1; r >= 0; r--) if (!isPiece(grid[r][c])) free.push(r);
      const tiles = free.map(r => grid[r][c]).filter(Boolean);
      const fresh = free.length - tiles.length;
      free.forEach((r, i) => {
        if (i < tiles.length) grid[r][c] = tiles[i];
        else { const t = newTile(); t.fromRow = r - fresh; grid[r][c] = t; }
      });
    }
  }

  function shuffle() {
    const spots = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (isTile(grid[r][c])) spots.push([r, c]);
    const tiles = spots.map(([r, c]) => grid[r][c]);
    for (let tries = 0; tries < 300; tries++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = rnd(i + 1);
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      spots.forEach(([r, c], i) => { grid[r][c] = tiles[i]; });
      if (!findRuns().length && hasMove()) return;
    }
    for (let tries = 0; tries < 300; tries++) {
      spots.forEach(([r, c]) => { grid[r][c] = newTile(safeType(r, c)); });
      if (hasMove()) return;
    }
  }

  // ---------- encounter pieces ----------
  function placeRow(rowStr, r) {
    let last = null;
    for (let c = 0; c < SIZE; c++) {
      const ch = rowStr[c];
      if (!ch || ch === '.') { last = null; continue; }
      let p;
      if (ch === 'K' && last && last.ch === 'K') {
        p = last; p.w++;
      } else {
        const d = PIECE_DEFS[ch];
        p = { id: nextId++, ch, ...d, maxHp: d.hp, r, c, w: 1 };
        run.pieces.push(p);
      }
      grid[r][c] = { type: 'piece', piece: p };
      last = p;
    }
  }

  function onReveal() {
    run.revealed = true;
    toast(enc().banner, enc().fight ? 'alert' : '', 2600);
    updateExitButton();
  }

  function damage(p, n, source) {
    if (p.hp <= 0) return;
    p.hp = Math.max(0, p.hp - n);
    if (enc().fight) run.attacked = true;
    const el = pieceEls.get(p.id);
    if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
    if (p.hp <= 0) breakPiece(p, source);
    else renderPieces();
    updateExitButton();
  }

  function breakPiece(p, source) {
    run.pieces = run.pieces.filter(x => x !== p);
    for (let i = 0; i < p.w; i++) grid[p.r][p.c + i] = null;
    const el = pieceEls.get(p.id);
    if (el) { pieceEls.delete(p.id); el.classList.add('broken'); setTimeout(() => el.remove(), 450); }
    const mid = [p.r, p.c + Math.floor(p.w / 2)];

    if (p.kind === 'fence') {
      toast('Fence smashed!');
    } else if (p.kind === 'trap') {
      if (source === 'match') {
        run.moves = Math.max(0, run.moves - 1);
        hud();
        floatText(mid, '−1 move', 'loss');
        toast('Pit trap! You lose 1 move.', 'alert');
      } else {
        toast('Trap disarmed!');
      }
    } else if (p.kind === 'chest') {
      if (p.loot === 'spoil') {
        grantSpoil(mid, 'Loot chest');
      } else {
        toast(p.loot === 3 ? 'Camp chest opened!' : 'Chest opened!');
        for (let i = 0; i < p.loot; i++) addToBackpack(pick(BASIC), 1, mid, i * 220);
        run.chestsOpened++;
      }
    } else if (p.kind === 'keep') {
      run.won = true;
      toast('Keep destroyed! The goblins flee!', 'win', 2600);
      if (Math.random() < enc().spoilChance) grantSpoil(mid, 'Keep destroyed');
      updateExitButton();
    }
  }

  function grantSpoil(cell, from) {
    const k = pick(SPOILS);
    const inv = App.state.inventory;
    let name;
    if (k === 'scraps') { App.addResource('iron', 3); name = '⛓️ Rusty iron scraps (+3 iron)'; }
    else if (k === 'shiv') { inv.shiv += 2; name = `${App.ITEMS.shiv.icon} Goblin shiv (2 uses)`; }
    else {
      inv[k] += 1;
      if (k === 'blueprint') App.state.unlocks.palisade = true;
      name = `${App.ITEMS[k].icon} ${App.ITEMS[k].name}`;
    }
    App.save();
    run.spoils.push(name);
    floatText(cell, name.split(' ')[0] + ' Spoils!', 'gold');
    toast(`${from}: ${name}!`, 'win', 2600);
    renderWeapons();
  }

  // ---------- backpack ----------
  function addToBackpack(type, n, cell, delay = 0) {
    const room = BACKPACK - bagTotal();
    const add = Math.min(n, room);
    run.gathered[type] += n;
    if (add > 0) {
      run.backpack[type] += add;
      floatText(cell, `+${add} ${label(type)}`, type === 'gold' ? 'gold' : 'gain', delay);
    }
    if (add < n) {
      run.overflow += n - add;
      if (add === 0) floatText(cell, 'Full!', 'loss', delay);
    }
    if (bagTotal() >= BACKPACK && !run.fullWarned) {
      run.fullWarned = true;
      toast('Backpack full! Head home when you\'re ready.', 'win', 2600);
      updateExitButton();
    }
    hudBackpack();
  }

  // ---------- rendering ----------
  const pos = (r, c) => `translate(${c * 100}%, ${r * 100}%)`;

  function render() {
    const live = new Set();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (!isTile(t)) continue;
        live.add(t.id);
        let el = els.get(t.id);
        if (!el) {
          el = document.createElement('div');
          el.className = 'tile';
          el.innerHTML = `<div class="gem g-${t.type}"></div>`;
          els.set(t.id, el);
          boardEl.appendChild(el);
          if (t.fromRow !== undefined) {
            el.style.transform = pos(t.fromRow, c);
            el.getBoundingClientRect();   // force layout so the fall animates
          }
        }
        delete t.fromRow;
        el.style.transform = pos(r, c);
        el.classList.toggle('sel', !!selected && selected[0] === r && selected[1] === c);
      }
    }
    els.forEach((el, id) => { if (!live.has(id)) { el.remove(); els.delete(id); } });
    renderPieces();
  }

  function renderPieces() {
    for (const p of run.pieces) {
      let el = pieceEls.get(p.id);
      if (!el) {
        el = document.createElement('div');
        el.className = `piece p-${p.kind}`;
        el.innerHTML = '<div class="pc"><span class="pl"></span><span class="hp"></span></div>';
        pieceEls.set(p.id, el);
        boardEl.appendChild(el);
        el.style.top = ((p.r - 1) / SIZE * 100) + '%';
        el.style.left = (p.c / SIZE * 100) + '%';
        el.getBoundingClientRect();
      }
      el.style.left = (p.c / SIZE * 100) + '%';
      el.style.top = (p.r / SIZE * 100) + '%';
      el.style.width = (p.w / SIZE * 100) + '%';
      el.querySelector('.pl').textContent = p.label;
      el.querySelector('.hp').textContent = p.maxHp > 1 ? '♥'.repeat(p.hp) + '♡'.repeat(p.maxHp - p.hp) : '';
      el.classList.toggle('target', !!armed && armed !== 'club' && armed !== 'shiv');
    }
  }

  function gemAt(r, c) {
    const t = grid[r][c];
    const el = isTile(t) && els.get(t.id);
    return el ? el.firstChild : null;
  }

  function popCells(keys) {
    keys.forEach(k => {
      const g = gemAt(Math.floor(k / SIZE), k % SIZE);
      if (g) g.classList.add('pop');
    });
  }

  function floatText([r, c], text, cls, delay = 0) {
    const d = document.createElement('div');
    d.className = 'float ' + cls;
    d.textContent = text;
    d.style.left = (Math.min(Math.max(c, 0.6), SIZE - 1.6) / SIZE * 100) + '%';
    d.style.top = (Math.max(r, 0.3) / SIZE * 100) + '%';
    if (delay) d.style.animationDelay = delay + 'ms';
    d.style.opacity = 0;
    fxEl.appendChild(d);
    setTimeout(() => d.remove(), 1200 + delay);
  }

  function toast(msg, kind = '', ms = 1900) {
    toastEl.textContent = msg;
    toastEl.className = 'show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  function hud() {
    document.getElementById('moves').textContent = run.moves;
    document.querySelector('.moves').classList.toggle('low', run.moves <= 5);
    const done = Math.min(run.matchesSinceWalk, WALK_EVERY);
    const dots = run.trailDone ? '' : ' ' + '●'.repeat(done) + '○'.repeat(WALK_EVERY - done);
    document.getElementById('trail').textContent = `🌲 ${run.rowsWalked}${dots}`;
  }

  function hudBackpack() {
    BAG_TYPES.forEach(t => { document.getElementById('bp-' + t).textContent = run.backpack[t]; });
    const total = bagTotal();
    document.getElementById('bp-total').textContent = total;
    document.getElementById('backpack').classList.toggle('full', total >= BACKPACK);
  }

  function updateExitButton() {
    const b = document.getElementById('forest-exit');
    const flee = fightOn();
    b.textContent = flee ? '🏃 Flee' : '🏠 Head home';
    b.classList.toggle('danger', flee);
    b.classList.toggle('glow', !flee && (run.fullWarned || run.won));
    let hint;
    if (armed) hint = armedHint();
    else if (flee) hint = run.attacked
      ? 'Break the KEEP to win. Fleeing now costs half your backpack.'
      : 'Match next to goblin defenses to attack — or flee now and keep everything.';
    else hint = 'Match 3+ to gather. Every 3 matches you walk further down the trail.';
    document.getElementById('forest-hint').textContent = hint;
  }

  function armedHint() {
    return {
      club: 'Club: tap a tile to clear it.',
      sling: 'Sling: tap any tile or goblin defense to hit it.',
      firepot: 'Firepot: tap a spot to blast a 3x3 area.',
      shiv: 'Shiv: tap a tile to clear it.',
    }[armed] + ' Tap the weapon again to cancel.';
  }

  function renderWeapons() {
    const tray = document.getElementById('weapon-tray');
    const inv = App.state.inventory;
    const weapons = Object.keys(App.ITEMS).filter(k => App.ITEMS[k].weapon && (inv[k] > 0 || !App.ITEMS[k].spoil));
    tray.innerHTML = weapons.map(k => {
      const it = App.ITEMS[k];
      return `<button class="weapon${armed === k ? ' armed' : ''}" data-w="${k}" ${inv[k] > 0 ? '' : 'disabled'}>
        ${it.icon} ${it.name.replace('Goblin ', '')} ${it.uses ? inv[k] + '⚔' : '×' + inv[k]}</button>`;
    }).join('');
    tray.querySelectorAll('.weapon').forEach(b => { b.onclick = () => armWeapon(b.dataset.w); });
  }

  // ---------- game flow ----------
  async function resolve(tok) {
    let step = 0;
    for (;;) {
      const runs = findRuns();
      if (!runs.length) return;
      step++;
      if (step === 2) toast('Chain reaction! +1 per match');
      run.matchesSinceWalk += runs.length;
      const clear = new Set();
      const hits = new Map();
      for (const ri of runs) {
        ri.cells.forEach(([r, c]) => clear.add(r * SIZE + c));
        const adj = new Set();
        ri.cells.forEach(([r, c]) => DIRS.forEach(([dr, dc]) => {
          const r2 = r + dr, c2 = c + dc;
          if (inBounds(r2, c2) && isPiece(grid[r2][c2])) adj.add(grid[r2][c2].piece);
        }));
        adj.forEach(p => hits.set(p, (hits.get(p) || 0) + 1));
        if (FILLER.includes(ri.type)) continue;
        const n = points(ri.cells.length) + (step > 1 ? 1 : 0);
        addToBackpack(ri.type, n, ri.cells[Math.floor(ri.cells.length / 2)]);
      }
      hits.forEach((n, p) => damage(p, n, 'match'));
      popCells(clear);
      hud();
      await wait(tok, 220);
      clear.forEach(k => { grid[Math.floor(k / SIZE)][k % SIZE] = null; });
      collapse();
      render();
      await wait(tok, 330);
    }
  }

  // One step down the trail: everything shifts down a row, a new row enters at the top.
  async function walk(tok) {
    run.rowsWalked++;
    for (let c = 0; c < SIZE; c++) {
      const t = grid[SIZE - 1][c];
      if (!isTile(t)) continue;
      const el = els.get(t.id);
      els.delete(t.id);
      if (el) { el.style.transform = pos(SIZE, c); setTimeout(() => el.remove(), 350); }
    }
    for (let r = SIZE - 1; r > 0; r--) grid[r] = grid[r - 1];
    run.pieces.forEach(p => { p.r++; });
    grid[0] = Array(SIZE).fill(null);

    if (run.encQueue.length && run.rowsWalked > ROWS_BEFORE) {
      placeRow(run.encQueue.pop(), 0);
      if (!run.revealed) onReveal();
      if (!run.encQueue.length) run.trailDone = true;
    }
    for (let c = 0; c < SIZE; c++) {
      if (grid[0][c]) continue;
      const t = newTile(safeType(0, c));
      t.fromRow = -1;
      grid[0][c] = t;
    }
    selected = null;
    render();
    hud();
    await wait(tok, 380);
  }

  async function afterAction(tok) {
    while (run.matchesSinceWalk >= WALK_EVERY && !run.trailDone && !run.ended) {
      run.matchesSinceWalk -= WALK_EVERY;
      await walk(tok);
      await resolve(tok);
    }
    if (run.trailDone) run.matchesSinceWalk = 0;
    hud();
    if (!hasMove()) {
      toast('No moves on the board — shuffling!');
      await wait(tok, 600);
      shuffle();
      render();
      await wait(tok, 350);
    }
    if (run.moves <= 0 && !run.ended) {
      await wait(tok, 500);
      finish('moves');
    }
  }

  async function trySwap(a, b) {
    if (busy || run.ended || run.moves <= 0) return;
    if (!inBounds(...b)) return;
    if (isPiece(grid[a[0]][a[1]]) || isPiece(grid[b[0]][b[1]])) {
      toast('That won\'t move — match next to it to break it!');
      return;
    }
    const tok = session;
    busy = true;
    selected = null;
    swap(a, b); render();
    await wait(tok, 200);
    if (!findRuns().length) {
      swap(a, b); render();
      await wait(tok, 220);
      busy = false;
      return;
    }
    run.moves--; hud();
    await resolve(tok);
    await afterAction(tok);
    busy = false;
  }

  function armWeapon(k) {
    if (busy || run.ended) return;
    armed = armed === k ? null : k;
    selected = null;
    renderWeapons(); render(); updateExitButton();
  }

  async function useWeapon(r, c) {
    const w = armed;
    const t = grid[r][c];
    const tilesOnly = w === 'club' || w === 'shiv';
    if (tilesOnly && isPiece(t)) {
      toast(`The ${App.ITEMS[w].name.replace('Goblin ', '')} can't hurt defenses — use the Sling or a Firepot.`);
      return;
    }
    const tok = session;
    busy = true;
    armed = null;
    App.state.inventory[w]--;
    App.save();
    run.weaponsUsed++;
    renderWeapons();

    const cells = w === 'firepot'
      ? [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => [r + dr, c + dc])).filter(([a, b]) => inBounds(a, b))
      : [[r, c]];
    const clear = new Set();
    const hit = new Set();
    cells.forEach(([a, b]) => {
      const x = grid[a][b];
      if (isTile(x)) clear.add(a * SIZE + b);
      else if (isPiece(x)) hit.add(x.piece);
    });
    if (w === 'firepot') toast('BOOM!');
    hit.forEach(p => damage(p, 1, 'weapon'));
    popCells(clear);
    render();
    await wait(tok, 250);
    clear.forEach(k => { grid[Math.floor(k / SIZE)][k % SIZE] = null; });
    collapse(); render();
    await wait(tok, 330);
    await resolve(tok);          // free cascades, no move spent
    await afterAction(tok);
    updateExitButton();
    busy = false;
  }

  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    armed = null;
    session++;                       // stop any animations in flight
    const e = enc();
    const fighting = fightOn();
    const penalty = fighting && (reason === 'moves' || run.attacked);
    const lost = zero();
    if (penalty) {
      let lose = Math.ceil(bagTotal() / 2);
      while (lose-- > 0) {
        const t = pick(BAG_TYPES.filter(x => run.backpack[x] > 0));
        run.backpack[t]--; lost[t]++;
      }
    }
    BAG_TYPES.forEach(t => { App.state.stockpile[t] += run.backpack[t]; });
    App.save();

    let title, encLine;
    if (run.won) title = 'Victory!';
    else if (fighting && reason === 'moves') title = 'Out of moves!';
    else if (fighting) title = penalty ? 'You fled!' : 'You slipped away';
    else if (reason === 'moves') title = 'Out of moves';
    else title = 'Back home safe';

    if (run.enc === 'nothing') encLine = 'A quiet walk — nothing on the trail today.';
    else if (!run.revealed) encLine = `There was a ${e.name.toLowerCase()} further down the trail… you never reached it.`;
    else if (run.enc === 'camp') encLine = run.chestsOpened ? 'You looted the abandoned camp.' : 'You walked past the abandoned camp without opening the chest.';
    else if (run.won) encLine = `${e.name} defeated!`;
    else if (penalty) encLine = 'The goblins chased you off. You dropped half your backpack.';
    else encLine = `You backed away from the ${e.name.toLowerCase()} before they noticed you.`;

    const rows = BAG_TYPES.map(t => {
      const got = run.backpack[t] + lost[t];
      return `<tr><td>${label(t)}</td><td>${got}</td>
        <td class="${lost[t] ? 'neg' : ''}">${lost[t] ? '−' + lost[t] : '–'}</td>
        <td class="${run.backpack[t] ? 'pos' : ''}">+${run.backpack[t]}</td></tr>`;
    }).join('');
    const notes = [];
    if (run.overflow) notes.push(`${run.overflow} more didn't fit in your backpack.`);
    if (run.weaponsUsed) notes.push(`Weapons used: ${run.weaponsUsed}.`);
    document.getElementById('summary-title').textContent = title;
    document.getElementById('summary-body').innerHTML = `
      <p class="sum-enc">${encLine}</p>
      <table class="sum-table">
        <thead><tr><th></th><th>Backpack</th><th>Lost</th><th>Banked</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${run.spoils.length ? `<div class="sum-spoils"><b>Goblin spoils</b><br>${run.spoils.join('<br>')}</div>` : ''}
      ${notes.length ? `<p class="sum-notes">${notes.join('<br>')}</p>` : ''}`;
    document.getElementById('summary').classList.remove('hidden');
  }

  // ---------- input ----------
  function cellFromEvent(e) {
    const rect = boardEl.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / rect.width * SIZE);
    const r = Math.floor((e.clientY - rect.top) / rect.height * SIZE);
    return inBounds(r, c) ? [r, c] : null;
  }

  function onDown(e) {
    if (busy || !run || run.ended) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    pointer = { cell, x: e.clientX, y: e.clientY, done: false };
    try { boardEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  }

  function onMove(e) {
    if (!pointer || pointer.done || armed) return;
    const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
    const threshold = boardEl.getBoundingClientRect().width / SIZE * 0.35;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    pointer.done = true;
    const [r, c] = pointer.cell;
    const target = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    selected = null;
    go(trySwap([r, c], target));
  }

  function onUp() {
    if (!pointer) return;
    const p = pointer;
    pointer = null;
    if (!p.done) onTap(p.cell);
  }

  function onTap([r, c]) {
    if (busy || run.ended || run.moves <= 0) return;
    const t = grid[r][c];
    if (armed) { go(useWeapon(r, c)); return; }
    if (isPiece(t)) {
      const p = t.piece;
      toast(p.kind === 'chest' ? 'Match next to the chest to open it.'
        : p.kind === 'trap' ? 'A pit trap! Matching next to it costs a move.'
        : `Match next to the ${p.kind} to damage it.`);
      return;
    }
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) { selected = null; render(); return; }
      if (Math.abs(sr - r) + Math.abs(sc - c) === 1) { go(trySwap([sr, sc], [r, c])); return; }
    }
    selected = [r, c];
    render();
  }

  // ---------- public ----------
  function init() {
    boardEl = document.getElementById('board');
    fxEl = document.getElementById('board-fx');
    toastEl = document.getElementById('toast');
    boardEl.addEventListener('pointerdown', onDown);
    boardEl.addEventListener('pointermove', onMove);
    boardEl.addEventListener('pointerup', onUp);
    boardEl.addEventListener('pointercancel', () => { pointer = null; });
    document.getElementById('forest-exit').onclick = () => {
      if (!run || run.ended || busy) return;
      finish(fightOn() ? 'flee' : 'home');
    };
    document.getElementById('sum-again').onclick = () => start();
    document.getElementById('sum-home').onclick = () => App.go('home');
    document.getElementById('bp-cap').textContent = BACKPACK;
  }

  function start() {
    session++;
    els.forEach(el => el.remove()); els.clear();
    pieceEls.forEach(el => el.remove()); pieceEls.clear();
    fxEl.innerHTML = '';
    document.getElementById('summary').classList.add('hidden');
    busy = false; selected = null; armed = null; pointer = null;

    const key = rollEncounter();
    run = {
      enc: key, moves: MOVES, backpack: zero(), gathered: zero(), overflow: 0,
      matchesSinceWalk: 0, rowsWalked: 0, encQueue: [...ENCOUNTERS[key].rows],
      pieces: [], revealed: false, trailDone: false, attacked: false, won: false, ended: false,
      fullWarned: false, chestsOpened: 0, spoils: [], weaponsUsed: 0,
    };
    const skip = App.state.debug.skipWalk && run.encQueue.length;

    for (let tries = 0; ; tries++) {
      grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
      run.pieces = [];
      if (skip) ENCOUNTERS[key].rows.forEach((row, i) => placeRow(row, i));
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (!grid[r][c]) grid[r][c] = newTile(safeType(r, c));
      if ((!findRuns().length && hasMove()) || tries > 50) break;
    }
    if (skip) { run.encQueue = []; run.trailDone = true; }

    hud(); hudBackpack(); renderWeapons(); render(); updateExitButton();
    if (skip) onReveal();
    else toast(`Into the forest… carry up to ${BACKPACK} resources home.`);
  }

  // Hook for automated testing / debugging in the console.
  const debug = {
    grid: () => grid, findRuns, hasMove, get run() { return run; }, get busy() { return busy; },
  };

  return { init, start, debug };
})();
