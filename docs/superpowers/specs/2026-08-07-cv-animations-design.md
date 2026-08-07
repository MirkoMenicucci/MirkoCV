# Design: Animazioni per il CV online

**Data**: 2026-08-07
**Stato**: Approvato

## Obiettivo

Rendere il sito CV (`index.html` + `style.css`, sito statico senza build step) più dinamico e moderno con animazioni sottili e professionali, senza compromettere la credibilità del sito per i recruiter e senza introdurre dipendenze esterne.

## Contesto esistente

Il sito ha già:
- Sistema di reveal-on-scroll (`.anim` / `.in`) via `IntersectionObserver` (funzione `initObs()`).
- Effetto typing sul sottotitolo hero (`startTyping()`).
- Hover su bottoni/card/skill-bar con `transition`.
- Cursore lampeggiante (`@keyframes blink`), scroll indicator animato (`@keyframes scrollLine`).
- Un solo file CSS (`style.css`, 548 righe) e uno script inline in `index.html`.

## Ambito

Quattro aggiunte, tutte in CSS puro + vanilla JS dentro i file esistenti:

### 1. Intro animata al caricamento
Al primo load (non ripetuta sugli scroll successivi), navbar e hero si compongono in sequenza invece di apparire tutti insieme:
1. Navbar: fade-in + leggero slide dall'alto (~0.1s delay).
2. Nome/ruolo hero (`h-top`): fade-up staggered.
3. Le 4 card floating (`.hfc`): fade-up in sequenza, stesso pattern di `--d` già usato per `.anim`.
4. Scroll indicator: fade-in per ultimo.

Implementazione: classe `loaded` aggiunta al `<body>` dopo `DOMContentLoaded` (non serve attendere il fetch di `db.json`, perché il markup statico di navbar/hero esiste già nell'HTML). Nuove `@keyframes` + classi di utilità con `animation-delay` scalato. Durata totale sequenza ≈ 1.2s.

### 2. Numeri che contano (count-up)
Le statistiche in hero (`.hfstat-v`: 8+, 50+, 40+) e in About (`.stat-v`, popolate da `db.json`) contano da 0 al valore finale quando entrano in viewport.

Implementazione: nuovo `IntersectionObserver` (accanto ad `ao`/`fo` già in `initObs()`) che, per ogni elemento target,:
- estrae la parte numerica e l'eventuale suffisso (`+`, `%`) dal `textContent`;
- anima il valore con `requestAnimationFrame` ed easing (~1.2s);
- imposta il valore finale esatto a fine animazione;
- osserva una sola volta (`unobserve` dopo il trigger, come già fa `ao`).

### 3. Nav e scroll più vivi
- **Sezione attiva in navbar**: `IntersectionObserver` sulle `<section id="...">` del `<main>`; il `.tn-link` con `href` corrispondente riceve classe `.active` (underline via `::after` con `transform: scaleX()`, transizione coerente con `--ease` esistente).
- **Progress bar di lettura**: barra fissa 2px sotto la navbar, colore `--acc`, larghezza = `scrollY / (scrollHeight - innerHeight) * 100%`. Aggiornata nello scroll listener esistente (quello che già gestisce `.scrolled` su `#topnav`), throttled via `requestAnimationFrame`.
- **Parallax leggero sulla foto hero**: `.h-bg` si sposta a velocità ridotta (fattore ~0.1) rispetto allo scroll, solo mentre la hero è in viewport. Stesso scroll listener, throttled via `requestAnimationFrame`.

### 4. Accessibilità e performance
- Tutto il nuovo motion è disattivato/ridotto sotto `@media (prefers-reduced-motion: reduce)`: intro istantanea (nessun delay/animation), niente parallax, count-up salta direttamente al valore finale.
- Scroll listener con throttling via `requestAnimationFrame` per evitare layout thrash (progress bar + parallax condividono lo stesso rAF tick).
- Nessuna nuova dipendenza esterna (niente librerie di animazione).

## Fuori ambito

- Tilt 3D / hover avanzati su card e skill (esplicitamente esclusi dalla scelta dell'utente).
- Modifiche a contenuti, dati (`db.json`), layout strutturale o SEO/meta esistenti.
- Cursore custom.

## File coinvolti

- `style.css`: nuove `@keyframes`, classi utility per intro, stile underline nav attivo, stile progress bar, media query `prefers-reduced-motion`.
- `index.html`: markup minimo aggiuntivo (elemento progress bar), estensioni allo script inline esistente (`initObs()`, scroll listener, nuova funzione `runIntro()` o simile).

## Testing

Sito statico senza suite di test automatici. Verifica manuale nel browser:
- Reload della pagina → sequenza intro visibile una sola volta.
- Scroll fino a ciascuna sezione → numeri che contano corretti, nav attiva che si aggiorna, progress bar coerente con la posizione di scroll, parallax percepibile solo in hero.
- Attivare "riduci movimento" nel sistema operativo → verificare che le animazioni siano disattivate/ridotte.
