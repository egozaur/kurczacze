// Ikony Kurczaczego Imperium (SVG 64×64, płaskie kolory + atramentowy kontur), wg arkusza „styl, szablon karty i ikony”.
// icon(name) zwraca znacznik <svg>. Nazwy: S B Z K L (surowce), coin, feather, spur, nest, symbole Dziobologii
// (pełne nazwy z danych, np. „Lotka i Atrament”) i Ślady Pazurka (np. „Widły”).
const INK = '#2E2118';
const st = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const svg = (body, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;

const P = {
  // ---------- surowce ----------
  S: `<path d="M19 7h26l-9 23 9 27H19l9-27z" fill="#E6C15A" ${st}/><path d="M26 10l4 20M38 10l-4 20M28 34l-3 20M36 34l3 20M32 9v48" stroke="#B88A2E" stroke-width="2" fill="none"/><rect x="23" y="27" width="18" height="8" rx="2" fill="#A8642A" ${st}/>`,
  B: `<path d="M12 40c-4-8 3-15 10-13 2-7 12-9 16-3 6-3 14 2 12 9 6 2 6 11-1 12-6 4-30 4-37-5z" fill="#7A4E2D" ${st}/><circle cx="24" cy="36" r="2.5" fill="#A87449"/><circle cx="38" cy="32" r="2" fill="#A87449"/><circle cx="12" cy="20" r="3.5" fill="#7A4E2D" ${st}/><circle cx="52" cy="22" r="2.5" fill="#7A4E2D" ${st}/>`,
  Z: `<ellipse cx="22" cy="42" rx="12" ry="9" fill="#A9A79E" ${st}/><ellipse cx="42" cy="44" rx="11" ry="8" fill="#C7C4B8" ${st}/><ellipse cx="32" cy="26" rx="10" ry="8" fill="#8F8D84" ${st}/><circle cx="19" cy="41" r="1.6" fill="${INK}"/><circle cx="44" cy="46" r="1.6" fill="${INK}"/><circle cx="34" cy="24" r="1.6" fill="${INK}"/>`,
  K: `<path d="M12 30c0 16 9 26 20 26s20-10 20-26l-6 5-5-8-5 7-5-9-5 9-5-7-5 8z" fill="#F4E7CC" ${st}/><path d="M40 8l5 6-4 3 3 5" fill="none" ${st}/><path d="M34 6l-4 5 4 3" fill="none" ${st}/><circle cx="26" cy="46" r="1.6" fill="#C9874B"/><circle cx="38" cy="42" r="1.6" fill="#C9874B"/>`,
  L: `<path d="M32 6c9 6 11 30 0 52C21 36 23 12 32 6z" fill="#F1C232" ${st}/><path d="M28 18h8M27 26h10M27 34h10M28 42h8M32 10v42" stroke="#C99A16" stroke-width="2" fill="none"/><path d="M32 58C18 50 12 34 16 20c6 8 12 22 16 38zM32 58c14-8 20-24 16-38-6 8-12 22-16 38z" fill="#8FA34A" ${st}/>`,
  // ---------- waluta, punkty, siła ----------
  coin: `<circle cx="32" cy="32" r="26" fill="#D9A13B" ${st}/><circle cx="32" cy="32" r="19" fill="#E8B83A" stroke="#A9741F" stroke-width="2.5"/><path d="M32 18c7 6 7 22 0 28-7-6-7-22 0-28z" fill="#F6D57A" ${st}/>`,
  feather: `<path d="M50 8C30 10 16 26 14 46l6 2C36 44 50 28 50 8z" fill="#E8B83A" ${st}/><path d="M48 11L12 56" fill="none" ${st}/><path d="M38 22l-6 4M33 30l-7 4M28 37l-7 3" stroke="#A9741F" stroke-width="2" fill="none"/>`,
  spur: `<path d="M18 54c2-20 10-38 30-46-6 14-8 30-6 46z" fill="#B5452F" ${st}/><path d="M28 30c4-8 9-13 14-16" stroke="#E07A5F" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="12" y="50" width="38" height="8" rx="3" fill="#7A2E22" ${st}/>`,
  nest: `<ellipse cx="32" cy="40" rx="26" ry="12" fill="#B07A3E" ${st}/><ellipse cx="25" cy="33" rx="7" ry="9" fill="#F4E7CC" ${st}/><ellipse cx="39" cy="33" rx="7" ry="9" fill="#F4E7CC" ${st}/><path d="M10 40c10 4 34 4 44 0M14 46c10 3 26 3 36 0" stroke="#7A4E2D" stroke-width="2" fill="none"/>`,
  card: `<rect x="16" y="8" width="32" height="48" rx="5" fill="#F6EBD3" ${st}/><rect x="16" y="8" width="10" height="48" rx="3" fill="currentColor" ${st}/>`,
  wonder: `<path d="M10 54h44M16 54V30h32v24M12 30l20-18 20 18z" fill="#E8B83A" ${st}/><rect x="27" y="38" width="10" height="16" fill="#F6EBD3" ${st}/>`,
  // ---------- symbole Dziobologii ----------
  'Lotka i Atrament': `<path d="M18 38h22v16H18z" fill="#4A6C8C" ${st}/><rect x="21" y="32" width="16" height="6" rx="2" fill="#2E2118"/><path d="M48 8C38 14 32 26 30 38l3 1c6-10 12-20 15-31z" fill="#F6EBD3" ${st}/><path d="M46 12L31 38" stroke="${INK}" stroke-width="2"/>`,
  'Koło Grzebaka': `<circle cx="32" cy="32" r="22" fill="#C99A5B" ${st}/><circle cx="32" cy="32" r="15" fill="#E7C99A" ${st}/><path d="M32 17v30M17 32h30M21 21l22 22M43 21L21 43" ${st}/><circle cx="32" cy="32" r="5" fill="#7A4E2D" ${st}/>`,
  'Ucieracz Ziarna': `<path d="M10 32h44c0 12-10 20-22 20S10 44 10 32z" fill="#9C9A92" ${st}/><rect x="22" y="50" width="20" height="6" rx="2" fill="#6B6A63" ${st}/><path d="M36 30L50 8" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M36 30L50 8" stroke="#C99A5B" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="29" r="3" fill="#E8B83A" ${st}/><circle cx="29" cy="28" r="3" fill="#E8B83A" ${st}/>`,
  'Grzęda': `<rect x="8" y="16" width="48" height="9" rx="3" fill="#C99A5B" ${st}/><path d="M16 25l-6 28M48 25l6 28M20 25l4 28M44 25l-4 28" ${st}/><path d="M13 40h38" ${st}/>`,
  'Zegar Piania': `<circle cx="32" cy="36" r="20" fill="#F6EBD3" ${st}/><path d="M32 36V24M32 36l8 6" ${st}/><path d="M24 14c0-5 4-8 4-8 1 4 3 4 4 0 1 4 3 4 4 0 0 0 4 3 4 8z" fill="#B5452F" ${st}/><circle cx="32" cy="36" r="2" fill="${INK}"/><path d="M32 18v3M50 36h-3M32 54v-3M14 36h3" ${st}/>`,
  'Jajo Wszechświata': `<path d="M32 6c11 0 18 16 18 28 0 12-8 22-18 22S14 46 14 34C14 22 21 6 32 6z" fill="#2C3E73" ${st}/><ellipse cx="32" cy="36" rx="26" ry="7" fill="none" stroke="#E8B83A" stroke-width="3" transform="rotate(-15 32 36)"/><path d="M26 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM38 44l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#F6EBD3"/>`,
  'Waga Ziarna': `<path d="M32 10v40M20 54h24M12 18h40" ${st}/><path d="M12 18L6 34h12zM52 18l-6 16h12z" fill="none" ${st}/><path d="M5 34h14c0 4-3 6-7 6s-7-2-7-6zM45 34h14c0 4-3 6-7 6s-7-2-7-6z" fill="#E8B83A" ${st}/><circle cx="32" cy="10" r="3" fill="${INK}"/>`,
  // ---------- Ślady Pazurka (sam atrament) ----------
  'Widły': `<path d="M32 58V28M20 10v12c0 6 5 8 12 8s12-2 12-8V10M32 10v18" fill="none" ${st} stroke-width="4"/>`,
  'Łopatka': `<path d="M32 8v24" ${st} stroke-width="4"/><path d="M26 8h12" ${st} stroke-width="4"/><path d="M22 32h20v10c0 8-4 14-10 16-6-2-10-8-10-16z" fill="${INK}"/>`,
  'Kilof': `<path d="M10 26c8-10 36-10 44 0" fill="none" ${st} stroke-width="5"/><path d="M32 18v40" ${st} stroke-width="5"/>`,
  'Dzwonek': `<path d="M18 46c4-4 4-10 4-18 0-6 4-12 10-12s10 6 10 12c0 8 0 14 4 18z" fill="${INK}"/><path d="M14 46h36" ${st} stroke-width="4"/><circle cx="32" cy="52" r="5" fill="${INK}"/><circle cx="32" cy="12" r="4" fill="${INK}"/>`,
  'Wiadro': `<path d="M16 24h32l-4 32H20z" fill="${INK}"/><path d="M16 24c0-14 32-14 32 0" fill="none" ${st} stroke-width="3"/><path d="M20 34h24" stroke="#F6EBD3" stroke-width="3"/>`,
  'Gwizdek': `<path d="M12 26h30a12 12 0 1 1-12 14H18a6 6 0 0 1-6-6z" fill="${INK}"/><circle cx="40" cy="38" r="4" fill="#F6EBD3"/><path d="M12 26v-6h10v6" fill="${INK}"/>`,
  'Latarenka': `<rect x="20" y="16" width="24" height="36" rx="4" fill="${INK}"/><rect x="25" y="22" width="14" height="24" rx="3" fill="#F6EBD3"/><path d="M32 26c4 4 4 10 0 14-4-4-4-10 0-14z" fill="${INK}"/><path d="M26 16v-4h12v4M32 12V6" ${st}/><rect x="18" y="52" width="28" height="5" rx="2" fill="${INK}"/>`,
  'Koszyk': `<path d="M10 28h44l-6 26H16z" fill="${INK}"/><path d="M18 28c0-16 28-16 28 0" fill="none" ${st} stroke-width="4"/><path d="M14 36h36M15 44h34M24 28v26M32 28v26M40 28v26" stroke="#F6EBD3" stroke-width="2"/>`,
  'Kłos': `<path d="M32 60V30" ${st} stroke-width="4"/><g fill="${INK}"><ellipse cx="32" cy="12" rx="4" ry="7"/><ellipse cx="25" cy="22" rx="4" ry="7" transform="rotate(-30 25 22)"/><ellipse cx="39" cy="22" rx="4" ry="7" transform="rotate(30 39 22)"/><ellipse cx="25" cy="33" rx="4" ry="7" transform="rotate(-30 25 33)"/><ellipse cx="39" cy="33" rx="4" ry="7" transform="rotate(30 39 33)"/></g>`,
  'Chorągiewka': `<path d="M18 58V8" ${st} stroke-width="4"/><path d="M20 10h30l-8 10 8 10H20z" fill="${INK}"/>`,
  'Młotek': `<rect x="12" y="10" width="40" height="16" rx="3" fill="${INK}"/><path d="M32 26v32" ${st} stroke-width="7"/>`,
  'Kurtyna': `<path d="M8 8h48" ${st} stroke-width="4"/><path d="M10 10h20c-2 14-8 30-16 46H10zM54 10H34c2 14 8 30 16 46h4z" fill="${INK}"/>`,
  'Trąbka': `<path d="M8 28h8v8H8zM16 30h20l18-12v28L36 34H16z" fill="${INK}"/><path d="M24 34v8h10v-8" fill="none" ${st}/>`,
  'Proca': `<path d="M32 58V34M32 34L16 10M32 34L48 10" fill="none" ${st} stroke-width="6"/>`,
  'Kompas': `<circle cx="32" cy="32" r="22" fill="none" ${st} stroke-width="4"/><path d="M32 12l6 20-6 20-6-20z" fill="${INK}"/><path d="M32 32l6 0-6 20-6-20z" fill="#F6EBD3" ${st} stroke-width="2"/>`,
  'Lunetka': `<path d="M12 46l26-26 8 8-26 26z" fill="${INK}"/><path d="M38 20l6-6 8 8-6 6z" fill="${INK}"/><path d="M20 50l-6 8M24 52v6" ${st}/>`,
};
export const SYMBOLS = ['Lotka i Atrament', 'Koło Grzebaka', 'Ucieracz Ziarna', 'Grzęda', 'Zegar Piania', 'Jajo Wszechświata', 'Waga Ziarna'];

// Ilustracje autora (folder img/): karty, Cuda, Odkrycia po id, surowce R-x, symbole S-0n. Adres liczony od tego modułu,
// więc działa też ze stron w dev/.
const IMG = new URL('img/', import.meta.url).href;
export const pic = id => `${IMG}${id}.png`;
// Ilustracje kart, Cudów i Odkryć (JPG wycięte z arkuszy autora).
export const artPic = id => `${IMG}${id}.jpg`;
const RES_PIC = { S: 'R-S', B: 'R-B', Z: 'R-Z', K: 'R-K', L: 'R-L', coin: 'ui/i-coin', feather: 'ui/i-feather', spur: 'ui/i-spur' };
const LABEL = { S: 'Słoma', B: 'Błoto', Z: 'Żwirek', K: 'Skorupki', L: 'Łuski kukurydzy', coin: 'Ziarna', feather: 'Złote Pióra', spur: 'Ostroga', wonder: 'Kurzy Cud' };
const tip = name => LABEL[name] ? ` title="${LABEL[name]}"` : '';

export function icon(name, cls = '') {
  if (RES_PIC[name]) return `<img class="ico pic ${cls}" src="${pic(RES_PIC[name])}" alt="${LABEL[name] || ''}"${tip(name)} draggable="false">`;
  return P[name] ? svg((LABEL[name] ? `<title>${LABEL[name]}</title>` : '') + P[name], cls) : '';
}

// Moneta z liczbą (koszt/zysk w Ziarnach).
export function coin(n, cls = '') {
  const t = String(n);
  // Grafika monety autora, środek przykryty jasnym kółkiem, żeby cyfra była czytelna.
  return svg(`<title>Ziarna: ${t}</title><image href="${pic('ui/i-coin')}" x="1" y="1" width="62" height="62"/><circle cx="32" cy="32" r="18.5" fill="#F7DC8A" stroke="#A9741F" stroke-width="2"/>
    <text x="32" y="${t.length > 2 ? 40 : 43}" text-anchor="middle" font-family="Fraunces, serif" font-weight="900" font-size="${t.length > 2 ? 22 : t.length > 1 ? 27 : 32}" fill="${INK}">${t}</text>`, 'coin');
}
// Symbol Dziobologii w kółku (na karcie zielonej i na planszy).
export function sym(name, cls = '') {
  const i = SYMBOLS.indexOf(name);
  if (i >= 0) return `<span class="ico sym symp ${cls}" title="Symbol: ${name}" style="background-image:url('${pic('S-0' + (i + 1))}')"></span>`;
  return svg(`<circle cx="32" cy="32" r="29" fill="#F6EBD3" ${st}/><g transform="translate(9 9) scale(.72)">${P[name] || ''}</g>`, 'sym ' + cls);
}
// Ślad Pazurka w kółku: ciągła obwódka = karta go zostawia, przerywana = buduje się z nim za darmo.
export function chain(name, from = false, cls = '') {
  return svg(`<title>${from ? 'Za darmo ze Śladem: ' : 'Ślad Pazurka: '}${name}</title><circle cx="32" cy="32" r="29" fill="#F6EBD3" stroke="${INK}" stroke-width="${from ? 3.5 : 3}" ${from ? 'stroke-dasharray="6 5"' : ''}/><g transform="translate(13 13) scale(.6)">${P[name] || ''}</g>`, 'chain ' + cls);
}
// Jajko Ery z cyfrą rzymską.
export function eraEgg(era, cls = '') {
  const t = ['', 'I', 'II', 'III'][era] || '';
  return svg(`<path d="M32 4c13 0 22 20 22 34 0 13-10 22-22 22S10 51 10 38C10 24 19 4 32 4z" fill="#F6EBD3" ${st}/><text x="32" y="45" text-anchor="middle" font-family="Fraunces, serif" font-weight="900" font-size="${t.length > 2 ? 17 : 22}" fill="${INK}">${t}</text>`, 'egg ' + cls);
}
