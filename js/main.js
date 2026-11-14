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
      lands: { forest: { runs: 0 }, mine: { runs: 0 }, ocean: { runs: 0 } },
      enemyWins: { goblin: 0, dwarf: 0 },
      starterDef: false,
      gear: [],                          // owned gear: [{ id, dur }]
      equip: { weapon: null, tool: null, helmet: null, amulet: null, body: null, gloves: null, legs: null, shield: null },
      captured: { goblin: [], dwarf: [] },   // your weapons the enemy carried off
      seen: {},                          // rare materials already discovered
      profile: null,                     // { name, origin, look }
      story: { chapter: 0, flags: {}, places: {}, introSeen: false },
      debug: { discoverNow: false, eventNow: false },
    };
  }

  function load() {
    const base = fresh();
    state = base;
    try {
      const raw = localStorage.getItem(KEY);
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
        seen: s.seen || {},
        starterGear: !!s.starterGear,
        debug: { ...base.debug, ...(s.debug || {}) },
        heroAt: s.heroAt || 'camp',
        profile: s.profile || null,
        story: s.story || { chapter: 0, flags: {}, places: {}, introSeen: false },
      };
      migrateGear(s);
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

  // Worn armor as shield-heart layers on your keep, outermost first (shield, then helmet, body, legs).
  function wardLayers() {
    return ['shield', 'helmet', 'body', 'legs'].filter(s => state.equip[s]).map(s => {
      const it = Data.ITEMS[state.equip[s].id];
      return { slot: s, name: it.name, hard: it.tier, hp: Data.WARD[s], max: Data.WARD[s] };
    });
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
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
    renderStock();
  }

  // ---------- levels ----------
  const level = () => Data.levelFromXp(state.xp);
  // Adds XP; returns the new level if this crossed a level boundary, else 0.
  function addXP(n) {
    const before = level();
    state.xp += n;
    save();
    const after = level();
    return after > before ? after : 0;
  }
  function levelPerks(L) {
    const a = Data.levelInfo(L - 1), b = Data.levelInfo(L);
    const out = [];
    if (b.startObstacles > a.startObstacles) out.push('more obstacles');
    if (b.growEvery && b.growEvery !== a.growEvery) out.push(`new ones every ${b.growEvery} moves`);
    if (b.hpBonus > a.hpBonus) out.push('tougher obstacles');
    if (b.buried > a.buried) out.push(`${b.buried} buried finds per board`);
    return out.length ? `The wilds grow wilder: ${out.join(', ')}.` : 'Your legend grows.';
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
  function grantSpecial(k, enemy) {
    const info = Data.FIND_INFO[k];
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
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    const box = document.getElementById('modal-btns');
    box.innerHTML = buttons.map(b =>
      `<button class="big ${b.cls || ''}" data-id="${b.id}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('');
    m.classList.remove('hidden');
    return new Promise(res => {
      box.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          const extra = {};
          m.querySelectorAll('input[type=checkbox]').forEach(i => { extra[i.id] = i.checked; });
          m.classList.add('hidden');
          choose.last = extra;
          res(btn.dataset.id);
        };
      });
    });
  }

  // ---------- raid prep ----------
  async function prepareRaid(enemy, { fromField = false } = {}) {
    prepareRaid.last = [enemy, { fromField }];
    const cfg = Battle.CONFIG[enemy];
    const food = state.stockpile.food;
    const inv = state.inventory;
    const eq = state.equip;
    const armor = Data.ENEMY_ARMOR[enemy][Data.enemyTier(state.enemyWins[enemy]) - 1];
    const wTier = eq.weapon ? Data.ITEMS[eq.weapon.id].tier : 0;
    const weapons = [eq.weapon ? `⚔️ ${Data.ITEMS[eq.weapon.id].name}` : '⚔️ no weapon equipped', eq.tool ? `🛠 ${Data.ITEMS[eq.tool.id].name}` : '🛠 no tool equipped'];
    const shields = wardLayers().reduce((n, w) => n + w.max, 0);
    if (state.captured[enemy].length) weapons.push(`<br>🎯 They hold your <b>${state.captured[enemy].map(g => Data.ITEMS[g.id].name).join(', ')}</b> — open their loot chest to win it back!`);
    weapons.push(shields ? `🛡 armor +${shields} shield hearts` : '🛡 no armor');
    const armorNote = wTier >= armor ? '' : `<p class="warn-note">⚠️ Their troops wear <b>${Data.TIER_LABEL[armor]}</b> armor — your ${wTier ? Data.TIER_LABEL[wTier].toLowerCase() + ' weapon bounces off' : 'bare hands do nothing'}. Craft ${Data.TIER_LABEL[armor].toLowerCase()} weapons!</p>`;
    const canGo = food >= cfg.foodCost;
    const boosts = ['drum', 'ale'].filter(k => inv[k] > 0)
      .map(k => `<label class="check"><input type="checkbox" id="use-${k}"> ${Data.ITEMS[k].icon} Use ${Data.ITEMS[k].name} (they start 3 moves behind)</label>`).join('');
    const choice = await choose({
      title: `${cfg.icon} ${cfg.name} · ${Data.TIER_NAMES[enemy][Data.enemyTier(state.enemyWins[enemy]) - 1]}`,
      html: `<p class="race-rules">🏁 <b>Siege Race:</b> you attack their base while they attack your camp. <b>Fewest moves to break the other keep wins.</b> Big combos throw rubble in their way.
          Your camp: they need about <b>${Camp.estimate(enemy)}</b> moves. <a href="#" id="prep-fortify">Fortify it</a> · <a href="#" id="prep-hero">Armor up</a></p>
        <p class="hint">Rank ${Data.enemyTier(state.enemyWins[enemy])}/4 — every 2 wins they send tougher troops (and better loot).</p>
        <p>${cfg.prep}</p>
        <p>Costs <b>${cfg.foodCost} food</b> — you have <b>${food}</b>.</p>
        <p class="hint">Equipped: ${weapons.join(' · ')}</p>${armorNote}
        ${inv.crown > 0 ? '<p class="hint">👑 The Crown: they start 2 moves behind.</p>' : ''}
        ${boosts}`,
      buttons: [
        { id: 'go', label: canGo ? '⚔️ Attack!' : `Need ${cfg.foodCost} food`, cls: 'danger', disabled: !canGo },
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
    state.stockpile.food -= cfg.foodCost;
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

  // A brand-new journey: fresh save, starter kit, your chosen character.
  function newGame(profile) {
    state = fresh();
    state.profile = profile;
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
    if (screen === 'home') { renderHome(); Sound.music('home'); Art.setScene('home'); Story.check(); }
    if (screen === 'title' || screen === 'create') Art.setScene('home');
    if (screen === 'journal') { Story.journal(); Art.setScene('craft'); }
    if (screen === 'fortify') Story.flag('fortify');
    if (screen === 'items') { Items.render(); Art.setScene('craft'); }
    if (screen === 'craft') { Craft.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'fortify') { Camp.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'gather') Gather.start(opts);
    if (screen === 'battle') Battle.start(opts);
    window.scrollTo(0, 0);
  }

  function boot() {
    Hero.init();
    Art.injectDefs();
    load();
    renderStock();
    Gather.init();
    Battle.init();
    const on = (id, f) => { document.getElementById(id).onclick = f; };
    on('btn-items', () => go('items'));
    on('btn-hero', () => Hero.open());
    on('items-back', () => go('home'));
    on('craft-back', () => go('home'));
    on('fort-back', () => go('home'));
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'prep-fortify') { e.preventDefault(); document.getElementById('modal').classList.add('hidden'); go('fortify'); }
      if (e.target.id === 'prep-hero') { e.preventDefault(); document.getElementById('modal').classList.add('hidden'); Hero.open({ onClose: () => prepareRaid(...prepareRaid.last) }); }
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
    Story.title();
  }

  return {
    ENEMY_NAME, grantSpecial, addXP, levelPerks, get level() { return level(); }, boot, go, save, newGame, choose, prepareRaid, rollSpoil, spoilName, grantSpoil,
    addGear, gearCount, equip, unequip, wear, wardLayers, captureWeapon, recoverWeapons, grantShard,
    get state() { return state; },
  };
})();
