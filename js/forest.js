// Forest: gathering board. Fresh goblin tracks sometimes appear and lead to a village.
window.Forest = (() => {
  // ---------- tuning knobs ----------
  const SIZE = 7;
  const MOVES = 20;
  const BACKPACK = 15;
  const GOLD_CHANCE = 0.02;
  // Spawn weights (gold rolled separately). Berries become food.
  const TILE_WEIGHTS = { wood: 12, stone: 12, hide: 12, berries: 14, leaves: 25, mushroom: 25 };
  const GIVES = { wood: 'wood', stone: 'stone', hide: 'hide', berries: 'food', gold: 'gold' };
  const TRACKS_AFTER = 2;        // earliest move tracks can appear
  const TRACKS_CHANCE = 0.05;    // per move → shows up in roughly 3 of 5 runs
  const points = len => (len >= 5 ? 3 : len === 4 ? 2 : 1);   // +1 more on chain reactions

  const BAG = ['wood', 'stone', 'hide', 'food', 'gold'];
  const TRACKS = { kind: 'tracks', label: '🐾', hp: 1 };
  const WEIGHT_TOTAL = Object.values(TILE_WEIGHTS).reduce((a, b) => a + b, 0);

  let board = null;
  let run = null;

  const label = t => App.RESOURCES[t].label;
  const bagTotal = () => BAG.reduce((s, t) => s + run.backpack[t], 0);
  const zero = () => Object.fromEntries(BAG.map(t => [t, 0]));

  function randType() {
    if (Math.random() < GOLD_CHANCE) return 'gold';
    let roll = Math.random() * WEIGHT_TOTAL;
    for (const [type, w] of Object.entries(TILE_WEIGHTS)) if ((roll -= w) < 0) return type;
    return 'leaves';
  }

  // ---------- backpack ----------
  function addToBackpack(type, n, cell, delay = 0) {
    const add = Math.min(n, BACKPACK - bagTotal());
    if (add > 0) {
      run.backpack[type] += add;
      board.float(cell, `+${add} ${label(type)}`, type === 'gold' ? 'gold' : 'gain', delay);
    }
    if (add < n) {
      run.overflow += n - add;
      if (add === 0) board.float(cell, 'Full!', 'loss', delay);
    }
    if (bagTotal() >= BACKPACK && !run.fullWarned) {
      run.fullWarned = true;
      board.toast('Backpack full! Head home when you\'re ready.', 'win', 2600);
    }
    hud();
  }

  // ---------- HUD ----------
  function hud() {
    document.getElementById('f-moves').textContent = run.moves;
    document.querySelector('#screen-forest .moves').classList.toggle('low', run.moves <= 5);
    BAG.forEach(t => { document.getElementById('bp-' + t).textContent = run.backpack[t]; });
    document.getElementById('bp-total').textContent = bagTotal();
    document.getElementById('backpack').classList.toggle('full', bagTotal() >= BACKPACK);
    document.getElementById('forest-exit').classList.toggle('glow', run.fullWarned);
    document.getElementById('forest-hint').textContent = board.armedHint() ||
      (board.piecesOf('tracks').length
        ? '🐾 Match next to the tracks to follow them.'
        : 'Match 3+ to gather. Berries are food — you need food to raid.');
  }

  // ---------- tracks → village discovery ----------
  function spawnTracks() {
    const spots = board.tileCells((r, c) => r >= 1 && r <= 4 && c >= 1 && c <= 5);
    if (!spots.length) return;
    const [r, c] = spots[Math.floor(Math.random() * spots.length)];
    board.addPiece(TRACKS, r, c, 1, true);
    run.tracksSpawned = true;
    board.render();
    board.toast('🐾 Fresh goblin tracks! Match next to them to follow.', 'alert', 2600);
    hud();
  }

  async function discover() {
    board.smoke();
    board.toast('Smoke rises through the trees…', 'alert', 2200);
    await board.wait(1400);
    const food = App.state.stockpile.food + run.backpack.food;
    const canRaid = food >= Battle.FOOD_COST;
    const choice = await App.choose({
      title: '🔥 A goblin village!',
      html: `<p>You followed the tracks to a goblin village hidden in the trees.</p>
             <p>Raiding costs <b>${Battle.FOOD_COST} food</b> — you have <b>${food}</b>.</p>
             ${canRaid ? '' : '<p class="hint">Not enough food to raid now. Mark it and come back.</p>'}`,
      buttons: [
        { id: 'raid', label: '⚔️ Raid now', cls: 'danger', disabled: !canRaid },
        { id: 'mark', label: '📍 Mark it on the map' },
        { id: 'ignore', label: 'Keep gathering', cls: 'alt' },
      ],
    });
    if (choice === 'raid') {
      finish('raid');
    } else if (choice === 'mark') {
      App.state.marked++;
      App.save();
      run.marked = true;
      board.toast('📍 Village marked. Raid it from home.', 'win');
    }
  }

  // ---------- board hooks ----------
  const hooks = {
    canPlay: () => !!run && !run.ended && run.moves > 0,
    onMove: () => { run.moves--; run.movesMade++; hud(); },
    onMatch(runs, step) {
      if (step === 2) board.toast('Chain reaction! +1 per match');
      for (const ri of runs) {
        const res = GIVES[ri.type];
        if (!res) continue;   // leaves & mushrooms: filler
        addToBackpack(res, points(ri.cells.length) + (step > 1 ? 1 : 0), ri.cells[Math.floor(ri.cells.length / 2)]);
      }
    },
    onPieceHit(p, n) {
      if (p.kind === 'tracks' && board.hurt(p, n)) run.followed = true;
    },
    onPieceTap() { board.toast('Match next to the tracks to follow them.'); },
    onArm: () => hud(),
    async afterAction(wasMove) {
      if (run.followed && !run.discovered) {
        run.discovered = true;
        await discover();
        if (run.ended) return;
      }
      if (wasMove && !run.tracksSpawned && run.movesMade >= TRACKS_AFTER && Math.random() < TRACKS_CHANCE) {
        spawnTracks();
      }
      hud();
      if (run.moves <= 0 && !run.ended) {
        await board.wait(500);
        finish('moves');
      }
    },
  };

  // ---------- end of run ----------
  function finish(reason) {
    if (run.ended) return;
    run.ended = true;
    board.stop();
    BAG.forEach(t => { App.state.stockpile[t] += run.backpack[t]; });
    App.save();

    if (reason === 'raid') {
      App.prepareRaid({ fromForest: true });
      return;
    }
    const rows = BAG.map(t => `<tr><td>${label(t)}</td><td class="${run.backpack[t] ? 'pos' : ''}">+${run.backpack[t]}</td></tr>`).join('');
    const notes = [];
    if (run.marked) notes.push('📍 You marked a goblin village on your map.');
    else if (run.tracksSpawned && !run.discovered) notes.push('🐾 You left some goblin tracks unexplored…');
    if (run.overflow) notes.push(`${run.overflow} more didn't fit in your backpack.`);
    App.choose({
      title: reason === 'moves' ? 'Out of moves' : 'Back home safe',
      html: `<table class="sum-table"><thead><tr><th></th><th>Banked</th></tr></thead><tbody>${rows}</tbody></table>
             ${notes.length ? `<p class="sum-notes">${notes.join('<br>')}</p>` : ''}`,
      buttons: [{ id: 'again', label: 'Gather again' }, { id: 'home', label: 'Home', cls: 'alt' }],
    }).then(c => App.go(c === 'again' ? 'forest' : 'home'));
  }

  // ---------- public ----------
  function init() {
    board = new Board({ rows: SIZE, cols: SIZE, wrap: document.getElementById('forest-wrap'), randType, hooks });
    document.getElementById('forest-exit').onclick = () => {
      if (!run || run.ended || board.busy) return;
      finish('home');
    };
    document.getElementById('bp-cap').textContent = BACKPACK;
  }

  function start() {
    board.reset();
    run = {
      moves: MOVES, movesMade: 0, backpack: zero(), overflow: 0, fullWarned: false,
      tracksSpawned: false, followed: false, discovered: false, marked: false, ended: false,
    };
    board.fillEmpty();
    board.renderWeapons(document.getElementById('forest-weapons'));
    board.render();
    hud();
    if (App.state.debug.tracksNow) spawnTracks();
    else board.toast(`Into the forest… carry up to ${BACKPACK} resources home.`);
  }

  return { init, start, get board() { return board; }, get run() { return run; } };
})();
