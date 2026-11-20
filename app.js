// Kurczacze Imperium — ekran gry. Stan przychodzi z serwera (KI.Game → view); tu tylko rysowanie i kliknięcia.
// Ekrany: menu (brak #KODU) → dołączanie (nick) → poczekalnia (game = null) → stół (scena 1920×1080 skalowana do okna).
import * as KI from './ki.js';
import { icon, coin, sym, chain, SYMBOLS } from './icons.js';
import { cardHTML, backHTML, wonderHTML, tokenHTML, tokenFullHTML, effectHTML, costHTML, esc } from './cards.js';
import { rulesHTML, legendHTML } from './help.js';

const $ = id => document.getElementById(id);
const $screen = $('screen'), $stage = $('stage');
let G = null, V = null, gotAt = 0, status = '';
const ui = { sel: null, hover: null, pin: null, toast: null, tab: 'karta', tuck: false, dlg: null };
const COLORS = ['brown', 'grey', 'yellow', 'red', 'blue', 'green', 'purple'];
const HOW = { military: 'zwycięstwo militarne', science: 'zwycięstwo naukowe', civil: 'zwycięstwo cywilne' };
const APP = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ---------- tło: pergamin z bladym sianem (jak na makiecie) ----------
(function hay() {
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cols = ['#C9A46A', '#D8B983', '#B99662', '#E2C893'];
  let h = '';
  for (let i = 0; i < 70; i++) {
    const x = r() * 320, y = r() * 320, len = 30 + r() * 80, a = (r() - .5) * 2.6 + (r() < .5 ? 0 : Math.PI);
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, bend = (r() - .5) * 18;
    const sw = (1.5 + r() * 2).toFixed(1), op = (.12 + r() * .16).toFixed(2), col = cols[i % cols.length];
    // Każde źdźbło rysowane 9 razy (przesunięcia o kafelek), żeby kafelek łączył się bez szwów.
    for (const dx of [-320, 0, 320]) for (const dy of [-320, 0, 320]) {
      const f = n => n.toFixed(1);
      h += `<path d="M${f(x + dx)} ${f(y + dy)} Q${f((x + x2) / 2 + bend + dx)} ${f((y + y2) / 2 - bend + dy)} ${f(x2 + dx)} ${f(y2 + dy)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" fill="none" opacity="${op}"/>`;
    }
  }
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">${h}</svg>`)}")`;
  document.body.style.backgroundImage = `radial-gradient(ellipse at center, rgba(250,238,208,.6), rgba(150,104,48,.32) 92%), ${url}`;
  document.body.style.backgroundSize = 'cover, 320px 320px';
})();

// ---------- skalowanie sceny ----------
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  $stage.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
}
addEventListener('resize', fit);

// ---------- połączenie ----------
const code = () => location.hash.slice(1).toUpperCase().replace(/[^A-Z0-9]/g, '');
function connect(name) {
  if (G) G.stop();
  V = null; ui.sel = null; ui.pin = null;
  G = new KI.Game({
    code: code(), name,
    onState: v => { V = v; gotAt = Date.now(); render(); },
    onError: m => toast(m.err),
    onStatus: s => { status = s; render(); },
  });
}
function route() {
  if (G) { G.stop(); G = null; }
  V = null; status = '';
  if (!code()) return render();
  if (KI.seat.get(code())) connect(KI.nick.get());
  else render();
}
addEventListener('hashchange', route);

function toast(text) {
  clearTimeout(ui.toast);
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t); }
  t.textContent = text;
  ui.toast = setTimeout(() => t.remove(), 3500);
}

// ---------- ekrany poza stołem ----------
const lobbyBtn = `<button class="btn small tolobby" data-act="home">← Lobby</button>`;
function render() {
  const inGame = V && V.game;
  $stage.classList.toggle('hidden', !inGame);
  $screen.classList.toggle('hidden', !!inGame);
  if (inGame) return renderStage();
  $screen.innerHTML = lobbyBtn + screenHTML();
}

function screenHTML() {
  const logo = `<h1 class="logo"><small>PL3Y · gra dla 2 graczy</small>Kurczacze<br>Imperium</h1>`;
  if (!code()) return `<div class="sign panel">${logo}
    <p>Rozbuduj kurnik przez trzy Ery i pokonaj sąsiada militarnie, naukowo albo Złotymi Piórami.</p>
    <input class="field" id="nick" maxlength="16" placeholder="Twój nick" value="${esc(KI.nick.get())}">
    <div class="row"><button class="btn gold" data-act="create" style="flex:1;justify-content:center">Załóż kurnik</button></div>
    <div class="sep">albo dołącz kodem</div>
    <div class="row"><input class="field" id="code" maxlength="5" placeholder="KOD" style="text-transform:uppercase;letter-spacing:4px"><button class="btn" data-act="join">Dołącz</button></div>
    <p class="err" id="err"></p></div>`;
  if (status === 'noroom') return `<div class="sign panel">${logo}<p class="err">Taki pokój nie istnieje albo wygasł.</p><button class="btn" data-act="menu">Wróć</button></div>`;
  if (status === 'full') return `<div class="sign panel">${logo}<p class="err">W tym pokoju grają już dwie osoby.</p><button class="btn" data-act="menu">Wróć</button></div>`;
  if (!G) return `<div class="sign panel">${logo}<p>Zaproszenie do kurnika <b>${esc(code())}</b></p>
    <input class="field" id="nick" maxlength="16" placeholder="Twój nick" value="${esc(KI.nick.get())}">
    <div class="row"><button class="btn gold" data-act="enter" style="flex:1;justify-content:center">Wchodzę</button></div>
    <p class="err" id="err"></p></div>`;
  if (!V) return `<div class="sign panel">${logo}<p class="muted">Łączenie z kurnikiem…</p></div>`;
  const host = V.seat === 0, full = V.seats[0] && V.seats[1];
  const seat = (s, i) => `<div class="seat ${s ? 'on' : ''}">${s ? esc(s.name) + (i === V.seat ? ' (Ty)' : '') + (s.on ? '' : ' · offline') : 'czekamy…'}</div>`;
  return `<div class="sign panel">${logo}
    <p class="muted">Kod kurnika</p><div class="code-big">${esc(V.code)}</div>
    <p><button class="btn small" data-act="copy">Skopiuj link zaproszenia</button></p>
    <div class="seats">${V.seats.map(seat).join('')}</div>
    <p class="muted">Limit czasu na turę</p>
    <div class="chips">${KI.TIMES.map(t => `<span class="chip ${V.time === t ? 'on' : ''}" ${host ? `data-act="time" data-v="${t}"` : ''}>${t ? t + ' s' : 'bez limitu'}</span>`).join('')}</div>
    ${host ? `<button class="btn gold" data-act="start" ${full ? '' : 'disabled'}>${full ? 'Zaczynamy!' : 'Czekam na rywala…'}</button>` : '<p><b>Gospodarz zaraz zacznie grę.</b></p>'}
    <p><button class="btn small" data-act="leave">Opuść kurnik</button></p></div>`;
}

// ---------- stół (układ wg makiety autora: noweui.png) ----------
// Scena 1920×1080: pasek u góry, rywal u góry (panel, Imperium na pejzażu, Cuda), tor wojny z lewej, układ Ery w środku,
// Ty na dole, z prawej zakładki Karta / Cuda / Nauka / Wojsko, Odkrycia na planszy i Historia rozgrywki.
const UI = new URL('img/ui/', import.meta.url).href;
const ERA_NAME = ['', 'Era Jajka', 'Era Pisklęcia', 'Era Koguta'];
const TABS = [['karta', 'Karta'], ['cuda', 'Cuda'], ['nauka', 'Nauka'], ['wojsko', 'Wojsko']];
const GEAR = `<svg class="ico" viewBox="0 0 64 64"><path d="M28 4h8l2 8 6 3 7-4 6 6-4 7 3 6 8 2v8l-8 2-3 6 4 7-6 6-7-4-6 3-2 8h-8l-2-8-6-3-7 4-6-6 4-7-3-6-8-2v-8l8-2 3-6-4-7 6-6 7 4 6-3z" fill="currentColor"/><circle cx="32" cy="32" r="10" fill="#3A2414"/></svg>`;
const HAMMER = `<svg class="ico" viewBox="0 0 64 64"><path d="M30 26l8 8-22 22a5.7 5.7 0 0 1-8-8z" fill="#8A5A30" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/><path d="M24 14l14-8 20 20-8 14-6-6 4-6-8-8-6 4z" fill="#6B6A63" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/></svg>`;
const CHECK = `<svg class="ico" viewBox="0 0 64 64"><path d="M10 34l14 14 30-32" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderStage() {
  const g = V.game, me = V.seat, op = 1 - me;
  let h = topbar(g, me);
  h += areaHTML(g, op, 'opp') + areaHTML(g, me, 'me');
  h += `<div class="perch top"></div><div class="perch bot"></div>`;
  h += trackHTML(g, me);
  h += `<div class="board">${boardHTML(g, me)}</div>`;
  h += `<div class="side">
    <div class="tabs">${TABS.map(([k, l]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="preview panel" id="preview"></div>
    <div class="board-tokens panel"><h3 class="h-title">Odkrycia na planszy</h3><div class="row">${g.board.map(t => tokenHTML(t)).join('') || '<span class="muted">Wszystkie zabrane.</span>'}</div></div>
    <div class="log panel">${logHTML(g, me)}</div></div>`;
  h += overlayHTML(g, me) + dialogHTML(g, me);
  $stage.innerHTML = h;
  renderPreview();
  fit();
  tick();
}

function topbar(g, me) {
  const who = g.actor;
  const phase = g.phase === 'draft' ? 'Wybór Cudów' : g.phase === 'end' ? 'Koniec gry' : ERA_NAME[g.era];
  const turn = who == null ? '' : who === me ? `<span class="pill turn">Twój ruch</span>` : `<span class="pill">Ruch: ${esc(g.players[who].name)}</span>`;
  const net = status === 'online';
  return `<div class="topbar"><img class="tb-logo" src="${UI}logo.png" alt=""><span class="title">Kurczacze Imperium</span>
    <div class="tb-pills"><span class="pill era">${phase}</span>${turn}<span class="pill hidden" id="timer"></span></div>
    <span class="spacer"></span>
    <span class="tb-net"><span class="dot ${net ? '' : 'off'}"></span>${net ? 'połączono' : 'łączenie…'}</span>
    <button class="tb-btn" data-act="dlg" data-v="rules" title="Zasady gry w skrócie">Zasady</button>
    <button class="tb-btn" data-act="dlg" data-v="legend" title="Co znaczą ikony">Legenda</button>
    <button class="tb-btn sq" data-act="dlg" data-v="cfg" title="Kurnik i połączenie">${GEAR}</button>
    <button class="tb-btn" data-act="home">Lobby</button></div>`;
}

function areaHTML(g, p, side) {
  const pl = g.players[p];
  const have = new Set(pl.syms);
  const two = new Set(pl.syms.filter((x, i) => pl.syms.indexOf(x) !== i));
  const prod = Object.entries(pl.prod).filter(([, n]) => n).map(([r, n]) => Array.from({ length: n }, () => icon(r)).join('')).join('');
  const choice = pl.choice.map(c => c.split('').map(r => icon(r)).join('/')).join(' · ');
  const on = V.seats[p] && V.seats[p].on;
  const info = `<div class="pinfo ${g.actor === p ? 'active' : ''}">
    <div class="ribbon"><span class="pname">${esc(pl.name)}</span>${p === V.seat ? '<span class="you">Ty</span>' : ''}${on ? '' : '<span class="offl">offline</span>'}</div>
    <img class="avatar" src="${UI}avatar-${side === 'me' ? 'me' : 'op'}.png" alt="">
    <div class="stats"><span title="Ziarna">${icon('coin')}<b>${pl.coins}</b></span><span title="Złote Pióra (teraz)">${icon('feather')}<b>${pl.vp}</b></span></div>
    <div class="ptokens">${pl.tokens.map(t => tokenHTML(t)).join('')}</div>
    <div class="symrow">${SYMBOLS.map(s => `<span title="${esc(s)}">${sym(s, (have.has(s) ? 'have' : '') + (two.has(s) ? ' two' : ''))}</span>`).join('')}</div>
    <div class="prodline">${prod || choice ? prod + (prod && choice ? ' · ' : '') + choice : '<span class="muted">brak produkcji</span>'}</div></div>`;
  // Imperium: kolumny kolorów, szerokość kart dopasowana do liczby kolumn (pole 384×212).
  const cols = COLORS.map(c => pl.cards.filter(id => KI.CARDS[id].color === c)).filter(a => a.length);
  const EW = 384, EH = 206, n = cols.length;
  const cw = n ? Math.min(84, Math.floor((EW - 6 * (n - 1)) / n)) : 84, ch = cw * 68 / 44;
  const empire = cols.length ? cols.map(ids => {
    const step = ids.length > 1 ? Math.min(cw * .5, (EH - ch) / (ids.length - 1)) : 0;
    return `<div class="ecol" style="--cw:${cw}px">${ids.map((id, i) => `<div style="position:absolute;top:${i * step}px;z-index:${i}">${cardHTML(id)}</div>`).join('')}</div>`;
  }).join('') : '';
  const wonders = `<div class="wonders"><div class="w-head">Cuda <small>(${esc(pl.name)})</small></div>
    <div class="w-grid">${pl.wonders.map(w => wonderHTML(w.id, 'mini', '', w.built ? 'built' : '')).join('')}</div></div>`;
  return `<div class="area ${side}">${info}<div class="empire" style="background-image:url('${UI}land-${side === 'me' ? 'me' : 'op'}.png')">${empire}</div>${wonders}</div>`;
}

const ROOSTER = `<svg class="ico" viewBox="0 0 64 64"><path d="M14 44c0-14 10-24 22-24 4-6 2-12 2-12s6 2 8 8c4 0 8 2 8 6l-6 2c0 4-2 8-4 10 6 2 10 6 10 12H18c-3 0-4-1-4-2z" fill="#F6EBD3" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/><path d="M34 12c0-6 4-8 4-8 0 4 3 5 4 2 1 4 3 5 4 4 0 4-2 6-4 6" fill="#B5452F" stroke="#2E2118" stroke-width="2.5" stroke-linejoin="round"/><path d="M54 22l6 3-6 2" fill="#E8B83A" stroke="#2E2118" stroke-width="2.5" stroke-linejoin="round"/><circle cx="46" cy="20" r="2" fill="#2E2118"/><path d="M48 28c2 3 1 6-2 6" fill="#B5452F" stroke="#2E2118" stroke-width="2"/><path d="M14 44c-6-2-10-10-6-18 2 6 6 8 10 8" fill="#56734A" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/><path d="M28 52v8M38 52v8" stroke="#2E2118" stroke-width="3"/></svg>`;

// Tor wojny: 15 pól (±7), Gniazdo rywala u góry, Twoje na dole; Pióra z lewej, straty Ziaren z prawej.
function trackHTML(g, me) {
  const FH = 27, TOP = 56, d = g.track * (me === 0 ? 1 : -1);   // dodatni = Kogut idzie w górę (do Gniazda rywala)
  let h = '<div class="track"><div class="rail">';
  for (let k = 7; k >= -7; k--) {
    const z = Math.abs(k), cls = k === 0 ? 'mid' : z <= 2 ? 'z1' : z <= 4 ? 'z2' : z <= 6 ? 'z3' : 'z4';
    h += `<div class="f ${cls}" style="top:${(7 - k) * FH}px;height:${FH}px"></div>`;
  }
  h += '</div>';
  h += `<img class="nest top" src="${UI}nest-top.png" alt="" title="Gniazdo: ${esc(g.players[1 - me].name)}"><img class="nest bot" src="${UI}nest-bot.png" alt="" title="Twoje Gniazdo">`;
  for (const [k, vp] of [[1.5, 2], [3.5, 4], [5.5, 8]]) for (const sgn of [1, -1]) {
    h += `<span class="vpz" style="top:${TOP + (7 - k * sgn) * FH}px;height:${FH}px" title="${vp} Złote Pióra dla ${sgn > 0 ? 'Ciebie' : 'rywala'} na koniec">${vp}${icon('feather')}</span>`;
  }
  const lossFor = (victim, sgn) => g.loss[victim].filter(t => !t.used).map(t => `<span class="loss" style="top:${TOP + (7 - t.at * sgn) * FH + FH / 2 - 17}px" title="Pierwsze wejście: −${t.amount} Ziaren">${coin('−' + t.amount)}</span>`).join('');
  h += lossFor(1 - me, 1) + lossFor(me, -1);
  h += `<span class="rooster" style="top:${TOP + (7 - d) * FH + FH / 2 - 28}px" title="Kogut Bojowy">${ROOSTER}</span>`;
  return h + '</div>';
}

function boardHTML(g, me) {
  if (g.phase === 'draft') {
    const mine = g.actor === me;
    const n = g.players[me].wonders.length;
    return `<div class="era-banner"><b>Wybór Kurzych Cudów</b> · masz ${n} z 4</div>
      <div class="draft ${mine ? 'mine' : ''}"><div class="hint">${mine ? 'Wybierz Kurzy Cud' : `${esc(g.players[g.actor].name)} wybiera Cud…`}</div>
      <div class="offer">${g.draft.offer.map(w => wonderHTML(w, 'mini', mine ? `data-act="pick" data-v="${w}"` : '')).join('')}</div></div>`;
  }
  if (!g.slots) return '';
  // Wielkość kart dobrana do Ery: pole 1110×412 pod banerem (z miejscem na plakietki cen).
  const BW = 1110, BH = 412, maxX = Math.max(...g.slots.map(s => s.x)), rows = g.rows.length;
  const CW = Math.floor(Math.min(150, (BW - 40 - 6 * maxX) / (maxX / 2 + 1), BH / (68 / 44 + .42 * (rows - 1))));
  const CH = CW * 68 / 44, HALF = CW / 2 + 6;
  const STEP = rows > 1 ? Math.min(CW * .48, (BH - CH) / (rows - 1)) : 0;
  const W = maxX * HALF + CW, H = CH + (rows - 1) * STEP;
  const myTurn = g.actor === me && !g.pending && g.phase === 'play';
  let h = `<div class="era-banner"><b>${ERA_NAME[g.era]}</b> · Cudów do zbudowania: ${g.wondersLeft}</div>
    <div class="lay" style="left:${(BW - W) / 2}px;top:${62 + (BH - H) / 2}px;width:${W}px;height:${H}px;--cw:${CW}px">`;
  g.slots.forEach((s, i) => {
    if (s.taken) return;
    const pos = `left:${s.x * HALF}px;top:${s.row * STEP}px;z-index:${s.row + 1}`;
    if (!s.up) { h += `<div class="slot" style="${pos}">${backHTML(g.era)}</div>`; return; }
    let badge = '', ok = false;
    if (s.free && s.price) {
      const pr = s.price[me]; ok = pr.ok;
      badge = pr.chain ? `<span class="price free" title="Za darmo dzięki Śladowi">${chain(KI.CARDS[s.id].chain_from, true)}</span>`
        : `<span class="price ${pr.ok ? '' : 'no'}" title="${pr.ok ? 'Koszt dla Ciebie' : 'Nie stać Cię'}">${pr.coins}</span>`;
    }
    const cls = `slot ${s.free ? 'free' : ''} ${s.free && myTurn ? 'mine' : ''} ${s.free && myTurn && ok ? 'ok' : ''} ${ui.sel === i ? 'sel' : ''}`;
    h += `<div class="${cls}" style="${pos}" ${s.free ? `data-act="sel" data-v="${i}"` : ''}>${cardHTML(s.id)}${badge}</div>`;
  });
  return h + '</div>';
}

// ---------- prawa kolumna: zakładki ----------
// Karta: najechana karta/Cud/Odkrycie albo zaznaczona karta z układu (z ruchami). Najechanie pokazuje podgląd
// w każdej zakładce; po zjechaniu wraca wybrana zakładka.
function renderPreview() {
  const box = $('preview'); if (!box || !V || !V.game) return;
  const g = V.game, me = V.seat, hv = ui.hover;
  const i = ui.sel, s = i != null && g.slots ? g.slots[i] : null;
  const sel = s && !s.taken && s.free ? s : null;
  box.className = 'preview panel';
  const look = x => {
    box.classList.add('look');
    box.innerHTML = x.t === 'token' ? tokenFullHTML(x.id) : infoHTML(x.t, x.id) + (x.t === 'card' ? ownerNote(g, x.id) : '');
  };
  if (hv && hv.t !== 'hw') return look(hv);
  if (ui.tab !== 'karta') { box.innerHTML = tabHTML(g, me, ui.tab); return; }
  // Ostatnio kliknięta karta / Cud / Odkrycie zostaje w podglądzie (chyba że wybrano kartę do ruchu).
  if (!sel && ui.pin) return look(ui.pin);
  if (!sel) {
    box.innerHTML = `<div class="empty">${g.phase === 'draft' ? 'Najedź na Cud, żeby go obejrzeć.' : g.actor === me && g.phase === 'play' ? 'Twój ruch: kliknij dostępną kartę w układzie.' : 'Najedź na kartę, żeby ją obejrzeć.'}</div>`;
    return;
  }
  // Najechany przycisk „Wsuń pod Cud”: w miejscu karty ten Cud, przyciski zostają (inaczej nie da się kliknąć).
  const top = hv && hv.t === 'hw' ? infoHTML('wonder', hv.id, ui.tuck ? tuckHTML(g, me) : '') : infoHTML('card', sel.id, ui.tuck ? tuckHTML(g, me) : '');
  box.innerHTML = top + `<div class="acts">${actsHTML(g, me, sel)}</div>`;
}

function infoHTML(kind, id, replace = '') {
  const x = kind === 'card' ? KI.CARDS[id] : KI.WONDERS[id];
  const picture = kind === 'card' ? cardHTML(id) : wonderHTML(id, 'mini');
  const sub = kind === 'card' ? `${x.color === 'purple' ? 'Bractwo' : KI.COLORS[x.color]} · ${ERA_NAME[x.era]}` : 'Kurzy Cud';
  const cost = costHTML(kind === 'card' ? x : { cost: x.cost });
  const info = replace || `<div class="pv-info"><h3>${esc(x.name)}</h3><div class="pv-sub">${esc(sub)}</div>
    <div class="pv-ce"><div><h4>Koszt budowy</h4><div class="pv-cost">${cost || '<span class="muted">bez kosztu</span>'}</div></div>
    <div><h4>Efekt</h4><div class="pv-icons">${effectHTML(x)}</div></div></div><p class="pv-text">${esc(x.text)}</p>
    <p class="pv-flavor">${esc(x.flavor)}</p></div>`;
  return `<div class="pv-top ${kind}"><div class="pv">${picture}</div>${info}</div>`;
}
function ownerNote(g, id) {
  const who = g.players.findIndex(p => p.cards.includes(id));
  return who < 0 ? '' : `<div class="pv-status">W Imperium: <b>${esc(g.players[who].name)}</b></div>`;
}
function actsHTML(g, me, s) {
  const myTurn = g.actor === me && !g.pending && g.phase === 'play';
  if (!myTurn) return `<div class="pv-status">Poczekaj na swój ruch.</div>`;
  const pr = s.price[me];
  const status = pr.ok ? `<div class="pv-status ok">${CHECK}Możesz zbudować tę kartę${pr.chain ? ' za darmo (Ślad Pazurka)' : ''}</div>`
    : `<div class="pv-status no">Brakuje Ziaren: koszt ${pr.coins}, masz ${g.players[me].coins}.</div>`;
  const build = `<button class="btn gold big" data-act="build" ${pr.ok ? '' : 'disabled'}>${HAMMER}<span>Zbuduj kartę</span>${pr.chain ? chain(KI.CARDS[s.id].chain_from, true) : coin(pr.coins)}</button>`;
  const ws = g.players[me].wonders.filter(w => !w.built);
  const tuck = ws.length && g.wondersLeft > 0 ? `<button class="btn ${ui.tuck ? 'on' : ''}" data-act="tuck">${icon('wonder')}<span>Wsuń pod Cud</span></button>`
    : ws.length ? `<span class="why">Zbudowano już wszystkie Cuda.</span>` : '';
  return status + build + `<div class="pv-row"><button class="btn" data-act="discard"><span>Odrzuć</span>${coin('+' + g.discardGain[me])}</button>${tuck}</div>`;
}
function tuckHTML(g, me) {
  const ws = g.players[me].wonders.filter(w => !w.built);
  return `<div class="pv-info tuck"><h3>Wsuń pod Cud</h3><p class="pv-sub">Karta trafia pod Cud, płacisz koszt Cudu.</p>
    ${ws.map(w => { const wp = g.wonderPrice[me][w.id]; return `<button class="btn small" data-act="wonder" data-w="${w.id}" data-hw="${w.id}" ${wp.ok ? '' : 'disabled'}><span>${esc(KI.WONDERS[w.id].name)}</span>${coin(wp.coins)}</button>`; }).join('')}</div>`;
}

function tabHTML(g, me, tab) {
  const order = [1 - me, me];
  if (tab === 'cuda') {
    return `<h3 class="h-title">Kurze Cuda <small>· do zbudowania: ${g.wondersLeft}</small></h3><div class="tab-cols">${order.map(p => {
      const pl = g.players[p];
      return `<div><h4>${esc(pl.name)}${p === me ? ' (Ty)' : ''}</h4>${pl.wonders.map(w => `<div class="tw">${wonderHTML(w.id, 'mini', '', w.built ? 'built' : '')}
        <small>${w.built ? 'Zbudowany' : esc(KI.WONDERS[w.id].text)}</small></div>`).join('') || '<p class="muted">Brak Cudów.</p>'}</div>`;
    }).join('')}</div>`;
  }
  if (tab === 'nauka') {
    return `<h3 class="h-title">Dziobologia</h3><p class="tab-note">Para tych samych symboli = wybór Odkrycia z planszy. 5 różnych symboli = zwycięstwo naukowe.</p>
      <div class="tab-cols">${order.map(p => {
      const pl = g.players[p], cnt = s => pl.syms.filter(x => x === s).length, diff = new Set(pl.syms).size;
      return `<div><h4>${esc(pl.name)}${p === me ? ' (Ty)' : ''}</h4>
        <div class="sci">${SYMBOLS.map(s => `<span class="sci-s ${cnt(s) ? 'have' : ''}" title="${esc(s)}">${sym(s)}${cnt(s) > 1 ? `<b>×${cnt(s)}</b>` : ''}</span>`).join('')}</div>
        <p>Różnych symboli: <b>${diff} / 5</b></p>
        <div class="tab-tokens">${pl.tokens.map(t => tokenHTML(t)).join('') || '<span class="muted">Brak Odkryć.</span>'}</div></div>`;
    }).join('')}</div>`;
  }
  // wojsko
  const d = g.track * (me === 0 ? 1 : -1), lead = d > 0 ? me : d < 0 ? 1 - me : null, z = Math.abs(d);
  const vp = z >= 5 ? 8 : z >= 3 ? 4 : z >= 1 ? 2 : 0;
  const losses = p => g.loss[p].filter(t => !t.used).map(t => `pole ${t.at}: −${t.amount}`).join(', ') || 'już wykorzystane';
  return `<h3 class="h-title">Wojna o Podwórze</h3>
    <div class="war"><span class="war-k">${ROOSTER}</span><p>${lead == null ? 'Kogut stoi na środku toru.' : `Kogut stoi <b>${z}</b> ${z === 1 ? 'pole' : z < 5 ? 'pola' : 'pól'} w stronę Gniazda gracza <b>${esc(g.players[1 - lead].name)}</b>.`}
      ${lead == null ? '' : `<br>Na koniec gry: <b>${vp}</b> ${icon('feather')} dla gracza ${esc(g.players[lead].name)}.`}</p></div>
    <ul class="tab-list"><li>Każda Ostroga przesuwa Koguta o 1 pole w stronę rywala.</li>
      <li>Pierwsze wejście na pole 3 i 5 po stronie rywala: traci on 3 i 6 Ziaren.</li>
      <li>Pole 7 = natychmiastowe zwycięstwo militarne.</li>
      ${order.map(p => `<li>Straty do odebrania (${esc(g.players[p].name)}): ${losses(p)}</li>`).join('')}</ul>`;
}

// Historia: najnowsze na górze, ikona wg rodzaju wpisu.
function logIcon(t) {
  if (/Cud/.test(t)) return icon('wonder');
  if (/buduje|przejmuje/.test(t)) return HAMMER;
  if (/odrzuca/.test(t)) return icon('coin');
  if (/Odkrycie/.test(t)) return icon('feather');
  if (/Kogut|niszczy|militar/.test(t)) return icon('spur');
  if (/^Era|Losowanie/.test(t)) return icon('nest');
  return icon('feather');
}
const logRows = (g, me) => g.log.slice().reverse().map(l => `<div class="${l.p === me ? 'me' : ''}">${logIcon(l.text)}<span>${esc(l.text)}</span></div>`).join('');
function logHTML(g, me) {
  return `<div class="log-head"><h3 class="h-title">Historia rozgrywki</h3><button class="btn tiny" data-act="dlg" data-v="log">Pokaż całą historię</button></div>
    <div class="log-list" id="log">${logRows(g, me)}</div>`;
}

// Okna z paska: ? (zasady w skrócie), ⚙ (kurnik i połączenie), cała historia.
function dialogHTML(g, me) {
  if (!ui.dlg) return '';
  let body = '';
  if (ui.dlg === 'rules') body = rulesHTML();
  else if (ui.dlg === 'legend') body = legendHTML();
  else if (ui.dlg === 'cfg') body = `<p class="win-title">Kurnik ${esc(V.code)}</p>
    <p>Połączenie: <b>${status === 'online' ? 'połączono' : 'łączenie…'}</b></p>
    ${g.players.map((p, i) => `<p>${esc(p.name)}${i === me ? ' (Ty)' : ''}: <b>${V.seats[i] && V.seats[i].on ? 'online' : 'offline'}</b></p>`).join('')}
    <p>Limit czasu na turę: <b>${V.time ? V.time + ' s' : 'bez limitu'}</b></p>
    <p><button class="btn small" data-act="copy">Skopiuj link do kurnika</button></p>`;
  else if (ui.dlg === 'log') body = `<p class="win-title">Historia rozgrywki</p><div class="log-list full">${logRows(g, me)}</div>`;
  const wide = ui.dlg === 'rules' || ui.dlg === 'legend';
  return `<div class="overlay dlg" data-act="dlg" data-v=""><div class="dialog panel ${wide ? 'wide' : ''}" data-stop="1"><button class="dlg-x" data-act="dlg" data-v="" title="Zamknij (Esc)">✕</button>${body}<p><button class="btn" data-act="dlg" data-v="">Zamknij</button></p></div></div>`;
}

function overlayHTML(g, me) {
  if (g.phase === 'end') {
    const w = g.winner, sc = g.score || [];
    const title = w.p == null ? 'Remis!' : w.p === me ? 'Wygrywasz!' : `Wygrywa ${esc(g.players[w.p].name)}`;
    const rows = [['military', 'Wojna o Podwórze', icon('spur')], ['cards', 'Karty', icon('card')], ['guilds', 'Bractwa', ''], ['wonders', 'Kurze Cuda', icon('wonder')],
      ['tokens', 'Odkrycia', ''], ['coins', 'Skarbiec', icon('coin')], ['total', 'Razem', icon('feather')]];
    return `<div class="overlay"><div class="dialog panel"><p class="win-title">${title}</p><p><b>${HOW[w.how] || ''}</b></p>
      ${sc.length ? `<table class="score"><tr><th></th>${g.players.map(p => `<th>${esc(p.name)}</th>`).join('')}</tr>
        ${rows.map(([k, label, ic]) => `<tr class="${k === 'total' ? 'total' : ''}"><th>${ic} ${label}</th>${sc.map(x => `<td>${x[k]}</td>`).join('')}</tr>`).join('')}</table>` : ''}
      <p><button class="btn gold" data-act="rematch">Rewanż</button> <button class="btn" data-act="home">← Lobby</button></p></div></div>`;
  }
  if (!g.pending) return '';
  if (g.pending.p !== me) return `<div class="overlay" style="background:rgba(46,33,24,.18);pointer-events:none"><div class="dialog panel"><p class="hint">${esc(g.players[g.pending.p].name)} wybiera…</p></div></div>`;
  const opp = g.players[1 - me];
  let title = '', opts = '';
  if (g.pending.type === 'token' || g.pending.type === 'grab') {
    title = g.pending.type === 'token' ? 'Para symboli! Wybierz Odkrycie' : 'Wielka Grzęda Mędrców: weź Odkrycie';
    opts = g.board.map(t => `<div data-act="token" data-v="${t}">${tokenFullHTML(t)}</div>`).join('');
  } else if (g.pending.type === 'destroy') {
    title = 'Pomnik Koguta Zwycięzcy: wybierz żółtą kartę rywala do odrzucenia';
    opts = opp.cards.filter(id => KI.CARDS[id].color === 'yellow').map(id => `<div data-act="destroy" data-v="${id}">${cardHTML(id, 'full')}</div>`).join('');
  } else if (g.pending.type === 'steal') {
    title = 'Brama Podwórza: przejmij brązową lub szarą kartę rywala';
    opts = opp.cards.filter(id => ['brown', 'grey'].includes(KI.CARDS[id].color)).map(id => `<div data-act="steal" data-v="${id}">${cardHTML(id, 'full')}</div>`).join('');
  }
  return `<div class="overlay"><div class="dialog panel"><p class="hint">${title}</p><div class="opts">${opts}</div></div></div>`;
}

// ---------- zegar tury ----------
function tick() {
  const el = $('timer'); if (!el || !V) return;
  if (!V.left || !V.game || V.game.phase === 'end') { el.classList.add('hidden'); return; }
  const left = Math.max(0, V.left - (Date.now() - gotAt));
  el.classList.remove('hidden');
  el.classList.toggle('low', left < 10000);
  el.textContent = `⏱ ${Math.ceil(left / 1000)} s`;
}
setInterval(tick, 250);

// ---------- zdarzenia ----------
document.addEventListener('mouseover', e => {
  if (!V || !V.game) return;
  const t = e.target.closest('[data-hw],[data-card],[data-wonder],[data-token]');
  let hv = null;
  if (t && t.closest('#stage') && !t.closest('.overlay')) {
    if (t.dataset.hw) hv = { t: 'hw', id: t.dataset.hw };
    else if (t.closest('#preview')) hv = ui.hover;
    else if (t.dataset.card) hv = t.closest('.slot.free') && ui.sel != null ? null : { t: 'card', id: t.dataset.card };
    else if (t.dataset.wonder) hv = { t: 'wonder', id: t.dataset.wonder };
    else if (t.dataset.token) hv = { t: 'token', id: t.dataset.token };
  }
  if (JSON.stringify(hv) !== JSON.stringify(ui.hover)) { ui.hover = hv; renderPreview(); }
});

// Kliknięcie karty / Cudu / Odkrycia na stole przypina je w podglądzie (zakładka Karta).
document.addEventListener('click', e => {
  if (!V || !V.game) return;
  const t = e.target.closest('[data-card],[data-wonder],[data-token]');
  if (!t || !t.closest('#stage') || t.closest('#preview') || t.closest('.overlay') || t.closest('[data-stop]')) return;
  const x = t.dataset.card ? { t: 'card', id: t.dataset.card } : t.dataset.wonder ? { t: 'wonder', id: t.dataset.wonder } : { t: 'token', id: t.dataset.token };
  ui.pin = x;
  if (!t.closest('[data-act]')) { ui.tab = 'karta'; renderStage(); }
}, true);

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  const err = t => { const el = $('err'); if (el) el.textContent = t; };
  if (a === 'home') {
    if (V && V.game && V.game.phase !== 'end' && !confirm('Wrócić do lobby PL3Y? Gra zostaje w kurniku: wrócisz do niej tym samym linkiem.')) return;
    location.href = '/';
  } else if (a === 'create') {
    const n = $('nick').value.trim();
    if (!n) return err('Wpisz swój nick.');
    KI.nick.set(n);
    try { const r = await KI.createRoom(); location.hash = r.code; }
    catch (er) { err('Nie udało się założyć kurnika. Sprawdź internet i spróbuj jeszcze raz.'); }
  } else if (a === 'join') {
    const n = $('nick').value.trim(), c = $('code').value.trim().toUpperCase();
    if (!n) return err('Wpisz swój nick.');
    if (c.length !== 5) return err('Kod ma 5 znaków.');
    KI.nick.set(n);
    if (location.hash.slice(1) === c) connect(n); else location.hash = c;
  } else if (a === 'enter') {
    const n = $('nick').value.trim();
    if (!n) return err('Wpisz swój nick.');
    KI.nick.set(n); connect(n);
  } else if (a === 'menu') { location.hash = ''; }
  else if (a === 'leave') { if (G) G.leave(); G = null; location.hash = ''; }
  else if (a === 'copy') {
    const url = KI.inviteUrl(V.code);
    try { await navigator.clipboard.writeText(url); toast('Skopiowano link: ' + url); } catch (er) { prompt('Skopiuj link zaproszenia:', url); }
  }
  else if (a === 'time') G.setTime(Number(v));
  else if (a === 'start') G.start();
  else if (a === 'rematch') { ui.sel = null; G.rematch(); }
  else if (a === 'pick') G.move({ a: 'pickWonder', wonder: v });
  else if (a === 'sel') { ui.sel = ui.sel === Number(v) ? null : Number(v); ui.hover = null; ui.tuck = false; ui.tab = 'karta'; renderStage(); }
  else if (a === 'tab') { ui.tab = v; ui.hover = null; renderStage(); }
  else if (a === 'tuck') { ui.tuck = !ui.tuck; renderPreview(); }
  else if (a === 'dlg') { if (b.classList.contains('overlay') && e.target.closest('[data-stop]')) return; ui.dlg = v || null; renderStage(); }
  else if (a === 'build') { G.move({ a: 'build', slot: ui.sel }); ui.sel = null; ui.tuck = false; }
  else if (a === 'discard') { G.move({ a: 'discard', slot: ui.sel }); ui.sel = null; ui.tuck = false; }
  else if (a === 'wonder') { G.move({ a: 'wonder', slot: ui.sel, wonder: b.dataset.w }); ui.sel = null; ui.tuck = false; }
  else if (a === 'token') G.move({ a: 'token', token: v });
  else if (a === 'destroy') G.move({ a: 'destroy', card: v });
  else if (a === 'steal') G.move({ a: 'steal', card: v });
});
addEventListener('keydown', e => { if (e.key === 'Escape' && (ui.sel != null || ui.dlg)) { ui.sel = null; ui.tuck = false; ui.dlg = null; renderStage(); } });

if (APP) document.body.classList.add('app');
route();
