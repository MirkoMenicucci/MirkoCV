# Design: Hero theme-reattiva con crossfade "si accende la luce"

**Data**: 2026-08-08
**Stato**: Approvato

## Obiettivo

La hero (foto full-screen, overlay, nome, card floating, scroll indicator) era stata deliberatamente esclusa dal sistema di tema chiaro/scuro introdotto in `docs/superpowers/specs/2026-08-07-theme-and-color-design.md` (restava sempre scura). Questa spec la rende invece parte del sistema di tema, con un cambio di foto (dark → light) e un crossfade fluido di tutti gli elementi coinvolti, per dare l'effetto "si accende la luce" quando si passa a light mode.

## Contesto

- Il branch corrente (`worktree-theme-and-color`) ha già completato il rebrand colore blu e il sistema tema chiaro/scuro (token `--bg`,`--bg2`,`--sur`,`--brd`,`--t1`,`--t2`,`--t3`,`--wm`,`--scrollbar-thumb`,`--acc`,`--acl`,`--agl` in tre blocchi: `:root` base-light, `@media(prefers-color-scheme:dark):root:not([data-theme="light"])`, `:root[data-theme="dark"]`).
- Questa spec continua sullo stesso branch, come estensione diretta di quel lavoro.
- Nuovo asset: `profile-li.jpg` (foto profilo per light mode, sfondo grigio chiaro, stesso soggetto di `profile.jpg`) — attualmente presente solo nella cartella principale del repository (`/Users/mirkomenicucci/Dev/MirkoCV/profile-li.jpg`), non ancora nel worktree né tracciato da git. Va copiato nel worktree e aggiunto al repository come parte dell'implementazione.

## 1. Foto: crossfade a due livelli

Le due foto (`profile.jpg` dark, `profile-li.jpg` light) restano entrambe nel DOM, sovrapposte in un contenitore comune, e passano da una all'altra con una transizione di opacità.

```html
<div class="h-bg-wrap">
    <img src="profile.jpg" class="h-bg h-bg-dark" alt="Mirko Menicucci" onerror="this.style.opacity='0'">
    <img src="profile-li.jpg" class="h-bg h-bg-light" alt="Mirko Menicucci" onerror="this.style.opacity='0'">
</div>
```

```css
.h-bg-wrap{position:absolute;inset:0;z-index:0}
.h-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;transition:opacity .9s ease}
.h-bg-dark{opacity:1}
.h-bg-light{opacity:0}
@media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]) .h-bg-dark{opacity:0}
    :root:not([data-theme="dark"]) .h-bg-light{opacity:1}
}
[data-theme="light"] .h-bg-dark{opacity:0}
[data-theme="light"] .h-bg-light{opacity:1}
```

Il contenitore `.h-bg-wrap` eredita esattamente le proprietà di posizionamento che oggi ha `.h-bg` (`position:absolute;inset:0;z-index:0`); le due `<img>` condividono la classe `.h-bg` solo per le proprietà comuni (dimensioni, `object-fit`, `object-position`, `transition`), mentre l'opacità è governata dalle classi modificatrici `.h-bg-dark`/`.h-bg-light`.

## 2. Overlay: stesso meccanismo, gradiente chiaro

```html
<div class="h-overlay h-overlay-dark" aria-hidden="true"></div>
<div class="h-overlay h-overlay-light" aria-hidden="true"></div>
```

```css
.h-overlay{position:absolute;inset:0;z-index:1;transition:opacity .9s ease}
.h-overlay-dark{
    background:linear-gradient(to bottom,
        rgba(10,10,15,.72) 0%,
        rgba(10,10,15,.12) 30%,
        rgba(10,10,15,.08) 58%,
        rgba(10,10,15,.88) 100%
    );
    opacity:1;
}
.h-overlay-light{
    background:linear-gradient(to bottom,
        rgba(255,255,255,.75) 0%,
        rgba(255,255,255,.15) 30%,
        rgba(255,255,255,.10) 58%,
        rgba(255,255,255,.90) 100%
    );
    opacity:0;
}
@media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]) .h-overlay-dark{opacity:0}
    :root:not([data-theme="dark"]) .h-overlay-light{opacity:1}
}
[data-theme="light"] .h-overlay-dark{opacity:0}
[data-theme="light"] .h-overlay-light{opacity:1}
```

Il gradiente light mantiene la stessa "forma" (curva di opacità) del gradiente dark, in bianco invece che in nero.

## 3. Token di testo/card della hero

Nuovi 12 token, seguendo lo stesso pattern a tre blocchi già usato per i token generali del sito (bare `:root` = valore light, `@media(prefers-color-scheme:dark):root:not([data-theme="light"])` = valore dark, `:root[data-theme="dark"]` = stesso valore dark per l'override manuale). Vanno aggiunti agli stessi tre blocchi già esistenti in `style.css`, non in blocchi nuovi.

| Token | Light | Dark (= valore hardcoded attuale) | Usato da |
|---|---|---|---|
| `--hero-name-shadow` | `rgba(0,0,0,.06)` | `rgba(0,0,0,.5)` | `.h-name` text-shadow |
| `--hero-sub` | `rgba(10,10,15,.72)` | `rgba(255,255,255,.7)` | `.h-subtitle` color |
| `--hero-sub-shadow` | `rgba(0,0,0,.06)` | `rgba(0,0,0,.6)` | `.h-subtitle` text-shadow |
| `--hero-domain` | `rgba(10,10,15,.35)` | `rgba(255,255,255,.35)` | `.h-domain` color |
| `--hero-card-bg` | `rgba(10,10,15,.035)` | `rgba(255,255,255,.04)` | `.hfc` background |
| `--hero-card-brd` | `rgba(10,10,15,.1)` | `rgba(255,255,255,.08)` | `.hfc` border |
| `--hero-card-label` | `rgba(10,10,15,.5)` | `rgba(255,255,255,.45)` | `.hfc-label`, `.hsd-label` color |
| `--hero-card-text` | `rgba(10,10,15,.68)` | `rgba(255,255,255,.65)` | `.hfc-text`, `.hfc-list li` color |
| `--hero-stat-l` | `rgba(10,10,15,.4)` | `rgba(255,255,255,.35)` | `.hfstat-l` color |
| `--hero-exp-role` | `rgba(10,10,15,.62)` | `rgba(255,255,255,.6)` | `.hcard-exp-role` color |
| `--hero-exp-period` | `rgba(10,10,15,.32)` | `rgba(255,255,255,.3)` | `.hcard-exp-period` color |
| `--hero-sd-line` | `rgba(10,10,15,.18)` | `rgba(255,255,255,.15)` | `.hsd-line` background |

`.h-name` non ha un `color` esplicito oggi (eredita `body{color:var(--t1)}`, già theme-reattivo) — resta così, non serve un token dedicato, basta aggiungere `transition:color .8s ease` su `.h-name` perché il cambio erediti comunque una transizione fluida.

`.h-orange`, `.h-cur`, `.hfc-label em`, `.hfstat-v`, `.hfc-list svg`, `.hcard-exp-co` restano su `var(--acc)` — invariato, l'accent è identico in entrambi i temi (nessuna modifica necessaria, coerente con la decisione già presa nella spec del 2026-08-07).

## 4. Transizioni

- Foto e overlay: `transition:opacity .9s ease` (già incluso nelle regole sopra).
- Ogni selettore di testo che consuma uno dei 12 nuovi token: aggiungere `transition:color .8s ease` (o `background-color`/`border-color` a seconda della proprietà — vedi tabella).
- `.hfc` ha già una `transition` per l'hover (`border-color .3s,transform .3s var(--ease),box-shadow .3s`); aggiungere `background-color .3s` alla stessa lista, così il cambio tema di sfondo/bordo della card usa la stessa velocità già in uso per l'hover invece di una nuova durata dedicata — scelta pragmatica per non introdurre un secondo timing su un elemento che già transiziona.

## 5. Aggiornamento JS (parallax)

Il parallax esistente (`initScrollFX()` in `index.html`) seleziona oggi `document.querySelector('.h-bg')` per applicare `transform:translateY(...)` durante lo scroll. Con due immagini che condividono la classe `.h-bg`, `querySelector` prenderebbe solo la prima, disallineando le due foto durante lo scroll. Il fix è ripuntare la selezione al nuovo contenitore: `document.querySelector('.h-bg-wrap')` — il transform si applica al contenitore, muovendo entrambe le foto insieme, invariato nel comportamento visibile.

## 6. Intro al caricamento

L'animazione di intro esistente (`body.loaded .h-bg{animation:introFade...}`, `body:not(.loaded) .h-bg{opacity:0}`) va ripuntata da `.h-bg` a `.h-bg-wrap` — l'intero contenitore (con dentro la foto già corretta per il tema attivo) appare con un fade-in una tantum al primo caricamento, esattamente come oggi; il crossfade tra le due foto resta un meccanismo indipendente e separato, comandato dal tema.

## 7. Asset

`profile-li.jpg` va copiato da `/Users/mirkomenicucci/Dev/MirkoCV/profile-li.jpg` (percorso del repository principale, file non tracciato) dentro questo worktree, poi aggiunto a git insieme al resto delle modifiche.

## Fuori ambito

- Nessuna modifica alla navbar (resta sempre scura, invariato).
- Nessuna modifica alle altre sezioni del sito (about, esperienza, skills, progetti, cv, contatti) — già a posto dal lavoro precedente.
- Nessuna modifica al meccanismo di toggle/persistenza del tema (resta quello già costruito).

## File coinvolti

- `profile-li.jpg`: nuovo asset, copiato e aggiunto al repository.
- `index.html`: markup hero (contenitore + doppia foto + doppio overlay), rinominare il selettore JS del parallax e dell'intro.
- `style.css`: nuovi 12 token nei tre blocchi tema esistenti, nuove regole per `.h-bg-wrap`/`.h-bg-dark`/`.h-bg-light`/`.h-overlay-dark`/`.h-overlay-light`, aggiornamento dei selettori di testo/card della hero per usare i nuovi token invece dei valori hardcoded, aggiunta di `transition` dove indicato.

## Testing

Nessuna suite di test automatica. Verifica manuale nel browser:
- Reload con sistema in dark mode → foto/overlay/testo hero identici a prima di questa modifica.
- Reload con sistema in light mode → foto chiara, overlay chiaro, testo scuro, card in stile vetro chiaro.
- Toggle manuale del tema mentre la pagina è aperta → transizione fluida di ~900ms su foto/overlay, testo e card che cambiano colore in modo graduale, non a scatto.
- Cambio del tema di sistema mentre la pagina è aperta (senza preferenza salvata) → stesso crossfade fluido, automatico.
- Scroll nella hero in entrambi i temi → il parallax continua a muovere insieme foto (quella visibile) e overlay, senza disallineamenti.
- Reload della pagina → l'intro (fade-in iniziale di navbar/hero/card) funziona come prima, mostrando fin da subito la foto corretta per il tema attivo.
