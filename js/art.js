// Vector art: tile icons, obstacle pieces, board frames and scene backgrounds.
window.Art = (() => {
  const svg = (body, vb = '0 0 64 64') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  // ---------- tiles ----------
  const TILES = {
    wood: `<rect x="8" y="20" width="42" height="25" rx="12" fill="#7a4d24"/><rect x="10" y="21" width="36" height="7" rx="3.5" fill="#a26a35" opacity=".8"/>
      <path d="M15 34h19M18 40h13" stroke="#55331a" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="49" cy="32.5" rx="9.5" ry="12.5" fill="#edc88f"/><ellipse cx="49" cy="32.5" rx="6.3" ry="8.8" fill="none" stroke="#b9854a" stroke-width="1.8"/>
      <ellipse cx="49" cy="32.5" rx="2.8" ry="3.8" fill="#b9854a"/>`,
    stone: `<path d="M11 45 17 23 32 14 48 19 54 40 42 51 21 52Z" fill="#9aa1aa"/><path d="M32 14 48 19 54 40 42 51 36 31Z" fill="#737a83"/>
      <path d="M17 23 32 14 36 31 21 35Z" fill="#d3d8dd"/><path d="M21 35 36 31 42 51 21 52 11 45Z" fill="#868d96"/>`,
    hide: `<path d="M20 11c5 4 19 4 24 0 1 7 5 10 10 12-4 7-4 16-1 25-8-2-13 2-21 4-8-2-13-6-21-4 3-9 3-18-1-25 5-2 9-5 10-12z" fill="#e0a86b"/>
      <path d="M24 19c4 2 12 2 16 0 1 6 3 9 6 11-3 5-3 11-1 16-6-1-9 2-13 3-5-1-8-4-13-3 2-5 2-11-1-16 3-2 5-5 6-11z" fill="#b8793b"/>
      <path d="M27 28c2 1.5 8 1.5 10 0M28 36c2 1.5 6 1.5 8 0" stroke="#8a5424" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    berries: `<path d="M33 9c7 0 13 5 14 10-7 1-12-3-14-10z" fill="#6bb04a"/><path d="M33 10v12" stroke="#3e6b24" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="23" cy="34" r="10" fill="#6b3fa0"/><circle cx="41" cy="33" r="10" fill="#7d4fba"/><circle cx="32" cy="47" r="10" fill="#57308c"/>
      <circle cx="20" cy="30" r="3" fill="#e2d2fa"/><circle cx="38" cy="29" r="3" fill="#e2d2fa"/><circle cx="29" cy="43" r="3" fill="#e2d2fa"/>`,
    leaves: `<path d="M12 52C12 26 29 13 54 10c0 25-13 42-42 42z" fill="#5f8f22"/><path d="M15 50C14 30 30 16 50 13c-1 22-13 35-35 37z" fill="#7aab30"/>
      <path d="M14 51C24 39 35 28 48 17" stroke="#3f6414" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M24 40l-2-9M31 33l-1-9M38 26v-8M27 37l10 1M34 30l9-1" stroke="#3f6414" stroke-width="1.6" stroke-linecap="round"/>`,
    ore: `<path d="M11 45 16 24 31 14 48 18 54 39 42 51 21 52Z" fill="#6e6762"/><path d="M31 14 48 18 54 39 42 51 36 30Z" fill="#544e4a"/>
      <path d="M16 24 31 14 36 30 21 34Z" fill="#8a837d"/>
      <path d="M21 27l7-3 4 6-6 4z" fill="#ef8a3c"/><path d="M38 33l7-2 2 7-7 2z" fill="#f7a256"/><path d="M25 41l6-1 2 5-6 2z" fill="#d8712a"/>
      <path d="M22 27.5l4-1.6M39 33.5l4-1" stroke="#ffd7ad" stroke-width="1.6" stroke-linecap="round"/>`,
    coal: `<path d="M13 41 19 21 36 14 51 25 51 43 36 53 19 51Z" fill="#17181c"/><path d="M36 14 51 25 51 43 38 34Z" fill="#30333a"/>
      <path d="M19 21 36 14 38 34 24 37Z" fill="#44474f"/><path d="M25 23l9-4M41 27l5 4" stroke="#9fb6d6" stroke-width="1.8" stroke-linecap="round"/>`,
    gravel: `<ellipse cx="21" cy="41" rx="10" ry="7.5" fill="#94866d"/><ellipse cx="41" cy="43" rx="11" ry="8" fill="#837660"/>
      <ellipse cx="31" cy="27" rx="9" ry="7" fill="#a6987d"/><ellipse cx="47" cy="26" rx="6" ry="4.6" fill="#8f8269"/><ellipse cx="16" cy="26" rx="5" ry="4" fill="#7f735c"/>
      <path d="M26 24c3-2 7-2 9 0M15 38c3-2 7-2 9 0M36 40c3-2 7-2 9 0" stroke="#d2c6ad" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    bones: `<g fill="#f1ead8"><g transform="rotate(38 32 32)"><rect x="15" y="29" width="34" height="6.5" rx="3"/><circle cx="15" cy="28" r="4.8"/><circle cx="15" cy="36.5" r="4.8"/><circle cx="49" cy="28" r="4.8"/><circle cx="49" cy="36.5" r="4.8"/></g></g>
      <g fill="#ddd3bc"><g transform="rotate(-38 32 32)"><rect x="15" y="29" width="34" height="6.5" rx="3"/><circle cx="15" cy="28" r="4.8"/><circle cx="15" cy="36.5" r="4.8"/><circle cx="49" cy="28" r="4.8"/><circle cx="49" cy="36.5" r="4.8"/></g></g>`,
    gold: `<path d="M9 40c-3-7 2-14 9-15 1-8 10-13 18-10 6-5 16-2 18 6 7 2 9 10 5 16 2 7-4 12-11 11-4 5-13 6-18 2-8 3-17 0-19-6-3-1-3-3-2-4z" fill="#8a5c05"/>
      <path d="M10 37c-2-6 2-12 8-13 1-7 9-11 16-8 5-4 14-2 16 5 6 2 8 9 4 14 2 6-3 10-10 9-4 4-12 5-16 1-7 2-15 0-17-5-2-1-2-2-1-3z" fill="#e0a419"/>
      <path d="M14 33c0-5 4-8 8-8 2-6 9-8 13-5 5-2 11 1 12 6 4 2 4 7 1 9-6-3-13-1-17 2-5-3-12-3-17-4z" fill="#f6cc43"/>
      <path d="M22 27c2-3 6-4 9-3M38 22c3-1 6 0 7 3" stroke="#fff3b8" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="30" cy="31" r="2.2" fill="#fff8d8"/><circle cx="45" cy="34" r="1.6" fill="#fff8d8"/>
      <path d="M24 42c3 1 6 1 8-1M40 44c2-1 4-3 4-5" stroke="#9a6a08" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    star: `<path d="M32 8l7 14.4 15.8 2.2-11.5 11 2.8 15.7L32 43.8 17.9 51.3l2.8-15.7L9.2 24.6 25 22.4z" fill="#fff" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M32 16l3.5 7.4" stroke="#ffe9a8" stroke-width="2.4" stroke-linecap="round"/>`,
  };
  TILES.mushroom = TILES.leaves;
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
  PIECES.runestone = PIECES.rune;
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

  const piece = kind => WIDE[kind] ? svg(WIDE[kind], '0 0 192 64') : PIECES[kind] ? svg(PIECES[kind]) : '';

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
    goblin: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 14} 300 v-${40 + (i * 13) % 25} l6 -10 l6 10 v${40 + (i * 13) % 25}z" fill="#1d120a"/>`).join('')}</svg>`),
    dwarf: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${Array.from({ length: 12 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${c * 46 + (r % 2) * 23 - 23}" y="${r * 26}" width="44" height="24" fill="#1c1d21" stroke="#141518"/>`).join('')).join('')}</svg>`),
  };

  function setScene(scene) {
    document.body.dataset.scene = scene || 'home';
    document.body.style.setProperty('--scene-art', SCENES[scene] || 'none');
  }

  return { tile, piece, frame, setScene, hasPiece: k => !!PIECES[k] || !!WIDE[k] };
})();
