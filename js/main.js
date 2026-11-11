// App shell: shared state, save/load, navigation, stockpile bar.
window.App = (() => {
  const KEY = 'warrior-m3-save-v1';

  const RESOURCES = {
    wood:  { label: 'Wood' },
    stone: { label: 'Stone' },
    hide:  { label: 'Hide' },
    gold:  { label: 'Gold' },
    iron:  { label: 'Iron' },
  };

  const ITEMS = {
    // Tier 1 (crafting comes next; a test Club + Sling are given for now)
    club:  { name: 'Club',  icon: '🏏', weapon: true, desc: 'Clears 1 tile' },
    sling: { name: 'Sling', icon: '🪃', weapon: true, desc: 'Hits any 1 tile, incl. defenses' },
    fence: { name: 'Wooden fence', icon: '🪵' },
    wall:  { name: 'Stone wall', icon: '🧱' },
    trap:  { name: 'Pit trap', icon: '🕳️' },
    // Goblin spoils (cannot be crafted)
    firepot:   { name: 'Goblin firepot', icon: '🔥', weapon: true, spoil: true, desc: 'Clears a 3x3 area' },
    shiv:      { name: 'Goblin shiv', icon: '🗡️', weapon: true, spoil: true, uses: true, desc: 'Clears 1 tile per use' },
    drum:      { name: 'War drum', icon: '🥁', spoil: true, desc: '+3 moves in your next raid' },
    blueprint: { name: 'Palisade blueprint', icon: '📜', spoil: true, desc: 'Unlocks the Spiked palisade defense' },
  };

  let state;

  function fresh() {
    return {
      stockpile: { wood: 0, stone: 0, hide: 0, gold: 0, iron: 0 },
      // Test starter kit until crafting exists.
      inventory: { club: 1, sling: 1, fence: 0, wall: 0, trap: 0, firepot: 0, shiv: 0, drum: 0, blueprint: 0 },
      unlocks: { palisade: false },
      debug: { encounter: 'random', skipWalk: false },
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
        debug: { ...base.debug, ...s.debug },
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
    const el = document.querySelector(`.res[data-res="${type}"]`);
    if (el) {
      el.classList.remove('bump', 'drop');
      void el.offsetWidth;
      el.classList.add(n >= 0 ? 'bump' : 'drop');
    }
  }

  function renderStock() {
    for (const k of Object.keys(RESOURCES)) {
      document.getElementById('s-' + k).textContent = state.stockpile[k];
    }
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
      '<span class="empty">Raid goblins in the forest to find items you can\'t craft.</span>';
    document.getElementById('dbg-enc').value = state.debug.encounter;
    document.getElementById('dbg-skip').checked = state.debug.skipWalk;
  }

  function go(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screen).classList.remove('hidden');
    if (screen === 'home') renderHome();
    if (screen === 'forest') Forest.start();
    window.scrollTo(0, 0);
  }

  function boot() {
    load();
    renderStock();
    Forest.init();
    document.getElementById('btn-forest').onclick = () => go('forest');
    document.getElementById('btn-reset').onclick = () => {
      if (confirm('Reset all resources and items?')) { state = fresh(); save(); renderHome(); }
    };
    document.getElementById('dbg-enc').onchange = e => { state.debug.encounter = e.target.value; save(); };
    document.getElementById('dbg-skip').onchange = e => { state.debug.skipWalk = e.target.checked; save(); };
    go('home');
  }

  return {
    RESOURCES, ITEMS, boot, go, save, addResource,
    get state() { return state; },
  };
})();
