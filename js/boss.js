// Boss lairs: Emberwyrm in the Dragon's Lair, and the Siren Queen in her grotto.
// One huge foe at the top of the board, its minions below, and a board that fights back (lava, tides).
window.Boss = (() => {
  const ROWS = 8, COLS = 7, CAP = 45, STAR_CHANCE = 0.02;

  const CONFIG = {
    dragon: {
      name: 'Emberwyrm', place: 'Dragon\'s Lair', icon: '🐉', foodCost: 6, frame: 'mine', scene: 'dwarf', music: 'dwarf',
      types: ['gold', 'coal', 'bones', 'gravel', 'ruby'],
      loot: { gold: 'gold', coal: 'coal', ruby: 'ruby' },
      boss: { hp: 520, armor: 4, weapon: 4, art: 'dragon', h: 2, scale: 1.6 },
      minion: { name: 'dragon whelp', hp: 22, armor: 3, weapon: 3, art: 'whelp' }, maxMinions: 3,
      every: 4, side: 'hoard', startHazards: 3,
      intro: 'Heat pours from the cavern. On a mountain of stolen gold, Emberwyrm opens one burning eye…',
      prep: `Emberwyrm's scales are <b>mythic</b> (hardness 4): anything less than mythic gear does a fraction of its damage.
        Every few moves it <b>breathes fire</b> down a column (lava + a burn on you), hatches <b>whelps</b>, or lets the lava spread.
        <br>💧 <b>Water flasks</b> douse lava · 🛡️ an <b>Elderwood ward</b> halves the fire · 👑 the <b>Old King's Crown</b> dims its scales.`,
      firstReward: { gold: 150, goldbar: 5, starsilver: 12, elderwood: 6, dragonscale: 6 }, reward: { gold: 60, starsilver: 4, dragonscale: 2 },
      xp: [300, 120],
    },
    siren: {
      name: 'Nerissa, the Siren Queen', place: 'Siren\'s Grotto', icon: '🧜‍♀️', foodCost: 4, frame: 'ocean', scene: 'ocean', music: 'ocean',
      types: ['water', 'fish', 'seaweed', 'sand', 'driftwood'],
      loot: { water: 'water', fish: 'food', driftwood: 'wood' },
      boss: { hp: 130, armor: 2, weapon: 2, kin: 'sea', art: 'siren', h: 2, scale: 1.6 },
      minion: { name: 'shore crab', hp: 12, armor: 2, weapon: 1, kin: 'sea', art: 'crab' }, maxMinions: 3,
      every: 3, side: 'clam', startHazards: 0,
      intro: 'A song drifts across the water. In the grotto, the Siren Queen raises her trident — and the crabs come scuttling.',
      prep: `Nerissa commands the crabs and the tide. Her <b>song</b> drains your ⚡, the <b>tide</b> floods tiles, and she lashes out with her trident.
        <br>🌊 Coral spears and sea gear hit her harder · 💧 Water flasks clear flood-water.`,
      firstReward: { pearl: 8, coral: 8, shell: 6, gold: 30 }, reward: { pearl: 4, coral: 4, shell: 3 },
      firstItem: 'sirenpearl',
      xp: [120, 60],
    },
  };
  const SIREN_LV = 8;   // the grotto appears once the Coast reaches this level

  let board = null, run = null, cfg = CONFIG.dragon;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const st = () => App.state;

  // ---------- HUD ----------
  function hud() {
    if (!run) return;
    document.getElementById('boss-moves').textContent = run.moves;
    const b = run.boss, pct = Math.max(0, b.hp / b.maxHp * 100);
    document.getElementById('boss-hp').style.width = pct + '%';
    document.getElementById('boss-hpn').textContent = `${Math.ceil(Math.max(0, b.hp))}/${b.maxHp}`;
    const left = Math.max(0, Math.min(run.every, run.every - run.since));
    const verb = run.kind === 'dragon' ? 'Emberwyrm stirs in' : 'Nerissa sings in';
    document.getElementById('boss-turn').innerHTML = `${verb} <b>${'●'.repeat(left)}${'○'.repeat(run.every - left)}</b>`;
    const loot = Object.entries(run.bag).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${Data.RESOURCES[k].label}`);
    document.getElementById('boss-loot').textContent = loot.length ? loot.join(', ') : 'nothing yet';
    document.getElementById('boss-hint').textContent = board.armedHint() || run.hint || '';
  }

  // ---------- pieces ----------
  const minionSpec = () => ({ kind: 'minion', mat: 'creature', label: '', ...cfg.minion });
  function hazard(r, c) {
    const kind = run.kind === 'dragon' ? 'lava' : 'tide';
    return board.addPiece({ kind, mat: 'other', hp: 1, art: kind, label: '' }, r, c, 1, true);
  }
  function addLoot(res, n, cell, delay = 0) {
    run.bag[res] = (run.bag[res] || 0) + n;
    board.float(cell, `+${n} ${Data.RESOURCES[res].label}`, res === 'gold' ? 'gold' : 'gain', delay);
  }
  function spawnMinion() {
    if (board.piecesOf('minion').length >= cfg.maxMinions) return false;
    const spots = board.tileCells(r => r >= 1);
    if (!spots.length) return false;
    const [r, c] = pick(spots);
    board.addPiece(minionSpec(), r, c, 1, true);
    return true;
  }

  // ---------- the boss's turn ----------
  async function bossTurn() {
    const t = run.turn++;
    let msg = '';
    if (run.kind === 'dragon') {
      const act = t % 3 === 1 && board.piecesOf('minion').length < cfg.maxMinions ? 'whelp' : t % 3 === 2 ? 'spread' : 'breath';
      if (act === 'breath') {
        const c = Math.floor(Math.random() * COLS);
        board.lineFlash(false, c);
        Sound.sfx('blast');
        let n = 0;
        for (let r = 1; r < ROWS && n < 4; r++) if (board.isTile(board.grid[r][c]) && Math.random() < 0.75) { hazard(r, c); n++; }
        const hit = App.hurtPlayer(4);
        let dmg = hit.dmg;
        if (st().inventory.elderward > 0 && dmg) { const back = App.heal(Math.floor(dmg / 2)); dmg -= back; }
        msg = `🔥 Emberwyrm breathes fire! −${dmg} ❤️${st().inventory.elderward > 0 ? ' (your Elderwood ward takes half)' : ''}`;
        ouch();
      } else if (act === 'whelp') {
        spawnMinion();
        msg = '🥚 A dragon whelp crawls out of the hoard!';
        Sound.sfx('drums');
      } else {
        const lava = board.piecesOf('lava');
        let n = 0;
        lava.sort(() => Math.random() - 0.5).forEach(l => {
          if (n >= 3) return;
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [l.r + dr, l.c + dc])
            .filter(([r, c]) => r >= 1 && r < ROWS && c >= 0 && c < COLS && board.isTile(board.grid[r][c]));
          if (opts.length) { const [r, c] = pick(opts); hazard(r, c); n++; }
        });
        msg = n ? '🌋 The lava spreads!' : '🔥 Emberwyrm rumbles…';
      }
    } else {
      const act = t % 3 === 0 ? 'song' : t % 3 === 1 ? 'crabs' : 'tide';
      if (act === 'song') {
        const lost = Math.min(board.energy, 3);
        board.energy -= lost;
        board.renderEnergy(true);
        msg = `🎶 Nerissa sings… your will slips away (−${lost} ⚡)`;
        Sound.sfx('reveal');
      } else if (act === 'crabs') {
        const a = spawnMinion(), b = spawnMinion();
        msg = a || b ? '🦀 Crabs scuttle to her side!' : '🦀 The crabs clack their claws…';
        Sound.sfx('drums');
      } else {
        const spots = board.tileCells(r => r >= ROWS - 3).sort(() => Math.random() - 0.5).slice(0, 3);
        spots.forEach(([r, c]) => hazard(r, c));
        const hit = App.hurtPlayer(cfg.boss.weapon);
        msg = `🌊 The tide floods in and her trident lashes out! −${hit.dmg} ❤️`;
        if (hit.dmg) ouch();
      }
    }
    // Her minions strike too (at most three reach you).
    let total = 0;
    for (const m of board.piecesOf('minion').slice(0, 3)) {
      const hit = App.hurtPlayer(m.weapon || 1);
      board.float([m.r, m.c], hit.dmg ? `⚔️ −${hit.dmg} ❤️` : '🛡️ blocked', hit.dmg ? 'loss' : 'gain');
      total += hit.dmg;
    }
    if (total) { msg += ` · ${cfg.minion.name}s hit you for ${total}`; ouch(); }
    board.renderHealth(true);
    board.render();
    run.hint = msg;
    board.toast(msg, 'alert', 2400);
    hud();
    await board.wait(900);
    await board.ensurePlayable();
  }
  function ouch() {
    const wrap = document.getElementById('boss-wrap');
    wrap.classList.remove('ouch'); void wrap.offsetWidth; wrap.classList.add('ouch');
  }

  // ---------- hooks ----------
  const hooks = {
    canPlay: () => !!run && !run.ended && !run.won && run.moves < CAP,
    onMove: () => { run.moves++; run.since++; hud(); },
    onMatch(runs, step) {
      for (const ri of runs) {
        const res = cfg.loot[ri.type];
        if (res) addLoot(res, ri.cells.length >= 4 ? 2 : 1, ri.cells[Math.floor(ri.cells.length / 2)]);
      }
      if (step >= 2 && !run.staggered) { run.staggered = true; run.since--; board.float([2, 3], '💥 It reels!', 'bonus'); }
    },
    onPieceHit(p, n, src) {
      const dmg = src === 'match' ? n * Data.matchDamage(p) : n;
      if (dmg <= 0) {
        if (p.mat === 'creature' && !run.told[p.kind]) { run.told[p.kind] = true; board.toast('⚔️ Matches alone can\'t hurt it — swing your weapon (tap it), or match right beside it with a weapon in hand.', '', 3000); }
        return;
      }
      if (board.hurt(p, dmg)) destroyed(p);
      hud();
    },
    onPieceTap(p) {
      const msg = {
        lava: 'Lava! Match beside it to cool it, or throw a 💧 Water flask.',
        tide: 'Flood-water. Match beside it to clear it, or throw a 💧 Water flask.',
        hoard: 'Part of the dragon\'s hoard. Match beside it to dig out the gold.',
        clam: 'A giant clam. Match beside it to pry out a pearl.',
      }[p.kind] || 'Match next to it.';
      board.toast(msg, '', 2400);
    },
    onArm: () => hud(),
    async afterAction(wasMove) {
      run.staggered = false;
      if (run.won) { await board.wait(900); finish('win'); return; }
      if (run.ended) return;
      if (!wasMove) { run.moves++; run.since++; }
      if (run.since >= run.every) {
        run.since = 0;
        await bossTurn();
        if (st().hp <= 0) { await board.wait(600); finish('lost'); return; }
      }
      hud();
      if (run.moves >= CAP && !run.ended) { await board.wait(500); finish('cap'); }
    },
  };

  function destroyed(p) {
    const cell = [p.r, p.c + Math.floor(p.w / 2)];
    if (p === run.boss) {
      run.won = true;
      board.piecesOf('minion').forEach(m => board.removePiece(m));
      Sound.sfx('victory');
      board.toast(run.kind === 'dragon' ? '🐉 Emberwyrm crashes down onto its hoard!' : '🧜‍♀️ The Siren Queen sinks beneath the waves!', 'win', 3000);
      return;
    }
    if (p.kind === 'minion') board.float(cell, `${cfg.minion.name} down!`, 'bonus');
    if (p.kind === 'hoard') { addLoot('gold', 6, cell); addLoot('goldbar', 1, cell, 250); }
    if (p.kind === 'clam') addLoot('pearl', 1, cell);
  }

  // ---------- start & finish ----------
  function prepare(kind) {
    const c = CONFIG[kind], s = st();
    const food = s.stockpile.food, canGo = food >= c.foodCost && s.hp > 0;
    const wins = (s.bossWins || {})[kind] || 0;
    const w = s.equip.weapon ? Data.ITEMS[s.equip.weapon.id] : null;
    const armor = c.boss.armor - (kind === 'dragon' && s.inventory.crown > 0 ? 1 : 0);
    const under = !w ? 'You have no weapon!' : w.tier < armor ? `Your ${w.name} is ${armor - w.tier} tier${armor - w.tier > 1 ? 's' : ''} below its scales — each blow does only a fraction.` : 'Your weapon can bite through its hide.';
    App.choose({
      title: `${c.icon} ${c.place}`,
      html: `<p class="story-text">${c.intro}</p>
        <p class="race-rules">${c.prep}</p>
        <p class="${!w || w.tier < armor ? 'warn-note' : 'hint'}">⚔️ ${under}</p>
        <p>❤️ <b>${s.hp}/${App.maxHp}</b> · Costs <b>${c.foodCost} food</b> (you have ${food}) · <a href="#" id="prep-hero">Armor up / eat</a></p>
        ${kind === 'dragon' ? `<p class="hint">${s.inventory.flask || 0} water flask${s.inventory.flask === 1 ? '' : 's'} · ${s.inventory.elderward ? 'Elderwood ward ✓' : 'no Elderwood ward'} · ${s.inventory.crown ? 'the Crown ✓' : 'no Crown'}</p>` : ''}
        ${wins ? `<p class="hint">Defeated ${wins} time${wins > 1 ? 's' : ''} — they return, and the rewards are smaller now.</p>` : ''}`,
      buttons: [
        { id: 'go', label: canGo ? `${c.icon} Enter` : s.hp <= 0 ? 'Too hurt — eat first' : `Need ${c.foodCost} food`, cls: 'danger', disabled: !canGo },
        { id: 'later', label: 'Not yet', cls: 'alt' },
      ],
    }).then(ch => {
      if (ch !== 'go') { App.go('home'); return; }
      s.stockpile.food -= c.foodCost;
      App.save();
      App.go('boss', { kind });
    });
    App.reprep = () => prepare(kind);
  }

  function start({ kind = 'dragon' } = {}) {
    cfg = CONFIG[kind];
    document.getElementById('screen-boss').dataset.boss = kind;
    document.getElementById('boss-name').textContent = `${cfg.icon} ${cfg.name}`;
    board.reset();
    board.setFrame(cfg.frame);
    Art.setScene(cfg.scene);
    run = { kind, moves: 0, since: 0, every: cfg.every, turn: 0, ended: false, won: false, bag: {}, told: {}, hint: cfg.intro };
    const armor = cfg.boss.armor - (kind === 'dragon' && st().inventory.crown > 0 ? 1 : 0);
    run.boss = board.addPiece({ kind: 'boss', mat: 'creature', label: '', ...cfg.boss, armor }, 0, 2, 3);
    [0, 1, 5, 6].forEach(c => board.addPiece({ kind: cfg.side, mat: 'other', hp: 2, art: cfg.side, label: '' }, 0, c));
    board.fillEmpty();
    for (let i = 0; i < cfg.startHazards; i++) { const [r, c] = pick(board.tileCells(r => r >= 2)); hazard(r, c); }
    spawnMinion();
    board.renderWeapons(document.getElementById('boss-weapons'));
    board.render();
    board.scheduleHint();
    hud();
    Sound.music(cfg.music);
    board.toast(cfg.intro, '', 3200);
  }

  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    const s = st(), won = reason === 'win', kind = run.kind;
    s.bossWins = s.bossWins || {};
    const first = won && !s.bossWins[kind];
    const gained = [];
    if (won || reason === 'flee' || reason === 'cap') Object.entries(run.bag).forEach(([k, n]) => { s.stockpile[k] += n; gained.push(`+${n} ${Data.RESOURCES[k].label}`); });
    let xp = 0;
    if (won) {
      s.bossWins[kind] = (s.bossWins[kind] || 0) + 1;
      Object.entries(first ? cfg.firstReward : cfg.reward).forEach(([k, n]) => { s.stockpile[k] += n; gained.push(`+${n} ${Data.RESOURCES[k].label}`); });
      if (first && cfg.firstItem) { App.addGear(cfg.firstItem); gained.push(`✨ <b>${Data.ITEMS[cfg.firstItem].name}</b> — ${Data.ITEMS[cfg.firstItem].desc}`); }
      if (kind === 'dragon') { s.story.flags.dragonSlain = true; }
      xp = cfg.xp[first ? 0 : 1];
    }
    if (s.hp <= 0) s.hp = 0;
    App.save();
    const newLv = xp ? App.addXP(xp) : 0;
    if (xp) gained.push(`⭐ +${xp} XP`);
    if (newLv) gained.push(`🎉 <b>Level ${newLv}!</b> ${App.levelPerks(newLv)}`);
    App.tripDone(kind, {});
    const title = won ? (kind === 'dragon' ? '🐉 Emberwyrm is slain!' : '🧜‍♀️ The Siren Queen is defeated!') : reason === 'flee' ? 'You fled' : reason === 'cap' ? 'You fell back' : '💀 You were overwhelmed';
    const line = won ? `You won in <b>${run.moves}</b> moves with ❤️ ${s.hp}/${App.maxHp} left.`
      : reason === 'lost' ? `${cfg.name} wore you down after ${run.moves} moves. Everything you grabbed was left behind.`
      : reason === 'cap' ? `You can't keep fighting — you fall back. ${cfg.name} had ${Math.ceil(run.boss.hp)}/${run.boss.maxHp} ❤️ left.`
      : `You escaped. ${cfg.name} had ${Math.ceil(run.boss.hp)}/${run.boss.maxHp} ❤️ left.`;
    App.choose({
      title,
      html: `<p>${line}</p>${gained.length ? `<div class="sum-spoils"><b>Brought home</b><br>${gained.join('<br>')}</div>` : ''}`,
      buttons: [{ id: 'home', label: 'Back to the map' }],
    }).then(async () => {
      if (first && kind === 'dragon') {
        await App.choose({
          title: '👑 Valdmoor is free',
          html: `<p class="story-text">The dragon's fire gutters out. In the silence, ${s.profile ? s.profile.name : 'you'} climbs the hoard and sets the Old King's Crown in the light — and for the first time since Ashford burned, the realm holds together.</p>
            <p class="story-text">But the scales you carry home are warm, and far beyond the edge of the map, something else is stirring…</p>
            <p class="hint">The end of the main story — for now. Beyond the Known Realm awaits.</p>`,
          buttons: [{ id: 'ok', label: 'Onward' }],
        });
      }
      App.go('home');
    });
  }

  function init() {
    board = new Board({
      rows: ROWS, cols: COLS, wrap: document.getElementById('boss-wrap'),
      randType: () => (Math.random() < STAR_CHANCE ? 'star' : pick(cfg.types)), hooks,
    });
    document.getElementById('boss-exit').onclick = () => {
      if (!run || run.ended || board.busy) return;
      finish(run.won ? 'win' : 'flee');
    };
  }

  return { init, start, prepare, CONFIG, SIREN_LV, get board() { return board; }, get run() { return run; } };
})();
