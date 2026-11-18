// Your camp: fortify layout, the AI that attacks it during a Siege Race, and the Fortify editor.
window.Camp = (() => {
  const ROWS = 9, COLS = 7, BASE_ROWS = 4, KEEP_HP = 6;
  const KEEP_CELLS = [[0, 2], [0, 3], [0, 4]];

  // Defenses you can place. pts = fortify points; hp before runestone bonus.
  const DEF = {
    fence:     { pts: 1, mat: 'wood',  hard: 1, hp: 2, icon: '🪵', name: 'Fence' },
    trap:      { pts: 1, mat: 'other', hard: 1, hp: 1, icon: '🕳️', name: 'Pit trap', trap: true },
    wall:      { pts: 2, mat: 'stone', hard: 2, hp: 4, icon: '🧱', name: 'Stone wall' },
    palisade:  { pts: 2, mat: 'wood',  hard: 1, hp: 3, icon: '🔱', name: 'Spiked palisade', spiked: true },
    tower:     { pts: 2, mat: 'wood',  hard: 1, hp: 3, icon: '🗼', name: 'Watchtower', tower: true },
    gate:      { pts: 3, mat: 'iron',  hard: 3, hp: 4, icon: '🚪', name: 'Iron gate', max: 4 },
    runestone: { pts: 1, mat: 'stone', hard: 2, hp: 1, icon: '🪨', name: 'Runestone', rune: true },
    bulwark:   { pts: 4, mat: 'steel', hard: 4, hp: 5, icon: '🛡️', name: 'Steel bulwark', max: 4 },
  };
  // How each attacker plays your board.
  const AI = {
    goblin: { name: 'Goblins', march: 7, miss: 0.3, big: 0.12 },
    dwarf:  { name: 'Dwarves', march: 8, miss: 0.25, big: 0.25 },
  };

  // Fortify points keep growing with your level (they used to stop at 16).
  const budget = L => Math.min(45, 6 + L);
  // Your Storehouse keep is rebuilt stronger each era: more HP, and harder material
  // (wood → iron → steel → mythic), so low-tier raiders barely dent it.
  const KEEP_BY_ERA = { 1: { hp: 8, hard: 1, name: 'timber' }, 2: { hp: 10, hard: 2, name: 'iron-bound' }, 3: { hp: 12, hard: 3, name: 'steel-banded' }, 4: { hp: 15, hard: 4, name: 'starsilver-clad' } };
  const keepNow = () => KEEP_BY_ERA[Data.ERA(App.level)];
  // War parties never come more than one rank above your era — they send what you can fight.
  const raidTier = enemy => Math.min(Data.enemyTier(App.state.enemyWins[enemy]), Data.ERA(App.level) + 1);
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
  function newAttack(enemy, dry = false, tier = raidTier(enemy)) {
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
    // The keep is your Storehouse: break it and they carry off a share of everything you've banked.
    const K = keepNow();
    const keep = { kind: 'keep', hp: K.hp, max: K.hp, hard: K.hard, alive: true };
    // Higher-ranked raiders hit harder and arrive sooner.
    const base = AI[enemy], t = tier - 1;
    const P = { ...base, name: `${enemy === 'dwarf' ? 'Dwarf' : 'Goblin'} ${Data.TIER_NAMES[enemy][tier - 1]}`,
      miss: Math.max(0.08, base.miss - 0.05 * t), big: base.big + 0.06 * t, march: Math.max(2, base.march - t),
      gear: Data.ENEMY_GEAR[enemy][tier - 1] };
    return { enemy, tier, P, pieces, chest, keep, skip: 0, march: P.march, towerTick: 0, moves: 0, done: false, stolen: [], dry, hit: null, log: `${AI[enemy].name} are marching on your camp…` };
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
    a.hit = null;
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
      const rate = p => { const d = P.gear - (p.hard || 1); return d < -1 ? 0.06 : d < 0 ? 0.15 : d === 0 ? 0.7 : 1.2; };
      const cost = p => p.hp / rate(p) + p.r * 0.6;
      t = targets.sort((x, y) => cost(x) - cost(y))[0];
    }
    // Hardness rule: their weapon tier vs your defense. Too hard = they barely scratch it.
    // Weaker weapons still wear strong walls down — just slowly.
    let dmg;
    const diff = P.gear - (t.hard || 1);
    a.hit = t;
    if (diff < 0) dmg = Math.random() < (diff === -1 ? 0.3 : 0.12) ? 1 : 0;
    else { const x = Math.random(); dmg = x < P.miss ? 0 : x < 1 - P.big ? 1 : 2; if (diff > 0 && dmg) dmg++; }
    const name = t === a.keep ? 'your Storehouse' : t === a.chest ? 'your loot chest' : `your ${DEF[t.kind].name.toLowerCase()}`;
    if (!dmg) return say(diff < 0 ? `${P.name}' ${Data.TIER_LABEL[P.gear].toLowerCase()} weapons bounce off ${name}!` : `${P.name} are hacking at ${name}…`);
    t.hp = Math.max(0, t.hp - dmg);
    let msg = `${P.name} hit ${name}${dmg > 1 ? ' hard' : ''}!`;
    if (t.spiked) { a.skip++; msg += ' 🔱 The spikes hurt them (−1 move).'; }
    if (t.hp <= 0) {
      if (t === a.chest) t.opened = true; else t.alive = false;
      if (t === a.keep) { a.done = true; msg = `💥 ${P.name} broke into your Storehouse!`; }
      else if (t === a.chest) {
        const got = steal(a);
        msg = got.length ? `📦 ${P.name} opened your loot chest and took ${got.join(' & ')}!` : `📦 ${P.name} opened your loot chest — it was empty!`;
      } else msg = `${P.name} smashed ${name}!`;
    }
    return say(msg, { rubble: dmg > 1 });
  }

  // How often your camp holds against this enemy right now (they give up after REVENGE_MOVES).
  function holdChance(enemy, runs = 160) {
    let held = 0;
    for (let i = 0; i < runs; i++) {
      const a = newAttack(enemy, true);
      while (!a.done && a.moves < Data.REVENGE_MOVES) step(a);
      if (!a.done) held++;
    }
    return Math.round(held / runs * 100);
  }

  // ---------- revenge ----------
  const NAME = { goblin: 'goblin', dwarf: 'dwarf' };
  // After every trip: grudges grow, war parties form and march. Returns a warning line (or '').
  function tickTrip(kind, info = {}) {
    const st = App.state;
    st.sinceRevenge++;
    if (info.raid) st.grudge[info.enemy] += info.won ? 3 : 1;
    if (info.survivors && (kind === 'forest' || kind === 'mine')) st.grudge.goblin += 0.34 * info.survivors;
    if (st.revenge) {
      st.revenge.trips--;
      App.save();
      return st.revenge.trips > 0
        ? `😠 The ${NAME[st.revenge.enemy]} war party is ${st.revenge.trips} trip${st.revenge.trips > 1 ? 's' : ''} away from your camp!`
        : `⚔️ The ${NAME[st.revenge.enemy]} war party has reached your camp!`;
    }
    const angry = ['dwarf', 'goblin'].find(e => st.grudge[e] >= Data.GRUDGE_FULL);
    if (angry && st.sinceRevenge >= Data.REVENGE_COOLDOWN) {
      st.revenge = { enemy: angry, trips: Data.REVENGE_WARN_TRIPS };
      App.save();
      return `😠 <b>The ${NAME[angry]}s want revenge!</b> A war party is gathering — it will strike your camp in ${Data.REVENGE_WARN_TRIPS} trips. Fortify!`;
    }
    App.save();
    return '';
  }

  // On the map: if a war party has arrived, the attack plays out while you watch.
  async function revengeIfDue() {
    const st = App.state;
    if (!st.revenge || st.revenge.trips > 0) return;
    const enemy = st.revenge.enemy, tier = raidTier(enemy);
    const who = `${enemy === 'dwarf' ? 'Dwarf' : 'Goblin'} ${Data.TIER_NAMES[enemy][tier - 1]}`;
    Sound.sfx('drums');
    await App.choose({
      title: '⚔️ Your camp is under attack!',
      html: `<p class="story-text">${who} have come for revenge. They're after your Storehouse. All you can do is watch your defenses hold — or not.</p>`,
      buttons: [{ id: 'watch', label: '👁️ Watch the attack' }],
    });
    const a = newAttack(enemy, false, tier);
    const res = await watch(a, who);
    // Aftermath: lost defenses, plunder.
    const lost = [];
    const L = layout();
    // Smashed defenses: if your camp held, your people rebuild them all. If it fell, half are lost for good.
    const smashed = a.pieces.filter(p => !p.alive && !p.trap);
    smashed.forEach((p, i) => {
      if (!a.done || i % 2 === 1) { lost.push(`${DEF[p.kind].icon} ${DEF[p.kind].name} smashed — rebuilt`); return; }
      delete L.cells[key(p.r, p.c)];
      st.inventory[p.kind] = Math.max(0, (st.inventory[p.kind] || 0) - 1);
      lost.push(`${DEF[p.kind].icon} ${DEF[p.kind].name} destroyed`);
    });
    a.pieces.filter(p => !p.alive && p.trap).forEach(p => { delete L.cells[key(p.r, p.c)]; st.inventory.trap = Math.max(0, st.inventory.trap - 1); lost.push('🕳️ Pit trap sprung'); });
    if (a.done) {
      const pct = (enemy === 'dwarf' ? 0.12 : 0.1) + 0.03 * (tier - 1), taken = [];
      Object.keys(Data.RESOURCES).forEach(k => {
        const n = Math.floor(st.stockpile[k] * pct);
        if (n > 0) { st.stockpile[k] -= n; taken.push(`${n} ${Data.RESOURCES[k].label}`); }
      });
      if (taken.length) lost.push(`🏦 From your Storehouse: ${taken.join(', ')}`);
    }
    a.stolen.forEach(x => lost.push(`${x} (from your loot chest)`));
    st.grudge[enemy] = 0;
    st.revenge = null;
    st.sinceRevenge = 0;
    App.save();
    await App.choose({
      title: a.done ? '💥 They broke into your Storehouse' : '🛡️ Your camp held!',
      html: `<p>${a.done ? `${who} smashed their way in after ${a.moves} moves and carried off ${Math.round(((enemy === 'dwarf' ? 0.12 : 0.1) + 0.03 * (tier - 1)) * 100)}% of everything you'd banked.`
        : `${who} hammered at your walls for ${a.moves} moves and gave up. Their grudge is spent — for now.`}</p>
        ${lost.length ? `<div class="sum-spoils lost"><b>Aftermath</b><br>${lost.join('<br>')}</div>` : '<p>Nothing lost!</p>'}
        <p class="hint">Stronger walls, gates and traps make them give up sooner.</p>`,
      buttons: [{ id: 'fortify', label: '🏰 Rebuild & fortify' }, { id: 'home', label: 'Back to the map', cls: 'alt' }],
    }).then(c => { if (c === 'fortify') App.go('fortify'); });
    return res;
  }

  // The live view: your camp, the raiders swarming the open ground, each blow as it lands.
  function watch(a, who) {
    const el = document.getElementById('siege');
    document.getElementById('siege-title').textContent = `${a.enemy === 'dwarf' ? '⚒️' : '🔥'} ${who} attack your camp`;
    el.classList.remove('hidden');
    Sound.music(a.enemy === 'dwarf' ? 'dwarf' : 'battle');
    return new Promise(done => {
      let fast = false, timer = null;
      const end = () => { clearTimeout(timer); el.classList.add('hidden'); Sound.music('home'); done(a.done); };
      document.getElementById('siege-skip').onclick = () => { fast = true; };
      const tick = () => {
        const res = step(a);
        drawSiege(a, res.msg);
        if (/hit|broke|smashed|opened|trap|tower/.test(res.msg)) Sound.sfx(/broke|smashed/.test(res.msg) ? 'break' : 'hit');
        if (a.done || a.moves >= Data.REVENGE_MOVES) {
          if (!a.done) { a.log = `${who} give up and slink away!`; drawSiege(a, a.log); Sound.sfx('victory'); }
          timer = setTimeout(end, fast ? 200 : 1600);
          return;
        }
        timer = setTimeout(tick, fast ? 30 : a.march > 0 ? 350 : 650);
      };
      drawSiege(a, a.log);
      timer = setTimeout(tick, 700);
    });
  }
  function drawSiege(a, msg) {
    const reach = a.march > 0 ? new Set() : reachable(a);
    const icon = a.enemy === 'dwarf' ? '🧔' : Art.piece('goblin');
    let cells = '';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let cls = 'sc' + (r >= BASE_ROWS ? ' approach' : ''), content = '', hp = '';
      if (isKeep(r, c)) {
        if (c !== 2) continue;
        cls += ' keep' + (a.keep.alive && !a.done ? '' : ' down') + (a.hit === a.keep ? ' struck' : '');
        content = Art.piece('pkeep'); hp = `<span class="sh">♥${a.keep.hp}</span>`;
      } else if (a.chest.r === r && a.chest.c === c) {
        cls += ' chest' + (a.chest.opened ? ' down' : '') + (a.hit === a.chest ? ' struck' : '');
        content = Art.piece('chest');
      } else {
        const p = a.pieces.find(x => x.r === r && x.c === c);
        if (p && (p.alive || !p.trap)) {
          cls += ' def' + (p.alive ? '' : ' down') + (a.hit === p ? ' struck' : '');
          content = Art.piece(p.kind) || DEF[p.kind].icon;
          if (p.alive && !p.trap) hp = `<span class="sh">${'♥'.repeat(Math.max(0, p.hp))}</span>`;
        } else if (reach.has(key(r, c))) {
          cls += ' foe';
          // Raiders crowd the front line: cells touching something they can attack.
          const front = DIRS.some(([dr, dc]) => { const r2 = r + dr, c2 = c + dc; return inB(r2, c2) && blockerAt(a, r2, c2); });
          if (front || r === ROWS - 1) content = `<span class="raider">${icon}</span>`;
        }
      }
      cells += `<div class="${cls}">${content}${hp}</div>`;
    }
    document.getElementById('siege-grid').innerHTML = cells;
    const log = document.getElementById('siege-log');
    log.innerHTML = `<b>Move ${a.moves}/${Data.REVENGE_MOVES}</b> · ${msg || ''}` ;
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

    const st = App.state;
    const rank = e => Data.TIER_NAMES[e][raidTier(e) - 1];
    const meter = e => { const n = Math.min(Data.GRUDGE_FULL, Math.floor(st.grudge[e])); return '■'.repeat(n) + '□'.repeat(Data.GRUDGE_FULL - n); };
    document.getElementById('fort-test').innerHTML =
      `🏰 Your Storehouse keep is <b>${keepNow().name}</b>: <b>${keepNow().hp} HP</b>, ${Data.TIER_LABEL[keepNow().hard].toLowerCase()}-hard — it's rebuilt stronger each era.<br>🧪 If they attacked now, your camp would hold <b>${holdChance('goblin')}%</b> of the time against Goblin ${rank('goblin')} and <b>${holdChance('dwarf')}%</b> against Dwarf ${rank('dwarf')}.
      <div class="grudge">😠 Goblin grudge <span>${meter('goblin')}</span> · Dwarf grudge <span>${meter('dwarf')}</span></div>
      ${st.revenge ? `<p class="warn-note">⚔️ A ${st.revenge.enemy} war party is ${st.revenge.trips > 0 ? `${st.revenge.trips} trip${st.revenge.trips > 1 ? 's' : ''} away` : 'at the gates'}!</p>` : ''}
      <span class="hint">Win raids (or leave goblins alive) and their grudge grows. When it's full, they come for your Storehouse — you'll get a warning a couple of trips ahead.</span>`;
    const sp = App.state;
    // The Storehouse: everything banked at camp.
    renderStore();
    document.getElementById('fort-chest').innerHTML =
      `📦 Your loot chest holds your valuables: 🟨 ${sp.stockpile.goldbar} gold bar${sp.stockpile.goldbar === 1 ? '' : 's'} · 🗺️ ${sp.scraps.goblin + sp.scraps.dwarf} map scraps · 🗝️ ${sp.inventory.key} key${sp.inventory.key === 1 ? '' : 's'}. If raiders open it, they take some.`;
    document.getElementById('fort-hint').textContent = selected === 'chest' ? 'Tap an empty spot in your camp to move the loot chest.'
      : selected ? `Tap your camp (top 4 rows) to place a ${DEF[selected].name}. Tap a placed defense to remove it.`
      : 'Pick a defense, then tap your camp. Tap the 📦 chest to move it. Raiders come from the bottom.';
  }

  // ---------- the Storehouse (bank) and packing food for the road ----------
  const TILE = { food: 'berries', iron: 'ore', herring: 'fish' };
  const isFood = k => App.healOf(k) > 0 || !!(Data.ITEMS[k] && Data.ITEMS[k].potion);   // packable for the road
  const picOf = k => (Data.RESOURCES[k] ? `<span class="gem art g-${TILE[k] || k}">${Art.tile(TILE[k] || k)}</span>`
    : `<span class="wicon">${Data.ITEMS[k].art ? Art.piece(Data.ITEMS[k].art) : Data.ITEMS[k].icon}</span>`);
  const nameOf = k => (Data.RESOURCES[k] ? Data.RESOURCES[k].label : Data.ITEMS[k].name);
  const slots = (filled, min) => { const n = Math.max(min, Math.ceil((filled + 1) / 5) * 5); return n - filled; };
  function renderStore() {
    const S = App.state;
    // Everything banked: resources, plus meals and usable items (gear lives in 🧍 Warrior, defenses on the camp grid).
    const banked = Object.keys(Data.RESOURCES).filter(k => S.stockpile[k] > 0).map(k => [k, S.stockpile[k]])
      .concat(Object.keys(Data.ITEMS).filter(k => S.inventory[k] > 0 && !Data.ITEMS[k].gear && !Data.ITEMS[k].kit && !DEF[k]).map(k => [k, S.inventory[k]]));
    banked.sort((a, b) => isFood(b[0]) - isFood(a[0]));
    const empty = n => '<div class="slot empty"></div>'.repeat(n);
    const packed = App.pouchList(), size = Data.backpackSize(App.level), used = App.pouchTotal();
    document.getElementById('fort-store').innerHTML =
      `<div class="pack-h"><b>🎒 Packed for the road</b><small>${used}/${size} backpack slots · tap to unpack</small></div>
       <div class="slots">${packed.map(k => `<button class="slot food" data-unpack="${k}">${picOf(k)}<b>${App.pouch()[k]}</b><small>${nameOf(k)}</small></button>`).join('')}${empty(slots(packed.length, 5))}</div>
       <p class="hint pack-note">Food and potions you pack come with you on every trip, raid and boss fight — tap 🍖 on the board to eat, tap a potion to drink it. It takes up backpack space, so pack only what you'll need.${used ? ' <button class="link" id="unpack-all">Unpack all</button>' : ''}</p>
       <div class="pack-h"><b>🏦 Storehouse</b><small>${banked.length} kinds · tap food or potions to pack</small></div>
       <div class="slots">${banked.map(([k, n]) => `<button class="slot${isFood(k) ? ' food' : ''}" ${isFood(k) ? `data-pack="${k}"` : 'disabled'} title="${nameOf(k)}">${picOf(k)}<b>${n}</b><small>${nameOf(k)}</small></button>`).join('')}${empty(slots(banked.length, 20))}</div>`;
    const root = document.getElementById('fort-store');
    root.querySelectorAll('[data-pack]').forEach(b => { b.onclick = () => { if (App.pouchPut(b.dataset.pack)) Sound.sfx('tick'); else flash('Your backpack is full.'); renderStore(); }; });
    root.querySelectorAll('[data-unpack]').forEach(b => { b.onclick = () => { App.pouchTake(b.dataset.unpack); Sound.sfx('tick'); renderStore(); }; });
    const all = document.getElementById('unpack-all');
    if (all) all.onclick = () => { App.pouchEmpty(); renderStore(); };
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

  return { giveStarterKit, DEF, budget, layout, newAttack, step, holdChance, tickTrip, revengeIfDue, miniMap, render, KEEP_HP, keepNow, raidTier };
})();
