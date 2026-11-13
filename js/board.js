// Shared match-3 board engine used by the forest (gathering) and battle boards.
// Grid cells hold a tile {id, type}, a piece cell {type: 'piece', piece}, or null.
// Pieces are fixed objects (keep, fence, fog…) that tiles fall past.
window.Board = (() => {
  const ABORT = Symbol('abort');
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let nextId = 1;

  const WEAPON_HINTS = {
    club: 'Club: tap a tile to clear it.',
    sling: 'Sling: tap any tile or defense to hit it.',
    firepot: 'Firepot: tap a spot to blast a 3x3 area.',
    shiv: 'Shiv: tap a tile to clear it.',
  };

  class Board {
    constructor({ rows, cols, wrap, randType, hooks }) {
      this.rows = rows;
      this.cols = cols;
      this.wrap = wrap;
      this.el = wrap.querySelector('.board');
      this.fx = wrap.querySelector('.board-fx');
      this.toastEl = wrap.querySelector('.toast');
      this.randType = randType;
      this.hooks = hooks;
      this.grid = [];
      this.els = new Map();
      this.pieceEls = new Map();
      this.pieces = [];
      this.session = 0;
      this.busy = false;
      this.selected = null;
      this.pointer = null;
      this.armed = null;
      this.tray = null;
      wrap.style.setProperty('--rows', rows);
      wrap.style.setProperty('--cols', cols);

      this.lines = [];
      for (let r = 0; r < rows; r++) this.lines.push(Array.from({ length: cols }, (_, c) => [r, c]));
      for (let c = 0; c < cols; c++) this.lines.push(Array.from({ length: rows }, (_, r) => [r, c]));

      this.el.addEventListener('pointerdown', e => this.onDown(e));
      this.el.addEventListener('pointermove', e => this.onMoveEvt(e));
      this.el.addEventListener('pointerup', () => this.onUp());
      this.el.addEventListener('pointercancel', () => { this.pointer = null; });
    }

    // ---------- basics ----------
    static get ABORT() { return ABORT; }
    inBounds(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
    isPiece(t) { return !!t && t.type === 'piece'; }
    isTile(t) { return !!t && t.type !== 'piece'; }
    at([r, c]) { return this.grid[r][c]; }
    newTile(type) { return { id: nextId++, type: type || this.randType() }; }

    wait(ms) {
      const tok = this.session;
      return new Promise((res, rej) => setTimeout(() => (tok === this.session ? res() : rej(ABORT)), ms));
    }
    run(promise) {
      promise.catch(e => { if (e !== ABORT) console.error(e); this.busy = false; });
    }
    stop() { this.session++; this.busy = false; this.armed = null; this.selected = null; }

    reset() {
      this.stop();
      this.els.forEach(el => el.remove()); this.els.clear();
      this.pieceEls.forEach(el => el.remove()); this.pieceEls.clear();
      this.fx.innerHTML = '';
      this.pieces = [];
      this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    }

    // Fill every empty cell with tiles that don't already match, guaranteeing a move.
    fillEmpty() {
      const empties = [];
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          if (!this.grid[r][c]) empties.push([r, c]);
      for (let tries = 0; tries < 100; tries++) {
        empties.forEach(([r, c]) => { this.grid[r][c] = null; });
        empties.forEach(([r, c]) => { this.grid[r][c] = this.newTile(this.safeType(r, c)); });
        if (this.hasMove()) return;
      }
    }

    // ---------- matching ----------
    runLenThrough(r, c, type) {
      let best = 0;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        let n = 1;
        for (const s of [1, -1]) {
          let rr = r + dr * s, cc = c + dc * s;
          while (this.inBounds(rr, cc) && this.isTile(this.grid[rr][cc]) && this.grid[rr][cc].type === type) {
            n++; rr += dr * s; cc += dc * s;
          }
        }
        best = Math.max(best, n);
      }
      return best;
    }
    safeType(r, c) {
      for (let i = 0; i < 30; i++) {
        const t = this.randType();
        if (this.runLenThrough(r, c, t) < 3) return t;
      }
      return this.randType();
    }

    findRuns() {
      const runs = [];
      for (const line of this.lines) {
        let i = 0;
        while (i < line.length) {
          const t = this.at(line[i]);
          let j = i + 1;
          if (this.isTile(t)) {
            while (j < line.length) {
              const u = this.at(line[j]);
              if (this.isTile(u) && u.type === t.type) j++; else break;
            }
            if (j - i >= 3) runs.push({ type: t.type, cells: line.slice(i, j) });
          }
          i = j;
        }
      }
      return runs;
    }

    swap([r1, c1], [r2, c2]) {
      const t = this.grid[r1][c1];
      this.grid[r1][c1] = this.grid[r2][c2];
      this.grid[r2][c2] = t;
    }

    hasMove() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const r2 = r + dr, c2 = c + dc;
            if (!this.inBounds(r2, c2)) continue;
            const a = this.grid[r][c], b = this.grid[r2][c2];
            if (!this.isTile(a) || !this.isTile(b) || a.type === b.type) continue;
            this.swap([r, c], [r2, c2]);
            const ok = this.runLenThrough(r, c, b.type) >= 3 || this.runLenThrough(r2, c2, a.type) >= 3;
            this.swap([r, c], [r2, c2]);
            if (ok) return true;
          }
        }
      }
      return false;
    }

    // Tiles fall past fixed pieces; new tiles drop in from above the board.
    collapse() {
      for (let c = 0; c < this.cols; c++) {
        const free = [];
        for (let r = this.rows - 1; r >= 0; r--) if (!this.isPiece(this.grid[r][c])) free.push(r);
        const tiles = free.map(r => this.grid[r][c]).filter(Boolean);
        const fresh = free.length - tiles.length;
        free.forEach((r, i) => {
          if (i < tiles.length) this.grid[r][c] = tiles[i];
          else { const t = this.newTile(); t.fromRow = r - fresh; this.grid[r][c] = t; }
        });
      }
    }

    shuffle() {
      const spots = [];
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          if (this.isTile(this.grid[r][c])) spots.push([r, c]);
      const tiles = spots.map(p => this.at(p));
      for (let tries = 0; tries < 300; tries++) {
        for (let i = tiles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        spots.forEach(([r, c], i) => { this.grid[r][c] = tiles[i]; });
        if (!this.findRuns().length && this.hasMove()) return;
      }
      for (let tries = 0; tries < 300; tries++) {
        spots.forEach(([r, c]) => { this.grid[r][c] = this.newTile(this.safeType(r, c)); });
        if (this.hasMove()) return;
      }
    }

    async ensurePlayable() {
      if (this.hasMove()) return;
      this.toast('No moves on the board — shuffling!');
      await this.wait(600);
      this.shuffle();
      this.render();
      await this.wait(350);
    }

    // ---------- pieces ----------
    addPiece(spec, r, c, w = 1, appear = false) {
      const p = { id: nextId++, ...spec, maxHp: spec.hp, r, c, w, gone: false, appear };
      for (let i = 0; i < w; i++) this.grid[r][c + i] = { type: 'piece', piece: p };
      this.pieces.push(p);
      return p;
    }

    removePiece(p, cls = 'broken') {
      if (p.gone) return;
      p.gone = true;
      this.pieces = this.pieces.filter(x => x !== p);
      for (let i = 0; i < p.w; i++) {
        const cell = this.grid[p.r][p.c + i];
        if (this.isPiece(cell) && cell.piece === p) this.grid[p.r][p.c + i] = null;
      }
      const el = this.pieceEls.get(p.id);
      if (el) { this.pieceEls.delete(p.id); el.classList.add(cls); setTimeout(() => el.remove(), 450); }
    }

    // Damage a piece. Returns true if it was destroyed (and removed).
    hurt(p, n = 1) {
      if (p.gone || p.hp <= 0) return false;
      p.hp = Math.max(0, p.hp - n);
      const el = this.pieceEls.get(p.id);
      if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      if (p.hp <= 0) { this.removePiece(p); return true; }
      this.renderPieces();
      return false;
    }

    piecesOf(kind) { return this.pieces.filter(p => p.kind === kind); }
    tileCells(filter = () => true) {
      const out = [];
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          if (this.isTile(this.grid[r][c]) && filter(r, c)) out.push([r, c]);
      return out;
    }

    // ---------- rendering ----------
    pos(r, c) { return `translate(${c * 100}%, ${r * 100}%)`; }

    render() {
      const live = new Set();
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const t = this.grid[r][c];
          if (!this.isTile(t)) continue;
          live.add(t.id);
          let el = this.els.get(t.id);
          if (!el) {
            el = document.createElement('div');
            el.className = 'tile';
            el.innerHTML = `<div class="gem g-${t.type}"></div>`;
            this.els.set(t.id, el);
            this.el.appendChild(el);
            if (t.fromRow !== undefined) {
              el.style.transform = this.pos(t.fromRow, c);
              el.getBoundingClientRect();   // force layout so the fall animates
            }
          }
          delete t.fromRow;
          el.style.transform = this.pos(r, c);
          el.classList.toggle('sel', !!this.selected && this.selected[0] === r && this.selected[1] === c);
        }
      }
      this.els.forEach((el, id) => { if (!live.has(id)) { el.remove(); this.els.delete(id); } });
      this.renderPieces();
    }

    renderPieces() {
      const canHitPieces = this.armed && this.armed !== 'club' && this.armed !== 'shiv';
      for (const p of this.pieces) {
        let el = this.pieceEls.get(p.id);
        if (!el) {
          el = document.createElement('div');
          el.className = `piece p-${p.kind}` + (p.appear ? ' appear' : '');
          el.innerHTML = '<div class="pc"><span class="pl"></span><span class="hp"></span></div>';
          this.pieceEls.set(p.id, el);
          this.el.appendChild(el);
        }
        el.style.left = (p.c / this.cols * 100) + '%';
        el.style.top = (p.r / this.rows * 100) + '%';
        el.style.width = (p.w / this.cols * 100) + '%';
        el.querySelector('.pl').textContent = p.label || '';
        el.querySelector('.hp').textContent = p.maxHp > 1 ? '♥'.repeat(p.hp) + '♡'.repeat(p.maxHp - p.hp) : '';
        el.classList.toggle('target', !!canHitPieces);
      }
    }

    gemAt(r, c) {
      const t = this.grid[r][c];
      const el = this.isTile(t) && this.els.get(t.id);
      return el ? el.firstChild : null;
    }
    popCells(keys) {
      keys.forEach(k => {
        const g = this.gemAt(Math.floor(k / this.cols), k % this.cols);
        if (g) g.classList.add('pop');
      });
    }

    float([r, c], text, cls = 'gain', delay = 0) {
      const d = document.createElement('div');
      d.className = 'float ' + cls;
      d.textContent = text;
      d.style.left = (Math.min(Math.max(c, 0.6), this.cols - 1.6) / this.cols * 100) + '%';
      d.style.top = (Math.max(r, 0.3) / this.rows * 100) + '%';
      if (delay) d.style.animationDelay = delay + 'ms';
      d.style.opacity = 0;
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 1200 + delay);
    }

    toast(msg, kind = '', ms = 1900) {
      this.toastEl.textContent = msg;
      this.toastEl.className = 'toast show ' + kind;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
    }

    smoke() {
      const s = document.createElement('div');
      s.className = 'smoke';
      this.fx.appendChild(s);
      setTimeout(() => s.remove(), 2300);
    }

    // ---------- weapons ----------
    renderWeapons(tray) {
      if (tray) this.tray = tray;
      if (!this.tray) return;
      const inv = App.state.inventory;
      const keys = Object.keys(App.ITEMS).filter(k => App.ITEMS[k].weapon && (inv[k] > 0 || !App.ITEMS[k].spoil));
      this.tray.innerHTML = keys.map(k => {
        const it = App.ITEMS[k];
        return `<button class="weapon${this.armed === k ? ' armed' : ''}" data-w="${k}" ${inv[k] > 0 ? '' : 'disabled'}>
          ${it.icon} ${it.name.replace('Goblin ', '')} ${it.uses ? inv[k] + '⚔' : '×' + inv[k]}</button>`;
      }).join('');
      this.tray.querySelectorAll('.weapon').forEach(b => { b.onclick = () => this.arm(b.dataset.w); });
    }

    arm(k) {
      if (this.busy || !this.hooks.canPlay()) return;
      this.armed = this.armed === k ? null : k;
      this.selected = null;
      this.renderWeapons(); this.render();
      this.hooks.onArm?.();
    }

    armedHint() {
      return this.armed ? WEAPON_HINTS[this.armed] + ' Tap the weapon again to cancel.' : '';
    }

    async useWeapon(r, c) {
      const w = this.armed;
      const t = this.grid[r][c];
      if ((w === 'club' || w === 'shiv') && this.isPiece(t)) {
        this.toast(`The ${App.ITEMS[w].name.replace('Goblin ', '')} can't hurt that — use the Sling or a Firepot.`);
        return;
      }
      this.busy = true;
      this.armed = null;
      App.state.inventory[w]--;
      App.save();
      this.hooks.onWeaponUsed?.(w);
      this.renderWeapons();
      this.hooks.onArm?.();

      const cells = w === 'firepot'
        ? [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => [r + dr, c + dc])).filter(([a, b]) => this.inBounds(a, b))
        : [[r, c]];
      const clear = new Set();
      const hit = new Set();
      cells.forEach(([a, b]) => {
        const x = this.grid[a][b];
        if (this.isTile(x)) clear.add(a * this.cols + b);
        else if (this.isPiece(x)) hit.add(x.piece);
      });
      if (w === 'firepot') this.toast('BOOM!');
      hit.forEach(p => this.hooks.onPieceHit(p, 1, 'weapon'));
      this.popCells(clear);
      this.render();
      await this.wait(250);
      clear.forEach(k => {
        const rr = Math.floor(k / this.cols), cc = k % this.cols;
        if (this.isTile(this.grid[rr][cc])) this.grid[rr][cc] = null;
      });
      this.collapse(); this.render();
      await this.wait(330);
      await this.resolve();
      await this.ensurePlayable();
      await this.hooks.afterAction(false);
      this.busy = false;
    }

    // ---------- turn flow ----------
    async resolve() {
      let step = 0;
      for (;;) {
        const runs = this.findRuns();
        if (!runs.length) return;
        step++;
        const clear = new Set();
        const hits = new Map();
        for (const ri of runs) {
          ri.cells.forEach(([r, c]) => clear.add(r * this.cols + c));
          const adj = new Set();
          ri.cells.forEach(([r, c]) => DIRS.forEach(([dr, dc]) => {
            const r2 = r + dr, c2 = c + dc;
            if (this.inBounds(r2, c2) && this.isPiece(this.grid[r2][c2])) adj.add(this.grid[r2][c2].piece);
          }));
          adj.forEach(p => hits.set(p, (hits.get(p) || 0) + 1));
        }
        this.hooks.onMatch?.(runs, step);
        hits.forEach((n, p) => { if (!p.gone) this.hooks.onPieceHit(p, n, 'match'); });
        this.popCells(clear);
        await this.wait(220);
        clear.forEach(k => {
          const r = Math.floor(k / this.cols), c = k % this.cols;
          if (this.isTile(this.grid[r][c])) this.grid[r][c] = null;
        });
        this.collapse();
        this.render();
        await this.wait(330);
      }
    }

    async trySwap(a, b) {
      if (this.busy || !this.hooks.canPlay()) return;
      if (!this.inBounds(...b)) return;
      if (!this.isTile(this.at(a)) || !this.isTile(this.at(b))) {
        this.toast('That won\'t move — match next to it!');
        return;
      }
      this.busy = true;
      this.selected = null;
      this.swap(a, b); this.render();
      await this.wait(200);
      if (!this.findRuns().length) {
        this.swap(a, b); this.render();
        await this.wait(220);
        this.busy = false;
        return;
      }
      this.hooks.onMove();
      await this.resolve();
      await this.ensurePlayable();
      await this.hooks.afterAction(true);
      this.busy = false;
    }

    // ---------- input ----------
    cellFromEvent(e) {
      const rect = this.el.getBoundingClientRect();
      const c = Math.floor((e.clientX - rect.left) / rect.width * this.cols);
      const r = Math.floor((e.clientY - rect.top) / rect.height * this.rows);
      return this.inBounds(r, c) ? [r, c] : null;
    }
    onDown(e) {
      if (this.busy || !this.hooks.canPlay()) return;
      const cell = this.cellFromEvent(e);
      if (!cell) return;
      this.pointer = { cell, x: e.clientX, y: e.clientY, done: false };
      try { this.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }
    onMoveEvt(e) {
      const p = this.pointer;
      if (!p || p.done || this.armed) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      const threshold = this.el.getBoundingClientRect().width / this.cols * 0.35;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      p.done = true;
      const [r, c] = p.cell;
      const target = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
      this.selected = null;
      this.run(this.trySwap([r, c], target));
    }
    onUp() {
      const p = this.pointer;
      this.pointer = null;
      if (p && !p.done) this.onTap(p.cell);
    }
    onTap([r, c]) {
      if (this.busy || !this.hooks.canPlay()) return;
      if (this.armed) { this.run(this.useWeapon(r, c)); return; }
      const t = this.grid[r][c];
      if (this.isPiece(t)) { this.hooks.onPieceTap?.(t.piece); return; }
      if (this.selected) {
        const [sr, sc] = this.selected;
        if (sr === r && sc === c) { this.selected = null; this.render(); return; }
        if (Math.abs(sr - r) + Math.abs(sc - c) === 1) { this.run(this.trySwap([sr, sc], [r, c])); return; }
      }
      this.selected = [r, c];
      this.render();
    }
  }

  return Board;
})();
