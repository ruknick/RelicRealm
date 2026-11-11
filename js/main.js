// App shell: shared state, save/load, navigation, stockpile bar.
window.App = (() => {
  const KEY = 'warrior-m3-save-v1';

  const RESOURCES = {
    wood:  { label: 'Wood' },
    stone: { label: 'Stone' },
    hide:  { label: 'Hide' },
    gold:  { label: 'Gold' },
  };

  // Items (crafting comes in step 3; weapons are usable on forest goblins now).
  const ITEMS = {
    club:  { name: 'Club',  icon: '🏏', weapon: true },
    sling: { name: 'Sling', icon: '🪃', weapon: true },
    fence: { name: 'Wooden fence', icon: '🪵' },
    wall:  { name: 'Stone wall', icon: '🧱' },
    trap:  { name: 'Pit trap', icon: '🕳️' },
  };

  let state;

  function fresh() {
    return {
      stockpile: { wood: 0, stone: 0, hide: 0, gold: 0 },
      // Test starter kit so goblin weapon use can be tried before crafting exists.
      inventory: { club: 1, sling: 1, fence: 0, wall: 0, trap: 0 },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const base = fresh();
        state = {
          stockpile: { ...base.stockpile, ...s.stockpile },
          inventory: { ...base.inventory, ...s.inventory },
        };
        return;
      }
    } catch (e) { /* ignore broken saves */ }
    state = fresh();
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

  function renderHome() {
    const inv = document.getElementById('home-inventory');
    const items = Object.entries(state.inventory).filter(([, n]) => n > 0);
    inv.innerHTML = items.length
      ? items.map(([k, n]) => `<span class="item">${ITEMS[k].icon} ${ITEMS[k].name} ×${n}</span>`).join('')
      : '<span class="empty">Nothing yet.</span>';
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
    go('home');
  }

  return {
    RESOURCES, ITEMS, boot, go, save, addResource,
    get state() { return state; },
  };
})();
