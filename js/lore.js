// Lore: the people of the story and how the tale is told while you play.
// Dialogue cards (a portrait + a few lines, sometimes a choice), story panels at the big turning points,
// tales of each land every 5 land levels, the Old King's lost diary pages, boss lines, and the
// remarks Bram and Maren make at the Workshop and the Kitchen. The Journal reads it all back.
window.Lore = (() => {
  const st = () => App.state;
  const S = () => Story.ensure();
  const name = () => (st().profile && st().profile.name) || 'Warrior';
  const fill = t => t.replace(/\{name\}/g, name());

  // ---------- the cast ----------
  // Townsfolk are drawn with the same ink figure as your warrior (head and shoulders); others use their own art.
  const head = (look, flair) => Hero.figure({ look, plain: true, flair: flair || {} }).replace(/viewBox="[^"]*"/, 'viewBox="48 -6 64 64"');
  const BOOK = '<svg viewBox="0 0 64 64"><path d="M10 14q11-5 22 1 11-6 22-1v38q-11-5-22 1-11-6-22-1z" fill="#f3e2b8" stroke="#2b1b0d" stroke-width="2" stroke-linejoin="round"/><path d="M32 15v38" stroke="#2b1b0d" stroke-width="1.6"/><path d="M15 22q7-2 13 1M15 28q7-2 13 1M15 34q7-2 13 1M36 23q7-3 13-1M36 29q7-3 13-1M36 35q7-3 13-1" stroke="#8a6a3a" stroke-width="1.2" fill="none"/><path d="M45 12v14l3-3 3 3V12" fill="#c0392b" stroke="#2b1b0d" stroke-width="1"/></svg>';
  // Boss art is drawn wide (192×128): zoom the portrait onto its face.
  const bossPic = (k, vb = '44 -2 104 104') => Art.piece(k).replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
  const CAST = {
    maren:  { name: 'Old Maren', role: 'Ashford\'s elder and cook — she keeps the village fed and the story straight.', pic: () => head({ skin: '#e0b089', hair: '#d9d9d9', style: 'tied', beard: 'none' }, { hat: 'chef' }) },
    bram:   { name: 'Bram the Smith', role: 'He lost his forge in the fire. Gruff, few words, proud of you (secretly).', pic: () => head({ skin: '#c68b5e', hair: '#5a3a1e', style: 'bald', beard: 'full' }) },
    thrain: { name: 'Thrain Ironbeard', role: 'Dwarf captain of the Iron Hills. Enemy, then ally. Teaches the way of steel.', pic: () => Art.piece('guard') },
    pip:    { name: 'Pip', role: 'A young goblin scout — nervous, chatty, and terrible at keeping secrets.', pic: () => Art.piece('goblin') },
    wren:   { name: 'Wren', role: 'A fisher-girl of the Sunlit Coast who dreams of the open sea.', pic: () => head({ skin: '#f3cfb0', hair: '#b03a1e', style: 'long', beard: 'none' }, { hat: 'featheredcap' }) },
    agnes:  { name: 'Agnes Hale', role: 'The miller\'s widow of the Golden Fields. Sharp-tongued, kind underneath, grieving.', pic: () => head({ skin: '#f3cfb0', hair: '#d9d9d9', style: 'tied', beard: 'none' }) },
    tobin:  { name: 'Old Tobin', role: 'The ferryman who carried Ashford\'s post. Knows every name in the village.', pic: () => head({ skin: '#c68b5e', hair: '#d9d9d9', style: 'bald', beard: 'full' }) },
    ysolde: { name: 'Madame Ysolde', role: 'The fortune teller at the Harvest Fair. Right more often than is comfortable.', pic: () => head({ skin: '#c68b5e', hair: '#2a1a10', style: 'long', beard: 'none' }, { hat: 'wizard' }) },
    journal: { name: 'The Old King\'s diary', role: 'Torn pages of the Old King\'s own diary, scattered across the realm. They tell what really happened.', pic: () => BOOK },
    // the bosses speak too
    warchief: { name: 'Grak the Warchief', role: 'A bully who thinks he is in charge.', pic: () => bossPic('warchief', '48 0 96 96') },
    golem: { name: 'The Stone Golem', role: 'The dwarves\' guardian of the hammer vault.', pic: () => bossPic('golem', '48 -4 96 96') },
    kingcrab: { name: 'The King Crab', role: 'A vain old monarch of the shore.', pic: () => bossPic('kingcrab', '48 4 96 96') },
    goblinking: { name: 'The Goblin King', role: 'Shrewd and greedy — and furious that he was used.', pic: () => bossPic('goblinking', '52 6 88 88') },
    dwarfking: { name: 'The Dwarf King', role: 'He chose gold over honour, and he knows it.', pic: () => bossPic('dwarfking', '52 4 88 88') },
    dragon: { name: 'Emberwyrm', role: 'Ancient, weary, and chained. Not evil — enslaved.', pic: () => bossPic('dragon', '40 -8 112 112') },
  };
  const meet = who => { const s = S(); s.met ||= {}; if (CAST[who] && !s.met[who]) { s.met[who] = true; App.save(); } };

  // ---------- a dialogue card: portrait, name, a few lines, then Continue (or a choice) ----------
  let talkEl = null, hideT = 0;
  function say({ who, title, lines, buttons }) {
    const c = CAST[who] || CAST.maren;
    meet(who);
    talkEl ||= document.body.appendChild(Object.assign(document.createElement('div'), { id: 'talk', className: 'talk hidden' }));
    const btns = buttons && buttons.length ? buttons : [{ id: 'ok', label: 'Continue' }];
    talkEl.innerHTML = `<div class="talk-card">
        ${title ? `<div class="talk-title">${fill(title)}</div>` : ''}
        <div class="talk-who"><span class="talk-pic">${c.pic()}</span><b>${c.name}</b></div>
        <div class="talk-lines">${lines.map(l => `<p>${fill(l)}</p>`).join('')}</div>
        <div class="talk-btns">${btns.map(b => `<button class="big ${b.cls || ''}" data-id="${b.id}">${b.label}</button>`).join('')}</div>
      </div>`;
    clearTimeout(hideT);   // a card closing a moment ago must not hide this one
    talkEl.classList.remove('hidden');
    void talkEl.offsetWidth;
    talkEl.classList.add('show');
    return new Promise(res => talkEl.querySelectorAll('[data-id]').forEach(b => { b.onclick = () => {
      talkEl.classList.remove('show');
      hideT = setTimeout(() => talkEl.classList.add('hidden'), 200);
      Sound.sfx('tick');
      res(b.dataset.id);
    }; }));
  }

  // ---------- full-screen story panels for the turning points ----------
  const CROWN = (gap = false) => `<svg viewBox="0 0 120 90"><path d="M14 74V26l22 22 24-36 24 36 22-22v48z" fill="#f3c34a" stroke="#5a3a08" stroke-width="3" stroke-linejoin="round"/><path d="M14 64h92" stroke="#c0392b" stroke-width="5"/>${[[36, 56, '#2fbf71'], [60, 50, gap ? 'none' : '#e0324b'], [84, 56, '#3d7bff'], [24, 68, '#8e44ad'], [96, 68, '#f3f3f3']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="#5a3a08" stroke-width="2" ${c === 'none' ? 'stroke-dasharray="3 3"' : ''}/>`).join('')}</svg>`;
  const BELL = '<svg viewBox="0 0 100 100"><path d="M50 8v8" stroke="#5a3a08" stroke-width="4"/><path d="M50 16c-18 0-24 16-24 34 0 14-6 18-12 24h72c-6-6-12-10-12-24 0-18-6-34-24-34z" fill="#c9a24a" stroke="#5a3a08" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="82" r="7" fill="#8a6a2a" stroke="#5a3a08" stroke-width="2"/><path d="M36 40q4-12 12-14" stroke="#fff6c8" stroke-width="3" fill="none" opacity=".7"/><text x="50" y="62" text-anchor="middle" font-family="Georgia" font-size="13" font-style="italic" fill="#5a3a08">M.</text></svg>';
  const SHIP = '<svg viewBox="0 0 120 90"><path d="M8 70c20 8 84 8 104 0" stroke="#2f5a66" stroke-width="3" fill="none"/><path d="M22 60h76l-10 12H32z" fill="#7a5a3a" stroke="#2b1b0d" stroke-width="2"/><path d="M60 60V12" stroke="#2b1b0d" stroke-width="3"/><path d="M62 14c22 12 22 32 0 42z" fill="#e8eef2" stroke="#2b1b0d" stroke-width="2"/><path d="M58 18c-16 10-16 26 0 36z" fill="#d8dfe4" stroke="#2b1b0d" stroke-width="2"/><circle cx="100" cy="22" r="8" fill="#f3d36a"/></svg>';
  const VILLAGE = '<svg viewBox="0 0 140 90"><path d="M0 84h140" stroke="#5a3a1e" stroke-width="2"/>'
    + [[14, 52, 30], [52, 44, 36], [96, 54, 30]].map(([x, y, w]) => `<path d="M${x} 84V${y + 12}l${w / 2} -14 ${w / 2} 14V84z" fill="#6b4a2a" stroke="#2b1b0d" stroke-width="1.6"/><path d="M${x + w / 2 - 4} 84v-10h8v10" fill="#2b1b0d"/>`).join('')
    + '<g class="flames"><path d="M24 58c-6-12 4-16 2-26 10 8 12 16 8 26z" fill="#e0602a"/><path d="M62 50c-8-16 6-22 2-34 12 10 16 22 10 34z" fill="#ffb02e"/><path d="M68 52c-3-8 3-10 2-16 6 5 7 10 4 16z" fill="#ffd166"/><path d="M106 60c-5-10 3-13 2-21 8 6 10 13 6 21z" fill="#e0602a"/></g>'
    + '<g fill="#5a5048" opacity=".55"><circle cx="60" cy="10" r="8"/><circle cx="72" cy="6" r="10"/><circle cx="30" cy="22" r="7"/><circle cx="104" cy="26" r="7"/></g></svg>';
  const ART = { crown: () => CROWN(false), dragon: () => Art.piece('dragon'), village: () => VILLAGE, hero: () => Hero.figure() };
  const PANELS = {
    bell: { art: () => BELL, title: 'The Stolen Bell', text: 'Ashford\'s church bell, dragged into a goblin keep. Scratched inside, in a neat hand: "For services rendered. — M." Goblins can\'t write.' },
    oath: { art: () => Art.piece('guard'), title: 'The Dwarves\' Oath', text: 'Thrain Ironbeard kneels on the cold stone of his hall. "We were lied to, surface-dweller. Take the way of steel — and find the one who lied."' },
    kings: { art: () => `<div class="panel-pair">${Art.piece('goblinking')}${Art.piece('dwarfking')}</div>`, title: 'Two Kings, One Seal', text: 'Two letters, one from each fallen king\'s hall, laid side by side. The same silver seal. The same neat hand. The same signature: M.' },
    crown: { art: () => CROWN(true), title: 'The Crown Re-forged', text: 'Five shards blaze in a circle of new gold, and the realm seems to breathe again. But one small socket stays empty — the sliver that once kept the dragon asleep.' },
    chain: { art: () => Art.piece('dragon'), title: 'The Chain Breaks', text: 'The last link of Emberwyrm\'s chain snaps. The dragon rises, free, into the smoke — and the broken link falls into your hand. Stamped on it: the steward\'s silver seal.' },
    beyond: { art: () => SHIP, title: 'Beyond the Map', text: 'Dawn on the Sunlit Coast. Wren checks the rigging, the King\'s journal lies open on your knee, and far out on the horizon a silver sail catches the light.' },
  };
  function panel(key) {
    const p = PANELS[key];
    const el = document.getElementById('story');
    S().panels ||= {}; S().panels[key] = true; App.save();
    el.innerHTML = `<div class="story-panel"><div class="story-art lore-art">${p.art()}</div><h2>${fill(p.title)}</h2><p>${fill(p.text)}</p><button class="big" id="s-next">Continue</button></div>`;
    el.classList.remove('hidden');
    Sound.sfx('reveal');
    return new Promise(res => { document.getElementById('s-next').onclick = () => { el.classList.add('hidden'); res(); }; });
  }

  // ---------- tales of the lands: one beat every 5 land levels ----------
  const LAND_TALES = {
    forest: { title: 'The Bell and the Bargain', who: 'maren', beats: {
      5: ['Fresh goblin tracks lead deeper into the wood — and something heavy was dragged between them.', 'A goblin keep is out there. Follow the tracks on your next trip.'],
      10: ['Deep in the trees: a burned shrine. Someone left the goblins a pile of Ashford coins here, neatly counted.', 'Maren turns one over. "Goblins don\'t count. Someone was paying them."'],
      15: { who: 'pip', lines: ['A skinny goblin is elbow-deep in your pack. He freezes. "Pip didn\'t take anything! …Pip took a little."', 'The village would pay well for a goblin thief. Or you could let him go.'],
        choice: [{ id: 'spare', label: 'Let Pip go' }, { id: 'turnin', label: 'Turn him in (+40 gold)', cls: 'alt' }] },
      20: { spared: { who: 'pip', lines: ['Pip is waiting by the path. "You let Pip go. So Pip tells you: Grak answers to a King.', 'And the King answers to the man with the silver seal. Pip didn\'t say that. But it\'s true."'] },
        turnedin: { who: 'maren', lines: ['Among the goblin thief\'s things: a scrap of map. Grak\'s camp, the King\'s hall — and a note: "Paid in full. Silver seal."'] } },
      25: ['The goblins have gone quiet. Their keeps are emptying, one by one.', 'They are gathering somewhere deep in the wood — at their King\'s hall.'],
      30: ['The last keep falls. In its strongbox you find a letter:', '"The southern village, in exchange for a fire. — M."'],
      35: ['The deepest wood. A throne of stolen Ashford timber.', 'The Goblin King waits for you — and he is in a foul mood.'],
    } },
    mine: { title: 'The Hammer That Broke the Crown', who: 'thrain', beats: {
      5: ['Sealed dwarf doors and fresh rune warnings carved in the rock: "Surface folk turn back."'],
      10: ['A dwarf patrol blocks your path. "Thief! Come back for more, have ye?"', 'Something was stolen from the dwarves years ago — and they think it was someone like you.'],
      15: ['Thrain finally says it. "The great hammer. The only tool in the realm that could cut the Crown\'s gold. Gone from our vault."'],
      20: ['In an abandoned forge you find the hammer\'s empty rack.', 'The dust shows the shape of a hand that lifted it. A human hand.'],
      25: ['Old ledgers in a sealed hall: the Dwarf King sold the king\'s ore to a buyer who paid in Ashford silver.'],
      30: ['The last stronghold falls. Thrain stops calling you "surface-dweller".', '(For a whole day.)'],
      35: ['Behind the last sealed door, a throne of black iron.', 'The Dwarf King rises, hammer in hand.'],
    } },
    ocean: { title: 'The Ship with the Silver Sail', who: 'wren', beats: {
      5: ['Wren mends nets and watches the horizon. "Grandad won\'t talk about the night Ashford burned. He just looks at the sea."'],
      10: ['"The crabs are stripping the boats," Wren says. "They never did that before. Something\'s stirred them up."'],
      15: ['Wren\'s grandfather finally speaks: "A tall ship. A silver sail. Loading crates by torchlight, the night Ashford burned."'],
      20: ['A crate washes ashore, stamped with the royal crest — and a silver seal. Empty.'],
      25: ['Wren draws the ship from memory, then turns the page and starts sketching a boat of her own.'],
      30: ['The tide carries in a page of a ship\'s log. Its last line: "Course set beyond the last chart."'],
      35: ['"I\'m ready," Wren says. "All I need is a boat."', 'One day soon, the Boatyard will open.'],
    } },
    farm: { title: 'The Harvest Comes Home', who: 'maren', beats: {
      5: ['The first loaves in a year come out of the oven. Maren cries into the dough and denies it.'],
      10: ['Families who fled come home to work the fields. Ashford has neighbours again.'],
      15: ['A wedding in the barn. The chickens attend uninvited.'],
      20: ['The mill turns again. The children name the stubborn pig "Grak".'],
      25: ['Travelling merchants come back, and with them music, bunting and a fortune teller. The Harvest Fair is founded.'],
      30: ['An old farmer remembers: "The king\'s steward came to the summer vault every month. Regular as rain."'],
      35: ['A harvest festival in your honour. Maren makes a speech that is mostly about you eating more.'],
    } },
  };
  // Called after a trip: queue the beats for each 5-level mark this land just crossed.
  function landProgress(land, from, to) {
    if (!LAND_TALES[land]) return;
    const s = S();
    s.tales ||= {}; s.taleQueue ||= [];
    for (let lv = 5; lv <= 35; lv += 5) if (lv > from && lv <= to && (s.tales[land] || 0) < lv) { s.tales[land] = lv; s.taleQueue.push({ kind: 'tale', land, lv }); }
    App.save();
  }
  function taleBeat(land, lv) {
    const T = LAND_TALES[land], b = T.beats[lv];
    if (Array.isArray(b)) return { who: T.who, lines: b };
    if (b.spared) return S().flags.pip === 'turnedin' ? b.turnedin : b.spared;
    return b;
  }
  async function playTale(land, lv) {
    const T = LAND_TALES[land], b = taleBeat(land, lv);
    const pick = await say({ who: b.who, title: `${T.title} · ${landName(land)} Lv ${lv}`, lines: b.lines, buttons: b.choice });
    if (b.choice) {
      S().flags.pip = pick === 'turnin' ? 'turnedin' : 'spared';
      if (pick === 'turnin') st().stockpile.gold += 40;
      App.save();
      await say({ who: pick === 'turnin' ? 'maren' : 'pip', lines: [pick === 'turnin' ? 'The village guard drags Pip away, squeaking. Maren counts out 40 gold. "Hm. I hope that was right."' : '"Pip owes you!" He bolts into the trees, then pokes his head back out. "Pip REALLY owes you."'] });
    }
  }
  const landName = k => ({ forest: 'Whispering Wood', mine: 'Iron Hills', ocean: 'Sunlit Coast', farm: 'Golden Fields' })[k];

  // ---------- the Old King's lost diary pages ----------
  const PAGES = [
    'Crowned today. Five relics in one circle of gold, one for each people. My father said a crown should be heavy. It is.',
    'Hunted with the goblin chief. He cheats at everything and laughs when caught. I like him.',
    'The dwarves forged the Crown\'s band with their great hammer. Only it can cut that gold, they say.',
    'Watched the fishing fleet come in. A queen sings out past the reef; the fishers leave her pearls.',
    'Summer at Ashford. The vault is a dull place; I would rather be in the orchard.',
    'Took on a new steward, Morvane. Clever, tidy, never smiles. He will keep the accounts honest.',
    'The dwarf king asks for more of the mines. I said the mines belong to the realm. He went quiet.',
    'Goblin raids in the south again. Morvane says to send gold rather than soldiers. Cheaper, he says.',
    'Morvane asked to see the binding stone — the sliver that keeps the old dragon asleep. Odd request.',
    'A ship with a silver sail moored at Ashford. Morvane says it carries tax grain.',
    'The summer vault ledgers do not match. Morvane is looking into it.',
    'The great hammer is missing from the dwarves\' vault. They blame each other.',
    'I dreamt the Crown was cracking. Maren laughed at me and gave me soup.',
    'The goblin chief sent word: "Watch your man with the silver ring." I don\'t understand.',
    'Asked the Siren Queen about the silver ship. She only smiled.',
    'Morvane wants the regalia moved to Ashford "for safekeeping". I said no.',
    'The regalia were moved anyway. Morvane has the keys to everything now.',
    'Feast tonight. Morvane insisted. He has never insisted on anything.',
    '(Half burned) …the hammer, in his hand… the Crown… Maren, take the children and…',
    'If anyone reads this: it was Morvane. Find the regalia. Put it right.',
  ];
  const pagesFound = () => (S().pages ||= []);
  // The next page a board can hide (in order). Page 19 waits for the re-forged Crown; page 20 is in the dragon's hoard.
  function nextPage() {
    const n = pagesFound().length + 1;
    if (n <= 18) return n;
    if (n === 19 && st().inventory.crown > 0) return 19;
    return 0;
  }
  function findPage(n = nextPage()) {
    if (!n || pagesFound().includes(n)) return 0;
    pagesFound().push(n);
    S().taleQueue ||= []; S().taleQueue.push({ kind: 'page', n });
    App.save();
    return n;
  }
  const playPage = n => say({ who: 'journal', title: `Lost page ${n} of ${PAGES.length}`, lines: [`<i>“${PAGES[n - 1]}”</i>`] });

  // Show everything that piled up while you were out (tales, pages), one card at a time.
  async function playQueued() {
    const s = S(), q = s.taleQueue || [];
    while (q.length) {
      const item = q.shift();
      App.save();
      if (item.kind === 'tale') await playTale(item.land, item.lv);
      if (item.kind === 'page') await playPage(item.n);
    }
  }

  // ---------- boss lines: one before the fight, one after it falls ----------
  const BOSS_LINES = {
    warchief: ['"The King says the south is ours. Who are you to argue with a King?"', '"Wasn\'t my idea… the King gets his orders from somewhere too."'],
    golem: ['(A grinding voice) "THE VAULT IS SEALED. THE VAULT IS EMPTY. THE VAULT IS SEALED."', 'Its eyes dim. Behind it hangs an empty rack, the shape of a great hammer.'],
    kingcrab: ['(It clacks its claws and preens its barnacle crown.) Wren whispers: "He thinks he owns the harbour."', 'Wren whoops from the rocks. "The boats can go out again! Grandad will want to talk to you."'],
    goblinking: ['"A steward paid me to burn your village. He never paid the rest. Maybe you\'ll do."', '"He sailed west with the king\'s treasures… tell him the goblins remember."'],
    dwarfking: ['"I sold my people\'s honour for a steward\'s silver. I\'ll not sell my throne."', '"Take the shard. And tell Thrain… tell him I\'m sorry."'],
    dragon: ['"Another hero. Do you know what it is to wear a chain for a man?"', 'The chain breaks. On its last link: the steward\'s silver seal.'],
  };
  const bossBefore = kind => (BOSS_LINES[kind] ? say({ who: kind, lines: [BOSS_LINES[kind][0]], buttons: [{ id: 'go', label: '⚔️ Fight!', cls: 'danger' }] }) : Promise.resolve());
  const bossAfter = kind => (BOSS_LINES[kind] ? BOSS_LINES[kind][1] : '');

  // ---------- what Bram and Maren say when you visit (changes as the story moves on) ----------
  const REMARKS = {
    bram: [[0, 'Bring me wood and stone. I\'ll make you something that won\'t break on the first goblin.'],
      [4, 'Hm. Dwarf-made, that axe of Grak\'s. Odd thing for a goblin to carry.'],
      [6, 'Forge is hot again. Feels like home. Don\'t tell Maren I said that.'],
      [11, 'Steel. The dwarves\' way. Thrain taught you well — don\'t let it go to your head.'],
      [14, 'Never thought I\'d lay hands on the Crown. Mind the empty socket. Something\'s missing.'],
      [16, 'Starsilver bites dragon scale. I\'ve been saving my best work for this.']],
    maren: [[0, 'Eat first. Then save the realm.'],
      [1, 'Bread, child. Bread and water and a warm fire, and we\'ll see what tomorrow brings.'],
      [3, 'That bell rang over my wedding. Goblins can\'t write. Someone else wrote "M."'],
      [7, 'A silver sail… I remember a ship like that. I\'d rather not.'],
      [13, 'Two kings, one seal. I know that seal. I wish I didn\'t.'],
      [16, 'Whatever happens on that mountain — come home and eat.']],
  };
  // Once a quest is done, the village remembers it.
  const QUEST_REMARKS = {
    bram: [['halfRepair', 'Nell! Fetch the big bellows. — Sorry. New apprentice. Keen as mustard, that one.'], ['halfRepair', 'Bring your battered kit here. Nell needs the practice, so it\'s half price.'], ['mill', 'Hear that? The mill. Took me a week to stop listening for it.']],
    maren: [['stew', 'Folk still talk about that supper. Jory would\'ve pretended not to be pleased.'], ['stew', 'Salt. Of all the things to forget. Wren\'s a good girl.'], ['scout', 'Pip\'s little sister came by for honey cake. Ate four. Hid one.']],
  };
  function remark(who) {
    const ch = S().chapter || 0;
    let line = REMARKS[who].filter(([c]) => c <= ch).at(-1)[1];
    const extra = (QUEST_REMARKS[who] || []).filter(([k]) => window.Quests && Quests.perk(k)).map(([, l]) => l);
    if (extra.length && Math.random() < 0.5) line = extra[Math.floor(Math.random() * extra.length)];
    const c = CAST[who];
    return `<div class="remark"><span class="remark-pic">${c.pic()}</span><p><b>${c.name}:</b> “${fill(line)}”</p></div>`;
  }

  // ---------- Journal tabs (Chapters live in Story) ----------
  function talesHtml() {
    const s = S(), seen = s.tales || {};
    return Object.entries(LAND_TALES).map(([land, T]) => {
      const upTo = seen[land] || 0;
      const beats = [5, 10, 15, 20, 25, 30, 35].map(lv => {
        if (lv > upTo) return `<li class="locked">Lv ${lv} · <i>reach ${landName(land)} Lv ${lv}</i></li>`;
        const b = taleBeat(land, lv);
        return `<li><b>Lv ${lv}</b> · ${b.lines.map(fill).join(' ')}${b.choice && s.flags.pip ? ` <i>(You ${s.flags.pip === 'turnedin' ? 'turned Pip in' : 'let Pip go'}.)</i>` : ''}</li>`;
      }).join('');
      return `<div class="jchap"><div class="jc-title">${landName(land)}: ${T.title}</div><ul class="tale-list">${beats}</ul></div>`;
    }).join('');
  }
  function pagesHtml() {
    const got = pagesFound();
    return `<p class="hint">Torn pages of the Old King's diary turn up as rare buried finds. ${got.length}/${PAGES.length} found.</p>`
      + PAGES.map((p, i) => got.includes(i + 1) ? `<div class="jpage"><b>${i + 1}.</b> <i>“${p}”</i></div>` : `<div class="jpage locked"><b>${i + 1}.</b> ???</div>`).join('');
  }
  function peopleHtml() {
    const met = S().met || {};
    const order = ['maren', 'bram', 'thrain', 'pip', 'wren', 'ysolde', 'warchief', 'golem', 'kingcrab', 'goblinking', 'dwarfking', 'dragon', 'journal'];
    const known = order.filter(k => met[k]);
    return (known.length ? known.map(k => `<div class="person"><span class="person-pic">${CAST[k].pic()}</span><div><b>${CAST[k].name}</b><small>${CAST[k].role}</small></div></div>`).join('') : '<p class="hint">You haven\'t met anyone yet.</p>')
      + (known.length < order.length ? `<p class="hint">${order.length - known.length} more to meet…</p>` : '');
  }

  return { ART, CAST, say, panel, meet, landProgress, playQueued, nextPage, findPage, PAGES, bossBefore, bossAfter, remark, talesHtml, pagesHtml, peopleHtml, LAND_TALES };
})();
