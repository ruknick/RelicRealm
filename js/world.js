// World map (home screen): tap a place and your warrior travels there.
window.World = (() => {
  // x / y are % positions on the 360x480 map.
  const SPOTS = [
    { id: 'lair',   x: 80, y: 11, icon: '🐉', name: 'Dragon\'s Lair', sub: 'coming soon', locked: true },
    { id: 'mine',   x: 21, y: 19, icon: '⛏️', name: 'Iron Hills', sub: 'stone · iron · coal', land: 'mine' },
    { id: 'dwarf',  x: 41, y: 29, icon: '⚒️', name: 'Dwarf Stronghold', raid: 'dwarf', how: 'find a ᚱ rune stone in the Iron Hills' },
    { id: 'goblin', x: 47, y: 50, icon: '🔥', name: 'Goblin Village', raid: 'goblin', how: 'follow 🐾 tracks in the Forest' },
    { id: 'forest', x: 21, y: 64, icon: '🌲', name: 'Forest', sub: 'wood · hide · food', land: 'forest' },
    { id: 'ocean',  x: 76, y: 58, icon: '🌊', name: 'Sunlit Coast', sub: 'water · fish · driftwood', land: 'ocean' },
    { id: 'camp',   x: 56, y: 79, icon: '🏰', name: 'Your Camp', sub: 'fortify', screen: 'fortify' },
    { id: 'craft',  x: 26, y: 93, icon: '🔨', name: 'Workshop', sub: 'craft', screen: 'craft' },
  ];
  let travelling = false;

  function render() {
    const st = App.state;
    document.getElementById('world-map').innerHTML = Art.WORLD;
    const map = document.getElementById('world-map');
    map.querySelectorAll('.wm-site.goblin').forEach(e => e.classList.toggle('dim', st.marked.goblin < 1));
    map.querySelectorAll('.wm-site.dwarf').forEach(e => e.classList.toggle('dim', st.marked.dwarf < 1));

    document.getElementById('world-spots').innerHTML = SPOTS.map(s => {
      let cls = 'spot', badge = '', sub = s.sub || '';
      if (s.land) sub = `Lv ${Data.landLevel(st.lands[s.land].runs)} · ${s.sub}`;
      if (s.raid) {
        const n = st.marked[s.raid];
        const rank = Data.TIER_NAMES[s.raid][Data.enemyTier(st.enemyWins[s.raid]) - 1];
        if (n > 0) { badge = `<span class="badge">⚔️ ${n}</span>`; sub = `${rank} · raid!`; cls += ' raid'; }
        else { cls += ' unknown'; sub = 'not found yet'; }
      }
      if (s.locked) cls += ' locked';
      return `<button class="${cls}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%">
        <span class="sp-icon">${s.icon}</span><span class="sp-text"><b>${s.name}</b><small>${sub}</small></span>${badge}</button>`;
    }).join('');
    document.querySelectorAll('.spot').forEach(b => { b.onclick = () => travel(b.dataset.id); });

    const at = SPOTS.find(s => s.id === (st.heroAt || 'camp')) || SPOTS[6];
    const hero = document.getElementById('hero');
    hero.style.transition = 'none';
    hero.style.left = at.x + '%';
    hero.style.top = at.y + '%';
    void hero.offsetWidth;
    hero.style.transition = '';
    renderLevel();
  }

  function renderLevel() {
    const st = App.state, L = App.level, a = Data.xpForLevel(L), b = Data.xpForLevel(L + 1);
    document.getElementById('home-level').innerHTML =
      `<b>⭐ Level ${L}</b><span class="xpbar"><i style="width:${Math.round((st.xp - a) / (b - a) * 100)}%"></i></span><small>${st.xp - a}/${b - a} XP</small>`;
  }

  function travel(id) {
    if (travelling) return;
    const s = SPOTS.find(x => x.id === id);
    const st = App.state;
    if (s.locked) {
      App.choose({
        title: '🐉 The Dragon\'s Lair',
        html: `<p>A dragon sleeps inside the fire mountain, on a hoard of gold and relics.</p>
          <p class="hint">Coming next: lava that spreads across the board, dragonfire, and treasure you can't find anywhere else.</p>
          <p>Prepare now: gather <b>💧 water</b> at the Sunlit Coast and craft <b>Water flasks</b> in the Workshop to douse the flames.</p>`,
        buttons: [{ id: 'ok', label: 'I\'ll be ready' }],
      });
      return;
    }
    if (s.raid && st.marked[s.raid] < 1) {
      App.choose({ title: `${s.icon} ${s.name}`, html: `<p>You haven't found one yet.</p><p class="hint">To find it: ${s.how}.</p>`, buttons: [{ id: 'ok', label: 'Got it' }] });
      return;
    }
    travelling = true;
    const hero = document.getElementById('hero');
    hero.style.left = s.x + '%';
    hero.style.top = s.y + '%';
    hero.classList.add('walking');
    Sound.sfx('whoosh');
    st.heroAt = id;
    App.save();
    setTimeout(() => {
      hero.classList.remove('walking');
      travelling = false;
      if (s.land) App.go('gather', { land: s.land });
      else if (s.raid) App.prepareRaid(s.raid);
      else if (s.screen) App.go(s.screen);
    }, 750);
  }

  return { render };
})();
