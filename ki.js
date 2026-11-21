// Kurczacze Imperium — wspólny kod klienta (moduł ES): dane kart, połączenie z serwerem PL3Y (albo z lokalnym
// SharedWorkerem w trybie ?local=1), pamięć miejsca w pokoju i nicku. Bez wyglądu: UI buduje się na tym module.
//
// Dane kart pochodzą z jednego źródła: pliku serwera w repo mafia (GitHub Pages serwuje go pod /mafia/...).
import { DATA } from '/mafia/worker/src/kurczacze/data.js';

export { DATA };
export const API = 'https://pl3y-server.pl3y.workers.dev';

// Token sesji PL3Y: wydaje go serwer po podaniu hasła w bramce (/auth.js), tu tylko go odczytujemy.
// Do zapytań HTTP idzie nagłówkiem Authorization, do WebSocketu parametrem ?tok= (przeglądarka nie ustawi nagłówka).
const plToken = () => { try { const t = localStorage.getItem('pl3y_token'); return t && Number(localStorage.getItem('pl3y_token_exp')) > Date.now() ? t : ''; } catch (e) { return ''; } };
const authHead = (h = {}) => { const t = plToken(); return t ? { ...h, Authorization: 'Bearer ' + t } : h; };
const wsTok = () => { const t = plToken(); return t ? '?tok=' + encodeURIComponent(t) : ''; };
// Serwer odrzucił sesję (401): pokaż bramkę hasła.
const onAuthFail = r => { if (r.status === 401 && window.PL3Y && window.PL3Y.expired) window.PL3Y.expired(); };
export const LOCAL = new URLSearchParams(location.search).has('local');
export const CARDS = Object.fromEntries(DATA.cards.map(c => [c.id, c]));
export const WONDERS = Object.fromEntries(DATA.wonders.map(w => [w.id, w]));
export const TOKENS = Object.fromEntries(DATA.tokens.map(t => [t.id, t]));
export const RES = DATA.resources;                 // { S: 'Słoma', … }
export const COLORS = DATA.colors;                 // { brown: 'Zasoby Podwórza', … }
export const TIMES = [0, 60, 90, 120];
export const BOT_LEVELS = [['easy', 'Łatwy'], ['medium', 'Średni'], ['hard', 'Trudny']];
export const botLevelName = k => (BOT_LEVELS.find(([x]) => x === k) || [, ''])[1];

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
};
// Token miejsca w pokoju (powrót po odświeżeniu). Lokalnie osobny klucz; ?slot=N pozwala grać dwoma kartami jednej przeglądarki.
const slot = new URLSearchParams(location.search).get('slot') || '';
const seatKey = code => `kurczacze_${LOCAL ? 'l' : 'p'}${slot}_${code}`;
export const seat = {
  get: code => ls.get(seatKey(code)),
  set: (code, token) => ls.set(seatKey(code), token),
  clear: code => ls.set(seatKey(code), null),
};
export const nick = {
  get: () => ls.get('kurczacze_nick') || '',
  set: v => ls.set('kurczacze_nick', String(v || '').trim().slice(0, 16)),
};

// ---------- połączenie ----------
// Tryb lokalny: dev/local.js (SharedWorker) uruchamia tę samą klasę KiRoom co serwer. Gniazdo udaje WebSocket.
let port = null, cidSeq = 0, ridSeq = 0;
const socks = new Map(), waits = new Map();
function localPort() {
  if (port) return port;
  const w = new SharedWorker(new URL('dev/local.js', import.meta.url), { type: 'module', name: 'kurczacze-dev' });
  port = w.port;
  port.onmessage = ({ data: m }) => {
    if (m.rid && waits.has(m.rid)) { const f = waits.get(m.rid); waits.delete(m.rid); return f(m); }
    const s = socks.get(m.cid); if (!s) return;
    if (m.t === 'open') { s.readyState = 1; s.onopen && s.onopen(); }
    else if (m.t === 'msg') s.onmessage && s.onmessage({ data: m.data });
    else if (m.t === 'close') { s.readyState = 3; socks.delete(m.cid); s.onclose && s.onclose({ code: m.code }); }
  };
  port.start();
  setInterval(() => { for (const [cid, s] of socks) if (s.readyState === 1) port.postMessage({ t: 'send', cid, data: '{"t":"ping"}' }); }, 4000);
  return port;
}
class LocalSocket {
  constructor(code) { this.cid = ++cidSeq; this.readyState = 0; socks.set(this.cid, this); localPort().postMessage({ t: 'connect', cid: this.cid, code }); }
  send(d) { port.postMessage({ t: 'send', cid: this.cid, data: d }); }
  close() { if (this.readyState > 1) return; this.readyState = 3; socks.delete(this.cid); port.postMessage({ t: 'close', cid: this.cid }); }
}
function localCall(req) { return new Promise(res => { const rid = ++ridSeq; waits.set(rid, res); localPort().postMessage({ t: 'api', rid, body: req }); }); }

// opts.bot = 'easy' | 'medium' | 'hard': pokój z botem Kogut Zenek na miejscu 1 (gra startuje po wejściu gracza).
export async function createRoom(opts = {}) {
  const body = opts.bot ? { bot: opts.bot } : null;
  if (LOCAL) {
    const m = await localCall({ method: 'POST', path: '/api/ki/rooms', body });
    if (m.status >= 300) throw new Error('HTTP ' + m.status);
    return m.json;
  }
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(API + '/api/ki/rooms', { method: 'POST', signal: ctl.signal, headers: authHead(body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    onAuthFail(r);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Połączenie z pokojem: sam się wita (tokenem albo nickiem), wznawia po zerwaniu i ponawia niepotwierdzony ruch.
// opts: { code, name, onState(view), onError(msg), onStatus(status) }. Statusy: connecting, online, reconnecting, noroom, full, closed.
export class Game {
  constructor(opts) {
    this.o = opts; this.code = String(opts.code).toUpperCase();
    this.ws = null; this.status = ''; this.retry = 0; this.lastMsg = 0; this.stopped = false;
    this.view = null; this.seat = null; this.pending = null; this.moveSeq = 0;
    this.connect();
    this.beat = setInterval(() => this.heartbeat(), 15000);
    addEventListener('online', () => this.kick());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
  }
  setStatus(s) { if (this.status !== s) { this.status = s; this.o.onStatus && this.o.onStatus(s); } }
  hello() {
    const tok = seat.get(this.code);
    const h = { t: 'hello' };
    if (tok) h.player = tok;
    if (this.o.name) h.join = this.o.name;
    return h;
  }
  connect() {
    if (this.stopped) return;
    this.setStatus(this.retry ? 'reconnecting' : 'connecting');
    let ws;
    try { ws = LOCAL ? new LocalSocket(this.code) : new WebSocket(API.replace(/^http/, 'ws') + '/api/ki/rooms/' + encodeURIComponent(this.code) + '/ws' + wsTok()); }
    catch (e) { return this.later(); }
    this.ws = ws;
    ws.onopen = () => { this.retry = 0; this.lastMsg = Date.now(); this.raw(this.hello()); };
    ws.onmessage = e => {
      this.lastMsg = Date.now();
      let m; try { m = JSON.parse(e.data); } catch (_) { return; }
      if (m.t === 'pong') return;
      if (m.t === 'welcome') {
        this.seat = m.seat; seat.set(this.code, m.token); this.setStatus('online');
        if (this.pending) this.raw(this.pending);      // ruch wysłany przed zerwaniem (serwer odrzuci duplikat)
        return;
      }
      if (m.t === 'state') {
        this.setStatus('online');
        this.view = m.view;
        this.pending = null;
        return this.o.onState && this.o.onState(m.view);
      }
      if (m.t === 'error') {
        if (m.code === 'noroom') { seat.clear(this.code); return this.stop('noroom'); }
        if (m.code === 'full') return this.stop('full');
        if (m.code === 'badplayer') { seat.clear(this.code); if (this.o.name) return this.raw(this.hello()); return this.stop('closed'); }
        if (m.code === 'move') this.pending = null;
        return this.o.onError && this.o.onError(m);
      }
    };
    ws.onclose = e => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (e && e.code === 4404) return this.stop('noroom');
      this.later();
    };
    ws.onerror = () => {};
  }
  later() {
    if (this.stopped) return;
    this.setStatus('reconnecting');
    const delay = Math.min(8000, 400 * 2 ** this.retry++) * (0.75 + Math.random() * 0.5);
    clearTimeout(this.rt); this.rt = setTimeout(() => this.connect(), delay);
  }
  kick() {
    if (this.stopped) return;
    if (!this.ws || this.ws.readyState > 1) { clearTimeout(this.rt); this.retry = 0; this.connect(); }
    else this.heartbeat();
  }
  heartbeat() {
    if (!this.ws || this.ws.readyState !== 1) return;
    if (Date.now() - this.lastMsg > 40000) { const w = this.ws; try { w.close(); } catch (e) {} if (w.onclose) w.onclose({ code: 1006 }); return; }
    this.raw({ t: 'ping' });
  }
  raw(obj) { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(obj)); return true; } return false; }
  stop(reason) {
    this.stopped = true; clearTimeout(this.rt); clearInterval(this.beat);
    this.setStatus(reason || 'closed');
    if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch (e) {} }
  }

  // ---------- polecenia ----------
  // Ruchy (act) — patrz engine.js: {a:'pickWonder', wonder}, {a:'build', slot}, {a:'discard', slot},
  // {a:'wonder', slot, wonder}, {a:'token', token}, {a:'destroy', card}, {a:'steal', card}.
  move(act) { this.pending = { t: 'move', id: `${Date.now().toString(36)}-${++this.moveSeq}`, act }; return this.raw(this.pending); }
  setTime(time) { return this.raw({ t: 'cfg', time }); }
  start() { return this.raw({ t: 'start' }); }
  rematch() { return this.raw({ t: 'rematch' }); }
  leave() { seat.clear(this.code); this.stop('closed'); }
}

// Link zaproszenia dla drugiego gracza.
export function inviteUrl(code, page = '') {
  const base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  return base + page + (LOCAL ? '?local=1' : '') + '#' + code;
}

// Krótki opis kosztu karty/Cudu do podpowiedzi: „2 Ziarna + Słoma, Żwirek”.
export function costText(x) {
  const parts = [];
  if (x.coins) parts.push(`${x.coins} Ziaren`);
  const n = {};
  for (const r of (x.cost || '')) n[r] = (n[r] || 0) + 1;
  for (const [r, k] of Object.entries(n)) parts.push((k > 1 ? k + '× ' : '') + RES[r]);
  return parts.join(' + ') || 'darmowa';
}
