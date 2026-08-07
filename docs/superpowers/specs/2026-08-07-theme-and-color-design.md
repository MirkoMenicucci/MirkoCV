# Design: Accent blu + tema chiaro/scuro

**Data**: 2026-08-07
**Stato**: Approvato

## Obiettivo

Sostituire l'accent color arancione con un blu (scelto per l'associazione psicologica a fiducia/competenza, utile in un contesto di selezione da parte di recruiter), e sostituire il tema scuro fisso con un tema che segue la preferenza di sistema (`prefers-color-scheme`), con possibilità di override manuale persistente tramite un pulsante in navbar.

## Decisioni chiave (confermate con l'utente)

1. **Colore**: blu, non arancione.
2. **Hero**: la sezione hero (foto full-screen, overlay, testo, card floating) resta **sempre scura**, in entrambi i temi — non cambia.
3. **Navbar**: resta **sempre "scura"** come chrome fisso del brand (testo chiaro, sfondo blur scuro da `.scrolled` in poi), indipendentemente dal tema attivo nelle sezioni sottostanti. Evita un cambio di colore incoerente a metà scroll.
4. **Sezioni sotto la hero** (About, Esperienza, Skills, Progetti, CV, Contatti, footer, modale PDF): theme-aware, cambiano con il tema.

## 1. Rebrand colore: arancione → blu

Nuovi valori token (in `:root`, sostituendo i tre esistenti):

```css
--acc: #2563EB;   /* era #F97316 */
--acl: #3B82F6;   /* era #FB923C */
--agl: rgba(37,99,235,.32);   /* era rgba(249,115,22,.32) */
```

Il gradiente viola (`#a855f7` nelle skill-bar, `rgba(124,58,237,.1)` nella card CV) **resta invariato** — blu+viola funziona come coppia complementare.

Tutti gli usi hardcoded del vecchio arancione nel CSS (bordi hover, glow, badge/pill trasparenti, box-shadow) usano lo stesso terzetto decimale `249,115,22`. Vanno sostituiti globalmente con `37,99,235` (equivalente decimale di `#2563EB`), mantenendo invariata l'opacità di ciascuna occorrenza. Punti noti (da verificare tutti in fase di implementazione, l'elenco che segue non è necessariamente esaustivo):

`.hfc:hover`, `.hcard-exp-item`, `.about-img-overlay`, `.about-quote`, `.stat-card:hover`, `.exp-item-dot`, `.exp-item-line::after`, `.exp-item-card:hover`, `.exp-item-per`, `.tag`, `.sfill` (box-shadow), `.pip.on`, `.proj-nda-icon`, `.proj-card:hover`, `.proj-ov`, `.cv-main-card:hover`, `.cv-main-bg` (primo radial-gradient), `.cv-main-icon`, `.cv-cert-ico`, `.cert-view-btn:hover`, `.ccard:hover`, `.ccard-ico`, `.soc-link:hover`.

Questo rebrand è indipendente dal tema chiaro/scuro: si applica una volta sola ai token e alle occorrenze hardcoded, non richiede logica condizionale.

## 2. Architettura tema chiaro/scuro

Pattern a tre livelli (light come base, dark via media query, entrambi sovrascrivibili da un attributo esplicito):

```css
:root{
    /* valori LIGHT come default/fallback */
    --bg: #FFFFFF;
    --bg2: #F6F7F9;
    --sur: rgba(10,10,15,.035);
    --brd: rgba(10,10,15,.09);
    --t1: #0A0A0F;
    --t2: #545B6B;
    --t3: #9AA0AC;
    --wm: rgba(10,10,15,.03);      /* nuovo token: watermark numeri sezione */
    --scrollbar-thumb: #D7DAE0;    /* nuovo token */
    --acc: #2563EB;
    --acl: #3B82F6;
    --agl: rgba(37,99,235,.32);
    --ease: cubic-bezier(.22,1,.36,1);
}

@media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
        --bg: #0A0A0F;
        --bg2: #0E0E16;
        --sur: rgba(255,255,255,.04);
        --brd: rgba(255,255,255,.08);
        --t1: #FFFFFF;
        --t2: #8A909F;
        --t3: #3E4455;
        --wm: rgba(255,255,255,.025);
        --scrollbar-thumb: #1e2535;
    }
}

:root[data-theme="dark"]{
    --bg: #0A0A0F;
    --bg2: #0E0E16;
    --sur: rgba(255,255,255,.04);
    --brd: rgba(255,255,255,.08);
    --t1: #FFFFFF;
    --t2: #8A909F;
    --t3: #3E4455;
    --wm: rgba(255,255,255,.025);
    --scrollbar-thumb: #1e2535;
}
```

`--acc`/`--acl`/`--agl` sono identici nei due temi (il blu è stato verificato leggibile su sfondo sia scuro che chiaro) e restano quindi solo nel blocco base, senza bisogno di essere ripetuti nei blocchi tema.

`data-theme="light"|"dark"` viene impostato sull'elemento `<html>` da JS solo quando l'utente sceglie manualmente; finché non lo fa, nessun attributo è presente e la sola media query `prefers-color-scheme` decide — quindi il sito segue il sistema in tempo reale, senza bisogno di JS per quel caso (la media query si aggiorna da sola se l'utente cambia tema del sistema operativo mentre il sito è aperto).

## 3. Navbar: chrome sempre scuro, disaccoppiato dai token di tema

`#topnav`, `.tn-logo`, `.tn-links`, `.tn-link`, `.tn-burger`, `.tn-mobile` oggi usano `var(--t1)`/`var(--t2)`/`var(--brd)` — se questi token diventano theme-aware, la navbar erediterebbe involontariamente i colori chiari. Vanno quindi scollegati dai token condivisi e passati a valori fissi equivalenti a quelli attuali (dark), indipendenti dal tema:

- `.tn-link{color:rgba(255,255,255,.6)}` (era `var(--t2)`)
- `.tn-link:hover, .tn-link.active{color:#fff}` (era `var(--t1)`)
- `.tn-burger{color:#fff}` (era `var(--t1)`)
- `.tn-mobile{border-bottom-color:rgba(255,255,255,.08)}` (era `var(--brd)`)
- `.tn-mobile a{color:rgba(255,255,255,.6)}` (era `var(--t2)`), `.tn-mobile a:hover{color:#fff}` (era `var(--t1)`)
- `#topnav.scrolled` già usa `rgba(10,10,15,.9)` hardcoded — resta invariato.

`.tn-logo` e `#scroll-progress` usano già `var(--acc)`, che è identico nei due temi: nessuna modifica necessaria lì.

## 4. Valori hardcoded fuori dalla hero/navbar che richiedono un override per il tema chiaro

Questi selettori vivono nelle sezioni sotto la hero e oggi usano `rgba(255,255,255,X)` letterali (non token), pensati per sfondo scuro. Il tema scuro è già il default della pagina (i valori attuali restano validi lì, nessuna modifica richiesta in quel percorso). Servono solo gli override per il tema chiaro, con lo stesso pattern a due blocchi già usato in sezione 2 per i token principali — un blocco per il caso "segue il sistema ed è chiaro" e uno per l'override manuale esplicito:

```css
@media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]){
        /* override selettori sotto */
    }
}
:root[data-theme="light"]{
    /* stessi override selettori sotto */
}
```

Selettori e valori da inserire in entrambi i blocchi sopra (stesso contenuto duplicato nei due blocchi, non nuovi token dedicati — coerenza con l'approccio scelto per non moltiplicare la superficie di variabili per un pugno di override una tantum):

- `#about::before` ecc. (watermark numeri sezione): usa il nuovo token `--wm` definito sopra, al posto del valore letterale `rgba(255,255,255,.025)`.
- `.strack` (sfondo traccia skill-bar): `rgba(255,255,255,.06)` → equivalente scuro-su-chiaro `rgba(10,10,15,.06)`.
- `.pip` (pallino soft-skill non attivo): `background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.1)` → `rgba(10,10,15,.07)` / `rgba(10,10,15,.1)`.
- `.proj-img` (placeholder immagine progetto): `rgba(255,255,255,.03)` → `rgba(10,10,15,.03)`.
- `.cert-view-btn` (sfondo pulsante icona): `rgba(255,255,255,.04)` → `rgba(10,10,15,.04)`.
- `.modal-x` (pulsante chiusura modale PDF): `background:rgba(255,255,255,.07)`, hover `rgba(255,255,255,.14)` → equivalenti scuro-su-chiaro.
- `.btn-outline:hover` (bottone outline, usato nella sezione CV): `border-color:rgba(255,255,255,.25)`, `background:rgba(255,255,255,.05)` → equivalenti scuro-su-chiaro.
- `::-webkit-scrollbar-thumb`: usa il nuovo token `--scrollbar-thumb` al posto del valore letterale `#1e2535`.

`.modal-bg` (backdrop scuro dietro la modale PDF, `rgba(0,0,0,.78)`) **resta invariato in entrambi i temi** — è uno scrim, non contenuto di pagina, ed è normale che resti scuro anche su siti a tema chiaro.

## 5. Selettore tema (UI + persistenza)

- Pulsante icona (sole/luna, icone `lucide` già caricate nel progetto) in navbar, sempre visibile — anche nella vista mobile/tablet dove `.tn-links` e il bottone CV si nascondono, il toggle resta accessibile.
- Comportamento: mostra l'icona rilevante per il tema *corrente* (es. luna se il tema attivo è chiaro, invita a passare a scuro); un click imposta esplicitamente `data-theme="light"` o `data-theme="dark"` su `<html>`.
- Persistenza: la scelta manuale viene salvata in `localStorage` (chiave `theme`, valore `"light"` o `"dark"`) e riapplicata a ogni caricamento pagina. Se l'utente non ha mai usato il pulsante, non c'è alcuna voce salvata e il sito segue sempre `prefers-color-scheme`, live.
- Nessun listener JS `matchMedia` è necessario per il caso "segue il sistema": la CSS media query si aggiorna da sola. JS serve solo per applicare/salvare l'override esplicito al click e per riapplicare all'avvio l'eventuale preferenza salvata.

## Fuori ambito

- Modifica dei colori all'interno della hero (fissata scura).
- Modifica dei colori della navbar (fissata scura come chrome del brand).
- Redesign di componenti o layout: solo colori/token, nessuna modifica strutturale.
- Colore accent diverso tra tema chiaro e scuro (si è verificato che un unico blu funziona in entrambi).

## File coinvolti

- `style.css`: nuovi/modificati token, blocchi `@media`/`[data-theme]`, disaccoppiamento navbar, override valori hardcoded.
- `index.html`: markup del pulsante toggle tema in navbar (desktop e mobile), script inline esistente esteso con la logica di lettura/scrittura `localStorage` e applicazione `data-theme`.

## Testing

Nessuna suite di test automatica (sito statico). Verifica manuale nel browser:
- Sistema in dark mode, nessuna preferenza salvata → sito scuro (invariato rispetto a oggi, a parte il colore blu).
- Sistema in light mode, nessuna preferenza salvata → sito chiaro, hero e navbar restano scure.
- Click sul toggle → cambio immediato, persiste dopo un reload.
- Cambio del tema di sistema mentre il sito è aperto, senza preferenza salvata → il sito si aggiorna da solo.
- Cambio del tema di sistema con una preferenza salvata → il sito NON cambia (l'override manuale vince).
- Verifica visiva di ogni sezione in entrambi i temi: watermark numeri leggibile ma discreto, skill-bar/pallini soft-skill visibili, placeholder immagini progetti visibile, pulsante chiusura modale PDF visibile, bottone outline hover visibile.
