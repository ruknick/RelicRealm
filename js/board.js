// Shared match-3 board engine used by the forest (gathering) and battle boards.
// Grid cells hold a tile {id, type}, a piece cell {type: 'piece', piece}, or null.
// Pieces are fixed objects (keep, fence, fog…) that tiles fall past.
window.Board = (() => {
  const ABORT = Symbol('abort');
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const WILD = 'star';
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
      if (!wrap.querySelector('.frame')) wrap.insertAdjacentHTML('afterbegin', '<div class="frame"></div>');
      this.frameEl = wrap.querySelector('.frame');
      this.celebrateQ = Promise.resolve();
      this.celebrating = 0;
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
    stop() { this.session++; this.busy = false; this.armed = null; this.selected = null; this.clearHint(); }

    reset() {
      this.stop();
      this.els.forEach(el => el.remove()); this.els.clear();
      this.pieceEls.forEach(el => el.remove()); this.pieceEls.clear();
      this.fx.innerHTML = '';
      this.pieces = [];
      this.buried = new Map();
      this.showBuried = false;
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
    // A "star" tile is wild: it counts as whatever type it sits next to.
    // One star can complete two different runs (e.g. wood-wood-★-stone-stone).
    scanLine(line, runs) {
      const isWild = t => t.type === WILD;
      let i = 0;
      while (i < line.length) {
        const t = this.at(line[i]);
        if (!this.isTile(t)) { i++; continue; }
        let type = isWild(t) ? null : t.type;
        let j = i + 1;
        while (j < line.length) {
          const u = this.at(line[j]);
          if (!this.isTile(u)) break;
          if (isWild(u)) { j++; continue; }
          if (type === null) { type = u.type; j++; continue; }
          if (u.type === type) { j++; continue; }
          break;
        }
        if (j - i >= 3) runs.push({ type: type || WILD, cells: line.slice(i, j) });
        // Let trailing stars start the next run too.
        let k = j;
        while (k > i + 1 && isWild(this.at(line[k - 1]))) k--;
        i = (k < j && j - i >= 1) ? Math.max(k, i + 1) : j;
      }
      return runs;
    }

    findRuns() {
      const runs = [];
      for (const line of this.lines) this.scanLine(line, runs);
      return runs;
    }

    // Is (r, c) part of a 3+ run right now? Only scans its row and column.
    matchAt(r, c) {
      const runs = [];
      this.scanLine(this.lines[r], runs);
      this.scanLine(this.lines[this.rows + c], runs);
      return runs.some(ru => ru.cells.some(([a, b]) => a === r && b === c));
    }

    safeType(r, c) {
      const prev = this.grid[r][c];
      let pick = this.randType();
      for (let i = 0; i < 30; i++) {
        const t = this.randType();
        this.grid[r][c] = { type: t };
        const bad = this.matchAt(r, c);
        if (!bad) { pick = t; break; }
      }
      this.grid[r][c] = prev;
      return pick;
    }

    swap([r1, c1], [r2, c2]) {
      const t = this.grid[r1][c1];
      this.grid[r1][c1] = this.grid[r2][c2];
      this.grid[r2][c2] = t;
    }

    hasMove() { return !!this.findMove(); }

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
      if (p.hp <= 0) { this.removePiece(p); window.Sound?.sfx('break'); return true; }
      window.Sound?.sfx('hit');
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
            el.innerHTML = `<div class="gem art g-${t.type}">${window.Art ? Art.tile(t.type) : ''}</div>`;
            this.els.set(t.id, el);
            this.el.appendChild(el);
            if (t.fromRow !== undefined) {
              el.style.transform = this.pos(t.fromRow, c);
              el.getBoundingClientRect();   // force layout so the fall animates
            }
          }
          if (t.born) { el.firstChild.classList.add('spawn'); delete t.born; }
          delete t.fromRow;
          el.style.transform = this.pos(r, c);
          el.classList.toggle('sel', !!this.selected && this.selected[0] === r && this.selected[1] === c);
        }
      }
      this.els.forEach((el, id) => { if (!live.has(id)) { el.remove(); this.els.delete(id); } });
      this.renderPieces();
    }

    renderPieces() {
      const W = this.armed && Data.WEAPONS[this.armed];
      const canHit = p => !!W && (p.kind === 'fog' ? !!(W.fog || W.area) : Data.weaponDamage(this.armed, p) > 0);
      for (const p of this.pieces) {
        let el = this.pieceEls.get(p.id);
        if (!el) {
          el = document.createElement('div');
          el.className = `piece p-${p.kind}` + (p.cls ? ` p-${p.cls}` : '') + (p.appear ? ' appear' : '') + (p.art ? ' art' : '');
          el.innerHTML = `<div class="pc">${p.art ? `<div class="pa">${Art.piece(p.art)}</div>` : ''}<span class="pl"></span><span class="hp"></span></div>`;
          this.pieceEls.set(p.id, el);
          this.el.appendChild(el);
        }
        el.style.left = (p.c / this.cols * 100) + '%';
        el.style.top = (p.r / this.rows * 100) + '%';
        el.style.width = (p.w / this.cols * 100) + '%';
        el.querySelector('.pl').textContent = p.label || '';
        el.querySelector('.hp').textContent = p.maxHp > 1 ? '♥'.repeat(p.hp) + '♡'.repeat(p.maxHp - p.hp) : '';
        el.classList.toggle('target', canHit(p));
        el.classList.toggle('locked', !!p.lock);
        el.classList.toggle('wants-key', !!p.keyOnly && App.state.inventory.key > 0);
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

    setFrame(scene) {
      this.wrap.dataset.frame = scene;
      this.frameEl.innerHTML = window.Art ? Art.frame(scene) : '';
    }

    // A dirt burst where something was dug up.
    dirt([r, c]) {
      for (let i = 0; i < 14; i++) {
        const d = document.createElement('div');
        d.className = 'dirt';
        d.style.left = ((c + 0.5) / this.cols * 100) + '%';
        d.style.top = ((r + 0.5) / this.rows * 100) + '%';
        const a = Math.random() * Math.PI * 2, dist = 20 + Math.random() * 45;
        d.style.setProperty('--dx', Math.cos(a) * dist + 'px');
        d.style.setProperty('--dy', Math.sin(a) * dist - 20 + 'px');
        d.style.background = ['#6b4a2b', '#8a6a44', '#4f3820', '#a88b5c'][i % 4];
        this.fx.appendChild(d);
        setTimeout(() => d.remove(), 800);
      }
    }

    // Big "you found something!" moment. Queued so several finds play one after another.
    celebrate(cell, { icon, title, sub = '', rare = false }) {
      this.celebrateQ = this.celebrateQ.then(() => new Promise(done => {
        this.celebrating++;
        this.dirt(cell);
        window.Sound?.sfx(rare ? 'rare' : 'found');
        const [r, c] = cell;
        const d = document.createElement('div');
        d.className = 'celebrate' + (rare ? ' rare' : '');
        d.style.setProperty('--fx', ((c + 0.5) / this.cols * 100) + '%');
        d.style.setProperty('--fy', ((r + 0.5) / this.rows * 100) + '%');
        d.innerHTML = `<div class="cel-rays"></div><div class="cel-icon">${icon}</div>
          <div class="cel-text"><div class="cel-kicker">${rare ? '✦ Rare find ✦' : 'You found'}</div>
          <div class="cel-title">${title}</div><div class="cel-sub">${sub}</div><div class="cel-tap">tap to continue</div></div>`;
        this.wrap.appendChild(d);
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          d.classList.add('out');
          setTimeout(() => { d.remove(); this.celebrating--; done(); }, 280);
        };
        setTimeout(() => d.addEventListener('pointerdown', close), 350);
        setTimeout(close, rare ? 2600 : 2000);
      }));
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
      const keys = Object.keys(Data.ITEMS).filter(k => Data.ITEMS[k].weapon && inv[k] > 0);
      this.tray.innerHTML = keys.length ? keys.map(k => {
        const it = Data.ITEMS[k];
        return `<button class="weapon${this.armed === k ? ' armed' : ''}" data-w="${k}">
          ${it.icon} ${it.name.replace(/^(Goblin|Iron|Old|Dwarven) /, '')} <b>${inv[k]}</b></button>`;
      }).join('') : '<span class="hint">None — craft some in the Workshop.</span>';
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
      if (!this.armed) return '';
      const it = Data.ITEMS[this.armed];
      return `${it.icon} ${it.name}: ${it.desc} Tap a target — tap the weapon again to cancel.`;
    }

    async useWeapon(r, c) {
      const w = this.armed;
      const W = Data.WEAPONS[w];
      const t = this.grid[r][c];
      const name = Data.ITEMS[w].name;
      // Check the target is something this weapon can affect, so a wasted tap doesn't burn a use.
      if (this.isPiece(t) && !W.area) {
        const p = t.piece;
        if (p.kind === 'fog' && !W.fog) { this.toast(`The ${name} can't reach into the fog — try a Sling or Firepot.`); return; }
        if (p.kind !== 'fog' && Data.weaponDamage(w, p) <= 0) {
          this.toast(W.unlock ? 'The key only opens locked chests and iron gates.'
            : `The ${name} does nothing to ${Data.MAT_LABEL[p.mat] || 'that'}!`);
          window.Sound?.sfx('nope');
          return;
        }
      }
      if (W.unlock && !this.isPiece(t)) { this.toast('Tap a locked chest or iron gate.'); return; }
      this.busy = true;
      this.armed = null;
      this.clearHint();
      App.state.inventory[w]--;
      App.save();
      this.hooks.onWeaponUsed?.(w);
      this.renderWeapons();
      this.hooks.onArm?.();

      const cells = W.area
        ? [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => [r + dr, c + dc])).filter(([a, b]) => this.inBounds(a, b))
        : [[r, c]];
      const clear = new Set();
      const hit = new Set();
      cells.forEach(([a, b]) => {
        const x = this.grid[a][b];
        if (this.isTile(x)) clear.add(a * this.cols + b);
        else if (this.isPiece(x)) hit.add(x.piece);
      });
      if (W.area) this.toast('BOOM!');
      hit.forEach(p => {
        if (p.gone) return;
        if (p.kind === 'fog') { if (W.fog) this.hooks.onPieceHit(p, 1, 'weapon', w); return; }
        const dmg = Data.weaponDamage(w, p);
        if (dmg > 0) { this.float([p.r, p.c + Math.floor(p.w / 2)], `−${Math.min(dmg, p.hp)}`, 'loss'); this.hooks.onPieceHit(p, dmg, 'weapon', w); }
      });
      this.popCells(clear);
      this.render();
      window.Sound?.sfx(W.area ? 'blast' : 'hit');
      await this.wait(200);
      this.clearCells(clear);
      this.collapse(); this.render();
      await this.wait(250);
      await this.resolve();
      await this.ensurePlayable();
      await this.hooks.afterAction(false);
      this.busy = false;
      this.scheduleHint();
    }

    // Empty the given tile cells, digging up anything buried there.
    clearCells(keys) {
      keys.forEach(k => {
        const r = Math.floor(k / this.cols), c = k % this.cols;
        if (this.isTile(this.grid[r][c])) this.grid[r][c] = null;
        const bk = `${r},${c}`;
        if (this.buried && this.buried.has(bk)) {
          const f = this.buried.get(bk);
          this.buried.delete(bk);
          this.hooks.onFind?.(f, [r, c]);
          this.renderBuried();
        }
      });
    }

    // Buried finds glimmer when the player owns a Miner's lamp.
    renderBuried() {
      this.fx.querySelectorAll('.glimmer').forEach(e => e.remove());
      if (!this.buried || !this.showBuried) return;
      this.buried.forEach((_, k) => {
        const [r, c] = k.split(',').map(Number);
        const d = document.createElement('div');
        d.className = 'glimmer';
        d.style.left = (c / this.cols * 100) + '%';
        d.style.top = (r / this.rows * 100) + '%';
        d.style.width = (100 / this.cols) + '%';
        d.style.height = (100 / this.rows) + '%';
        this.fx.appendChild(d);
      });
    }

    // Move a piece one cell; the tile it steps onto takes its old place.
    movePiece(p, r, c) {
      const t = this.grid[r][c];
      if (!this.isTile(t) || p.w !== 1) return false;
      this.grid[p.r][p.c] = t;
      this.grid[r][c] = { type: 'piece', piece: p };
      p.r = r; p.c = c;
      this.render();
      return true;
    }

    // ---------- turn flow ----------
    async resolve(swapCells = []) {
      let step = 0;
      for (;;) {
        const runs = this.findRuns();
        if (!runs.length) return;
        step++;
        const clear = new Set();
        const hits = new Map();
        const stars = [];          // 4+ matches leave a wild star behind
        const blasts = [];         // 5+ matches blast their whole row/column
        const hitAdj = (r, c, seen) => DIRS.forEach(([dr, dc]) => {
          const r2 = r + dr, c2 = c + dc;
          if (this.inBounds(r2, c2) && this.isPiece(this.grid[r2][c2])) seen.add(this.grid[r2][c2].piece);
        });
        for (const ri of runs) {
          ri.cells.forEach(([r, c]) => clear.add(r * this.cols + c));
          const adj = new Set();
          ri.cells.forEach(([r, c]) => hitAdj(r, c, adj));
          adj.forEach(p => hits.set(p, (hits.get(p) || 0) + 1));
          if (ri.cells.length >= 4) {
            const mine = ri.cells.find(([r, c]) => swapCells.some(([a, b]) => a === r && b === c));
            stars.push(mine || ri.cells[Math.floor(ri.cells.length / 2)]);
          }
          if (ri.cells.length >= 5) blasts.push(ri);
        }
        for (const ri of blasts) {
          const horiz = ri.cells[0][0] === ri.cells[1][0];
          const line = horiz ? this.lines[ri.cells[0][0]] : this.lines[this.rows + ri.cells[0][1]];
          const inLine = new Set();
          line.forEach(([r, c]) => {
            const t = this.grid[r][c];
            if (this.isTile(t)) clear.add(r * this.cols + c);
            else if (this.isPiece(t)) inLine.add(t.piece);
          });
          inLine.forEach(p => hits.set(p, (hits.get(p) || 0) + 1));
          this.lineFlash(horiz, horiz ? ri.cells[0][0] : ri.cells[0][1]);
        }
        this.hooks.onMatch?.(runs, step);
        window.Sound?.sfx(blasts.length ? 'blast' : 'match', step);
        if (step >= 2) this.combo(step);
        if (blasts.length) this.toast('💥 Line blast!', 'win');
        else if (stars.length) this.toast('★ Wild star created!', 'win');
        hits.forEach((n, p) => { if (!p.gone) this.hooks.onPieceHit(p, n, 'match'); });
        this.popCells(clear);
        await this.wait(170);
        this.clearCells(clear);
        stars.forEach(([r, c]) => {
          if (this.grid[r][c] === null) { const t = this.newTile('star'); t.born = true; this.grid[r][c] = t; }
        });
        this.collapse();
        this.render();
        await this.wait(250);
      }
    }

    combo(step) {
      const words = ['', '', 'Nice!', 'Great!', 'Awesome!', 'Legendary!'];
      const d = document.createElement('div');
      d.className = 'combo';
      d.textContent = words[Math.min(step, 5)] + (step > 2 ? ` x${step}` : '');
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 1000);
    }

    lineFlash(horiz, idx) {
      const d = document.createElement('div');
      d.className = 'lineflash ' + (horiz ? 'h' : 'v');
      if (horiz) { d.style.top = (idx / this.rows * 100) + '%'; d.style.height = (100 / this.rows) + '%'; }
      else { d.style.left = (idx / this.cols * 100) + '%'; d.style.width = (100 / this.cols) + '%'; }
      this.fx.appendChild(d);
      setTimeout(() => d.remove(), 500);
    }

    // ---------- hint: wiggle a valid move after a few idle seconds ----------
    findMove() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const r2 = r + dr, c2 = c + dc;
            if (!this.inBounds(r2, c2)) continue;
            const a = this.grid[r][c], b = this.grid[r2][c2];
            if (!this.isTile(a) || !this.isTile(b) || a.type === b.type) continue;
            this.swap([r, c], [r2, c2]);
            const ok = this.matchAt(r, c) || this.matchAt(r2, c2);
            this.swap([r, c], [r2, c2]);
            if (ok) return [[r, c], [r2, c2]];
          }
        }
      }
      return null;
    }
    clearHint() {
      clearTimeout(this.hintTimer);
      this.el.querySelectorAll('.tile.hint').forEach(e => e.classList.remove('hint'));
    }
    scheduleHint(ms = 4000) {
      this.clearHint();
      const tok = this.session;
      this.hintTimer = setTimeout(() => {
        if (tok !== this.session || this.busy || !this.hooks.canPlay()) return;
        const m = this.findMove();
        if (!m) return;
        m.forEach(([r, c]) => { const t = this.grid[r][c]; const el = t && this.els.get(t.id); if (el) el.classList.add('hint'); });
      }, ms);
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
      this.clearHint();
      window.Sound?.sfx('swap');
      this.swap(a, b); this.render();
      await this.wait(140);
      if (!this.findRuns().length) {
        window.Sound?.sfx('nope');
        this.swap(a, b); this.render();
        await this.wait(160);
        this.busy = false;
        this.scheduleHint();
        return;
      }
      this.hooks.onMove();
      await this.resolve([a, b]);
      await this.ensurePlayable();
      await this.hooks.afterAction(true);
      this.busy = false;
      this.scheduleHint();
    }

    // ---------- input ----------
    cellFromEvent(e) {
      const rect = this.el.getBoundingClientRect();
      const c = Math.floor((e.clientX - rect.left) / rect.width * this.cols);
      const r = Math.floor((e.clientY - rect.top) / rect.height * this.rows);
      return this.inBounds(r, c) ? [r, c] : null;
    }
    onDown(e) {
      if (this.busy || this.celebrating || !this.hooks.canPlay()) return;
      const cell = this.cellFromEvent(e);
      if (!cell) return;
      this.clearHint();
      this.scheduleHint(6000);
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
