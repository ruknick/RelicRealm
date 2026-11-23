// Side quests: small human stories from the people of Ashford. Each sends you to a land with its own
// board goal (find, hunt, rescue, clear, survive) or asks for something at a place (deliver, make, visit),
// and leaves something lasting behind. Up to three can be active; a ❗ on the map marks where to go.
window.Quests = (() => {
  const MAX_ACTIVE = 3;
  const st = () => App.state;
  const lv = () => App.level;
  const S = () => {
    const s = st();
    s.quests ||= {};
    const q = s.quests;
    q.on ||= {}; q.done ||= {}; q.seen ||= {}; q.got ||= {}; q.news ||= []; q.perks ||= {};
    return q;
  };
  const perk = k => !!(st() && st().quests && st().quests.perks && st().quests.perks[k]);
  const landLv = k => Data.landLevel(st().lands[k].runs);
  const LAND = { forest: 'Whispering Wood', mine: 'Iron Hills', ocean: 'Sunlit Coast', farm: 'Golden Fields' };
  const SPOT = { forest: 'Whispering Wood', mine: 'Iron Hills', ocean: 'Sunlit Coast', farm: 'Golden Fields', craft: 'Workshop', kitchen: 'Kitchen', camp: 'Your Camp', fair: 'Harvest Fair' };
  const nameOf = k => (Data.RESOURCES[k] ? Data.RESOURCES[k].label : Data.ITEMS[k] ? Data.ITEMS[k].name : k);
  const amt = k => (Data.RESOURCES[k] ? st().stockpile[k] || 0 : st().inventory[k] || 0);
  const costText = c => Object.entries(c).map(([k, n]) => `${n} ${nameOf(k)}`).join(' + ');
  const canPay = c => Object.entries(c).every(([k, n]) => amt(k) >= n);
  function pay(c) {
    Object.entries(c).forEach(([k, n]) => { if (Data.RESOURCES[k]) st().stockpile[k] -= n; else st().inventory[k] -= n; });
  }

  // ---------- the eight questlines ----------
  const QUESTS = [
    {
      id: 'tongs', who: 'bram', title: 'Bram\'s Lost Tongs', at: 'Workshop', opens: () => lv() >= 4,
      intro: ['Maren pulls you aside. "Bram won\'t ask, so I will. His tongs were his father\'s, and his father\'s before that. The night of the fire, goblins stripped the smithy for scrap and the tongs went with it."',
        '"He hasn\'t said a word about them. That\'s how I know it hurts."'],
      steps: [
        { type: 'find', land: 'forest', icon: '🔧', item: 'Bram\'s old tongs', text: 'Dig up Bram\'s tongs from a goblin scrap heap in the Whispering Wood',
          done: ['Bram turns the tongs over in his hands for a long time. "Still warm from Grandad\'s grip, I\'d swear it."', '"Fire\'s no good without fuel, mind. Bring me coal."'] },
        { type: 'deliver', spot: 'craft', cost: { coal: 10 }, text: 'Bring Bram 10 coal at the Workshop',
          done: ['"A smith without a fire is just a man with opinions."', '"Now. Let\'s see what your hands can do. Forge me a hammer, and I\'ll be watching."'] },
        { type: 'make', spot: 'craft', items: ['hammer1', 'hammer2', 'hammer3'], text: 'Forge a hammer at the Workshop, with Bram watching',
          done: ['He finds one flaw. Then he admits, grudgingly, that it\'s a good hammer.'] },
      ],
      ending: ['The next morning a thin girl called Nell is sweeping the smithy floor. "Needs teaching," Bram mutters, not looking at you.', 'Ashford\'s forge has an apprentice again.'],
      clue: 'Among the goblin scrap was a broken strongbox with a silver seal on the lid. It had been emptied long before the goblins found it.',
      reward: { label: 'Repairs at the Workshop cost half', give: p => { p.halfRepair = true; } },
    },
    {
      id: 'stew', who: 'maren', title: 'Maren\'s Lost Recipe', at: 'Kitchen', opens: () => lv() >= 6,
      intro: ['"Every winter feast, Ashford ate my Jory\'s stew. He\'s been gone three years now, and his recipe book burned with the inn."',
        '"I remember every ingredient but one. Help me put it back together? It starts with a Hale egg — the golden-yolked kind, from the old henhouse in the Fields."'],
      steps: [
        { type: 'find', land: 'farm', icon: '🥚', item: 'a golden-yolked Hale egg', text: 'Find a golden-yolked egg in the old Hale henhouse (Golden Fields)',
          done: ['"Jory swore by Hale eggs. Said the hens were happier."', '"Next, wild honey. From the hollow oak in the Wood. You\'ll know it — it\'s the one with the heart cut in the bark."'] },
        { type: 'find', land: 'forest', icon: '🍯', item: 'honey from the hollow oak', text: 'Find wild honey in the hollow oak where Jory proposed (Whispering Wood)',
          done: ['She goes quiet. Then she laughs. "He got stung. Twice. Proposed anyway."', '"Last, the fish. Jory only ever used one fish: the big silver salmon the fishers call Old Brass. He\'s broken every net on the coast."'] },
        { type: 'hunt', land: 'ocean', foe: { name: 'Old Brass', art: 'brass', icon: '🐟', hpMul: 1.8, weapon: 1 }, text: 'Land Old Brass, the net-breaking salmon (Sunlit Coast)',
          done: ['Wren whistles when she sees the size of him. "Thirty years he\'s been out there. Fair\'s fair, I suppose."', '"Bring the makings to the Kitchen," says Maren. "We\'ll cook it together."'] },
        { type: 'make', spot: 'kitchen', cost: { herring: 2, wheat: 2, egg: 1 }, text: 'Cook Jory\'s stew with Maren at the Kitchen',
          done: ['It tastes almost right. Almost. Then Wren leans over the pot and drops in a pinch of sea salt from her pocket.', 'Maren tastes it again and has to sit down.'] },
      ],
      ending: ['That night there\'s a supper in the half-built square. For the first time since the fire, the whole village eats at one long table.'],
      clue: 'An old villager at the supper remembers that the king\'s steward always ate alone, and "never once said thank you for a meal".',
      reward: { label: 'The Ashford Stew recipe (+14 ❤️ meal at the Kitchen)', give: p => { p.stew = true; } },
    },
    {
      id: 'tam', who: 'wren', title: 'The Boy on the Rocks', at: 'Sunlit Coast', opens: () => lv() >= 9,
      intro: ['Wren comes running up the beach, soaked to the knees. "It\'s Tam — my little brother. He\'s eleven and he thinks he\'s a man. He rowed out alone to fish the far rocks."',
        '"The tide\'s turned. And the crabs are coming up. Please."'],
      steps: [
        { type: 'rescue', land: 'ocean', who: 'Tam', moves: 15, text: 'Free Tam from the rocks within 15 moves (Sunlit Coast)',
          done: ['"I wasn\'t scared," Tam says, shaking. Wren hugs him hard enough to make him squeak.', 'He pulls a sealed bottle from his shirt. "Found it in the rocks. There\'s a letter in it — dwarf writing, I think."', 'It\'s a dwarf\'s complaint: a trader on the shore owes the hills for 40 bars of iron and never paid. Best take it to the Iron Hills, with a little goodwill.'] },
        { type: 'deliver', spot: 'mine', cost: { ironbar: 5 }, text: 'Take the bottle and 5 iron bars to the dwarves of the Iron Hills',
          done: ['The dwarves read it twice, then spit. "Silver-seal men. Thieves, the lot."'] },
      ],
      ending: ['Tam starts mending nets beside Wren. Every time you pass, he asks how many crabs you\'ve fought this week.', 'Wren ties a sailor\'s knot of blue cord around your wrist. "For luck. Don\'t take it off."'],
      clue: 'The trader who never paid signed for the iron with a silver seal.',
      reward: { label: 'Wren\'s lucky knot: +1 starting ⚡ on the Sunlit Coast', give: p => { p.knot = true; } },
    },
    {
      id: 'mill', who: 'agnes', title: 'The Miller\'s Ledger', at: 'Golden Fields', opens: () => lv() >= 11,
      intro: ['Agnes Hale ran Ashford\'s mill with her husband Will until the fire. Will didn\'t make it. She hasn\'t been inside the mill since.',
        '"Harvest\'s coming in," she says, "and there\'s nowhere to grind it. I can\'t do it alone. I can\'t even get through the gate — the thistles have choked the whole yard."'],
      steps: [
        { type: 'clear', land: 'farm', n: 8, text: 'Clear 8 thistles from the mill yard in one trip (Golden Fields)',
          done: ['Agnes watches from the gate. "Will kept this yard so neat."', '"His ledger\'s in there somewhere. Under the millstone, I think. It came down in the fire."'] },
        { type: 'find', land: 'farm', icon: '📒', art: 'page', item: 'Will Hale\'s ledger', text: 'Find Will\'s ledger under the fallen millstone (Golden Fields)',
          done: ['Agnes reads it standing up. Then she sits down, hard.', '"The gear-wheel\'s cracked clean through. Ask Bram for a new one — iron, mind, not that stone rubbish."'] },
        { type: 'make', spot: 'craft', cost: { ironbar: 4, oak: 2 }, text: 'Forge an iron gear-wheel for the mill at the Workshop',
          done: ['Bram helps, grudgingly. "Will Hale owed me two silver," he grumbles, hammering. "Never mind. Never mind."'] },
        { type: 'deliver', spot: 'farm', cost: { wheat: 20 }, text: 'Bring 20 wheat to the mill to grind the first sacks (Golden Fields)',
          done: ['The great wheel creaks, groans… and turns. Agnes laughs, for the first time anyone can remember.'] },
      ],
      ending: ['Will\'s ledger tells a strange story. The month before the fire, the king\'s steward bought every sack of Ashford grain at a third of the price, "for the royal stores".', 'He never came to collect it.'],
      clue: 'The steward was emptying Ashford before he burned it.',
      reward: { label: 'The mill turns: +4 backpack slots', give: p => { p.mill = true; } },
    },
    {
      id: 'pip', who: 'pip', title: 'The Goblin Who Wouldn\'t Fight', at: 'Whispering Wood',
      opens: () => landLv('forest') >= 20 && Story.ensure().flags && Story.ensure().flags.pip === 'spared',
      intro: ['Pip finds you at the edge of the wood, wringing his hands. "Not every goblin wanted the war, you know. My family didn\'t."',
        '"They\'re hiding in a hollow — Mum, my two sisters, Grandad with his cough. And a big goblin called Snag takes half of everything they find. \'For the King,\' he says. There\'s nothing left. Could you… bring them some bread?"'],
      steps: [
        { type: 'deliver', spot: 'forest', cost: { bread: 8 }, text: 'Bring 8 trail bread to Pip\'s family in the Whispering Wood',
          done: ['His smallest sister eats hers in four bites, then hides the crust "for later". Pip pretends not to see.', 'Then the bushes crash. "Snag!" Pip squeaks. "He\'s seen you. He\'ll be waiting in the wood."'] },
        { type: 'hunt', land: 'forest', foe: { name: 'Snag', art: 'gbrute', icon: '👺', hpMul: 2.2, cronies: 2 }, text: 'Beat Snag and his two cronies (Whispering Wood)',
          done: ['"Snag says no human comes into Snag\'s wood," Snag said. Snag was wrong.'] },
      ],
      ending: ['Pip\'s family move to the edge of the Golden Fields. Agnes, of all people, gives them work at the mill.', 'Some villagers grumble. Maren tells them to mind their manners.'],
      clue: 'Snag wore a cheap silver ring, "from the King\'s friend". It carries the same seal.',
      reward: { label: 'Pip scouts for you: one buried find shows on every Forest trip', give: p => { p.scout = true; } },
    },
    {
      id: 'letters', who: 'tobin', title: 'Letters Home', at: 'Your Camp', opens: () => lv() >= 14,
      intro: ['Old Tobin the ferryman carried Ashford\'s post before the fire. When he fled, his satchel of undelivered letters went into the river and came up who knows where.',
        '"Folk are still waiting on words that were already written," he says. "Six of them, there were. Scattered over the whole realm by now, I shouldn\'t wonder."'],
      steps: [
        { type: 'find', land: 'any', count: 6, icon: '✉️', art: 'page', item: 'a lost letter', text: 'Find Tobin\'s 6 lost letters, buried in any of the four lands',
          finds: ['A son promising to be home for the harvest.', 'A girl\'s first love letter. Badly spelled. Very sincere.', '"The debt is forgiven, Hal. Come for supper."', 'A recipe for plum jam, and a drawing of a cat.', '"I\'m sorry about the fence. I\'ll mend it Sunday."', 'An unsigned note in a very neat hand.'],
          done: ['That\'s the last of them. Better take them to Tobin at Your Camp.'] },
        { type: 'visit', spot: 'camp', text: 'Bring the letters to Tobin at Your Camp',
          done: ['Tobin reads each name aloud, slowly, and tells you who it was for — and whether they made it through the fire.'] },
      ],
      ending: ['Tobin delivers the letters door to door. One goes to a woman whose son wrote it the week before the fire.', 'She reads it on her doorstep and doesn\'t come in for an hour.', '"You can\'t eat a thank-you," Tobin says, "but somehow it fills you up."'],
      clue: 'The unsigned letter, in a neat hand, orders the summer vault\'s guards to stand down "on the night of the feast".',
      reward: { label: '+5 max health (Ashford\'s thanks)', give: p => { p.hp = (p.hp || 0) + 5; } },
    },
    {
      id: 'cards', who: 'ysolde', title: 'Madame Ysolde\'s Scattered Cards', at: 'Harvest Fair', opens: () => lv() >= 16,
      intro: ['Madame Ysolde\'s fortune deck was painted by her grandmother. When the fair\'s wagon overturned on the road to Ashford, four cards blew away.',
        '"The deck misses them," she says. You suspect she simply misses her grandmother. "One to each land, I feel. The deck feels these things."'],
      steps: [
        { type: 'find', land: 'forest', icon: '🃏', item: 'The Wanderer', text: 'Find the Wanderer card, tangled in the Whispering Wood', done: ['The Wanderer: a figure with a stick and a bundle, walking away from a burning town.'] },
        { type: 'find', land: 'mine', icon: '🃏', item: 'The Tower', text: 'Find the Tower card, wedged in the Iron Hills', done: ['"Ah. The Tower always hides somewhere hard."'] },
        { type: 'find', land: 'ocean', icon: '🃏', item: 'The Star', text: 'Find the Star card, washed up on the Sunlit Coast', done: ['The Star, a little salt-stained, but bright.'] },
        { type: 'find', land: 'farm', icon: '🃏', item: 'The Fool', text: 'Find the Fool card in the Golden Fields', done: ['"Of course the Fool was in the hay."'] },
      ],
      ending: ['Ysolde lays all four out for you: the Wanderer, the Tower, the Star, the Fool.', '"You," she says, tapping each in turn. "The hills. The sea. And a man who thought he was clever. Read it how you like."'],
      clue: 'The Fool card has a tiny silver seal painted in its corner, which wasn\'t there before. Ysolde won\'t say who painted it.',
      reward: { label: 'Fortune\'s charm: ★★★ trips open their reward chest twice', give: p => { p.fortune = true; } },
    },
    {
      id: 'oath', who: 'thrain', title: 'Thrain\'s Oath-Stone', at: 'Iron Hills', opens: () => lv() >= 22,
      intro: ['"Every clan keeps an oath-stone," Thrain says. "When we swear friendship, it\'s carried to the deepest hall. My clan has never sworn friendship with a surface-dweller."',
        '"I want to. The elders say a human could never survive the walk." He looks you up and down. "Prove them wrong. First, the stone\'s iron bands are rusted through — bring me steel."'],
      steps: [
        { type: 'deliver', spot: 'mine', cost: { steel: 6 }, text: 'Bring Thrain 6 steel bars in the Iron Hills',
          done: ['"No dwarf would walk an oath with a rusty stone." He bands it fresh, and hands it to you. It is extremely heavy.', '"Now carry it to the deep hall. Twenty moves. The goblins will come. Don\'t fall."'] },
        { type: 'survive', land: 'mine', moves: 20, text: 'Carry the oath-stone through 20 moves of the deep hills without collapsing',
          done: ['The elders mutter as you stagger in. One of them, very quietly, collects on a bet.'] },
      ],
      ending: ['In the deepest hall, Thrain sets the stone down and the elders sing, low and slow.', 'Nobody translates. You understand it anyway.'],
      clue: 'The elders\' song names the thief of the great hammer as "the Smiling Steward". Thrain goes very still.',
      reward: { label: '+5 max health and the title "Oath-friend of the Hills"', give: p => { p.hp = (p.hp || 0) + 5; p.title = 'Oath-friend of the Hills'; } },
    },
  ];
  const byId = id => QUESTS.find(q => q.id === id);
  const BOARD = ['find', 'hunt', 'rescue', 'clear', 'survive'];
  const active = () => QUESTS.filter(q => S().on[q.id] !== undefined);
  const stepOf = q => q.steps[S().on[q.id]];

  // Progress text for the current step: "2/6", "coal 4/10".
  function progress(q) {
    const s = stepOf(q);
    if (!s) return '';
    if (s.type === 'find' && s.count) return `${S().got[q.id] || 0}/${s.count}`;
    if (s.cost) return Object.entries(s.cost).map(([k, n]) => `${nameOf(k)} ${Math.min(amt(k), n)}/${n}`).join(' · ');
    return '';
  }

  // ---------- on a board ----------
  // The first active quest step that wants this land (letters take any land).
  function boardStep(land) {
    for (const q of active()) {
      const s = stepOf(q);
      if (s && BOARD.includes(s.type) && (s.land === land || s.land === 'any')) return { qid: q.id, q, step: s };
    }
    return null;
  }
  // A find was dug up. Returns what to celebrate.
  function found(qid) {
    const q = byId(qid), s = stepOf(q), Q = S();
    let sub = q.title;
    if (s.count) {
      Q.got[qid] = (Q.got[qid] || 0) + 1;
      const n = Q.got[qid];
      sub = `${s.finds ? s.finds[n - 1] + ' ' : ''}(${n}/${s.count})`;
      if (n >= s.count) advance(qid); else App.save();
    } else advance(qid);
    return { icon: s.icon, art: s.art, title: `${s.item[0].toUpperCase() + s.item.slice(1)}!`, sub };
  }
  // A step is done: the giver tells you about it when you're next on the map.
  function advance(qid) {
    const Q = S(), q = byId(qid), i = Q.on[qid];
    Q.got[qid] = 0;
    Q.news.push({ id: qid, step: i });
    if (i + 1 >= q.steps.length) {
      delete Q.on[qid];
      Q.done[qid] = true;
      q.reward.give(Q.perks);
    } else Q.on[qid] = i + 1;
    App.save();
  }
  function event(type, id) {
    active().forEach(q => { const s = stepOf(q); if (s && s.type === type && s.items && s.items.includes(id)) advance(q.id); });
  }

  // ---------- at a place: hand things over ----------
  async function handOver(q) {
    const s = stepOf(q);
    if (!s || !s.cost || !canPay(s.cost)) return false;
    pay(s.cost);
    advance(q.id);
    Sound.sfx('crafted');
    return true;
  }
  async function visit(spot) {
    if (!st().profile) return;
    for (const q of active()) {
      const s = stepOf(q);
      if (!s || s.spot !== spot) continue;
      if (s.type === 'visit') { advance(q.id); await playNews(); continue; }
      if (s.cost && canPay(s.cost)) {
        const c = await Lore.say({ who: q.who, title: `📜 ${q.title}`, lines: [s.text + '.', `<span class="reward">Hand over: <b>${costText(s.cost)}</b></span>`],
          buttons: [{ id: 'give', label: s.type === 'make' ? '🔨 Make it' : '🤝 Hand it over' }, { id: 'later', label: 'Not yet', cls: 'alt' }] });
        if (c === 'give' && await handOver(q)) await playNews();
      }
    }
  }

  // ---------- on the map: tell what happened, offer new quests ----------
  async function playNews() {
    const Q = S();
    while (Q.news.length) {
      const { id, step } = Q.news.shift();
      App.save();
      const q = byId(id), s = q.steps[step], last = step + 1 >= q.steps.length;
      const next = q.steps[step + 1];
      Sound.sfx(last ? 'victory' : 'rare');
      await Lore.say({ who: q.who, title: `${last ? '✓' : '📜'} ${q.title}`, lines: [...(s.done || []), ...(next ? [`<span class="q-next">Next: <b>${next.text}</b></span>`] : [])] });
      if (last) {
        await Lore.say({ who: q.who, title: `✓ ${q.title}`, lines: [...q.ending, `<span class="q-clue">🔍 ${q.clue}</span>`, `<span class="reward">Reward: <b>${q.reward.label}</b></span>`] });
        App.addXP(40 + 4 * lv());
      }
    }
  }
  async function check() {
    if (!st().profile) return;
    await playNews();
    const Q = S();
    const q = QUESTS.find(x => !Q.seen[x.id] && !Q.done[x.id] && Q.on[x.id] === undefined && x.opens());
    if (!q) return;
    Q.seen[q.id] = true;
    App.save();
    const full = active().length >= MAX_ACTIVE;
    const c = await Lore.say({ who: q.who, title: `❗ A new quest · ${q.title}`, lines: [...q.intro, `<span class="q-next">First: <b>${q.steps[0].text}</b></span>`, ...(full ? ['<small>You already have 3 quests. Finish one, then take this up from the Journal.</small>'] : [])],
      buttons: full ? [{ id: 'later', label: 'I\'ll come back' }] : [{ id: 'yes', label: '📜 I\'ll help' }, { id: 'later', label: 'Not now', cls: 'alt' }] });
    if (c === 'yes') accept(q.id);
  }
  function accept(id) {
    const Q = S();
    if (active().length >= MAX_ACTIVE || Q.done[id] || Q.on[id] !== undefined) return false;
    Q.on[id] = 0; Q.got[id] = 0; Q.seen[id] = true;
    App.save();
    Sound.sfx('reveal');
    return true;
  }

  // Map spots wanting you: lands for board steps; places when you can hand something over.
  function marks() {
    const out = new Set();
    if (!st() || !st().profile) return out;
    active().forEach(q => {
      const s = stepOf(q);
      if (!s) return;
      if (BOARD.includes(s.type)) (s.land === 'any' ? Object.keys(LAND) : [s.land]).forEach(k => out.add(k));
      else if (s.type === 'visit' || (s.cost && canPay(s.cost))) out.add(s.spot);
    });
    return out;
  }
  const where = s => (BOARD.includes(s.type) ? (s.land === 'any' ? 'any land' : LAND[s.land]) : SPOT[s.spot]);

  // ---------- the Journal's Quests tab ----------
  function journalHtml() {
    const Q = S(), on = active();
    const avail = QUESTS.filter(q => Q.seen[q.id] && !Q.done[q.id] && Q.on[q.id] === undefined);
    const done = QUESTS.filter(q => Q.done[q.id]);
    const pic = q => `<span class="remark-pic">${Lore.CAST[q.who].pic()}</span>`;
    const card = q => {
      const i = Q.on[q.id], s = stepOf(q), pr = progress(q);
      const ready = s.cost && canPay(s.cost);
      return `<div class="jchap jquest now"><div class="jc-title">📜 ${q.title}</div>
        <div class="jc-teller">${pic(q)}${Lore.CAST[q.who].name} · ${q.at}</div>
        <ul class="goals">${q.steps.map((x, n) => n < i ? `<li class="done">✓ ${x.text}</li>` : n === i ? `<li class="cur">▸ <b>${x.text}</b>${pr ? ` <small>${pr}</small>` : ''}<br><small>❗ ${where(x)}</small></li>` : '<li class="later">○ …</li>').join('')}</ul>
        ${s.cost ? `<button class="small${ready ? '' : ' alt'}" data-qgive="${q.id}" ${ready ? '' : 'disabled'}>${ready ? (s.type === 'make' ? '🔨 Make it now' : '🤝 Hand it over now') : `Need ${costText(s.cost)}`}</button>` : ''}
        <p class="reward">Reward: ${q.reward.label}</p></div>`;
    };
    const full = on.length >= MAX_ACTIVE;
    const locked = QUESTS.length - on.length - avail.length - done.length;
    return `<p class="tab-sub">Up to ${MAX_ACTIVE} quests at once. A ❗ on the map marks where the next step is.</p>
      ${on.length ? on.map(card).join('') : '<p class="hint">No quests on the go right now.</p>'}
      ${avail.length ? `<div class="tier-h">Waiting for you</div>${avail.map(q => `<div class="jchap jquest"><div class="jc-title">${q.title}</div><div class="jc-teller">${pic(q)}${Lore.CAST[q.who].name} · ${q.at}</div>
        <p class="story-text">${q.intro[0]}</p><button class="small" data-qtake="${q.id}" ${full ? 'disabled' : ''}>${full ? 'You have 3 quests already' : '📜 Take it up'}</button></div>`).join('')}` : ''}
      ${done.length ? `<div class="tier-h">Finished</div>${done.map(q => `<div class="jchap jquest done"><div class="jc-title">✓ ${q.title}</div><div class="jc-teller">${pic(q)}${Lore.CAST[q.who].name}</div>
        ${q.ending.map(l => `<p class="story-text outro">${l}</p>`).join('')}<p class="story-text q-clue">🔍 ${q.clue}</p><p class="reward">Earned: ${q.reward.label}</p></div>`).join('')}` : ''}
      ${locked > 0 ? `<p class="hint">${locked} more quest${locked > 1 ? 's' : ''} will find you as you and the lands grow.</p>` : ''}`;
  }
  function bind(el, rerender) {
    el.querySelectorAll('[data-qtake]').forEach(b => { b.onclick = () => { accept(b.dataset.qtake); rerender(); }; });
    el.querySelectorAll('[data-qgive]').forEach(b => { b.onclick = async () => { if (await handOver(byId(b.dataset.qgive))) { await playNews(); rerender(); } }; });
  }
  const count = () => `${active().length}/${MAX_ACTIVE}`;

  return { QUESTS, boardStep, found, advance, event, visit, check, accept, marks, journalHtml, bind, perk, count, progress, perks: () => S().perks };
})();
