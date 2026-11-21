// Odtwarza zapis partii (przycisk „Kopiuj / Pobierz zapis partii” na ekranie końca) silnikiem serwera i drukuje
// pełną historię. Przy każdym ruchu pokazuje, co w tej sytuacji wybrałby bot Trudny (z widoku gracza, bez zakrytych kart).
//   node dev/replay.mjs <zapis.json> [--bot]     (--bot = podpowiedzi Trudnego; bez niego sama historia)
import fs from 'node:fs';
import * as E from '../../pl3y-server/src/games/kurczacze/engine.js';
import { botMove } from '../../pl3y-server/src/games/kurczacze/bot.js';

const [file, flag] = process.argv.slice(2);
if (!file) { console.log('Użycie: node dev/replay.mjs <zapis.json> [--bot]'); process.exit(1); }
const rec = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
const s = E.setup(rec.seed, rec.gracze || rec.names);
const name = id => (E.CARDS[id] || E.WONDERS[id] || E.TOKENS[id] || {}).name || id;
const say = (p, a, st) => {
  if (a.a === 'pickWonder') return `Cud ${name(a.wonder)}`;
  if (a.a === 'token') return `Odkrycie ${name(a.token)}`;
  if (a.a === 'destroy' || a.a === 'steal') return `${a.a === 'destroy' ? 'niszczy' : 'przejmuje'} ${name(a.card)}`;
  const id = st.layout[a.slot] && st.layout[a.slot].id;
  return { build: 'buduje', discard: 'odrzuca', wonder: `pod Cud ${name(a.wonder)} wsuwa` }[a.a] + ' ' + name(id);
};
let n = 0, logAt = 0;
for (const [p, act] of rec.ruchy || rec.moves) {
  n++;
  const hint = flag === '--bot' ? botMove(E.view(s, p), 'hard', () => 0.5) : null;
  const tip = hint && JSON.stringify(hint) !== JSON.stringify(act) ? `   [Trudny: ${say(p, hint, s)}]` : '';
  const line = `${String(n).padStart(3)}. ${s.players[p].name}: ${say(p, act, s)}`;
  const r = E.apply(s, p, act);
  if (r.err) { console.log(line, '→ BŁĄD:', r.err); process.exit(2); }
  console.log(line + tip);
  for (; logAt < s.log.length; logAt++) if (!/buduje|odrzuca|wybiera Cud|bierze Odkrycie|niszczy|przejmuje/.test(s.log[logAt].text)) console.log('      · ' + s.log[logAt].text);
}
console.log('\nWynik:', s.score.map((x, i) => `${s.players[i].name} ${x.total} (wojna ${x.military}, karty ${x.cards}, Bractwa ${x.guilds}, Cuda ${x.wonders}, Odkrycia ${x.tokens}, Ziarna ${x.coins})`).join(' : '), '·', s.winner.how);
