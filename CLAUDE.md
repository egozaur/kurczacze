# CLAUDE.md

Always respond in Polish (zawsze odpowiadaj po polsku). UI text and code comments are in Polish.

## Project

"Kurczacze Imperium": PL3Y card-drafting game for **2 players in two separate browsers** (desktop-first, phone not a priority). Static HTML/JS, no build step, served at `https://pl3y.pl/kurczacze/` (repo `egozaur/kurczacze`). No Node or Python on the dev machine. The author's source material (rules PDF, xlsx, JSON) lives outside the repo in `Desktop/PL3Y/Kurczacze-imperium/`; don't read the PDFs, this file summarises them.

The mechanics are the author's own variant of a known 2-player drafting genre; names, cards and texts are original. Keep the look PL3Y's own (black and gold like the lobby); don't imitate any commercial game's card art or iconography.

**Status:** engine, server, protocol, local mode and tests are done. **The real UI (`index.html`) is not built yet**: the author will bring graphic ideas first. Until then `dev/stol.html` is a raw test table. After the UI: add the game to `GAMES` in `../egozaur.github.io/index.html`, add `/auth.js` and the PL3Y app meta tags (see the lobby CLAUDE.md).

## Rules (as implemented)
- 3 Eras (Jajka, Pisklęcia, Koguta), 18 cards each laid out in rows (layouts in `DATA.rules.layouts`, rows alternate face-down/face-up, bottom row face-up). A card is free when no card of the row below covers it; in Era 3 the two middle rows of 4 cover only the card directly below.
- Setup: random first player, coins 6 / 7. 4 of 8 Discoveries on the board. Wonder draft: two sets of 5, pick order A B B A / B A A B, the 5th goes back to the box; 4 each, max 6 built in the game (the 6th removes all unbuilt ones). Each Era deck drops 3 random cards; Era 3 gets 3 random of the 6 Guilds (purple).
- Turn: take a free card and **build** it (coins + resources), **discard** it (3 + 1 per 2 own yellow cards), or tuck it under one of your **wonders** (pay the wonder's cost).
- Resources are not consumed. Missing ones are bought: 1 + 2 × the opponent's fixed production of that resource on brown/grey cards (choice production doesn't raise the price). Yellow "fixed price" cards: that resource costs 1, **from the next turn**. Choice production (incl. Kurzy Bazar, Fontanna Rosy) works immediately. Chain symbol (Ślad Pazurka): build free.
- War: each Ostroga moves the rooster 1 field toward the opponent; track ±7. First entry to field 3 / 5 on the opponent's side: they lose 3 / 6 coins (once each). Field 7 = immediate military win. End VP 2/4/8 for fields 1–2/3–4/5–6.
- Science: a pair of the same symbol = pick a Discovery from the board (if any left); 5 different symbols = immediate win. Zegar Piania and Jajo Wszechświata have one card each; Waga Ziarna only from the Kodeks Grzędowy discovery.
- Next Era starts with the player the rooster stands toward (weaker); rooster at 0 = the player who didn't make the last move. An extra turn from a wonder built with the last card of an Era is lost.
- Civil end: VP from cards, war, guilds, wonders, discoveries, chain bonus, 1 per 4 coins. Tie: more built wonders, then more coins, then both win.
- Author's decisions / assumptions: extra turn at Era end is lost; choice production works immediately; Kurzy Bank counts the card being built; effects without a target (no yellow card to destroy, no board discovery) do nothing; a destroyed yellow card loses its fixed price.
- Optional turn timer (0/60/90/120 s, host sets it): on timeout the server makes a default move (first wonder / discard first free card / first option).

## Code
- **Server** (sibling repo `../mafia`, only these files matter): `worker/src/kurczacze/data.js` (generated from the author's JSON; regenerate, don't edit), `engine.js` (pure engine: `setup`, `apply`, `timeoutMove`, `view`, prices `cardPrice`/`wonderPrice`/`tradeCost`, `scores`), `room.js` (DO `KiRoom`: 2 seats, tokens, turn-timer alarm, rematch). Routes `POST /api/ki/rooms`, `GET /api/ki/rooms/:code/ws`. Tests `worker/test/kurczacze.suite.js`.
- `view(s, p)` is the only place that decides what leaves the server: never face-down layout cards, removed deck cards, unused guilds, boxed discoveries or the RNG state. Free slots carry `price[0|1]` (`{coins, chain, ok}`), so the UI never computes rules.
- Protocol: `→ {t:'hello', join:nick | player:token}`, `{t:'cfg', time}` (seat 0), `{t:'start'}` (seat 0), `{t:'move', id, act}`, `{t:'rematch'}`; `← {t:'welcome', seat, token}`, `{t:'state', view}`, `{t:'error', code, err}`. Moves: `{a:'pickWonder', wonder}`, `{a:'build'|'discard', slot}`, `{a:'wonder', slot, wonder}`, `{a:'token', token}`, `{a:'destroy'|'steal', card}`. Duplicate `id` is ignored (resend after reconnect).
- `ki.js` (ES module): imports card data straight from `/mafia/worker/src/kurczacze/data.js` (Pages serves it, one source of truth), `Game` connection class (hello, reconnect, resend of an unconfirmed move), `createRoom()`, `inviteUrl()`, `seat`/`nick` storage (`kurczacze_p<slot>_<CODE>`, `kurczacze_nick`), `costText()`.

## Local testing
- `powershell -ExecutionPolicy Bypass -File dev\serve.ps1` serves the parent folder (`Claude-roboczy`, so `/mafia/...` is reachable) on port 8093 (keep the script ASCII-only).
- `?local=1`: `dev/local.js` (SharedWorker) runs the real `KiRoom`, so two tabs play without Cloudflare. `?slot=N` keeps a separate seat token per tab.
- Test table: `http://localhost:8093/kurczacze/dev/stol.html?local=1` (second player: the invite link + `&slot=2`).
- E2E: `http://localhost:8093/kurczacze/dev/e2e.html?games=3` (`&time=60` for the timer): two test tables click real buttons through whole games and compare results. Real-time headless Edge with `--enable-logging=stderr`, read `E2E RESULT`.
- Engine/server unit tests: `../mafia/worker/test/run.html` (see the mafia CLAUDE.md).
