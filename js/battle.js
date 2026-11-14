// Battle boards (Goblin Village, Dwarf Stronghold): fog hides the base, defenders act every few moves.
window.Battle = (() => {
  // ---------- tuning knobs ----------
  const ROWS = 9;
  const COLS = 7;
  const FOG_ROWS = 4;
  const ENEMY_EVERY = 3;
  const MAX_MINIONS = 3;
  const STAR_CHANCE = 0.02;
  const CAP = 40;               // Siege Race soft cap: after this many moves, most damage wins

  const P = {
    fog:      { kind: 'fog',      label: '',        mat: 'other', hp: 1 },
    rubble:   { kind: 'rubble',   label: '',        mat: 'stone', hp: 1, art: 'rubble' },
    // Goblins: mostly wood
    gkeep:    { kind: 'keep',     label: 'KEEP',    mat: 'wood',  hp: 5, art: 'gkeep' },
    fence:    { kind: 'fence',    label: 'FENCE',   mat: 'wood',  hp: 1, art: 'fence' },
    tower:    { kind: 'tower',    label: 'TOWER',   mat: 'wood',  hp: 2, art: 'tower' },
    loot:     { kind: 'loot',     label: 'LOOT',    mat: 'wood',  hp: 1, art: 'loot' },
    chest:    { kind: 'chest',    label: '',        mat: 'wood',  hp: 1, art: 'chest' },
    prisoner: { kind: 'prisoner', label: 'PRISONER', mat: 'other', hp: 1, art: 'prisoner' },
    goblin:   { kind: 'minion',   label: 'G',       mat: 'creature', hp: 1, cls: 'goblin', art: 'goblin' },
    // Dwarves: stone and iron
    hall:     { kind: 'keep',     label: 'GREAT HALL', mat: 'stone', hp: 6, cls: 'hall', art: 'hall' },
    swall:    { kind: 'swall',    label: 'WALL',    mat: 'stone', hp: 2, art: 'swall' },
    gate:     { kind: 'gate',     label: 'GATE',    mat: 'iron',  hp: 3, lock: true, art: 'gate' },
    ballista: { kind: 'tower',    label: 'BALLISTA', mat: 'wood', hp: 2, cls: 'ballista', art: 'ballista' },
    vault:    { kind: 'loot',     label: 'VAULT',   mat: 'stone', hp: 2, cls: 'vault', art: 'vault' },
    gems:     { kind: 'chest',    label: '',        mat: 'stone', hp: 1, cls: 'gems', art: 'gems' },
    keyp:     { kind: 'keyp',     label: 'KEY',     mat: 'other', hp: 1, art: 'keyp' },
    guard:    { kind: 'minion',   label: 'D',       mat: 'creature', hp: 2, cls: 'guard', art: 'guard' },
  };

  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];

  function scatter(set, kinds) {
    const free = [];
    for (let r = 1; r < FOG_ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!set.has(`${r},${c}`)) free.push([r, c]);
    free.sort(() => Math.random() - 0.5);
    kinds.forEach((k, i) => set.set(`${free[i][0]},${free[i][1]}`, k));
  }

  const CONFIG = {
    goblin: {
      name: 'Goblin Village', icon: '🔥', foodCost: 3, moves: 20, spoils: 'goblin',
      types: ['wood', 'stone', 'hide', 'berries', 'leaves'],
      foundTitle: 'A goblin village!', foundBanner: 'Smoke rises through the trees…',
      foundText: 'You followed the tracks to a goblin village hidden in the trees.',
      prep: 'Goblins build with <b>wood</b> — Clubs, Axes and Firepots shine. Every 3 moves they throw spears, sneak goblins in, or rebuild fences.',
      intro: 'The village lies in the fog ahead…',
      keep: 'gkeep', keepW: 3, minion: 'goblin', minionName: 'goblin', rebuild: 'fence',
      winBonus: { gold: 3 },
      layout() {
        const h = new Map();
        [2, 3, 4].forEach(c => h.set(`0,${c}`, 'keep'));
        h.set('0,1', 'fence'); h.set('0,5', 'fence');
        h.set(`0,${pick([0, 6])}`, 'tower');
        h.set(`1,${1 + rnd(5)}`, 'loot');
        scatter(h, ['fence', 'trap', 'trap', 'chest', ...(Math.random() < 0.6 ? ['prisoner'] : [])]);
        return h;
      },
      turnMsgs: { missile: 'A spear lands and blocks a tile!', minion: 'A goblin sneaks in! It repairs the keep each goblin turn.', rebuild: 'Goblins rebuilt a fence!', heal: 'Goblins repair the keep' },
      reveal: {
        fence: 'A goblin fence (wood).', tower: 'A watchtower! It throws an extra spear every goblin turn.',
        chest: 'A buried chest! Match next to it to dig it up.', loot: 'The goblin loot chest! Open it for goblin spoils.',
        prisoner: 'A prisoner! Free them and they\'ll sabotage the attack on your camp.', keep: 'The goblin keep (wood)! Break it to win.',
      },
    },
    dwarf: {
      name: 'Dwarf Stronghold', icon: '⛏️', foodCost: 4, moves: 22, spoils: 'dwarf',
      types: ['stone', 'ore', 'coal', 'gravel', 'bones'],
      foundTitle: 'A dwarf stronghold!', foundBanner: 'The rune glows… a door in the hillside!',
      foundText: 'The rune stone marks the hidden gate of a dwarf stronghold.',
      prep: 'Dwarves build with <b>stone and iron</b> — Clubs bounce off. Bring Pickaxes and Swords. The iron gate opens with a key hidden in the fog. Every 3 moves they fire bolts, send armored guards, or shore up walls.',
      intro: 'Torchlight flickers behind the fog…',
      keep: 'hall', keepW: 3, minion: 'guard', minionName: 'dwarf guard', rebuild: 'swall',
      winBonus: { gold: 3, iron: 4 },
      layout() {
        const h = new Map();
        [2, 3, 4].forEach(c => h.set(`0,${c}`, 'keep'));
        h.set('0,1', 'swall'); h.set('0,5', 'swall');
        h.set('1,2', 'swall'); h.set('1,3', 'gate'); h.set('1,4', 'swall');
        h.set(`0,${pick([0, 6])}`, 'ballista');
        h.set(`1,${pick([0, 1, 5, 6])}`, 'vault');
        scatter(h, ['keyp', 'trap', 'trap', 'gems']);
        return h;
      },
      turnMsgs: { missile: 'A ballista bolt slams into the board!', minion: 'An armored dwarf guard marches in! (2 HP, repairs the hall)', rebuild: 'Dwarves rebuilt a stone wall!', heal: 'Dwarves shore up the hall' },
      reveal: {
        swall: 'A stone wall (2 hits).', gate: 'An iron gate! Matches can\'t dent it — find the key, or use a Pickaxe/Sword.',
        ballista: 'A ballista! It fires an extra bolt every dwarf turn.', vault: 'The dwarven vault! Break it for dwarf spoils.',
        gems: 'A gem chest!', keyp: 'The gate key! Match next to it to grab it.', keep: 'The Great Hall (stone, 6 HP). Break it to win.',
        ballistaKind: 'tower',
      },
    },
  };

  let board = null;
  let run = null;
  let cfg = CONFIG.goblin;

  // ---------- HUD ----------
  function lootText() {
    const b = run.bag;
    const parts = Object.keys(Data.RESOURCES).filter(t => b[t] > 0).map(t => `${b[t]} ${Data.RESOURCES[t].label}`);
    run.bag.spoils.forEach(k => parts.push(App.spoilName(k)));
    run.bag.specials.forEach(k => parts.push(Data.FIND_INFO[k].icon));
    return parts.length ? parts.join(', ') : 'nothing yet';
  }

  function hud() {
    document.getElementById('b-moves').textContent = run.moves;
    document.getElementById('b-cap').textContent = `/${CAP}`;
    document.querySelector('#screen-battle .moves').classList.toggle('low', CAP - run.moves <= 5);
    const left = ENEMY_EVERY - run.sinceEnemy;
    const who = run.enemy === 'dwarf' ? 'Dwarves' : 'Goblins';
    document.getElementById('enemy').innerHTML = `${who} act in <b>${'●'.repeat(left)}${'○'.repeat(ENEMY_EVERY - left)}</b>`;
    document.getElementById('lootbar-text').textContent = lootText();
    document.getElementById('battle-hint').textContent = board.armedHint() || (run.keep
      ? `Break the ${run.keep.label} before they break yours! Open their loot chest first for bonus loot.`
      : 'Siege Race! Scout the fog (?) and break their keep in fewer moves than they need for yours.');
    hudRace();
  }

  function hudRace() {
    const a = run.race;
    document.getElementById('race-map').innerHTML = Camp.miniMap(a);
    document.getElementById('race-keep').innerHTML = '♥'.repeat(a.keep.hp) + '<span class="lost">' + '♥'.repeat(a.keep.max - a.keep.hp) + '</span>';
    document.getElementById('race-log').textContent = a.log;
    document.getElementById('race-them').textContent = run.keep ? `Their ${run.keep.label.toLowerCase()}: ${run.keep.hp}/${run.keep.maxHp}` : 'Their keep: hidden';
  }

  // ---------- pieces ----------
  function addKeep() {
    run.keep = board.addPiece(P[cfg.keep], 0, 2, cfg.keepW, true);
    board.toast(cfg.reveal.keep, 'alert', 2600);
  }

  function reveal(fog, src) {
    const k = fog.hidden;
    const { r, c } = fog;
    board.removePiece(fog, 'fog-out');
    Sound.sfx('reveal');
    if (!k) return;
    if (k === 'keep') {
      board.pieces.filter(p => p.kind === 'fog' && p.hidden === 'keep').forEach(f => board.removePiece(f, 'fog-out'));
      addKeep();
      return;
    }
    if (k === 'trap') {
      if (src === 'match') {
        run.moves++;
        run.extraAi++;
        board.float([r, c], '+1 move', 'loss');
        board.toast(run.enemy === 'dwarf' ? 'Rockfall trap! +1 move on your count.' : 'Hidden pit trap! +1 move on your count.', 'alert');
      } else {
        board.float([r, c], 'Trap disarmed', 'bonus');
      }
      return;
    }
    if (k === 'gate' && run.gateOpen) return;
    board.addPiece(P[k], r, c, 1, true);
    board.toast(cfg.reveal[k] || 'Something in the fog…', k === 'tower' || k === 'ballista' || k === 'gate' ? 'alert' : '', 2600);
  }

  function addLoot(res, n, cell, delay = 0) {
    run.bag[res] = (run.bag[res] || 0) + n;
    board.float(cell, `+${n} ${Data.RESOURCES[res].label}`, res === 'gold' ? 'gold' : 'gain', delay);
  }

  function destroyed(p, w) {
    const cell = [p.r, p.c + Math.floor(p.w / 2)];
    switch (p.kind) {
      case 'keep': win(cell); break;
      case 'fence':
      case 'swall':
        run.broken.push([p.r, p.c]);
        board.toast(p.kind === 'fence' ? 'Fence smashed!' : 'Stone wall crumbles!');
        break;
      case 'gate': board.toast('The iron gate gives way!', 'win'); break;
      case 'tower': board.toast(p.cls === 'ballista' ? 'Ballista wrecked!' : 'Watchtower down! No more extra spears.'); break;
      case 'minion': board.float(cell, `${cfg.minionName} down!`, 'bonus'); break;
      case 'prisoner':
        run.race.skip += 2;
        board.float(cell, 'Sabotage!', 'bonus');
        board.toast('Prisoner freed! They sabotage the attack on your camp (−2 moves for them).', 'win');
        break;
      case 'keyp': {
        run.gateOpen = true;
        const gates = board.piecesOf('gate');
        gates.forEach(g => board.removePiece(g));
        board.toast(gates.length ? '🗝️ Key turned — the iron gate swings open!' : '🗝️ You grab the gate key — the gate will open when you find it.', 'win', 2600);
        Sound.sfx('coin');
        break;
      }
      case 'chest':
        if (p.cls === 'gems') { addLoot('gold', 4, cell); board.toast('Gem chest! +4 gold', 'win'); }
        else {
          addLoot('gold', 2, cell);
          for (let i = 0; i < 2; i++) addLoot(pick(['wood', 'stone', 'hide']), 1, cell, 250 * (i + 1));
          board.toast('Buried chest dug up!', 'win');
        }
        break;
      case 'loot': {
        // Their loot chest holds their special items: keys, map scraps, relic shards.
        const got = [0, 1].map(() => Data.rollFrom([['scrap', 40], ['key', 32], ['shard', 28]]));
        run.bag.specials.push(...got);
        run.lootOpened = true;
        board.celebrate(cell, {
          icon: '📦', title: `${p.cls === 'vault' ? 'Vault' : 'Loot chest'} opened!`,
          sub: got.map(k => `${Data.FIND_INFO[k].icon} ${Data.FIND_INFO[k].name}`).join(' & '), rare: got.includes('shard'),
        });
        break;
      }
      default: break;
    }
  }

  function win(cell) {
    run.won = true;
    Sound.sfx('victory');
    const k = App.rollSpoil(cfg.spoils);
    run.bag.spoils.push(k);
    Object.entries(cfg.winBonus).forEach(([res, n], i) => addLoot(res, n, cell, i * 250));
    board.piecesOf('minion').forEach(g => board.removePiece(g));
    board.toast(`${run.keep.label} destroyed! ${App.spoilName(k)}`, 'win', 3000);
  }

  // ---------- defenders' turn ----------
  async function act(a) {
    if (a === 'rebuild') {
      const spots = run.broken.filter(([r, c]) => board.isTile(board.grid[r][c]));
      if (!spots.length) return;
      const [r, c] = pick(spots);
      run.broken = run.broken.filter(([a2, b2]) => a2 !== r || b2 !== c);
      board.addPiece(P[cfg.rebuild], r, c, 1, true);
      board.toast(cfg.turnMsgs.rebuild, 'alert');
    } else if (a === 'shore') {
      const hurt = board.pieces.filter(p => (p.kind === 'swall' || p.kind === 'gate') && p.hp < p.maxHp);
      if (!hurt.length) return act('missile');
      const p = pick(hurt);
      p.hp++;
      board.renderPieces();
      board.float([p.r, p.c], '+1 ♥', 'loss');
      board.toast('Dwarves shore up a wall!', 'alert');
    } else {
      const spots = board.tileCells(r => r >= 1);
      if (!spots.length) return;
      const [r, c] = pick(spots);
      if (a === 'missile') {
        board.addPiece(P.rubble, r, c, 1, true);
        board.float([r, c], run.enemy === 'dwarf' ? '🏹 Bolt!' : '🗡️ Spear!', 'loss');
        board.toast(cfg.turnMsgs.missile, 'alert');
      } else {
        board.addPiece(P[cfg.minion], r, c, 1, true);
        board.toast(cfg.turnMsgs.minion, 'alert', 2400);
      }
    }
    board.render();
    await board.wait(750);
  }

  async function enemyTurn() {
    board.toast(run.enemy === 'dwarf' ? 'Dwarves\' turn!' : 'Goblins\' turn!', 'alert', 1200);
    Sound.sfx('drums');
    await board.wait(700);
    const options = ['missile', 'minion'];
    if (board.piecesOf('minion').length >= MAX_MINIONS) options.pop();
    if (run.broken.some(([r, c]) => board.isTile(board.grid[r][c]))) options.push('rebuild', 'rebuild');
    if (run.enemy === 'dwarf') options.push('shore');
    await act(pick(options));
    if (board.piecesOf('tower').length) await act('missile');

    const mins = board.piecesOf('minion').length;
    const keep = run.keep;
    if (mins && keep && !keep.gone && keep.hp < keep.maxHp) {
      const heal = 1;   // one repair per turn, however many are inside
      keep.hp += heal;
      board.renderPieces();
      board.float([0, 3], `+${heal} ♥`, 'loss');
      board.toast(`${cfg.turnMsgs.heal} (+${heal})!`, 'alert');
      await board.wait(800);
    }
    await board.ensurePlayable();
  }

  // ---------- board hooks ----------
  const hooks = {
    canPlay: () => !!run && !run.ended && !run.won && run.moves < CAP,
    onMove: () => { run.moves++; run.sinceEnemy++; run.rubbleSent = false; hud(); },
    onMatch(runs, step) {
      // Big combos and line blasts throw rubble onto the attackers' path at your camp.
      if (!run.rubbleSent && (step >= 2 || runs.some(r => r.cells.length >= 5))) {
        run.rubbleSent = true;
        run.race.skip++;
        board.float([1, 3], '🪨 Rubble → them!', 'bonus');
        hudRace();
      }
    },
    onPieceHit(p, n, src, w) {
      if (p.kind === 'fog') { reveal(p, src); hud(); return; }
      const dmg = src === 'match' ? n * Data.matchDamage(p) : n;
      if (dmg <= 0) {
        if (!run.told[p.kind]) {
          run.told[p.kind] = true;
          board.toast(p.mat === 'creature'
            ? `⚔️ Matches can't hurt a ${cfg.minionName} — only weapons can! It keeps repairing the keep.`
            : '🔒 Matches can\'t dent iron. Find the key in the fog — or use a Pickaxe, Sword or Sling.', '', 3000);
        }
        return;
      }
      if (board.hurt(p, dmg)) destroyed(p, w);
      hud();
    },
    onPieceTap(p) {
      const msg = {
        fog: 'Fog — match next to it to see what\'s there.',
        keep: `${p.label} (${p.mat}). Match next to it to damage it.`,
        minion: `A ${cfg.minionName}! It repairs the keep — only weapons can hurt it.`,
        rubble: 'Rubble. Match next to it to clear it.',
        gate: 'Iron gate. Needs the key from the fog, an Old key, or a Pickaxe/Sword/Sling.',
        swall: 'Stone wall (2 hits). Pickaxes crack it in one.',
        keyp: 'The gate key! Match next to it.',
      }[p.kind] || `Match next to it to break it (${p.mat}).`;
      board.toast(msg, '', 2600);
    },
    onWeaponUsed: () => { run.weaponsUsed++; },
    onArm: () => hud(),
    async afterAction(wasMove) {
      hud();
      if (run.won) { await board.wait(900); finish('win'); return; }
      if (run.ended) return;
      if (!wasMove) { run.moves++; run.sinceEnemy++; }   // using a weapon costs a move too
      // The enemy takes their move(s) on your camp.
      const steps = 1 + run.extraAi;
      run.extraAi = 0;
      for (let i = 0; i < steps; i++) {
        const res = Camp.step(run.race);
        hudRace();
        flashRace(res.msg);
        if (run.race.done) { await board.wait(700); finish('lost'); return; }
        if (res.rubble) await act('missile');
      }
      // Their own village defenders act every few moves.
      if (run.sinceEnemy >= ENEMY_EVERY) {
        run.sinceEnemy = 0;
        hud();
        await enemyTurn();
        hud();
      }
      if (run.moves >= CAP && !run.ended) { await board.wait(600); finish('cap'); }
    },
  };

  function flashRace(msg) {
    const el = document.getElementById('race');
    el.classList.remove('ping'); void el.offsetWidth; el.classList.add('ping');
    if (/broke|opened|smashed/.test(msg)) { el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); Sound.sfx('hit'); }
  }

  // ---------- end of raid ----------
  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    const a = run.race;
    const theirDmg = run.keep ? 1 - run.keep.hp / run.keep.maxHp : 0;
    const myDmg = 1 - a.keep.hp / a.keep.max;
    const won = reason === 'win' || (reason === 'cap' && theirDmg > myDmg);
    const keepLoot = won || reason === 'retreat';
    const gained = [], lost = [];
    if (keepLoot) {
      Object.keys(Data.RESOURCES).forEach(t => {
        if (run.bag[t]) { App.state.stockpile[t] += run.bag[t]; gained.push(`+${run.bag[t]} ${Data.RESOURCES[t].label}`); }
      });
      run.bag.spoils.forEach(k => gained.push(App.grantSpoil(k)));
      run.bag.specials.forEach(k => gained.push(App.grantSpecial(k, run.enemy)));
    }
    // If they broke your keep, they plunder part of your storehouse.
    if (reason === 'lost') {
      ['wood', 'stone', 'hide', 'iron', 'coal', 'gold'].forEach(t => {
        const n = Math.floor(App.state.stockpile[t] * 0.1);
        if (n > 0) { App.state.stockpile[t] -= n; lost.push(`−${n} ${Data.RESOURCES[t].label}`); }
      });
    }
    a.stolen.forEach(x => lost.push(`${x} (from your loot chest)`));
    App.save();
    const gainXp = (won ? (run.enemy === 'dwarf' ? Data.XP.raidWinDwarf : Data.XP.raidWin) : reason === 'retreat' ? Data.XP.retreat : 0)
      + (run.lootOpened && keepLoot ? Data.XP.loot : 0);
    const newLv = gainXp ? App.addXP(gainXp) : 0;
    if (gainXp) gained.push(`⭐ +${gainXp} XP`);
    if (newLv) gained.push(`🎉 <b>Level ${newLv}!</b> ${App.levelPerks(newLv)}`);
    const stars = [won, run.lootOpened, a.chest.alive];
    const title = won ? 'Victory!' : reason === 'retreat' ? 'You retreated' : 'Defeated!';
    const line = reason === 'win' ? `You broke their keep in <b>${run.moves}</b> moves — they had only reached ${Math.round(myDmg * 100)}% of yours.`
      : reason === 'lost' ? `${a.P.name} broke your keep after <b>${a.moves}</b> moves — before you broke theirs. They plundered your storehouse.`
      : reason === 'retreat' ? 'You slipped away with what you grabbed.'
      : `Time! You did ${Math.round(theirDmg * 100)}% damage to their keep, they did ${Math.round(myDmg * 100)}% to yours.`;
    App.choose({
      title,
      html: `<div class="stars">${stars.map(s => `<span class="${s ? '' : 'off'}">★</span>`).join('')}</div>
        <p>${line}</p>
        ${gained.length ? `<div class="sum-spoils"><b>Brought home</b><br>${gained.join('<br>')}</div>` : ''}
        ${lost.length ? `<div class="sum-spoils lost"><b>Lost</b><br>${lost.join('<br>')}</div>` : ''}
        <p class="sum-notes">★ win the race · ★ open their loot chest · ★ keep your own chest safe<br>
        Food spent: ${cfg.foodCost}${run.weaponsUsed ? ` · Weapon uses: ${run.weaponsUsed}` : ''}</p>`,
      buttons: [{ id: 'fortify', label: '🏰 Fortify my camp' }, { id: 'home', label: 'Home', cls: 'alt' }],
    }).then(c => App.go(c));
  }

  // ---------- public ----------
  function init() {
    board = new Board({
      rows: ROWS, cols: COLS, wrap: document.getElementById('battle-wrap'),
      randType: () => (Math.random() < STAR_CHANCE ? 'star' : pick(cfg.types)), hooks,
    });
    document.getElementById('battle-exit').onclick = () => {
      if (!run || run.ended || board.busy) return;
      finish(run.won ? 'home' : 'retreat');
    };
  }

  function start({ enemy = 'goblin', headStart = 0 } = {}) {
    cfg = CONFIG[enemy];
    document.getElementById('screen-battle').dataset.enemy = enemy;
    document.getElementById('b-title').textContent = `${cfg.icon} ${cfg.name}`;
    board.reset();
    board.setFrame(enemy);
    Art.setScene(enemy);
    run = {
      enemy, moves: 0, extraAi: 0, sinceEnemy: 0, keep: null, broken: [], gateOpen: false, rubbleSent: false,
      race: Camp.newAttack(enemy),
      bag: { spoils: [], specials: [] }, won: false, lootOpened: false, ended: false, weaponsUsed: 0, told: {},
    };
    const hidden = cfg.layout();
    for (let r = 0; r < FOG_ROWS; r++)
      for (let c = 0; c < COLS; c++)
        board.addPiece({ ...P.fog, hidden: hidden.get(`${r},${c}`) || null }, r, c);
    board.fillEmpty();
    board.renderWeapons(document.getElementById('battle-weapons'));
    board.render();
    board.scheduleHint();
    hud();
    Sound.music(enemy === 'dwarf' ? 'dwarf' : 'battle');
    run.race.skip += headStart;
    hud();
    board.toast(headStart ? `Siege Race! ${cfg.intro} (they start ${headStart} moves behind)` : `Siege Race! ${cfg.intro}`, '', 2600);
  }

  return { init, start, CONFIG, get board() { return board; }, get run() { return run; } };
})();
