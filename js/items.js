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
        const it = Data.ITEMS[k], n = it.gear ? App.gearCount(k) : inv[k];
        html += card(itemIcon(k), it.name, n ? `×${n}` : '', it.desc, n > 0);
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
      const TILE = { wood: 'wood', stone: 'stone', hide: 'hide', food: 'berries', gold: 'gold', iron: 'ore', coal: 'coal', water: 'water', oak: 'oak', ironwood: 'ironwood', elderwood: 'elderwood', silver: 'silver', starsilver: 'starsilver', charcoal: 'charcoal', steel: 'steel', pearl: 'pearl', coral: 'coral' };
      const icon = `<div class="gem art g-${TILE[k]} ic-gem">${Art.tile(TILE[k])}</div>`;
      return card(icon, Data.RESOURCES[k].label, sp[k], `<b>From:</b> ${info.from || '—'}<br><b>For:</b> ${info.use || '—'}`, sp[k] > 0);
    }).join('');
  }

  function gear() {
    const st = App.state, inv = st.inventory, placed = Object.values((st.camp || {}).cells || {});
    const durBar = (g, it) => `<span class="dur big${g.dur / it.dur <= 0.25 ? ' low' : ''}"><i style="width:${Math.round(g.dur / it.dur * 100)}%"></i></span> ${g.dur}/${it.dur}`;
    const gearList = cls => {
      const rows = [];
      Data.SLOTS.forEach(slot => {
        const g = st.equip[slot];
        if (g && Data.ITEMS[g.id].gear === cls) rows.push(card(itemIcon(g.id), Data.ITEMS[g.id].name, '✓ wielding', `${durBar(g, Data.ITEMS[g.id])} · ${Data.ITEMS[g.id].desc}`));
      });
      st.gear.filter(g => Data.ITEMS[g.id].gear === cls).sort((a, b) => Data.ITEMS[b.id].tier - Data.ITEMS[a.id].tier)
        .forEach(g => rows.push(card(itemIcon(g.id), Data.ITEMS[g.id].name, '', `${durBar(g, Data.ITEMS[g.id])} · ${Data.ITEMS[g.id].desc}`)));
      return rows.length ? rows.join('') : `<p class="hint">None yet — forge some in the Workshop.</p>`;
    };
    const group = (title, keys) => `<h3 class="craft-h">${title}</h3>` + keys.map(k => {
      const it = Data.ITEMS[k], n = inv[k];
      const count = it.kit ? (n ? '✓ owned' : '') : n ? `×${n}` : '';
      const where = it.kit || it.prep ? '' : n ? ` <span class="hint">(${placed.filter(x => x === k).length} placed)</span>` : '';
      return card(itemIcon(k), it.name, count, it.desc + where, n > 0);
    }).join('');
    const R = Data.RECIPES;
    return `<h3 class="craft-h">⚔️ Weapons <small>monsters only</small></h3>${gearList('weapon')}`
      + `<h3 class="craft-h">🛠️ Tools <small>obstacles & defenses only</small></h3>${gearList('tool')}`
      + `<h3 class="craft-h">🛡️ Armor <small>wear it in 🧍 Warrior</small></h3>${gearList('armor')}`
      + group('🛡️ Defenses <small>place them in your camp</small>', R.filter(r => r.defense).map(r => r.id))
      + group('🍲 Provisions <small>use on raids</small>', R.filter(r => r.tier === 'food').map(r => r.id))
      + group('🎒 Kit <small>passive & permanent</small>', R.filter(r => r.tier === 'kit').map(r => r.id))
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
