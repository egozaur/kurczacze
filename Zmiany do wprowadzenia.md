# Zmiany do wprowadzenia

Zbiór pomysłów na Kurczacze Imperium 2.0 (UX/UI, bez zmian zasad gry).
Zbieramy tu pomysły i wprowadzamy je wszystkie naraz, w jednej serii zmian.

---

## 1. Podświetlenie tego, co odsłoni wzięcie karty

Po najechaniu na wolną kartę w układzie podświetlają się karty pod nią, które staną się wolne lub się odkryją, z dopiskiem, czy dostanie je rywal w swoim ruchu.

- Po co: to najważniejsza decyzja w turze, a dziś trzeba ją liczyć w głowie.
- Jak: dane o tym, co zakrywa co, już są w układzie (`DATA.rules.layouts`). Zakryte karty pokazujemy tylko jako miejsce, bez treści, bo `view` ich nie wysyła.
- Zakres: klient (`app.js`, `style.css`).

## 2. Skąd się bierze cena karty

Dziś przy karcie, której nie stać, jest tylko „koszt 7, masz 5”. Zamiast tego rozbicie kosztu:

- surowce, które masz (z odhaczeniem),
- brakujące surowce i cena każdego (1 + 2 × produkcja rywala, albo 1 przy stałej cenie z żółtej karty),
- koszt w Ziarnach z karty,
- darmowa budowa przez łańcuch (Ślad Pazurka).

Tak samo przy Cudach (lista „Wsuń pod Cud”).

- Zakres: serwer + klient. `view` w `engine.js` (repo `mafia`) dosyła rozbicie obok `price` / `wonderPrice`, bo UI nie liczy zasad. Do tego testy w `kurczacze.suite.js`.

## 3. Ekran końca gry: ciekawostki

Pod tabelą wyników krótka lista ciekawostek z rozgrywki dla obu graczy, np.:

- najdroższa zbudowana karta,
- ile Ziaren poszło na handel surowcami,
- ile kart spalonych / wsuniętych pod Cuda,
- ile kart zbudowanych za darmo dzięki łańcuchom,
- najdalsze pole Koguta po stronie rywala.

- Zakres: serwer musi zbierać te liczniki w trakcie gry i wysłać je w `view` na końcu, bo klient nie ma pełnej historii po odświeżeniu strony. Klient (`overlayHTML` w `app.js`) tylko je wyświetla.

## 4. Szybkie reakcje

4–6 gotowych tekstów lub ikonek (np. „Kukuryku!”, „Dobry ruch”, „Ała”, „Pośpiesz się 🐔”), które na chwilę pokazują się w dymku nad awatarem rywala. Bez wolnego czatu, więc nic nie trzeba moderować.

- Jak: przycisk z reakcjami przy panelu gracza. Nowa wiadomość protokołu (np. `→ {t:'emote', e}`, `← {t:'emote', seat, e}`), którą serwer (`room.js`) przekazuje drugiemu graczowi bez zapisu w stanie gry. Limit częstotliwości, żeby nie spamować.
- Zakres: serwer (`room.js`, `dev/local.js` działa na tym samym `KiRoom`) + klient (`ki.js`, `app.js`, `style.css`, ewentualnie animacja w `fx.js`).
