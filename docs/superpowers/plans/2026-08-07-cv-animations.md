# CV Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle, professional motion (load intro, count-up stats, active nav indicator, scroll progress bar, hero parallax) to the static CV site (`index.html` + `style.css`), per `docs/superpowers/specs/2026-08-07-cv-animations-design.md`.

**Architecture:** Pure CSS keyframes/transitions + vanilla JS added to the existing inline `<script>` in `index.html`. No build step, no new files, no external dependencies. All new motion reuses the site's existing patterns (`IntersectionObserver` for scroll-triggered effects, `var(--ease)` for easing, `rAF` for scroll-driven values).

**Tech Stack:** Plain HTML/CSS/JS (no framework, no bundler). Local verification via `python3 -m http.server` (already running on `127.0.0.1:8790` from this session — the site needs an HTTP server because it `fetch()`es `db.json`, which fails under `file://`).

## Global Constraints

- No new external dependencies (no animation libraries, no CDN scripts beyond what's already loaded).
- All new motion must be inert or instant under `@media (prefers-reduced-motion: reduce)` — no exceptions.
- Scroll-driven effects (progress bar, parallax) must be throttled via `requestAnimationFrame`, not run unthrottled on every `scroll` event.
- Follow existing code conventions in the file: minified/compact CSS (one rule per line, no extra whitespace), inline `<script>` in `index.html` (no separate JS file), `var(--ease)` for easing, `IntersectionObserver` with `unobserve()` after a one-shot trigger (see `.anim`/`.sfill` pattern in `initObs()`).
- This project has no automated test suite. Every task's "test" step is a manual visual check against the running local server — treat it as mandatory, not optional.

---

### Task 1: Load intro animation

**Files:**
- Modify: `style.css` (insert new section after line 429, before the `/* ── RESPONSIVE ─..` comment at line 431)
- Modify: `index.html` (add `runIntro()` function near the `TYPING` section, call it from the `DOMContentLoaded` handler at the bottom)

**Interfaces:**
- Produces: `runIntro()` — adds class `loaded` to `<body>` on the next-next animation frame after call. No parameters, no return value. Later tasks do not depend on this.

- [ ] **Step 1: Add the intro CSS**

Insert this new section into `style.css` right after line 429 (`.anim.in{opacity:1;transform:translateY(0)}`) and before line 431 (`/* ── RESPONSIVE ─...`):

```css
/* ── LOAD INTRO (requires JS to add .loaded to <body>) ────── */
@media (prefers-reduced-motion: no-preference){
    body:not(.loaded) #topnav,
    body:not(.loaded) .h-top,
    body:not(.loaded) .h-cards-row .hfc,
    body:not(.loaded) .h-scroll-down{opacity:0}

    body.loaded #topnav{animation:introDown .6s var(--ease) .05s forwards}
    body.loaded .h-top{animation:introUp .7s var(--ease) .35s forwards}
    body.loaded .h-cards-row .hfc:nth-child(1){animation:introUp .7s var(--ease) .55s forwards}
    body.loaded .h-cards-row .hfc:nth-child(2){animation:introUp .7s var(--ease) .65s forwards}
    body.loaded .h-cards-row .hfc:nth-child(3){animation:introUp .7s var(--ease) .75s forwards}
    body.loaded .h-cards-row .hfc:nth-child(4){animation:introUp .7s var(--ease) .85s forwards}
    body.loaded .h-scroll-down{animation:introFade .6s var(--ease) 1.05s forwards}
}
@keyframes introDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
@keyframes introUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes introFade{from{opacity:0}to{opacity:1}}
```

- [ ] **Step 2: Add `runIntro()` and call it**

In `index.html`, add this function right after the `startTyping` function (after line 536, `}` that closes `startTyping`):

```js
/* ── LOAD INTRO ──────────────────────────────────────── */
function runIntro(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
        document.body.classList.add('loaded');
    }));
}
```

Then in the `DOMContentLoaded` handler at the bottom of the file (around line 580-583):

```js
document.addEventListener('DOMContentLoaded',()=>{
    lucide.createIcons();
    loadData().catch(console.error);
    runIntro();
});
```

- [ ] **Step 3: Manual verification**

Confirm the local server is running, then open the page fresh (hard reload) in a browser:

```bash
curl -sI http://127.0.0.1:8790/index.html | head -1
open http://127.0.0.1:8790/index.html
```

Expected: on load, the navbar fades/slides in first, then the hero name/subtitle, then the 4 floating cards one after another, then the scroll indicator — total sequence under ~1.5s, no layout jump, no flash of fully-invisible page beyond the intro window.

Then check the reduced-motion path: in Chrome DevTools, open the Command Menu (`Cmd+Shift+P`) → "Show Rendering" → set "Emulate CSS media feature prefers-reduced-motion" to `reduce`, then hard-reload. Expected: navbar and hero content are visible immediately, no fade/slide, no delay.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "$(cat <<'EOF'
Add load-in animation sequence to hero and navbar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 2: Count-up numbers

**Files:**
- Modify: `index.html` (extend `initObs()`, function starting at line 539)

**Interfaces:**
- Consumes: none from Task 1.
- Produces: nothing consumed by later tasks. Self-contained.

- [ ] **Step 1: Add the count-up observer inside `initObs()`**

`initObs()` currently looks like this (lines 539-549):

```js
function initObs(){
    const ao=new IntersectionObserver(e=>e.forEach(x=>{
        if(x.isIntersecting){x.target.classList.add('in');ao.unobserve(x.target);}
    }),{threshold:.12});
    document.querySelectorAll('.anim').forEach(el=>ao.observe(el));

    const fo=new IntersectionObserver(e=>e.forEach(x=>{
        if(x.isIntersecting){x.target.style.width=x.target.dataset.p+'%';fo.unobserve(x.target);}
    }),{threshold:.3});
    document.querySelectorAll('.sfill').forEach(el=>fo.observe(el));
}
```

Add a third observer at the end of the function, right before the closing `}`:

```js
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const co=new IntersectionObserver(e=>e.forEach(x=>{
        if(!x.isIntersecting) return;
        co.unobserve(x.target);
        const el = x.target;
        const raw = el.textContent.trim();
        const m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
        if(!m) return;
        const target = parseFloat(m[1]);
        const suffix = m[2];
        if(reduceMotion){ el.textContent = raw; return; }
        const dur = 1200, start = performance.now();
        (function tick(now){
            const p = Math.min((now-start)/dur,1);
            const eased = 1-Math.pow(1-p,3);
            el.textContent = Math.round(target*eased) + suffix;
            if(p<1) requestAnimationFrame(tick);
            else el.textContent = target + suffix;
        })(start);
    }),{threshold:.5});
    document.querySelectorAll('.hfstat-v, .stat-v').forEach(el=>co.observe(el));
```

- [ ] **Step 2: Manual verification**

Reload `http://127.0.0.1:8790/index.html`. Scroll so the hero cards row (`8+`, `50+`, `40+`) and later the About section stats grid enter the viewport.

Expected: each number animates from 0 up to its final value (with `+` suffix preserved) over about 1.2s, then settles on the exact original text (e.g. `8+`). Each element animates only once, even if you scroll past and back.

With `prefers-reduced-motion: reduce` emulated (same DevTools toggle as Task 1): numbers should show their final value immediately, no counting animation.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Add count-up animation to stat numbers on scroll into view

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 3: Active nav section indicator

**Files:**
- Modify: `style.css` (extend `.tn-link` rules around line 50-51)
- Modify: `index.html` (add `initScrollFX()` function, call it from `DOMContentLoaded`)

**Interfaces:**
- Produces: `initScrollFX()` — sets up scroll-related effects. Tasks 4 and 5 extend the body of this same function (do not create a second function).

- [ ] **Step 1: Add active-link CSS**

In `style.css`, replace lines 50-51:

```css
.tn-link{font-size:.85rem;font-weight:500;color:var(--t2);transition:color .2s}
.tn-link:hover{color:var(--t1)}
```

with:

```css
.tn-link{position:relative;font-size:.85rem;font-weight:500;color:var(--t2);transition:color .2s}
.tn-link:hover{color:var(--t1)}
.tn-link::after{content:'';position:absolute;left:0;right:0;bottom:-20px;height:2px;background:var(--acc);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}
.tn-link.active{color:var(--t1)}
.tn-link.active::after{transform:scaleX(1)}
```

(`bottom:-20px` places the underline just below the 64px-tall navbar without affecting its layout — `#topnav` uses `align-items:center` so links don't stretch.)

- [ ] **Step 2: Add `initScrollFX()` with section tracking**

In `index.html`, add this new function after `initObs()` (after the closing `}` around line 549):

```js
/* ── SCROLL FX (active nav) ─────────────────────────────── */
function initScrollFX(){
    const navLinks = document.querySelectorAll('.tn-link');
    const so = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(!entry.isIntersecting) return;
            navLinks.forEach(link=>{
                link.classList.toggle('active', link.getAttribute('href')==='#'+entry.target.id);
            });
        });
    },{rootMargin:'-45% 0px -45% 0px',threshold:0});
    document.querySelectorAll('main > section[id]').forEach(sec=>so.observe(sec));
}
```

Call it from the `DOMContentLoaded` handler, alongside `runIntro()`:

```js
document.addEventListener('DOMContentLoaded',()=>{
    lucide.createIcons();
    loadData().catch(console.error);
    runIntro();
    initScrollFX();
});
```

- [ ] **Step 3: Manual verification**

Reload the page and scroll slowly through each section (About, Experience, Skills, Projects, Contact).

Expected: as each section crosses the vertical center of the viewport, the matching navbar link gets an orange underline and turns white; the previous link's underline retracts. Hero and CV sections (no matching nav link) simply leave all links un-highlighted while they're centered.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "$(cat <<'EOF'
Highlight active section in navbar while scrolling

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 4: Scroll progress bar

**Files:**
- Modify: `index.html` (add markup after `</nav>` at line 155; replace the scroll listener at lines 551-554; extend `initScrollFX()`)
- Modify: `style.css` (add `#scroll-progress` styles)

**Interfaces:**
- Consumes: `initScrollFX()` from Task 3 — this task adds to its body, doesn't replace it.

- [ ] **Step 1: Add the progress bar markup**

In `index.html`, insert this line right after line 155 (`</nav>`), before `<div class="tn-mobile" id="tn-mobile">`:

```html
<div id="scroll-progress" aria-hidden="true"></div>
```

- [ ] **Step 2: Add the progress bar CSS**

In `style.css`, add this rule right after line 47 (`#topnav.scrolled{...}`):

```css
#scroll-progress{position:fixed;top:64px;left:0;height:2px;width:0;background:var(--acc);z-index:101;pointer-events:none}
```

- [ ] **Step 3: Replace the old scroll listener with a throttled one inside `initScrollFX()`**

Remove the existing standalone listener (lines 551-554 in the original file):

```js
window.addEventListener('scroll',()=>{
    document.getElementById('topnav').classList.toggle('scrolled',window.scrollY>60);
},{passive:true});
```

In its place, extend `initScrollFX()` (the function added in Task 3) by adding this to its body, right before the closing `}`:

```js
    const topnav = document.getElementById('topnav');
    const progressEl = document.getElementById('scroll-progress');
    let ticking = false;
    function onScroll(){
        topnav.classList.toggle('scrolled', window.scrollY>60);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressEl.style.width = (max>0 ? Math.min(window.scrollY/max,1)*100 : 0) + '%';
        ticking = false;
    }
    window.addEventListener('scroll',()=>{
        if(!ticking){ requestAnimationFrame(onScroll); ticking = true; }
    },{passive:true});
    onScroll();
```

(The trailing `onScroll()` call sets the correct initial state if the page loads already scrolled, e.g. via anchor link or reload-with-scroll-restoration.)

- [ ] **Step 4: Manual verification**

Reload the page and scroll from top to bottom.

Expected: a thin orange bar directly under the navbar grows from 0% to 100% width in step with scroll position; it reaches full width exactly at the bottom of the page. The navbar's existing "scrolled" background-blur behavior (unchanged) still triggers past 60px of scroll.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css
git commit -m "$(cat <<'EOF'
Add scroll progress bar, consolidate scroll listener with rAF throttling

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```

---

### Task 5: Hero parallax

**Files:**
- Modify: `index.html` (extend the `onScroll` function added in Task 4, inside `initScrollFX()`)

**Interfaces:**
- Consumes: `onScroll()` from Task 4 — this task adds to its body.

- [ ] **Step 1: Add parallax to `onScroll()`**

In `index.html`, inside `initScrollFX()`, add these two lines near the top of the function body (before `onScroll` is defined) to cache the elements and the reduced-motion flag:

```js
    const heroBg = document.querySelector('.h-bg');
    const heroEl = document.getElementById('hero');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Then extend the `onScroll` function body (added in Task 4) with the parallax logic, right before `ticking = false;`:

```js
        if(!reduceMotion && heroBg && window.scrollY < heroEl.offsetHeight){
            heroBg.style.transform = `translateY(${window.scrollY*0.1}px)`;
        }
```

The full `onScroll` function should now read:

```js
    function onScroll(){
        topnav.classList.toggle('scrolled', window.scrollY>60);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressEl.style.width = (max>0 ? Math.min(window.scrollY/max,1)*100 : 0) + '%';
        if(!reduceMotion && heroBg && window.scrollY < heroEl.offsetHeight){
            heroBg.style.transform = `translateY(${window.scrollY*0.1}px)`;
        }
        ticking = false;
    }
```

- [ ] **Step 2: Manual verification**

Reload the page and scroll down slowly through the hero section only.

Expected: the background photo moves downward slightly slower than the rest of the page (visible depth effect), and stops updating once you scroll past the hero (no effect on sections below). No visible gap or seam appears at the edges of the photo while it shifts (the photo is `position:absolute;inset:0` with `object-fit:cover`, so a `translateY` of a few tens of pixels should stay within its rendered bounds — if you do see a gap, reduce the `0.1` factor).

With `prefers-reduced-motion: reduce` emulated: the photo should stay perfectly static during scroll.

- [ ] **Step 3: Full regression pass**

With all 5 tasks done, do one more full manual pass per the spec's testing section:
1. Hard-reload → intro sequence plays once.
2. Scroll through the whole page → nav active indicator updates, progress bar fills smoothly, hero parallax works only in hero, stat numbers count up once each.
3. Toggle `prefers-reduced-motion: reduce` in DevTools and hard-reload → intro is instant, numbers show final values immediately, parallax is disabled. Nav active-indicator and progress bar (not real "motion" in the vestibular sense) continue to work.
4. Resize to a mobile viewport (e.g. 390px wide) → nothing overlaps or breaks (`.tn-links` is hidden on mobile per existing responsive CSS, so the active-indicator work is inert but harmless there).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Add subtle parallax to hero photo on scroll

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011xa9JH9r4nu2p6k2pv5GMC
EOF
)"
```
