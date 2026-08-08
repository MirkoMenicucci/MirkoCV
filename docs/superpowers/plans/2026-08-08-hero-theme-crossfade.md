# Hero Theme Crossfade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero section (photo, overlay, name, floating cards, scroll indicator) theme-reactive with a smooth ~900ms crossfade, per `docs/superpowers/specs/2026-08-08-hero-theme-crossfade-design.md`. Previously the hero was deliberately excluded from the site's light/dark theme system; this plan reverses that and gives it its own graceful "light switching on" transition instead of an instant snap.

**Architecture:** Two-layer opacity crossfade for the photo and the overlay (dark/light versions of each stacked and cross-faded via CSS `transition:opacity`), plus 12 new theme-reactive CSS custom properties (following the exact 3-tier pattern — bare `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="dark"]` — already established in this branch) for hero text/card colors, each with `transition:color`/`background-color`/`border-color` for a smooth fade. One JS selector rename (parallax) to keep working with the new two-image structure.

**Tech Stack:** Plain HTML/CSS/JS. Local verification via `python3 -m http.server` (already running on `127.0.0.1:8792` for this worktree).

## Global Constraints

- No new external dependencies.
- The navbar stays exactly as it is today (always-dark chrome) — this plan does not touch it.
- The accent color (`--acc`) stays single-valued across themes, unchanged — hero elements that already use `var(--acc)` (`.h-orange`, `.h-cur`, `.hfc-label em`, `.hfstat-v`, `.hfc-list svg`, `.hcard-exp-co`) are NOT touched by this plan.
- All new theme-reactive values must follow the existing 3-tier token pattern (bare `:root` = light, `@media (prefers-color-scheme: dark): :root:not([data-theme="light"])` = dark, `:root[data-theme="dark"]` = dark) — do not introduce a new selector-override-block pattern (a previous round on this branch hit a CSS-specificity bug with that approach and it was replaced with tokens for exactly this reason).
- Every new dark-theme token value must exactly match the corresponding value the hero already renders today in dark mode — dark mode must be visually unchanged after this plan.
- This project has no automated test suite. Every task's "test" step is a manual visual check against the running local server — mandatory, not optional.

---

### Task 1: Two-layer crossfade for hero photo and overlay

**Files:**
- Create: `profile-li.jpg` (copied into this worktree from the main repo checkout)
- Modify: `index.html` (hero markup, one JS selector rename)
- Modify: `style.css` (photo/overlay layer CSS, intro-animation selector rename)

**Interfaces:**
- Produces: `.h-bg-wrap` (replaces `.h-bg` as the element the parallax/intro logic targets), `.h-bg-dark`/`.h-bg-light`, `.h-overlay-dark`/`.h-overlay-light`. Task 2 does not depend on these but must not remove or rename them.

- [ ] **Step 1: Copy the light-mode photo into the worktree**

```bash
cp /Users/mirkomenicucci/Dev/MirkoCV/profile-li.jpg /Users/mirkomenicucci/Dev/MirkoCV/.claude/worktrees/theme-and-color/profile-li.jpg
```

Verify: `ls -la profile-li.jpg` shows the file, and `file profile-li.jpg` reports a valid JPEG.

- [ ] **Step 2: Replace the hero photo/overlay markup**

In `index.html`, find:

```html
    <!-- Foto full-screen come soggetto principale -->
    <img src="profile.jpg" class="h-bg" alt="Mirko Menicucci"
         onerror="this.style.opacity='0'">

    <!-- Overlay: leggero al centro, scuro in alto e in basso -->
    <div class="h-overlay" aria-hidden="true"></div>
```

Replace with:

```html
    <!-- Foto full-screen come soggetto principale — crossfade dark/light -->
    <div class="h-bg-wrap">
        <img src="profile.jpg" class="h-bg h-bg-dark" alt="Mirko Menicucci"
             onerror="this.style.opacity='0'">
        <img src="profile-li.jpg" class="h-bg h-bg-light" alt="Mirko Menicucci"
             onerror="this.style.opacity='0'">
    </div>

    <!-- Overlay: leggero al centro, scuro/chiaro in alto e in basso a seconda del tema -->
    <div class="h-overlay h-overlay-dark" aria-hidden="true"></div>
    <div class="h-overlay h-overlay-light" aria-hidden="true"></div>
```

- [ ] **Step 3: Replace the hero photo/overlay CSS**

In `style.css`, find:

```css
/* Foto full-screen */
.h-bg{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:center 15%;
    z-index:0;
}

/* Overlay: trasparente al centro, scuro in alto e in basso */
.h-overlay{
    position:absolute;inset:0;z-index:1;
    background:
        linear-gradient(to bottom,
            rgba(10,10,15,.72) 0%,
            rgba(10,10,15,.12) 30%,
            rgba(10,10,15,.08) 58%,
            rgba(10,10,15,.88) 100%
        );
}
```

Replace with:

```css
/* Foto full-screen — due livelli (dark/light) in crossfade */
.h-bg-wrap{position:absolute;inset:0;z-index:0}
.h-bg{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:center 15%;
    transition:opacity .9s ease;
}
.h-bg-dark{opacity:1}
.h-bg-light{opacity:0}
@media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]) .h-bg-dark{opacity:0}
    :root:not([data-theme="dark"]) .h-bg-light{opacity:1}
}
[data-theme="light"] .h-bg-dark{opacity:0}
[data-theme="light"] .h-bg-light{opacity:1}

/* Overlay: trasparente al centro, scuro/chiaro in alto e in basso — due livelli in crossfade */
.h-overlay{position:absolute;inset:0;z-index:1;transition:opacity .9s ease}
.h-overlay-dark{
    background:
        linear-gradient(to bottom,
            rgba(10,10,15,.72) 0%,
            rgba(10,10,15,.12) 30%,
            rgba(10,10,15,.08) 58%,
            rgba(10,10,15,.88) 100%
        );
    opacity:1;
}
.h-overlay-light{
    background:
        linear-gradient(to bottom,
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

- [ ] **Step 4: Retarget the load-intro animation from `.h-bg` to `.h-bg-wrap`**

In `style.css`, in the `LOAD INTRO` block, find these two lines (part of a larger rule — only these two specific references change):

```css
    body:not(.loaded) .h-bg,
```

and

```css
    body.loaded .h-bg{animation:introFade 1.2s var(--ease) backwards}
```

Change both occurrences of `.h-bg` in these two lines specifically to `.h-bg-wrap` (leave every other line in that block — `#topnav`, `.h-top`, `.hfc`, `.h-scroll-down` — exactly as they are):

```css
    body:not(.loaded) .h-bg-wrap,
```

```css
    body.loaded .h-bg-wrap{animation:introFade 1.2s var(--ease) backwards}
```

- [ ] **Step 5: Retarget the parallax JS from `.h-bg` to `.h-bg-wrap`**

In `index.html`, inside `initScrollFX()`, find:

```js
    const heroBg = document.querySelector('.h-bg');
```

Change to:

```js
    const heroBg = document.querySelector('.h-bg-wrap');
```

Do not rename the `heroBg` variable itself — only the selector string changes. No other line in `initScrollFX()` needs to change (the rest of the parallax logic already just calls `heroBg.style.transform = ...`, which works identically on the wrapper).

- [ ] **Step 6: Manual verification**

Confirm the local server is running and reload the page:

```bash
curl -sI http://127.0.0.1:8792/index.html | head -1
curl -sI http://127.0.0.1:8792/profile-li.jpg | head -1
open http://127.0.0.1:8792/index.html
```

With the OS in **dark** mode (or `[data-theme="dark"]` forced via the toggle): hero looks pixel-identical to before this task — `profile.jpg`, dark overlay, unchanged.

With the OS in **light** mode: hero shows `profile-li.jpg` with a light overlay instead.

Toggle the theme (click the sun/moon button, or use DevTools' `prefers-color-scheme` emulation without reloading): the photo and overlay should crossfade smoothly over about 900ms — not snap instantly.

Reload the page fresh: the intro sequence (navbar/hero/cards fading in on first load) still plays correctly, and the photo shown is the one matching the active theme from the very first frame after the intro's opacity reaches 1.

Scroll down through the hero: the parallax (photo moving slightly slower than scroll) still works, and both the visible photo and the overlay move together with no visible seam or desync.

- [ ] **Step 7: Commit**

```bash
git add profile-li.jpg index.html style.css
git commit -m "$(cat <<'EOF'
Add theme-crossfade for hero photo and overlay

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 2: Theme-reactive tokens for hero text and cards

**Files:**
- Modify: `style.css` (12 new tokens in the 3 existing token blocks; repoint hero text/card selectors to use them; add transitions)

**Interfaces:**
- Consumes: the existing 3-tier token block structure in `style.css` (bare `:root`, the `@media` block, the `:root[data-theme="dark"]` block) — this task adds 12 more custom properties to all three, following the exact same pattern already used for `--track`, `--pip-off-bg`, etc.

- [ ] **Step 1: Add the 12 new tokens to all three token blocks**

In `style.css`'s bare `:root` block, add these 12 lines (a good location is right after the existing `--outline-hover-brd` line, before `--ease`):

```css
    --hero-name-shadow:  rgba(0,0,0,.06);
    --hero-sub:          rgba(10,10,15,.72);
    --hero-sub-shadow:   rgba(0,0,0,.06);
    --hero-domain:       rgba(10,10,15,.35);
    --hero-card-bg:      rgba(10,10,15,.035);
    --hero-card-brd:     rgba(10,10,15,.1);
    --hero-card-label:   rgba(10,10,15,.5);
    --hero-card-text:    rgba(10,10,15,.68);
    --hero-stat-l:       rgba(10,10,15,.4);
    --hero-exp-role:     rgba(10,10,15,.62);
    --hero-exp-period:   rgba(10,10,15,.32);
    --hero-sd-line:      rgba(10,10,15,.18);
```

In the `@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){...} }` block, add (same location, after `--outline-hover-brd`):

```css
        --hero-name-shadow:  rgba(0,0,0,.5);
        --hero-sub:          rgba(255,255,255,.7);
        --hero-sub-shadow:   rgba(0,0,0,.6);
        --hero-domain:       rgba(255,255,255,.35);
        --hero-card-bg:      rgba(255,255,255,.04);
        --hero-card-brd:     rgba(255,255,255,.08);
        --hero-card-label:   rgba(255,255,255,.45);
        --hero-card-text:    rgba(255,255,255,.65);
        --hero-stat-l:       rgba(255,255,255,.35);
        --hero-exp-role:     rgba(255,255,255,.6);
        --hero-exp-period:   rgba(255,255,255,.3);
        --hero-sd-line:      rgba(255,255,255,.15);
```

In the `:root[data-theme="dark"]{...}` block, add the identical 12 lines (same values as the `@media` block above, same indentation level as that block's other lines):

```css
    --hero-name-shadow:  rgba(0,0,0,.5);
    --hero-sub:          rgba(255,255,255,.7);
    --hero-sub-shadow:   rgba(0,0,0,.6);
    --hero-domain:       rgba(255,255,255,.35);
    --hero-card-bg:      rgba(255,255,255,.04);
    --hero-card-brd:     rgba(255,255,255,.08);
    --hero-card-label:   rgba(255,255,255,.45);
    --hero-card-text:    rgba(255,255,255,.65);
    --hero-stat-l:       rgba(255,255,255,.35);
    --hero-exp-role:     rgba(255,255,255,.6);
    --hero-exp-period:   rgba(255,255,255,.3);
    --hero-sd-line:      rgba(255,255,255,.15);
```

The `@media` block's values and the `:root[data-theme="dark"]` block's values for these 12 tokens must be byte-identical to each other (same requirement as every other token already in these two blocks).

- [ ] **Step 2: Repoint `.h-name` and add its transition**

Find:

```css
.h-name{
    font-size:clamp(2rem,4.5vw,5rem);
    font-weight:900;
    letter-spacing:-.04em;
    line-height:.92;
    margin-bottom:10px;
    text-shadow:0 2px 20px rgba(0,0,0,.5);
}
```

Replace with:

```css
.h-name{
    font-size:clamp(2rem,4.5vw,5rem);
    font-weight:900;
    letter-spacing:-.04em;
    line-height:.92;
    margin-bottom:10px;
    text-shadow:0 2px 20px var(--hero-name-shadow);
    transition:color .8s ease,text-shadow .8s ease;
}
```

(`.h-name` has no explicit `color` — it inherits `body{color:var(--t1)}`, which is already theme-reactive. Adding `transition:color` here makes that inherited change animate smoothly instead of snapping.)

- [ ] **Step 3: Repoint `.h-subtitle`**

Find:

```css
.h-subtitle{
    display:inline-flex;align-items:center;gap:3px;
    font-size:clamp(.75rem,1vw,.95rem);
    font-weight:600;color:rgba(255,255,255,.7);
    letter-spacing:.06em;text-transform:uppercase;
    text-shadow:0 1px 8px rgba(0,0,0,.6);
}
```

Replace with:

```css
.h-subtitle{
    display:inline-flex;align-items:center;gap:3px;
    font-size:clamp(.75rem,1vw,.95rem);
    font-weight:600;color:var(--hero-sub);
    letter-spacing:.06em;text-transform:uppercase;
    text-shadow:0 1px 8px var(--hero-sub-shadow);
    transition:color .8s ease,text-shadow .8s ease;
}
```

- [ ] **Step 4: Repoint `.h-domain`**

Find:

```css
.h-domain{
    font-size:.65rem;font-weight:500;color:rgba(255,255,255,.35);
    writing-mode:vertical-rl;padding-top:4px;letter-spacing:.1em;flex-shrink:0;
}
```

Replace with:

```css
.h-domain{
    font-size:.65rem;font-weight:500;color:var(--hero-domain);
    writing-mode:vertical-rl;padding-top:4px;letter-spacing:.1em;flex-shrink:0;
    transition:color .8s ease;
}
```

- [ ] **Step 5: Repoint `.hfc` (card background/border) and extend its transition**

Find:

```css
.hfc{
    background:rgba(255,255,255,.04);
    backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,.08);
    border-radius:14px;
    padding:16px 18px;
    transition:border-color .3s,transform .3s var(--ease),box-shadow .3s;
}
```

Replace with:

```css
.hfc{
    background:var(--hero-card-bg);
    backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border:1px solid var(--hero-card-brd);
    border-radius:14px;
    padding:16px 18px;
    transition:border-color .3s,transform .3s var(--ease),box-shadow .3s,background-color .3s;
}
```

(Note: `background-color .3s` is added to the existing transition list, not a separate rule — this reuses the card's already-established hover-transition speed for the theme-driven background change too, rather than introducing a second timing.)

- [ ] **Step 6: Repoint `.hfc-label` and `.hsd-label`**

Find:

```css
.hfc-label{
    font-size:.62rem;font-weight:700;
    text-transform:uppercase;letter-spacing:.12em;
    color:rgba(255,255,255,.45);margin-bottom:10px;
}
```

Replace with:

```css
.hfc-label{
    font-size:.62rem;font-weight:700;
    text-transform:uppercase;letter-spacing:.12em;
    color:var(--hero-card-label);margin-bottom:10px;
    transition:color .8s ease;
}
```

Find:

```css
.hsd-label{
    font-size:.62rem;font-weight:700;
    letter-spacing:.2em;text-transform:uppercase;
    color:rgba(255,255,255,.45);
}
```

Replace with:

```css
.hsd-label{
    font-size:.62rem;font-weight:700;
    letter-spacing:.2em;text-transform:uppercase;
    color:var(--hero-card-label);
    transition:color .8s ease;
}
```

- [ ] **Step 7: Repoint `.hfc-text` and `.hfc-list li`**

Find:

```css
.hfc-text{font-size:.76rem;color:rgba(255,255,255,.65);line-height:1.6}
```

Replace with:

```css
.hfc-text{font-size:.76rem;color:var(--hero-card-text);line-height:1.6;transition:color .8s ease}
```

Find:

```css
.hfc-list li{display:flex;align-items:center;gap:6px;font-size:.76rem;color:rgba(255,255,255,.65)}
```

Replace with:

```css
.hfc-list li{display:flex;align-items:center;gap:6px;font-size:.76rem;color:var(--hero-card-text);transition:color .8s ease}
```

- [ ] **Step 8: Repoint `.hfstat-l`**

Find:

```css
.hfstat-l{font-size:.58rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.07em}
```

Replace with:

```css
.hfstat-l{font-size:.58rem;color:var(--hero-stat-l);text-transform:uppercase;letter-spacing:.07em;transition:color .8s ease}
```

- [ ] **Step 9: Repoint `.hcard-exp-role` and `.hcard-exp-period`**

Find:

```css
.hcard-exp-role{font-size:.71rem;color:rgba(255,255,255,.6)}
.hcard-exp-period{font-size:.63rem;color:rgba(255,255,255,.3)}
```

Replace with:

```css
.hcard-exp-role{font-size:.71rem;color:var(--hero-exp-role);transition:color .8s ease}
.hcard-exp-period{font-size:.63rem;color:var(--hero-exp-period);transition:color .8s ease}
```

- [ ] **Step 10: Repoint `.hsd-line`**

Find:

```css
.hsd-line{
    width:1px;height:52px;
    background:rgba(255,255,255,.15);
    border-radius:1px;
    position:relative;
    overflow:hidden;
}
```

Replace with:

```css
.hsd-line{
    width:1px;height:52px;
    background:var(--hero-sd-line);
    border-radius:1px;
    position:relative;
    overflow:hidden;
    transition:background-color .8s ease;
}
```

- [ ] **Step 11: Verify no other hardcoded hero color was missed**

```bash
grep -n "rgba(255,255,255" style.css
```

Every remaining match should be OUTSIDE the hero section (lines roughly 130-260 in the file before this task started) — e.g. general-site elements handled by earlier tasks on this branch, or navbar rules (which are intentionally NOT tokenized, per this branch's earlier decision that the navbar stays always-dark). If any match is still inside the hero section boundaries, you missed a selector — go back and repoint it using the same pattern as the steps above (introduce one more token if genuinely needed, following the naming convention `--hero-*`).

- [ ] **Step 12: Manual verification**

Reload `http://127.0.0.1:8792/index.html`.

With the OS in **dark** mode: every piece of hero text and the 4 floating cards look pixel-identical to before this task.

With the OS in **light** mode: hero name, subtitle, domain label, the 4 floating cards (background/border/label/text), the hero stat numbers' labels, the experience-card role/period text, and the scroll-indicator line all render in a dark-on-light style consistent with the rest of the site's light theme — nothing stays white-on-white or otherwise illegible.

Toggle the theme back and forth (click the sun/moon button): all of the above transition smoothly (fade over ~800ms), not an instant snap — matching the pace of the photo/overlay crossfade from Task 1, so the whole hero feels like one cohesive "light switching on" moment rather than several elements changing at different speeds.

Hover a floating card in both themes: the existing hover lift/border-highlight effect still works correctly in both themes (this confirms `.hfc`'s added `background-color .3s` didn't interfere with its existing hover transition).

- [ ] **Step 13: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
Make hero text and cards theme-reactive with smooth color transitions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```
