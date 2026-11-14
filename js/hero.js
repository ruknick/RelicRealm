// Warrior screen: a full-body equipment view (helmet, body, gloves, legs, shield, weapon, tool).
// Opens from the 🧍 Gear button under every board and from the world map.
window.Hero = (() => {
  const SLOT_INFO = {
    helmet: { icon: '⛑️', label: 'Helmet' },
    amulet: { icon: '📿', label: 'Amulet' },
    body:   { icon: '🦺', label: 'Body' },
    gloves: { icon: '🧤', label: 'Gloves' },
    legs:   { icon: '👖', label: 'Legs' },
    shield: { icon: '🛡️', label: 'Shield' },
    weapon: { icon: '⚔️', label: 'Weapon' },
    tool:   { icon: '🛠️', label: 'Tool' },
  };
  // Colours the figure wears for each armor tier.
  const TINT = { 1: ['#9a6a3c', '#5e3c1e'], 2: ['#8d97a3', '#4a525c'], 3: ['#e3e9ef', '#8a96a3'], 4: ['#c4b5fd', '#6d5bd0'] };
  let current = 'body', onClose = null, est = null;

  const st = () => App.state;
  const eq = s => st().equip[s];
  const tierOf = s => (eq(s) ? Data.ITEMS[eq(s).id].tier : 0);
  // Only armor wears down (as it blocks raiders); weapons, tools & amulets last forever.
  const durBar = (g, text = false) => {
    const it = Data.ITEMS[g.id];
    if (!it.dur) return text ? '<small>∞ never wears out</small>' : '';
    const pct = Math.round(g.dur / it.dur * 100);
    return `<span class="dur${pct <= 25 ? ' low' : ''}"><i style="width:${pct}%"></i></span>${text ? ` <small>${g.dur}/${it.dur} blocks left</small>` : ''}`;
  };

  // The warrior figure: plain clothes, with each worn piece drawn over it.
  function figure() {
    const fill = (s, plain) => (tierOf(s) ? TINT[tierOf(s)][0] : plain);
    const edge = (s, plain) => (tierOf(s) ? TINT[tierOf(s)][1] : plain);
    const inset = (s, x, y, w) => (eq(s) ? Art.piece(Data.ITEMS[eq(s).id].art).replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w}" `) : '');
    const shieldT = tierOf('shield');
    return `<svg viewBox="0 0 160 220" class="fig" aria-hidden="true">
      <ellipse cx="80" cy="210" rx="46" ry="7" fill="#000" opacity=".35"/>
      <!-- legs -->
      <path d="M62 128h16l-2 72h-16z" fill="${fill('legs', '#4a3a2a')}" stroke="${edge('legs', '#2a2018')}" stroke-width="2"/>
      <path d="M82 128h16l2 72h-16z" fill="${fill('legs', '#4a3a2a')}" stroke="${edge('legs', '#2a2018')}" stroke-width="2"/>
      ${tierOf('legs') >= 2 ? '<path d="M60 160h18M82 160h18M60 176h17M83 176h17" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>' : ''}
      <path d="M58 198h20v10H54zM82 198h20l4 10H82z" fill="#3a2614"/>
      <!-- arms -->
      <path d="M50 66l-16 52" stroke="${fill('body', '#b8875a')}" stroke-width="13" stroke-linecap="round"/>
      <path d="M110 66l16 52" stroke="${fill('body', '#b8875a')}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="33" cy="122" r="8" fill="${fill('gloves', '#e0b089')}" stroke="${edge('gloves', '#9a6a4a')}" stroke-width="2"/>
      <circle cx="127" cy="122" r="8" fill="${fill('gloves', '#e0b089')}" stroke="${edge('gloves', '#9a6a4a')}" stroke-width="2"/>
      <!-- torso -->
      <path d="M52 58h56l-6 74H58z" fill="${fill('body', '#6a7a4a')}" stroke="${edge('body', '#3a4428')}" stroke-width="2.5"/>
      ${tierOf('body') === 2 ? '<g fill="none" stroke="#2f363e" stroke-opacity=".6"><path d="M56 72h48M56 84h48M57 96h46M58 108h44M58 120h44"/></g>' : ''}
      ${tierOf('body') >= 3 ? '<path d="M80 60v70M58 92c14 6 30 6 44 0" stroke="#7d8896" stroke-width="2.5" fill="none"/><path d="M62 66l6 20" stroke="#fff" stroke-width="3" opacity=".6"/>' : ''}
      ${tierOf('body') === 1 ? '<path d="M66 60v70M94 60v70" stroke="#3a2614" stroke-width="2" stroke-dasharray="4 4"/>' : ''}
      <path d="M56 126h48v8H56z" fill="#3a2614"/><rect x="76" y="125" width="8" height="10" fill="#c9a227"/>
      ${eq('amulet') ? `<path d="M68 58c4 10 20 10 24 0" stroke="#d6dde5" stroke-width="1.6" fill="none"/><path d="M80 66l6 6-6 8-6-8z" fill="${{ emerald: '#2fbf71', sapphire: '#3d7bff', ruby: '#e0324b' }[Data.ITEMS[eq('amulet').id].gem]}" stroke="#fff" stroke-width="1" filter="url(#fGlow)"/>` : ''}
      <!-- head -->
      <rect x="74" y="44" width="12" height="14" fill="#d9a77c"/>
      <circle cx="80" cy="34" r="17" fill="#e0b089" stroke="#9a6a4a" stroke-width="2"/>
      <circle cx="74" cy="34" r="2" fill="#2a1a10"/><circle cx="86" cy="34" r="2" fill="#2a1a10"/>
      <path d="M74 42c4 3 8 3 12 0" stroke="#7a4a30" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${eq('helmet') ? `<path d="M61 32c0-14 9-22 19-22s19 8 19 22v4H61z" fill="${fill('helmet')}" stroke="${edge('helmet')}" stroke-width="2.5"/>
        ${tierOf('helmet') >= 2 ? `<path d="M78 34h4v14h-4z" fill="${edge('helmet')}"/><path d="M68 18c4-4 9-5 12-5" stroke="#fff" stroke-width="3" opacity=".5" fill="none"/>` : ''}`
        : '<path d="M63 30c2-12 10-17 17-17s15 5 17 17c-8-6-26-6-34 0z" fill="#5a3a1e"/>'}
      <!-- weapon in the right hand, tool on the belt, shield on the left arm -->
      ${inset('weapon', 0, 72, 52)}
      ${inset('tool', 96, 128, 40)}
      ${shieldT ? `<g transform="translate(118 74)"><path d="M0 0h34v24c0 14-8 22-17 28C8 46 0 38 0 24z" fill="${shieldT === 1 ? '#8a5a2c' : TINT[shieldT][0]}" stroke="${shieldT === 1 ? '#4a2a10' : TINT[shieldT][1]}" stroke-width="3"/>
        <path d="M17 4v44M3 20h28" stroke="${shieldT === 1 ? '#5a3414' : TINT[shieldT][1]}" stroke-width="3"/><circle cx="17" cy="20" r="5" fill="#c9a227"/></g>` : ''}
    </svg>`;
  }

  function slotBtn(s) {
    const g = eq(s), I = SLOT_INFO[s];
    if (!g) return `<button class="hslot empty${current === s ? ' sel' : ''}" data-s="${s}" style="grid-area:${s}"><span class="hs-icon">${I.icon}</span><small>${I.label}</small></button>`;
    const it = Data.ITEMS[g.id];
    return `<button class="hslot t${it.tier}${current === s ? ' sel' : ''}" data-s="${s}" style="grid-area:${s}">
      <span class="hs-icon">${Art.piece(it.art)}</span><small>${it.name}</small>${durBar(g)}</button>`;
  }

  function stats() {
    const ward = App.wardLayers(), shields = ward.reduce((n, w) => n + w.max, 0);
    const lines = [
      `<div><b>🛡 Raid guard:</b> ${shields ? `+${shields} shield hearts on your keep` : 'no armor — raiders go straight for your keep'}</div>`,
      `<div><b>💎 Amulet:</b> ${eq('amulet') ? Data.ITEMS[eq('amulet').id].desc : 'none — set a gem in silver at the Workshop'}</div>`,
      `<div><b>⚡ Start energy:</b> ${3 + Data.gloveEnergy(eq('gloves'))}${eq('gloves') ? ` (gloves +${Data.gloveEnergy(eq('gloves'))})` : ''}</div>`,
    ];
    if (!est) {
      est = ['goblin', 'dwarf'].map(e => {
        const rank = Data.TIER_NAMES[e][Data.enemyTier(st().enemyWins[e]) - 1];
        return { e, rank, base: Camp.estimate(e, 120, true), now: Camp.estimate(e, 120) };
      });
    }
    lines.push(`<div class="h-est">${est.map(x => `<span>${x.e === 'goblin' ? '🔥' : '⚒️'} ${x.rank} need <b>~${x.now}</b> moves to break your camp${x.now > x.base ? ` <em>(${x.base} without armor)</em>` : ''}</span>`).join('')}</div>`);
    return lines.join('');
  }

  function picker() {
    const s = current, I = SLOT_INFO[s];
    const owned = st().gear.map((g, i) => ({ g, i })).filter(({ g }) => Data.slotOf(g.id) === s)
      .sort((a, b) => Data.ITEMS[b.g.id].tier - Data.ITEMS[a.g.id].tier);
    const cur = eq(s);
    const row = (g, btn) => {
      const it = Data.ITEMS[g.id];
      return `<div class="hp-row"><span class="hp-icon">${Art.piece(it.art)}</span>
        <span class="hp-body"><b>${it.name}</b> <span class="tag t${it.tier}">${Data.tierLabel(g.id)}</span><small>${it.desc}</small>
        ${durBar(g, true)}</span>${btn}</div>`;
    };
    let html = `<h3 class="craft-h">${I.icon} ${I.label}</h3>`;
    if (cur) html += row(cur, '<button class="small alt" data-off="1">Take off</button>');
    html += owned.map(({ g, i }) => row(g, `<button class="small" data-i="${i}">${cur ? 'Swap' : 'Wear'}</button>`)).join('');
    if (!cur && !owned.length) html += `<p class="hint">Nothing for this slot yet — craft one in the 🔨 Workshop.</p>`;
    return html;
  }

  function render() {
    document.getElementById('hero-doll').innerHTML =
      `<div class="doll-fig">${figure()}</div>` + Data.SLOTS.map(slotBtn).join('');
    document.getElementById('hero-stats').innerHTML = stats();
    document.getElementById('hero-pick').innerHTML = picker();
    document.querySelectorAll('.hslot').forEach(b => { b.onclick = () => { current = b.dataset.s; render(); }; });
    document.querySelectorAll('#hero-pick [data-i]').forEach(b => { b.onclick = () => { App.equip(current, +b.dataset.i); changed(); }; });
    document.querySelectorAll('#hero-pick [data-off]').forEach(b => { b.onclick = () => { App.unequip(current); changed(); }; });
  }
  function changed() { est = null; Sound.sfx('clank'); render(); }

  function open(opts = {}) {
    onClose = opts.onClose || null;
    if (opts.slot) current = opts.slot;
    est = null;
    document.getElementById('hero-panel').classList.remove('hidden');
    render();
  }
  function close() {
    document.getElementById('hero-panel').classList.add('hidden');
    const cb = onClose; onClose = null;
    cb?.();
  }

  function init() { document.getElementById('hero-close').onclick = close; }

  return { init, open, close };
})();
