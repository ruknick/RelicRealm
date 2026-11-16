// World map (home screen): tap a place and your warrior travels there.
window.World = (() => {
  // x / y are % positions on the 360x580 map. Only the lands themselves are marked; each land's
  // raid target and boss lair are reached from inside it.
  const SPOTS = [
    { id: 'lair',   x: 80, y: 25.5, icon: '🐉', name: 'Dragon\'s Lair', sub: 'Emberwyrm', boss: 'dragon' },
    { id: 'mine',   x: 24, y: 32.5, icon: '⛏️', name: 'Iron Hills', land: 'mine', raid: 'dwarf', lair: 'golem' },
    { id: 'forest', x: 23, y: 67.5, icon: '🌲', name: 'Whispering Wood', land: 'forest', raid: 'goblin', lair: 'warchief' },
    { id: 'farm',   x: 47, y: 58, icon: '🌾', name: 'Golden Fields', land: 'farm' },
    { id: 'ocean',  x: 78, y: 61.5, icon: '🌊', name: 'Sunlit Coast', land: 'ocean', lair: 'siren' },
    { id: 'camp',   x: 56, y: 81.5, icon: '🏰', name: 'Your Camp', sub: 'fortify', screen: 'fortify' },
    { id: 'craft',  x: 30, y: 90.5, icon: '⚒', art: 'smithhammer', name: 'Workshop', sub: 'craft', screen: 'craft' },
    { id: 'beyond', x: 34, y: 9, icon: '❓', name: 'Beyond the Known Realm', sub: 'uncharted', locked: true },
  ];
  const RAID = { goblin: { icon: '🔥', name: 'Raid the goblin village', how: 'follow 🐾 tracks in the Forest' }, dwarf: { icon: '⚒️', name: 'Raid the dwarf stronghold', how: 'find a ᚱ rune stone in the Iron Hills' } };
  let travelling = false;
  const LAND_NAME = { farm: 'Golden Fields', forest: 'Forest', mine: 'Iron Hills', ocean: 'Sunlit Coast' };
  // Before a boss's lair is found, the map only has rumors.
  const RUMOR = {
    siren: { hint: 'a song on the wind…', title: 'A song on the wind', text: 'Fishers say a voice sings from the rocks at night, and crabs gather on the shore to listen. No one who rows out there comes back.' },
    warchief: { hint: 'war drums in the trees…', title: 'War drums in the trees', text: 'Deep in the forest, drums beat every night. The goblin scouts all seem to answer to someone big.' },
    golem: { hint: 'something moves in the deep…', title: 'Something moves in the deep', text: 'Miners whisper about a cave the dwarves walled up long ago — and about the grinding sound behind the wall.' },
  };

  function render() {
    const st = App.state;
    document.getElementById('world-map').innerHTML = Art.WORLD;

    document.getElementById('world-spots').innerHTML = SPOTS.map(s => {
      let cls = 'spot', sub = s.sub || '';
      const marks = [];
      if (s.land) {
        sub = `Lv ${Data.landLevel(st.lands[s.land].runs)}`;
        if (s.raid && st.marked[s.raid] > 0) marks.push(`<span class="mk raid" title="raid ready">⚔️${st.marked[s.raid] > 1 ? st.marked[s.raid] : ''}</span>`);
        if (s.lair && Boss.unlocked(s.lair)) marks.push(`<span class="mk boss" title="boss lair">${Boss.CONFIG[s.lair].icon}</span>`);
      }
      if (s.boss) { const wins = (st.bossWins || {})[s.boss] || 0; cls += ' bossspot'; sub = wins ? `slain ×${wins}` : s.sub; }
      if (s.id === 'beyond') sub = st.chart >= Data.CHART_PIECES ? 'the chart is whole!' : `chart ${st.chart || 0}/${Data.CHART_PIECES}`;
      if (s.locked) cls += ' locked';
      return `<button class="${cls}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%">
        <span class="sp-seal">${s.art ? Art.piece(s.art) : s.icon}</span><span class="sp-name">${s.name}</span><span class="sp-sub">${sub}${marks.length ? ' ' + marks.join('') : ''}</span></button>`;
    }).join('');
    document.querySelectorAll('.spot').forEach(b => { b.onclick = () => travel(b.dataset.id); });

    const at = SPOTS.find(s => s.id === (st.heroAt || 'camp')) || SPOTS.find(x => x.id === 'camp');
    const hero = document.getElementById('hero');
    hero.style.transition = 'none';
    hero.style.left = at.x + '%';
    hero.style.top = at.y + '%';
    void hero.offsetWidth;
    hero.style.transition = '';
    renderLevel();
    document.getElementById('quest-slot').innerHTML = Story.banner();
    const qb = document.getElementById('quest-banner');
    if (qb) qb.onclick = () => App.go('journal');
    document.getElementById('bounty-slot').innerHTML = Bounty.banner();
    const bb = document.getElementById('bounty-banner');
    if (bb) bb.onclick = () => Bounty.open();
  }

  function renderLevel() {
    const st = App.state, L = App.level, a = Data.xpForLevel(L), b = Data.xpForLevel(L + 1);
    document.getElementById('home-level').innerHTML =
      `<b>${st.profile ? `${Story.ORIGINS[st.profile.origin].icon} ${st.profile.name} · ` : ''}⭐ ${L}</b><span class="xpbar"><i style="width:${Math.round((st.xp - a) / (b - a) * 100)}%"></i></span><small>${st.xp - a}/${b - a} XP</small>`;
  }

  function travel(id) {
    if (travelling) return;
    const s = SPOTS.find(x => x.id === id);
    const st = App.state;
    if (s.locked && s.id === 'beyond') {
      App.choose({
        title: '❓ Beyond the Known Realm',
        html: `${Items.chartHtml()}<p class="story-text">No map goes further than this. Travellers speak of a drowned swamp where giants wade, of tunnels choked with webs, of frozen peaks and haunted barrows.</p>
          <p class="hint">${(App.state.chart || 0) >= Data.CHART_PIECES ? '✦ Your Wayfarer\'s Chart is whole — the way beyond is marked. The new lands arrive in a future update.' : 'Piece together the <b>Wayfarer\'s Chart</b> to find the way: its 7 fragments come from defeating bosses, crystal chests, and — very rarely — from digging.'}</p>`,
        buttons: [{ id: 'ok', label: 'Someday…' }],
      });
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
    setTimeout(async () => {
      hero.classList.remove('walking');
      await Story.visit(s.id);
      travelling = false;
      if (s.land) landMenu(s);
      else if (s.boss) Boss.prepare(s.boss);
      else if (s.screen) App.go(s.screen);
    }, 750);
  }

  // Arriving at a land: gather, or (once found) raid its enemy or face its boss.
  async function landMenu(s) {
    const st = App.state, lv = Data.landLevel(st.lands[s.land].runs);
    const buttons = [{ id: 'gather', label: `${s.icon} Gather here (Lv ${lv})` }];
    const notes = [];
    if (s.raid) {
      const R = RAID[s.raid], rank = Data.TIER_NAMES[s.raid][Data.enemyTier(st.enemyWins[s.raid]) - 1];
      if (st.marked[s.raid] > 0) buttons.push({ id: 'raid', label: `${R.icon} ${R.name} · ${rank}`, cls: 'danger' });
      else notes.push(`${R.icon} <i>No ${s.raid === 'goblin' ? 'goblin village' : 'dwarf stronghold'} found yet — ${R.how}.</i>`);
    }
    if (s.lair) {
      const C = Boss.CONFIG[s.lair];
      if (Boss.unlocked(s.lair)) buttons.push({ id: 'boss', label: `${C.icon} ${C.place}`, cls: 'danger' });
      else notes.push(`${C.icon} <i>${RUMOR[s.lair].text}</i> <small>(${LAND_NAME[s.land]} Lv ${C.unlock.lv})</small>`);
    }
    if (buttons.length === 1 && !st.seenLandMenu?.[s.land]) {
      st.seenLandMenu = { ...(st.seenLandMenu || {}), [s.land]: true };
      App.save();
    } else if (buttons.length === 1) { App.go('gather', { land: s.land }); return; }
    buttons.push({ id: 'back', label: 'Back to the map', cls: 'alt' });
    const c = await App.choose({ title: `${s.icon} ${s.name}`, html: notes.length ? `<div class="land-notes">${notes.map(n => `<p>${n}</p>`).join('')}</div>` : '<p class="hint">What will you do here?</p>', buttons });
    if (c === 'gather') App.go('gather', { land: s.land });
    else if (c === 'raid') App.prepareRaid(s.raid);
    else if (c === 'boss') Boss.prepare(s.lair);
  }

  return { render };
})();
