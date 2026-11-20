// Okna z górnego paska: „Zasady” (streszczenie zasad) i „Legenda” (wszystkie ikony z podpisami).
// Liczby bierzemy z danych (DATA.rules), żeby zmiana zasad w JSON-ie autora nie rozjechała się z opisem.
import { DATA, RES, COLORS } from './ki.js';
import { icon, coin, sym, chain, eraEgg, SYMBOLS } from './icons.js';
import { cardHTML, wonderHTML, esc } from './cards.js';

const R = DATA.rules || {};
const n = (k, d) => (R[k] ?? d);
const pill = t => `<span class="kc-pill">${esc(t)}</span>`;
const chip = c => `<span class="kc-chip kc-${c}"></span>`;

// ---------- Zasady ----------
const RULES = [
  ['Cel gry', `
    <p>Trzy sposoby na wygraną:</p>
    <ul><li><b>Militarnie</b>: Twój Kogut dochodzi do ostatniego pola po stronie rywala. Wygrywasz od razu.</li>
    <li><b>Naukowo</b>: zbierasz 5 różnych symboli Dziobologii. Wygrywasz od razu.</li>
    <li><b>Cywilnie</b>: po Erze Koguta wygrywa ten, kto ma więcej Złotych Piór ${icon('feather')}.</li></ul>`],
  ['Przygotowanie', `
    <ul><li>Losujemy pierwszego gracza. Dostaje ${n('start_coins', 6)} Ziaren ${icon('coin')}, drugi gracz ${n('start_coins', 6) + n('second_player_bonus', 1)}.</li>
    <li>Na planszę trafiają 4 z 8 Odkryć.</li>
    <li><b>Wybór Cudów</b>: dwie piątki Cudów, kolejność wyboru A B B A, potem B A A B. Piąty Cud z każdej piątki wraca do pudełka, więc każdy ma 4 Cuda.</li>
    <li>W całej grze można zbudować tylko 6 Cudów. Po szóstym pozostałe niezbudowane przepadają.</li></ul>`],
  ['Twoja tura', `
    <p>Bierzesz jedną <b>dostępną</b> kartę z układu (taką, której nie przykrywa żadna karta niżej) i:</p>
    <ul><li><b>Budujesz</b> ją: płacisz Ziarna z kolumny kosztu i musisz mieć surowce (brakujące możesz dokupić).</li>
    <li><b>Odrzucasz</b> ją: dostajesz ${n('discard_base', 3)} Ziarna + 1 za każde 2 swoje żółte karty.</li>
    <li><b>Wsuwasz pod Cud</b>: płacisz koszt jednego ze swoich Cudów i ten Cud jest zbudowany.</li></ul>
    <p>Zakryta karta odwraca się, gdy nic jej już nie przykrywa.</p>`],
  ['Ery i układ', `
    <ul><li>Trzy Ery: Jajka, Pisklęcia i Koguta, po 18 kart w układzie. Rzędy leżą na zmianę odkryte i zakryte.</li>
    <li>Z każdej talii przed Erą odpadają 3 losowe karty. W Erze Koguta dochodzą 3 losowe z 6 Bractw (fioletowe).</li>
    <li>Nową Erę zaczyna słabszy militarnie gracz (ten, w którego stronę stoi Kogut). Gdy Kogut stoi na środku, zaczyna ten, kto nie wykonał ostatniego ruchu.</li>
    <li>Dodatkowa tura z Cudu zbudowanego ostatnią kartą Ery przepada.</li></ul>`],
  ['Surowce i handel', `
    <ul><li>Surowce się <b>nie zużywają</b>: karta produkuje je co turę.</li>
    <li>Brakujący surowiec kupujesz za <b>1 + 2 × stała produkcja rywala</b> tego surowca (z jego kart brązowych i szarych). Produkcja „do wyboru” nie podnosi ceny.</li>
    <li>Żółte karty <b>stałej ceny</b>: dany surowiec kupujesz za 1 Ziarno, od następnej tury.</li>
    <li>Produkcja do wyboru (np. ${icon('S')}/${icon('B')}) działa od razu: co turę jeden z tych surowców.</li>
    <li><b>Ślad Pazurka</b>: jeśli masz kartę ze Śladem ${chain('Widły')}, kartę z tym samym Śladem ${chain('Widły', true)} budujesz za darmo.</li></ul>`],
  ['Wojna o Podwórze', `
    <ul><li>Każda Ostroga ${icon('spur')} przesuwa Koguta o 1 pole w stronę rywala (tor ma po 7 pól na stronę).</li>
    <li>Gdy Kogut pierwszy raz wejdzie na pole 3 / 5 po stronie rywala, rywal traci 3 / 6 Ziaren.</li>
    <li>Pole 7 = natychmiastowe zwycięstwo militarne.</li>
    <li>Na koniec gry: 2 / 4 / 8 Piór za Koguta na polach 1–2 / 3–4 / 5–6 po stronie rywala.</li></ul>`],
  ['Dziobologia (nauka)', `
    <ul><li>Para takich samych symboli = wybierasz jedno Odkrycie z planszy (jeśli jakieś zostało).</li>
    <li>5 różnych symboli = natychmiastowe zwycięstwo naukowe.</li>
    <li>${SYMBOLS[4]} i ${SYMBOLS[5]} są tylko na jednej karcie każdy. ${SYMBOLS[6]} daje tylko Odkrycie Kodeks Grzędowy.</li></ul>`],
  ['Koniec gry i punkty', `
    <p>Po Erze Koguta liczycie Złote Pióra ${icon('feather')}: z kart, z wojny, z Bractw, z Cudów, z Odkryć i 1 za każde ${n('coins_per_vp', 4)} Ziarna.</p>
    <p>Remis: wygrywa ten, kto ma więcej zbudowanych Cudów, potem więcej Ziaren. Dalej remis = wygrywacie obaj.</p>`],
];

export function rulesHTML() {
  return `<p class="win-title">Zasady</p><div class="rules">${RULES.map(([h, b]) => `<section><h3>${h}</h3>${b}</section>`).join('')}</div>`;
}

// ---------- Legenda ----------
const item = (ic, name, desc) => `<div class="lg-item"><span class="lg-ic">${ic}</span><span><b>${esc(name)}</b><small>${desc}</small></span></div>`;
const CHAINS = ['Widły', 'Łopatka', 'Kilof', 'Dzwonek', 'Wiadro', 'Gwizdek', 'Latarenka', 'Koszyk', 'Kłos', 'Chorągiewka', 'Młotek', 'Kurtyna', 'Trąbka', 'Proca', 'Kompas', 'Lunetka'];
const COLOR_DESC = {
  brown: 'Produkują Słomę, Błoto i Żwirek.', grey: 'Produkują Skorupki i Łuski kukurydzy.', blue: 'Dają Złote Pióra.',
  red: 'Dają Ostrogi (wojna).', green: 'Dają symbole Dziobologii.', yellow: 'Ziarna, stała cena, produkcja do wyboru.', purple: 'Bractwa: Pióra na koniec gry.',
};

export function legendHTML() {
  const sec = (h, body, cls = '') => `<section class="${cls}"><h3>${h}</h3><div class="lg-grid">${body}</div></section>`;
  const sample = (DATA.cards.find(c => c.chain_from && c.chain_give && c.cost && c.color !== 'purple') || DATA.cards[0]).id;
  const wsample = DATA.wonders[0].id;
  return `<p class="win-title">Legenda</p><div class="legend">
    <section class="lg-anat"><h3>Jak czytać kartę</h3><div class="lg-anat-in">
      <div class="lg-card">${cardHTML(sample, 'mini')}</div>
      <ol><li><b>Kolumna kosztu</b> (z lewej): Ziarna i surowce. „lub” + przerywane kółko = za darmo ze Śladem.</li>
      <li><b>Pasek efektu</b> (u góry): co daje karta.</li>
      <li><b>Jajko</b> w rogu ilustracji: Era (I, II, III).</li>
      <li><b>Kółko w dolnym rogu</b> ilustracji: Ślad, który karta zostawia.</li>
      <li><b>Kolor ramki</b>: rodzaj karty (niżej).</li></ol>
      <div class="lg-card w">${wonderHTML(wsample)}</div>
      <ol><li><b>Cud</b>: koszt z lewej, efekt z prawej.</li><li>Cud budujesz, wsuwając pod niego kartę z układu.</li></ol></div></section>
    ${sec('Ziarna, Pióra, wojna', [
      item(icon('coin'), 'Ziarna', 'Pieniądze. Liczba na monecie to koszt albo zysk.'),
      item(coin('+3'), 'Zysk Ziaren', '„+3”: dostajesz 3 Ziarna od razu.'),
      item(icon('feather'), 'Złote Pióra', 'Punkty zwycięstwa liczone na koniec gry.'),
      item(icon('spur'), 'Ostroga', 'Przesuwa Koguta o 1 pole w stronę rywala.'),
      item(`${coin(4)}${pill('od rywala')}`, 'Od rywala', 'Rywal traci tyle Ziaren, a Ty je dostajesz.'),
      item(`${coin('−2')}${pill('rywal')}`, 'Strata rywala', 'Rywal traci tyle Ziaren.'),
      item(icon('wonder'), 'Kurzy Cud', 'Liczy się za każdy zbudowany Cud.'),
      item(pill('+ tura'), 'Dodatkowa tura', 'Po tym ruchu grasz jeszcze raz.'),
      item(pill('Odkrycie'), 'Odkrycie', 'Wybierasz jedno Odkrycie (żeton).'),
      item(eraEgg(2), 'Era', 'Jajko z cyfrą: Era karty.'),
    ].join(''))}
    ${sec('Surowce', [
      ...Object.keys(RES).map(r => item(icon(r), RES[r], ['S', 'B', 'Z'].includes(r) ? 'Surowiec z kart brązowych.' : 'Surowiec z kart szarych.')),
      item(`${icon('S')}<span class="kc-sl">/</span>${icon('B')}`, 'Do wyboru', 'Co turę jeden z pokazanych surowców.'),
      item(`${icon('S')}<span class="kc-sl">=</span>${coin(1)}`, 'Stała cena', 'Ten surowiec kupujesz za 1 Ziarno (od następnej tury).'),
    ].join(''))}
    ${sec('Rodzaje kart (kolor ramki)', Object.keys(COLORS).map(c => item(chip(c), COLORS[c], COLOR_DESC[c] || '')).join(''))}
    ${sec('Symbole Dziobologii', SYMBOLS.map(s => item(sym(s), s, '')).join('') + item(sym(SYMBOLS[3]) + sym(SYMBOLS[3]), 'Para = Odkrycie', '5 różnych = wygrana naukowa.'), 'lg-sym')}
    ${sec('Ślady Pazurka', item(chain('Widły'), 'Ciągłe kółko', 'Karta zostawia ten Ślad.') + item(chain('Widły', true), 'Przerywane kółko', 'Zbudujesz za darmo, jeśli masz ten Ślad.')
      + CHAINS.map(c => item(chain(c), c, '')).join(''), 'lg-chain')}
    ${sec('Efekty specjalne', [
      item(`<span class="kc-grp">✕${chip('yellow')}</span>`, 'Zniszcz', 'Odrzuć jedną żółtą kartę rywala.'),
      item(`<span class="kc-grp">↶${chip('brown')}<span class="kc-sl">/</span>${chip('grey')}</span>`, 'Przejmij', 'Zabierz rywalowi brązową lub szarą kartę.'),
      item(`<span class="kc-grp">${coin('+1')}<span class="kc-sl">/</span>${chip('blue')}</span>`, 'Za każdą', '„+1 / niebieska”: 1 za każdą taką kartę.'),
    ].join(''))}
  </div>`;
}
