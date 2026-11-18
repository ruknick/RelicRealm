// The bounty board at your camp: three jobs at a time. Finish one, claim the reward, and a new one is posted.
window.Bounty = (() => {
  const st = () => App.state;
  const rnd = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
  const marked = e => st().marked[e] > 0 || st().enemyWins[e] > 0;

  // Every kind of job the board can post, and when it makes sense to post it.
  const JOBS = [
    { id: 'kill:forest', icon: `<span class="ico">${Art.piece('goblin')}</span>`, need: [4, 8], text: n => `Slay ${n} goblin raiders in the Forest` },
    { id: 'kill:mine', icon: '👹', need: [4, 7], text: n => `Slay ${n} cave goblins in the Iron Hills` },
    { id: 'kill:farm', icon: '🐔', need: [3, 6], text: n => `Catch ${n} chickens in the Golden Fields` },
    { id: 'trip:farm', icon: '🌾', need: [2, 3], text: n => `Gather in the Golden Fields ${n} times` },
    { id: 'kill:ocean', icon: '🦀', need: [3, 6], text: n => `Drive off ${n} shore crabs on the Coast` },
    { id: 'trip:forest', icon: '🌲', need: [2, 3], text: n => `Gather in the Forest ${n} times` },
    { id: 'trip:mine', icon: '⛏️', need: [2, 3], text: n => `Gather in the Iron Hills ${n} times` },
    { id: 'trip:ocean', icon: '🌊', need: [2, 3], text: n => `Gather on the Sunlit Coast ${n} times` },
    { id: 'smelt:leather', icon: '🟫', need: [3, 6], text: n => `Tan ${n} leather` },
    { id: 'smelt:ironbar', icon: '▬', need: [4, 8], text: n => `Smelt ${n} iron bars`, ok: () => st().stations.smelter },
    { id: 'smelt:steel', icon: '🔩', need: [2, 4], text: n => `Forge ${n} steel bars`, ok: () => st().stations.dforge },
    { id: 'raid:goblin', icon: '🔥', need: [1, 1], text: () => 'Win a raid on a goblin village', ok: () => marked('goblin') },
    { id: 'raid:dwarf', icon: '⚒️', need: [1, 1], text: () => 'Win a raid on a dwarf stronghold', ok: () => marked('dwarf') },
    { id: 'boss:warchief', icon: `<span class="ico">${Art.piece('goblin')}</span>`, need: [1, 1], text: () => 'Defeat Grak the Goblin Warchief', ok: () => Boss.unlocked('warchief') },
    { id: 'boss:golem', icon: '🗿', need: [1, 1], text: () => 'Defeat the Stone Golem', ok: () => Boss.unlocked('golem') },
    { id: 'boss:siren', icon: '🧜‍♀️', need: [1, 1], text: () => 'Defeat the Siren Queen', ok: () => Boss.unlocked('siren') },
  ];
  const BONUS = ['key', 'bread', 'chowder', 'flask'];

  function post(exclude) {
    const L = App.level;
    const pool = JOBS.filter(j => !exclude.includes(j.id) && (!j.ok || j.ok()));
    const j = pool[Math.floor(Math.random() * pool.length)];
    const need = rnd(j.need), big = j.id.startsWith('boss') || j.id.startsWith('raid');
    return {
      id: j.id, need, have: 0,
      reward: { gold: (big ? 20 : 4 * need) + Math.floor(L / 2), xp: (big ? 60 : 12 * need) + L * 2, item: Math.random() < (big ? 0.8 : 0.35) ? BONUS[Math.floor(Math.random() * BONUS.length)] : null },
    };
  }
  function ensure() {
    const s = st();
    s.bounties = (s.bounties || []).filter(b => JOBS.some(j => j.id === b.id));
    while (s.bounties.length < 3) s.bounties.push(post(s.bounties.map(b => b.id)));
    return s.bounties;
  }

  // Something happened in the world that a bounty might be waiting for.
  function event(id, n = 1) {
    let hit = false;
    ensure().forEach(b => { if (b.id === id && b.have < b.need) { b.have = Math.min(b.need, b.have + n); hit = true; } });
    if (hit) App.save();
  }

  const ready = () => ensure().filter(b => b.have >= b.need).length;
  const job = b => JOBS.find(j => j.id === b.id);
  const rewardText = r => `${r.gold} gold · ${r.xp} XP${r.item ? ` · ${Data.ITEMS[r.item].icon} ${Data.ITEMS[r.item].name}` : ''}`;

  async function open(note = '') {
    const list = ensure();
    const html = list.map(b => {
      const j = job(b), done = b.have >= b.need;
      return `<div class="bounty${done ? ' done' : ''}"><span class="bt-icon">${j.icon}</span><span class="bt-body"><b>${j.text(b.need)}</b>
        <span class="bt-bar"><i style="width:${b.have / b.need * 100}%"></i></span><small>${b.have}/${b.need} · ${rewardText(b.reward)}</small></span></div>`;
    }).join('');
    const buttons = list.map((b, i) => ({ b, i })).filter(({ b }) => b.have >= b.need)
      .map(({ b, i }) => ({ id: `claim${i}`, label: `✓ Claim: ${job(b).text(b.need)}` }));
    buttons.push({ id: 'close', label: 'Close', cls: 'alt' });
    const c = await App.choose({ title: '📋 Bounty board', html: `${note ? `<p class="reward">${note}</p>` : ''}<p class="hint">Jobs posted at your camp. Finish one to claim its reward — a new one goes up in its place.</p>${html}`, buttons });
    if (c.startsWith('claim')) return open(claim(+c.slice(5)));
    World.render();
  }
  function claim(i) {
    const s = st(), b = s.bounties[i];
    if (!b || b.have < b.need) return;
    s.stockpile.gold += b.reward.gold;
    if (b.reward.item) s.inventory[b.reward.item] = (s.inventory[b.reward.item] || 0) + 1;
    s.bounties.splice(i, 1);
    ensure();
    App.save();
    Sound.sfx('coin');
    const lv = App.addXP(b.reward.xp);
    return `✓ Claimed: ${rewardText(b.reward)}${lv ? ` — ⭐ <b>Level ${lv}!</b> ${App.levelPerks(lv)}` : ''}`;
  }

  function banner() {
    if (!App.state.profile) return '';
    const n = ready();
    return `<button class="quest-banner bounty-banner" id="bounty-banner"><span>📋 Bounty board</span><small>${n ? `<b>${n} ready to claim!</b>` : ensure().map(b => `${job(b).icon} ${b.have}/${b.need}`).join(' · ')}</small></button>`;
  }

  return { event, open, banner, ensure };
})();
