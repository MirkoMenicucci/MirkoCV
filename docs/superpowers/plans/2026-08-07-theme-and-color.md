# Blue Accent + Light/Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the orange accent color with blue, and replace the site's fixed dark theme with a theme that follows system preference (`prefers-color-scheme`) with a persistent manual override toggle, per `docs/superpowers/specs/2026-08-07-theme-and-color-design.md`.

**Architecture:** Pure CSS custom-property retheming (`style.css`) plus a small amount of vanilla JS (`index.html`) for the manual override toggle and its persistence. No build step, no new files, no external dependencies. The hero section and the navbar are explicitly exempt from theming (they stay visually dark in both themes) — only the sections below the hero (About, Experience, Skills, Projects, CV, Contact, footer, PDF modal) actually change with the theme.

**Tech Stack:** Plain HTML/CSS/JS. Local verification via `python3 -m http.server` (the site needs an HTTP server because it `fetch()`es `db.json`).

## Global Constraints

- No new external dependencies.
- The hero section (`#hero` and everything inside it) must render identically in both themes — no changes to any hero-scoped selector's *theme behavior*, only the accent-color rebrand (Task 1) touches hero-scoped selectors, and only for the literal orange→blue swap.
- The navbar (`#topnav`, `.tn-logo`, `.tn-links`, `.tn-link`, `.tn-burger`, `.tn-mobile`) must render identically in both themes (always the current dark chrome) — it must not read the theme-variable tokens (`--t1`, `--t2`, `--t3`, `--brd`, `--sur`) after Task 3, since those become theme-reactive.
- The accent color (`--acc`/`--acl`/`--agl`) is identical in both themes — defined once, never redefined inside a theme-specific block.
- No JS is needed to react live to a system theme change when no manual override is stored — that must work through the CSS media query alone. JS is only responsible for applying a stored manual preference on load and for saving a new one when the toggle is clicked.
- The stored-preference read/apply must happen in a **synchronous, head-level script** (not the existing bottom-of-body script, which runs after first paint) to avoid a flash of the wrong theme on load.
- This project has no automated test suite. Every task's "test" step is a manual visual/curl check against the running local server — mandatory, not optional.

---

### Task 1: Rebrand accent color from orange to blue

**Files:**
- Modify: `style.css` (root tokens, plus every hardcoded orange `rgba(249,115,22,…)` occurrence)

**Interfaces:**
- Produces: `--acc: #2563EB`, `--acl: #3B82F6`, `--agl: rgba(37,99,235,.32)` — later tasks (2-5) build on top of these values and must not change them again.

- [ ] **Step 1: Update the three accent tokens**

In `style.css`, in the `:root{...}` block near the top of the file, change:

```css
    --acc:   #F97316;
    --acl:   #FB923C;
    --agl:   rgba(249,115,22,.32);
```

to:

```css
    --acc:   #2563EB;
    --acl:   #3B82F6;
    --agl:   rgba(37,99,235,.32);
```

Leave every other line in that `:root` block unchanged for now — Task 2 restructures the rest of it.

- [ ] **Step 2: Verify baseline occurrence count of the old orange RGB triplet**

```bash
grep -o '249,115,22' style.css | wc -l
```

Note the number — it should be 35 (24 lines contain the pattern, some lines contain it twice, e.g. two-value `box-shadow` declarations). If your count differs, the file has drifted from what this plan expected; stop and report rather than guessing.

- [ ] **Step 3: Replace every hardcoded orange RGB triplet with the new blue one**

Replace **every** occurrence of the literal string `249,115,22` with `37,99,235` throughout `style.css`, preserving whatever alpha value follows it in each specific rule (e.g. `rgba(249,115,22,.4)` → `rgba(37,99,235,.4)`, `rgba(249,115,22,.08)` → `rgba(37,99,235,.08)` — only the RGB triplet changes, never the alpha). A single find-and-replace across the whole file is correct here; do not hand-edit each occurrence individually (error-prone) and do not change any alpha value.

Do **NOT** touch:
- `#a855f7` (skill-bar gradient) — unrelated purple, stays as-is.
- `rgba(124,58,237,.1)` (CV card decorative gradient) — unrelated purple, stays as-is.
- The three `--acc`/`--acl`/`--agl` token lines you already edited in Step 1 (they don't contain the literal `249,115,22` string anymore, so they won't match, but don't double-edit them).

- [ ] **Step 4: Verify the replacement**

```bash
grep -c '249,115,22' style.css   # expect 0
grep -o '37,99,235' style.css | wc -l   # expect 35
grep -nio 'f97316\|fb923c' style.css   # expect no output
```

- [ ] **Step 5: Manual visual check**

Start (or confirm running) a local server and open the page:

```bash
python3 -m http.server 8791 --bind 127.0.0.1 &
open http://127.0.0.1:8791/index.html
```

Expected: every place that was orange before (hero card borders/hover, experience timeline dots and connecting line, tags/badges, skill bars, project card accents, CV section icons and glows, contact card icons, social link hover) is now the same blue, with the same intensity/opacity relationships as before — nothing should look washed out or overly dark compared to how vivid the orange was.

- [ ] **Step 6: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
Rebrand accent color from orange to blue

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 2: Light/dark theme token architecture

**Files:**
- Modify: `style.css` (restructure `:root`, add `@media`/`[data-theme]` blocks, repoint two hardcoded values to new tokens)

**Interfaces:**
- Consumes: `--acc`/`--acl`/`--agl` from Task 1 (unchanged, carried forward as-is).
- Produces: `--bg`, `--bg2`, `--sur`, `--brd`, `--t1`, `--t2`, `--t3`, `--wm`, `--scrollbar-thumb` — now theme-reactive (light by default, dark under `prefers-color-scheme: dark` or explicit `[data-theme="dark"]`). Tasks 3, 4, and 5 rely on these exact token names and on the exact three-block pattern (bare `:root`, `@media (prefers-color-scheme: dark): :root:not([data-theme="light"])`, `:root[data-theme="dark"]`) being present for consistency, though only Task 4 needs to replicate the pattern itself.

- [ ] **Step 1: Replace the `:root` token block**

After Task 1, `style.css`'s `:root{...}` block reads:

```css
:root{
    --bg:    #0A0A0F;
    --bg2:   #0E0E16;
    --sur:   rgba(255,255,255,.04);
    --brd:   rgba(255,255,255,.08);
    --acc:   #2563EB;
    --acl:   #3B82F6;
    --agl:   rgba(37,99,235,.32);
    --t1:    #FFFFFF;
    --t2:    #8A909F;
    --t3:    #3E4455;
    --ease:  cubic-bezier(.22,1,.36,1);
}
```

Replace the entire block with:

```css
:root{
    --bg:    #FFFFFF;
    --bg2:   #F6F7F9;
    --sur:   rgba(10,10,15,.035);
    --brd:   rgba(10,10,15,.09);
    --t1:    #0A0A0F;
    --t2:    #545B6B;
    --t3:    #9AA0AC;
    --wm:    rgba(10,10,15,.03);
    --scrollbar-thumb: #D7DAE0;
    --acc:   #2563EB;
    --acl:   #3B82F6;
    --agl:   rgba(37,99,235,.32);
    --ease:  cubic-bezier(.22,1,.36,1);
}
@media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
        --bg:    #0A0A0F;
        --bg2:   #0E0E16;
        --sur:   rgba(255,255,255,.04);
        --brd:   rgba(255,255,255,.08);
        --t1:    #FFFFFF;
        --t2:    #8A909F;
        --t3:    #3E4455;
        --wm:    rgba(255,255,255,.025);
        --scrollbar-thumb: #1e2535;
    }
}
:root[data-theme="dark"]{
    --bg:    #0A0A0F;
    --bg2:   #0E0E16;
    --sur:   rgba(255,255,255,.04);
    --brd:   rgba(255,255,255,.08);
    --t1:    #FFFFFF;
    --t2:    #8A909F;
    --t3:    #3E4455;
    --wm:    rgba(255,255,255,.025);
    --scrollbar-thumb: #1e2535;
}
```

- [ ] **Step 2: Point the section watermark at the new `--wm` token**

Find (in the `SECTION DECORATION` block):

```css
    color:rgba(255,255,255,.025);
```

(this is inside the combined selector for `#about::before, #experience::before, #skills::before, #projects::before, #cv::before, #contact::before`). Change it to:

```css
    color:var(--wm);
```

- [ ] **Step 3: Point the scrollbar thumb at the new `--scrollbar-thumb` token**

Find:

```css
::-webkit-scrollbar-thumb{background:#1e2535;border-radius:10px}
```

Change to:

```css
::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:10px}
```

- [ ] **Step 4: Manual verification**

Reload `http://127.0.0.1:8791/index.html`. At this point in the plan the navbar and hero will look correct (unaffected), but sections below the hero will likely look broken/inconsistent if your OS is in light mode (since `--t1`/`--t2`/etc. just flipped to light values while some CSS — navbar, and the Task 4 items — still assumes dark). **This is expected and will be fixed by Tasks 3 and 4** — do not attempt to fix it in this task. Just confirm:
- With the OS in dark mode, the whole page looks identical to before this task (this task should be a no-op visually when the system is dark and there's no override).
- With the OS in light mode (or by using Chrome DevTools → Rendering → "Emulate CSS media feature prefers-color-scheme" → light), the About/Experience/Skills/Projects/CV/Contact section backgrounds and text switch to light — confirming the token architecture itself works, even though some spots still look wrong until Tasks 3-4 land.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
Add light/dark theme token architecture (light default, system-aware)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 3: Decouple the navbar from theme tokens

**Files:**
- Modify: `style.css` (navbar selectors only)

**Interfaces:**
- Consumes: nothing new from Task 2 — this task's whole point is to stop consuming `--t1`/`--t2`/`--brd`/`--sur` in navbar selectors.

- [ ] **Step 1: Replace the navbar CSS block**

Find this block (`TOP NAVBAR` section):

```css
#topnav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;transition:background .3s,border-color .3s}
#topnav.scrolled{background:rgba(10,10,15,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--brd)}
#scroll-progress{position:fixed;top:64px;left:0;height:2px;width:0;background:var(--acc);z-index:101;pointer-events:none}
.tn-logo{font-size:1.3rem;font-weight:900;color:var(--acc);letter-spacing:-.02em}
.tn-links{display:flex;gap:28px}
.tn-link{position:relative;font-size:.85rem;font-weight:500;color:var(--t2);transition:color .2s}
.tn-link:hover{color:var(--t1)}
.tn-link::after{content:'';position:absolute;left:0;right:0;bottom:-20px;height:2px;background:var(--acc);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}
.tn-link.active{color:var(--t1)}
.tn-link.active::after{transform:scaleX(1)}
.tn-burger{display:none;padding:8px;color:var(--t1);border-radius:8px}
.tn-burger svg{width:20px;height:20px}
.tn-mobile{display:none;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:rgba(10,10,15,.98);border-bottom:1px solid var(--brd);z-index:99;max-height:0;overflow:hidden;transition:max-height .35s var(--ease)}
.tn-mobile.open{max-height:320px}
.tn-mobile a{padding:16px 48px;font-size:.95rem;font-weight:500;color:var(--t2);border-bottom:1px solid var(--brd);transition:color .2s,background .2s}
.tn-mobile a:hover{color:var(--t1);background:var(--sur)}
```

Replace it with (only the token references change — `var(--t1)`→`#fff`, `var(--t2)`→`rgba(255,255,255,.6)`, `var(--brd)`→`rgba(255,255,255,.08)`, `var(--sur)`→`rgba(255,255,255,.04)` — everything else identical):

```css
#topnav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;transition:background .3s,border-color .3s}
#topnav.scrolled{background:rgba(10,10,15,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.08)}
#scroll-progress{position:fixed;top:64px;left:0;height:2px;width:0;background:var(--acc);z-index:101;pointer-events:none}
.tn-logo{font-size:1.3rem;font-weight:900;color:var(--acc);letter-spacing:-.02em}
.tn-links{display:flex;gap:28px}
.tn-link{position:relative;font-size:.85rem;font-weight:500;color:rgba(255,255,255,.6);transition:color .2s}
.tn-link:hover{color:#fff}
.tn-link::after{content:'';position:absolute;left:0;right:0;bottom:-20px;height:2px;background:var(--acc);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}
.tn-link.active{color:#fff}
.tn-link.active::after{transform:scaleX(1)}
.tn-burger{display:none;padding:8px;color:#fff;border-radius:8px}
.tn-burger svg{width:20px;height:20px}
.tn-mobile{display:none;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:rgba(10,10,15,.98);border-bottom:1px solid rgba(255,255,255,.08);z-index:99;max-height:0;overflow:hidden;transition:max-height .35s var(--ease)}
.tn-mobile.open{max-height:320px}
.tn-mobile a{padding:16px 48px;font-size:.95rem;font-weight:500;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.08);transition:color .2s,background .2s}
.tn-mobile a:hover{color:#fff;background:rgba(255,255,255,.04)}
```

Note `.tn-logo` and `#scroll-progress` already used `var(--acc)`, which is theme-invariant (Task 1/2 guarantee it's identical in both themes) — they need no change and are included above only for context/location, not because their line changed.

- [ ] **Step 2: Manual verification**

With the OS (or DevTools emulation) set to **light**, reload the page and scroll from the hero down through every section. Expected: the navbar (logo, links, burger icon, mobile dropdown when opened) looks **exactly the same** as it does in dark mode — white/light text, dark blurred background once scrolled past the hero, blue accent underline on the active link. It must not turn into dark text on a light bar at any point.

With the OS in **dark** mode, confirm the navbar is pixel-identical to how it looked before this task (this task must be a visual no-op in dark mode).

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
Decouple navbar colors from theme tokens (always-dark brand chrome)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 4: Light-theme overrides for remaining hardcoded values

**Files:**
- Modify: `style.css` (append new override blocks; no existing rules are deleted in this task)

**Interfaces:**
- Consumes: the `[data-theme="…"]`/`@media (prefers-color-scheme: …)` pattern established in Task 2, applied here to selectors instead of custom properties.

- [ ] **Step 1: Add the light-theme override block**

Add this new block to `style.css`, placed after the theme token block from Task 2 (immediately following the `:root[data-theme="dark"]{...}` block is a good location — do not scatter these among unrelated rules):

```css
/* ── LIGHT-THEME OVERRIDES (selectors with no dark/light token today) ── */
@media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]) .strack{background:rgba(10,10,15,.06)}
    :root:not([data-theme="dark"]) .pip{background:rgba(10,10,15,.07);border-color:rgba(10,10,15,.1)}
    :root:not([data-theme="dark"]) .proj-img{background:rgba(10,10,15,.03)}
    :root:not([data-theme="dark"]) .cert-view-btn{background:rgba(10,10,15,.04)}
    :root:not([data-theme="dark"]) .modal-x{background:rgba(10,10,15,.07)}
    :root:not([data-theme="dark"]) .modal-x:hover{background:rgba(10,10,15,.14)}
    :root:not([data-theme="dark"]) .btn-outline:hover{border-color:rgba(10,10,15,.25);background:rgba(10,10,15,.05)}
}
[data-theme="light"] .strack{background:rgba(10,10,15,.06)}
[data-theme="light"] .pip{background:rgba(10,10,15,.07);border-color:rgba(10,10,15,.1)}
[data-theme="light"] .proj-img{background:rgba(10,10,15,.03)}
[data-theme="light"] .cert-view-btn{background:rgba(10,10,15,.04)}
[data-theme="light"] .modal-x{background:rgba(10,10,15,.07)}
[data-theme="light"] .modal-x:hover{background:rgba(10,10,15,.14)}
[data-theme="light"] .btn-outline:hover{border-color:rgba(10,10,15,.25);background:rgba(10,10,15,.05)}
```

Do not touch `.modal-bg` (the PDF modal's dark backdrop, `rgba(0,0,0,.78)`) — it stays dark in both themes intentionally (a modal scrim, not page content).

- [ ] **Step 2: Manual verification**

With the OS/DevTools set to **light**, reload and check each of these in turn:
- Skills section: the skill-bar background track (`.strack`, behind the blue fill) is visible as a faint dark-tinted groove, not invisible against the white page.
- Skills section: soft-skill rating dots (`.pip`) that are "off" are visible as faint dark dots, not invisible.
- Projects section (only visible if `db.json` has entries in `projects`, otherwise this is the NDA placeholder and there's nothing to check here): the placeholder background behind any project image is visible.
- CV section: the small icon-only certificate-view button (`.cert-view-btn`) has a visible faint background.
- Open the CV PDF preview modal (button "Anteprima" in the CV section): the close (×) button in the top-right of the modal is visible against the modal header.
- CV section: hover the "Anteprima" outline button — a visible hover background/border appears (it's `.btn-outline`).

With the OS in **dark** mode, confirm all of the above are unchanged from before this task.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
Add light-theme overrides for remaining hardcoded dark-tuned colors

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 5: Manual theme toggle (UI + persistence)

**Files:**
- Modify: `index.html` (head-level FOUC-prevention script, navbar button markup, bottom-of-body script's `toggleTheme()` function)
- Modify: `style.css` (toggle button styling, sun/moon icon show/hide logic)

**Interfaces:**
- Consumes: `[data-theme="…"]` attribute mechanism from Tasks 2 and 4 (this task is what actually sets that attribute at runtime).

- [ ] **Step 1: Add the FOUC-prevention script to `<head>`**

In `index.html`, add this immediately after the `<meta charset="UTF-8">` line (as close to the top of `<head>` as possible without preceding the charset declaration, so it runs before the browser has anything to paint):

```html
<script>(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);})();</script>
```

- [ ] **Step 2: Add the toggle button to the navbar**

In `index.html`, find the navbar markup:

```html
<nav id="topnav">
    <a href="#hero" class="tn-logo" id="tn-logo">MM</a>
    <div class="tn-links">
```

...continuing down to:

```html
    <button class="btn-primary btn-sm" onclick="openPDF('cv.pdf','Curriculum Vitae','CV_Mirko_Menicucci.pdf')">
        <i data-lucide="download" class="isz"></i> CV
    </button>
    <button class="tn-burger" id="tn-burger" onclick="toggleMenu()" aria-label="Menu">
        <i data-lucide="menu"></i>
    </button>
</nav>
```

Insert a new button between the CV button and the burger button (this places it outside `.tn-links`/`.btn-primary`, so it is **not** hidden by the existing tablet media-query rule `#topnav .tn-links,#topnav .btn-primary{display:none}` — it stays visible at every viewport width, so it does not need a second copy inside `.tn-mobile`):

```html
    <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Cambia tema chiaro/scuro">
        <i data-lucide="sun" class="icon-sun"></i>
        <i data-lucide="moon" class="icon-moon"></i>
    </button>
```

- [ ] **Step 3: Add `toggleTheme()` to the existing bottom-of-body script**

In `index.html`, in the existing inline `<script>` block near the bottom of the file, add this function (a good location is right after the `closeMenu()` function, in the `TOP NAV` section):

```js
/* ── THEME TOGGLE ────────────────────────────────────── */
function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme')
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}
```

No call to this function is needed at `DOMContentLoaded` — the head script from Step 1 already applied any stored preference before first paint, and this function only needs to run in response to a click.

- [ ] **Step 4: Style the toggle button and its icon states**

In `style.css`, add this block near the end of the `TOP NAVBAR` section (after the navbar rules from Task 3):

```css
.theme-toggle{display:flex;align-items:center;justify-content:center;width:36px;height:36px;color:#fff;border-radius:8px;flex-shrink:0;transition:background .2s}
.theme-toggle:hover{background:rgba(255,255,255,.08)}
.theme-toggle svg{width:18px;height:18px}
.icon-sun{display:none}
@media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]) .icon-sun{display:block}
    :root:not([data-theme="light"]) .icon-moon{display:none}
}
[data-theme="dark"] .icon-sun{display:block}
[data-theme="dark"] .icon-moon{display:none}
[data-theme="light"] .icon-sun{display:none}
[data-theme="light"] .icon-moon{display:block}
```

This shows the moon icon (invitation to switch to dark) whenever the effective theme is light, and the sun icon (invitation to switch to light) whenever the effective theme is dark — covering all three cases: default light, system-dark-with-no-override, and both explicit overrides.

- [ ] **Step 5: Manual verification**

Reload the page (button icons render via the existing `lucide.createIcons()` call already present in the file — no changes needed there since it re-scans the whole document).

1. With no stored preference and OS in light mode: moon icon shows in the navbar; clicking it switches the whole page (except hero/navbar) to dark, icon changes to sun, and reloading the page keeps it dark (persistence).
2. Click the sun icon: page returns to light, icon changes to moon, reload keeps it light.
3. Clear the override — run `localStorage.removeItem('theme')` in the browser console and reload: the page now follows the OS setting again (verify by toggling the OS/DevTools `prefers-color-scheme` emulation and reloading each time).
4. With OS in dark mode and no stored preference, toggle the OS emulation to light **without reloading the page**: the site should switch live (pure CSS media query reactivity, no JS involved) — this only applies when there is no stored override.
5. With a stored override active, toggle the OS emulation: the site must **not** change (the override wins over the system).
6. Confirm there is no visible flash of the wrong theme on a hard reload when a stored preference differs from the OS setting (this validates the head-level script from Step 1 is running early enough).

- [ ] **Step 6: Commit**

```bash
git add index.html style.css
git commit -m "$(cat <<'EOF'
Add manual light/dark theme toggle with persistence

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```
