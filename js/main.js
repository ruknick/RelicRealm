// App shell: shared state, save/load, navigation, stockpile bar, popups, raid prep.
window.App = (() => {
  const KEY = 'warrior-m3-save-v1';

  const RESOURCES = {
    wood:  { label: 'Wood' },
    stone: { label: 'Stone' },
    hide:  { label: 'Hide' },
    food:  { label: 'Food' },
    gold:  { label: 'Gold' },
    iron:  { label: 'Iron' },
  };

  const ITEMS = {
    // Tier 1 (crafting comes later; a test Club + Sling are given for now)
    club:  { name: 'Club',  icon: '🏏', weapon: true, desc: 'Clears 1 tile' },
    sling: { name: 'Sling', icon: '🪃', weapon: true, desc: 'Hits any 1 tile, incl. defenses' },
    fence: { name: 'Wooden fence', icon: '🪵' },
    wall:  { name: 'Stone wall', icon: '🧱' },
    trap:  { name: 'Pit trap', icon: '🕳️' },
    // Goblin spoils (cannot be crafted)
    firepot:   { name: 'Goblin firepot', icon: '🔥', weapon: true, spoil: true, desc: 'Clears a 3x3 area' },
    shiv:      { name: 'Goblin shiv', icon: '🗡️', weapon: true, spoil: true, uses: true, desc: 'Clears 1 tile per use' },
    drum:      { name: 'War drum', icon: '🥁', spoil: true, desc: '+3 moves in a raid' },
    blueprint: { name: 'Palisade blueprint', icon: '📜', spoil: true, desc: 'Unlocks the Spiked palisade defense' },
  };
  const SPOILS = ['firepot', 'scraps', 'shiv', 'drum', 'blueprint'];

  let state;

  function fresh() {
    return {
      stockpile: { wood: 0, stone: 0, hide: 0, food: 0, gold: 0, iron: 0 },
      inventory: { club: 1, sling: 1, fence: 0, wall: 0, trap: 0, firepot: 0, shiv: 0, drum: 0, blueprint: 0 },
      unlocks: { palisade: false },
      marked: 0,                       // goblin villages found and marked on the map
      debug: { tracksNow: false },
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
        marked: s.marked || 0,
        debug: { tracksNow: !!(s.debug && s.debug.tracksNow) },
      };
    } catch (e) { /* ignore broken saves */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
    renderStock();
  }

  function addResource(type, n) {
    state.stockpile[type] = Math.max(0, state.stockpile[type] + n);
    save();
  }

  // ---------- spoils ----------
  const rollSpoil = () => SPOILS[Math.floor(Math.random() * SPOILS.length)];
  function spoilName(k) {
    if (k === 'scraps') return '⛓️ Rusty iron scraps (+3 iron)';
    if (k === 'shiv') return '🗡️ Goblin shiv (2 uses)';
    return `${ITEMS[k].icon} ${ITEMS[k].name}`;
  }
  function grantSpoil(k) {
    if (k === 'scraps') state.stockpile.iron += 3;
    else if (k === 'shiv') state.inventory.shiv += 2;
    else {
      state.inventory[k] += 1;
      if (k === 'blueprint') state.unlocks.palisade = true;
    }
    save();
    return spoilName(k);
  }

  // ---------- popup ----------
  // Shows a modal with buttons; resolves with the id of the button pressed.
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
  async function prepareRaid({ fromForest = false } = {}) {
    const food = state.stockpile.food;
    const cost = Battle.FOOD_COST;
    const inv = state.inventory;
    const weapons = Object.keys(ITEMS).filter(k => ITEMS[k].weapon && inv[k] > 0)
      .map(k => `${ITEMS[k].icon} ${ITEMS[k].name}${ITEMS[k].uses ? ` (${inv[k]} uses)` : ` ×${inv[k]}`}`);
    const canGo = food >= cost;
    const choice = await choose({
      title: '⚔️ Goblin Village',
      html: `<p>The village is hidden in fog. Scout it, find the <b>keep</b> and break it.</p>
        <p>Every 3 moves the goblins act: spears, sneaky goblins, rebuilt fences.</p>
        <p>Costs <b>${cost} food</b> — you have <b>${food}</b>.</p>
        <p class="hint">Weapons: ${weapons.length ? weapons.join(', ') : 'none'}</p>
        ${inv.drum > 0 ? '<label class="check"><input type="checkbox" id="use-drum"> 🥁 Beat the war drum (+3 moves, uses it)</label>' : ''}`,
      buttons: [
        { id: 'go', label: canGo ? '⚔️ Attack!' : `Need ${cost} food`, cls: 'danger', disabled: !canGo },
        { id: 'later', label: fromForest ? '📍 Not now — mark it' : 'Not yet', cls: 'alt' },
      ],
    });
    const extra = choose.last || {};
    if (choice !== 'go') {
      if (fromForest) state.marked++;
      save();
      go('home');
      return;
    }
    state.stockpile.food -= cost;
    if (!fromForest) state.marked = Math.max(0, state.marked - 1);
    const drum = !!extra['use-drum'] && inv.drum > 0;
    if (drum) inv.drum--;
    save();
    go('battle', { drum });
  }

  // ---------- screens ----------
  function renderStock() {
    for (const k of Object.keys(RESOURCES)) document.getElementById('s-' + k).textContent = state.stockpile[k];
  }

  function itemChip(k, n) {
    const it = ITEMS[k];
    const count = it.uses ? `${n} use${n === 1 ? '' : 's'}` : `×${n}`;
    return `<span class="item" title="${it.desc || ''}">${it.icon} ${it.name} ${count}</span>`;
  }

  function renderHome() {
    const inv = state.inventory;
    const normal = Object.keys(inv).filter(k => !ITEMS[k].spoil && inv[k] > 0);
    const spoils = Object.keys(inv).filter(k => ITEMS[k].spoil && inv[k] > 0);
    document.getElementById('home-inventory').innerHTML = normal.length
      ? normal.map(k => itemChip(k, inv[k])).join('')
      : '<span class="empty">Nothing yet.</span>';
    let sp = spoils.map(k => itemChip(k, inv[k])).join('');
    if (state.unlocks.palisade) sp += '<span class="item unlock">🔓 Spiked palisade unlocked</span>';
    document.getElementById('home-spoils').innerHTML = sp ||
      '<span class="empty">Raid goblin villages to find items you can\'t craft.</span>';

    const raid = document.getElementById('btn-raid');
    raid.disabled = state.marked < 1;
    raid.innerHTML = state.marked > 0
      ? `⚔️ Raid Goblin Village <small>${state.marked} marked</small>`
      : '⚔️ Raid Goblin Village <small>follow 🐾 tracks in the forest to find one</small>';
    document.getElementById('dbg-tracks').checked = state.debug.tracksNow;
  }

  function go(screen, opts) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screen).classList.remove('hidden');
    if (screen === 'home') renderHome();
    if (screen === 'forest') Forest.start();
    if (screen === 'battle') Battle.start(opts);
    window.scrollTo(0, 0);
  }

  function boot() {
    load();
    renderStock();
    Forest.init();
    Battle.init();
    document.getElementById('btn-forest').onclick = () => go('forest');
    document.getElementById('btn-raid').onclick = () => prepareRaid();
    document.getElementById('btn-reset').onclick = () => {
      if (confirm('Reset all resources and items?')) { state = fresh(); save(); renderHome(); }
    };
    document.getElementById('dbg-tracks').onchange = e => { state.debug.tracksNow = e.target.checked; save(); };
    document.getElementById('dbg-village').onclick = () => {
      state.marked++; state.stockpile.food += 5; save(); renderHome();
    };
    go('home');
  }

  return {
    RESOURCES, ITEMS, boot, go, save, addResource, choose, prepareRaid,
    rollSpoil, spoilName, grantSpoil,
    get state() { return state; },
  };
})();
