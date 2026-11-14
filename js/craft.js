// Workshop: keys, smelting, weapons & tools by tier, defenses, kit, dragon prep, and a repair bench.
window.Craft = (() => {
  let forging = false;
  const st = () => App.state;
  const locked = r => !!r.needs && !st().unlocks[r.needs];
  const has = (k, n) => (Data.ITEMS[k] && Data.ITEMS[k].gear ? App.gearCount(k) : st().inventory[k]) >= n;
  const canAfford = r => !locked(r) && Object.entries(r.cost).every(([k, n]) => st().stockpile[k] >= n)
    && Object.entries(r.items || {}).every(([k, n]) => has(k, n)) && (!r.shards || st().shards >= r.shards);
  const info = r => (r.makes ? { name: r.name, icon: r.icon, desc: r.desc } : Data.ITEMS[r.id]);
  const isKit = r => r.tier === 'kit';
  const ownedKit = r => (isKit(r) || r.id === 'crown') && st().inventory[r.id] > 0;
  const tierOf = r => (Data.ITEMS[r.id] && Data.ITEMS[r.id].tier) || (r.id === 'steel' || r.id === 'bulwark' ? 3 : r.id === 'gate' ? 2 : 1);
  const iconOf = it => (it.art ? Art.piece(it.art) : it.icon);

  function costHtml(cost, items = {}) {
    const sp = st().stockpile;
    return Object.entries(cost).map(([k, n]) =>
      `<span class="cost ${sp[k] >= n ? '' : 'short'}"><span class="gem art g-${tileFor(k)} cost-gem">${Art.tile(tileFor(k))}</span>${n} ${Data.RESOURCES[k].label} <small class="have">(${sp[k]})</small></span>`).join('')
      + Object.entries(items).map(([k, n]) =>
      `<span class="cost ${has(k, n) ? '' : 'short'}"><span class="wicon">${iconOf(Data.ITEMS[k])}</span>${n} ${Data.ITEMS[k].name}</span>`).join('');
  }
  const TILE = { wood: 'wood', stone: 'stone', hide: 'hide', food: 'berries', gold: 'gold', iron: 'ore', coal: 'coal', water: 'water', oak: 'oak', ironwood: 'ironwood', elderwood: 'elderwood', silver: 'silver', starsilver: 'starsilver', charcoal: 'charcoal', steel: 'steel', goldbar: 'goldbar' };
  const tileFor = k => TILE[k] || k;

  function card(r) {
    const it = info(r);
    const owned = r.makes ? null : it.gear ? App.gearCount(r.id) : st().inventory[r.id];
    const ownedTxt = r.makes ? `have ${Object.keys(r.makes).map(k => st().stockpile[k]).join('')}` : isKit(r) ? (owned ? '✓ Owned' : '') : owned ? `owned ×${owned}` : '';
    const ready = canAfford(r) && !ownedKit(r);
    const tag = it.gear ? `<span class="tag t${it.tier}">${Data.tierLabel(r.id)}${it.dur ? ` · ${it.dur} blocks` : ''}</span>` : '';
    return `<div class="recipe ${ready ? 'ready' : ''}" data-id="${r.id}">
      <div class="r-icon">${r.makes ? `<div class="gem art g-${tileFor(Object.keys(r.makes)[0])}" style="position:relative;width:40px;height:40px">${Art.tile(tileFor(Object.keys(r.makes)[0]))}</div>` : iconOf(it)}</div>
      <div class="r-body">
        <div class="r-name">${it.name} ${tag} <span class="r-owned">${ownedTxt}</span></div>
        <div class="r-effect">${it.desc}</div>
        <div class="r-cost">${locked(r) ? '<span class="cost short">🔒 Needs the Palisade blueprint (goblin spoil)</span>' : costHtml(r.cost, r.items)}${r.shards ? `<span class="cost ${st().shards >= r.shards ? '' : 'short'}">💎 ${st().shards}/${r.shards} Relic shards</span>` : ''}</div>
      </div>
      <button class="craft-btn" data-id="${r.id}" ${ready ? '' : 'disabled'}>${ownedKit(r) ? 'Owned' : r.makes ? 'Make' : 'Craft'}</button>
    </div>`;
  }

  // ---------- repair bench ----------
  function repairCost(id) {
    const r = Data.RECIPES.find(x => x.id === id);
    if (!r) return { gold: 4, iron: 2 };       // spoils
    return Object.fromEntries(Object.entries(r.cost).map(([k, n]) => [k, Math.max(1, Math.ceil(n / 2))]));
  }
  function repairList() {
    const out = [];
    Data.SLOTS.forEach(slot => { const g = st().equip[slot]; if (g && g.dur < Data.ITEMS[g.id].dur) out.push({ g, where: slot }); });
    st().gear.forEach((g, i) => { if (g.dur < Data.ITEMS[g.id].dur) out.push({ g, where: i }); });
    return out;
  }
  function repairCard({ g, where }, idx) {
    const it = Data.ITEMS[g.id], cost = repairCost(g.id);
    const ok = Object.entries(cost).every(([k, n]) => st().stockpile[k] >= n);
    return `<div class="recipe ${ok ? 'ready' : ''}">
      <div class="r-icon">${iconOf(it)}</div>
      <div class="r-body"><div class="r-name">${it.name} <span class="r-owned">${typeof where === 'string' ? 'equipped' : 'in pack'}</span></div>
        <div class="r-effect"><span class="dur big${g.dur / it.dur <= 0.25 ? ' low' : ''}"><i style="width:${Math.round(g.dur / it.dur * 100)}%"></i></span> ${g.dur}/${it.dur} hits left</div>
        <div class="r-cost">${costHtml(cost)}</div></div>
      <button class="craft-btn repair-btn" data-r="${idx}" ${ok ? '' : 'disabled'}>Repair</button></div>`;
  }

  function render() {
    const R = Data.RECIPES;
    const sec = (title, sub, list) => list.length ? `<h3 class="craft-h">${title} <small>${sub}</small></h3>${list.join('')}` : '';
    const byTier = (cls) => [1, 2, 3].map(t => {
      const list = R.filter(r => Data.ITEMS[r.id] && Data.ITEMS[r.id].gear === cls && !Data.ITEMS[r.id].sea && Data.ITEMS[r.id].tier === t);
      return list.length ? `<div class="tier-h t${t}">${(cls === 'armor' ? Data.ARMOR_LABEL : Data.TIER_LABEL)[t]}</div>${list.map(card).join('')}` : '';
    }).join('');
    const reps = repairList();
    document.getElementById('craft-list').innerHTML =
      sec('🔧 Repair bench', 'mend battered armor for half its materials', reps.map(repairCard)) +
      `<h3 class="craft-h">⚔️ Weapons <small>monsters only · wield one at a time</small></h3>${byTier('weapon')}` +
      sec('🌊 Sea gear', 'coral & pearls from the Sunlit Coast · iron strength with a trick', R.filter(r => Data.ITEMS[r.id]?.sea).map(card)) +
      `<h3 class="craft-h">🛠️ Tools <small>obstacles & defenses only · wield one at a time</small></h3>${byTier('tool')}` +
      `<h3 class="craft-h">🛡️ Armor <small>wear it in 🧍 Warrior · adds 🛡 hearts to your keep in raids</small></h3>${byTier('armor')}` +
      sec('📿 Amulets', 'gems from the Iron Hills set in silver · give your matches power', R.filter(r => r.tier === 'amulet').map(card)) +
      sec('👑 The Old King\'s Crown', 'one shard from mastering each land · gold bars from the smelter', R.filter(r => r.tier === 'crown').map(card)) +
      sec('🔥 Smelting', 'oak → charcoal · iron + charcoal → steel · nuggets → gold bars', R.filter(r => r.tier === 'smelt').map(card)) +
      sec('🔑 Key upgrades', 'gold & crystal chests need better keys', R.filter(r => r.tier === 'keys').map(card)) +
      sec('🛡️ Defenses', 'place them in 🏰 Fortify', R.filter(r => r.defense).map(card)) +
      sec('🍲 Provisions', 'bring them on raids', R.filter(r => r.tier === 'food').map(card)) +
      sec('🎒 Kit', 'passive & permanent', R.filter(isKit).map(card)) +
      sec('🐉 Dragon prep', 'for the Dragon\'s Lair — coming soon', R.filter(r => r.tier === 'prep').map(card));
    document.querySelectorAll('.craft-btn:not(.repair-btn)').forEach(b => { b.onclick = () => craft(b.dataset.id); });
    document.querySelectorAll('.repair-btn').forEach(b => { b.onclick = () => repair(reps[+b.dataset.r]); });
  }

  function repair({ g }) {
    const cost = repairCost(g.id);
    if (!Object.entries(cost).every(([k, n]) => st().stockpile[k] >= n)) return;
    Object.entries(cost).forEach(([k, n]) => { st().stockpile[k] -= n; });
    g.dur = Data.ITEMS[g.id].dur;
    App.save();
    Sound.sfx('clank');
    render();
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function craft(id) {
    const r = Data.RECIPES.find(x => x.id === id);
    if (forging || !canAfford(r) || ownedKit(r)) return;
    forging = true;
    const it = info(r);
    const tier = tierOf(r);
    const forge = document.getElementById('forge');
    const stage = forge.querySelector('.forge-stage');
    const anvil = forge.querySelector('.anvil');
    const hammer = forge.querySelector('.hammer');
    const item = forge.querySelector('.forge-item');
    const text = forge.querySelector('.forge-text');
    item.innerHTML = r.makes ? Art.tile(tileFor(Object.keys(r.makes)[0])) : iconOf(it);
    item.className = 'forge-item';
    text.textContent = '';
    text.className = 'forge-text';
    stage.querySelectorAll('.spark').forEach(e => e.remove());
    forge.querySelectorAll('.fly-chip').forEach(e => e.remove());
    forge.classList.remove('hidden', 'done');
    forge.classList.toggle('hot', tier >= 2);
    const cardEl = document.querySelector(`.recipe[data-id="${id}"]`);
    void forge.offsetWidth;
    forge.classList.add('show');
    Sound.sfx('whoosh');

    // 1) Materials fly onto the anvil (from the stockpile bar, or from the recipe card).
    const target = anvil.getBoundingClientRect();
    const tx = target.left + target.width / 2, ty = target.top + 6;
    const chips = [];
    let i = 0;
    for (const [k, n] of Object.entries(r.cost)) {
      st().stockpile[k] -= n;
      const src = document.querySelector(`.res[data-res="${k}"]`) || cardEl;
      const from = src ? src.getBoundingClientRect() : { left: tx, top: ty + 200 };
      for (let j = 0; j < Math.min(n, 6); j++, i++) {
        const c = document.createElement('div');
        c.className = `fly-chip gem art g-${tileFor(k)}`;
        c.innerHTML = Art.tile(tileFor(k));
        c.style.left = (from.left + 8) + 'px';
        c.style.top = (from.top + 10) + 'px';
        forge.appendChild(c);
        chips.push(c);
        const dx = tx - from.left - 8 + (Math.random() * 40 - 20), dy = ty - from.top - 10 + (Math.random() * 8 - 4);
        setTimeout(() => { c.style.transform = `translate(${dx}px, ${dy}px) scale(1.3)`; Sound.sfx('tick'); }, 60 * i);
      }
    }
    if (r.shards) st().shards -= r.shards;
    Object.entries(r.items || {}).forEach(([k, n]) => {
      if (Data.ITEMS[k].gear) for (let x = 0; x < n; x++) { const idx = st().gear.findIndex(g => g.id === k); if (idx >= 0) st().gear.splice(idx, 1); }
      else st().inventory[k] -= n;
    });
    App.save();
    await sleep(60 * i + 450);

    // 2) Hammer strikes — more for better metal.
    const strikes = 2 + tier;
    for (let s = 0; s < strikes; s++) {
      hammer.classList.remove('strike'); void hammer.offsetWidth; hammer.classList.add('strike');
      await sleep(210);
      Sound.sfx('clank');
      anvil.classList.remove('jolt'); void anvil.offsetWidth; anvil.classList.add('jolt');
      sparks(stage, anvil, 8 + tier * 5);
      chips.forEach(c => { c.style.opacity = String(Math.max(0, 0.7 - s * 0.3)); });
      await sleep(240);
    }
    chips.forEach(c => c.remove());

    // 3) The result appears.
    let label;
    if (r.makes) { Object.entries(r.makes).forEach(([k, n]) => { st().stockpile[k] += n; }); label = `+${Object.entries(r.makes).map(([k, n]) => `${n} ${Data.RESOURCES[k].label}`).join(', ')}!`; }
    else if (it.gear) { App.addGear(id); label = `${it.name} forged!`; }
    else { st().inventory[id] += 1; label = `${it.name} ${isKit(r) ? 'made' : 'crafted'}!`; }
    // First weapon / tool? Wield it straight away.
    if (it.gear) {
      const slot = Data.slotOf(id);
      const cur = st().equip[slot];
      if (!cur || (slot !== 'amulet' && Data.ITEMS[cur.id].tier < it.tier)) App.equip(slot, st().gear.length - 1);
    }
    Story.flag('crafted');
    App.save();
    forge.classList.add('done');
    item.classList.add('pop');
    const newLv = App.addXP(tier >= 2 ? Data.XP.craft2 : Data.XP.craft);
    text.textContent = label + (newLv ? ` ⭐ Level ${newLv}!` : '');
    text.classList.add('show');
    Sound.sfx('crafted');
    await sleep(1300);
    forge.classList.remove('show');
    await sleep(250);
    forge.classList.add('hidden');
    forging = false;
    render();
    const fresh = document.querySelector(`.recipe[data-id="${id}"]`);
    if (fresh) fresh.classList.add('flash');
  }

  function sparks(stage, anvil, count) {
    const a = anvil.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = a.left - s.left + a.width / 2, y = a.top - s.top;
    for (let n = 0; n < count; n++) {
      const sp = document.createElement('div');
      sp.className = 'spark';
      sp.style.left = x + 'px';
      sp.style.top = y + 'px';
      const ang = -Math.PI * (0.1 + Math.random() * 0.8);
      const dist = 40 + Math.random() * 70;
      sp.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      sp.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      stage.appendChild(sp);
      setTimeout(() => sp.remove(), 600);
    }
  }

  return { render };
})();
