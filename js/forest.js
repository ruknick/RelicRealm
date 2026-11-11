// Forest level: 7x7 match-3 gathering + goblin ambush event.
window.Forest = (() => {
  const SIZE = 7;
  const MOVES = 20;
  const GOLD_CHANCE = 0.03;
  const GOBLIN_CHANCE = 0.08;   // per move
  const MAX_GOBLINS = 3;
  const BASIC = ['wood', 'stone', 'hide'];
  const ALL_RES = ['wood', 'stone', 'hide', 'gold'];
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const points = len => (len >= 5 ? 9 : len === 4 ? 6 : 3);

  // Every row and column as a list of [r, c] – used for run detection.
  const LINES = [];
  for (let r = 0; r < SIZE; r++) LINES.push(Array.from({ length: SIZE }, (_, c) => [r, c]));
  for (let c = 0; c < SIZE; c++) LINES.push(Array.from({ length: SIZE }, (_, r) => [r, c]));

  const ABORT = Symbol('abort');
  let session = 0;

  let grid = [];
  const els = new Map();       // tile id -> DOM element
  let nextId = 1;
  let movesLeft = MOVES;
  let busy = false;
  let selected = null;         // [r, c]
  let armed = null;            // weapon key
  let stats = null;
  let pointer = null;
  let boardEl, fxEl, toastEl, toastTimer;

  // ---------- helpers ----------
  const rnd = n => Math.floor(Math.random() * n);
  const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const label = t => App.RESOURCES[t].label;
  const zero = () => ({ wood: 0, stone: 0, hide: 0, gold: 0 });
  const isGoblin = t => t && t.type === 'goblin';

  function wait(tok, ms) {
    return new Promise((res, rej) => setTimeout(() => (tok === session ? res() : rej(ABORT)), ms));
  }
  function run(promise) {
    promise.catch(e => { if (e !== ABORT) console.error(e); });
  }
  function randType() {
    return Math.random() < GOLD_CHANCE ? 'gold' : BASIC[rnd(BASIC.length)];
  }
  function newTile(type) {
    return { id: nextId++, type: type || randType() };
  }

  // ---------- board logic ----------
  function makeBoard() {
    for (;;) {
      grid = [];
      for (let r = 0; r < SIZE; r++) {
        grid.push([]);
        for (let c = 0; c < SIZE; c++) {
          let t;
          do { t = randType(); } while (
            (c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) ||
            (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t)
          );
          grid[r].push(newTile(t));
        }
      }
      if (hasMove()) return;
    }
  }

  function findRuns() {
    const runs = [];
    for (const line of LINES) {
      let i = 0;
      while (i < SIZE) {
        const [r, c] = line[i];
        const t = grid[r][c];
        let j = i + 1;
        const ok = t && t.type !== 'goblin';
        if (ok) {
          while (j < SIZE) {
            const [r2, c2] = line[j];
            const u = grid[r2][c2];
            if (u && u.type === t.type) j++; else break;
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
          if (isGoblin(a) || isGoblin(b) || a.type === b.type) continue;
          swap([r, c], [r2, c2]);
          const ok = findRuns().length > 0;
          swap([r, c], [r2, c2]);
          if (ok) return true;
        }
      }
    }
    return false;
  }

  function collapse() {
    for (let c = 0; c < SIZE; c++) {
      let write = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--) {
        if (grid[r][c]) {
          if (write !== r) { grid[write][c] = grid[r][c]; grid[r][c] = null; }
          write--;
        }
      }
      const empty = write + 1;
      for (let r = write; r >= 0; r--) {
        const t = newTile();
        t.fromRow = r - empty;   // start above the board and fall in
        grid[r][c] = t;
      }
    }
  }

  function shuffle() {
    const spots = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (!isGoblin(grid[r][c])) spots.push([r, c]);
    const tiles = spots.map(([r, c]) => grid[r][c]);
    for (let tries = 0; tries < 300; tries++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = rnd(i + 1);
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      spots.forEach(([r, c], i) => { grid[r][c] = tiles[i]; });
      if (!findRuns().length && hasMove()) return;
    }
    // Fallback: brand-new tiles in the non-goblin spots.
    for (;;) {
      spots.forEach(([r, c]) => { grid[r][c] = newTile(); });
      if (!findRuns().length && hasMove()) return;
    }
  }

  function goblinCells() {
    const out = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (isGoblin(grid[r][c])) out.push([r, c]);
    return out;
  }

  // ---------- rendering ----------
  const pos = (r, c) => `translate(${c * 100}%, ${r * 100}%)`;

  function render() {
    const live = new Set();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (!t) continue;
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
            el.getBoundingClientRect(); // force layout so the fall animates
          } else if (t.type === 'goblin') {
            el.firstChild.classList.add('spawn');
          }
        }
        delete t.fromRow;
        el.style.transform = pos(r, c);
        el.classList.toggle('sel', !!selected && selected[0] === r && selected[1] === c);
        el.firstChild.classList.toggle('target', !!armed && t.type === 'goblin');
      }
    }
    els.forEach((el, id) => { if (!live.has(id)) { el.remove(); els.delete(id); } });
  }

  function gemAt(r, c) {
    const t = grid[r][c];
    const el = t && els.get(t.id);
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
    d.style.left = (c / SIZE * 100) + '%';
    d.style.top = (r / SIZE * 100) + '%';
    if (delay) d.style.animationDelay = delay + 'ms';
    d.style.opacity = 0;
    fxEl.appendChild(d);
    setTimeout(() => d.remove(), 1200 + delay);
  }

  function toast(msg, alert = false) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('alert', alert);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1900);
  }

  function hud() {
    document.getElementById('moves').textContent = movesLeft;
    document.querySelector('.moves').classList.toggle('low', movesLeft <= 5);
  }

  function renderWeapons() {
    const tray = document.getElementById('weapon-tray');
    const inv = App.state.inventory;
    const weapons = Object.keys(App.ITEMS).filter(k => App.ITEMS[k].weapon);
    tray.innerHTML = weapons.map(k => {
      const it = App.ITEMS[k];
      return `<button class="weapon${armed === k ? ' armed' : ''}" data-w="${k}" ${inv[k] > 0 ? '' : 'disabled'}>
        ${it.icon} ${it.name} ×${inv[k]}</button>`;
    }).join('');
    tray.querySelectorAll('.weapon').forEach(b => { b.onclick = () => armWeapon(b.dataset.w); });
    document.getElementById('forest-hint').textContent = armed
      ? `Tap a goblin to hit it with your ${App.ITEMS[armed].name}. Tap the weapon again to cancel.`
      : 'Swap adjacent tiles to match 3+. Swipe or tap two tiles.';
  }

  // ---------- game flow ----------
  function gain(type, n, cell, cls = 'gain', delay = 0) {
    App.addResource(type, n);
    floatText(cell, `+${n} ${label(type)}`, type === 'gold' ? 'gold' : cls, delay);
  }

  function defeatGoblin(r, c) {
    stats.goblins++;
    // Small bonus drop: +2 of two random basic resources, sometimes +1 gold.
    const picks = [...BASIC].sort(() => Math.random() - 0.5).slice(0, 2);
    picks.forEach((t, i) => { gain(t, 2, [r, c], 'bonus', i * 250); stats.bonus[t] += 2; });
    if (Math.random() < 0.3) { gain('gold', 1, [r, c], 'gold', 500); stats.bonus.gold += 1; }
    toast('Goblin defeated! Bonus loot!');
  }

  async function resolve(tok) {
    for (;;) {
      const runs = findRuns();
      if (!runs.length) return;
      const clear = new Set();
      for (const runInfo of runs) {
        const pts = points(runInfo.cells.length);
        stats.collected[runInfo.type] += pts;
        const mid = runInfo.cells[Math.floor(runInfo.cells.length / 2)];
        gain(runInfo.type, pts, mid);
        runInfo.cells.forEach(([r, c]) => clear.add(r * SIZE + c));
      }
      // Fight: any goblin touching a matched tile is defeated.
      const hit = new Set();
      clear.forEach(k => {
        const r = Math.floor(k / SIZE), c = k % SIZE;
        for (const [dr, dc] of DIRS) {
          const r2 = r + dr, c2 = c + dc;
          if (inBounds(r2, c2) && isGoblin(grid[r2][c2])) hit.add(r2 * SIZE + c2);
        }
      });
      hit.forEach(k => { defeatGoblin(Math.floor(k / SIZE), k % SIZE); clear.add(k); });

      popCells(clear);
      await wait(tok, 220);
      clear.forEach(k => { grid[Math.floor(k / SIZE)][k % SIZE] = null; });
      collapse();
      render();
      await wait(tok, 330);
    }
  }

  async function ensurePlayable(tok) {
    if (hasMove()) return;
    toast('No moves on the board — shuffling!');
    await wait(tok, 600);
    shuffle();
    render();
    await wait(tok, 350);
  }

  async function endOfMove(tok) {
    // Goblins already on the board steal first…
    const gobs = goblinCells();
    for (const [r, c] of gobs) {
      const g = gemAt(r, c);
      if (g) { g.classList.remove('steal'); void g.offsetWidth; g.classList.add('steal'); }
      const pool = ALL_RES.filter(t => App.state.stockpile[t] > 0);
      if (!pool.length) { floatText([r, c], 'Nothing to steal', 'loss'); continue; }
      const t = pool[rnd(pool.length)];
      App.addResource(t, -1);
      stats.stolen[t]++;
      floatText([r, c], `-1 ${label(t)}`, 'loss');
    }
    if (gobs.length) await wait(tok, 400);

    // …then a new goblin may ambush.
    if (movesLeft > 0 && gobs.length < MAX_GOBLINS && Math.random() < GOBLIN_CHANCE) {
      const spots = [];
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (!isGoblin(grid[r][c])) spots.push([r, c]);
      const [r, c] = spots[rnd(spots.length)];
      grid[r][c] = newTile('goblin');
      stats.goblinsSeen++;
      render();
      toast('Goblins spotted! They steal every move.', true);
      boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake');
      await wait(tok, 450);
    }

    await ensurePlayable(tok);

    if (movesLeft <= 0) {
      await wait(tok, 500);
      showSummary();
    }
  }

  async function trySwap(a, b) {
    if (busy || movesLeft <= 0) return;
    if (!inBounds(...b)) return;
    if (isGoblin(grid[a[0]][a[1]]) || isGoblin(grid[b[0]][b[1]])) {
      toast("Goblins won't budge — match next to them!");
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
    movesLeft--; hud();
    await resolve(tok);
    await endOfMove(tok);
    busy = false;
  }

  function armWeapon(k) {
    if (busy || movesLeft <= 0) return;
    if (armed === k) { armed = null; }
    else if (!goblinCells().length) { toast('No goblins on the board right now.'); return; }
    else { armed = k; selected = null; }
    renderWeapons(); render();
  }

  async function useWeapon(r, c) {
    const tok = session;
    busy = true;
    const w = armed;
    armed = null;
    App.state.inventory[w]--;
    App.save();
    stats.weaponsUsed++;
    renderWeapons();
    defeatGoblin(r, c);
    toast(`${App.ITEMS[w].name} hit! Goblin defeated!`);
    popCells([r * SIZE + c]);
    render();
    await wait(tok, 250);
    grid[r][c] = null;
    collapse(); render();
    await wait(tok, 330);
    await resolve(tok);      // free cascades, no move spent
    await ensurePlayable(tok);
    busy = false;
  }

  function showSummary() {
    const rows = ALL_RES.map(t => {
      const got = stats.collected[t] + stats.bonus[t];
      const lost = stats.stolen[t];
      const net = got - lost;
      return `<tr><td>${label(t)}</td><td>${stats.collected[t]}</td><td>${stats.bonus[t] || '–'}</td>
        <td class="${lost ? 'neg' : ''}">${lost ? '−' + lost : '–'}</td>
        <td class="${net > 0 ? 'pos' : net < 0 ? 'neg' : ''}">${net > 0 ? '+' : ''}${net}</td></tr>`;
    }).join('');
    const left = goblinCells().length;
    const notes = [
      `Goblins: ${stats.goblinsSeen} appeared, ${stats.goblins} defeated` +
        (stats.weaponsUsed ? ` (${stats.weaponsUsed} with weapons)` : '') + '.',
      left ? `${left} goblin${left > 1 ? 's' : ''} ran off into the woods.` : '',
    ].filter(Boolean).join('<br>');
    document.getElementById('summary-body').innerHTML = `
      <table class="sum-table">
        <thead><tr><th></th><th>Matched</th><th>Bonus</th><th>Stolen</th><th>Net</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="sum-notes">${notes}</p>`;
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
    if (busy || movesLeft <= 0) return;
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
    run(trySwap([r, c], target));
  }

  function onUp() {
    if (!pointer) return;
    const p = pointer;
    pointer = null;
    if (!p.done) onTap(p.cell);
  }

  function onTap([r, c]) {
    if (busy || movesLeft <= 0) return;
    const t = grid[r][c];
    if (armed) {
      if (isGoblin(t)) run(useWeapon(r, c));
      else toast(`Tap a goblin to use your ${App.ITEMS[armed].name}.`);
      return;
    }
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) { selected = null; render(); return; }
      if (Math.abs(sr - r) + Math.abs(sc - c) === 1) { run(trySwap([sr, sc], [r, c])); return; }
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
    document.getElementById('forest-quit').onclick = () => { session++; App.go('home'); };
    document.getElementById('sum-again').onclick = () => start();
    document.getElementById('sum-home').onclick = () => { session++; App.go('home'); };
  }

  function start() {
    session++;
    els.forEach(el => el.remove());
    els.clear();
    fxEl.innerHTML = '';
    document.getElementById('summary').classList.add('hidden');
    movesLeft = MOVES;
    busy = false; selected = null; armed = null; pointer = null;
    stats = { collected: zero(), bonus: zero(), stolen: zero(), goblins: 0, goblinsSeen: 0, weaponsUsed: 0 };
    makeBoard();
    hud(); renderWeapons(); render();
    toast(`Gather resources! ${MOVES} moves.`);
  }

  // Small hook for automated testing / debugging in the console.
  const debug = { grid: () => grid, findRuns, hasMove, get busy() { return busy; }, get moves() { return movesLeft; },
    spawnGoblin(r = 3, c = 3) { grid[r][c] = newTile('goblin'); render(); } };

  return { init, start, debug };
})();
