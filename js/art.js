// Vector art: tile icons, obstacle pieces, board frames and scene backgrounds.
window.Art = (() => {
  const svg = (body, vb = '0 0 64 64') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  // ---------- shared gradients & filters (injected once into the page) ----------
  const ringStops = (a, b, n = 7) => Array.from({ length: n }, (_, i) => `<stop offset="${(i / (n - 1)) * 100}%" stop-color="${i % 2 ? b : a}"/>`).join('');
  const DEFS = `<svg id="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <radialGradient id="rgPine" cx="50%" cy="50%" r="55%">${ringStops('#f0cf98', '#c99a5c')}<stop offset="100%" stop-color="#8a5a2c"/></radialGradient>
    <radialGradient id="rgOak" cx="50%" cy="50%" r="55%">${ringStops('#c98f52', '#8a5426', 9)}<stop offset="100%" stop-color="#4a2a10"/></radialGradient>
    <radialGradient id="rgIron" cx="50%" cy="50%" r="55%">${ringStops('#8a5a46', '#5a3628', 11)}<stop offset="100%" stop-color="#2a1a14"/></radialGradient>
    <radialGradient id="rgElder" cx="50%" cy="50%" r="55%">${ringStops('#f4fbf6', '#c6e8da', 7)}<stop offset="100%" stop-color="#8fbfae"/></radialGradient>
    <linearGradient id="lgBarkPine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0703c"/><stop offset=".35" stop-color="#8a4f26"/><stop offset=".8" stop-color="#5a3016"/><stop offset="1" stop-color="#3a1e0c"/></linearGradient>
    <linearGradient id="lgBarkOak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a3c"/><stop offset=".35" stop-color="#5a3f28"/><stop offset=".8" stop-color="#3a2818"/><stop offset="1" stop-color="#22170c"/></linearGradient>
    <linearGradient id="lgBarkIron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d7a80"/><stop offset=".3" stop-color="#4f4c52"/><stop offset=".75" stop-color="#2c2a30"/><stop offset="1" stop-color="#18171b"/></linearGradient>
    <linearGradient id="lgBarkElder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f6f2"/><stop offset=".4" stop-color="#cfdcd4"/><stop offset="1" stop-color="#8fa69a"/></linearGradient>
    <linearGradient id="lgDrift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6dfd2"/><stop offset=".5" stop-color="#bfb4a2"/><stop offset="1" stop-color="#857a69"/></linearGradient>
    <radialGradient id="rgStone" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#d9dde2"/><stop offset=".45" stop-color="#9aa1aa"/><stop offset="1" stop-color="#4a5058"/></radialGradient>
    <radialGradient id="rgRock" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#8d857e"/><stop offset=".5" stop-color="#5d5651"/><stop offset="1" stop-color="#2a2623"/></radialGradient>
    <linearGradient id="lgIronOre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd2a0"/><stop offset=".35" stop-color="#d9773a"/><stop offset="1" stop-color="#7a3a14"/></linearGradient>
    <linearGradient id="lgSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#d4dbe3"/><stop offset=".7" stop-color="#8a95a3"/><stop offset="1" stop-color="#e9eef3"/></linearGradient>
    <linearGradient id="lgStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e8ff"/><stop offset=".4" stop-color="#a78bfa"/><stop offset=".75" stop-color="#5b4bd6"/><stop offset="1" stop-color="#8ad4ff"/></linearGradient>
    <radialGradient id="rgCoal" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#5a6070"/><stop offset=".35" stop-color="#23252c"/><stop offset="1" stop-color="#08090b"/></radialGradient>
    <radialGradient id="rgLeather" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#e2ad74"/><stop offset=".6" stop-color="#b47640"/><stop offset="1" stop-color="#6e4020"/></radialGradient>
    <radialGradient id="rgBerry" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#c9a6ff"/><stop offset=".35" stop-color="#6a3aa6"/><stop offset="1" stop-color="#25103f"/></radialGradient>
    <linearGradient id="lgLeaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2f5a14"/><stop offset=".5" stop-color="#5f9a2a"/><stop offset="1" stop-color="#a9d45a"/></linearGradient>
    <linearGradient id="lgGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c4"/><stop offset=".3" stop-color="#f6cd45"/><stop offset=".65" stop-color="#b8860b"/><stop offset="1" stop-color="#f2c230"/></linearGradient>
    <radialGradient id="rgWater" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e6f8ff"/><stop offset=".35" stop-color="#6cc8f5"/><stop offset=".8" stop-color="#1f6fb0"/><stop offset="1" stop-color="#0f3f6e"/></radialGradient>
    <linearGradient id="lgFish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb370"/><stop offset=".5" stop-color="#f07a2a"/><stop offset="1" stop-color="#ffe2c0"/></linearGradient>
    <linearGradient id="lgSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#c7cfd8"/><stop offset=".7" stop-color="#7d8896"/><stop offset="1" stop-color="#dfe5eb"/></linearGradient>
    <radialGradient id="rgPearl" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#eef0f6"/><stop offset=".8" stop-color="#c9c3dc"/><stop offset="1" stop-color="#9fb4c6"/></radialGradient>
    <linearGradient id="lgShell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8cdb8"/><stop offset=".6" stop-color="#a59680"/><stop offset="1" stop-color="#6e604e"/></linearGradient>
    <linearGradient id="lgCoral" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c2405a"/><stop offset=".6" stop-color="#ef6f84"/><stop offset="1" stop-color="#ffb3be"/></linearGradient>
    <linearGradient id="lgIron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".45" stop-color="#5d6672"/><stop offset="1" stop-color="#2f353d"/></linearGradient>
    <linearGradient id="lgStoneHead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c2c6cb"/><stop offset=".5" stop-color="#8a9097"/><stop offset="1" stop-color="#555b62"/></linearGradient>
    <linearGradient id="lgWoodHead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9a868"/><stop offset=".5" stop-color="#a06a32"/><stop offset="1" stop-color="#5a3414"/></linearGradient>
    <linearGradient id="lgHaft1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2b77c"/><stop offset="1" stop-color="#8a5a2c"/></linearGradient>
    <linearGradient id="lgHaft2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b47a44"/><stop offset="1" stop-color="#5a3416"/></linearGradient>
    <linearGradient id="lgHaft3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a4a3a"/><stop offset="1" stop-color="#241812"/></linearGradient>
    <filter id="fGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="g"/>
      <feBlend in="SourceGraphic" in2="g" mode="multiply"/></filter>
    <filter id="fGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs></svg>`;
  function injectDefs() { if (!document.getElementById('art-defs')) document.body.insertAdjacentHTML('afterbegin', DEFS); }

  // ---------- tiles (shaded, more natural look) ----------
  const log = (bark, rings, grooves, extra = '') => `
    <ellipse cx="34" cy="50" rx="24" ry="4" fill="#000" opacity=".28"/>
    <rect x="6" y="20" width="44" height="26" rx="13" fill="url(#${bark})" filter="url(#fGrain)"/>
    <path d="${grooves}" stroke="#000" stroke-opacity=".38" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M10 24c10-2 24-2 36 0" stroke="#fff" stroke-opacity=".22" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="33" rx="9.5" ry="13" fill="url(#${rings})" stroke="#000" stroke-opacity=".35" stroke-width="1"/>
    <path d="M50 33l6-6" stroke="#000" stroke-opacity=".3" stroke-width="1.2"/>${extra}`;
  const oreRock = (metal, glints, extra = '') => `
    <ellipse cx="32" cy="52" rx="22" ry="4" fill="#000" opacity=".3"/>
    <path d="M10 44 15 23 30 13 47 17 54 38 43 51 21 52Z" fill="url(#rgRock)" filter="url(#fGrain)"/>
    <path d="M30 13 47 17 54 38 43 51 36 31Z" fill="#000" opacity=".22"/>
    <g fill="url(#${metal})" stroke="#000" stroke-opacity=".35" stroke-width=".8">
      <path d="M19 27l8-4 5 6-6 5z"/><path d="M37 32l8-3 3 7-7 3z"/><path d="M23 41l7-2 3 6-7 2z"/><path d="M38 19l5-1 2 4-5 2z"/></g>
    <g fill="#fff" opacity=".85">${glints}</g>${extra}`;

  const TILES = {
    wood: log('lgBarkPine', 'rgPine', 'M12 30c6 1 12-1 18 0M10 38c8 1 16-1 26 0M18 43c6 0 10-1 14 0'),
    oak: log('lgBarkOak', 'rgOak', 'M10 27c4 3 8-3 12 0s8-3 12 0 8 3 10 0M10 34c4 3 8-3 12 0s8-3 12 0 8 3 10 0M12 41c4 3 8-3 12 0s8-3 12 0',
      '<ellipse cx="16" cy="14" rx="5" ry="6" fill="#8a5a2c"/><path d="M11 12a5 4 0 0 1 10 0z" fill="#4a3018"/><path d="M22 10c4-4 10-4 12 0-4 0-8 2-12 0z" fill="#4f8a2a"/>'),
    ironwood: log('lgBarkIron', 'rgIron', 'M10 28h34M10 33h34M10 38h34M10 43h34',
      '<path d="M12 23c10-2 22-2 32 0" stroke="#c9d3de" stroke-opacity=".55" stroke-width="1.6" fill="none"/>'),
    elderwood: `<g filter="url(#fGlow)">${log('lgBarkElder', 'rgElder', 'M12 30c6 1 12-1 18 0M10 38c8 1 16-1 26 0')}</g>
      <g stroke="#5fe0c0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"><path d="M16 28l3 5-3 5M26 27v12M24 31h4M36 28l4 8"/></g>
      <g fill="#c8fff0"><circle cx="8" cy="14" r="1.4"/><circle cx="56" cy="12" r="1.2"/><circle cx="20" cy="10" r="1"/></g>`,
    stone: `<ellipse cx="32" cy="53" rx="22" ry="4" fill="#000" opacity=".3"/>
      <path d="M10 45 16 22 32 12 49 18 55 40 43 52 20 53Z" fill="url(#rgStone)" filter="url(#fGrain)"/>
      <path d="M32 12 49 18 55 40 43 52 37 30Z" fill="#000" opacity=".2"/><path d="M16 22 32 12 37 30 21 34Z" fill="#fff" opacity=".22"/>
      <path d="M21 34 37 30 43 52" stroke="#000" stroke-opacity=".25" stroke-width="1" fill="none"/><path d="M26 22l4 6" stroke="#000" stroke-opacity=".3" stroke-width="1.2"/>`,
    hide: `<ellipse cx="32" cy="55" rx="22" ry="3.5" fill="#000" opacity=".25"/>
      <path d="M20 10c5 4 19 4 24 0 1 7 5 10 10 12-4 7-4 16-1 25-8-2-13 2-21 4-8-2-13-6-21-4 3-9 3-18-1-25 5-2 9-5 10-12z" fill="url(#rgLeather)" filter="url(#fGrain)"/>
      <path d="M23 16c4 3 14 3 18 0 1 6 4 8 7 10-3 6-3 12-1 18-6-1-10 2-15 3-6-1-10-4-15-3 2-6 2-12-1-18 3-2 6-4 7-10z" fill="none" stroke="#5a3016" stroke-width="1.2" stroke-dasharray="2 2.5" opacity=".7"/>
      <path d="M26 26c4 2 8 2 12 0M27 34c3 1.5 7 1.5 10 0" stroke="#7a4420" stroke-width="1.4" fill="none" opacity=".6"/>`,
    berries: `<ellipse cx="32" cy="56" rx="18" ry="3" fill="#000" opacity=".3"/>
      <path d="M33 8c8 0 14 5 15 11-8 1-13-4-15-11z" fill="url(#lgLeaf)"/><path d="M33 9v12" stroke="#2a4a14" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="22" cy="34" r="11" fill="url(#rgBerry)"/><circle cx="42" cy="33" r="11" fill="url(#rgBerry)"/><circle cx="32" cy="47" r="11" fill="url(#rgBerry)"/>
      <g fill="#fff" opacity=".85"><ellipse cx="18" cy="29" rx="3" ry="2"/><ellipse cx="38" cy="28" rx="3" ry="2"/><ellipse cx="28" cy="42" rx="3" ry="2"/></g>`,
    leaves: `<ellipse cx="32" cy="55" rx="20" ry="3" fill="#000" opacity=".25"/>
      <path d="M10 52C10 26 28 12 54 9c0 26-14 43-44 43z" fill="url(#lgLeaf)"/>
      <path d="M12 50C22 38 34 26 48 15" stroke="#1f3d0c" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M22 40l-3-9M29 33l-2-9M36 26l-1-8M25 37l11 1M32 30l10-1M39 23l8 0" stroke="#1f3d0c" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
      <path d="M16 46c6-14 18-26 34-33" stroke="#e8f8b0" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/>`,
    ore: oreRock('lgIronOre', '<circle cx="22" cy="26" r="1.2"/><circle cx="40" cy="32" r="1"/>'),
    silver: oreRock('lgSilver', '<circle cx="22" cy="26" r="1.6"/><circle cx="40" cy="32" r="1.4"/><circle cx="26" cy="41" r="1.2"/>',
      '<path d="M50 10l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff"/>'),
    starsilver: `<g filter="url(#fGlow)">${oreRock('lgStar', '<circle cx="22" cy="26" r="1.6"/><circle cx="40" cy="32" r="1.4"/>')}</g>
      <path d="M52 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e6d8ff"/><path d="M10 14l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#bfe8ff"/>`,
    coal: `<ellipse cx="32" cy="54" rx="20" ry="3.5" fill="#000" opacity=".35"/>
      <path d="M12 42 18 20 36 12 52 24 52 43 36 54 18 51Z" fill="url(#rgCoal)"/>
      <path d="M36 12 52 24 52 43 38 33Z" fill="#000" opacity=".35"/><path d="M18 20 36 12 38 33 24 36Z" fill="#8fa4c2" opacity=".18"/>
      <path d="M24 22l10-4M42 26l6 4" stroke="#b9cbe6" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`,
    gravel: `<ellipse cx="32" cy="55" rx="22" ry="3" fill="#000" opacity=".25"/>
      <g filter="url(#fGrain)"><ellipse cx="21" cy="42" rx="10" ry="7.5" fill="#9b8d74"/><ellipse cx="41" cy="44" rx="11" ry="8" fill="#857860"/>
      <ellipse cx="31" cy="28" rx="9" ry="7" fill="#ad9f84"/><ellipse cx="47" cy="27" rx="6" ry="4.6" fill="#958870"/><ellipse cx="16" cy="27" rx="5" ry="4" fill="#82765e"/></g>
      <path d="M26 25c3-2 7-2 9 0M15 39c3-2 7-2 9 0M36 41c3-2 7-2 9 0" stroke="#efe3c8" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
    bones: `<ellipse cx="32" cy="55" rx="20" ry="3" fill="#000" opacity=".3"/>
      <g fill="#ece4cf" stroke="#9a8f78" stroke-width="1"><g transform="rotate(38 32 32)"><rect x="15" y="29" width="34" height="6.5" rx="3"/><circle cx="15" cy="28" r="4.8"/><circle cx="15" cy="36.5" r="4.8"/><circle cx="49" cy="28" r="4.8"/><circle cx="49" cy="36.5" r="4.8"/></g>
      <g transform="rotate(-38 32 32)"><rect x="15" y="29" width="34" height="6.5" rx="3"/><circle cx="15" cy="28" r="4.8"/><circle cx="15" cy="36.5" r="4.8"/><circle cx="49" cy="28" r="4.8"/><circle cx="49" cy="36.5" r="4.8"/></g></g>`,
    gold: `<ellipse cx="32" cy="53" rx="22" ry="4" fill="#000" opacity=".35"/>
      <path d="M9 40c-3-7 2-14 9-15 1-8 10-13 18-10 6-5 16-2 18 6 7 2 9 10 5 16 2 7-4 12-11 11-4 5-13 6-18 2-8 3-17 0-19-6-3-1-3-3-2-4z" fill="url(#lgGold)" stroke="#7a5404" stroke-width="1"/>
      <path d="M18 30c2-5 8-7 12-5M36 20c5-1 9 2 10 6" stroke="#fffbe0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>
      <g fill="#7a5404" opacity=".45"><circle cx="26" cy="40" r="2"/><circle cx="42" cy="38" r="1.6"/><circle cx="34" cy="46" r="1.4"/></g>
      <circle cx="30" cy="29" r="1.8" fill="#fff"/>`,
    water: `<ellipse cx="32" cy="58" rx="16" ry="3" fill="#0a2a4a" opacity=".35"/>
      <path d="M32 5C24 19 14 30 14 41a18 18 0 0 0 36 0C50 30 40 19 32 5z" fill="url(#rgWater)" stroke="#0d4a7a" stroke-width="1"/>
      <path d="M21 39c0-7 4-12 8-15" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="38" cy="47" rx="5" ry="2.5" fill="#bfeaff" opacity=".45"/>`,
    fish: `<ellipse cx="32" cy="50" rx="22" ry="3" fill="#000" opacity=".25"/>
      <path d="M6 32c8-13 25-17 37-8l11-9v34l-11-9c-12 9-29 5-37-8z" fill="url(#lgFish)" stroke="#a04a10" stroke-width="1"/>
      <g fill="none" stroke="#c4561a" stroke-width="1" opacity=".55"><path d="M24 25q3 3 0 6M30 24q3 3 0 6M36 25q3 3 0 6M27 31q3 3 0 6M33 31q3 3 0 6"/></g>
      <path d="M22 21c3 6 3 16 0 22" stroke="#ffe0c0" stroke-width="1.6" fill="none" opacity=".7"/>
      <circle cx="15" cy="29" r="3.2" fill="#fff"/><circle cx="15.6" cy="29.4" r="1.8" fill="#111"/>`,
    driftwood: `<ellipse cx="32" cy="52" rx="24" ry="3" fill="#000" opacity=".25"/>
      <path d="M5 40c8-10 20-12 32-14 9-2 16-6 20-10l3 6c-6 6-14 9-22 11-11 3-21 7-29 14z" fill="url(#lgDrift)" filter="url(#fGrain)"/>
      <path d="M8 44c10-8 22-10 32-12M40 22l8-8M24 30l-4-8" stroke="#6e6556" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
    sand: `<g filter="url(#fGrain)"><path d="M6 46c8-6 18-8 26-6s18 6 26 2v10H6z" fill="#e8d3a2"/></g>
      <path d="M26 30c4-6 12-6 16 0-5 5-11 5-16 0z" fill="#f6ead2" stroke="#c9a876" stroke-width="1"/><path d="M30 30h8M34 26v8" stroke="#c9a876" stroke-width="1"/>
      <g fill="#b89a66"><circle cx="16" cy="22" r="1.6"/><circle cx="48" cy="20" r="1.4"/><circle cx="20" cy="38" r="1.2"/><circle cx="46" cy="36" r="1.4"/></g>`,
    seaweed: `<g fill="none" stroke-linecap="round" stroke-width="5"><path d="M20 58c-6-10 6-16 0-26s6-16 2-24" stroke="#1f6a42"/><path d="M34 58c6-12-6-18 2-30 5-8-2-14 2-20" stroke="#3a9a5c"/><path d="M47 58c-4-8 5-14 0-22" stroke="#24704a"/></g>
      <g fill="none" stroke="#bff0cf" stroke-width="1.2" opacity=".35" stroke-linecap="round"><path d="M20 50c-3-6 3-10 0-16M35 46c3-8-3-12 1-20"/></g>`,
    star: `<g filter="url(#fGlow)"><path d="M32 7l7 14.4 15.8 2.2-11.5 11 2.8 15.7L32 42.8 17.9 50.3l2.8-15.7L9.2 23.6 25 21.4z" fill="#fff" stroke="#fff6c0" stroke-width="2" stroke-linejoin="round"/></g>`,
    charcoal: `<ellipse cx="32" cy="54" rx="20" ry="3" fill="#000" opacity=".35"/><path d="M12 42 16 24 30 16 48 20 54 38 40 50 20 50Z" fill="url(#rgCoal)"/>
      <path d="M20 30l8 6 6-4 8 6M24 42l6-4" stroke="#ff6a2a" stroke-width="1.6" fill="none" opacity=".85"/>`,
    steel: `<ellipse cx="32" cy="52" rx="24" ry="3.5" fill="#000" opacity=".35"/><path d="M8 40l8-16h32l8 16z" fill="url(#lgSteel)" stroke="#4a5560" stroke-width="1"/>
      <path d="M16 24h32l8 16H8z" fill="none"/><path d="M8 40h48v6H8z" fill="#7d8896"/><path d="M18 28h20" stroke="#fff" stroke-width="2" opacity=".8"/>`,
  };
  TILES.pearl = `<ellipse cx="32" cy="54" rx="22" ry="3.5" fill="#000" opacity=".3"/>
      <path d="M6 40c2-14 14-24 26-24s24 10 26 24c-8 8-44 8-52 0z" fill="url(#lgShell)" stroke="#5e5446" stroke-width="1"/>
      <g stroke="#7a6e5c" stroke-width="1.1" fill="none" opacity=".6"><path d="M32 18v26M20 22l6 22M44 22l-6 22M12 32l12 12M52 32 40 44"/></g>
      <path d="M10 42c6 6 38 6 44 0-4 10-40 10-44 0z" fill="#3a3028"/>
      <circle cx="32" cy="41" r="8.5" fill="url(#rgPearl)" filter="url(#fGlow)"/><circle cx="29" cy="38" r="2.4" fill="#fff" opacity=".9"/>`;
  TILES.coral = `<ellipse cx="32" cy="56" rx="18" ry="3" fill="#000" opacity=".3"/>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56V36l-10-12-2-12M32 40l10-12 2-14M22 24l-8-4M42 28l10-4M32 36v-14" stroke="#8a2a3a" stroke-width="7"/>
      <path d="M32 56V36l-10-12-2-12M32 40l10-12 2-14M22 24l-8-4M42 28l10-4M32 36v-14" stroke="url(#lgCoral)" stroke-width="5"/></g>
      <g fill="#ffd9de" opacity=".8"><circle cx="20" cy="13" r="1.5"/><circle cx="44" cy="15" r="1.5"/><circle cx="14" cy="20" r="1.4"/><circle cx="52" cy="24" r="1.4"/><circle cx="32" cy="23" r="1.4"/></g>`;
  TILES.mushroom = TILES.leaves;

  // ---------- gear icons: shape by type, finish by tier ----------
  const HEAD = { 1: 'lgStoneHead', 2: 'lgIron', 3: 'lgSteel', 4: 'lgStar' };
  const HAFT = { 1: 'lgHaft1', 2: 'lgHaft2', 3: 'lgHaft3', 4: 'lgHaft3' };
  function gearArt(type, tier) {
    const head = type === 'baxe' && tier === 1 ? 'lgWoodHead' : HEAD[tier], haft = HAFT[tier];
    const shine = tier >= 3 ? '<path d="M44 8l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff"/>' : '';
    const handle = `<path d="M14 56L44 14" stroke="#1a0f08" stroke-width="7" stroke-linecap="round"/><path d="M14 56L44 14" stroke="url(#${haft})" stroke-width="5" stroke-linecap="round"/>
      <path d="M16 51l3-4M20 46l3-4" stroke="#2a1608" stroke-width="2" opacity=".6"/>`;
    const sh = '<ellipse cx="30" cy="58" rx="18" ry="3" fill="#000" opacity=".3"/>';
    const shapes = {
      baxe: `${sh}${handle}<path d="M40 8c-8 0-14 6-14 12 6-2 10 0 14 4 2-6 6-10 12-10-2-4-6-6-12-6z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/>
        <path d="M52 30c0-8-6-14-12-14 2 6 0 10-4 14 6 2 10 6 10 12 4-2 6-6 6-12z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/>`,
      sword: `${sh}<path d="M50 6l-30 30 4 4 30-30 2-8z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/><path d="M50 8L24 36" stroke="#fff" stroke-width="1.2" opacity=".6"/>
        <path d="M14 34l16 16" stroke="#3a2a14" stroke-width="5" stroke-linecap="round"/><path d="M14 34l16 16" stroke="#c9a227" stroke-width="3" stroke-linecap="round"/>
        <path d="M22 42L10 54" stroke="url(#${haft})" stroke-width="5" stroke-linecap="round"/><circle cx="9" cy="55" r="3.5" fill="#c9a227" stroke="#5a4210"/>`,
      bow: `${sh}<path d="M16 6c26 6 38 22 42 46" stroke="#1a0f08" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M16 6c26 6 38 22 42 46" stroke="url(#${haft})" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M16 6L58 52" stroke="#efe6d0" stroke-width="1.2"/><path d="M10 56L48 18" stroke="#8a6a44" stroke-width="2.2"/><path d="M48 18l-2 8 6-6z" fill="url(#${HEAD[Math.max(2, tier)]})" stroke="#111" stroke-width=".8"/>
        <path d="M12 54l-4 2 2-4zM14 52l-5 0 3-3z" fill="#c0392b"/>`,
      waxe: `${sh}${handle}<path d="M38 10c6-4 14-2 18 4l-6 10c-4-2-8-2-12 2z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/><path d="M52 12l-4 10" stroke="#fff" stroke-width="1.4" opacity=".55"/>`,
      pick: `${sh}${handle}<path d="M22 10c10-6 26-4 36 6-10-4-20-4-30 2-2-2-4-6-6-8z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/><path d="M28 12c8-3 18-2 26 4" stroke="#fff" stroke-width="1.2" opacity=".5" fill="none"/>`,
      spear: `${sh}<path d="M10 58L46 18" stroke="#1a0f08" stroke-width="6" stroke-linecap="round"/><path d="M10 58L46 18" stroke="url(#lgDrift)" stroke-width="4" stroke-linecap="round"/>
        <path d="M40 20l4 4M37 24l4 4" stroke="#3a6a5a" stroke-width="2.2"/>
        <path d="M44 20l12-16-4 18-6 2z" fill="url(#lgCoral)" stroke="#6a1a2a" stroke-width="1.2" stroke-linejoin="round"/><path d="M48 14l5-7" stroke="#ffd9de" stroke-width="1.2" opacity=".8"/>`,
      psabre: `${sh}<path d="M52 6c-8 16-20 26-32 32l4 4c14-6 24-18 30-34z" fill="url(#lgSilver)" stroke="#3a4450" stroke-width="1.2"/><path d="M50 10c-7 13-17 22-27 28" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/>
        <path d="M14 36c4 2 12 10 14 14" stroke="#2a3a44" stroke-width="5" stroke-linecap="round"/><path d="M14 36c4 2 12 10 14 14" stroke="#7ab0c0" stroke-width="3" stroke-linecap="round"/>
        <path d="M22 42L11 53" stroke="#1d2a30" stroke-width="5" stroke-linecap="round"/><circle cx="9" cy="55" r="4.5" fill="url(#rgPearl)" stroke="#6a7a8a" filter="url(#fGlow)"/>`,
      hammer: `${sh}${handle}<path d="M32 6l18 12-8 12-18-12z" fill="url(#${head})" stroke="#111" stroke-width="1.2"/><path d="M33 9l14 9" stroke="#fff" stroke-width="1.4" opacity=".5"/>`,
    };
    return shapes[type] + (type === 'spear' || type === 'psabre' ? '' : shine);
  }

  const tile = type => TILES[type] ? svg(TILES[type]) : '';

  // ---------- obstacle pieces ----------
  const PIECES = {
    stump: `<path d="M6 48c5-3 8 2 13 0M45 50c5 2 9-1 13 1M27 54c2-3 6-3 9 0" stroke="#4f3217" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M10 30v10c0 8 10 13 22 13s22-5 22-13V30z" fill="#6b4423"/><path d="M14 33v8M22 36v9M42 36v9M50 33v8" stroke="#4f3217" stroke-width="2"/>
      <ellipse cx="32" cy="30" rx="22" ry="12" fill="#ddb072"/><ellipse cx="32" cy="30" rx="16" ry="8.5" fill="none" stroke="#b07f45" stroke-width="2"/>
      <ellipse cx="32" cy="30" rx="9" ry="4.8" fill="none" stroke="#b07f45" stroke-width="2"/><ellipse cx="32" cy="30" rx="3" ry="1.7" fill="#8c5e2c"/>
      <path d="M44 22c4-6 9-7 12-5" stroke="#5e8f2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="56" cy="16" rx="4" ry="2.5" fill="#7ab03a"/>`,
    thorn: `<circle cx="21" cy="38" r="15" fill="#25481b"/><circle cx="43" cy="37" r="16" fill="#2e5a20"/><circle cx="32" cy="24" r="15" fill="#386b28"/>
      <circle cx="33" cy="40" r="5" fill="#ffd866"/><path d="M33 34v-3M33 49v-3M27 40h-3M42 40h-3" stroke="#fff3b0" stroke-width="2" stroke-linecap="round"/>
      <g fill="#cfe08f"><path d="M12 30l-6-3 6-1z"/><path d="M20 20l-3-6 5 3z"/><path d="M45 18l3-6 1 6z"/><path d="M56 32l6-2-5 5z"/><path d="M50 50l5 4-6-1z"/><path d="M14 50l-5 5 2-6z"/><path d="M30 12l1-7 2 7z"/></g>
      <g fill="#c0392b"><circle cx="20" cy="31" r="2.6"/><circle cx="45" cy="28" r="2.6"/><circle cx="26" cy="48" r="2.4"/></g>`,
    boulder: `<path d="M6 46c0-17 10-32 27-34 15-1 25 11 25 27 0 9-6 15-14 15H16C10 54 6 51 6 46z" fill="#7f7a72"/>
      <path d="M33 12c15-1 25 11 25 27 0 9-6 15-14 15H34c9-8 11-27-1-42z" fill="#5f5b55"/>
      <path d="M14 28c4-8 11-12 18-12" stroke="#a8a39b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M26 30l6 6-3 7M40 22l-4 9" stroke="#4a4641" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M8 44c6-5 12-3 16-6 4 3 10 2 12 6" fill="#5d8a2c" opacity=".85"/>`,
    vein: `<path d="M5 47c0-18 11-34 28-35 16-1 26 12 26 28 0 9-6 15-14 15H15C9 55 5 52 5 47z" fill="#5c5650"/>
      <path d="M33 12c16-1 26 12 26 28 0 9-6 15-14 15H34c9-8 11-27-1-43z" fill="#47423d"/>
      <path class="glow" d="M14 40l9-6 6 4 8-9 7 3 7-6M20 48l7-4 6 3 9-4M26 22l6 5 7-3" stroke="#ff9a3c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#ffbe78"><circle cx="23" cy="34" r="2.6"/><circle cx="37" cy="29" r="2.6"/><circle cx="51" cy="28" r="2.4"/><circle cx="33" cy="47" r="2.4"/></g>`,
    locked: `<path d="M8 26c0-11 9-15 24-15s24 4 24 15z" fill="#8f5a2a"/><rect x="8" y="25" width="48" height="29" rx="3" fill="#7a4b22"/>
      <path d="M8 34h48M8 44h48" stroke="#5d3815" stroke-width="1.6"/><rect x="8" y="25" width="48" height="4" fill="#4b2d12"/>
      <rect x="14" y="12" width="5.5" height="42" rx="1" fill="#98a1ab"/><rect x="44.5" y="12" width="5.5" height="42" rx="1" fill="#98a1ab"/>
      <g fill="#6f7882"><circle cx="16.7" cy="20" r="1.2"/><circle cx="16.7" cy="48" r="1.2"/><circle cx="47.2" cy="20" r="1.2"/><circle cx="47.2" cy="48" r="1.2"/></g>
      <path d="M27 31v-5a5 5 0 0 1 10 0v5" stroke="#d6dbe1" stroke-width="3" fill="none"/><rect x="24.5" y="30" width="15" height="13" rx="2.5" fill="#e8c34a"/>
      <circle cx="32" cy="35" r="2" fill="#5a4210"/><rect x="31.1" y="35.5" width="1.8" height="4.5" fill="#5a4210"/>`,
    cart: `<rect x="0" y="56" width="64" height="2.6" fill="#8d8f94"/><g fill="#5a3d24"><rect x="4" y="58.6" width="7" height="3"/><rect x="20" y="58.6" width="7" height="3"/><rect x="37" y="58.6" width="7" height="3"/><rect x="53" y="58.6" width="7" height="3"/></g>
      <path d="M11 22c3-9 9-11 14-6 3-7 11-8 15-1 5-4 11-1 13 7z" fill="#57504a"/>
      <g fill="#ef8a3c"><path d="M19 17l5-2 2 4-5 2z"/><path d="M36 15l5-1 1 4-5 1z"/><path d="M45 19l4 0 0 3-4 0z"/></g><path d="M28 12l4-2 2 3-4 2z" fill="#2b2c30"/>
      <path d="M6 21h52l-6 26H12z" fill="#6c7179"/><path d="M6 21h52v5H6z" fill="#9aa0a8"/><path d="M12 47h40l1-4H11z" fill="#4c5058"/>
      <path d="M18 26l-2 19M32 26v19M46 26l2 19" stroke="#565b63" stroke-width="2.2"/>
      <g fill="#c7ccd2"><circle cx="11" cy="23.5" r="1.3"/><circle cx="53" cy="23.5" r="1.3"/><circle cx="22" cy="23.5" r="1.3"/><circle cx="42" cy="23.5" r="1.3"/></g>
      <g><circle cx="20" cy="51" r="6" fill="#2a2c30"/><circle cx="20" cy="51" r="3.6" fill="none" stroke="#a5abb3" stroke-width="2"/><circle cx="44" cy="51" r="6" fill="#2a2c30"/><circle cx="44" cy="51" r="3.6" fill="none" stroke="#a5abb3" stroke-width="2"/></g>`,
    thief: `<path d="M38 26c-6 6-6 22 6 25 11 2 16-9 11-21-2-5-12-8-17-4z" fill="#b08c55"/><path d="M40 24c3-4 9-4 12 0l-2 4h-8z" fill="#8f6e3c"/>
      <path d="M44 33l2 4-2 4 4-1 1 4 2-4 4 1-3-4 2-4-4 2z" fill="#f2c94c"/>
      <path d="M8 22l7 7M40 22l-7 7" stroke="#4f7d34" stroke-width="5" stroke-linecap="round"/>
      <circle cx="24" cy="32" r="14" fill="#6aa84f"/><path d="M10 26c4-14 24-16 29-1-8-5-21-5-29 1z" fill="#5a3a22"/>
      <ellipse cx="18.5" cy="32" rx="3.2" ry="3.6" fill="#fff36a"/><ellipse cx="29.5" cy="32" rx="3.2" ry="3.6" fill="#fff36a"/>
      <circle cx="19" cy="33" r="1.5" fill="#222"/><circle cx="30" cy="33" r="1.5" fill="#222"/>
      <path d="M17 40c4 3 10 3 14 0" stroke="#2c4a1c" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21 41l1 2 1-2M26 41l1 2 1-2" fill="#fff"/>`,
    tracks: `<ellipse cx="32" cy="34" rx="27" ry="21" fill="#6d5233" opacity=".9"/>
      <g fill="#2e2114"><ellipse cx="20" cy="40" rx="5" ry="7"/><circle cx="15" cy="31" r="2"/><circle cx="19.5" cy="29" r="2"/><circle cx="24.5" cy="30.5" r="2"/>
      <ellipse cx="42" cy="28" rx="5" ry="7"/><circle cx="37" cy="19" r="2"/><circle cx="41.5" cy="17" r="2"/><circle cx="46.5" cy="18.5" r="2"/></g>`,
    rune: `<path d="M16 56V20c0-9 7-14 16-14s16 5 16 14v36z" fill="#7d838f"/><path d="M32 6c9 0 16 5 16 14v36H36V6z" fill="#5f6570"/>
      <path d="M16 56h32" stroke="#44494f" stroke-width="3"/><path d="M38 14l-6 8" stroke="#3f444b" stroke-width="2"/>
      <path class="glow" d="M27 46V20h7c5 0 5 9 0 9h-6l9 17" stroke="#7fdcff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    chest: `<path d="M8 26c0-11 9-15 24-15s24 4 24 15z" fill="#a8702f"/><rect x="8" y="25" width="48" height="29" rx="3" fill="#8f5a24"/>
      <rect x="8" y="25" width="48" height="4" fill="#5d3815"/><rect x="28" y="22" width="8" height="12" rx="1.5" fill="#f2c230"/>`,
  };
  // ---------- fortifications & battle pieces ----------
  Object.assign(PIECES, {
    fence: `<path d="M4 38h56M4 48h56" stroke="#5a3616" stroke-width="4" stroke-linecap="round"/>
      <g fill="#9a6838" stroke="#5a3616" stroke-width="1.5"><path d="M8 58V20l5-8 5 8v38z"/><path d="M23 58V16l5-8 5 8v42z"/><path d="M38 58V18l5-8 5 8v40z"/><path d="M52 58V22l4-7 4 7v36z"/></g>
      <path d="M13 30v20M28 26v24M43 28v22" stroke="#7a4d24" stroke-width="1.5"/>
      <path d="M4 38h56" stroke="#3b2410" stroke-width="2" stroke-dasharray="3 9"/>`,
    palisade: `<path d="M3 40h58" stroke="#5a3616" stroke-width="5" stroke-linecap="round"/>
      <g fill="#8a5a2c" stroke="#4a2c12" stroke-width="1.5"><path d="M6 60V18l5-12 5 12v42z"/><path d="M20 60V14l5-12 5 12v46z"/><path d="M34 60V16l5-12 5 12v44z"/><path d="M48 60V18l5-12 5 12v42z"/></g>
      <g fill="#d6dbe1"><path d="M8.5 12l2.5-6 2.5 6z"/><path d="M22.5 8l2.5-6 2.5 6z"/><path d="M36.5 10l2.5-6 2.5 6z"/><path d="M50.5 12l2.5-6 2.5 6z"/></g>
      <g fill="#a32a1c"><circle cx="11" cy="13" r="1.4"/><circle cx="25" cy="9" r="1.4"/><circle cx="53" cy="13" r="1.4"/></g>
      <path d="M2 30l14 6M62 30l-14 6" stroke="#c9ced6" stroke-width="2.5" stroke-linecap="round"/>`,
    tower: `<g stroke="#4a2c12" stroke-width="3" stroke-linecap="round"><path d="M16 62L22 30M48 62L42 30M18 52h28M20 42h24M17 52l27-10M47 52L20 42"/></g>
      <rect x="10" y="22" width="44" height="10" rx="2" fill="#7a4d24" stroke="#4a2c12" stroke-width="1.5"/>
      <g fill="#9a6838"><rect x="12" y="14" width="4" height="10"/><rect x="48" y="14" width="4" height="10"/></g>
      <path d="M6 16L32 2l26 14z" fill="#a6743d" stroke="#4a2c12" stroke-width="1.5"/>
      <path d="M32 2v-2" stroke="#4a2c12" stroke-width="2"/><path d="M32 0h10l-3 3 3 3H32z" fill="#c0392b"/>
      <circle cx="32" cy="19" r="3.5" fill="#ffb347"/>`,
    ballista: `<rect x="10" y="44" width="44" height="8" rx="2" fill="#6b4423"/><g fill="#2a2c30"><circle cx="16" cy="54" r="6"/><circle cx="48" cy="54" r="6"/></g>
      <g fill="none" stroke="#a5abb3" stroke-width="2"><circle cx="16" cy="54" r="3.4"/><circle cx="48" cy="54" r="3.4"/></g>
      <path d="M32 44V30" stroke="#5a3616" stroke-width="5"/><rect x="14" y="26" width="36" height="6" rx="2" fill="#8a5a2c"/>
      <path d="M8 14c8 10 16 14 24 14s16-4 24-14" stroke="#5a3616" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M8 14L32 24 56 14" stroke="#e8dcc0" stroke-width="1.2" fill="none"/>
      <path d="M32 26V4" stroke="#7a4d24" stroke-width="3"/><path d="M28 8l4-7 4 7z" fill="#c9ced6"/>`,
    swall: `<path d="M4 18h10v-8h10v8h16v-8h10v8h10v44H4z" fill="#8b9098"/>
      <g fill="#a9aeb6"><rect x="6" y="20" width="16" height="10" rx="1"/><rect x="26" y="20" width="16" height="10" rx="1"/><rect x="46" y="20" width="12" height="10" rx="1"/>
      <rect x="6" y="33" width="10" height="10" rx="1"/><rect x="19" y="33" width="18" height="10" rx="1"/><rect x="40" y="33" width="18" height="10" rx="1"/>
      <rect x="6" y="46" width="16" height="13" rx="1"/><rect x="26" y="46" width="16" height="13" rx="1"/><rect x="46" y="46" width="12" height="13" rx="1"/></g>
      <path d="M4 18h10v-8h10v8h16v-8h10v8h10" stroke="#5d6168" stroke-width="2" fill="none"/>
      <path d="M30 22l3 4-2 3" stroke="#5d6168" stroke-width="1.2" fill="none"/>`,
    gate: `<path d="M2 62V20C2 8 14 2 32 2s30 6 30 18v42h-9V22c0-8-9-12-21-12S11 14 11 22v40z" fill="#8b9098"/>
      <g fill="#a9aeb6"><rect x="3" y="30" width="7" height="9"/><rect x="54" y="30" width="7" height="9"/><rect x="3" y="44" width="7" height="9"/><rect x="54" y="44" width="7" height="9"/></g>
      <path d="M11 62V24c0-8 9-13 21-13s21 5 21 13v38z" fill="#1d1f24"/>
      <g stroke="#7d8793" stroke-width="3"><path d="M18 62V16M26 62V12M34 62V12M42 62V14M50 62V20"/></g>
      <g stroke="#5d6672" stroke-width="2.5"><path d="M11 30h42M11 44h42M11 56h42"/></g>
      <g fill="#9aa3ad"><path d="M16 62l2 -4 2 4zM24 62l2-4 2 4zM32 62l2-4 2 4zM40 62l2-4 2 4zM48 62l2-4 2 4z"/></g>`,
    loot: `<path d="M8 26c0-12 10-16 24-16s24 4 24 16z" fill="#6c3483"/><rect x="8" y="25" width="48" height="29" rx="3" fill="#5b2c6f"/>
      <rect x="8" y="25" width="48" height="4" fill="#3b1a4d"/><g fill="#f2c230"><rect x="12" y="10" width="5" height="44"/><rect x="47" y="10" width="5" height="44"/></g>
      <circle cx="32" cy="38" r="7" fill="#efe6d0"/><circle cx="29.5" cy="37" r="1.6" fill="#222"/><circle cx="34.5" cy="37" r="1.6" fill="#222"/><path d="M29 42h6" stroke="#222" stroke-width="1.2"/>
      <path d="M14 8l4-6 4 6M42 8l4-6 4 6" fill="#ffe680"/><circle cx="32" cy="18" r="2.5" fill="#ffe680"/>`,
    vault: `<rect x="4" y="6" width="56" height="54" rx="4" fill="#5b5f68"/><rect x="8" y="10" width="48" height="46" rx="3" fill="#7a808a"/>
      <circle cx="32" cy="33" r="18" fill="#4a4f57" stroke="#c9a227" stroke-width="3"/><circle cx="32" cy="33" r="11" fill="#2f3339"/>
      <g stroke="#c9a227" stroke-width="3" stroke-linecap="round"><path d="M32 22v22M21 33h22M24 25l16 16M40 25L24 41"/></g><circle cx="32" cy="33" r="4" fill="#f2c230"/>
      <g class="glow" stroke="#7fdcff" stroke-width="1.6" fill="none"><path d="M12 14l3 4 3-4M46 14v5l4-2.5M12 50l3-4 3 4"/></g>`,
    gems: `<path d="M8 28c0-12 10-16 24-16s24 4 24 16z" fill="#6b7079"/><rect x="8" y="27" width="48" height="27" rx="3" fill="#545962"/>
      <rect x="8" y="27" width="48" height="4" fill="#3b3f46"/>
      <path d="M16 22l5-8 6 8-6 6z" fill="#e74c8b"/><path d="M28 18l6-10 7 10-7 8z" fill="#5fd0ff"/><path d="M41 22l5-7 5 7-5 6z" fill="#7ee08a"/>
      <rect x="28" y="34" width="8" height="10" rx="1.5" fill="#c9a227"/>`,
    prisoner: `<rect x="6" y="8" width="52" height="6" rx="2" fill="#6b4423"/><rect x="6" y="54" width="52" height="6" rx="2" fill="#6b4423"/>
      <circle cx="32" cy="30" r="8" fill="#e6b58c"/><path d="M24 54c0-10 4-14 8-14s8 4 8 14z" fill="#3e6aa3"/>
      <path d="M26 26c2-6 10-6 12 0" fill="#7a4d24"/><circle cx="29" cy="30" r="1.2" fill="#222"/><circle cx="35" cy="30" r="1.2" fill="#222"/>
      <g stroke="#4a2c12" stroke-width="3.5"><path d="M12 14v40M22 14v40M42 14v40M52 14v40"/></g>`,
    goblin: `<path d="M48 6L40 58" stroke="#6b4423" stroke-width="3"/><path d="M45 2l6 2-2 8z" fill="#c9ced6"/>
      <path d="M6 22l9 6M50 22l-9 6" stroke="#4f7d34" stroke-width="6" stroke-linecap="round"/>
      <path d="M16 56c0-10 6-16 12-16s12 6 12 16z" fill="#7a4d24"/>
      <circle cx="28" cy="30" r="13" fill="#6aa84f"/><path d="M15 26c3-11 23-13 27 0-8-5-19-5-27 0z" fill="#3b2410"/>
      <ellipse cx="23" cy="30" rx="3" ry="3.4" fill="#fff36a"/><ellipse cx="33" cy="30" rx="3" ry="3.4" fill="#fff36a"/>
      <circle cx="23.5" cy="31" r="1.4" fill="#222"/><circle cx="33.5" cy="31" r="1.4" fill="#222"/>
      <path d="M22 37c4 2.5 8 2.5 12 0" stroke="#2c4a1c" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M25 38l1 2 1-2M30 38l1 2 1-2" fill="#fff"/>`,
    guard: `<path d="M14 58c0-12 8-18 18-18s18 6 18 18z" fill="#5e6b7c"/>
      <ellipse cx="32" cy="30" rx="12" ry="11" fill="#e6b58c"/>
      <path d="M18 34c2 14 26 14 28 0-4 4-8 6-14 6s-10-2-14-6z" fill="#b5651d"/><path d="M26 36c2 6 10 6 12 0" fill="#9a531a"/>
      <path d="M18 26c0-12 28-12 28 0z" fill="#9aa3ad"/><rect x="17" y="24" width="30" height="5" rx="2" fill="#7d8793"/>
      <path d="M31 12h2v12h-2z" fill="#c9a227"/><path d="M18 22l-6-6M46 22l6-6" stroke="#d6dbe1" stroke-width="3" stroke-linecap="round"/>
      <circle cx="27.5" cy="30" r="1.4" fill="#222"/><circle cx="36.5" cy="30" r="1.4" fill="#222"/>
      <path d="M48 40h10v12c0 4-5 7-5 7s-5-3-5-7z" fill="#c9a227" stroke="#7a5a10" stroke-width="1.5"/>`,
    rubble: `<path d="M6 56c2-10 8-14 14-12 2-8 12-10 16-4 6-4 14-1 16 6 4 0 7 4 7 10z" fill="#6b665f"/>
      <path d="M20 44c2-8 12-10 16-4-6 1-10 4-12 10z" fill="#8a847b"/><path d="M40 50l6-6 4 5z" fill="#57534d"/>
      <path d="M34 50L44 10" stroke="#6b4423" stroke-width="3"/><path d="M41 12l5-10 1 11z" fill="#c9ced6"/>`,
    keyp: `<ellipse cx="32" cy="48" rx="22" ry="8" fill="#7a1f2b"/><ellipse cx="32" cy="46" rx="20" ry="6.5" fill="#a32a3a"/>
      <g class="glow"><circle cx="20" cy="34" r="9" fill="none" stroke="#f2c230" stroke-width="5"/><path d="M28 34h26M46 34v8M52 34v6" stroke="#f2c230" stroke-width="5" stroke-linecap="round"/></g>`,
    trap: `<ellipse cx="32" cy="38" rx="26" ry="16" fill="#5a4428"/><ellipse cx="32" cy="38" rx="20" ry="11" fill="#0b0806"/>
      <g fill="#c9ced6"><path d="M20 40l3-10 3 10z"/><path d="M29 42l3-12 3 12z"/><path d="M38 40l3-10 3 10z"/></g>
      <path d="M8 34c6-4 12-2 16-4M40 30c6 2 10 0 16 4" stroke="#7a9a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  });
  Object.assign(PIECES, {
    chowder: `<ellipse cx="32" cy="58" rx="14" ry="3" fill="#000" opacity=".3"/>
      <path d="M26 6h12v6l2 6c8 4 10 10 10 18v14c0 6-4 8-10 8H24c-6 0-10-2-10-8V36c0-8 2-14 10-18l2-6z" fill="#9fc8c0" opacity=".55" stroke="#3a5a54" stroke-width="1.4"/>
      <path d="M16 36c0-2 4-4 16-4s16 2 16 4v14c0 4-3 6-8 6H24c-5 0-8-2-8-6z" fill="#d89a48"/><path d="M16 36c4 2 28 2 32 0" stroke="#f2c27a" stroke-width="2" fill="none"/>
      <g fill="#f4e2c0"><circle cx="24" cy="42" r="2.2"/><circle cx="36" cy="45" r="2"/><circle cx="30" cy="49" r="1.6"/></g><circle cx="41" cy="40" r="1.8" fill="#6a9a3a"/>
      <rect x="25" y="2" width="14" height="7" rx="2" fill="#8a5a2c" stroke="#4a2a10"/><path d="M20 22c-2 4-3 9-3 13" stroke="#fff" stroke-width="2.4" opacity=".6" fill="none" stroke-linecap="round"/>`,
    coral: `<path d="M8 54c2-8 10-12 24-12s22 4 24 12z" fill="#6f6a62"/>
      <g fill="none" stroke-linecap="round" stroke-width="5"><path d="M24 46V30l-6-8M24 34l7-8M24 26v-8" stroke="#ff7a8a"/><path d="M40 46V24l6-8M40 30l-7-6M46 16l4-6" stroke="#ff9eb0"/><path d="M32 46V36" stroke="#e85d75"/></g>
      <g fill="#ffd1d8"><circle cx="18" cy="21" r="2.4"/><circle cx="31" cy="25" r="2.4"/><circle cx="24" cy="17" r="2.4"/><circle cx="50" cy="9" r="2.4"/><circle cx="33" cy="23" r="2"/></g>`,
    kelp: `<ellipse cx="32" cy="40" rx="26" ry="18" fill="#2a5a3a"/>
      <g fill="none" stroke-linecap="round" stroke-width="4"><path d="M10 40c10-14 20 10 30-6s14 8 16 2" stroke="#4f8a3a"/><path d="M12 48c12-10 18 6 28-4s12 2 14-2" stroke="#6aa84f"/><path d="M16 30c8-6 14 4 22-2s10-4 12 0" stroke="#3d7a32"/></g>
      <circle cx="34" cy="40" r="4" fill="#ffe680"/><path d="M34 34v-2M34 48v-2M28 40h-2M42 40h-2" stroke="#fff3b0" stroke-width="2" stroke-linecap="round"/>`,
    crab: `<g stroke="#b8341f" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M18 40l-10 6M18 44l-8 10M46 40l10 6M46 44l8 10M20 30l-8-10M44 30l8-10"/></g>
      <path d="M6 14c-4 4 0 10 6 8l2-4c-4 0-4-3-2-5z" fill="#e2452a"/><path d="M58 14c4 4 0 10-6 8l-2-4c4 0 4-3 2-5z" fill="#e2452a"/>
      <ellipse cx="32" cy="38" rx="18" ry="12" fill="#e2452a"/><path d="M16 36c4-8 28-8 32 0-8-3-24-3-32 0z" fill="#ff6a4a"/>
      <g fill="#fff"><circle cx="26" cy="26" r="3.6"/><circle cx="38" cy="26" r="3.6"/></g><g fill="#222"><circle cx="26" cy="26" r="1.8"/><circle cx="38" cy="26" r="1.8"/></g>
      <path d="M24 31v-4M40 31v-4" stroke="#b8341f" stroke-width="2"/><circle cx="56" cy="16" r="5" fill="#f6cd45" stroke="#9c6f06" stroke-width="1.5"/>`,
  });
  PIECES.runestone = PIECES.rune;
  // Tougher stumps and richer veins: recoloured variants.
  PIECES.stumpoak = PIECES.stump.replace(/#ddb072/g, '#b98a52').replace(/#b07f45/g, '#6e4018').replace(/#6b4423/g, '#3e2810').replace(/#8c5e2c/g, '#4a2a10');
  PIECES.stumpiron = PIECES.stump.replace(/#ddb072/g, '#8a6a5a').replace(/#b07f45/g, '#3e2a22').replace(/#6b4423/g, '#2a272e').replace(/#4f3217/g, '#1c1a20').replace(/#8c5e2c/g, '#2a1a14')
    + '<path d="M12 28c10-4 30-4 40 0" stroke="#c9d3de" stroke-opacity=".5" stroke-width="1.5" fill="none"/>';
  PIECES.veinsilver = PIECES.vein.replace(/#ff9a3c/g, '#eef3f8').replace(/#ffbe78/g, '#ffffff');
  PIECES.veinstar = PIECES.vein.replace(/#ff9a3c/g, '#a78bfa').replace(/#ffbe78/g, '#e6d8ff')
    + '<path d="M52 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e6d8ff"/>';
  // Chest tiers: recolour the locked chest.
  PIECES.lockedgold = PIECES.locked.replace(/#98a1ab/g, '#f2c230').replace(/#6f7882/g, '#a87b0c').replace(/#7a4b22/g, '#5a2a14').replace(/#8f5a2a/g, '#6e3418').replace(/#e8c34a/g, '#fff3b0')
    + '<g fill="#fff6c0"><path d="M10 14l2-4 2 4-2 4z"/><path d="M52 10l2-4 2 4-2 4z"/></g>';
  PIECES.lockedcrystal = PIECES.locked.replace(/#98a1ab/g, '#7fdcff').replace(/#6f7882/g, '#3a8fd0').replace(/#7a4b22/g, '#3a2a6a').replace(/#8f5a2a/g, '#4b3a8a').replace(/#4b2d12/g, '#241a48').replace(/#5d3815/g, '#2e2260').replace(/#e8c34a/g, '#c9f3ff')
    + '<g fill="#bff0ff"><path d="M6 20l3-7 3 7-3 4z"/><path d="M52 14l3-7 3 7-3 4z"/><path d="M30 6l2-5 2 5-2 3z"/></g>';
  // Key tiers.
  const keyArt = (c1, c2, extra = '') => `<g transform="rotate(-35 32 32)"><circle cx="19" cy="32" r="11" fill="none" stroke="${c2}" stroke-width="7.5"/><circle cx="19" cy="32" r="11" fill="none" stroke="${c1}" stroke-width="5"/>
      <path d="M30 32h27M50 32v10M56 32v8" stroke="${c2}" stroke-width="7.5" stroke-linecap="round"/><path d="M30 32h27M50 32v10M56 32v8" stroke="${c1}" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 27a8 8 0 0 1 8-5" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>${extra}`;
  PIECES.key1 = keyArt('#c98a4a', '#6e4520');
  PIECES.key2 = keyArt('#f6cd45', '#9c6f06', '<g fill="#fff6c0"><path d="M50 8l2-5 2 5-2 4z"/><path d="M8 48l2-4 2 4-2 3z"/></g>');
  PIECES.key3 = keyArt('#a8e6ff', '#3a8fd0', '<g fill="#e8fbff"><path d="M48 6l3-6 3 6-3 5z"/><path d="M6 46l2-5 2 5-2 4z"/><path d="M56 50l2-4 2 4-2 3z"/></g>');
  // Higher-rank enemies.
  PIECES.gbrute = `<path d="M54 8L44 40" stroke="#5a3616" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="8" r="7" fill="#6b4423"/>
      <g fill="#c9ced6"><path d="M54 0l2 4-4 0z"/><path d="M61 8l-4 2 0-4z"/><path d="M47 8l4-2 0 4z"/></g>
      <path d="M8 60c0-14 10-22 24-22s24 8 24 22z" fill="#3e6b2c"/><path d="M14 52h36" stroke="#6b4423" stroke-width="5"/>
      <circle cx="32" cy="30" r="15" fill="#4f8a36"/>
      <path d="M15 24c2-12 32-12 34 0-6-4-28-4-34 0z" fill="#5d6672"/><path d="M15 22c-6-4-10-12-8-18 4 4 8 8 12 12zM49 22c6-4 10-12 8-18-4 4-8 8-12 12z" fill="#e6dcc8"/>
      <ellipse cx="25" cy="31" rx="3.4" ry="3" fill="#ffdf3a"/><ellipse cx="39" cy="31" rx="3.4" ry="3" fill="#ffdf3a"/><circle cx="25" cy="31.5" r="1.5" fill="#300"/><circle cx="39" cy="31.5" r="1.5" fill="#300"/>
      <path d="M24 39c5 3 11 3 16 0" stroke="#1d3312" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M26 39l2 4 2-3M34 39l2 3 2-4" fill="#fff"/>`;
  PIECES.dgiant = `<path d="M54 4L46 56" stroke="#5a3616" stroke-width="4"/><path d="M54 4c8 2 10 10 6 16-4-2-8-6-8-10z M54 4c-8 2-10 10-6 16 4-2 8-6 8-10z" fill="#c9ced6" stroke="#7d8793" stroke-width="1.5"/>
      <path d="M8 62c0-16 10-24 24-24s24 8 24 24z" fill="#c9a227"/><path d="M20 44h24l-4 16H24z" fill="#e8c34a"/><circle cx="32" cy="50" r="4" fill="#7fdcff"/>
      <ellipse cx="32" cy="28" rx="14" ry="12" fill="#e6b58c"/>
      <path d="M16 32c2 18 30 18 32 0-5 5-10 8-16 8s-11-3-16-8z" fill="#8a3a12"/><path d="M24 36c3 10 13 10 16 0" fill="#6e2c0c"/>
      <path d="M16 24c0-16 32-16 32 0z" fill="#d6b03a"/><rect x="15" y="22" width="34" height="5" rx="2" fill="#a87b0c"/>
      <path d="M16 20c-8-4-12-12-10-18 4 6 9 10 14 12zM48 20c8-4 12-12 10-18-4 6-9 10-14 12z" fill="#f1ead8"/>
      <circle cx="26.5" cy="29" r="1.6" fill="#222"/><circle cx="37.5" cy="29" r="1.6" fill="#222"/>`;
  PIECES.wall = PIECES.swall;

  // Wide keeps (3 tiles).
  const WIDE = {
    gkeep: `<rect x="8" y="52" width="176" height="10" rx="3" fill="#3b2410"/>
      <g fill="#6e4521" stroke="#3b2410" stroke-width="1.5"><path d="M4 56V22l5-8 5 8v34z"/><path d="M15 56V26l5-8 5 8v30z"/><path d="M167 56V26l5-8 5 8v30z"/><path d="M178 56V22l5-8 5 8v34z"/></g>
      <rect x="28" y="28" width="136" height="26" fill="#7a4d24"/><g stroke="#55331a" stroke-width="2"><path d="M28 34h136M28 41h136M28 48h136"/></g>
      <path d="M16 31L96 4l80 27z" fill="#8f6a3a" stroke="#4a2c12" stroke-width="2"/><path d="M16 31L96 4v27z" fill="#a57c45"/>
      <g stroke="#6b4c25" stroke-width="2" opacity=".75"><path d="M36 26L96 9M58 30L96 16M154 26L96 9M134 30L96 16"/></g>
      <path d="M86 1l20 10M106 1L86 11" stroke="#3b2410" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M82 54V41a14 14 0 0 1 28 0v13z" fill="#1e1006"/><path d="M96 28v26" stroke="#3b2410" stroke-width="1.5"/>
      <circle cx="96" cy="22" r="5.5" fill="#efe6d0"/><circle cx="94" cy="21.5" r="1.4" fill="#222"/><circle cx="98" cy="21.5" r="1.4" fill="#222"/><path d="M93.5 25h5" stroke="#222" stroke-width="1"/>
      <g class="flame"><rect x="48" y="36" width="9" height="9" rx="1.5" fill="#ffb347"/><rect x="135" y="36" width="9" height="9" rx="1.5" fill="#ffb347"/></g>
      <path d="M40 14v20" stroke="#3b2410" stroke-width="2"/><path d="M40 14h15l-4 5 4 5H40z" fill="#c0392b"/>
      <path d="M152 14v20" stroke="#3b2410" stroke-width="2"/><path d="M152 14h-15l4 5-4 5h11z" fill="#c0392b"/>`,
    hall: `<path d="M0 44L26 8l22 20L96 0l48 28 22-20 26 36v20H0z" fill="#3f434b"/>
      <path d="M26 8l8 10-6 2zM166 8l-8 10 6 2zM96 0l10 10-8 2z" fill="#e9eef5" opacity=".7"/>
      <rect x="18" y="24" width="156" height="36" fill="#8a8f98"/>
      <g stroke="#6a6f78" stroke-width="1.5"><path d="M18 34h156M18 44h156M18 52h156M38 24v10M68 24v10M128 24v10M158 24v10M53 34v10M143 34v10M38 44v8M158 44v8"/></g>
      <path d="M10 25L96 9l86 16z" fill="#646973"/><rect x="10" y="22" width="172" height="5" rx="1" fill="#c3c8cf"/>
      <g fill="#c9ced6"><rect x="56" y="27" width="9" height="33"/><rect x="127" y="27" width="9" height="33"/></g>
      <g fill="#a9aeb6"><rect x="54" y="26" width="13" height="3"/><rect x="125" y="26" width="13" height="3"/></g>
      <path d="M74 60V42a22 22 0 0 1 44 0v18z" fill="#24262b"/>
      <g stroke="#8a929c" stroke-width="2.5"><path d="M82 60V34M90 60V28M98 60V28M106 60V30M114 60V38M74 48h44"/></g>
      <path d="M96 12l-6 6h12z" fill="#c9a227"/>
      <g class="glow" stroke="#7fdcff" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M30 30l4 8 4-8M156 30v8l5-4M92 16h8"/></g>
      <rect x="6" y="58" width="180" height="6" fill="#5b5f68"/>
      <g class="flame"><circle cx="46" cy="40" r="3" fill="#ffb347"/><circle cx="146" cy="40" r="3" fill="#ffb347"/></g>`,
    pkeep: `<rect x="6" y="54" width="180" height="8" rx="3" fill="#4a3a2a"/>
      <g fill="#8a8f98"><rect x="10" y="20" width="30" height="36"/><rect x="152" y="20" width="30" height="36"/></g>
      <g fill="#8a8f98"><rect x="10" y="12" width="8" height="10"/><rect x="21" y="12" width="8" height="10"/><rect x="32" y="12" width="8" height="10"/>
      <rect x="152" y="12" width="8" height="10"/><rect x="163" y="12" width="8" height="10"/><rect x="174" y="12" width="8" height="10"/></g>
      <rect x="40" y="28" width="112" height="28" fill="#a07a4a"/><g stroke="#7a5a32" stroke-width="2"><path d="M40 35h112M40 42h112M40 49h112"/></g>
      <g fill="#a07a4a"><rect x="40" y="20" width="10" height="9"/><rect x="56" y="20" width="10" height="9"/><rect x="72" y="20" width="10" height="9"/><rect x="110" y="20" width="10" height="9"/><rect x="126" y="20" width="10" height="9"/><rect x="142" y="20" width="10" height="9"/></g>
      <path d="M84 56V40a12 12 0 0 1 24 0v16z" fill="#2a1d10"/><path d="M84 46h24" stroke="#7d8793" stroke-width="2"/>
      <path d="M96 4v20" stroke="#3b2410" stroke-width="2.5"/><path d="M96 4h18l-5 5 5 5H96z" fill="#2f6fd0"/><path d="M101 7l3 2-3 2" fill="#f2c230"/>
      <g class="flame"><rect x="21" y="32" width="8" height="10" rx="4" fill="#ffb347"/><rect x="163" y="32" width="8" height="10" rx="4" fill="#ffb347"/></g>`,
  };

  const piece = kind => {
    if (!kind) return '';
    if (kind.startsWith('gear:')) { const [, type, tier] = kind.split(':'); return svg(gearArt(type, +tier)); }
    return WIDE[kind] ? svg(WIDE[kind], '0 0 192 64') : PIECES[kind] ? svg(PIECES[kind]) : '';
  };

  // ---------- board frames ----------
  const FRAME_ART = {
    leafTL: svg(`<path d="M6 6c18 0 30 8 34 22-14 2-30-6-34-22z" fill="#4f8a2a"/><path d="M6 6c4 18 14 30 26 34 2-14-8-28-26-34z" fill="#3d7322"/>
      <path d="M8 8l26 18M8 8l18 26" stroke="#2c5418" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 6c10-2 18 2 22 8-9 3-17 0-22-8z" fill="#6aa83a"/><circle cx="14" cy="30" r="3.4" fill="#c0392b"/><circle cx="19" cy="34" r="3" fill="#a93226"/>`, '0 0 60 60'),
    mushrooms: svg(`<path d="M2 58c10-6 30-8 56-2v6H2z" fill="#3d6b25"/>
      <rect x="12" y="34" width="7" height="20" rx="3" fill="#efe6d0"/><path d="M3 36c0-10 8-16 13-16s13 6 13 16z" fill="#c0392b"/>
      <g fill="#fff"><circle cx="10" cy="30" r="2"/><circle cx="18" cy="26" r="2.2"/><circle cx="23" cy="32" r="1.8"/></g>
      <rect x="35" y="42" width="5" height="13" rx="2" fill="#efe6d0"/><path d="M29 44c0-7 5-11 8.5-11S46 37 46 44z" fill="#d35400"/>
      <path d="M48 56c1-8 3-13 6-16M52 56c0-6 2-9 4-11" stroke="#6aa83a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`, '0 0 60 60'),
    fern: svg(`<path d="M56 58C48 40 34 28 10 22" stroke="#3d7322" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g fill="#5a9a2e"><path d="M48 46l-8-14 2 15z"/><path d="M40 38l-10-11 4 14z"/><path d="M31 32l-11-8 6 12z"/><path d="M22 27l-10-4 7 9z"/>
      <path d="M46 46l12-6-11 9z"/><path d="M38 38l14-5-12 8z"/><path d="M29 32l13-3-12 7z"/></g>`, '0 0 60 60'),
    lantern: svg(`<path d="M30 0v10" stroke="#3a3a3a" stroke-width="2"/><path d="M22 10h16l-2 4H24z" fill="#3b3b3b"/>
      <rect x="21" y="14" width="18" height="24" rx="3" fill="#2b2b2b"/><rect x="24" y="17" width="12" height="18" rx="2" class="flame" fill="#ffb347"/>
      <path d="M30 31c-3-3-2-7 0-10 2 3 3 7 0 10z" fill="#fff1b8"/><path d="M21 38h18l-3 4H24z" fill="#3b3b3b"/>`, '0 0 60 60'),
    rocks: svg(`<path d="M2 60c2-10 8-14 14-12 3-6 10-7 14-2 5-5 12-3 14 3 4-2 10 0 12 11z" fill="#5c544c"/>
      <path d="M16 48c3-6 10-7 14-2-6 2-10 6-12 12z" fill="#7a7168"/><path d="M42 52l4-3 3 4z" fill="#ef8a3c"/><path d="M8 56l3-2 2 3z" fill="#7fdcff"/>`, '0 0 60 60'),
    starfish: svg(`<path d="M30 6l6 16 17 1-13 11 5 17-15-9-15 9 5-17L7 23l17-1z" fill="#ff8a5a"/><g fill="#ffd2b8"><circle cx="30" cy="16" r="1.6"/><circle cx="30" cy="26" r="1.6"/><circle cx="42" cy="26" r="1.4"/><circle cx="18" cy="26" r="1.4"/><circle cx="24" cy="38" r="1.4"/><circle cx="36" cy="38" r="1.4"/></g>`, '0 0 60 60'),
    shells: svg(`<path d="M6 54c0-12 8-20 18-20s18 8 18 20z" fill="#f4d9c6"/><g stroke="#d9a98c" stroke-width="1.6"><path d="M24 34v20M14 38l6 16M34 38l-6 16M8 46l12 8M40 46l-12 8"/></g>
      <path d="M40 58c2-8 8-12 14-10 4 2 4 8 0 10z" fill="#ffd6e0"/><path d="M44 56c1-3 4-5 7-4" stroke="#e8a8b8" stroke-width="1.4" fill="none"/>`, '0 0 60 60'),
    anchor: svg(`<circle cx="30" cy="10" r="5" fill="none" stroke="#5a6470" stroke-width="3.5"/><path d="M30 15v38M20 24h20" stroke="#5a6470" stroke-width="4" stroke-linecap="round"/>
      <path d="M10 38c2 10 10 15 20 15s18-5 20-15" stroke="#5a6470" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M6 40l6-4 2 7zM54 40l-6-4-2 7z" fill="#5a6470"/>`, '0 0 60 60'),
    crystals: svg(`<path d="M14 60l6-26 6 26z" fill="#6ec6ff"/><path d="M20 34l6 26h-6z" fill="#3a8fd0"/>
      <path d="M26 60l4-16 4 16z" fill="#a8e2ff"/><path d="M34 60l7-30 7 30z" fill="#58b4f0"/><path d="M41 30l7 30h-7z" fill="#2f7cc0"/>`, '0 0 60 60'),
  };

  function frame(scene) {
    const A = FRAME_ART;
    if (scene === 'forest') {
      return `<div class="fr-deco tl">${A.leafTL}</div><div class="fr-deco tr">${A.leafTL}</div>
        <div class="fr-deco bl">${A.mushrooms}</div><div class="fr-deco br">${A.fern}</div>`;
    }
    if (scene === 'mine') {
      return `<div class="beam top"></div><div class="beam left"></div><div class="beam right"></div>
        <div class="fr-deco lamp l">${A.lantern}</div><div class="fr-deco lamp r">${A.lantern}</div>
        <div class="fr-deco bl">${A.rocks}</div><div class="fr-deco br">${A.crystals}</div>`;
    }
    if (scene === 'ocean') {
      return `<div class="fr-deco tl">${A.starfish}</div><div class="fr-deco tr">${A.anchor}</div>
        <div class="fr-deco bl">${A.shells}</div><div class="fr-deco br">${A.starfish}</div>`;
    }
    if (scene === 'goblin') return `<div class="stakes">${'<i></i>'.repeat(18)}</div>`;
    if (scene === 'dwarf') return '<div class="arch"></div><div class="fr-deco lamp l">' + A.lantern + '</div><div class="fr-deco lamp r">' + A.lantern + '</div>';
    return '';
  }

  // ---------- scene backgrounds ----------
  const enc = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const pines = (color, y, h, n, seed) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = (i / n) * 400 + ((i * seed) % 23) - 10;
      const hh = h * (0.7 + ((i * 37 + seed) % 10) / 22);
      out += `<path d="M${x} ${y} l${hh * 0.32} ${-hh} l${hh * 0.32} ${hh}z" fill="${color}"/>`;
    }
    return out;
  };
  const SCENES = {
    forest: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${pines('#14301a', 300, 120, 14, 7)}${pines('#0d2212', 300, 80, 18, 13)}<rect y="290" width="400" height="10" fill="#0a1a0d"/></svg>`),
    mine: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMin slice">
      ${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 26} 0 l12 ${30 + (i * 17) % 40} l12 ${-(30 + (i * 17) % 40)}z" fill="#1b1612"/>`).join('')}
      ${Array.from({ length: 10 }, (_, i) => `<circle cx="${(i * 47) % 400}" cy="${80 + (i * 61) % 200}" r="1.6" fill="#7fdcff" opacity=".5"/>`).join('')}</svg>`),
    ocean: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      <circle cx="320" cy="60" r="34" fill="#ffe9a8" opacity=".55"/>
      <path d="M0 230 Q50 215 100 230 T200 230 T300 230 T400 230 V300 H0z" fill="#1d5f8a" opacity=".8"/>
      <path d="M0 255 Q50 240 100 255 T200 255 T300 255 T400 255 V300 H0z" fill="#16486b"/>
      <path d="M0 280 Q50 268 100 280 T200 280 T300 280 T400 280 V300 H0z" fill="#e8d3a2" opacity=".5"/></svg>`),
    goblin: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 14} 300 v-${40 + (i * 13) % 25} l6 -10 l6 10 v${40 + (i * 13) % 25}z" fill="#1d120a"/>`).join('')}</svg>`),
    dwarf: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${Array.from({ length: 12 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${c * 46 + (r % 2) * 23 - 23}" y="${r * 26}" width="44" height="24" fill="#1c1d21" stroke="#141518"/>`).join('')).join('')}</svg>`),
  };

  // ---------- world map ----------
  const trees = (pts, c1, c2) => pts.map(([x, y, h]) => `<path d="M${x} ${y} l${h * 0.42} ${-h} l${h * 0.42} ${h}z" fill="${c1}"/><path d="M${x + h * 0.42} ${y - h} l${h * 0.42} ${h} h${-h * 0.42}z" fill="${c2}"/>`).join('');
  const peaks = (pts, c1, c2, snow) => pts.map(([x, y, w, h]) => `<path d="M${x} ${y} l${w / 2} ${-h} l${w / 2} ${h}z" fill="${c1}"/><path d="M${x + w / 2} ${y - h} l${w / 2} ${h} h${-w / 2}z" fill="${c2}"/>${snow ? `<path d="M${x + w / 2} ${y - h} l${w * 0.12} ${h * 0.24} l${-w * 0.06} ${-h * 0.04} l${-w * 0.06} ${h * 0.06} l${-w * 0.06} ${-h * 0.06} l${-w * 0.04} ${h * 0.04}z" fill="#eef3f8"/>` : ''}`).join('');
  const WORLD = svg(`
    <defs>
      <radialGradient id="wmLand" cx="40%" cy="55%" r="75%"><stop offset="0" stop-color="#7fa65a"/><stop offset="1" stop-color="#4d7438"/></radialGradient>
      <linearGradient id="wmSea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d9ad6"/><stop offset="1" stop-color="#1f5c96"/></linearGradient>
      <radialGradient id="wmLava" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#e2452a"/><stop offset="1" stop-color="#5a1408"/></radialGradient>
    </defs>
    <rect width="360" height="480" fill="url(#wmSea)"/>
    <g opacity=".35" stroke="#bfe6ff" stroke-width="1.6" fill="none">${Array.from({ length: 14 }, (_, i) => `<path d="M${250 + (i % 3) * 30} ${150 + i * 23} q6 -5 12 0 t12 0"/>`).join('')}</g>
    <path d="M0 0H300C280 40 300 80 270 120C240 160 250 200 236 240C222 290 252 330 230 380C214 420 236 450 220 480H0z" fill="#e8d3a2"/>
    <path d="M0 0H292C272 40 292 80 262 120C232 160 242 200 228 240C214 290 244 330 222 380C206 420 228 450 212 480H0z" fill="url(#wmLand)"/>
    <path d="M200 0 C220 40 250 70 300 60 C330 55 350 70 360 90 V0z" fill="#3a2a24"/>
    ${peaks([[214, 96, 70, 70], [262, 100, 80, 92]], '#4a2c22', '#2e1a14')}
    <path d="M296 18 c-6 14 -2 30 6 40 c-12 4 -20 14 -22 26" stroke="url(#wmLava)" stroke-width="7" fill="none" stroke-linecap="round" class="wm-lava"/>
    <circle cx="302" cy="14" r="10" fill="#ffb347" opacity=".6" class="wm-lava"/>
    <path d="M318 70c10-8 22-6 28 2-6-2-12 0-14 4 6 0 10 4 10 8-8-4-16-4-24-2z" fill="#1a0d0a"/>
    ${peaks([[10, 140, 70, 74], [50, 128, 80, 96], [110, 138, 64, 70], [150, 150, 56, 52]], '#7c818b', '#5a5f68', true)}
    <rect x="132" y="112" width="18" height="24" rx="3" fill="#2a2c31" class="wm-site dwarf"/>
    <g opacity=".95">${trees([[14, 300, 40], [40, 286, 46], [70, 300, 38], [96, 282, 44], [24, 330, 42], [56, 328, 48], [88, 330, 40], [120, 318, 42], [36, 360, 40], [72, 360, 44], [106, 356, 38], [140, 300, 36], [150, 340, 34]], '#2f6b32', '#1f5124')}</g>
    <g class="wm-site goblin"><path d="M150 236 l14 -20 l14 20z" fill="#7a4d24"/><path d="M164 216v-12" stroke="#3b2410" stroke-width="2"/><path d="M164 204h10l-3 3 3 3h-10z" fill="#c0392b"/>
      <path d="M140 240 l8 -12 l8 12z M176 240 l8 -12 l8 12z" fill="#6e4521"/></g>
    <path d="M168 400 C150 360 120 340 100 300 M180 392 C190 330 160 250 168 232 M186 396 C200 300 150 200 140 140 M196 398 C230 380 250 360 290 330 M190 392 C230 300 260 180 290 110"
      stroke="#f3e2b6" stroke-width="2.4" stroke-dasharray="4 6" fill="none" opacity=".75"/>
    <g transform="translate(140 384)"><rect x="0" y="0" width="70" height="30" fill="#8a8f98"/><rect x="-6" y="-14" width="18" height="44" fill="#8a8f98"/><rect x="58" y="-14" width="18" height="44" fill="#8a8f98"/>
      <path d="M-6 -14h4v-6h4v6h3v-6h4v6h3M58 -14h4v-6h4v6h3v-6h4v6h3" stroke="#8a8f98" stroke-width="0" fill="#8a8f98"/>
      <rect x="10" y="6" width="50" height="24" fill="#a07a4a"/><path d="M28 30V18a7 7 0 0 1 14 0v12z" fill="#2a1d10"/><path d="M35 -8v18" stroke="#3b2410" stroke-width="2"/><path d="M35 -8h12l-3 3 3 3H35z" fill="#2f6fd0"/></g>
    <g transform="translate(96 420)"><rect x="0" y="10" width="30" height="16" fill="#6b4423"/><path d="M-4 12l19-12 19 12z" fill="#8f5a2a"/><rect x="10" y="-4" width="6" height="10" fill="#4a4e57"/></g>
    <g transform="translate(290 360)"><path d="M0 0h30l-6 10H6z" fill="#7a4d24"/><path d="M14 0v-26" stroke="#5a3616" stroke-width="2"/><path d="M15 -26l12 18H15z" fill="#f3ead2"/></g>
  `, '0 0 360 480');

  function setScene(scene) {
    document.body.dataset.scene = scene || 'home';
    document.body.style.setProperty('--scene-art', SCENES[scene] || 'none');
  }

  return { injectDefs, WORLD, tile, piece, frame, setScene, hasPiece: k => !!PIECES[k] || !!WIDE[k] };
})();
