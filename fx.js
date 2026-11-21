// Kurczacze Imperium — animacje (wersja 2.0). Nic tu nie decyduje o regułach: porównujemy poprzedni i nowy widok
// z serwera (diff), a potem odgrywamy zdarzenia: kopie kart / Cudów / Odkryć / ziaren lecą po warstwie #fx nad sceną
// (te same współrzędne 1920×1080 co #stage). Scena jest już narysowana w stanie końcowym; elementy, które mają się
// „pojawić” na końcu lotu, są na czas animacji ukryte klasą (marks), ponawianą po każdym przerysowaniu sceny.
// Użycie w app.js: S = snap(); E = diff(stary, nowy); begin(E); render(); play(E, S). reapply() na końcu renderStage().
import { CARDS, DATA } from './ki.js';
import { backHTML } from './cards.js';
import { icon, eraEgg } from './icons.js';

const Q = new URLSearchParams(location.search);
const KEY = 'kurczacze_fx';
export const MODES = [['on', 'wł.'], ['fast', 'szybko'], ['off', 'wył.']];
const ERA = ['', 'Era Jajka', 'Era Pisklęcia', 'Era Koguta'];
const ROMAN = ['', 'I', 'II', 'III'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function mode() {
  if (Q.has('nofx')) return 'off';
  try { const m = localStorage.getItem(KEY); return MODES.some(([k]) => k === m) ? m : 'on'; } catch (e) { return 'on'; }
}
export function setMode(m) {
  try { localStorage.setItem(KEY, m); } catch (e) {}
  if (m === 'off') stop();
  syncBody();
}
const enabled = () => mode() !== 'off' && !reduced.matches && !document.hidden;
const T = ms => Math.round(ms * (mode() === 'fast' ? .5 : 1));
const syncBody = () => document.body.classList.toggle('nofx', mode() === 'off' || reduced.matches);

let stage = null, layer = null, gen = 0, hold = false;
const marks = new Map();   // selektor → klasa (fx-hide / fx-pre / fx-sym)

export function init(st) {
  stage = st;
  layer = document.createElement('div');
  layer.id = 'fx';
  document.body.append(layer);
  syncBody();
}
export function fit() { if (layer && stage) layer.style.transform = stage.style.transform; }
// Nakładka wyboru / końca gry czeka (niewidoczna), aż skończy się animacja ruchu.
export const holding = () => hold;

export function reapply() {
  for (const [sel, cls] of marks) stage.querySelectorAll(sel).forEach(e => e.classList.add(cls));
}
function mark(sel, cls = 'fx-hide') { marks.set(sel, cls); stage.querySelectorAll(sel).forEach(e => e.classList.add(cls)); }
function unmark(sel) {
  const cls = marks.get(sel); marks.delete(sel);
  if (cls) stage.querySelectorAll(sel).forEach(e => e.classList.remove(cls));
}
function release() {
  if (!hold) return;
  hold = false;
  stage.querySelectorAll('.overlay.fx-wait').forEach(o => {
    o.classList.remove('fx-wait');
    if (!o.querySelector('.score')) anim(o, [{ opacity: 0 }, { opacity: 1 }], { dur: 250, fill: 'none' });
  });
}
function stop() {
  gen++;
  if (layer) { layer.getAnimations({ subtree: true }).forEach(a => a.cancel()); layer.innerHTML = ''; }
  for (const sel of [...marks.keys()]) unmark(sel);
  if (stage) stage.querySelectorAll('.track .rooster').forEach(e => { e.style.transform = ''; });
  release();
}

// ---------- pomocnicze ----------
const sleep = ms => new Promise(r => setTimeout(r, T(ms)));
const $$ = sel => stage.querySelector(sel);
const area = p => `.area[data-p="${p}"]`;
const SEL = {
  card: (p, id) => `${area(p)} .empire [data-card="${id}"]`,
  wonder: (p, w) => `${area(p)} .w-grid [data-wonder="${w}"]`,
  token: (p, t) => `${area(p)} .ptokens [data-token="${t}"]`,
  sym: (p, s) => `${area(p)} .symrow [data-sym="${s}"] .sym`,
  slot: i => `.lay .slot[data-i="${i}"] > .kc`,
};
// Prostokąt elementu we współrzędnych sceny (1920×1080), niezależnie od skali okna.
function R(el) {
  const s = stage.getBoundingClientRect(), k = s.width / 1920 || 1, r = el.getBoundingClientRect();
  return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
}
const mid = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const box = (p, s) => ({ x: p.x - s / 2, y: p.y - s / 2, w: s, h: s });
const ptOf = sel => { const e = $$(sel); return e ? mid(R(e)) : { x: 960, y: 540 }; };
const coinEl = p => $$(`${area(p)} [data-coins] b`);
const vpEl = p => $$(`${area(p)} [data-vp] b`);
const coinPt = p => ptOf(`${area(p)} [data-coins] .ico`);
const vpPt = p => ptOf(`${area(p)} [data-vp] .ico`);
const setText = (el, v) => { if (el) el.textContent = v; };
const COINS_PER_VP = DATA.rules.coins_per_vp || 4;
const coinVp = c => Math.floor(c / COINS_PER_VP);            // Pióra za Ziarna (część licznika Piór)
const feathers = n => `${n} ${n === 1 ? 'Pióro' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'Pióra' : 'Piór'}`;
const rnd = (a, b) => a + Math.random() * (b - a);

function ghost(html, r, cls = '') {
  const d = document.createElement('div');
  d.className = 'fx-g ' + cls;
  d.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;--cw:${r.w}px;--ww:${r.w}px;--kt:${r.w}px`;
  d.innerHTML = html;
  layer.append(d);
  return d;
}
function anim(el, kf, o = {}) {
  if (!el) return Promise.resolve();
  return el.animate(kf, { duration: T(o.dur ?? 400), delay: T(o.delay ?? 0), easing: o.ease ?? 'ease', fill: o.fill ?? 'both', iterations: o.iterations ?? 1 }).finished.catch(() => {});
}
// Lot łukiem z prostokąta from do prostokąta to (skalowanie do szerokości celu).
function fly(el, from, to, o = {}) {
  const a = mid(from), b = mid(to), dx = b.x - a.x, dy = b.y - a.y;
  const s = o.scale ?? to.w / from.w, arc = o.arc ?? -90, rot = o.rot ?? 0;
  const y = d => (o.spin ? ` rotateY(${d}deg)` : '');
  return anim(el, [
    { transform: `translate(0px,0px) scale(1) rotate(0deg)${y(0)}` },
    { transform: `translate(${dx * .5}px,${dy * .5 + arc}px) scale(${Math.max(s, 1) * 1.1}) rotate(${rot}deg)${y(360)}`, offset: .45 },
    { transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(0deg)${y(720)}` },
  ], { dur: o.dur ?? 620, delay: o.delay, ease: o.ease ?? 'cubic-bezier(.5,0,.3,1)' });
}
// Licznik „odliczający” do nowej wartości. Przerwany (nowy stan) od razu pokazuje wartość końcową.
function countUp(el, from, to, dur = 600, delay = 0) {
  if (!el || from === to) return;
  const my = gen, t0 = performance.now() + T(delay), D = T(dur);
  el.textContent = from;
  const step = now => {
    if (my !== gen || !el.isConnected) { el.textContent = to; return; }
    const k = Math.max(0, Math.min(1, (now - t0) / D));
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function tag(g, name) {
  const t = document.createElement('span');
  t.className = 'fx-tag';
  t.textContent = name;
  g.append(t);
}
function stamp(el) {
  return anim(el, [{ transform: 'scale(1.16)' }, { transform: 'scale(.94)', offset: .55 }, { transform: 'scale(1)' }], { dur: 320, fill: 'none', ease: 'ease-out' });
}
function ring(r, color = '#2E2118') {
  const g = ghost('', { x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }, 'fx-ring');
  g.style.borderColor = color;
  return anim(g, [{ transform: 'scale(.86)', opacity: .9 }, { transform: 'scale(1.28)', opacity: 0 }], { dur: 480, ease: 'ease-out' }).then(() => g.remove());
}
function popText(t, p, cls = '', w = 140) {
  const g = ghost(`<span>${t}</span>`, { x: p.x - w / 2, y: p.y - 24, w, h: 48 }, 'fx-pop ' + cls);
  return anim(g, [{ transform: 'translateY(10px) scale(.6)', opacity: 0 }, { transform: 'translateY(-14px) scale(1.15)', opacity: 1, offset: .3 }, { transform: 'translateY(-46px) scale(1)', opacity: 0 }], { dur: 1100 }).then(() => g.remove());
}
// Ikonki (ziarna, ostrogi) lecące z punktu do punktu, jedna za drugą.
function spray(ic, n, from, to, o = {}) {
  const k = Math.min(Math.abs(n), o.max ?? 7), S = o.size ?? 34, out = [];
  for (let i = 0; i < k; i++) {
    const g = ghost(icon(ic), box(from, S), 'fx-ic');
    out.push(fly(g, box(from, S), box(to, S), { arc: (o.arc ?? -60) - i * 5, dur: o.dur ?? 520, delay: (o.delay ?? 0) + i * 75, scale: 1 }).then(() => g.remove()));
  }
  return Promise.all(out);
}
const coins = (n, from, to, o) => spray('coin', n, from, to, o);
function rain(n, to) {   // ziarna znikąd (dochód): spadają z góry do panelu
  const out = [];
  for (let i = 0; i < Math.min(n, 7); i++) out.push(coins(1, { x: to.x + rnd(-60, 60), y: to.y - rnd(120, 180) }, to, { arc: -20, dur: 480, delay: i * 80 }));
  return Promise.all(out);
}
function fall(n, from) {   // ziarna stracone: wysypują się z panelu w dół
  const out = [];
  for (let i = 0; i < Math.min(Math.abs(n), 7); i++) {
    const g = ghost(icon('coin'), box(from, 34), 'fx-ic');
    out.push(anim(g, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${rnd(-30, 30)}px,-30px) rotate(${rnd(-90, 90)}deg)`, opacity: 1, offset: .25 },
      { transform: `translate(${rnd(-90, 90)}px,${rnd(160, 240)}px) rotate(${rnd(-300, 300)}deg)`, opacity: 0 }], { dur: 900, delay: i * 70, ease: 'ease-in' }).then(() => g.remove()));
  }
  return Promise.all(out);
}
function ash(r) {   // popiół spalonej karty: przyczernione piórka opadają
  for (let i = 0; i < 12; i++) {
    const s = rnd(14, 30), g = ghost(icon('feather'), { x: r.x + rnd(0, r.w) - s / 2, y: r.y + rnd(0, r.h) - s / 2, w: s, h: s }, 'fx-ic fx-ash');
    anim(g, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 0 }, { opacity: 1, offset: .15 },
      { transform: `translate(${rnd(-70, 70)}px,${rnd(90, 210)}px) rotate(${rnd(-260, 260)}deg)`, opacity: 0 }], { dur: rnd(900, 1400), delay: rnd(150, 500), ease: 'ease-in' }).then(() => g.remove());
  }
}
async function burn(g, r) {
  await anim(g, [{ transform: 'none' }, { transform: 'translateX(5px) rotate(1.5deg)' }, { transform: 'translateX(-5px) rotate(-1.5deg)' },
    { transform: 'translateX(4px) rotate(1deg)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { dur: 340, fill: 'none' });
  g.style.setProperty('--d', T(850) + 'ms');
  g.classList.add('fx-burn');
  ash(r);
  await sleep(850);
  g.remove();
}
// Pęknięcie na dwie połówki, które odpadają (Cud usunięty z gry, zużyty żeton straty).
function crack(g) {
  const h = g.cloneNode(true);
  layer.append(h);
  const out = [[g, -1], [h, 1]].map(([el, side]) => {
    el.style.clipPath = side < 0 ? 'polygon(0 0,52% 0,44% 32%,57% 56%,46% 100%,0 100%)' : 'polygon(52% 0,100% 0,100% 100%,46% 100%,57% 56%,44% 32%)';
    return anim(el, [{ transform: 'none', opacity: 1 }, { transform: `translate(${side * 3}px,0) rotate(${side * 2}deg)`, opacity: 1, offset: .2 },
      { transform: `translate(${side * 8}px,-4px) rotate(${side * 5}deg)`, opacity: 1, offset: .35 },
      { transform: `translate(${side * 50}px,160px) rotate(${side * 30}deg)`, opacity: 0 }], { dur: 900, ease: 'ease-in' }).then(() => el.remove());
  });
  return Promise.all(out);
}
function glow(el, color = '242,207,106', dur = 900, times = 1) {
  return anim(el, [{ boxShadow: `0 0 0 0 rgba(${color},0)` }, { boxShadow: `0 0 0 5px rgba(${color},1), 0 0 26px 10px rgba(${color},.85)`, offset: .5 }, { boxShadow: `0 0 0 0 rgba(${color},0)` }],
    { dur, fill: 'none', ease: 'ease-in-out', iterations: times });   // dur = jedno mrugnięcie
}
function pop(el) {
  return anim(el, [{ transform: 'scale(.3)', filter: 'drop-shadow(0 0 0 #F2CF6A)' }, { transform: 'scale(1.5)', filter: 'drop-shadow(0 0 10px #F2CF6A)', offset: .55 }, { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #F2CF6A)' }], { dur: 520, fill: 'none', ease: 'ease-out' });
}

// ---------- zrzut sceny przed przerysowaniem ----------
export function snap() {
  if (!stage || !layer || stage.classList.contains('hidden') || !enabled()) return null;
  const S = { slots: {}, empire: {}, wonders: {}, board: {}, draft: {}, loss: {}, rooster: null };
  const take = (sel, key, out, pick = el => el) => stage.querySelectorAll(sel).forEach(el => {
    const t = pick(el); if (t) out[key(el)] = { r: R(t), html: t.outerHTML };
  });
  take('.lay .slot[data-i]', el => el.dataset.i, S.slots, el => el.querySelector('.kc'));
  take('.area .empire [data-card]', el => el.dataset.card, S.empire);
  take('.area .kw[data-wonder]', el => el.dataset.wonder, S.wonders);
  take('.board-tokens [data-token]', el => el.dataset.token, S.board, el => el.querySelector('.kt-disc'));   // sam krążek (bez podpisu)
  take('.draft [data-wonder]', el => el.dataset.wonder, S.draft);
  take('.track [data-loss]', el => el.dataset.loss, S.loss);
  const r = $$('.track .rooster');
  if (r) S.rooster = R(r);
  return S;
}

// ---------- co się zmieniło (tylko z widoków serwera) ----------
export function diff(prev, next) {
  const a = prev && prev.game, b = next && next.game, me = next && next.seat;
  if (!b) return null;
  const base = { me, b, names: b.players.map(p => p.name) };
  if (!a) return prev ? { ...base, start: true, fan: b.phase === 'draft' } : null;   // start z poczekalni (nie przy wejściu/odświeżeniu)
  if (a.phase === 'end' && b.phase !== 'end') return { ...base, start: true, fan: b.phase === 'draft' };   // rewanż
  const E = {
    ...base, a, coins: [0, 1].map(p => b.players[p].coins - a.players[p].coins), vp: [0, 1].map(p => b.players[p].vp - a.players[p].vp),
    oldCoins: a.players.map(p => p.coins), oldVp: a.players.map(p => p.vp), newSyms: [[], []], pairs: [[], []],
    reveal: [], freed: [], gone: [], lossUsed: [], boxed: [], track: b.track - a.track,
  };
  // Ruch z układu: karta, która zniknęła z wolnego miejsca.
  const sameEra = !!(a.slots && b.slots && a.era === b.era && a.phase !== 'draft');
  if (a.slots && a.phase !== 'draft') a.slots.forEach((s, i) => {
    if (!s.id || s.taken || (sameEra && !b.slots[i].taken)) return;
    const id = s.id;
    const owner = [0, 1].find(p => b.players[p].cards.includes(id) && !a.players[p].cards.includes(id));
    if (owner != null) { E.move = { kind: 'build', p: owner, id, slot: i, chain: !!(s.price && s.price[owner] && s.price[owner].chain && b.players[owner].coins >= a.players[owner].coins) }; return; }
    const p = a.actor ?? 0;
    const w = b.players[p].wonders.find(x => x.built && !(a.players[p].wonders.find(y => y.id === x.id) || {}).built);
    if (w && !b.discard.includes(id)) E.move = { kind: 'tuck', p, id, slot: i, wonder: w.id };
    else E.move = { kind: 'discard', p, id, slot: i };
  });
  // Pomnik Koguta (zniszczenie żółtej) / Brama Podwórza (przejęcie).
  if (!E.move) for (const q of [0, 1]) for (const id of a.players[q].cards) {
    if (b.players[q].cards.includes(id) || E.move) continue;
    E.move = { kind: b.players[1 - q].cards.includes(id) ? 'steal' : 'destroy', p: 1 - q, from: q, id };
  }
  for (const p of [0, 1]) {
    const A = a.players[p], B = b.players[p];
    const t = B.tokens.find(x => !A.tokens.includes(x));
    if (t && !E.token) E.token = { p, t };
    const cnt = (arr, s) => arr.filter(x => x === s).length;
    for (const s of new Set(B.syms)) {
      if (!cnt(A.syms, s)) E.newSyms[p].push(s);
      else if (cnt(A.syms, s) < 2 && cnt(B.syms, s) >= 2) E.pairs[p].push(s);
    }
    if (a.phase !== 'draft') for (const w of A.wonders) if (!B.wonders.some(x => x.id === w.id)) E.gone.push({ p, w: w.id });
    if (a.phase === 'draft') { const w = B.wonders.find(x => !A.wonders.some(y => y.id === x.id)); if (w) E.pick = { p, w: w.id }; }
  }
  if (sameEra) b.slots.forEach((s, i) => {
    const o = a.slots[i];
    if (s.taken) return;
    if (!o.up && s.up) E.reveal.push(i);
    else if (s.up && !o.free && s.free) E.freed.push(i);
  });
  [0, 1].forEach(v => a.loss[v].forEach((t, j) => { if (!t.used && b.loss[v][j] && b.loss[v][j].used) E.lossUsed.push(`${v}-${t.at}`); }));
  if (b.phase !== 'draft' && b.phase !== 'end' && b.slots && (a.phase === 'draft' || a.era !== b.era)) E.era = b.era;
  if (a.phase === 'draft') {
    const owned = w => b.players.some(p => p.wonders.some(x => x.id === w));
    E.boxed = a.draft.offer.filter(w => !owned(w) && !(b.draft && b.draft.offer.includes(w)));
    E.fan = b.phase === 'draft' && b.draft.offer.some(w => !a.draft.offer.includes(w));
  }
  E.actor = b.actor !== a.actor && b.actor != null ? b.actor : null;
  E.turn = b.actor === me && a.actor !== me && b.phase !== 'end' && !(b.pending && b.pending.p === me);
  if (b.phase === 'end' && a.phase !== 'end') E.end = b.winner || {};
  E.pulse = !!(b.pending && ['token', 'grab'].includes(b.pending.type) && !a.pending);
  E.hold = !!(E.end || (b.pending && !a.pending && (E.move || E.track)));
  const any = E.move || E.token || E.pick || E.boxed.length || E.fan || E.era || E.reveal.length || E.freed.length || E.track || E.gone.length
    || E.lossUsed.length || E.coins.some(Boolean) || E.vp.some(Boolean) || E.newSyms.some(x => x.length) || E.pairs.some(x => x.length) || E.end || E.actor != null;
  return any ? E : null;
}

// ---------- odtwarzanie ----------
export function begin(E) {
  if (!E || !layer) return;
  stop();
  hold = !!(enabled() && E.hold);
}
export async function play(E, S) {
  if (!E || !layer) return;
  if (!enabled()) { release(); return; }
  const my = gen, alive = () => my === gen;
  if (Q.has('local')) {   // tryb deweloperski: dziennik odegranych zdarzeń (dev/shot.html, testy)
    const L = window.__fxLog = window.__fxLog || [];
    L.push({ at: Date.now(), move: E.move && E.move.kind, track: E.track || 0, token: !!E.token, era: E.era || 0, gone: (E.gone || []).length, loss: (E.lossUsed || []).length, end: E.end && E.end.how, reveal: (E.reveal || []).length });
  }
  try { await run(E, S, alive); } catch (e) { console.warn('fx', e); (window.__fxErr = window.__fxErr || []).push(String(e && e.stack || e)); }
  if (alive()) { for (const sel of [...marks.keys()]) unmark(sel); release(); }
}

async function run(E, S, alive) {
  const me = E.me, b = E.b, mv = E.move, cd = (E.coins || [0, 0]).slice();
  const fx = S || { slots: {}, empire: {}, wonders: {}, board: {}, draft: {}, loss: {} };

  // ---- 0. scena „sprzed ruchu” (synchronicznie, zanim przeglądarka narysuje nową) ----
  let mg = null, src = null, from = null;
  if (mv) {
    src = mv.kind === 'destroy' || mv.kind === 'steal' ? fx.empire[mv.id] : fx.slots[mv.slot];
    if (src) {
      mg = ghost(src.html, src.r, 'lift' + (mv.p !== me ? ' opp' : ''));
      if (mv.p !== me) tag(mg, E.names[mv.p]);
    }
    if (mv.kind === 'build' || mv.kind === 'steal') mark(SEL.card(mv.p, mv.id));
    if (mv.kind === 'tuck') mark(SEL.wonder(mv.p, mv.wonder), 'fx-pre');
  }
  const pk = E.pick && fx.draft[E.pick.w], pg = pk ? ghost(pk.html, pk.r, 'lift' + (E.pick.p !== me ? ' opp' : '')) : null;
  if (E.pick) mark(SEL.wonder(E.pick.p, E.pick.w));
  const boxed = (E.boxed || []).filter(w => fx.draft[w]).map(w => ghost(fx.draft[w].html, fx.draft[w].r));
  const tk = E.token && fx.board[E.token.t], tg = tk ? ghost(tk.html, tk.r, 'lift') : null;
  if (E.token) mark(SEL.token(E.token.p, E.token.t));
  const gone = (E.gone || []).filter(x => fx.wonders[x.w]).map(x => ghost(fx.wonders[x.w].html, fx.wonders[x.w].r));
  const losses = (E.lossUsed || []).filter(k => fx.loss[k]).map(k => ghost(fx.loss[k].html, fx.loss[k].r));
  if (E.coins) [0, 1].forEach(p => {
    if (E.coins[p]) setText(coinEl(p), E.oldCoins[p]);
    if (E.vp[p]) setText(vpEl(p), E.oldVp[p]);
    E.newSyms[p].forEach(s => mark(SEL.sym(p, s), 'fx-sym'));
  });
  let roo = null, rooOff = 0;
  if (E.track && S && S.rooster) {
    roo = $$('.track .rooster');
    if (roo) { rooOff = S.rooster.y - R(roo).y; roo.style.transform = `translateY(${rooOff}px)`; }
  }
  const backs = (E.reveal || []).map(i => {
    const el = $$(SEL.slot(i)); if (!el) return null;
    const g = ghost(backHTML(b.era), R(el));
    mark(SEL.slot(i));
    return [i, g];
  }).filter(Boolean);
  if (E.era) mark('.board .lay');
  if (E.fan) mark('.draft .offer');

  // ---- 1. sam ruch ----
  if (mv && mg) {
    await sleep(mv.p !== me ? 650 : 60);   // ruch rywala: najpierw widać, którą kartę wziął
    if (!alive()) return;
    if (mv.kind === 'build' || mv.kind === 'steal') {
      const tSel = SEL.card(mv.p, mv.id), tgt = $$(tSel);
      if (mv.kind === 'build' && cd[mv.p] < 0) {
        coins(cd[mv.p], coinPt(mv.p), mid(src.r));
        countUp(coinEl(mv.p), E.oldCoins[mv.p], b.players[mv.p].coins, 500);
        cd[mv.p] = 0;
      }
      if (mv.chain) chainTrail(b, mv.p, mv.id, src.r);
      if (tgt) await fly(mg, src.r, R(tgt), { arc: -120, rot: mv.p === me ? -5 : 5, dur: 700 });
      if (!alive()) return;
      mg.remove(); unmark(tSel);
      if (tgt) { stamp(tgt); ring(R(tgt)); from = R(tgt); }
    } else if (mv.kind === 'tuck') {
      const wSel = SEL.wonder(mv.p, mv.wonder), wEl = $$(wSel);
      if (cd[mv.p] < 0) {
        coins(cd[mv.p], coinPt(mv.p), mid(src.r));
        countUp(coinEl(mv.p), E.oldCoins[mv.p], b.players[mv.p].coins, 500);
        cd[mv.p] = 0;
      }
      if (wEl) {
        const wr = R(wEl), cw = wr.h * .6, to = { x: wr.x + wr.w / 2 - cw / 2, y: wr.y + wr.h * .12, w: cw, h: cw * 68 / 44 };
        await fly(mg, src.r, to, { arc: -90, dur: 640 });
        await anim(mg, [{ opacity: 1 }, { opacity: 0 }], { dur: 200 });
        if (!alive()) return;
        mg.remove(); unmark(wSel);
        await wonderBuilt(wEl);
        from = wr;
      } else mg.remove();
      if (gone.length) { await sleep(150); await Promise.all(gone.map(crack)); }
    } else {   // odrzut / zniszczenie: spalenie
      await burn(mg, src.r);
      if (mv.kind === 'discard' && cd[mv.p] > 0) {
        const p0 = mid(src.r);
        popText('+' + cd[mv.p], p0);
        coins(cd[mv.p], p0, coinPt(mv.p), { delay: 150 });
        countUp(coinEl(mv.p), E.oldCoins[mv.p], b.players[mv.p].coins, 600, 350);
        cd[mv.p] = 0;
        await sleep(450);
      }
    }
  } else if (mg) mg.remove();
  if (!alive()) return;

  // Draft: wybrany Cud leci do siatki gracza, odrzucony 5. odpływa „do pudełka”.
  if (E.pick) {
    const tSel = SEL.wonder(E.pick.p, E.pick.w), tgt = $$(tSel);
    if (pg && tgt) { await sleep(E.pick.p !== me ? 450 : 40); await fly(pg, pk.r, R(tgt), { arc: E.pick.p === me ? 60 : -60, dur: 650 }); }
    if (!alive()) return;
    if (pg) pg.remove();
    unmark(tSel);
    if (tgt) stamp(tgt);
    if (boxed.length) await Promise.all(boxed.map(g => anim(g, [{ transform: 'none', opacity: 1 }, { transform: 'translate(560px,-40px) rotate(24deg) scale(.6)', opacity: 0 }], { dur: 620, ease: 'ease-in' }).then(() => g.remove())));
  }
  // Odkrycie: z planszy do panelu gracza, obracając się jak moneta.
  if (E.token) {
    const tSel = SEL.token(E.token.p, E.token.t), tgt = $$(tSel);
    if (tg && tgt) await fly(tg, tk.r, R(tgt), { arc: -110, spin: true, dur: 820 });
    if (!alive()) return;
    if (tg) tg.remove();
    unmark(tSel);
    if (tgt) { stamp(tgt); ring(R(tgt), '#E8B83A'); from = from || R(tgt); }
  }

  // ---- 2a. Kogut Bojowy ----
  if (roo) {
    const n = Math.abs(E.track);
    if (from) { await spray('spur', n, mid(from), mid(R(roo)), { arc: -80, dur: 500, size: 30 }); if (!alive()) return; }
    const kf = [];
    for (let k = 0; k <= n; k++) {
      kf.push({ transform: `translateY(${rooOff * (1 - k / n)}px) scale(1)`, offset: k / n });
      if (k < n) kf.push({ transform: `translateY(${rooOff * (1 - (k + .5) / n) - 18}px) scale(1.16)`, offset: (k + .5) / n });
    }
    roo.style.transform = '';
    await anim(roo, kf, { dur: 280 * n, fill: 'none', ease: 'linear' });
    if (!alive()) return;
    ring(R(roo), '#9C7A4E');
    if (losses.length) losses.forEach(crack);
    if (E.end && E.end.how === 'military') await crow(roo, E);
  }

  // ---- 2b. równolegle: Ziarna, Pióra, symbole Nauki, odsłanianie kart ----
  const par = [];
  const done = [false, false];
  for (const p of [0, 1]) {
    if (!cd[p] || done[p]) continue;
    const o = 1 - p;
    if (cd[p] < 0 && cd[o] > 0) {   // przejęcie ziaren od rywala
      par.push(coins(cd[o], coinPt(p), coinPt(o)));
      countUp(coinEl(p), E.oldCoins[p], b.players[p].coins, 600);
      countUp(coinEl(o), E.oldCoins[o], b.players[o].coins, 600, 300);
      done[o] = true;
    } else if (cd[p] > 0) { par.push(rain(cd[p], coinPt(p))); countUp(coinEl(p), E.oldCoins[p], b.players[p].coins, 600, 250); }
    else { par.push(fall(cd[p], coinPt(p))); countUp(coinEl(p), E.oldCoins[p], b.players[p].coins, 600); }
    done[p] = true;
  }
  if (E.vp) [0, 1].forEach(p => {
    if (!E.vp[p]) return;
    countUp(vpEl(p), E.oldVp[p], b.players[p].vp, 700, 250);
    // Licznik Piór to bieżąca suma punktów, a w niej 1 Pióro za każde 4 Ziarna. Gdy cała zmiana bierze się z Ziaren
    // (np. odrzucenie karty), pióro wylatuje z licznika Ziaren i jest podpisane, skąd się wzięło.
    const cv = coinVp(b.players[p].coins) - coinVp(E.oldCoins[p]);
    if (cv && cv === E.vp[p]) {
      const to = vpPt(p);
      par.push(sleep(300).then(() => popText(cv > 0 ? `+${feathers(cv)} za Ziarna` : `−${feathers(-cv)}: mniej Ziaren`, { x: to.x + 180, y: to.y + 6 }, 'small', 240)));   // na prawo od licznika, nie na wstędze z imieniem
      if (cv > 0) par.push(spray('feather', cv, coinPt(p), to, { arc: -50, dur: 600, delay: 450, size: 36 }));
      return;
    }
    if (E.vp[p] > 0) {
      const to = vpPt(p), g = ghost(icon('feather'), box({ x: to.x + 20, y: to.y - 110 }, 36), 'fx-ic');
      par.push(anim(g, [{ transform: 'translate(0,0) rotate(-40deg)', opacity: 0 }, { transform: 'translate(-30px,50px) rotate(30deg)', opacity: 1, offset: .5 }, { transform: 'translate(-20px,110px) rotate(0deg)', opacity: .2 }], { dur: 750, ease: 'ease-in' }).then(() => g.remove()));
    }
  });
  if (E.newSyms) [0, 1].forEach(p => {
    E.newSyms[p].forEach((s, k) => par.push(sleep(150 + k * 120).then(() => { unmark(SEL.sym(p, s)); return pop($$(SEL.sym(p, s))); })));
    E.pairs[p].forEach(s => par.push(sleep(200).then(() => {
      const el = $$(SEL.sym(p, s));
      return Promise.all([anim(el, [{ transform: 'rotate(0)' }, { transform: 'rotate(-18deg) scale(1.3)' }, { transform: 'rotate(16deg) scale(1.3)' }, { transform: 'rotate(-8deg) scale(1.1)' }, { transform: 'none' }], { dur: 600, fill: 'none' }), glow(el, '242,207,106', 600, 2)]);
    })));
  });
  if (E.pulse) par.push(glow($$('.board-tokens'), '242,207,106', 700, 3));
  backs.forEach(([i, g], k) => par.push(flip(i, g, k)));
  (E.freed || []).forEach(i => { const el = $$(SEL.slot(i)); if (el) par.push(sleep(300).then(() => glow(el, '150,210,90', 800, 1))); });
  await Promise.all(par);
  if (!alive()) return;
  if (E.end && E.end.how === 'science' && E.end.p != null) await scienceWin(E.end.p);

  // ---- 3. nowa Era / draft: rozdanie ----
  if (E.era) {
    await eraBanner(E.era);
    if (!alive()) return;
    unmark('.board .lay');
    await deal();
  }
  if (E.fan) { unmark('.draft .offer'); await fanIn(); }
  if (!alive()) return;

  // ---- 4. tura / nakładki / koniec gry ----
  release();
  if (E.actor != null) bounce($$(`${area(E.actor)} .ribbon`));
  if (E.turn && !E.end) yourTurn(b.phase === 'draft' ? 'Wybierz Cud!' : 'Twój ruch!');
  if (E.end) await endAnim(E, alive);
}

// Ślad Pazurka: karta dająca Ślad błyska złotem, a od niej biegną złote odciski do budowanej karty.
function chainTrail(b, p, id, to) {
  const need = CARDS[id].chain_from;
  const sid = need && b.players[p].cards.find(c => c !== id && CARDS[c].chain_give === need);
  const el = sid && $$(SEL.card(p, sid));
  if (!el) return;
  glow(el, '242,207,106', 900, 1);
  const a = mid(R(el)), z = mid(to);
  for (let k = 1; k <= 8; k++) {
    const t = k / 9, x = a.x + (z.x - a.x) * t, y = a.y + (z.y - a.y) * t - Math.sin(t * Math.PI) * 60;
    const g = ghost('', box({ x, y }, 14), 'fx-paw');
    anim(g, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.2)', offset: .3 }, { opacity: 0, transform: 'scale(.8)' }], { dur: 600, delay: k * 60 }).then(() => g.remove());
  }
}
async function wonderBuilt(el) {
  const st = el.querySelector('.kw-stamp');
  ring(R(el), '#E8B83A');
  anim(el, [{ filter: 'grayscale(1) brightness(.9)' }, { filter: 'grayscale(0) brightness(1.3)', offset: .5 }, { filter: 'grayscale(0) brightness(1)' }], { dur: 900, fill: 'none' });
  glow(el, '242,207,106', 900, 1);
  if (st) await anim(st, [{ transform: 'translate(-50%,-50%) rotate(-12deg) scale(3)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotate(-12deg) scale(.9)', opacity: 1, offset: .75 },
    { transform: 'translate(-50%,-50%) rotate(-12deg) scale(1)', opacity: 1 }], { dur: 450, delay: 350, fill: 'backwards', ease: 'ease-in' });
  else await sleep(800);
}
async function flip(i, g, k) {
  await sleep(250 + k * 90);
  await anim(g, [{ transform: 'perspective(700px) rotateY(0deg)' }, { transform: 'perspective(700px) rotateY(90deg)' }], { dur: 170, ease: 'ease-in' });
  g.remove();
  unmark(SEL.slot(i));
  const el = $$(SEL.slot(i));
  await anim(el, [{ transform: 'perspective(700px) rotateY(-90deg)' }, { transform: 'perspective(700px) rotateY(0deg) translateY(-10px)', offset: .7 }, { transform: 'perspective(700px) rotateY(0deg) translateY(0)' }], { dur: 300, fill: 'none', ease: 'ease-out' });
}
async function crow(roo, E) {
  const r = R(roo), win = E.end.p;
  const g = ghost('<span>KUKURYKU!</span>', { x: r.x + r.w - 6, y: r.y - 52, w: 190, h: 50 }, 'fx-crow');
  anim(g, [{ transform: 'scale(.2) rotate(-10deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(3deg)', opacity: 1, offset: .3 }, { transform: 'scale(1) rotate(0)', opacity: 1, offset: .85 }, { opacity: 0 }], { dur: 1700 }).then(() => g.remove());
  anim(roo, [{ transform: 'none' }, { transform: 'rotate(-14deg) scale(1.25)' }, { transform: 'rotate(10deg) scale(1.25)' }, { transform: 'rotate(-6deg) scale(1.15)' }, { transform: 'none' }], { dur: 700, fill: 'none' });
  const nest = $$(`.track .nest.${win === E.me ? 'top' : 'bot'}`);
  await anim(nest, [{ transform: 'none' }, { transform: 'translateX(-6px) rotate(-3deg)' }, { transform: 'translateX(6px) rotate(3deg)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { dur: 700, fill: 'none', delay: 250 });
  await sleep(500);
}
async function scienceWin(p) {
  const els = [...stage.querySelectorAll(`${area(p)} .symrow .sym.have`)];
  await Promise.all(els.map((el, k) => sleep(k * 140).then(() => Promise.all([pop(el), glow(el, '242,207,106', 700, 1)]))));
  await sleep(300);
}
async function eraBanner(era) {
  const half = side => `<div class="fx-half ${side}">${eraEgg(0)}</div>`;
  const g = ghost(`<div class="fx-era-in"><div class="fx-egg"><span class="fx-num">${ROMAN[era]}</span>${half('l')}${half('r')}</div>
    <div class="fx-era-t"><small>Nadchodzi</small><b>${ERA[era]}</b></div></div>`, { x: 777 - 380, y: 470, w: 760, h: 190 }, 'fx-era');
  await anim(g, [{ transform: 'translateX(-1100px) rotate(-4deg)', opacity: 0 }, { transform: 'translateX(30px) rotate(1deg)', opacity: 1, offset: .8 }, { transform: 'none', opacity: 1 }], { dur: 480, ease: 'ease-out' });
  const egg = g.querySelector('.fx-egg'), [l, r] = g.querySelectorAll('.fx-half'), num = g.querySelector('.fx-num');
  await anim(egg, [{ transform: 'none' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], { dur: 480, fill: 'none' });
  anim(l, [{ transform: 'none', opacity: 1 }, { transform: 'translate(-44px,30px) rotate(-38deg)', opacity: 0 }], { dur: 520, ease: 'ease-in' });
  anim(r, [{ transform: 'none', opacity: 1 }, { transform: 'translate(44px,30px) rotate(38deg)', opacity: 0 }], { dur: 520, ease: 'ease-in' });
  await anim(num, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { dur: 480, delay: 80 });
  await sleep(550);
  await anim(g, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(1100px) rotate(4deg)', opacity: 0 }], { dur: 420, ease: 'ease-in' });
  g.remove();
}
// Rozdanie nowej Ery: karty lecą z jednej talii (nad środkiem układu) na miejsca, rząd po rzędzie.
function deal() {
  const slots = [...stage.querySelectorAll('.board .lay .slot')], deck = { x: 777, y: 400 };
  return Promise.all(slots.map((el, k) => {
    const c = mid(R(el));
    return anim(el, [{ transform: `translate(${deck.x - c.x}px,${deck.y - c.y}px) rotate(${rnd(-25, 25)}deg) scale(.5)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { dur: 380, delay: k * 40, fill: 'backwards', ease: 'cubic-bezier(.2,.8,.3,1.1)' });
  }));
}
function fanIn() {
  const ws = [...stage.querySelectorAll('.draft .offer .kw')], n = ws.length;
  return Promise.all(ws.map((el, k) => anim(el, [{ transform: `translateY(-320px) rotate(${(k - (n - 1) / 2) * 14}deg) scale(.55)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
    { dur: 520, delay: k * 110, fill: 'backwards', ease: 'cubic-bezier(.2,.8,.3,1.15)' })));
}
function bounce(el) {
  return anim(el, [{ transform: 'none' }, { transform: 'translateY(-12px)', offset: .3 }, { transform: 'none', offset: .55 }, { transform: 'translateY(-5px)', offset: .75 }, { transform: 'none' }], { dur: 600, fill: 'none' });
}
function yourTurn(text) {
  const g = ghost(`<span>${text}</span>`, { x: 777 - 270, y: 525, w: 540, h: 110 }, 'fx-turn');
  anim(g, [{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .2 }, { transform: 'scale(1)', opacity: 1, offset: .3 }, { transform: 'scale(1)', opacity: 1, offset: .78 }, { transform: 'translateY(-30px) scale(.95)', opacity: 0 }], { dur: 1400 }).then(() => g.remove());
}
const CROWN = `<svg viewBox="0 0 64 50"><path d="M6 40 4 12l14 12L32 5l14 19 14-12-2 28z" fill="#E8B83A" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/>
  <rect x="5" y="38" width="54" height="8" rx="2" fill="#C48F2C" stroke="#2E2118" stroke-width="3"/><circle cx="32" cy="27" r="4.5" fill="#B5452F" stroke="#2E2118" stroke-width="2"/>
  <circle cx="4" cy="11" r="3" fill="#F6EBD3" stroke="#2E2118" stroke-width="2"/><circle cx="32" cy="4" r="3" fill="#F6EBD3" stroke="#2E2118" stroke-width="2"/><circle cx="60" cy="11" r="3" fill="#F6EBD3" stroke="#2E2118" stroke-width="2"/></svg>`;
// Koniec gry: wiersze wyniku wjeżdżają po kolei, liczby odliczają się, zwycięzca dostaje koronę i deszcz piór.
async function endAnim(E, alive) {
  const ov = $$('.overlay'); if (!ov) return;
  const dlg = ov.querySelector('.dialog'), w = E.end;
  anim(ov, [{ opacity: 0 }, { opacity: 1 }], { dur: 300, fill: 'none' });
  anim(dlg, [{ transform: 'scale(.7) rotate(-2deg)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }], { dur: 480, fill: 'backwards' });
  const rows = [...ov.querySelectorAll('.score tr')];
  rows.forEach((tr, i) => {
    const d = 450 + i * 240;
    anim(tr, [{ opacity: 0 }, { opacity: 1 }], { dur: 250, delay: d, fill: 'backwards' });
    tr.querySelectorAll('td').forEach(td => { const n = Number(td.textContent); if (td.textContent.trim() && Number.isFinite(n)) countUp(td, 0, n, 450, d); });
  });
  await sleep(450 + rows.length * 240 + 250);
  if (!alive() || !dlg.isConnected) return;
  if (w.p == null || w.p === E.me) {
    const s = document.createElement('span');
    s.className = 'fx-seal';
    s.innerHTML = CROWN;
    dlg.append(s);
    anim(s, [{ transform: 'translateY(-60px) scale(2.6) rotate(-20deg)', opacity: 0 }, { transform: 'scale(.9) rotate(4deg)', opacity: 1, offset: .75 }, { transform: 'none', opacity: 1 }], { dur: 500, ease: 'ease-in' });
    featherRain(42);
  } else featherRain(1, true);
}
function featherRain(n, sad = false) {
  for (let i = 0; i < n; i++) {
    const s = sad ? 46 : rnd(26, 46), x = sad ? 960 : rnd(40, 1880);
    const g = ghost(icon('feather'), { x: x - s / 2, y: -70, w: s, h: s }, 'fx-ic' + (sad ? ' fx-sad' : ''));
    const sway = sad ? 120 : rnd(-140, 140);
    anim(g, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: `translate(${sway}px,380px) rotate(${rnd(-120, 120)}deg)`, offset: .33 },
      { transform: `translate(${-sway}px,760px) rotate(${rnd(-200, 200)}deg)`, offset: .66 }, { transform: `translate(${sway / 2}px,1180px) rotate(${rnd(-300, 300)}deg)` }],
      { dur: sad ? 5200 : rnd(2600, 4000), delay: sad ? 200 : rnd(0, 1500), ease: 'linear', fill: 'backwards' }).then(() => g.remove());
  }
}
