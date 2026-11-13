// Crafting: Tier 1 (Camp) recipes with a forge animation.
window.Craft = (() => {
  const RECIPES = [
    { id: 'club',  cost: { wood: 5 },           group: 'weapon', effect: 'Clears 1 tile. Use it in the forest or a raid.' },
    { id: 'sling', cost: { wood: 4, hide: 3 },  group: 'weapon', effect: 'Hits any tile or defense — breaks fog, fences, the keep.' },
    { id: 'fence', cost: { wood: 6 },           group: 'defense', effect: 'Blocks a tile. Takes 1 hit.' },
    { id: 'wall',  cost: { stone: 12 },         group: 'defense', effect: 'Blocks a tile. Takes 2 hits.' },
    { id: 'trap',  cost: { wood: 4, hide: 2 },  group: 'defense', effect: 'Attackers lose a move when they match next to it.' },
  ];

  let forging = false;
  const canAfford = r => Object.entries(r.cost).every(([k, n]) => App.state.stockpile[k] >= n);

  function card(r) {
    const it = App.ITEMS[r.id];
    const sp = App.state.stockpile;
    const cost = Object.entries(r.cost).map(([k, n]) =>
      `<span class="cost ${sp[k] >= n ? '' : 'short'}"><span class="chip c-${k}"></span>${n} ${App.RESOURCES[k].label}</span>`).join('');
    const owned = App.state.inventory[r.id];
    return `<div class="recipe ${canAfford(r) ? 'ready' : ''}" data-id="${r.id}">
      <div class="r-icon">${it.icon}</div>
      <div class="r-body">
        <div class="r-name">${it.name} <span class="r-owned">${owned ? 'Owned ×' + owned : ''}</span></div>
        <div class="r-effect">${r.effect}</div>
        <div class="r-cost">${cost}</div>
      </div>
      <button class="craft-btn" data-id="${r.id}" ${canAfford(r) ? '' : 'disabled'}>Craft</button>
    </div>`;
  }

  function render() {
    const w = RECIPES.filter(r => r.group === 'weapon').map(card).join('');
    const d = RECIPES.filter(r => r.group === 'defense').map(card).join('');
    document.getElementById('craft-list').innerHTML = `
      <h3 class="craft-h">⚔️ Weapons <small>used up when you use them</small></h3>${w}
      <h3 class="craft-h">🛡️ Defenses <small>for fortifying your base — coming soon</small></h3>${d}`;
    document.querySelectorAll('.craft-btn').forEach(b => { b.onclick = () => craft(b.dataset.id, b); });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function craft(id, btn) {
    const r = RECIPES.find(x => x.id === id);
    if (forging || !canAfford(r)) return;
    forging = true;
    const it = App.ITEMS[id];
    const forge = document.getElementById('forge');
    const stage = forge.querySelector('.forge-stage');
    const anvil = forge.querySelector('.anvil');
    const hammer = forge.querySelector('.hammer');
    const item = forge.querySelector('.forge-item');
    const text = forge.querySelector('.forge-text');
    item.textContent = it.icon;
    item.className = 'forge-item';
    text.textContent = '';
    text.className = 'forge-text';
    stage.querySelectorAll('.fly-chip, .spark').forEach(e => e.remove());
    forge.classList.remove('hidden', 'done');
    void forge.offsetWidth;
    forge.classList.add('show');
    Sound.sfx('whoosh');

    // 1) Pay: resource chips fly from the stockpile bar onto the anvil.
    const target = anvil.getBoundingClientRect();
    const tx = target.left + target.width / 2, ty = target.top + 6;
    const chips = [];
    let i = 0;
    for (const [k, n] of Object.entries(r.cost)) {
      App.state.stockpile[k] -= n;
      const from = document.querySelector(`.res[data-res="${k}"]`).getBoundingClientRect();
      for (let j = 0; j < Math.min(n, 6); j++, i++) {
        const c = document.createElement('div');
        c.className = `fly-chip chip c-${k}`;
        c.style.left = (from.left + 8) + 'px';
        c.style.top = (from.top + 10) + 'px';
        forge.appendChild(c);
        chips.push(c);
        const dx = tx - from.left - 8 + (Math.random() * 40 - 20), dy = ty - from.top - 10 + (Math.random() * 8 - 4);
        setTimeout(() => { c.style.transform = `translate(${dx}px, ${dy}px) scale(1.3)`; Sound.sfx('tick'); }, 60 * i);
      }
    }
    App.save();
    await sleep(60 * i + 450);

    // 2) Three hammer strikes with sparks.
    for (let s = 0; s < 3; s++) {
      hammer.classList.remove('strike'); void hammer.offsetWidth; hammer.classList.add('strike');
      await sleep(210);
      Sound.sfx('clank');
      anvil.classList.remove('jolt'); void anvil.offsetWidth; anvil.classList.add('jolt');
      sparks(stage, anvil);
      chips.forEach(c => { c.style.opacity = String(0.7 - s * 0.3); });
      await sleep(240);
    }
    chips.forEach(c => c.remove());

    // 3) The item appears.
    App.state.inventory[id]++;
    App.save();
    forge.classList.add('done');
    item.classList.add('pop');
    text.textContent = `${it.name} crafted!`;
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

  function sparks(stage, anvil) {
    const a = anvil.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = a.left - s.left + a.width / 2, y = a.top - s.top;
    for (let n = 0; n < 12; n++) {
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

  return { render, RECIPES };
})();
