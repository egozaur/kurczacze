// Rysowanie kart, Cudów i Odkryć wg szablonu (44×68 mm): ramka w kolorze kategorii, kolumna kosztu (moneta, potem
// surowce, „lub” + przerywany Ślad), pasek efektu, pole ilustracji z jajkiem Ery, pasek nazwy, tekst i opis klimatyczny.
// Rozmiar karty ustala rodzic (szerokość); wnętrze skaluje się jednostkami cqw.
import { CARDS, WONDERS, TOKENS, RES } from './ki.js';
import { icon, coin, sym, chain, eraEgg, pic, artPic } from './icons.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { esc };
const ERA = ['', 'Era Jajka', 'Era Pisklęcia', 'Era Koguta'];
const res = r => `<span class="kc-res" title="${esc(RES[r])}">${icon(r)}</span>`;
const pill = t => `<span class="kc-pill">${esc(t)}</span>`;
const chip = color => `<span class="kc-chip kc-${color}"></span>`;
const num = n => `<b class="kc-num">${n}</b>`;
const vp = n => `<span class="kc-grp">${icon('feather')}${num(n)}</span>`;
const spurs = n => `<span class="kc-grp">${Array.from({ length: n }, () => icon('spur')).join('')}</span>`;
const slash = '<span class="kc-sl">/</span>';

// Pasek efektu: same ikony (tekst jest niżej).
export function effectHTML(c) {
  const out = [];
  if (c.prod) out.push(`<span class="kc-grp">${c.prod.split('').map(res).join('')}</span>`);
  if (c.choice) out.push(`<span class="kc-grp">${c.choice.split('').map(res).join(slash)}</span>`);
  if (c.fixed) out.push(`<span class="kc-grp">${c.fixed.split('').map(res).join('')}<span class="kc-sl">=</span>${coin(1)}</span>`);
  if (c.sym) out.push(sym(c.sym));
  if (c.shields) out.push(spurs(c.shields));
  if (c.gain) out.push(coin('+' + c.gain));
  switch (c.special) {
    case 'coins_per_brown_grey_1': out.push(`<span class="kc-grp">${coin('+1')}${slash}${chip('brown')}${chip('grey')}</span>`); break;
    case 'coins_per_brown_2': out.push(`<span class="kc-grp">${coin('+2')}${slash}${chip('brown')}</span>`); break;
    case 'coins_per_blue_1': out.push(`<span class="kc-grp">${coin('+1')}${slash}${chip('blue')}</span>`); break;
    case 'coins_per_wonder_3': out.push(`<span class="kc-grp">${coin('+3')}${slash}${icon('wonder')}</span>`); break;
    case 'coins_per_2_cards': out.push(`<span class="kc-grp">${coin('+1')}${slash}${pill('2 karty')}</span>`); break;
    case 'opp_lose_2': out.push(`<span class="kc-grp">${coin('−2')}${pill('rywal')}</span>`); break;
    case 'g_brown_grey': out.push(`<span class="kc-grp">${icon('feather')}${num(1)}${slash}${chip('brown')}${chip('grey')}</span>`); break;
    case 'g_military': out.push(`<span class="kc-grp">${icon('feather')}${num(1)}${slash}${pill('pole')}</span>`); break;
    case 'g_science': out.push(`<span class="kc-grp">${icon('feather')}${num(1)}${slash}${pill('symbol')}</span><span class="kc-grp">${icon('feather')}${num(1)}${slash}${pill('Odkrycie')}</span>`); break;
    case 'g_yellow': out.push(`<span class="kc-grp">${coin('+1')}${slash}${chip('yellow')}</span><span class="kc-grp">${icon('feather')}${num(1)}${slash}${coin(5)}</span>`); break;
    case 'g_wonders': out.push(`<span class="kc-grp">${icon('feather')}${num(3)}${slash}${icon('wonder')}</span>`); break;
    case 'g_blue_all': out.push(`<span class="kc-grp">${icon('feather')}${num(1)}${slash}${chip('blue')}${chip('blue')}</span>`); break;
  }
  if (c.vp) out.push(vp(c.vp));
  if (c.extra_turn) out.push(pill('+ tura'));
  switch (c.special) {
    case 'destroy_yellow': out.push(`<span class="kc-grp">✕${chip('yellow')}</span>`); break;
    case 'steal_4': out.push(`<span class="kc-grp">${coin(4)}${pill('od rywala')}</span>`); break;
    case 'take_token': out.push(pill('Odkrycie')); break;
    case 'steal_brown_grey': out.push(`<span class="kc-grp">↶${chip('brown')}${slash}${chip('grey')}</span>`); break;
  }
  return out.join('');
}

// Kolumna kosztu: moneta z Ziarnami, potem surowce (każda sztuka osobno), „lub” + przerywany Ślad.
export function costHTML(x) {
  let h = '';
  if (x.coins) h += coin(x.coins);
  for (const r of (x.cost || '')) h += `<span class="kc-box">${res(r)}</span>`;
  if (x.chain_from) h += `<span class="kc-lub">lub</span>${chain(x.chain_from, true)}`;
  return h;
}

// Karta. size: 'mini' (układ i Imperium: bez tekstu) albo 'full' (podgląd). extra: dodatkowe klasy/atrybuty.
export function cardHTML(id, size = 'mini', extra = '') {
  const c = CARDS[id];
  const era = c.color === 'purple' ? `Bractwo · ${ERA[3]}` : ERA[c.era];
  const give = c.chain_give ? `<span class="kc-give" title="Zostawia Ślad: ${esc(c.chain_give)}">${chain(c.chain_give)}</span>` : '';
  return `<div class="kc kc-${c.color} kc-${size}" data-card="${id}" ${extra}><div class="kc-in">
    <div class="kc-cost">${costHTML(c)}</div>
    <div class="kc-eff">${effectHTML(c)}</div>
    <div class="kc-art">${art(id)}${eraEgg(c.era)}${size === 'mini' ? give : ''}</div>
    <div class="kc-name"><span>${esc(c.name)}</span></div>
    ${size === 'full' ? `<div class="kc-text"><b>${esc(c.text)}</b><i>${esc(c.flavor)}</i>
      <small>${esc(c.id)} · ${esc(era)}</small>${c.chain_give ? `<span class="kc-givel">${esc(c.chain_give)}${chain(c.chain_give)}</span>` : ''}</div>` : ''}
  </div></div>`;
}

// Ilustracja autora (img/<id>.png) na paskowanym tle pola ilustracji.
const art = id => `<img class="kc-pic" src="${artPic(id)}" alt="" draggable="false" loading="lazy">`;

// Rewers karty w układzie (zakryta): karton, cyfra Ery w kółku u góry (widać ją spod kart niżej), emblemat kurnika.
export function backHTML(era, extra = '') {
  return `<div class="kc kc-back" ${extra}><div class="kc-in"><span class="kb-era">${['', 'I', 'II', 'III'][era] || ''}</span>
    <img class="kb-emb" src="${pic('ui/emblem')}" alt="" draggable="false"></div></div>`;
}

// Kurzy Cud wg wzoru autora (cudnowy.webp): koszt | ilustracja z nazwą na wstędze | efekt. Jeden wygląd w każdym rozmiarze
// (szerokość z --ww). cls: '' | 'built' | 'cant'. Pełny tekst efektu pokazuje podgląd obok.
export function wonderHTML(wid, size = 'mini', extra = '', cls = '') {
  const w = WONDERS[wid];
  const n = (w.cost || '').length;
  return `<div class="kw ${cls}" data-wonder="${wid}" ${extra}><div class="kw-in">
    <div class="kw-cost ${n >= 5 ? 'n5' : ''}">${costHTML({ cost: w.cost })}</div>
    <div class="kw-art">${art(wid)}<div class="kw-name"><span>${esc(w.name)}</span></div></div>
    <div class="kw-eff">${effectHTML(w)}</div>
  </div><span class="kw-stamp">✓ Zbudowany</span></div>`;
}

// Odkrycie: okrągły żeton.
const TOKEN_ICON = {
  sym_waga: () => sym('Waga Ziarna'), wonder_discount: () => `${icon('wonder')}<b class="kc-num">−1</b>`,
  trade_discount: () => `${coin('−1')}`, vp_per_token_2: () => `${icon('feather')}<b class="kc-num">2</b>`,
  chain_bonus: () => chain('Widły', true),
};
export function tokenHTML(tid, extra = '') {
  const t = TOKENS[tid];
  let ic = TOKEN_ICON[t.special] ? TOKEN_ICON[t.special]() : '';
  if (!ic) ic = (t.gain ? coin('+' + t.gain) : '') + (t.shields ? spurs(t.shields) : '') + (t.vp ? vp(t.vp) : '');
  // Ilustracja wypełnia żeton, efekt w małej plakietce na dole.
  return `<div class="kt" data-token="${tid}" title="${esc(t.name)}: ${esc(t.text)}" ${extra}><div class="kt-disc" style="background-image:url('${artPic(tid)}')"><span class="kt-eff">${ic}</span></div><span class="kt-name">${esc(t.name)}</span></div>`;
}
export function tokenFullHTML(tid) {
  const t = TOKENS[tid];
  return `<div class="ktf">${tokenHTML(tid)}<p><b>${esc(t.name)}</b><br>${esc(t.text)}</p></div>`;
}
