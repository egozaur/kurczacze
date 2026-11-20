// Kurczacze Imperium — ekran gry. Stan przychodzi z serwera (KI.Game → view); tu tylko rysowanie i kliknięcia.
// Ekrany: menu (brak #KODU) → dołączanie (nick) → poczekalnia (game = null) → stół (scena 1920×1080 skalowana do okna).
import * as KI from './ki.js';
import { icon, coin, sym, chain, SYMBOLS } from './icons.js';
import { cardHTML, backHTML, wonderHTML, tokenHTML, tokenFullHTML, esc } from './cards.js';

const $ = id => document.getElementById(id);
const $screen = $('screen'), $stage = $('stage');
let G = null, V = null, gotAt = 0, status = '';
const ui = { sel: null, hover: null, toast: null };
const COLORS = ['brown', 'grey', 'yellow', 'red', 'blue', 'green', 'purple'];
const HOW = { military: 'zwycięstwo militarne', science: 'zwycięstwo naukowe', civil: 'zwycięstwo cywilne' };
const APP = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ---------- tło: siano z kurnika ----------
(function hay() {
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cols = ['#C9A24A', '#E9CF7E', '#B98E3A', '#F2DE9A', '#A97F34', '#D8B460'];
  let h = '';
  for (let i = 0; i < 170; i++) {
    const x = r() * 320, y = r() * 320, len = 30 + r() * 80, a = (r() - .5) * 2.6 + (r() < .5 ? 0 : Math.PI);
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, bend = (r() - .5) * 18;
    const sw = (1.5 + r() * 2).toFixed(1), op = (.45 + r() * .5).toFixed(2), col = cols[i % cols.length];
    // Każde źdźbło rysowane 9 razy (przesunięcia o kafelek), żeby kafelek łączył się bez szwów.
    for (const dx of [-320, 0, 320]) for (const dy of [-320, 0, 320]) {
      const f = n => n.toFixed(1);
      h += `<path d="M${f(x + dx)} ${f(y + dy)} Q${f((x + x2) / 2 + bend + dx)} ${f((y + y2) / 2 - bend + dy)} ${f(x2 + dx)} ${f(y2 + dy)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" fill="none" opacity="${op}"/>`;
    }
  }
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">${h}</svg>`)}")`;
  document.body.style.backgroundImage = `radial-gradient(ellipse at center, rgba(255,246,214,.55), rgba(160,110,40,.28) 85%), ${url}`;
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
  V = null; ui.sel = null;
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

// ---------- stół ----------
function renderStage() {
  const g = V.game, me = V.seat, op = 1 - me;
  let h = topbar(g, me);
  h += areaHTML(g, op, 'opp') + areaHTML(g, me, 'me');
  h += `<div class="mid">${trackHTML(g, me)}<div class="board">${boardHTML(g, me)}</div></div>`;
  h += `<div class="side"><div class="preview panel" id="preview"></div>
    <div class="board-tokens panel"><h3 class="h-title">Odkrycia na planszy</h3><div class="row">${g.board.map(t => tokenHTML(t)).join('') || '<span class="muted">Wszystkie zabrane.</span>'}</div></div>
    <div class="log panel" id="log">${g.log.slice().reverse().map(l => `<div class="${l.p === me ? 'me' : ''}">${esc(l.text)}</div>`).join('')}</div></div>`;
  h += overlayHTML(g, me);
  $stage.innerHTML = h;
  renderPreview();
  fit();
  tick();
}

function topbar(g, me) {
  const who = g.actor;
  const phase = g.phase === 'draft' ? 'Wybór Kurzych Cudów' : g.phase === 'end' ? 'Koniec gry' : ['', 'Era Jajka', 'Era Pisklęcia', 'Era Koguta'][g.era];
  const turn = who == null ? '' : who === me ? `<span class="badge turn">Twój ruch</span>` : `<span class="badge wait">Ruch: ${esc(g.players[who].name)}</span>`;
  const on = V.seats.map(s => s && s.on);
  return `<div class="topbar"><button class="btn small" data-act="home">← Lobby</button><span class="title">Kurczacze Imperium</span>
    <span class="badge">${phase}</span>${turn}<span class="badge hidden" id="timer"></span><span class="spacer"></span>
    <span class="badge"><span class="dot ${on[1 - me] ? '' : 'off'}"></span>${esc(g.players[1 - me].name)} ${on[1 - me] ? 'online' : 'offline'}</span>
    <span class="badge">Kurnik ${esc(V.code)}</span>
    <span class="badge"><span class="dot ${status === 'online' ? '' : 'off'}"></span>${status === 'online' ? 'połączono' : 'łączenie…'}</span></div>`;
}

function areaHTML(g, p, side) {
  const pl = g.players[p];
  const have = new Set(pl.syms);
  const two = new Set(pl.syms.filter((x, i) => pl.syms.indexOf(x) !== i));
  const prod = Object.entries(pl.prod).filter(([, n]) => n).map(([r, n]) => Array.from({ length: n }, () => icon(r)).join('')).join('');
  const choice = pl.choice.map(c => c.split('').map(r => icon(r)).join('/')).join(' · ');
  const info = `<div class="pinfo panel ${g.actor === p ? 'active' : ''}">
    <div class="pname">${esc(pl.name)} ${p === V.seat ? '<span class="you">Ty</span>' : ''}</div>
    <div class="stats"><span title="Ziarna">${icon('coin')}${pl.coins}</span><span title="Złote Pióra (teraz)">${icon('feather')}${pl.vp}</span></div>
    <div class="symrow">${SYMBOLS.map(s => `<span title="${esc(s)}">${sym(s, (have.has(s) ? 'have' : '') + (two.has(s) ? ' two' : ''))}</span>`).join('')}</div>
    <div class="prodline">${prod || choice ? prod + (prod && choice ? ' · ' : '') + choice : '<span class="muted">brak produkcji</span>'}</div>
    <div class="ptokens">${pl.tokens.map(t => tokenHTML(t)).join('')}</div></div>`;
  const cols = COLORS.map(c => pl.cards.filter(id => KI.CARDS[id].color === c)).filter(a => a.length);
  const empire = cols.length ? cols.map(ids => {
    const ch = 92 * 68 / 44, step = ids.length > 1 ? Math.min(32, (240 - ch) / (ids.length - 1)) : 0;
    return `<div class="ecol">${ids.map((id, i) => `<div style="position:absolute;top:${i * step}px;z-index:${i}">${cardHTML(id)}</div>`).join('')}</div>`;
  }).join('') : `<span class="empty-empire">${p === V.seat ? 'Twoje Imperium jest jeszcze puste.' : 'Imperium rywala jest jeszcze puste.'}</span>`;
  const wonders = pl.wonders.map(w => wonderHTML(w.id, 'mini', '', w.built ? 'built' : '')).join('');
  return `<div class="area ${side}">${info}<div class="empire">${empire}</div><div class="wonders">${wonders}</div><div class="perch"></div></div>`;
}

const ROOSTER = `<svg class="ico" viewBox="0 0 64 64"><path d="M14 44c0-14 10-24 22-24 4-6 2-12 2-12s6 2 8 8c4 0 8 2 8 6l-6 2c0 4-2 8-4 10 6 2 10 6 10 12H18c-3 0-4-1-4-2z" fill="#F6EBD3" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/><path d="M34 12c0-6 4-8 4-8 0 4 3 5 4 2 1 4 3 5 4 4 0 4-2 6-4 6" fill="#B5452F" stroke="#2E2118" stroke-width="2.5" stroke-linejoin="round"/><path d="M54 22l6 3-6 2" fill="#E8B83A" stroke="#2E2118" stroke-width="2.5" stroke-linejoin="round"/><circle cx="46" cy="20" r="2" fill="#2E2118"/><path d="M48 28c2 3 1 6-2 6" fill="#B5452F" stroke="#2E2118" stroke-width="2"/><path d="M14 44c-6-2-10-10-6-18 2 6 6 8 10 8" fill="#56734A" stroke="#2E2118" stroke-width="3" stroke-linejoin="round"/><path d="M28 52v8M38 52v8" stroke="#2E2118" stroke-width="3"/></svg>`;

function trackHTML(g, me) {
  const FH = 26, TOP = 46, d = g.track * (me === 0 ? 1 : -1);   // dodatni = Kogut idzie w górę (do Gniazda rywala)
  let h = '<div class="track"><div class="rail">';
  for (let k = 7; k >= -7; k--) {
    const z = Math.abs(k), cls = k === 0 ? 'mid' : z <= 2 ? 'z1' : z <= 4 ? 'z2' : z <= 6 ? 'z3' : '';
    h += `<div class="f ${cls}" style="top:${(7 - k) * FH}px;height:${FH}px"></div>`;
  }
  h += '</div>';
  h += `<span class="nest top" title="Gniazdo: ${esc(g.players[1 - me].name)}">${icon('nest')}</span><span class="nest bot" title="Twoje Gniazdo">${icon('nest')}</span>`;
  for (const [k, vp] of [[1.5, 2], [3.5, 4], [5.5, 8]]) for (const sgn of [1, -1]) {
    h += `<span class="vpz" style="top:${TOP + (7 - k * sgn) * FH}px;height:${FH}px" title="${vp} Złote Pióra dla ${sgn > 0 ? 'Ciebie' : 'rywala'} na koniec">${vp}${icon('feather')}</span>`;
  }
  const lossFor = (victim, sgn) => g.loss[victim].filter(t => !t.used).map(t => `<span class="loss" style="top:${TOP + (7 - t.at * sgn) * FH - 2}px" title="Pierwsze wejście: −${t.amount} Ziaren">${coin('−' + t.amount)}</span>`).join('');
  h += lossFor(1 - me, 1) + lossFor(me, -1);
  h += `<span class="rooster" style="top:${TOP + (7 - d) * FH + FH / 2 - 30}px" title="Kogut Bojowy">${ROOSTER}</span>`;
  return h + '</div>';
}

function boardHTML(g, me) {
  if (g.phase === 'draft') {
    const mine = g.actor === me;
    const n = g.players[me].wonders.length;
    return `<div class="draft ${mine ? 'mine' : ''}"><div class="hint">${mine ? 'Wybierz Kurzy Cud' : `${esc(g.players[g.actor].name)} wybiera Cud…`}
      <small>Każdy gracz dostaje 4 Cudy · masz już ${n} z 4</small></div>
      <div class="offer">${g.draft.offer.map(w => wonderHTML(w, 'mini', mine ? `data-act="pick" data-v="${w}"` : '')).join('')}</div></div>`;
  }
  if (!g.slots) return '';
  const CW = 108, CH = CW * 68 / 44, HALF = CW / 2 + 5, STEP = 50;
  const maxX = Math.max(...g.slots.map(s => s.x)), rows = g.rows.length;
  const W = maxX * HALF + CW, H = CH + (rows - 1) * STEP;
  const left = (1274 - W) / 2, top = Math.max(26, (482 - H) / 2);
  const myTurn = g.actor === me && !g.pending && g.phase === 'play';
  let h = `<div class="era-label">${['', 'Era Jajka', 'Era Pisklęcia', 'Era Koguta'][g.era]} · Cudów do zbudowania: ${g.wondersLeft}</div><div class="lay" style="left:${left}px;top:${top}px;width:${W}px;height:${H}px">`;
  g.slots.forEach((s, i) => {
    if (s.taken) return;
    const pos = `left:${s.x * HALF}px;top:${s.row * STEP}px;z-index:${s.row + 1}`;
    if (!s.up) { h += `<div class="slot" style="${pos}">${backHTML(g.era)}</div>`; return; }
    let badge = '';
    if (s.free && s.price) {
      const pr = s.price[me];
      badge = pr.chain ? `<span class="price free" title="Za darmo dzięki Śladowi">${chain(KI.CARDS[s.id].chain_from, true)}gratis</span>`
        : `<span class="price ${pr.ok ? '' : 'no'}" title="${pr.ok ? 'Koszt dla Ciebie' : 'Nie stać Cię'}">${coin(pr.coins)}${pr.coins ? '' : 'za darmo'}</span>`;
    }
    const cls = `slot ${s.free ? 'free' : ''} ${s.free && myTurn ? 'mine' : ''} ${ui.sel === i ? 'sel' : ''}`;
    h += `<div class="${cls}" style="${pos}" ${s.free ? `data-act="sel" data-v="${i}"` : ''}>${cardHTML(s.id)}${badge}</div>`;
  });
  return h + '</div>';
}

// Podgląd: najechana karta/Cud/Odkrycie albo zaznaczona karta z układu (z przyciskami ruchu).
function renderPreview() {
  const box = $('preview'); if (!box || !V || !V.game) return;
  const g = V.game, me = V.seat;
  const hv = ui.hover;
  box.className = 'preview panel';
  // Sam podgląd (bez przycisków ruchu): karta/Cud wypełnia całe pole.
  if (hv && hv.t !== 'slot' && hv.t !== 'hw') {
    const note = hv.t === 'card' ? ownerNote(g, hv.id) : '';
    box.classList.add('solo');
    if (note) box.classList.add('note');
    box.innerHTML = hv.t === 'card' ? `<div class="pv">${cardHTML(hv.id, 'full')}</div>${note}`
      : hv.t === 'wonder' ? `<div class="pv">${wonderHTML(hv.id, 'full')}</div>`
      : tokenFullHTML(hv.id);
    return;
  }
  const i = ui.sel;
  const s = i != null && g.slots ? g.slots[i] : null;
  if (!s || s.taken || !s.free) {
    box.innerHTML = `<div class="empty">${g.phase === 'draft' ? 'Najedź na Cud, żeby go obejrzeć.' : g.actor === me && g.phase === 'play' ? 'Twój ruch: kliknij dostępną kartę w układzie.' : 'Najedź na kartę, żeby ją obejrzeć.'}</div>`;
    return;
  }
  const myTurn = g.actor === me && !g.pending && g.phase === 'play';
  const pr = s.price[me];
  let acts = '';
  if (myTurn) {
    acts += `<button class="btn green" data-act="build" ${pr.ok ? '' : 'disabled'}><span>Zbuduj</span>${pr.chain ? `<span>gratis ${chain(KI.CARDS[s.id].chain_from, true)}</span>` : coin(pr.coins)}</button>`;
    if (!pr.ok) acts += `<span class="why">Brakuje Ziaren: koszt ${pr.coins}, masz ${g.players[me].coins}.</span>`;
    acts += `<button class="btn" data-act="discard"><span>Odrzuć</span>${coin('+' + g.discardGain[me])}</button>`;
    const ws = g.players[me].wonders.filter(w => !w.built);
    if (ws.length && g.wondersLeft > 0) {
      acts += `<h4>Wsuń pod Kurzy Cud</h4>`;
      acts += ws.map(w => { const wp = g.wonderPrice[me][w.id]; return `<button class="btn small" data-act="wonder" data-w="${w.id}" data-hw="${w.id}" ${wp.ok ? '' : 'disabled'}><span>${esc(KI.WONDERS[w.id].name)}</span>${coin(wp.coins)}</button>`; }).join('');
    } else if (ws.length) acts += `<span class="why">Zbudowano już wszystkie Cudy.</span>`;
  } else acts = `<span class="why">Poczekaj na swój ruch.</span>`;
  // Najechany przycisk „Wsuń pod Cud”: w miejscu karty pokaż ten Cud, przyciski zostają (inaczej nie da się kliknąć).
  const pv = hv && hv.t === 'hw' ? wonderHTML(hv.id, 'full') : cardHTML(s.id, 'full');
  box.innerHTML = `<div class="pv">${pv}</div><div class="acts">${acts}</div>`;
}
function ownerNote(g, id) {
  const who = g.players.findIndex(p => p.cards.includes(id));
  if (who < 0) return '';
  return `<span class="why">W Imperium: <b>${esc(g.players[who].name)}</b></span>`;
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
  else if (a === 'sel') { ui.sel = ui.sel === Number(v) ? null : Number(v); ui.hover = null; renderStage(); }
  else if (a === 'build') { G.move({ a: 'build', slot: ui.sel }); ui.sel = null; }
  else if (a === 'discard') { G.move({ a: 'discard', slot: ui.sel }); ui.sel = null; }
  else if (a === 'wonder') { G.move({ a: 'wonder', slot: ui.sel, wonder: b.dataset.w }); ui.sel = null; }
  else if (a === 'token') G.move({ a: 'token', token: v });
  else if (a === 'destroy') G.move({ a: 'destroy', card: v });
  else if (a === 'steal') G.move({ a: 'steal', card: v });
});
addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sel != null) { ui.sel = null; renderStage(); } });

if (APP) document.body.classList.add('app');
route();
