// Goblin Village battle board: fog hides the village, goblins act every few moves.
window.Battle = (() => {
  // ---------- tuning knobs ----------
  const ROWS = 9;
  const COLS = 7;
  const FOG_ROWS = 4;           // top rows start hidden
  const MOVES = 20;
  const ENEMY_EVERY = 3;        // goblins act after this many of your moves
  const MAX_GOBLINS = 3;
  const FOOD_COST = 3;
  const TYPES = ['wood', 'stone', 'hide', 'berries', 'leaves'];   // battle tiles give nothing
  const STAR_CHANCE = 0.02;     // wild tile: completes any match

  const P = {
    fog:      { kind: 'fog',      label: '',        hp: 1 },
    keep:     { kind: 'keep',     label: 'KEEP',    hp: 5 },
    fence:    { kind: 'fence',    label: 'FENCE',   hp: 1 },
    tower:    { kind: 'tower',    label: 'TOWER',   hp: 2 },
    chest:    { kind: 'chest',    label: '',        hp: 1 },
    loot:     { kind: 'loot',     label: 'LOOT',    hp: 1 },
    prisoner: { kind: 'prisoner', label: 'PRISONER', hp: 1 },
    goblin:   { kind: 'goblin',   label: 'G',       hp: 1 },
    rubble:   { kind: 'rubble',   label: '',        hp: 1 },
  };
  const REVEAL_MSG = {
    fence: 'A goblin fence.',
    tower: 'A watchtower! It throws an extra spear every goblin turn.',
    chest: 'A buried chest! Match next to it to dig it up.',
    loot: 'The goblin loot chest! Open it for goblin spoils.',
    prisoner: 'A prisoner! Free them for +3 moves.',
  };

  let board = null;
  let run = null;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];

  // ---------- village layout (different every raid) ----------
  function makeLayout() {
    const hidden = new Map();
    const set = (r, c, k) => hidden.set(`${r},${c}`, k);
    [2, 3, 4].forEach(c => set(0, c, 'keep'));
    set(0, 1, 'fence');
    set(0, 5, 'fence');
    set(0, pick([0, 6]), 'tower');
    set(1, 1 + rnd(5), 'loot');
    const free = [];
    for (let r = 1; r < FOG_ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!hidden.has(`${r},${c}`)) free.push([r, c]);
    free.sort(() => Math.random() - 0.5);
    const extras = ['fence', 'trap', 'trap', 'chest'];
    if (Math.random() < 0.6) extras.push('prisoner');
    extras.forEach((k, i) => set(free[i][0], free[i][1], k));
    return hidden;
  }

  // ---------- HUD ----------
  function lootText() {
    const b = run.bag;
    const parts = ['wood', 'stone', 'hide', 'food', 'gold'].filter(t => b[t] > 0).map(t => `${b[t]} ${App.RESOURCES[t].label}`);
    run.bag.spoils.forEach(k => parts.push(App.spoilName(k)));
    return parts.length ? parts.join(', ') : 'nothing yet';
  }

  function hud() {
    document.getElementById('b-moves').textContent = run.moves;
    document.querySelector('#screen-battle .moves').classList.toggle('low', run.moves <= 5);
    const left = ENEMY_EVERY - run.sinceEnemy;
    document.getElementById('enemy').innerHTML = run.won
      ? '🏳️ Goblins fled'
      : `Goblins act in <b>${'●'.repeat(left)}${'○'.repeat(ENEMY_EVERY - left)}</b>`;
    document.getElementById('lootbar-text').textContent = lootText();
    const exit = document.getElementById('battle-exit');
    exit.textContent = run.won ? '🏠 Head home' : '🏳️ Retreat';
    exit.classList.toggle('danger', !run.won);
    exit.classList.toggle('glow', run.won);
    document.getElementById('battle-hint').textContent = board.armedHint() || (run.won
      ? 'Victory! Open the loot chest if you can, then head home.'
      : run.keep ? 'Match next to the KEEP to damage it. Goblins (G) repair it — knock them out.'
      : 'Match next to the fog (?) to scout. Find and break the KEEP to win.');
  }

  // ---------- pieces ----------
  function reveal(fog, src) {
    const k = fog.hidden;
    const { r, c } = fog;
    board.removePiece(fog, 'fog-out');
    Sound.sfx('reveal');
    if (!k) return;
    if (k === 'keep') {
      board.pieces.filter(p => p.kind === 'fog' && p.hidden === 'keep').forEach(f => board.removePiece(f, 'fog-out'));
      run.keep = board.addPiece(P.keep, 0, 2, 3, true);
      board.toast('The goblin keep! Break it to win.', 'alert', 2400);
      return;
    }
    if (k === 'trap') {
      if (src === 'match') {
        run.moves = Math.max(0, run.moves - 1);
        board.float([r, c], '−1 move', 'loss');
        board.toast('Hidden pit trap! You lose 1 move.', 'alert');
      } else {
        board.float([r, c], 'Trap disarmed', 'bonus');
      }
      return;
    }
    board.addPiece(P[k], r, c, 1, true);
    board.toast(REVEAL_MSG[k], k === 'tower' ? 'alert' : '', 2400);
  }

  function destroyed(p) {
    const cell = [p.r, p.c + Math.floor(p.w / 2)];
    switch (p.kind) {
      case 'keep': win(cell); break;
      case 'fence':
        run.brokenFences.push([p.r, p.c]);
        board.toast('Fence smashed!');
        break;
      case 'tower': board.toast('Watchtower down! No more extra spears.'); break;
      case 'goblin': board.float(cell, 'Goblin down!', 'bonus'); break;
      case 'prisoner':
        run.moves += 3;
        board.float(cell, '+3 moves', 'bonus');
        board.toast('Prisoner freed! They show you a shortcut: +3 moves.', 'win');
        break;
      case 'chest': {
        run.bag.gold += 2;
        board.float(cell, '+2 Gold', 'gold');
        for (let i = 0; i < 2; i++) {
          const t = pick(['wood', 'stone', 'hide']);
          run.bag[t]++;
          board.float(cell, `+1 ${App.RESOURCES[t].label}`, 'gain', 250 * (i + 1));
        }
        board.toast('Buried chest dug up!', 'win');
        break;
      }
      case 'loot': {
        const k = App.rollSpoil();
        run.bag.spoils.push(k);
        run.lootOpened = true;
        board.float(cell, 'Spoils!', 'gold');
        board.toast(`Loot chest: ${App.spoilName(k)}!`, 'win', 2600);
        break;
      }
      default: break;
    }
  }

  function win(cell) {
    run.won = true;
    Sound.sfx('victory');
    const k = App.rollSpoil();
    run.bag.spoils.push(k);
    run.bag.gold += 3;
    board.float(cell, '+3 Gold', 'gold');
    board.piecesOf('goblin').forEach(g => board.removePiece(g));
    board.toast(`Keep destroyed! The goblins flee! ${App.spoilName(k)}`, 'win', 3000);
  }

  // ---------- goblins' turn ----------
  async function act(a) {
    if (a === 'rebuild') {
      const spots = run.brokenFences.filter(([r, c]) => board.isTile(board.grid[r][c]));
      if (!spots.length) return;
      const [r, c] = pick(spots);
      run.brokenFences = run.brokenFences.filter(([a2, b2]) => a2 !== r || b2 !== c);
      board.addPiece(P.fence, r, c, 1, true);
      board.toast('Goblins rebuilt a fence!', 'alert');
    } else {
      const spots = board.tileCells(r => r >= 1);
      if (!spots.length) return;
      const [r, c] = pick(spots);
      if (a === 'spear') {
        board.addPiece(P.rubble, r, c, 1, true);
        board.float([r, c], '🗡️ Spear!', 'loss');
        board.toast('A spear lands and blocks a tile!', 'alert');
      } else {
        board.addPiece(P.goblin, r, c, 1, true);
        board.toast('A goblin sneaks in! It repairs the keep each goblin turn.', 'alert', 2400);
      }
    }
    board.render();
    await board.wait(750);
  }

  async function enemyTurn() {
    board.toast('Goblins\' turn!', 'alert', 1200);
    Sound.sfx('drums');
    await board.wait(700);
    const options = ['spear', 'sneak'];
    if (board.piecesOf('goblin').length >= MAX_GOBLINS) options.pop();
    if (run.brokenFences.some(([r, c]) => board.isTile(board.grid[r][c]))) options.push('rebuild', 'rebuild');
    await act(pick(options));
    if (board.piecesOf('tower').length) await act('spear');

    const gobs = board.piecesOf('goblin').length;
    const keep = run.keep;
    if (gobs && keep && !keep.gone && keep.hp < keep.maxHp) {
      const heal = Math.min(gobs, keep.maxHp - keep.hp);
      keep.hp += heal;
      board.renderPieces();
      board.float([0, 3], `+${heal} ♥`, 'loss');
      board.toast(`Goblins repair the keep (+${heal})!`, 'alert');
      await board.wait(800);
    }
    await board.ensurePlayable();
  }

  // ---------- board hooks ----------
  const hooks = {
    canPlay: () => !!run && !run.ended && run.moves > 0,
    onMove: () => { run.moves--; if (!run.won) run.sinceEnemy++; hud(); },
    onMatch(runs, step) { if (step === 2) board.toast('Chain reaction!'); },
    onPieceHit(p, n, src) {
      if (p.kind !== 'fog' && p.kind !== 'prisoner') run.attacked = true;
      if (p.kind === 'fog') reveal(p, src);
      else if (board.hurt(p, n)) destroyed(p);
      hud();
    },
    onPieceTap(p) {
      const msg = {
        fog: 'Fog — match next to it to see what\'s there.',
        keep: 'The keep. Match next to it to damage it.',
        goblin: 'A goblin! It repairs the keep. Match next to it.',
        rubble: 'A spear. Match next to it to clear it.',
      }[p.kind] || 'Match next to it to break it.';
      board.toast(msg);
    },
    onWeaponUsed: () => { run.weaponsUsed++; },
    onArm: () => hud(),
    async afterAction(wasMove) {
      hud();
      if (wasMove && !run.won && run.sinceEnemy >= ENEMY_EVERY && run.moves > 0) {
        run.sinceEnemy = 0;
        hud();
        await enemyTurn();
        hud();
      }
      if (run.moves <= 0 && !run.ended) {
        await board.wait(600);
        finish(run.won ? 'home' : 'lose');
      }
    },
  };

  // ---------- end of raid ----------
  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    const keepLoot = run.won || reason === 'retreat';
    const gained = [];
    if (keepLoot) {
      ['wood', 'stone', 'hide', 'food', 'gold'].forEach(t => {
        if (run.bag[t]) { App.state.stockpile[t] += run.bag[t]; gained.push(`+${run.bag[t]} ${App.RESOURCES[t].label}`); }
      });
      run.bag.spoils.forEach(k => gained.push(App.grantSpoil(k)));
      App.save();
    }
    const stars = [run.lootOpened, run.won, run.lootOpened && run.won && run.moves > 0];
    const title = run.won ? 'Victory!' : reason === 'retreat' ? 'You retreated' : 'Defeated!';
    const line = run.won ? 'The goblin keep has fallen.'
      : reason === 'retreat' ? 'You slipped away with what you grabbed.'
      : 'Out of moves. The goblins drove you off — you lost what you grabbed.';
    App.choose({
      title,
      html: `<div class="stars">${stars.map(s => `<span class="${s ? '' : 'off'}">★</span>`).join('')}</div>
        <p>${line}</p>
        ${gained.length ? `<div class="sum-spoils"><b>Brought home</b><br>${gained.join('<br>')}</div>` : ''}
        <p class="sum-notes">★ open the loot chest · ★ break the keep · ★ both, with moves left<br>
        Food spent: ${FOOD_COST}${run.weaponsUsed ? ` · Weapons used: ${run.weaponsUsed}` : ''}</p>`,
      buttons: [{ id: 'home', label: 'Home' }, { id: 'forest', label: 'Go gather', cls: 'alt' }],
    }).then(c => App.go(c));
  }

  // ---------- public ----------
  function init() {
    board = new Board({ rows: ROWS, cols: COLS, wrap: document.getElementById('battle-wrap'), randType: () => (Math.random() < STAR_CHANCE ? 'star' : pick(TYPES)), hooks });
    document.getElementById('battle-exit').onclick = () => {
      if (!run || run.ended || board.busy) return;
      finish(run.won ? 'home' : 'retreat');
    };
  }

  function start({ drum = false } = {}) {
    board.reset();
    run = {
      moves: MOVES + (drum ? 3 : 0), sinceEnemy: 0, keep: null, brokenFences: [],
      bag: { wood: 0, stone: 0, hide: 0, food: 0, gold: 0, spoils: [] },
      won: false, lootOpened: false, attacked: false, ended: false, weaponsUsed: 0,
    };
    const hidden = makeLayout();
    for (let r = 0; r < FOG_ROWS; r++)
      for (let c = 0; c < COLS; c++)
        board.addPiece({ ...P.fog, hidden: hidden.get(`${r},${c}`) || null }, r, c);
    board.fillEmpty();
    board.renderWeapons(document.getElementById('battle-weapons'));
    board.render();
    board.scheduleHint();
    hud();
    Sound.music('battle');
    board.toast(drum ? '🥁 The war drum rallies you: +3 moves!' : 'The village lies in the fog ahead…', '', 2400);
  }

  return { init, start, FOOD_COST, get board() { return board; }, get run() { return run; } };
})();
