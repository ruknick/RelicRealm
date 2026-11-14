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
  // The look comes from character creation; `bare` draws it without any gear (for the creation screen).
  // Drawn like an ink illustration: inked outlines, muted dyes, hatched shadow on the right side.
  function figure(opts = {}) {
    const look = opts.look || App.state.profile?.look || { skin: '#e0b089', hair: '#5a3a1e', style: 'short', beard: 'none' };
    const eq = s => (opts.bare ? null : App.state.equip[s]);
    const tierOf = s => (eq(s) ? Data.ITEMS[eq(s).id].tier : 0);
    const K = '#2b1b0d', skin = look.skin, hairC = look.hair;
    const METAL = { 1: ['#8a5a30', '#4a2a10'], 2: ['#8b939c', '#3e454d'], 3: ['#d5dce3', '#6e7a86'], 4: ['#c4b5fd', '#6d5bd0'] };
    const ink = (w = 1.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round"`;
    const mirror = d => `<g transform="translate(160 0) scale(-1 1)">${d}</g>`;
    const hatch = (x1, y1, x2, y2, n, dx, dy) => Array.from({ length: n }, (_, i) =>
      `<path d="M${x1 + (x2 - x1) * i / (n - 1)} ${y1 + (y2 - y1) * i / (n - 1)} l${dx} ${dy}" stroke="${K}" stroke-width=".6" opacity=".35"/>`).join('');
    const inset = (s, x, y, w, flip = false) => {
      if (!eq(s)) return '';
      const art = Art.piece(Data.ITEMS[eq(s).id].art).replace(/<ellipse cx="30" cy="58"[^>]*\/>/, '').replace('<svg ', `<svg x="0" y="0" width="${w}" height="${w}" `);
      return `<g transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}">${art}</g>`;
    };

    // ---- base body ----
    const legT = tierOf('legs'), bodyT = tierOf('body'), helmT = tierOf('helmet'), gloveT = tierOf('gloves'), shieldT = tierOf('shield');
    const trouser = legT === 1 ? METAL[1][0] : '#4b3d2c';
    const leg = `<path d="M62.5 117H79.5L77.5 168 76 206H66.5L64.5 168Q62 140 62.5 117z" fill="${trouser}" ${ink()}/><path d="M73 124q1 22 0 40" stroke="${K}" stroke-width=".6" opacity=".3" fill="none"/>`;
    const boot = `<path d="M65 202h12l1 18q0 6-6 6h-13q-4 0-4-4t6-6z" fill="#4a2e16" ${ink()}/><path d="M66 206h11" stroke="${K}" stroke-width=".8" opacity=".6"/>`;
    const arm = sleeve => `<path d="M60 50Q49 50 46.5 59L44 92 44.5 124H52.5L54 94 58.5 68z" fill="${sleeve}" ${ink()}/><path d="M48 92h7" stroke="${K}" stroke-width=".6" opacity=".35"/>`;
    const hand = t => (t ? `<path d="M43 121h10v7q0 7-5 7t-5-7z" fill="${METAL[t][0]}" ${ink(1)}/><path d="M42 119h12l-1 4H43z" fill="${METAL[t][1]}"/>${t >= 2 ? `<path d="M45 127h6M45 130h6" stroke="${K}" stroke-width=".6" opacity=".6"/>` : ''}`
      : `<path d="M44 123h8v6q0 6-4 6t-4-6z" fill="${skin}" ${ink(1)}/>`);
    const tunic = '#7d6a44';
    let html = `<ellipse cx="80" cy="228" rx="40" ry="5" fill="${K}" opacity=".25"/>`;
    html += leg + mirror(leg) + boot + mirror(boot);
    // leg armor
    if (legT === 1) html += `<ellipse cx="70" cy="170" rx="6" ry="5" fill="${METAL[1][1]}" ${ink(.8)}/>` + mirror(`<ellipse cx="70" cy="170" rx="6" ry="5" fill="${METAL[1][1]}" ${ink(.8)}/>`);
    if (legT >= 2) {
      const [m, e] = METAL[legT];
      const g = `<path d="M65 174h11l-1 30h-9z" fill="${m}" ${ink()}/><circle cx="70.5" cy="170" r="5.5" fill="${m}" ${ink(1)}/><path d="M67 178v22" stroke="#fff" stroke-width="1.4" opacity=".5"/>`
        + (legT >= 3 ? `<path d="M64 122h14l-1 42h-12z" fill="${m}" ${ink()}/><path d="M66 126v34" stroke="#fff" stroke-width="1.4" opacity=".5"/><path d="M64 140h14M64 152h14" stroke="${e}" stroke-width=".8"/>` : '');
      html += g + mirror(g);
    }
    // long hair falls behind the shoulders
    if (look.style === 'long') html += `<path d="M66 24C66 6 94 6 94 24l1 30q-5 4-9-1H74q-4 5-9 1z" fill="${hairC}" ${ink(1)}/>`;
    // tool slung across the back, poking up over the left shoulder
    html += inset('tool', 92, 26, 44);
    // arms & torso
    const sleeve = bodyT === 2 ? METAL[2][0] : bodyT === 3 ? METAL[2][0] : tunic;
    html += arm(sleeve) + mirror(arm(sleeve));
    html += `<path d="M57 50Q80 45 103 50L101 70Q98 88 97.5 104L99.5 120H60.5L62.5 104Q62 88 59 70z" fill="${tunic}" ${ink()}/>`
      + `<path d="M74 50l6 10 6-10" fill="none" stroke="${K}" stroke-width="1" opacity=".7"/>`
      + `<path d="M66 64q-2 20 0 38M92 70q2 16 0 30" stroke="${K}" stroke-width=".7" fill="none" opacity=".35"/>`;
    // body armor
    if (bodyT === 1) {
      const [m, e] = METAL[1];
      html += `<path d="M59 52h42l-5 54H64z" fill="${m}" ${ink()}/><path d="M80 56l-3 4 6 4-6 4 6 4-6 4 6 4-6 4" stroke="#e8d2a2" stroke-width="1" fill="none"/>`
        + `<path d="M62 56v46M98 56v46" stroke="${e}" stroke-width=".8" stroke-dasharray="2 2"/>`
        + `<ellipse cx="55" cy="56" rx="7" ry="5" fill="${m}" ${ink(1)}/><ellipse cx="105" cy="56" rx="7" ry="5" fill="${m}" ${ink(1)}/>`;
    }
    if (bodyT === 2) {
      const [m, e] = METAL[2];
      const rings = [];
      for (let y = 56; y <= 118; y += 4.5) rings.push(`<path d="M${y % 9 < 4.5 ? 58 : 60} ${y}${' q2 2.2 4 0'.repeat(10)}" fill="none" stroke="${e}" stroke-width=".7" opacity=".75"/>`);
      html += `<path d="M57 50Q80 45 103 50L101 70Q98 88 98 104L99.5 122H60.5L62 104Q62 88 59 70z" fill="${m}" ${ink()}/>${rings.join('')}`
        + `<path d="M60 50Q49 50 46.5 59L44.5 90H55.5L58.5 68z" fill="${m}" ${ink(1)}/>` + mirror(`<path d="M60 50Q49 50 46.5 59L44.5 90H55.5L58.5 68z" fill="${m}" ${ink(1)}/>`);
    }
    if (bodyT >= 3) {
      const [m, e] = METAL[bodyT];
      const pauldron = `<path d="M46 60q0-12 14-12l2 10q-8 0-10 8z" fill="${m}" ${ink(1)}/><path d="M47 64q2-8 12-8" stroke="${e}" stroke-width=".8" fill="none"/>`;
      html += `<path d="M57 50Q80 45 103 50L101 68Q99 88 95 100H65Q61 88 59 68z" fill="${m}" ${ink()}/>`
        + `<path d="M80 52v46" stroke="${e}" stroke-width="1.2"/><path d="M64 56q2 18 6 38" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>`
        + `<path d="M64 100h32l2 7H62zM62 107h36l2 7H60z" fill="${m}" ${ink(.9)}/>` + pauldron + mirror(pauldron);
    }
    // shadow hatching on the right side of the torso
    html += hatch(92, 58, 96, 112, 9, 5, 4);
    // belt, tool on the belt
    html += `<path d="M61 106h38v6H61z" fill="#3a2412" ${ink(.9)}/><rect x="77" y="105" width="7" height="8" rx="1" fill="#c9a227" ${ink(.7)}/>`;
    // amulet
    if (eq('amulet')) {
      const gem = { emerald: '#2fbf71', sapphire: '#3d7bff', ruby: '#e0324b' }[Data.ITEMS[eq('amulet').id].gem];
      html += `<path d="M72 50q8 14 16 0" stroke="#c9cfd6" stroke-width="1" fill="none"/><path d="M80 60l4 4-4 6-4-6z" fill="${gem}" stroke="#fff" stroke-width=".8" filter="url(#fGlow)"/>`;
    }
    // neck & head
    html += `<path d="M75 38h10v13h-10z" fill="${skin}" ${ink(1)}/><path d="M75 46h10" stroke="${K}" stroke-width=".6" opacity=".4"/>`
      + `<ellipse cx="69.5" cy="29" rx="2.2" ry="3.5" fill="${skin}" ${ink(.9)}/><ellipse cx="90.5" cy="29" rx="2.2" ry="3.5" fill="${skin}" ${ink(.9)}/>`
      + `<path d="M69 26C69 10 91 10 91 26c0 9-4 16-11 16S69 35 69 26z" fill="${skin}" ${ink()}/>`
      + `<path d="M86 22c3 6 3 12-1 17" stroke="${K}" stroke-width=".6" opacity=".3" fill="none"/>`
      + `<path d="M72.5 23.5q3-1.5 5.5 0M82 23.5q3-1.5 5.5 0" stroke="${hairC}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      + `<path d="M73.5 27.5q2-1.2 4 0q-2 1-4 0zM82.5 27.5q2-1.2 4 0q-2 1-4 0z" fill="${K}"/>`
      + `<path d="M80 28l-1.6 5.5h2.8" stroke="${K}" stroke-width=".8" fill="none" opacity=".7"/>`
      + `<path d="M76.5 37q3.5 .8 7 0" stroke="${K}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
    // beard
    if (look.beard === 'short') html += `<path d="M70 30q1 12 10 12t10-12q-2 8-10 8t-10-8z" fill="${hairC}" opacity=".45"/>`;
    if (look.beard === 'full') html += `<path d="M69.5 29q0 18 10.5 20 10.5-2 10.5-20-2 8-6 8-2 2-4.5 1.5-2.5.5-4.5-1.5-4 0-6-8z" fill="${hairC}" ${ink(.8)}/><path d="M75.5 36.5q4.5-2 9 0" stroke="${hairC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    // hair (under any helmet)
    if (!helmT) {
      const top = `<path d="M68.5 27C67 9 93 9 91.5 27q-2-9-11.5-9.5T68.5 27z" fill="${hairC}" ${ink(1)}/>`;
      if (look.style === 'short' || look.style === 'long') html += top;
      if (look.style === 'tied') html += top + `<circle cx="80" cy="9" r="4.5" fill="${hairC}" ${ink(.9)}/>`;
    }
    // helmet
    if (helmT === 1) {
      const [m, e] = METAL[1];
      html += `<path d="M68 25C68 9 92 9 92 25v2H68z" fill="${m}" ${ink()}/><path d="M68 23h24" stroke="${e}" stroke-width="1" stroke-dasharray="2 1.5"/><path d="M80 10v13" stroke="${e}" stroke-width=".9"/>`;
    }
    if (helmT >= 2) {
      const [m, e] = METAL[helmT];
      html += `<path d="M67 27C67 15 73 6 80 3c7 3 13 12 13 24z" fill="${m}" ${ink()}/><path d="M66.5 24h27v4h-27z" fill="${e}" ${ink(.8)}/>`
        + `<path d="M79 26h2v12h-2z" fill="${e}" ${ink(.6)}/><path d="M73 9q-4 6-4 14" stroke="#fff" stroke-width="1.6" opacity=".55" fill="none"/>`
        + `<g fill="${K}"><circle cx="70" cy="26" r=".7"/><circle cx="75" cy="26" r=".7"/><circle cx="85" cy="26" r=".7"/><circle cx="90" cy="26" r=".7"/></g>`
        + (helmT >= 3 ? `<path d="M67 27h4v12l-4-3z" fill="${m}" ${ink(.8)}/><path d="M93 27h-4v12l4-3z" fill="${m}" ${ink(.8)}/>` : '');
    }
    // weapon raised in the right hand, then the hands over the grips
    html += inset('weapon', 66, 72, 72, true);
    html += hand(gloveT) + mirror(hand(gloveT));
    // shield on the left forearm
    if (shieldT === 1) {
      html += `<circle cx="113" cy="106" r="17" fill="#8a5a2c" ${ink(1.4)}/><path d="M101 98h24M98 106h30M101 114h24" stroke="#5a3414" stroke-width=".8"/>`
        + `<circle cx="113" cy="106" r="17" fill="none" stroke="#5a5f66" stroke-width="2.2"/><circle cx="113" cy="106" r="4.5" fill="#8b939c" ${ink(.8)}/>`;
    } else if (shieldT >= 2) {
      const [m, e] = METAL[shieldT];
      const field = shieldT === 2 ? '#8e2a1a' : '#2a3a5a';
      html += `<path d="M97 84h32v20q0 22-16 34-16-12-16-34z" fill="${m}" ${ink(1.4)}/>`
        + `<path d="M100.5 87.5h25v16.5q0 18-12.5 28-12.5-10-12.5-28z" fill="${field}"/>`
        + (shieldT === 2 ? `<path d="M113 90v38M102 104h22" stroke="#c9a227" stroke-width="3"/>` : `<path d="M103 96l10 10 10-10M103 106l10 10 10-10" stroke="#c9a227" stroke-width="2.6" fill="none"/>`)
        + `<path d="M100 88q-1 20 6 34" stroke="#fff" stroke-width="1.2" opacity=".45" fill="none"/>`;
    }
    return `<svg viewBox="0 0 160 236" class="fig" aria-hidden="true">${html}</svg>`;
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

  return { init, open, close, figure };
})();
