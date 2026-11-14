// Your camp: fortify layout, the AI that attacks it during a Siege Race, and the Fortify editor.
window.Camp = (() => {
  const ROWS = 9, COLS = 7, BASE_ROWS = 4, KEEP_HP = 6;
  let GLANCE = 0.5;   // chance a too-weak weapon still finds a gap in your armor
  const KEEP_CELLS = [[0, 2], [0, 3], [0, 4]];

  // Defenses you can place. pts = fortify points; hp before runestone bonus.
  const DEF = {
    fence:     { pts: 1, mat: 'wood',  hard: 1, hp: 2, icon: '🪵', name: 'Fence' },
    trap:      { pts: 1, mat: 'other', hard: 1, hp: 1, icon: '🕳️', name: 'Pit trap', trap: true },
    wall:      { pts: 2, mat: 'stone', hard: 2, hp: 4, icon: '🧱', name: 'Stone wall' },
    palisade:  { pts: 2, mat: 'wood',  hard: 1, hp: 3, icon: '🔱', name: 'Spiked palisade', spiked: true },
    tower:     { pts: 2, mat: 'wood',  hard: 1, hp: 3, icon: '🗼', name: 'Watchtower', tower: true },
    gate:      { pts: 3, mat: 'iron',  hard: 3, hp: 4, icon: '🚪', name: 'Iron gate', max: 2 },
    runestone: { pts: 1, mat: 'stone', hard: 2, hp: 1, icon: '🪨', name: 'Runestone', rune: true },
    bulwark:   { pts: 4, mat: 'steel', hard: 4, hp: 5, icon: '🛡️', name: 'Steel bulwark', max: 2 },
  };
  // How each attacker plays your board.
  const AI = {
    goblin: { name: 'Goblins', march: 7, miss: 0.3, big: 0.12 },
    dwarf:  { name: 'Dwarves', march: 8, miss: 0.25, big: 0.25 },
  };

  const budget = L => Math.min(16, 5 + L);
  const key = (r, c) => `${r},${c}`;
  const isKeep = (r, c) => r === 0 && c >= 2 && c <= 4;
  const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function layout() {
    const st = App.state;
    if (!st.camp) st.camp = { cells: {}, chest: [1, 3] };
    return st.camp;
  }
  const placedCount = kind => Object.values(layout().cells).filter(k => k === kind).length;
  const pointsUsed = () => Object.values(layout().cells).reduce((s, k) => s + DEF[k].pts, 0);
  const owned = kind => App.state.inventory[kind] || 0;

  // ---------- attack simulation ----------
  function newAttack(enemy, dry = false, tier = Data.enemyTier(App.state.enemyWins[enemy]), noArmor = false) {
    const L = layout();
    const pieces = Object.entries(L.cells).map(([k, kind]) => {
      const [r, c] = k.split(',').map(Number);
      return { kind, ...DEF[kind], r, c, alive: true };
    });
    // Runestones strengthen every defense touching them.
    pieces.filter(p => p.rune).forEach(rs => pieces.forEach(p => {
      if (!p.trap && !p.rune && Math.abs(p.r - rs.r) + Math.abs(p.c - rs.c) === 1) p.hp++;
    }));
    pieces.forEach(p => { p.max = p.hp; });
    // Iron-banded loot chest: once opened it stays put and still blocks the way.
    const chest = { kind: 'chest', r: L.chest[0], c: L.chest[1], hp: 2, max: 2, mat: 'wood', hard: 1, alive: true, opened: false };
    // Your worn armor stands guard: shield hearts they must break before the keep itself.
    const keep = { kind: 'keep', hp: KEEP_HP, max: KEEP_HP, alive: true, ward: noArmor ? [] : App.wardLayers() };
    // Higher-ranked raiders hit harder and arrive sooner.
    const base = AI[enemy], t = tier - 1;
    const P = { ...base, name: `${enemy === 'dwarf' ? 'Dwarf' : 'Goblin'} ${Data.TIER_NAMES[enemy][tier - 1]}`,
      miss: Math.max(0.08, base.miss - 0.05 * t), big: base.big + 0.06 * t, march: Math.max(2, base.march - t),
      gear: Data.ENEMY_GEAR[enemy][tier - 1] };
    return { enemy, P, pieces, chest, keep, skip: 0, march: P.march, towerTick: 0, moves: 0, done: false, stolen: [], dry, log: `${AI[enemy].name} are marching on your camp…` };
  }

  function blockerAt(a, r, c) {
    if (isKeep(r, c)) return a.keep;
    if (a.chest.r === r && a.chest.c === c) return a.chest;
    return a.pieces.find(p => p.alive && !p.trap && p.r === r && p.c === c) || null;
  }

  // Cells the attackers can stand on: flood fill from the bottom row through open ground.
  function reachable(a) {
    const seen = new Set(), q = [];
    for (let c = 0; c < COLS; c++) if (!blockerAt(a, ROWS - 1, c)) { seen.add(key(ROWS - 1, c)); q.push([ROWS - 1, c]); }
    while (q.length) {
      const [r, c] = q.shift();
      for (const [dr, dc] of DIRS) {
        const r2 = r + dr, c2 = c + dc;
        if (!inB(r2, c2) || seen.has(key(r2, c2)) || blockerAt(a, r2, c2)) continue;
        seen.add(key(r2, c2)); q.push([r2, c2]);
      }
    }
    return seen;
  }

  function touches(reach, cells) {
    return cells.some(([r, c]) => DIRS.some(([dr, dc]) => reach.has(key(r + dr, c + dc))));
  }

  function steal(a) {
    const st = App.state, out = [];
    for (let i = 0; i < 2; i++) {
      if (st.stockpile.goldbar > 0) { if (!a.dry) st.stockpile.goldbar--; out.push('🟨 Gold bar'); }
      else if (st.scraps.goblin + st.scraps.dwarf > 0) {
        const e = st.scraps.goblin > 0 ? 'goblin' : 'dwarf';
        if (!a.dry) st.scraps[e]--; out.push('🗺️ Map scrap');
      } else if (st.inventory.key > 0) { if (!a.dry) st.inventory.key--; out.push('🗝️ Old key'); }
    }
    if (!a.dry) App.save();
    a.stolen.push(...out);
    return out;
  }

  // One attacker move. Returns { msg, rubble } and sets a.done when your keep falls.
  function step(a) {
    const P = a.P;
    a.moves++;
    const say = (msg, extra = {}) => { a.log = msg; return { msg, ...extra }; };
    if (a.skip > 0) { a.skip--; return say(`${P.name} are clearing rubble… (move lost)`); }
    if (a.march > 0) {
      a.march--;
      return say(a.march ? `${P.name} are marching on your camp…` : `${P.name} reach your camp!`);
    }
    if (a.pieces.some(p => p.alive && p.tower) && ++a.towerTick >= 3) {
      a.towerTick = 0;
      if (Math.random() < 0.6) return say('🗼 Your watchtower drives them back! (move lost)');
    }
    const reach = reachable(a);
    const trap = a.pieces.find(p => p.alive && p.trap && reach.has(key(p.r, p.c)));
    if (trap) { trap.alive = false; a.skip++; return say(`🕳️ One fell into your pit trap! (−1 move)`); }

    const targets = [];
    if (touches(reach, KEEP_CELLS)) targets.push(a.keep);
    if (!a.chest.opened && touches(reach, [[a.chest.r, a.chest.c]])) targets.push(a.chest);
    a.pieces.filter(p => p.alive && !p.trap && touches(reach, [[p.r, p.c]])).forEach(p => targets.push(p));
    if (!targets.length) return say(`${P.name} search for a way in…`);

    let t;
    if (targets.includes(a.keep)) t = targets.includes(a.chest) && Math.random() < 0.5 ? a.chest : a.keep;
    else {
      // Pick the cheapest way through: low HP, not iron, closest to the keep.
      // Cheapest way through: things their weapons can actually break, low HP, close to the keep.
      const rate = p => { const d = P.gear - (p.hard || 1); return d < 0 ? 0.08 : d === 0 ? 0.7 : 1.2; };
      const cost = p => p.hp / rate(p) + p.r * 0.6;
      t = targets.sort((x, y) => cost(x) - cost(y))[0];
    }
    // Hardness rule: their weapon tier vs your defense. Too hard = they barely scratch it.
    // Hitting the keep? Your armor takes it first, layer by layer.
    const layer = t === a.keep ? a.keep.ward.find(w => w.hp > 0) : null;
    if (layer) return hitWard(a, layer);
    let dmg;
    const diff = P.gear - (t.hard || 1);
    if (diff < 0) dmg = Math.random() < 0.08 ? 1 : 0;
    else { const x = Math.random(); dmg = x < P.miss ? 0 : x < 1 - P.big ? 1 : 2; if (diff > 0 && dmg) dmg++; }
    const name = t === a.keep ? 'your keep' : t === a.chest ? 'your loot chest' : `your ${DEF[t.kind].name.toLowerCase()}`;
    if (!dmg) return say(diff < 0 ? `${P.name}' ${Data.TIER_LABEL[P.gear].toLowerCase()} weapons bounce off ${name}!` : `${P.name} are hacking at ${name}…`);
    t.hp = Math.max(0, t.hp - dmg);
    let msg = `${P.name} hit ${name}${dmg > 1 ? ' hard' : ''}!`;
    if (t.spiked) { a.skip++; msg += ' 🔱 The spikes hurt them (−1 move).'; }
    if (t.hp <= 0) {
      if (t === a.chest) t.opened = true; else t.alive = false;
      if (t === a.keep) { a.done = true; msg = `💥 ${P.name} broke your keep!`; }
      else if (t === a.chest) {
        const got = steal(a);
        msg = got.length ? `📦 ${P.name} opened your loot chest and took ${got.join(' & ')}!` : `📦 ${P.name} opened your loot chest — it was empty!`;
      } else msg = `${P.name} smashed ${name}!`;
    }
    return say(msg, { rubble: dmg > 1 });
  }

  // Armor is worn by people, not built: weaker weapons still find gaps now and then.
  function hitWard(a, w) {
    const P = a.P, diff = P.gear - w.hard;
    let dmg;
    if (diff < 0) dmg = Math.random() < GLANCE ? 1 : 0;
    else { const x = Math.random(); dmg = x < P.miss ? 0 : x < 1 - P.big ? 1 : 2; if (diff > 0 && dmg) dmg++; }
    dmg = Math.min(dmg, w.hp);
    const say = msg => { a.log = msg; return { msg, rubble: dmg > 1 }; };
    if (!dmg) return say(diff < 0 ? `🛡 Their ${Data.TIER_LABEL[P.gear].toLowerCase()} weapons glance off your ${w.name.toLowerCase()}!` : `${P.name} hammer at your ${w.name.toLowerCase()}…`);
    w.hp -= dmg;
    let broke = null;
    if (!a.dry) broke = App.wear(w.slot, dmg);
    if (broke) { w.hp = 0; return say(`💥 Your ${broke} broke!`); }
    return say(w.hp > 0 ? `🛡 Your ${w.name.toLowerCase()} takes the blow!` : `🛡 They got past your ${w.name.toLowerCase()}!`);
  }

  // How many moves this enemy needs on average to break your keep (for the editor).
  function estimate(enemy, runs = 160, noArmor = false) {
    let total = 0;
    for (let i = 0; i < runs; i++) {
      const a = newAttack(enemy, true, undefined, noArmor);
      while (!a.done && a.moves < 80) step(a);
      total += a.moves;
    }
    return Math.round(total / runs);
  }

  // Tiny map of your camp for the race HUD.
  function miniMap(a) {
    let html = '';
    for (let r = 0; r < BASE_ROWS + 1; r++) for (let c = 0; c < COLS; c++) {
      let cls = 'mm';
      if (isKeep(r, c)) cls += a.keep.alive ? ' keep' : ' broken';
      else if (a.chest.r === r && a.chest.c === c) cls += a.chest.opened ? ' broken' : ' chest';
      else {
        const p = a.pieces.find(x => x.r === r && x.c === c);
        if (p) cls += p.alive ? (p.trap ? ' trap' : ` ${p.mat}`) : ' broken';
      }
      html += `<i class="${cls}"></i>`;
    }
    return html;
  }

  // ---------- Fortify editor ----------
  let selected = null;

  function giveStarterKit() {
    const st = App.state;
    if (st.starterDef) return;
    st.starterDef = true;
    st.inventory.fence += 2;
    st.inventory.trap += 1;
    const L = layout();
    if (!Object.keys(L.cells).length) L.cells = { '1,2': 'fence', '1,4': 'fence', '2,3': 'trap' };
    App.save();
  }

  function paletteKinds() {
    return Object.keys(DEF).filter(k => owned(k) > 0);
  }

  function render() {
    giveStarterKit();
    const L = layout(), lv = App.level, max = budget(lv), used = pointsUsed();
    document.getElementById('fort-points').innerHTML = `Points <b>${used}/${max}</b>`;
    const kinds = paletteKinds();
    document.getElementById('fort-palette').innerHTML = kinds.length ? kinds.map(k => {
      const d = DEF[k], left = owned(k) - placedCount(k);
      return `<button class="fort-item${selected === k ? ' sel' : ''}" data-k="${k}" ${left > 0 ? '' : 'disabled'}>
        <span class="fi-icon">${Art.piece(k) || d.icon}</span><span class="fi-name">${d.name}</span><span class="fi-meta">${left} left · ${d.pts}pt</span></button>`;
    }).join('') : '<span class="hint">Craft defenses in the Workshop.</span>';
    document.querySelectorAll('.fort-item').forEach(b => { b.onclick = () => { selected = selected === b.dataset.k ? null : b.dataset.k; render(); }; });

    let cells = '';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = L.cells[key(r, c)];
      let cls = 'fc', content = '';
      if (r >= BASE_ROWS) cls += ' approach';
      if (isKeep(r, c)) {
        if (c !== 2) continue;                       // the keep is one 3-wide cell
        cls += ' keep'; content = Art.piece('pkeep');
      }
      else if (L.chest[0] === r && L.chest[1] === c) { cls += ' chest'; content = Art.piece('chest'); }
      else if (k) { cls += ` def d-${k}`; content = Art.piece(k) || DEF[k].icon; }
      cells += `<div class="${cls}" data-r="${r}" data-c="${c}">${content}</div>`;
    }
    const grid = document.getElementById('fort-grid');
    grid.innerHTML = cells;
    grid.querySelectorAll('.fc').forEach(el => { el.onclick = () => tapCell(+el.dataset.r, +el.dataset.c); });

    const g = estimate('goblin'), d = estimate('dwarf'), armored = App.wardLayers().length;
    document.getElementById('fort-test').innerHTML =
      `🧪 Goblins need about <b>${g}</b> moves to break your keep · dwarves about <b>${d}</b>${armored ? ' (with your armor)' : ''}. <span class="hint">Beat them to it when you raid! ${armored ? '' : 'Craft armor and wear it in 🧍 Warrior to add 🛡 hearts.'}</span>`;
    const sp = App.state;
    // The Storehouse: everything banked at camp.
    const TILE = { food: 'berries', iron: 'ore' };
    const keys = Object.keys(Data.RESOURCES).sort((x, y) => (sp.stockpile[y] > 0) - (sp.stockpile[x] > 0));
    document.getElementById('fort-store').innerHTML = keys.map(k => `<div class="st-item${sp.stockpile[k] ? '' : ' none'}">
      <span class="gem art g-${TILE[k] || k}">${Art.tile(TILE[k] || k)}</span><b>${sp.stockpile[k]}</b><small>${Data.RESOURCES[k].label}</small></div>`).join('');
    document.getElementById('fort-chest').innerHTML =
      `📦 Your loot chest holds your valuables: 🟨 ${sp.stockpile.goldbar} gold bar${sp.stockpile.goldbar === 1 ? '' : 's'} · 🗺️ ${sp.scraps.goblin + sp.scraps.dwarf} map scraps · 🗝️ ${sp.inventory.key} key${sp.inventory.key === 1 ? '' : 's'}. If raiders open it, they take some.`;
    document.getElementById('fort-hint').textContent = selected === 'chest' ? 'Tap an empty spot in your camp to move the loot chest.'
      : selected ? `Tap your camp (top 4 rows) to place a ${DEF[selected].name}. Tap a placed defense to remove it.`
      : 'Pick a defense, then tap your camp. Tap the 📦 chest to move it. Raiders come from the bottom.';
  }

  function tapCell(r, c) {
    const L = layout();
    if (isKeep(r, c)) return;
    if (r >= BASE_ROWS) { flash('You can only build in your camp (top 4 rows).'); return; }
    const k = key(r, c);
    const isChest = L.chest[0] === r && L.chest[1] === c;
    if (isChest) { selected = selected === 'chest' ? null : 'chest'; render(); return; }
    if (selected === 'chest') {
      if (L.cells[k]) { flash('Pick an empty spot for the chest.'); return; }
      L.chest = [r, c]; selected = null; App.save(); render(); return;
    }
    if (L.cells[k]) { delete L.cells[k]; App.save(); Sound.sfx('swap'); render(); return; }
    if (!selected) { flash('Pick a defense first.'); return; }
    const d = DEF[selected];
    if (owned(selected) - placedCount(selected) <= 0) { flash(`No ${d.name}s left — craft more.`); return; }
    if (pointsUsed() + d.pts > budget(App.level)) { flash(`Not enough points (level up for more).`); return; }
    if (d.max && placedCount(selected) >= d.max) { flash(`At most ${d.max} ${d.name}s.`); return; }
    L.cells[k] = selected;
    App.save();
    Sound.sfx('clank');
    render();
  }

  function flash(msg) {
    const h = document.getElementById('fort-hint');
    h.textContent = msg;
    h.classList.remove('warn'); void h.offsetWidth; h.classList.add('warn');
    Sound.sfx('nope');
  }

  return { setGlance: g => { GLANCE = g; }, giveStarterKit, DEF, budget, layout, newAttack, step, estimate, miniMap, render, KEEP_HP };
})();
