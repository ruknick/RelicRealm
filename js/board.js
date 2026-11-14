// Shared match-3 board engine used by the forest (gathering) and battle boards.
// Grid cells hold a tile {id, type}, a piece cell {type: 'piece', piece}, or null.
// Pieces are fixed objects (keep, fence, fog…) that tiles fall past.
window.Board = (() => {
  const ABORT = Symbol('abort');
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const ENERGY_MAX = 10;
  // Cost of a tap-swing: heavier steel and bows cost more.
  const swingCost = it => (it.tier >= 3 ? 3 : 2) + (it.type === 'bow' ? 1 : 0) - (it.light ? 1 : 0);
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
      this.energy = 3;                 // ⚡ built by matching, spent on tap-swings
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
        const fam = x => Data.family(x.type);
        let type = isWild(t) ? null : fam(t);
        let j = i + 1;
        while (j < line.length) {
          const u = this.at(line[j]);
          if (!this.isTile(u)) break;
          if (isWild(u)) { j++; continue; }
          if (type === null) { type = fam(u); j++; continue; }
          if (fam(u) === type) { j++; continue; }
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
        el.classList.toggle('wants-key', !!p.keyOnly && ['key', 'goldkey', 'crystalkey'].some(k => App.state.inventory[k] > 0 && Data.WEAPONS[k].unlock >= (p.lockTier || 1)));
        if (p.scale) el.style.setProperty('--scale', p.scale);
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
    celebrate(cell, { icon, title, sub = '', rare = false, kicker = '' }) {
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
          <div class="cel-text"><div class="cel-kicker">${kicker || (rare ? '✦ Rare find ✦' : 'You found')}</div>
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

    // ---------- gear: equipped weapon & tool, plus one-shot specials ----------
    renderWeapons(tray) {
      if (tray) this.tray = tray;
      if (!this.tray) return;
      const st = App.state, inv = st.inventory;
      const slot = (key, emoji, label) => {
        const g = st.equip[key];
        if (!g) return `<button class="gslot empty" data-slot="${key}"><span class="gs-icon">${emoji}</span><span class="gs-text"><b>${label}</b><small>tap to equip</small></span></button>`;
        const it = Data.ITEMS[g.id], pct = Math.round(g.dur / it.dur * 100);
        return `<button class="gslot t${it.tier}" data-slot="${key}"><span class="gs-icon">${Art.piece(it.art)}</span>
          <span class="gs-text"><b>${it.name.replace(/^(Goblin|Dwarven) /, '')}</b><span class="dur${pct <= 25 ? ' low' : ''}"><i style="width:${pct}%"></i></span></span></button>`;
      };
      const specials = Object.keys(Data.ITEMS).filter(k => Data.ITEMS[k].special && inv[k] > 0).map(k => {
        const it = Data.ITEMS[k];
        return `<button class="spec${this.armed === k ? ' armed' : ''}" data-w="${k}" title="${it.name}">${it.art ? Art.piece(it.art) : it.icon}<b>${inv[k]}</b></button>`;
      }).join('');
      this.tray.innerHTML = `<div class="gearbar"><div class="energy" title="Energy: make matches to charge, tap a monster or obstacle to swing">
          <span class="en-bolt">⚡</span><b class="en-num">${this.energy}</b><span class="en-bar"><i style="height:${this.energy / ENERGY_MAX * 100}%"></i></span></div>
        ${slot('weapon', '⚔️', 'Weapon')}${slot('tool', '🛠️', 'Tool')}<div class="specials">${specials}</div></div>`;
      this.tray.querySelectorAll('.gslot').forEach(b => { b.onclick = () => this.pickGear(b.dataset.slot); });
      this.tray.querySelectorAll('.spec').forEach(b => { b.onclick = () => this.arm(b.dataset.w); });
    }

    gainEnergy(n) {
      const before = this.energy;
      this.energy = Math.min(ENERGY_MAX, this.energy + n);
      if (this.energy !== before) this.renderEnergy(true);
    }
    renderEnergy(pulse = false) {
      const el = this.tray && this.tray.querySelector('.energy');
      if (!el) return;
      el.querySelector('.en-num').textContent = this.energy;
      el.querySelector('.en-bar i').style.height = (this.energy / ENERGY_MAX * 100) + '%';
      el.classList.toggle('full', this.energy >= ENERGY_MAX);
      if (pulse) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    }

    // Choose which weapon / tool to wield.
    async pickGear(slot) {
      if (this.busy) return;
      const st = App.state, cls = slot === 'weapon' ? 'weapon' : 'tool';
      const owned = st.gear.map((g, i) => ({ g, i })).filter(({ g }) => Data.ITEMS[g.id].gear === cls)
        .sort((a, b) => Data.ITEMS[b.g.id].tier - Data.ITEMS[a.g.id].tier);
      const cur = st.equip[slot];
      const buttons = owned.slice(0, 6).map(({ g, i }) => {
        const it = Data.ITEMS[g.id];
        return { id: String(i), label: `<span class="pick-icon">${Art.piece(it.art)}</span> ${it.name} <small>${g.dur}/${it.dur}</small>` };
      });
      if (cur) buttons.push({ id: 'off', label: 'Unequip', cls: 'alt' });
      buttons.push({ id: 'cancel', label: 'Cancel', cls: 'alt' });
      const help = cls === 'weapon'
        ? 'Weapons only hurt monsters. Tap a monster to swing — matches next to monsters also strike with it.'
        : 'Tools break obstacles & defenses: wood-axe (wood & plants), pick (stone), hammer (anything built).';
      const choice = await App.choose({
        title: slot === 'weapon' ? '⚔️ Wield a weapon' : '🛠️ Wield a tool',
        html: `<p class="hint">${help}</p>${owned.length ? '' : `<p>You don't have any ${cls}s — craft some in the Workshop.</p>`}
          ${cur ? `<p>Wielding: <b>${Data.ITEMS[cur.id].name}</b> (${cur.dur}/${Data.ITEMS[cur.id].dur})</p>` : ''}`,
        buttons,
      });
      if (choice === 'off') App.unequip(slot);
      else if (choice !== 'cancel') App.equip(slot, +choice);
      this.renderWeapons();
      this.hooks.onArm?.();
    }

    arm(k) {
      if (this.busy || !this.hooks.canPlay()) return;
      if (Data.ITEMS[k].instant) {   // no target: use it right away (e.g. chowder)
        const msg = this.hooks.useInstant ? this.hooks.useInstant(k) : null;
        if (msg === true) { App.state.inventory[k]--; App.save(); this.renderWeapons(); this.hooks.onArm?.(); }
        else this.toast(msg || `${Data.ITEMS[k].icon} ${Data.ITEMS[k].desc}`, '', 2600);
        return;
      }
      this.armed = this.armed === k ? null : k;
      this.selected = null;
      this.renderWeapons(); this.render();
      this.hooks.onArm?.();
    }

    armedHint() {
      if (!this.armed) return '';
      const it = Data.ITEMS[this.armed];
      return `${it.icon} ${it.name}: ${it.desc} Tap a target — tap it again to cancel.`;
    }

    // Swing your equipped weapon (at a monster) or tool (at an obstacle or defense).
    async strike(p) {
      const slot = p.mat === 'creature' ? 'weapon' : 'tool';
      const g = App.state.equip[slot];
      if (!g) {
        this.toast(slot === 'weapon' ? '⚔️ Equip a weapon to fight monsters — tap the ⚔️ slot below.' : '🛠️ Equip a tool to break that — tap the 🛠️ slot below.', '', 2600);
        return;
      }
      const G = Data.ITEMS[g.id];
      const dmg = Data.gearDamage(g.id, p);
      if (dmg <= 0) { this.toast(Data.gearRefusal(g.id, p), '', 2600); window.Sound?.sfx('nope'); return; }
      const cost = swingCost(G);
      if (this.energy < cost) {
        this.toast(`⚡ Need ${cost} energy to swing — make matches to charge up (${this.energy}/${cost}).`, '', 2600);
        window.Sound?.sfx('nope');
        const el = this.tray && this.tray.querySelector('.energy');
        if (el) { el.classList.remove('short'); void el.offsetWidth; el.classList.add('short'); }
        return;
      }
      this.energy -= cost;
      this.busy = true;
      this.clearHint();
      let targets = [[p, dmg]];
      if (G.type === 'bow') {
        targets = this.pieces.filter(x => !x.gone && x.mat === 'creature' && x.c === p.c)
          .map(x => [x, Data.gearDamage(g.id, x)]).filter(([, d]) => d > 0);
        if (targets.length > 1) this.toast('🏹 The arrow flies down the whole column!', 'win');
      } else if (G.type === 'baxe') {
        DIRS.forEach(([dr, dc]) => {
          const x = this.inBounds(p.r + dr, p.c + dc) && this.grid[p.r + dr][p.c + dc];
          if (this.isPiece(x) && x.piece !== p && x.piece.mat === 'creature') {
            const d = Math.min(1, Data.gearDamage(g.id, x.piece));
            if (d > 0 && !targets.some(([t]) => t === x.piece)) targets.push([x.piece, d]);
          }
        });
        if (targets.length > 1) this.toast('🪓 Cleave! The axe bites the next one too.', 'win');
      } else if (G.type === 'spear') {
        [-1, 1].forEach(dr => {
          const x = this.inBounds(p.r + dr, p.c) && this.grid[p.r + dr][p.c];
          if (this.isPiece(x) && x.piece !== p && x.piece.mat === 'creature') {
            const d = Data.gearDamage(g.id, x.piece);
            if (d > 0 && !targets.some(([t]) => t === x.piece)) targets.push([x.piece, d]);
          }
        });
        if (targets.length > 1) this.toast('🔱 The spear runs them through!', 'win');
      }
      const el = this.pieceEls.get(p.id);
      if (el) { el.classList.remove('struck'); void el.offsetWidth; el.classList.add('struck'); }
      targets.forEach(([t, d]) => {
        if (t.gone) return;
        this.float([t.r, t.c + Math.floor(t.w / 2)], `−${Math.min(d, t.hp)}`, 'loss');
        this.hooks.onPieceHit(t, d, slot, g.id);
      });
      window.Sound?.sfx(slot === 'weapon' ? 'slash' : 'hit');
      const broke = App.wear(slot);
      if (broke) { this.toast(`💥 Your ${broke} broke!`, 'alert', 2400); window.Sound?.sfx('break'); }
      this.renderWeapons();
      this.render();
      await this.wait(220);
      this.collapse(); this.render();
      await this.wait(250);
      await this.resolve();
      await this.ensurePlayable();
      await this.hooks.afterAction(false);
      this.busy = false;
      this.scheduleHint();
    }

    async useWeapon(r, c) {
      const w = this.armed;
      const W = Data.WEAPONS[w];
      const t = this.grid[r][c];
      const name = Data.ITEMS[w].name;
      // Check the target is something this weapon can affect, so a wasted tap doesn't burn a use.
      if (this.isPiece(t) && !W.area) {
        const p = t.piece;
        if (p.kind === 'fog' && !W.fog) { this.toast(`The ${name} can't reach into the fog.`); return; }
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
      // Tier 2 weapons cleave into obstacles next to the one you hit.
      const splash = new Map();
      if (W.splash && !W.area) {
        hit.forEach(p => {
          for (let i = 0; i < p.w; i++) DIRS.forEach(([dr, dc]) => {
            const r2 = p.r + dr, c2 = p.c + i + dc;
            const x = this.inBounds(r2, c2) && this.grid[r2][c2];
            if (this.isPiece(x) && x.piece !== p && x.piece.kind !== 'fog' && !hit.has(x.piece)) splash.set(x.piece, true);
          });
        });
      }
      hit.forEach(p => {
        if (p.gone) return;
        if (p.kind === 'fog') { if (W.fog) this.hooks.onPieceHit(p, 1, 'weapon', w); return; }
        const dmg = Data.weaponDamage(w, p);
        if (dmg > 0) { this.float([p.r, p.c + Math.floor(p.w / 2)], `−${Math.min(dmg, p.hp)}`, 'loss'); this.hooks.onPieceHit(p, dmg, 'weapon', w); }
      });
      splash.forEach((_, p) => {
        if (p.gone) return;
        const dmg = Math.min(W.splash, Data.weaponDamage(w, p));
        if (dmg > 0) { this.float([p.r, p.c + Math.floor(p.w / 2)], `−${Math.min(dmg, p.hp)} cleave`, 'loss'); this.hooks.onPieceHit(p, dmg, 'weapon', w); }
      });
      if (splash.size) this.toast(`${Data.ITEMS[w].icon} Cleave! Neighbours take damage too.`, 'win');
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
        this.gainEnergy(runs.reduce((n, ri) => n + 1 + (ri.cells.length >= 4 || step > 1 ? 1 : 0), 0) + blasts.length * 2);
        window.Sound?.sfx(blasts.length ? 'blast' : 'match', step);
        if (step >= 2) this.combo(step);
        if (blasts.length) this.toast('💥 Line blast!', 'win');
        else if (stars.length) this.toast('★ Wild star created!', 'win');
        let swung = false;
        hits.forEach((n, p) => {
          if (p.gone) return;
          if (p.mat === 'creature') {
            const g = App.state.equip.weapon;
            const d = g ? Data.gearDamage(g.id, p) : 0;
            if (d > 0) {
              swung = true;
              this.float([p.r, p.c + Math.floor(p.w / 2)], `⚔️ −${Math.min(d, p.hp)}`, 'loss');
              this.hooks.onPieceHit(p, d, 'weapon', g.id);
              return;
            }
          }
          this.hooks.onPieceHit(p, n, 'match');
        });
        if (swung) {
          window.Sound?.sfx('slash');
          const broke = App.wear('weapon');
          if (broke) this.toast(`💥 Your ${broke} broke!`, 'alert', 2400);
          this.renderWeapons();
        }
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
            if (!this.isTile(a) || !this.isTile(b) || Data.family(a.type) === Data.family(b.type)) continue;
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
      if (this.isPiece(t)) {
        const p = t.piece;
        if (p.kind === 'fog' || p.keyOnly || (p.mat === 'other' && !p.struct)) { this.hooks.onPieceTap?.(p); return; }
        this.run(this.strike(p));
        return;
      }
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
