// Kopiuje dane kart z serwera (jedyne źródło) do ./data.js strony. node dev/sync-data.mjs [--check]
// --check: tylko porównuje (kod wyjścia 1, gdy kopie się różnią).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', '..', 'pl3y-server', 'src', 'games', 'kurczacze', 'data.js');
const dst = path.join(here, '..', 'data.js');
if (!fs.existsSync(src)) { console.error('Brak repo pl3y-server obok:', src); process.exit(2); }
const a = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const b = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8').replace(/\r\n/g, '\n') : '';
if (process.argv.includes('--check')) { console.log(a === b ? 'data.js zgodne z serwerem' : 'data.js RÓŻNI SIĘ od serwera'); process.exit(a === b ? 0 : 1); }
fs.writeFileSync(dst, a);
console.log(a === b ? 'bez zmian' : 'zaktualizowano data.js');
