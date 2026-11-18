// The Harvest Fair: a just-for-fun place on the map. Win flair (hats and capes worn on your warrior)
// on the Prize Wheel with fair tickets, hear your fortune, and maybe — rarely — win the Golden Horseshoe.
window.Fair = (() => {
  const st = () => App.state;
  const K = '#2b1b0d';
  const ink = (w = 1.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round"`;

  // ---------- flair: drawn in the warrior figure's own coordinates (viewBox 0 0 160 236; head ~x69-91, y10-42) ----------
  // back = drawn behind the body, front = over the torso, hat = on the head (hides the helmet's look).
  const FLAIR = {
    papercrown: { slot: 'hat', name: 'Paper crown', rare: false,
      hat: `<path d="M68 23V9l5 6 3.5-8 3.5 7 3.5-7 3.5 8 5-6v14z" fill="#f3d36a" ${ink(1)}/><path d="M68 19.5h24" stroke="#c0392b" stroke-width="1.8"/>
        <circle cx="76.5" cy="8.5" r="1.4" fill="#c0392b"/><circle cx="83.5" cy="8.5" r="1.4" fill="#2e86c1"/><path d="M70.5 12.5l1 8" stroke="#fff" stroke-width="1.1" opacity=".55"/>` },
    jester: { slot: 'hat', name: 'Jester\'s hat', rare: true,
      hat: `<path d="M71 17Q60 2 49 12q10-1 20 12z" fill="#2f7d4a" ${ink(1)}/><path d="M89 17q11-15 22-5-10-1-20 12z" fill="#c0392b" ${ink(1)}/>
        <path d="M75 14Q78-1 89 3q-6 3-5 12z" fill="#e2b53a" ${ink(1)}/><path d="M67 25q-1-12 13-13 14 1 13 13z" fill="#c0392b" ${ink(1)}/><path d="M80 12v13" stroke="#e2b53a" stroke-width="3"/>
        <path d="M66.5 21.5h27v4h-27z" fill="#e2b53a" ${ink(.8)}/><path d="M69 23.5l2-2 2 2-2 2zM76 23.5l2-2 2 2-2 2zM83 23.5l2-2 2 2-2 2zM90 23.5l-1-1.5" fill="#c0392b"/>
        <circle cx="49" cy="12.5" r="2.8" fill="#f3d36a" ${ink(.8)}/><circle cx="111" cy="12.5" r="2.8" fill="#f3d36a" ${ink(.8)}/><circle cx="89" cy="3.5" r="2.6" fill="#f3d36a" ${ink(.8)}/>` },
    flowercrown: { slot: 'hat', name: 'Flower crown', rare: false,
      hat: `<path d="M67.5 21q12.5-7 25 0" stroke="#4a7a2a" stroke-width="2" fill="none"/>` + [[69, 20, '#f6a5c0'], [74.5, 17.5, '#fff7e0'], [80, 16.5, '#f3d36a'], [85.5, 17.5, '#f6a5c0'], [91, 20, '#fff7e0']]
        .map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-2.2" rx="1.5" ry="2.2" fill="${c}" stroke="${K}" stroke-width=".5" transform="rotate(${a})"/>`).join('')}<circle r="1.1" fill="#d9792b"/></g>`).join('')
        + `<path d="M71.5 19l-2 3M88.5 19l2 3" stroke="#4a7a2a" stroke-width="1.2"/>` },
    featheredcap: { slot: 'hat', name: 'Feathered cap', rare: false,
      hat: `<path d="M92 20Q104 2 114 0q-6 10-19 23z" fill="#c0392b" ${ink(.9)}/><path d="M93 21Q104 7 112 2" stroke="#7a1a10" stroke-width=".7" fill="none"/>
        <path d="M67 24q0-13 13-13t13 13z" fill="#3e6b3a" ${ink(1)}/><path d="M63.5 24h33l-2.5 3.5h-28z" fill="#2c4f2a" ${ink(.9)}/><path d="M72 15q-2 4-2 8" stroke="#fff" stroke-width="1" opacity=".4" fill="none"/>` },
    pumpkin: { slot: 'hat', name: 'Pumpkin hat', rare: true,
      hat: `<path d="M79 6q-1-4 2-6" stroke="#3e6b2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M82 4q5-3 8 0-4 2-8 0z" fill="#4a7a2a" ${ink(.6)}/>
        <ellipse cx="80" cy="15" rx="14.5" ry="9.5" fill="#e07a24" ${ink(1.1)}/><path d="M74 6.5q-4 8 0 17M86 6.5q4 8 0 17M80 5.5v19" stroke="#a24f10" stroke-width=".9" fill="none"/>
        <path d="M70 11q2-3 5-4" stroke="#fff" stroke-width="1.2" opacity=".45" fill="none"/>` },
    viking: { slot: 'hat', name: 'Viking horns', rare: true,
      hat: `<path d="M69 18Q57 15 55 1q5 8 15 11z" fill="#efe3c4" ${ink(1)}/><path d="M91 18q12-3 14-17-5 8-15 11z" fill="#efe3c4" ${ink(1)}/>
        <path d="M58 6l2 1M57 3l2 .5M102 6l-2 1M103 3l-2 .5" stroke="${K}" stroke-width=".6" opacity=".5"/>
        <path d="M67 25C67 13 73 8 80 8s13 5 13 17z" fill="#8b939c" ${ink(1)}/><path d="M66.5 22h27v4h-27z" fill="#5a3a1e" ${ink(.8)}/><path d="M80 8v14" stroke="#5a5f66" stroke-width="1.4"/>
        <path d="M72 12q-3 4-3 9" stroke="#fff" stroke-width="1.4" opacity=".5" fill="none"/>` },
    wizard: { slot: 'hat', name: 'Wizard\'s hat', rare: true,
      hat: `<path d="M69.5 21L82 1q3-1 4 2l6.5 18z" fill="#3b2a6e" ${ink(1)}/><path d="M71.5 18q8 2 19 0" stroke="#c9a227" stroke-width="2.2" fill="none"/>
        <ellipse cx="80.5" cy="22" rx="18" ry="3.6" fill="#3b2a6e" ${ink(1)}/>
        <path d="M80 9l.8 1.8 2 .2-1.5 1.3.5 2-1.8-1-1.8 1 .5-2-1.5-1.3 2-.2z" fill="#f3d36a"/><circle cx="85" cy="14.5" r=".9" fill="#f3d36a"/><circle cx="76" cy="15" r=".7" fill="#f3d36a"/>` },
    chef: { slot: 'hat', name: 'Chef\'s hat', rare: false,
      hat: `<path d="M71 18q-7-1-6-7 1-6 8-4 2-6 8-5 6-1 7 5 7-2 8 4t-6 7z" fill="#fbf8ef" ${ink(1)}/><path d="M70.5 17h19l-.5 7h-18z" fill="#fbf8ef" ${ink(1)}/>
        <path d="M76 9q0 4 1 8M84 9q0 4-1 8" stroke="${K}" stroke-width=".6" opacity=".35" fill="none"/>` },
    // ---- capes ----
    patchcape: { slot: 'cape', name: 'Patchwork cape', rare: false,
      back: `<path d="M57 50Q80 45 103 50L116 198Q80 206 44 198z" fill="#7a5530" ${ink(1.2)}/>
        <path d="M60 70h16l-1 22H58zM84 64h16l2 20H85zM52 120h20v24H49zM86 112h22l2 26H88zM62 160h22l-1 26H59zM90 158h18l2 24H92z" fill="#4f6b3a" opacity=".85"/>
        <path d="M68 96h14v18H67zM96 88h12l1 20H97zM58 146h12v12H57z" fill="#9b3b28" opacity=".8"/>
        <path d="M60 70h16l-1 22H58zM84 64h16l2 20H85zM52 120h20v24H49zM86 112h22l2 26H88zM62 160h22l-1 26H59zM68 96h14v18H67z" fill="none" stroke="#e8d2a2" stroke-width=".7" stroke-dasharray="1.5 1.5"/>` },
    royalcape: { slot: 'cape', name: 'Royal purple cape', rare: true,
      back: `<path d="M57 50Q80 45 103 50L118 200Q80 208 42 200z" fill="#5b2a7a" ${ink(1.2)}/><path d="M64 60q-6 60-14 136M96 60q6 60 14 136" stroke="#3a1650" stroke-width="1" fill="none" opacity=".6"/>
        <path d="M42 194Q80 202 118 194l1 8Q80 210 41 202z" fill="#fbf8ef" ${ink(.9)}/>` + [48, 58, 68, 80, 92, 102, 112].map(x => `<path d="M${x} 198l1 3-1 2-1-2z" fill="${K}"/>`).join(''),
      front: `<path d="M60 50q20 10 40 0l-2 6q-18 8-36 0z" fill="#fbf8ef" ${ink(.8)}/><circle cx="80" cy="54" r="3" fill="#c9a227" ${ink(.7)}/>` },
    foxcollar: { slot: 'cape', name: 'Fox-fur collar', rare: false,
      front: `<path d="M56 50q24 18 48 0 5 6-2 12-22 12-44 0-7-6-2-12z" fill="#d9792b" ${ink(1)}/>
        <path d="M60 56l3 3M66 60l2 3M74 62l1 3M86 62l-1 3M94 60l-2 3M100 56l-3 3" stroke="#fbf0dc" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M100 57q10 6 8 20-4-6-10-10z" fill="#d9792b" ${ink(.9)}/><path d="M106 72q2 3 2 5-2-2-4-3z" fill="#fbf0dc"/>` },
  };
  const ICON_VB = { hat: '46 -4 68 46', cape: '30 42 100 110' };

  // What the figure should wear (Hero.figure asks for this).
  const worn = () => ((st().flair && st().flair.worn) || {});
  const layer = (where, override) => {
    const w = override || worn();
    return ['cape', 'hat'].map(s => w[s] && FLAIR[w[s]] && FLAIR[w[s]][where] || '').join('');
  };

  // ---------- tickets ----------
  // tickets = golden fair tickets (found on gathering boards; one plays a fairground round)
  // wheel = Prize Wheel spins (won on the fairground board, plus one free each day)
  const fair = () => { const f = (st().fair ||= { tickets: 0, wheel: 0, spun: 0, sinceShoe: 0, lastDay: '', welcomed: false, rot: 0 }); f.wheel ??= 0; f.spun ??= 0; return f; };
  const flairState = () => (st().flair ||= { owned: {}, worn: {} });
  function earn(n) { fair().tickets += n; App.save(); return n; }
  const today = () => new Date().toDateString();

  // ---------- the Prize Wheel ----------
  // Eight slices; the slice drawn decides nothing — the prize is rolled first and the wheel lands on it.
  const SLICES = ['flair', 'gold', 'flair', 'ticket', 'flair', 'meal', 'flair', 'star'];
  const SLICE_COL = ['#c0392b', '#f3e2b8', '#2e6f9e', '#f3e2b8', '#c0392b', '#f3e2b8', '#2e6f9e', '#c9a227'];
  const SHOE_ODDS = 0.01, SHOE_PITY = 100;
  function sliceIcon(kind) {
    if (kind === 'flair') return `<path d="M-7 4V-6l3.5 4L0-8l3.5 6L7-6V4z" fill="#f3d36a" ${ink(.8)}/>`;
    if (kind === 'gold') return `<circle r="6" fill="#e2b53a" ${ink(.8)}/><circle r="3.5" fill="none" stroke="#a37a10" stroke-width=".9"/>`;
    if (kind === 'ticket') return `<path d="M-8-4h16v2.5a1.5 1.5 0 000 3V4H-8V1.5a1.5 1.5 0 000-3z" fill="#e9c46a" ${ink(.8)}/><path d="M-3-4v8" stroke="${K}" stroke-width=".6" stroke-dasharray="1 1"/>`;
    if (kind === 'meal') return `<path d="M-8 3q0-8 8-8t8 8z" fill="#c98a3c" ${ink(.8)}/><path d="M-4-2l2 3M0-3l2 3M4-2l2 3" stroke="#7a4a14" stroke-width=".8"/>`;
    return `<path d="M-6 6V-1a6 6 0 0112 0v7h-3.4V-1a2.6 2.6 0 00-5.2 0v7z" fill="#f3d36a" ${ink(.9)}/>`;
  }
  function wheelSvg() {
    const R = 92, seg = 360 / SLICES.length;
    const pt = a => [100 + R * Math.sin(a * Math.PI / 180), 100 - R * Math.cos(a * Math.PI / 180)];
    const slices = SLICES.map((k, i) => {
      const [x1, y1] = pt(i * seg), [x2, y2] = pt((i + 1) * seg), mid = (i + .5) * seg;
      const ix = 100 + 60 * Math.sin(mid * Math.PI / 180), iy = 100 - 60 * Math.cos(mid * Math.PI / 180);
      return `<path d="M100 100L${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}z" fill="${SLICE_COL[i]}" stroke="${K}" stroke-width="1.4"/>
        <g transform="translate(${ix.toFixed(1)} ${iy.toFixed(1)}) rotate(${mid}) scale(1.5)">${sliceIcon(k)}</g>`;
    }).join('');
    const pegs = SLICES.map((_, i) => { const [x, y] = pt(i * seg); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#c9a227" ${ink(.8)}/>`; }).join('');
    return `<div class="wheel-box"><svg viewBox="0 0 200 200" class="wheel" id="wheel" style="transform:rotate(${fair().rot}deg)">
        <circle cx="100" cy="100" r="97" fill="#5a3a1e" stroke="${K}" stroke-width="2"/>${slices}${pegs}
        <circle cx="100" cy="100" r="13" fill="#c9a227" ${ink(1.4)}/><circle cx="100" cy="100" r="5" fill="#8a5d17"/></svg>
      <svg viewBox="0 0 30 34" class="wheel-pin"><path d="M15 32L3 8a12 12 0 0124 0z" fill="#c0392b" ${ink(1.4)}/><circle cx="15" cy="10" r="4" fill="#f3d36a"/></svg></div>`;
  }

  function rollPrize() {
    const f = fair(), inv = st().inventory;
    f.spun++; f.sinceShoe++;
    if (!inv.horseshoe && (Math.random() < SHOE_ODDS || f.sinceShoe >= SHOE_PITY)) return 'shoe';
    if (inv.horseshoe && Math.random() < SHOE_ODDS) return 'jackpot';
    const W = [['flair', 40], ['meal', 25], ['gold', 20], ['ticket', 15]];
    let x = Math.random() * 100;
    for (const [k, w] of W) if ((x -= w) < 0) return k;
    return 'flair';
  }
  // Apply a prize; returns the line to show.
  function give(prize) {
    const S = st(), L = App.level;
    if (prize === 'shoe') { S.inventory.horseshoe = 1; fair().sinceShoe = 0; return { big: true, text: '<b>The Golden Horseshoe!</b> Rare finds turn up 15% more often on every trip, forever.' }; }
    if (prize === 'jackpot') { S.stockpile.gold += 40; fair().tickets += 2; return { big: true, text: '<b>Jackpot!</b> 40 gold and 2 golden tickets.' }; }
    if (prize === 'gold') { const n = 8 + Math.floor(Math.random() * 8) + Math.floor(L / 2); S.stockpile.gold += n; return { text: `${n} gold for your bank.` }; }
    if (prize === 'ticket') { fair().tickets += 1; return { text: 'A golden ticket — another round on the fairground!' }; }
    if (prize === 'meal') {
      const ok = ['feast', 'swordsteak', 'farmpie', 'salmonpie', 'honeycake', 'roastchicken', 'chowder', 'bread'].filter(k => Data.RECIPES.find(r => r.id === k).lv <= L);
      const k = ok[Math.floor(Math.random() * Math.min(3, ok.length))];
      S.inventory[k] = (S.inventory[k] || 0) + 1;
      return { text: `A ${Data.ITEMS[k].name} from the pie stall — it's in your bank.` };
    }
    // flair: something you don't have yet (rare pieces come up half as often)
    const left = Object.keys(FLAIR).filter(k => !flairState().owned[k]);
    if (!left.length) { fair().wheel += 2; return { text: 'A costume you already own — traded for 2 more spins.' }; }
    const pool = left.flatMap(k => (FLAIR[k].rare ? [k] : [k, k]));
    const k = pool[Math.floor(Math.random() * pool.length)];
    flairState().owned[k] = true;
    return { flair: k, text: `New flair: <b>${FLAIR[k].name}</b>${FLAIR[k].rare ? ' <span class="rare-tag">rare</span>' : ''}! Try it on in the Costume tent.` };
  }

  let spinning = false, lastWin = null;
  async function spin() {
    const f = fair();
    if (spinning || f.wheel < 1) return;
    spinning = true;
    f.wheel--;
    const prize = rollPrize();
    const sliceKind = prize === 'shoe' || prize === 'jackpot' ? 'star' : prize;
    const options = SLICES.map((k, i) => [k, i]).filter(([k]) => k === sliceKind).map(([, i]) => i);
    const idx = options[Math.floor(Math.random() * options.length)], seg = 360 / SLICES.length;
    const centre = (idx + .5) * seg + (Math.random() * 0.6 - 0.3) * seg;
    const cur = ((f.rot % 360) + 360) % 360;
    f.rot += 360 * 5 + ((360 - centre - cur) % 360 + 360) % 360;
    const win = give(prize);
    App.save();
    document.getElementById('spin-btn').disabled = true;
    const wheel = document.getElementById('wheel');
    Sound.sfx('whoosh');
    wheel.style.transform = `rotate(${f.rot}deg)`;
    const ticks = setInterval(() => Sound.sfx('tick'), 160);
    await new Promise(r => setTimeout(r, 3300));
    clearInterval(ticks);
    Sound.sfx(win.big ? 'victory' : win.flair ? 'rare' : 'coin');
    lastWin = win;
    spinning = false;
    if (prize === 'shoe') {
      await App.choose({ title: '✨ The Golden Horseshoe!', html: `<div class="shoe-reveal">${Art.piece('horseshoe')}</div><p>The crowd gasps — the wheel stops on the golden slice. Lucky you!</p><p class="reward">Rare finds (oak, silver, pearls, gems…) now turn up <b>15% more often</b> on every trip. It rides in your pack — no gear slot needed.</p>`, buttons: [{ id: 'ok', label: 'Wonderful!' }] });
    }
    render();
  }

  // ---------- the Fortune Teller ----------
  const FORTUNES = [
    'I see… a chest. Locked, of course. The key is never far from the lock.',
    'Pack a hot meal before you face a boss. Raw berries are for wanderers.',
    'Three stars on a trip will bring you back to my fair. The wheel remembers.',
    'Iron gates turn dwarven steel better than any stone wall.',
    'The emerald breaks, the sapphire quickens, the ruby strikes. Choose your stone.',
    'Something glimmers under the soil. A lamp would show you where.',
    'The dragon sleeps on gold, but it dreams of water. It fears it.',
    'A goblin left alive is a goblin that tells its friends.',
    'Chains of matches are worth more than single ones. Be patient.',
    'You will wear a very silly hat. I see it clearly.',
  ];
  function fortune() {
    const f = fair();
    if (f.fortuneDay !== today()) { f.fortuneDay = today(); f.fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]; App.save(); }
    return f.fortune;
  }

  // ---------- screen ----------
  function icon(id) {
    const F = FLAIR[id];
    const fig = Hero.figure({ flair: { [F.slot]: id }, plain: true });
    return fig.replace(/viewBox="[^"]*"/, `viewBox="${ICON_VB[F.slot]}"`);
  }
  function wear(id) {
    const fs = flairState(), slot = FLAIR[id].slot;
    fs.worn[slot] = fs.worn[slot] === id ? null : id;
    App.save();
    Sound.sfx('tick');
    render();
  }

  let welcomeNote = '';
  function open() {
    const f = fair();
    welcomeNote = '';
    if (!f.welcomed) { f.welcomed = true; f.lastDay = today(); f.tickets += 1; f.wheel += 2; welcomeNote = 'Welcome to the fair! Here\'s a <b>golden ticket</b> for the fairground and <b>2 spins</b> to start you off.'; }
    else if (f.lastDay !== today()) { f.lastDay = today(); f.wheel += 1; welcomeNote = '🎡 Your free spin for today!'; }
    App.save();
    lastWin = null;
    render();
  }

  function render() {
    const f = fair(), fs = flairState(), inv = st().inventory;
    const owned = Object.keys(FLAIR).filter(k => fs.owned[k]).length, total = Object.keys(FLAIR).length;
    const card = id => {
      const F = FLAIR[id], has = !!fs.owned[id], on = fs.worn[F.slot] === id;
      return `<button class="flair-card${has ? '' : ' locked'}${on ? ' on' : ''}" ${has ? `data-wear="${id}"` : 'disabled'}>
        <span class="fc-pic">${icon(id)}</span><span class="fc-name">${F.name}</span><small>${on ? '✓ wearing' : has ? 'tap to wear' : F.rare ? 'rare · win on the wheel' : 'win on the wheel'}</small></button>`;
    };
    const shoe = inv.horseshoe
      ? `<div class="shoe-card owned"><span class="shoe-pic">${Art.piece('horseshoe')}</span><div><b>Golden Horseshoe</b> <span class="rare-tag">owned</span><br><small>Rare finds turn up 15% more often on every trip.</small></div></div>`
      : `<div class="shoe-card"><span class="shoe-pic">${Art.piece('horseshoe')}</span><div><b>Golden Horseshoe</b> <span class="rare-tag">very rare</span><br><small>Rare finds turn up 15% more often, forever. About 1 spin in 100 lands on the golden slice — and it's guaranteed by spin ${SHOE_PITY} (${f.sinceShoe}/${SHOE_PITY}).</small></div></div>`;
    document.getElementById('fair-tickets').innerHTML = `<span class="tk-ico">${Art.piece('fairticket')}</span><b>${f.tickets}</b>`;
    document.getElementById('fair-body').innerHTML = `
      ${welcomeNote ? `<p class="fair-note">${welcomeNote}</p>` : ''}
      <div class="fair-panel play-panel">
        <h3>🎪 The Fairground</h3>
        <div class="play-row"><span class="play-pic">${Art.tile('candyapple')}${Art.tile('balloon')}${Art.tile('fairtoken')}</span>
          <p>A quick, bright round: <b>15 moves</b>, no monsters. Match <b>gold star tokens</b> — every 3 wins a spin of the wheel. Matches of 5 and long chain reactions add a star too.</p></div>
        <button class="big" id="play-btn" ${f.tickets >= 1 ? '' : 'disabled'}>${f.tickets >= 1 ? `Play a round (1 golden ticket · you have ${f.tickets})` : 'No golden tickets'}</button>
        <p class="hint">Golden tickets turn up on gathering boards in every land — match next to one to grab it.</p>
      </div>
      <div class="fair-panel wheel-panel">
        <h3>🎡 The Prize Wheel <small>${f.wheel} spin${f.wheel === 1 ? '' : 's'}</small></h3>
        ${wheelSvg()}
        <div class="wheel-result">${lastWin ? `<p class="${lastWin.big ? 'reward' : ''}">${lastWin.text}</p>` : '<p class="hint">Flair, gold, pies, more tickets… or the golden slice.</p>'}</div>
        <button class="big" id="spin-btn" ${f.wheel >= 1 ? '' : 'disabled'}>${f.wheel >= 1 ? `Spin! (${f.wheel} left)` : 'No spins — play the fairground'}</button>
        <p class="hint">Spins come from the fairground board, plus <b>1 free</b> each day you visit.</p>
        ${shoe}
      </div>
      <div class="fair-panel">
        <h3>🎭 The Costume Tent <small>${owned}/${total} collected</small></h3>
        <div class="tent-row"><div class="tent-fig">${Hero.figure()}</div>
          <div class="tent-note"><p>Flair is just for looks — it never changes your armor or stats. A hat shows instead of your helmet.</p>
          ${fs.worn.hat || fs.worn.cape ? `<p>Wearing: ${[fs.worn.hat, fs.worn.cape].filter(Boolean).map(k => `<b>${FLAIR[k].name}</b>`).join(' & ')}</p>` : '<p class="hint">Tap something you own to try it on.</p>'}</div></div>
        <div class="flair-h">Hats</div><div class="flair-grid">${Object.keys(FLAIR).filter(k => FLAIR[k].slot === 'hat').map(card).join('')}</div>
        <div class="flair-h">Capes & collars</div><div class="flair-grid capes">${Object.keys(FLAIR).filter(k => FLAIR[k].slot === 'cape').map(card).join('')}</div>
      </div>
      <div class="fair-panel fortune">
        <h3>🔮 The Fortune Teller</h3>
        <p class="story-text">“${fortune()}”</p><p class="hint">A new fortune each day.</p>
      </div>`;
    document.getElementById('spin-btn').onclick = spin;
    document.getElementById('play-btn').onclick = () => { if (fair().tickets < 1) return; fair().tickets--; App.save(); App.go('fairplay'); };
    document.querySelectorAll('[data-wear]').forEach(b => { b.onclick = () => wear(b.dataset.wear); });
  }

  // ---------- the fairground board: a short, bright bonus round ----------
  const ROUND_MOVES = 15, TOKENS_PER_SPIN = 3;
  const TYPES = ['candyapple', 'balloon', 'pinwheel', 'popcorn', 'ribbon'];
  let board = null, round = null;
  const randType = () => (Math.random() < 0.11 ? 'fairtoken' : TYPES[Math.floor(Math.random() * TYPES.length)]);
  function addTokens(n, cell) {
    round.tokens += n;
    board.float(cell || [3, 3], `+${n} ★`, 'bonus');
    while (round.tokens >= TOKENS_PER_SPIN) {
      round.tokens -= TOKENS_PER_SPIN;
      round.spins++;
      setTimeout(() => { board.toast(`🎡 +1 spin! (${round.spins} this round)`, 'win', 1200); Sound.sfx('coin'); }, 250);
    }
    hudRound();
  }
  const hooks = {
    canPlay: () => !!round && !round.ended && round.moves > 0,
    onMove: () => { round.moves--; hudRound(); },
    onMatch(runs, step) {
      runs.forEach(ri => {
        let n = 0;
        if (ri.type === 'fairtoken') n += ri.cells.length;
        if (ri.cells.length >= 5) n += 1;
        if (n) addTokens(n, ri.cells[Math.floor(ri.cells.length / 2)]);
      });
      if (step === 3) addTokens(1, null);   // a long chain reaction earns a bonus star
    },
    onPieceHit() {}, onPieceTap() {}, onArm() {}, onFind() {},
    async afterAction() {
      hudRound();
      if (round.moves <= 0 && !round.ended) { await board.wait(700); endRound(); }
    },
  };
  function hudRound() {
    if (!round) return;
    document.getElementById('fp-moves').textContent = round.moves;
    document.getElementById('fp-spins').textContent = round.spins;
    document.getElementById('fp-meter').innerHTML = Array.from({ length: TOKENS_PER_SPIN }, (_, i) => `<i class="${i < round.tokens ? 'on' : ''}"></i>`).join('');
  }
  function startRound() {
    if (!board) {
      board = new Board({ rows: 7, cols: 7, wrap: document.getElementById('fairplay-wrap'), randType, hooks });
      document.getElementById('fp-exit').onclick = () => { if (round && !round.ended && !board.busy) endRound(); };
    }
    round = { moves: ROUND_MOVES, tokens: 0, spins: 0, ended: false };
    board.reset();
    board.setFrame('fair');
    board.fillEmpty();
    board.render();
    board.scheduleHint();
    hudRound();
    Sound.music('home');
    board.toast('🎪 Match the gold ★ tokens — 3 stars win a spin!', '', 2600);
  }
  async function endRound() {
    if (!round || round.ended) return;
    round.ended = true;
    board.stop();
    const won = Math.max(1, round.spins);   // a ticket always wins at least one spin
    fair().wheel += won;
    App.save();
    Sound.sfx('victory');
    await App.choose({
      title: '🎪 Round over!',
      html: `<div class="fp-won">${Art.tile('fairtoken')}</div><p>You won <b>${won} spin${won > 1 ? 's' : ''}</b> of the Prize Wheel${round.spins ? '' : ' (the fair never sends anyone home empty-handed)'}.</p>`,
      buttons: [{ id: 'wheel', label: '🎡 To the wheel!' }],
    });
    App.go('fair');
  }

  return { FLAIR, layer, earn, open, render, startRound, get tickets() { return fair().tickets; }, get board() { return board; }, get round() { return round; } };
})();
