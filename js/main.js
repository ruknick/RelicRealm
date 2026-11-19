// App shell: save data, navigation, home screen, popups, raid prep, spoils.
window.App = (() => {
  const KEY = 'warrior-m3-save-v1';
  const ENEMY_NAME = { goblin: 'goblin village', dwarf: 'dwarf stronghold' };

  let state;

  function fresh() {
    return {
      stockpile: Object.fromEntries(Object.keys(Data.RESOURCES).map(k => [k, 0])),
      inventory: Object.fromEntries(Object.keys(Data.ITEMS).map(k => [k, 0])),
      unlocks: { palisade: false, minecart: false },
      marked: { goblin: 0, dwarf: 0 },
      scraps: { goblin: 0, dwarf: 0 },
      shards: 0,
      shardFrom: {},                     // which lands / enemies have given their relic shard
      xp: 0,
      camp: { cells: {}, chest: [1, 3] },
      lands: { forest: { runs: 0 }, mine: { runs: 0 }, ocean: { runs: 0 }, farm: { runs: 0 } },
      enemyWins: { goblin: 0, dwarf: 0 },
      starterDef: false,
      gear: [],                          // owned gear: [{ id, dur }]
      equip: { weapon: null, tool: null, helmet: null, amulet: null, body: null, gloves: null, legs: null, shield: null },
      captured: { goblin: [], dwarf: [] },   // your weapons the enemy carried off
      hp: 10,                                // your warrior's health (carries between trips)
      stations: { workbench: true, kitchen: true },         // crafting stations built at camp
      grudge: { goblin: 0, dwarf: 0 },       // how angry each enemy is; full = revenge raid
      revenge: null,                         // { enemy, trips } — a war party on its way
      sinceRevenge: 99,                      // trips since the last revenge raid
      bossWins: {},                          // times each boss has been beaten
      chart: 0,                              // fragments of the Wayfarer's Chart found
      seen: {},                          // rare materials already discovered
      profile: null,                     // { name, origin, look }
      story: { chapter: 0, flags: {}, places: {}, introSeen: false },
      debug: { discoverNow: false, eventNow: false },
    };
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    fromJson(raw);
  }
  // Build the game state from a saved JSON string (or a fresh game if there is none).
  let cloudReady = false;
  function fromJson(raw) {
    const base = fresh();
    state = base;
    try {
      if (!raw) return;
      const s = JSON.parse(raw);
      state = {
        stockpile: { ...base.stockpile, ...s.stockpile },
        inventory: { ...base.inventory, ...s.inventory },
        unlocks: { ...base.unlocks, ...s.unlocks },
        marked: typeof s.marked === 'number' ? { goblin: s.marked, dwarf: 0 } : { ...base.marked, ...s.marked },
        scraps: { ...base.scraps, ...s.scraps },
        shards: s.shards || 0,
        shardFrom: s.shardFrom || {},
        xp: s.xp || 0,
        camp: s.camp || { cells: {}, chest: [1, 3] },
        lands: { ...base.lands, ...(s.lands || {}) },
        enemyWins: { ...base.enemyWins, ...(s.enemyWins || {}) },
        starterDef: !!s.starterDef,
        gear: s.gear || [],
        equip: { ...base.equip, ...(s.equip || {}) },
        captured: { ...base.captured, ...(s.captured || {}) },
        hp: s.hp ?? null,
        stations: s.stations || null,
        grudge: { ...base.grudge, ...(s.grudge || {}) },
        revenge: s.revenge || null,
        sinceRevenge: s.sinceRevenge ?? 99,
        bossWins: s.bossWins || {},
        chart: s.chart || 0,
        seen: s.seen || {},
        starterGear: !!s.starterGear,
        debug: { ...base.debug, ...(s.debug || {}) },
        heroAt: s.heroAt || 'camp',
        savedAt: s.savedAt || 0,
        seenBlockers: s.seenBlockers || {},
        bestStars: s.bestStars || {},
        profile: s.profile || null,
        story: s.story || { chapter: 0, flags: {}, places: {}, introSeen: false },
      };
      // Keep everything else the save holds (packed food, bounties, fair tickets, flair…) as-is.
      Object.keys(s).forEach(k => { if (!(k in state)) state[k] = s[k]; });
      migrateGear(s);
      // Raids are land milestones now (a keep every 5 land levels): trim raids banked under the old
      // rules (random tracks, map scraps) down to what the land has actually earned.
      [['goblin', 'forest'], ['dwarf', 'mine']].forEach(([e, land]) => {
        const earned = Math.max(0, Math.floor(Data.landLevel(state.lands[land].runs) / 5) - state.enemyWins[e]);
        state.marked[e] = Math.min(state.marked[e] || 0, earned);
      });
      // Saves from before stations: grant what your level already earned.
      if (!state.stations) {
        state.stations = { workbench: true };
        const L = Data.levelFromXp(state.xp);
        if (L >= Data.STATIONS.smelter.lv) state.stations.smelter = true;
        if (L >= Data.STATIONS.forge.lv) state.stations.forge = true;
        if (L >= Data.STATIONS.dforge.lv && state.enemyWins.dwarf > 0) state.stations.dforge = true;
      }
      if (state.hp == null) state.hp = Data.maxHp(Data.levelFromXp(state.xp));
      state.stations.kitchen = true;
    } catch (e) { /* ignore broken saves */ }
  }

  // Old one-shot weapons become wieldable gear.
  function migrateGear(s) {
    if (s.gear) return;
    const MAP = { club: 'baxe1', sling: 'bow1', stoneaxe: 'waxe1', stonepick: 'pick1', axe: 'waxe2', pickaxe: 'pick2', sword: 'sword2', shiv: 'shiv', dpick: 'dpick' };
    const old = s.inventory || {};
    Object.entries(MAP).forEach(([o, n]) => {
      const count = Math.ceil((old[o] || 0) / ({ axe: 3, pickaxe: 3, sword: 3, shiv: 2, dpick: 3, stoneaxe: 2, stonepick: 2 }[o] || 1));
      for (let i = 0; i < count; i++) addGear(n);
    });
  }

  // ---------- gear ----------
  function addGear(id) {
    state.gear.push({ id, dur: Data.ITEMS[id].dur });
    return Data.ITEMS[id];
  }
  const gearCount = id => state.gear.filter(g => g.id === id).length + Object.values(state.equip).filter(g => g && g.id === id).length;
  // Equip gear from your pack (index into state.gear); the old item goes back in the pack.
  function equip(slot, idx) {
    const item = state.gear.splice(idx, 1)[0];
    if (state.equip[slot]) state.gear.push(state.equip[slot]);
    state.equip[slot] = item;
    save();
  }
  function unequip(slot) {
    if (state.equip[slot]) state.gear.push(state.equip[slot]);
    state.equip[slot] = null;
    save();
  }
  // Wear down the equipped item. Returns the item's name if it broke.
  function wear(slot, n = 1) {
    const g = state.equip[slot];
    if (!g || !Data.ITEMS[g.id].dur) return null;   // weapons, tools & amulets never wear out
    g.dur -= n;
    if (g.dur <= 0) { state.equip[slot] = null; save(); return Data.ITEMS[g.id].name; }
    save();
    return null;
  }

  // ---------- your health ----------
  const maxHp = () => Data.maxHp(level()) + (Data.amuletPower() === 'stone' ? 8 : 0);
  function heal(n) {
    const before = state.hp;
    state.hp = Math.min(maxHp(), state.hp + n);
    save();
    return state.hp - before;
  }
  // A blow from an attacker with this weapon tier. It lands on a random part of you; armor there softens it
  // (better armor than their weapon turns it aside) and takes a little wear.
  function hurtPlayer(weaponTier, extra = 0) {
    if (fx.sleep > 0) return { dmg: 0, note: '', down: false, asleep: true };   // Sleeping draught
    const base = Data.ATTACK[weaponTier] + extra;
    const slots = [['body', 40], ['helmet', 20], ['legs', 20], [state.equip.shield ? 'shield' : 'body', 20]];
    const slot = Data.rollFrom(slots), g = state.equip[slot];
    let dmg = base, note = '';
    if (g) {
      const diff = Data.ITEMS[g.id].tier - weaponTier;
      dmg = diff >= 1 ? 0 : diff === 0 ? Math.ceil(base * 0.4) : diff === -1 ? Math.ceil(base * 0.75) : base;
      note = dmg === 0 ? `your ${Data.ITEMS[g.id].name.toLowerCase()} turns it aside` : `your ${Data.ITEMS[g.id].name.toLowerCase()} softens it`;
      const broke = wear(slot);
      if (broke) note += ` — your ${broke} broke!`;
    }
    state.hp = Math.max(0, state.hp - dmg);
    save();
    return { dmg, note, down: state.hp <= 0 };
  }
  // Food of every kind in the Storehouse (each counts as one ration).
  const foodTotal = () => Data.FOOD_ORDER.reduce((n, k) => n + (state.stockpile[k] || 0), 0);
  // Spend rations for a march, plainest first. Returns false if there isn't enough.
  function spendFood(n) {
    if (foodTotal() < n) return false;
    for (const k of Data.FOOD_ORDER) { const take = Math.min(n, state.stockpile[k] || 0); state.stockpile[k] -= take; n -= take; if (!n) break; }
    save();
    return true;
  }
  // ---------- the food pouch: what you choose to carry on a trip ----------
  // Everything you gather goes to the bank (Storehouse). Before heading out you pack food
  // at Your Camp's Storehouse; it takes backpack slots. One tap of 🍖 on a board eats from it.
  // Leftovers stay packed until you unpack them at camp.
  // Potion effects active on the current board (reset whenever a board starts).
  const fx = { sleep: 0, giant: null };
  const POUCH_MAX = 10;   // (legacy name) — packing is limited by your backpack size instead
  const isMeal = k => !!(Data.ITEMS[k] && Data.ITEMS[k].heal);
  const healOf = k => (isMeal(k) ? Data.ITEMS[k].heal : Data.FOODS[k] || 0);
  const foodName = k => (isMeal(k) ? Data.ITEMS[k].name : Data.RESOURCES[k].label);
  const bankOf = k => (Data.ITEMS[k] ? state.inventory : state.stockpile);
  const pouch = () => (state.pouch ||= {});
  const pouchTotal = () => Object.values(pouch()).reduce((a, b) => a + b, 0);
  function pouchPut(k, n = 1) {
    n = Math.min(n, bankOf(k)[k] || 0, Data.backpackSize(level()) - pouchTotal());
    if (n <= 0) return 0;
    bankOf(k)[k] -= n;
    pouch()[k] = (pouch()[k] || 0) + n;
    save();
    return n;
  }
  function pouchTake(k, n = 1) {
    n = Math.min(n, pouch()[k] || 0);
    if (n <= 0) return 0;
    pouch()[k] -= n;
    if (!pouch()[k]) delete pouch()[k];
    bankOf(k)[k] = (bankOf(k)[k] || 0) + n;
    save();
    return n;
  }
  const pouchEmpty = () => Object.keys(pouch()).forEach(k => pouchTake(k, pouch()[k]));
  function eatPouch(k) {
    if (state.hp >= maxHp() || !(pouch()[k] > 0)) return 0;
    pouch()[k]--;
    if (!pouch()[k]) delete pouch()[k];
    return heal(healOf(k));
  }
  // One tap to eat: the packed food that heals the most without going over your max (or the smallest).
  function eatBest() {
    const list = pouchList().filter(k => healOf(k) > 0), miss = maxHp() - state.hp;
    if (!list.length || miss <= 0) return null;
    const fit = list.filter(k => healOf(k) <= miss);
    const k = fit.length ? fit[0] : list[list.length - 1];
    return { k, got: eatPouch(k) };
  }
  // Pouch contents in a fixed order: biggest heal first.
  const pouchLine = () => (pouchTotal() ? `🍖 Packed food: <b>${pouchList().map(k => `${pouch()[k]} ${foodName(k)}`).join(', ')}</b>` : '🍖 <b>You packed no food</b> — pack some at Your Camp\'s Storehouse so you can heal.');
  const pouchList = () => Object.keys(pouch()).filter(k => pouch()[k] > 0).sort((a, b) => healOf(b) - healOf(a));

  // Eat one piece of food (a given kind, or the plainest you have). Returns { got, kind }.
  function eatFood(kind) {
    if (state.hp >= maxHp()) return 0;
    kind = kind || Data.FOOD_ORDER.find(k => state.stockpile[k] > 0);
    if (!kind || !(state.stockpile[kind] > 0)) return 0;
    state.stockpile[kind]--;
    const got = heal(Data.FOODS[kind]);
    eatFood.last = kind;
    return got;
  }
  // Use a meal (bread, chowder): heals by its own amount.
  function eatMeal(k) {
    const it = Data.ITEMS[k];
    if (!it || !it.heal || state.inventory[k] < 1 || state.hp >= maxHp()) return 0;
    state.inventory[k]--;
    return heal(it.heal);
  }

  // Lose a raid and they may carry off the weapon you were wielding. Next best weapon in your pack takes its place.
  function captureWeapon(enemy) {
    const g = state.equip.weapon;
    if (!g) return null;
    state.captured[enemy].push(g);
    state.equip.weapon = null;
    const next = state.gear.map((x, i) => ({ x, i })).filter(({ x }) => Data.ITEMS[x.id].gear === 'weapon')
      .sort((a, b) => Data.ITEMS[b.x.id].tier - Data.ITEMS[a.x.id].tier)[0];
    if (next) equip('weapon', next.i);
    save();
    return Data.ITEMS[g.id].name;
  }
  // Open their loot chest (and get home with it) to win your captured weapons back.
  function recoverWeapons(enemy) {
    const back = state.captured[enemy].splice(0);
    back.forEach(g => state.gear.push(g));
    if (back.length && !state.equip.weapon) equip('weapon', state.gear.length - 1);
    save();
    return back.map(g => Data.ITEMS[g.id].name);
  }

  function save() {
    state.savedAt = Date.now();
    const json = JSON.stringify(state);
    try { localStorage.setItem(KEY, json); } catch (e) { /* private mode etc. */ }
    Cloud.queue(json);
    renderStock();
  }

  // ---------- cloud save: kept in the artifact's database, private to each player ----------
  // Browser storage can be wiped when the page reopens inside the Claude app, so every save is
  // also written (a moment later, batched) to a per-player record tied to the viewer's account.
  const Cloud = (() => {
    let ref = null, pending = null, timer = null, writing = false, status = 'checking';
    const setStatus = s => { status = s; const el = document.getElementById('cloud-status'); if (el) el.innerHTML = statusText(); };
    const statusText = () => ({
      checking: '☁️ Looking for your saved game…',
      local: '💾 Progress saves on this device · use “Move your save” to take it to another one',
      on: '☁️ Progress saves to your Claude account',
      off: '⚠️ Cloud save unavailable — progress is kept on this device only',
    })[status];
    async function flush() {
      timer = null;
      if (!ref || !pending || writing) return;
      const json = pending; pending = null; writing = true;
      try { await ref.set({ json, savedAt: Date.now() }); } catch (e) { pending = pending || json; }
      writing = false;
      if (pending && !timer) timer = setTimeout(flush, 2000);
    }
    function queue(json) { pending = json; if (ref && !timer) timer = setTimeout(flush, 1500); }
    // Find this player's cloud save. Resolves with its JSON (or null) within ~10 s.
    async function connect() {
      const timeout = new Promise(r => setTimeout(() => r('timeout'), 10000));
      const work = (async () => {
        if (!window.claude || !window.claude.use) return 'local';
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return null;
        const uid = await user.id();
        if (!uid) return null;
        const r = db.collection('data/users/' + uid).doc('save');
        const snap = await r.get();
        ref = r;
        return { json: snap.exists ? snap.data().json : null };
      })().catch(() => null);
      const res = await Promise.race([work, timeout]);
      if (res === 'local') { setStatus('local'); return null; }
      if (!res || res === 'timeout') { setStatus('off'); return null; }
      setStatus('on');
      return res.json || null;
    }
    // Write now (e.g. when the page is being hidden).
    function now() { if (timer) { clearTimeout(timer); flush(); } }
    return { queue, connect, now, statusText };
  })();
  document.addEventListener('visibilitychange', () => { if (document.hidden) Cloud.now(); });

  // ---------- moving a save between devices: a copy-and-paste code ----------
  const exportSave = () => 'TR1:' + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  function importSave(code) {
    let json;
    try {
      code = String(code || '').trim().replace(/\s+/g, '');
      if (!code.startsWith('TR1:')) return false;
      json = decodeURIComponent(escape(atob(code.slice(4))));
      const s = JSON.parse(json);
      if (!s || typeof s !== 'object' || !s.stockpile) return false;
    } catch (e) { return false; }
    fromJson(json);
    save();
    return true;
  }
  async function moveSave() {
    let pasted = '';
    const code = exportSave();
    const c = await choose({
      title: '💾 Move your save',
      html: `<p class="hint">To play on another phone or browser, copy this code, send it to yourself, and paste it there.</p>
        <textarea class="save-code" id="save-out" readonly rows="3">${code}</textarea>
        <p class="hint">Got a code from another device? Paste it here to load it. <b>This replaces the game on this device.</b></p>
        <textarea class="save-code" id="save-in" rows="3" placeholder="Paste a save code (starts with TR1:)"></textarea>`,
      buttons: [{ id: 'copy', label: '📋 Copy my code' }, { id: 'load', label: '⬇ Load pasted code', cls: 'alt' }, { id: 'close', label: 'Close', cls: 'alt' }],
      onOpen: () => { const i = document.getElementById('save-in'); if (i) i.oninput = () => { pasted = i.value; }; },
    });
    if (c === 'copy') {
      let ok = false;
      try { await navigator.clipboard.writeText(code); ok = true; } catch (e) { /* clipboard blocked */ }
      if (!ok) { const o = document.getElementById('save-out'); try { o.select(); ok = document.execCommand('copy'); } catch (e) { /* ignore */ } }
      await choose({ title: ok ? '✓ Copied' : 'Copy it by hand', html: ok ? '<p>Your save code is on the clipboard. Paste it into a note or message to yourself.</p>' : `<p>Press and hold to copy:</p><textarea class="save-code" readonly rows="4">${code}</textarea>`, buttons: [{ id: 'ok', label: 'OK' }] });
    } else if (c === 'load') {
      pasted = pasted || document.getElementById('save-in')?.value || '';
      const ok = importSave(pasted);
      await choose({ title: ok ? '✓ Save loaded' : 'That code didn\'t work', html: ok ? `<p>Welcome back${state.profile ? `, <b>${state.profile.name}</b>` : ''} — level ${level()}.</p>` : '<p>Make sure you copied the whole code, starting with <b>TR1:</b>.</p>', buttons: [{ id: 'ok', label: 'OK' }] });
    }
    Story.title();
  }

  // ---------- install to home screen & play offline (only when hosted on its own site) ----------
  try {
    const own = /^https?:$/.test(location.protocol) && window.top === window && !/claude\.ai$|claudeusercontent\.com$/.test(location.hostname);
    if (own && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  } catch (e) { /* not available */ }

  // ---------- levels ----------
  const level = () => Data.levelFromXp(state.xp);
  // Adds XP; returns the new level if this crossed a level boundary, else 0.
  function addXP(n) {
    const before = level();
    state.xp += n;
    const after = level();
    if (after > before) {
      state.hp = maxHp();                 // a new level: fully rested
      queueLevelUp(before, after);
    }
    save();
    return after > before ? after : 0;
  }

  // ---------- the level-up celebration ----------
  // Shown over everything (boards keep running underneath). Several levels at once share one card.
  const lvQueue = [];
  function queueLevelUp(from, to) {
    for (let L = from + 1; L <= to; L++) lvQueue.push(L);
    clearTimeout(queueLevelUp.t);
    queueLevelUp.t = setTimeout(showLevelUp, 450);
  }
  function showLevelUp() {
    if (!lvQueue.length) return;
    const levels = lvQueue.splice(0), top = levels[levels.length - 1];
    const eraLv = levels.find(L => Data.ERA(L) > Data.ERA(L - 1));
    const perks = levels.flatMap(L => levelPerkList(L).filter(p => !/era begins/.test(p)));
    const name = state.profile ? state.profile.name : 'You';
    const el = document.getElementById('levelup');
    const colors = ['#f3d36a', '#e0604a', '#6ad08a', '#7cc4ef', '#c37ce6', '#fff4d6'];
    el.innerHTML = `<div class="lu-rays"></div>
      ${Array.from({ length: 40 }, (_, i) => `<i class="lu-conf" style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 0.9).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s;--spin:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join('')}
      <div class="lu-card">
        <div class="lu-kicker">✦ Level up ✦</div>
        <div class="lu-badge"><svg viewBox="0 0 120 120" aria-hidden="true">
          <path d="M60 4l15 33 36 4-27 24 8 35-32-18-32 18 8-35L9 41l36-4z" fill="#f3d36a" stroke="#6b4a10" stroke-width="3" stroke-linejoin="round"/>
          <path d="M60 16l10 22 24 3-18 16 5 23-21-12" fill="none" stroke="#fff6c8" stroke-width="2.4" opacity=".7" stroke-linejoin="round"/>
          <text x="60" y="${top >= 10 ? 76 : 78}" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="${top >= 10 ? 34 : 40}" fill="#5a3a08">${top}</text></svg></div>
        <h2>${name} reached level ${top}!</h2>
        ${levels.length > 1 ? `<p class="lu-sub">${levels.length} levels at once!</p>` : ''}
        ${eraLv ? `<div class="lu-era">The ${Data.ERA_NAME[Data.ERA(eraLv)]} era begins!</div>` : ''}
        <ul class="lu-perks">${(perks.length ? perks : ['✨ Your legend grows.']).map(p => `<li>${p}</li>`).join('')}</ul>
        <p class="lu-heal">❤️ Fully rested — your health is restored.</p>
        <button class="big" id="lu-ok">Onward!</button>
      </div>`;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    Sound.sfx('levelup');
    document.getElementById('lu-ok').onclick = () => {
      el.classList.remove('show');
      setTimeout(() => { el.classList.add('hidden'); el.innerHTML = ''; }, 250);
      if (!document.getElementById('screen-home').classList.contains('hidden')) renderHome();
    };
  }
  // What each new level brings: small boosts every level, big unlocks at era thresholds.
  const levelPerks = L => levelPerkList(L).join(' · ') || 'Your legend grows.';
  function levelPerkList(L) {
    const out = [];
    if (Data.maxHp(L) > Data.maxHp(L - 1)) out.push(`❤️ max health ${Data.maxHp(L)}`);
    if (Data.strength(L) > Data.strength(L - 1)) out.push(`💪 +1 weapon damage`);
    if (Data.maxEnergy(L) > Data.maxEnergy(L - 1)) out.push(`⚡ max energy ${Data.maxEnergy(L)}`);
    if (Data.ERA(L) > Data.ERA(L - 1)) out.push(`⚡ +1 starting energy`);
    if (Data.backpackSize(L) > Data.backpackSize(L - 1)) out.push(`🎒 backpack ${Data.backpackSize(L)}`);
    const st = Object.values(Data.STATIONS).find(s => s.lv === L && s.lv > 1);
    if (st) out.push(`${st.icon} you can now build the <b>${st.name}</b> in the Workshop`);
    Data.RECIPES.filter(r => r.lv === L && L > 1).forEach(r => {
      const it = Data.ITEMS[r.id], name = `<b>${Data.recipeName(r)}</b>`;
      const pic = it && it.art ? `<span class="ico">${Art.piece(it.art)}</span>` : r.makes ? `<span class="ico">${Art.tile(Object.keys(r.makes)[0]) || ''}</span>` : '';
      const where = Data.STATIONS[r.station] ? Data.STATIONS[r.station].name : 'Workshop';
      out.push(r.tier === 'food' ? `${pic || '🍲'} cook ${name} in the Kitchen`
        : r.tier === 'potion' ? `${pic || '⚗️'} brew ${name} in the Kitchen cauldron`
        : r.tier === 'smelt' ? `${pic || '🔥'} make ${name} at the ${where}`
        : it && it.gear ? `${pic} ${r.station === 'workbench' ? 'make' : 'forge'} the ${name} at the ${where}`
        : `${pic || '⚒'} craft ${name} at the ${where}`);
    });
    if (Data.ERA(L) > Data.ERA(L - 1)) out.unshift(`<b>The ${Data.ERA_NAME[Data.ERA(L)]} era begins!</b>`);
    return out;
  }

  // ---------- spoils ----------
  const rollSpoil = enemy => { const l = Data.SPOILS[enemy]; return l[Math.floor(Math.random() * l.length)]; };
  function spoilName(k) {
    if (k === 'scraps') return '⛓️ Rusty iron scraps (+3 iron)';
    if (k === 'ingots') return '🧱 Dwarven ingots (+5 iron)';
    const it = Data.ITEMS[k];
    return `${it.gear ? '⚔️' : it.icon} ${it.name}`;
  }
  function grantSpoil(k) {
    if (k === 'scraps') state.stockpile.iron += 3;
    else if (k === 'ingots') state.stockpile.iron += 5;
    else if (Data.ITEMS[k].gear) addGear(k);
    else {
      state.inventory[k] += 1;
      if (k === 'blueprint') state.unlocks.palisade = true;
      if (k === 'cartbp') state.unlocks.minecart = true;
    }
    save();
    return spoilName(k);
  }

  // Special items from an enemy loot chest: keys, map scraps, relic shards.
  // A fragment of the Wayfarer's Chart. Returns a line about how far along it is.
  function grantChart() {
    if (state.chart >= Data.CHART_PIECES) { state.stockpile.gold += 10; save(); return 'You already hold the whole chart — this one sells for 10 gold.'; }
    state.chart++;
    save();
    return state.chart >= Data.CHART_PIECES ? '✦ The Wayfarer\'s Chart is whole! It shows the way beyond the known realm.'
      : `${state.chart}/${Data.CHART_PIECES} pieces of the Wayfarer's Chart`;
  }

  function grantSpecial(k, enemy) {
    const info = Data.FIND_INFO[k === 'scrap' && enemy === 'dwarf' ? 'runescrap' : k];
    if (k === 'key') state.inventory.key++;
    else if (k === 'nugget') state.stockpile.gold += 3;
    else if (k === 'scrap') {
      state.scraps[enemy]++;
      if (state.scraps[enemy] >= 3) { state.scraps[enemy] -= 3; state.marked[enemy]++; save(); return `${info.icon} ${info.name} — map complete, a new target is marked!`; }
    }
    save();
    return `${info.icon} ${info.name}`;
  }

  // Mastering a land (or an enemy's top rank) reveals its relic shard, once.
  function grantShard(src) {
    if (state.shardFrom[src]) return false;
    state.shardFrom[src] = true;
    state.shards++;
    save();
    return true;
  }

  // ---------- popup ----------
  function choose({ title, html, buttons }) {
    const m = document.getElementById('modal');
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = html;
    const box = document.getElementById('modal-btns');
    box.innerHTML = buttons.map(b =>
      `<button class="big ${b.cls || ''}" data-id="${b.id}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('');
    m.classList.remove('hidden');
    document.body.classList.add('modal-open');   // the page behind stays put while a pop-up is open
    m.querySelector('.card').scrollTop = 0;
    return new Promise(res => {
      box.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          const extra = {};
          m.querySelectorAll('input[type=checkbox]').forEach(i => { extra[i.id] = i.checked; });
          m.classList.add('hidden');
          document.body.classList.remove('modal-open');
          choose.last = extra;
          res(btn.dataset.id);
        };
      });
    });
  }

  // ---------- raid prep ----------
  async function prepareRaid(enemy, { fromField = false } = {}) {
    prepareRaid.last = [enemy, { fromField }];
    App.reprep = () => prepareRaid(enemy, { fromField });
    const cfg = Battle.CONFIG[enemy];
    const inv = state.inventory;
    const eq = state.equip;
    const armor = Data.ENEMY_ARMOR[enemy][Data.enemyTier(state.enemyWins[enemy]) - 1];
    const wTier = eq.weapon ? Data.ITEMS[eq.weapon.id].tier : 0;
    const weapons = [eq.weapon ? `⚔️ ${Data.ITEMS[eq.weapon.id].name}` : '⚔️ no weapon equipped', eq.tool ? `🛠 ${Data.ITEMS[eq.tool.id].name}` : '🛠 no tool equipped'];
    if (state.captured[enemy].length) weapons.push(`<br>🎯 They hold your <b>${state.captured[enemy].map(g => Data.ITEMS[g.id].name).join(', ')}</b> — open their loot chest to win it back!`);
    const worn = ['helmet', 'body', 'legs', 'shield'].filter(k => eq[k]).length;
    weapons.push(worn ? `🛡 ${worn} armor piece${worn > 1 ? 's' : ''}` : '🛡 no armor');
    const armorNote = wTier >= armor ? '' : `<p class="warn-note">⚠️ Their troops wear <b>${Data.TIER_LABEL[armor]}</b> armor — your ${wTier ? Data.TIER_LABEL[wTier].toLowerCase() + ' weapon only does a fraction of its damage' : 'bare hands do nothing'}. It can be done, but it'll take many more swings.</p>`;
    const lowHp = state.hp < maxHp() * 0.5 ? `<p class="warn-note">❤️ You're hurt (${state.hp}/${maxHp()}). Eat something first — tap 🧍 Warrior.</p>` : '';
    const canGo = state.hp > 0;
    const boosts = ['drum', 'ale'].filter(k => inv[k] > 0)
      .map(k => `<label class="check"><input type="checkbox" id="use-${k}"> ${Data.ITEMS[k].icon} Use ${Data.ITEMS[k].name} (their defenders wait 3 moves longer)</label>`).join('');
    const choice = await choose({
      title: `${cfg.icon} ${cfg.name} · ${Data.TIER_NAMES[enemy][Data.enemyTier(state.enemyWins[enemy]) - 1]}`,
      html: `<p class="race-rules">⚔️ <b>Raid:</b> break their keep before their defenders wear you down. Every few moves their troops strike at you — your armor takes the blows, food heals you.
          ❤️ <b>${state.hp}/${maxHp()}</b> · <a href="#" id="prep-hero">Armor up / eat</a><br>
          <small>Win and they'll want revenge on your camp — <a href="#" id="prep-fortify">fortify it</a>.</small></p>${lowHp}
        <p class="hint">Rank ${Data.enemyTier(state.enemyWins[enemy])}/4 — each keep you take, the next one (every 5 ${enemy === 'goblin' ? 'Forest' : 'Iron Hills'} levels) is held by tougher troops with better loot. Their King waits at Lv 35.</p>
        <p>${cfg.prep}</p>
        <p>${pouchLine()}</p>
        <p class="hint">Equipped: ${weapons.join(' · ')}</p>${armorNote}
        ${inv.crown > 0 ? '<p class="hint">👑 The Crown: their defenders wait 2 moves longer.</p>' : ''}
        ${boosts}`,
      buttons: [
        { id: 'go', label: canGo ? '⚔️ Attack!' : 'Too hurt — eat first', cls: 'danger', disabled: !canGo },
        { id: 'later', label: fromField ? '📍 Not now — mark it' : 'Not yet', cls: 'alt' },
      ],
    });
    const extra = choose.last || {};
    if (choice !== 'go') {
      if (fromField) state.marked[enemy]++;
      save();
      go('home');
      return;
    }
    if (!fromField) state.marked[enemy] = Math.max(0, state.marked[enemy] - 1);
    let headStart = inv.crown > 0 ? 2 : 0;
    ['drum', 'ale'].forEach(k => { if (extra['use-' + k] && inv[k] > 0) { inv[k]--; headStart += 3; } });
    save();
    go('battle', { enemy, headStart });
  }

  // ---------- screens ----------
  function renderStock() {
    for (const k of Object.keys(Data.RESOURCES)) {
      const e = document.getElementById('s-' + k);
      if (e) e.textContent = state.stockpile[k];
    }
  }

  function itemChip(k, n) {
    const it = Data.ITEMS[k];
    const count = it.tool || it.trinket ? '' : it.weapon ? (it.uses > 1 ? ` · ${n} uses` : ` ×${n}`) : ` ×${n}`;
    return `<span class="item" title="${it.desc || ''}">${it.icon} ${it.name}${count}</span>`;
  }

  function renderHome() {
    World.render();
    document.getElementById('dbg-discover').checked = state.debug.discoverNow;
    document.getElementById('dbg-event').checked = state.debug.eventNow;
  }

  // Every finished trip (gathering or raid): rest a little and let the enemies' plans move on.
  // Returns any warning text for the trip summary.
  function tripDone(kind, info = {}) {
    heal(3);
    return Camp.tickTrip(kind, info);
  }
  // On the map: a revenge raid that has arrived plays out first, then any story beat.
  let homeBusy = false;
  async function homeEvents() {
    if (homeBusy) return;
    homeBusy = true;
    try { await Camp.revengeIfDue(); } finally { homeBusy = false; }
    Story.check();
  }

  // A brand-new journey: fresh save, starter kit, your chosen character.
  function newGame(profile) {
    state = fresh();
    state.profile = profile;
    state.tut = 0;   // first-trip coaching
    state.pouch = { food: 4 };   // a few berries packed for the road
    starterKit();
    save();
  }
  function starterKit() {
    Camp.giveStarterKit();
    if (!state.starterGear) {
      state.starterGear = true;
      ['baxe1', 'waxe1', 'pick1'].forEach(addGear);
      if (!state.equip.weapon) equip('weapon', state.gear.findIndex(g => Data.ITEMS[g.id].gear === 'weapon'));
      if (!state.equip.tool) equip('tool', state.gear.findIndex(g => g.id === 'waxe1'));
    }
  }

  function go(screen, opts) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screen).classList.remove('hidden');
    document.body.classList.toggle('no-stock', screen === 'title' || screen === 'create');
    if (screen === 'home') { renderHome(); Sound.music('home'); Art.setScene('home'); homeEvents(); }
    if (screen === 'title' || screen === 'create') Art.setScene('home');
    if (screen === 'journal') { Story.journal(); Art.setScene('craft'); }
    if (screen === 'fair') { Fair.open(); Sound.music('fair'); Art.setScene('craft'); }
    if (screen === 'fairplay') { Fair.startRound(); Art.setScene('craft'); }
    if (screen === 'fortify') Story.flag('fortify');
    if (screen === 'items') { Items.render(); Art.setScene('craft'); }
    if (screen === 'craft') { Craft.render(opts || {}); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'fortify') { Camp.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'gather') Gather.start(opts);
    if (screen === 'battle') Battle.start(opts);
    if (screen === 'boss') Boss.start(opts);
    window.scrollTo(0, 0);
  }

  function boot() {
    Hero.init();
    document.getElementById('forge-hammer').innerHTML = Art.piece('smithhammer');
    document.getElementById('craft-title-art').innerHTML = Art.piece('smithhammer');
    Art.injectDefs();
    load();
    const loadedAt = state.profile || state.xp > 0 ? (state.savedAt || 1) : 0;   // the real save on this device, before startup writes
    renderStock();
    Gather.init();
    Battle.init();
    Boss.init();
    const on = (id, f) => { document.getElementById(id).onclick = f; };
    on('btn-items', () => go('items'));
    on('btn-hero', () => Hero.open());
    on('items-back', () => go('home'));
    on('craft-back', () => go('home'));
    on('fort-back', () => go('home'));
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'prep-fortify') { e.preventDefault(); document.getElementById('modal').classList.add('hidden'); go('fortify'); }
      if (e.target.id === 'prep-hero') { e.preventDefault(); document.getElementById('modal').classList.add('hidden'); Hero.open({ onClose: () => (App.reprep ? App.reprep() : go('home')) }); }
    });
    on('btn-reset', () => { if (confirm('Reset your whole save and start over?')) { state = fresh(); save(); Story.title(); } });
    on('dbg-level', () => { state.xp = Data.xpForLevel(level() + 1); save(); renderHome(); });
    on('dbg-raid', () => { state.marked.goblin++; state.marked.dwarf++; state.stockpile.food += 8; save(); renderHome(); });
    on('dbg-rich', () => {
      Object.keys(Data.RESOURCES).forEach(k => { state.stockpile[k] += 20; });
      save(); renderHome();
    });
    document.getElementById('dbg-discover').onchange = e => { state.debug.discoverNow = e.target.checked; save(); };
    document.getElementById('dbg-event').onchange = e => { state.debug.eventNow = e.target.checked; save(); };
    Sound.bind();
    starterKit();
    on('btn-journal', () => go('journal'));
    on('journal-back', () => go('home'));
    on('fair-back', () => go('home'));
    Story.title();
    Cloud.connect().then(json => {
      const localAt = loadedAt;
      let cloudAt = 0;
      try { cloudAt = json ? (JSON.parse(json).savedAt || 1) : 0; } catch (e) { /* ignore */ }
      if (json && cloudAt > localAt) {
        fromJson(json);
        try { localStorage.setItem(KEY, json); } catch (e) { /* ignore */ }
      } else if (state.profile || state.xp > 0) {
        Cloud.queue(JSON.stringify(state));   // first time: upload what this device has
      }
      cloudReady = true;
      if (!document.getElementById('screen-title').classList.contains('hidden')) Story.title();
    });
  }

  return {
    moveSave, exportSave, importSave, ENEMY_NAME, grantSpecial, addXP, bountyEvent: (id, n) => Bounty.event(id, n), levelPerks, get level() { return level(); }, boot, go, save, newGame, tripDone, get cloudReady() { return cloudReady; }, cloudStatus: () => Cloud.statusText(), choose, prepareRaid, rollSpoil, spoilName, grantSpoil,
    fx, eatBest, POUCH_MAX, pouch, pouchTotal, pouchPut, pouchTake, pouchEmpty, eatPouch, pouchList, healOf, foodName, pouchLine: () => pouchLine(),
    addGear, gearCount, equip, unequip, wear, captureWeapon, recoverWeapons, grantShard, grantChart, heal, hurtPlayer, eatFood, eatMeal, foodTotal, spendFood, get maxHp() { return maxHp(); },
    get state() { return state; },
  };
})();
