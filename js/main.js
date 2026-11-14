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
      hp: 10,                                // your warrior's health (carries between trips)
      stations: { workbench: true },         // crafting stations built at camp
      grudge: { goblin: 0, dwarf: 0 },       // how angry each enemy is; full = revenge raid
      revenge: null,                         // { enemy, trips } — a war party on its way
      sinceRevenge: 99,                      // trips since the last revenge raid
      bossWins: {},                          // times each boss has been beaten
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
        hp: s.hp ?? null,
        stations: s.stations || null,
        grudge: { ...base.grudge, ...(s.grudge || {}) },
        revenge: s.revenge || null,
        sinceRevenge: s.sinceRevenge ?? 99,
        bossWins: s.bossWins || {},
        seen: s.seen || {},
        starterGear: !!s.starterGear,
        debug: { ...base.debug, ...(s.debug || {}) },
        heroAt: s.heroAt || 'camp',
        profile: s.profile || null,
        story: s.story || { chapter: 0, flags: {}, places: {}, introSeen: false },
      };
      migrateGear(s);
      // Saves from before stations: grant what your level already earned.
      if (!state.stations) {
        state.stations = { workbench: true };
        const L = Data.levelFromXp(state.xp);
        if (L >= Data.STATIONS.smelter.lv) state.stations.smelter = true;
        if (L >= Data.STATIONS.forge.lv) state.stations.forge = true;
        if (L >= Data.STATIONS.dforge.lv && state.enemyWins.dwarf > 0) state.stations.dforge = true;
      }
      if (state.hp == null) state.hp = Data.maxHp(Data.levelFromXp(state.xp));
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
  const maxHp = () => Data.maxHp(level());
  function heal(n) {
    const before = state.hp;
    state.hp = Math.min(maxHp(), state.hp + n);
    save();
    return state.hp - before;
  }
  // A blow from an attacker with this weapon tier. It lands on a random part of you; armor there softens it
  // (better armor than their weapon turns it aside) and takes a little wear.
  function hurtPlayer(weaponTier, extra = 0) {
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
  // Eat a plain ration from the Storehouse: 1 food → +2 ❤️.
  function eatFood() {
    if (state.stockpile.food < 1 || state.hp >= maxHp()) return 0;
    state.stockpile.food--;
    return heal(2);
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
  // What each new level brings: small boosts every level, big unlocks at era thresholds.
  function levelPerks(L) {
    const out = [];
    if (Data.maxHp(L) > Data.maxHp(L - 1)) out.push(`❤️ max health ${Data.maxHp(L)}`);
    if (Data.strength(L) > Data.strength(L - 1)) out.push(`💪 +1 weapon damage`);
    if (Data.backpackSize(L) > Data.backpackSize(L - 1)) out.push(`🎒 backpack ${Data.backpackSize(L)}`);
    const st = Object.values(Data.STATIONS).find(s => s.lv === L && s.lv > 1);
    if (st) out.push(`${st.icon} you can now build the <b>${st.name}</b> in the Workshop`);
    if (Data.ERA(L) > Data.ERA(L - 1)) out.unshift(`<b>The ${Data.ERA_NAME[Data.ERA(L)]} era begins!</b>`);
    if (Data.maxHp(L) > Data.maxHp(L - 1)) state.hp = Math.min(Data.maxHp(L), state.hp + 2);
    return out.join(' · ') || 'Your legend grows.';
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
    App.reprep = () => prepareRaid(enemy, { fromField });
    const cfg = Battle.CONFIG[enemy];
    const food = state.stockpile.food;
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
    const canGo = food >= cfg.foodCost;
    const boosts = ['drum', 'ale'].filter(k => inv[k] > 0)
      .map(k => `<label class="check"><input type="checkbox" id="use-${k}"> ${Data.ITEMS[k].icon} Use ${Data.ITEMS[k].name} (their defenders wait 3 moves longer)</label>`).join('');
    const choice = await choose({
      title: `${cfg.icon} ${cfg.name} · ${Data.TIER_NAMES[enemy][Data.enemyTier(state.enemyWins[enemy]) - 1]}`,
      html: `<p class="race-rules">⚔️ <b>Raid:</b> break their keep before their defenders wear you down. Every few moves their troops strike at you — your armor takes the blows, food heals you.
          ❤️ <b>${state.hp}/${maxHp()}</b> · <a href="#" id="prep-hero">Armor up / eat</a><br>
          <small>Win and they'll want revenge on your camp — <a href="#" id="prep-fortify">fortify it</a>.</small></p>${lowHp}
        <p class="hint">Rank ${Data.enemyTier(state.enemyWins[enemy])}/4 — every 2 wins they send tougher troops (and better loot).</p>
        <p>${cfg.prep}</p>
        <p>Costs <b>${cfg.foodCost} food</b> — you have <b>${food}</b>.</p>
        <p class="hint">Equipped: ${weapons.join(' · ')}</p>${armorNote}
        ${inv.crown > 0 ? '<p class="hint">👑 The Crown: their defenders wait 2 moves longer.</p>' : ''}
        ${boosts}`,
      buttons: [
        { id: 'go', label: canGo ? '⚔️ Attack!' : `Need ${cfg.foodCost} food`, cls: 'danger', disabled: !canGo || state.hp <= 0 },
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
    if (screen === 'fortify') Story.flag('fortify');
    if (screen === 'items') { Items.render(); Art.setScene('craft'); }
    if (screen === 'craft') { Craft.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'fortify') { Camp.render(); Sound.music('home'); Art.setScene('craft'); }
    if (screen === 'gather') Gather.start(opts);
    if (screen === 'battle') Battle.start(opts);
    if (screen === 'boss') Boss.start(opts);
    window.scrollTo(0, 0);
  }

  function boot() {
    Hero.init();
    Art.injectDefs();
    load();
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
    Story.title();
  }

  return {
    ENEMY_NAME, grantSpecial, addXP, levelPerks, get level() { return level(); }, boot, go, save, newGame, tripDone, choose, prepareRaid, rollSpoil, spoilName, grantSpoil,
    addGear, gearCount, equip, unequip, wear, captureWeapon, recoverWeapons, grantShard, heal, hurtPlayer, eatFood, eatMeal, get maxHp() { return maxHp(); },
    get state() { return state; },
  };
})();
