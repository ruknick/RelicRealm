// Workshop: Tier 1 (Camp), Tier 2 (Forge, needs iron), and Tools — with a forge animation.
window.Craft = (() => {
  let forging = false;
  const st = () => App.state;
  const canAfford = r => Object.entries(r.cost).every(([k, n]) => st().stockpile[k] >= n);
  const isTool = r => r.tier === 'tool';
  const ownedTool = r => isTool(r) && st().inventory[r.id] > 0;

  function card(r) {
    const it = Data.ITEMS[r.id];
    const sp = st().stockpile;
    const cost = Object.entries(r.cost).map(([k, n]) =>
      `<span class="cost ${sp[k] >= n ? '' : 'short'}"><span class="chip c-${k}"></span>${n} ${Data.RESOURCES[k].label}</span>`).join('');
    const owned = st().inventory[r.id];
    const ownedTxt = isTool(r) ? (owned ? '✓ Owned' : '') : owned ? (it.uses > 1 ? `${owned} uses` : `Owned ×${owned}`) : '';
    const ready = canAfford(r) && !ownedTool(r);
    const usesTag = it.uses > 1 ? `<span class="tag">${it.uses} uses</span>` : it.weapon ? '<span class="tag">1 use</span>' : '';
    return `<div class="recipe ${ready ? 'ready' : ''}" data-id="${r.id}">
      <div class="r-icon">${it.icon}</div>
      <div class="r-body">
        <div class="r-name">${it.name} ${usesTag} <span class="r-owned">${ownedTxt}</span></div>
        <div class="r-effect">${it.desc}</div>
        <div class="r-cost">${cost}</div>
      </div>
      <button class="craft-btn" data-id="${r.id}" ${ready ? '' : 'disabled'}>${ownedTool(r) ? 'Owned' : 'Craft'}</button>
    </div>`;
  }

  function render() {
    const R = Data.RECIPES;
    const sec = (title, sub, list) => `<h3 class="craft-h">${title} <small>${sub}</small></h3>${list.map(card).join('')}`;
    document.getElementById('craft-list').innerHTML =
      sec('🏕️ Tier 1 · Camp', 'wood, stone & hide', R.filter(r => r.tier === 1 && !r.defense)) +
      sec('🔥 Tier 2 · Forge', 'needs iron & coal from the Iron Hills — multi-use', R.filter(r => r.tier === 2)) +
      sec('🧰 Tools', 'passive & permanent — they work every run', R.filter(isTool)) +
      sec('🛡️ Defenses', 'for fortifying your base — coming soon', R.filter(r => r.defense));
    document.querySelectorAll('.craft-btn').forEach(b => { b.onclick = () => craft(b.dataset.id); });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function craft(id) {
    const r = Data.RECIPES.find(x => x.id === id);
    if (forging || !canAfford(r) || ownedTool(r)) return;
    forging = true;
    const it = Data.ITEMS[id];
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
    stage.querySelectorAll('.spark').forEach(e => e.remove());
    forge.querySelectorAll('.fly-chip').forEach(e => e.remove());
    forge.classList.remove('hidden', 'done');
    forge.classList.toggle('hot', r.tier === 2);
    void forge.offsetWidth;
    forge.classList.add('show');
    Sound.sfx('whoosh');

    // 1) Resources fly from the stockpile bar onto the anvil.
    const target = anvil.getBoundingClientRect();
    const tx = target.left + target.width / 2, ty = target.top + 6;
    const chips = [];
    let i = 0;
    for (const [k, n] of Object.entries(r.cost)) {
      st().stockpile[k] -= n;
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

    // 2) Hammer strikes (Forge items take more).
    const strikes = r.tier === 2 ? 4 : 3;
    for (let s = 0; s < strikes; s++) {
      hammer.classList.remove('strike'); void hammer.offsetWidth; hammer.classList.add('strike');
      await sleep(210);
      Sound.sfx('clank');
      anvil.classList.remove('jolt'); void anvil.offsetWidth; anvil.classList.add('jolt');
      sparks(stage, anvil, r.tier === 2 ? 18 : 12);
      chips.forEach(c => { c.style.opacity = String(Math.max(0, 0.7 - s * 0.3)); });
      await sleep(240);
    }
    chips.forEach(c => c.remove());

    // 3) The item appears.
    st().inventory[id] += it.uses || 1;
    App.save();
    forge.classList.add('done');
    item.classList.add('pop');
    const newLv = App.addXP(r.tier === 2 ? Data.XP.craft2 : Data.XP.craft);
    text.textContent = `${it.name} ${isTool(r) ? 'made' : 'crafted'}!` + (newLv ? ` ⭐ Level ${newLv}!` : '');
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
