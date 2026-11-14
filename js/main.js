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
      xp: 0,
      camp: { cells: {}, chest: [1, 3] },
      starterDef: false,
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
        xp: s.xp || 0,
        camp: s.camp || { cells: {}, chest: [1, 3] },
        starterDef: !!s.starterDef,
        debug: { ...base.debug, ...(s.debug || {}) },
        heroAt: s.heroAt || 'camp',
      };
    } catch (e) { /* ignore broken saves */ }
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
    return `${it.icon} ${it.name}${it.uses > 1 ? ` (${it.uses} uses)` : ''}`;
  }
  function grantSpoil(k) {
    if (k === 'scraps') state.stockpile.iron += 3;
    else if (k === 'ingots') state.stockpile.iron += 5;
    else {
      state.inventory[k] += Data.ITEMS[k].uses || 1;
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
    else if (k === 'shard') {
      state.shards++;
      if (state.shards >= 5) { state.shards -= 5; state.inventory.crown++; save(); return `${info.icon} ${info.name} — 👑 the Old King's Crown is complete!`; }
    } else if (k === 'scrap') {
      state.scraps[enemy]++;
      if (state.scraps[enemy] >= 3) { state.scraps[enemy] -= 3; state.marked[enemy]++; save(); return `${info.icon} ${info.name} — map complete, a new target is marked!`; }
    }
    save();
    return `${info.icon} ${info.name}`;
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
    const cfg = Battle.CONFIG[enemy];
    const food = state.stockpile.food;
    const inv = state.inventory;
    const weapons = Object.keys(Data.ITEMS).filter(k => Data.ITEMS[k].weapon && inv[k] > 0)
      .map(k => `${Data.ITEMS[k].icon} ${Data.ITEMS[k].name} ${inv[k]}`);
    const canGo = food >= cfg.foodCost;
    const boosts = ['drum', 'ale'].filter(k => inv[k] > 0)
      .map(k => `<label class="check"><input type="checkbox" id="use-${k}"> ${Data.ITEMS[k].icon} Use ${Data.ITEMS[k].name} (they start 3 moves behind)</label>`).join('');
    const choice = await choose({
      title: `${cfg.icon} ${cfg.name}`,
      html: `<p class="race-rules">🏁 <b>Siege Race:</b> you attack their base while they attack your camp. <b>Fewest moves to break the other keep wins.</b> Big combos throw rubble in their way.
          Your camp: they need about <b>${Camp.estimate(enemy)}</b> moves. <a href="#" id="prep-fortify">Fortify it</a></p>
        <p>${cfg.prep}</p>
        <p>Costs <b>${cfg.foodCost} food</b> — you have <b>${food}</b>.</p>
        <p class="hint">Weapons: ${weapons.length ? weapons.join(', ') : 'none — craft some first!'}</p>
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

  function go(screen, opts) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screen).classList.remove('hidden');
    if (screen === 'home') { renderHome(); Sound.music('home'); Art.setScene('home'); }
    if (screen === 'items') { Items.render(); Art.setScene('craft'); }
    if (screen === 'craft') { Craft.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'fortify') { Camp.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'gather') Gather.start(opts);
    if (screen === 'battle') Battle.start(opts);
    window.scrollTo(0, 0);
  }

  function boot() {
    load();
    renderStock();
    Gather.init();
    Battle.init();
    const on = (id, f) => { document.getElementById(id).onclick = f; };
    on('btn-items', () => go('items'));
    on('items-back', () => go('home'));
    on('craft-back', () => go('home'));
    on('fort-back', () => go('home'));
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'prep-fortify') { e.preventDefault(); document.getElementById('modal').classList.add('hidden'); go('fortify'); }
    });
    on('btn-reset', () => { if (confirm('Reset all resources and items?')) { state = fresh(); save(); renderHome(); } });
    on('dbg-level', () => { state.xp = Data.xpForLevel(level() + 1); save(); renderHome(); });
    on('dbg-raid', () => { state.marked.goblin++; state.marked.dwarf++; state.stockpile.food += 8; save(); renderHome(); });
    on('dbg-rich', () => {
      Object.keys(Data.RESOURCES).forEach(k => { state.stockpile[k] += 20; });
      save(); renderHome();
    });
    document.getElementById('dbg-discover').onchange = e => { state.debug.discoverNow = e.target.checked; save(); };
    document.getElementById('dbg-event').onchange = e => { state.debug.eventNow = e.target.checked; save(); };
    Sound.bind();
    Camp.giveStarterKit();
    go('home');
  }

  return {
    ENEMY_NAME, grantSpecial, addXP, levelPerks, get level() { return level(); }, boot, go, save, choose, prepareRaid, rollSpoil, spoilName, grantSpoil,
    get state() { return state; },
  };
})();
