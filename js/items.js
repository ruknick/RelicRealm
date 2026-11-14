// Items screen: Special items · Materials · Gear.
window.Items = (() => {
  let tab = 'special';

  const card = (icon, name, count, desc, owned = true) =>
    `<div class="icard${owned ? '' : ' none'}"><div class="ic-icon">${icon}</div>
      <div class="ic-body"><div class="ic-name">${name}${count !== '' ? ` <b>${count}</b>` : ''}</div><div class="ic-desc">${desc}</div></div></div>`;
  const itemIcon = k => (Data.ITEMS[k].art ? Art.piece(Data.ITEMS[k].art) : Art.hasPiece(k) && !Data.ITEMS[k].weapon ? Art.piece(k) : Data.ITEMS[k].icon);

  function special() {
    const st = App.state, inv = st.inventory;
    let html = '<h3 class="craft-h">🧭 Quest items</h3>';
    [['key', 'Old keys'], ['goldkey', 'Gold keys'], ['crystalkey', 'Crystal keys']].forEach(([k, n]) => {
      html += card(itemIcon(k), n, `×${inv[k]}`, Data.ITEMS[k].desc + (k === 'key' ? ' Upgrade 2 Old keys + 6 gold → Gold key in the Workshop.' : k === 'goldkey' ? ' Upgrade 2 Gold keys + water & coal → Crystal key.' : ''), inv[k] > 0);
    });
    html += card('🗺️', 'Goblin map', `${st.scraps.goblin}/3`, '3 scraps reveal a goblin village on the world map.', st.scraps.goblin > 0);
    html += card('🗺️', 'Dwarf map', `${st.scraps.dwarf}/3`, '3 scraps reveal a dwarf stronghold on the world map.', st.scraps.dwarf > 0);
    html += card('💎', 'Relic shards', `${st.shards}/5`, '5 shards forge the Old King\'s Crown.', st.shards > 0);
    html += card('👑', 'Old King\'s Crown', inv.crown ? '✓' : '', Data.ITEMS.crown.desc, inv.crown > 0);
    for (const [enemy, title] of [['goblin', '🔥 Goblin spoils'], ['dwarf', '⚒️ Dwarf spoils']]) {
      html += `<h3 class="craft-h">${title} <small>can't be crafted</small></h3>`;
      Data.SPOILS[enemy].filter(k => Data.ITEMS[k]).forEach(k => {
        const it = Data.ITEMS[k], n = inv[k];
        html += card(itemIcon(k), it.name, n ? (it.uses > 1 ? `${n} uses` : `×${n}`) : '', it.desc, n > 0);
      });
    }
    if (st.unlocks.palisade || st.unlocks.minecart) {
      html += '<h3 class="craft-h">🔓 Unlocked</h3>';
      if (st.unlocks.palisade) html += card(Art.piece('palisade'), 'Spiked palisade', '', 'Now craftable in the Workshop.');
      if (st.unlocks.minecart) html += card('🛤️', 'Mine-cart defense', '', 'Coming to Fortify soon.');
    }
    return html;
  }

  function materials() {
    const sp = App.state.stockpile;
    return '<h3 class="craft-h">🪵 Materials <small>banked at your camp</small></h3>' + Object.keys(Data.RESOURCES).map(k => {
      const info = Data.MATERIAL_INFO[k] || {};
      const TILE = { wood: 'wood', stone: 'stone', hide: 'hide', food: 'berries', gold: 'gold', iron: 'ore', coal: 'coal', water: 'water' };
      const icon = `<div class="gem art g-${TILE[k]} ic-gem">${Art.tile(TILE[k])}</div>`;
      return card(icon, Data.RESOURCES[k].label, sp[k], `<b>From:</b> ${info.from || '—'}<br><b>For:</b> ${info.use || '—'}`, sp[k] > 0);
    }).join('');
  }

  function gear() {
    const inv = App.state.inventory, placed = Object.values((App.state.camp || {}).cells || {});
    const group = (title, keys) => `<h3 class="craft-h">${title}</h3>` + keys.map(k => {
      const it = Data.ITEMS[k], n = inv[k];
      const count = it.tool ? (n ? '✓ owned' : '') : n ? (it.uses > 1 ? `${n} uses` : `×${n}`) : '';
      const where = it.weapon || it.tool || it.prep ? '' : n ? ` <span class="hint">(${placed.filter(x => x === k).length} placed)</span>` : '';
      return card(itemIcon(k), it.name, count, it.desc + where, n > 0);
    }).join('');
    const R = Data.RECIPES;
    return group('⚔️ Weapons', R.filter(r => (r.tier === 1 || r.tier === 2) && !r.defense).map(r => r.id))
      + group('🧰 Tools <small>passive & permanent</small>', R.filter(r => r.tier === 'tool').map(r => r.id))
      + group('🛡️ Defenses <small>place them in your camp</small>', R.filter(r => r.defense).map(r => r.id))
      + group('🐉 Dragon prep', R.filter(r => r.tier === 'prep').map(r => r.id));
  }

  function render() {
    document.querySelectorAll('.itab').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.onclick = () => { tab = b.dataset.tab; render(); };
    });
    document.getElementById('items-list').innerHTML = tab === 'special' ? special() : tab === 'materials' ? materials() : gear();
  }

  return { render };
})();
