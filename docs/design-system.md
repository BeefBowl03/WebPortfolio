# Celso Aquino — Portfolio Design System v1

**Direction:** Bold & expressive (locked)
**Stack:** Vite + Tailwind CSS (build-time), vanilla JS, GitHub Pages via Actions
**Status:** Implementation-ready. Every value below is a decision, not a suggestion. Where a call is unusually opinionated it is marked **[Bold call]** with a one-line rationale so it can be overruled knowingly.

---

## 1. Art direction

**The concept: THE MANIFEST.**

Celso builds systems that count things — carts, SKUs, orders, line items, inventory across 11 warehouses and a million parts. The site is therefore built as a **shipping manifest / order ledger**: everything is indexed (`01 → 12`), everything is tabulated, metadata runs in monospace rails down the edges of the page, and the display type is set like the cover of a printed spec document — enormous, tight, uppercase, machine-set. Against that rigid grid, one saturated acid-lime signal color does all the emphasis work, and one section of the page flips to warm bone paper stock, so the site reads as *printed document + live terminal* rather than "another dark portfolio."

**Why this fits him specifically.** A generic "creative developer" site sells vibes. Celso sells *transactional reliability across timezones* — a store in Pietermaritzburg, a candle brand in Australia, an HVAC distributor in eleven US states. The manifest metaphor makes the portfolio itself perform the thing he's hired for: ordered, indexed, countable, no dead links, nothing lost in transit. It also gives the design a reason to be austere and typographic rather than decorative, which is what reads as *premium* to a hiring manager and *competent* to a client with a purchase order.

**The three signature moves** (if only three things survive, these are them):
1. **Hard-offset shadows.** No soft blur anywhere. Hover states throw a solid, un-blurred `8px 8px 0` accent shadow — like a printed sheet lifting off a desk, or ink misregistration. Instantly non-generic, costs nothing.
2. **Bone inversion.** The About + Skills block is warm paper (`#F0EBE1`) with ink text, full-bleed. A hard light/dark seam mid-page is the single strongest antidote to "AI dark portfolio."
3. **Everything is a line item.** Nav links, projects, skills, and contact rows all carry a two-digit monospace index and a hairline rule. The grid is visible, on purpose.

**Anti-goals:** no purple/indigo gradients, no `backdrop-blur` glass cards, no soft `rounded-2xl` everything, no floating code-snippet confetti, no blurred glow orbs, no AOS.

---

## 2. Color

Declared as CSS custom properties on `:root` in `src/styles/tokens.css`, then surfaced to Tailwind via `theme.extend.colors` using `rgb(var(--…) / <alpha-value>)` or direct `var()` references. Single theme (dark shell with one light band) — **there is no user-facing theme toggle.** **[Bold call]** *A toggle doubles the QA surface and halves the strength of the bone/ink seam, which is the concept.*

### 2.1 Tokens

```css
:root {
  /* ── Ink shell (default surface stack) ───────────────────── */
  --c-bg:            #0A0A0B;  /* page ground, warm near-black */
  --c-bg-deep:       #060607;  /* footer, hero canvas ground   */
  --c-surface-1:     #131316;  /* cards, nav condensed         */
  --c-surface-2:     #1C1C21;  /* inputs, tag fill on hover    */
  --c-border:        #26262C;  /* hairlines, default card edge */
  --c-border-strong: #3A3A44;  /* tag outline, input rest      */

  /* ── Type on ink ─────────────────────────────────────────── */
  --c-text:          #F5F3EE;  /* warm white — NOT pure #FFF   */
  --c-text-2:        #A8A5A0;  /* body copy, descriptions      */
  --c-text-muted:    #8A8781;  /* metadata, captions, footer   */

  /* ── Accent system ───────────────────────────────────────── */
  --c-accent:        #D8FF3D;  /* ACID LIME — the signal       */
  --c-accent-dim:    #A8C82E;  /* lime borders/rules at rest   */
  --c-accent-2:      #FF5A1F;  /* VERMILION — live/secondary   */
  --c-accent-2-deep: #B3300A;  /* vermilion, for use on bone   */

  /* ── Bone band (About + Skills only) ─────────────────────── */
  --c-bone:          #F0EBE1;  /* paper ground                 */
  --c-bone-2:        #E2DACB;  /* paper card / inset           */
  --c-bone-border:   #C9BFAC;  /* hairline on paper            */
  --c-ink:           #101012;  /* type on paper                */
  --c-ink-2:         #4A4741;  /* secondary type on paper      */

  /* ── Semantic ────────────────────────────────────────────── */
  --c-focus:         #D8FF3D;  /* = accent, on ink             */
  --c-focus-ink:     #101012;  /* focus ring on bone           */
  --c-error:         #FF5A1F;  /* = accent-2                   */
  --c-success:       #D8FF3D;  /* = accent                     */
}
```

**Deliberately absent: a third accent hue.** **[Bold call]** *Two saturated hues plus paper is already loud; a third turns "expressive" into "gaudy," which is the stated failure mode.*

### 2.2 Contrast audit (WCAG 2.1, computed)

| Foreground | Background | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---|---:|---|---|
| `--c-text` #F5F3EE | `--c-bg` #0A0A0B | **17.84 : 1** | ✅ | ✅ |
| `--c-text` #F5F3EE | `--c-surface-1` #131316 | **16.72 : 1** | ✅ | ✅ |
| `--c-text-2` #A8A5A0 | `--c-bg` #0A0A0B | **8.06 : 1** | ✅ | ✅ |
| `--c-text-2` #A8A5A0 | `--c-surface-1` #131316 | **7.55 : 1** | ✅ | ✅ |
| `--c-text-muted` #8A8781 | `--c-bg` #0A0A0B | **5.53 : 1** | ✅ | ✅ |
| `--c-accent` #D8FF3D | `--c-bg` #0A0A0B | **17.24 : 1** | ✅ | ✅ |
| `--c-accent` #D8FF3D | `--c-surface-1` #131316 | **16.16 : 1** | ✅ | ✅ |
| `--c-accent-2` #FF5A1F | `--c-bg` #0A0A0B | **6.34 : 1** | ✅ | ✅ |
| `--c-bg` #0A0A0B | `--c-accent` #D8FF3D (lime button) | **17.24 : 1** | ✅ | ✅ |
| `--c-bg` #0A0A0B | `--c-accent-2` #FF5A1F (vermilion button) | **6.34 : 1** | ✅ | ✅ |
| `--c-ink` #101012 | `--c-bone` #F0EBE1 | **16.00 : 1** | ✅ | ✅ |
| `--c-ink-2` #4A4741 | `--c-bone` #F0EBE1 | **8.42 : 1** | ✅ | ✅ |
| `--c-accent-2-deep` #B3300A | `--c-bone` #F0EBE1 | **5.29 : 1** | ✅ | ✅ |
| `--c-border-strong` #3A3A44 | `--c-bg` #0A0A0B | **2.24 : 1** | n/a (non-text) | UI component min 3:1 **not met** → see note |

**All text pairs pass WCAG AA. Five pass AAA (≥7:1).**

Hard rules, enforce in review:
- ❌ **Never white or `--c-text` on `--c-accent-2`** (2.81 : 1). Vermilion backgrounds always take `--c-bg` ink text.
- ❌ **Never `--c-accent` (lime) as text on `--c-bone`** (1.04 : 1 — invisible). On paper, the accent is `--c-accent-2-deep`.
- ❌ **Never `--c-accent-2` (bright vermilion) as text on `--c-bone`** (2.63 : 1). Use `--c-accent-2-deep`.
- ⚠️ `--c-border` / `--c-border-strong` are decorative hairlines only and are never the *sole* indicator of a control's boundary or state. Any border that carries meaning (input rest state, focused card, active filter) must use `--c-text-muted` #8A8781 (5.53 : 1) or brighter, satisfying the 3:1 non-text requirement. Input rest borders therefore use `--c-text-muted`, not `--c-border-strong`.

### 2.3 Where each color is allowed

- **Lime `--c-accent`** — the primary CTA fill, the active nav indicator, the scroll-progress hairline, the hard-offset hover shadow, project index numbers on hover, focus rings, the hero canvas particles. Budget: **no more than ~4% of any viewport's pixels.** Lime is punctuation.
- **Vermilion `--c-accent-2`** — reserved for **liveness and outbound**: the "Live site ↗" affordance, the availability dot, the marquee band fill, the `E-commerce` tag family. It signals *this thing is running in production right now*, which is the portfolio's whole argument.
- **Bone** — About + Skills section only. Never a card on the dark shell; the inversion must be full-bleed or it looks like a mistake.

---

## 3. Typography

### 3.1 Families and load plan

| Role | Family | Format | Axes / weights | Approx. transferred |
|---|---|---|---|---|
| Display + UI + body | **Archivo Variable** | woff2, `latin` subset | `wght 400–900`, `wdth 62–125` | **~52 KB** |
| Metadata, indices, tags, eyebrows | **IBM Plex Mono** | woff2, `latin` subset | 400, 600 (2 static files) | **~44 KB** |

**Total font payload: ~96 KB.** Justification: one variable file replaces five static Archivo weights *and* gives the width axis, which is the entire expressive lever of this design — the hero is `wdth 115 / wght 800`, section headings are `wdth 100 / wght 800`, and body is `wdth 100 / wght 400`, from a single file. IBM Plex Mono is loaded as two static cuts rather than the variable file because only two weights are ever used and the statics are smaller; it earns its ~44 KB because monospace metadata *is* the manifest concept — it is structural, not decoration.

- Install via npm so Vite fingerprints and self-hosts them: `@fontsource-variable/archivo`, `@fontsource/ibm-plex-mono` (400, 600). **No Google Fonts CDN link** — third-party origin, extra DNS + TLS, and it breaks the "real build" constraint.
- Every `@font-face` gets `font-display: swap`.
- Preload **only** the Archivo variable file in `<head>`: `<link rel="preload" as="font" type="font/woff2" crossorigin href="…">`. Plex Mono is below-the-fold-ish and can swap.
- Fallback stacks (metric-adjacent, so swap doesn't jolt):
  ```css
  --font-display: 'Archivo Variable', 'Archivo', 'Helvetica Neue', Arial, sans-serif;
  --font-body:    var(--font-display);
  --font-mono:    'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  ```
- Set `font-synthesis: none` globally so no faux-bolding of the mono.

### 3.2 Type scale

Fluid range is **360px → 1440px viewport**. Clamp values below are exact; use them verbatim.

| Token | Use | `font-size` | `line-height` | `letter-spacing` | wght / wdth |
|---|---|---|---|---|---|
| `--t-d1` | Hero display lines | `clamp(3.5rem, 1rem + 11.111vw, 11rem)` | `0.86` | `-0.035em` | 800 / 115 |
| `--t-d2` | Section headings | `clamp(2.5rem, 1.333rem + 5.185vw, 6rem)` | `0.92` | `-0.03em` | 800 / 100 |
| `--t-d3` | Featured project titles | `clamp(2rem, 1.583rem + 1.852vw, 3.25rem)` | `1.02` | `-0.025em` | 700 / 100 |
| `--t-h3` | Card titles, sub-heads | `clamp(1.375rem, 1.25rem + 0.556vw, 1.75rem)` | `1.15` | `-0.015em` | 600 / 100 |
| `--t-lead` | Hero sub, section intros | `clamp(1.125rem, 1rem + 0.556vw, 1.5rem)` | `1.45` | `-0.01em` | 400 / 100 |
| `--t-body` | Paragraphs, descriptions | `clamp(1rem, 0.958rem + 0.185vw, 1.125rem)` | `1.6` | `0` | 400 / 100 |
| `--t-sm` | Card body, form labels | `0.875rem` (fixed) | `1.55` | `0` | 400 / 100 |
| `--t-mono` | Tags, indices, meta | `0.8125rem` (fixed) | `1.4` | `0.02em` | 400 mono |
| `--t-eyebrow` | Section eyebrows, nav | `0.75rem` (fixed) | `1` | `0.16em`, `uppercase` | 600 mono |
| `--t-index` | Big line-item numerals | `clamp(0.875rem, 0.8rem + 0.33vw, 1.125rem)` | `1` | `0.04em` | 600 mono |

Measure limits: `--t-body` and `--t-sm` max **68ch**; `--t-lead` max **46ch**; `--t-d1`/`--t-d2` max **14ch** (force manual line breaks with `<span class="line">` rather than relying on wrapping).

Variable-axis helper classes:
```css
.fx-wide  { font-variation-settings: 'wght' 800, 'wdth' 115; }
.fx-disp  { font-variation-settings: 'wght' 800, 'wdth' 100; }
.fx-semi  { font-variation-settings: 'wght' 600, 'wdth' 100; }
.fx-body  { font-variation-settings: 'wght' 400, 'wdth' 100; }
```
Always set `font-variation-settings` (not `font-weight`) on display type so the width axis is explicit.

### 3.3 The hero display treatment — exact spec

Three lines, uppercase, `--t-d1`, `.fx-wide`, `text-wrap: balance` off (manual breaks), left-aligned, flush to the left grid edge:

```
LINE 1:  I BUILD          → --c-text
LINE 2:  STOREFRONTS      → --c-accent (lime), the only lime word on screen
LINE 3:  THAT SHIP.       → --c-text, with the period in --c-accent-2
```

- Lines are set at `line-height: 0.86` so they interlock into a single typographic block — this is the "printed cover" effect and it must not be loosened.
- Each line sits inside `overflow: hidden` and animates via `wipe` (§5.3).
- On viewports `< 480px` reduce to `wdth 100` — at `wdth 115` the tightest word (`STOREFRONTS`) overruns the gutter on a 360px screen.
- Directly above: a mono eyebrow line, `--t-eyebrow`, `--c-text-muted`, reading as manifest header, e.g. `MANIFEST № 01 — TAGUIG, PH · UTC+8`.
- Directly below: `--t-lead`, `--c-text-2`, max 46ch.
- Hero body copy and CTAs are **never centered.** **[Bold call]** *Centered hero text is the single most recognizable tell of the template look we are replacing; left-flush against a visible grid is the whole point.*

---

## 4. Spacing, grid, radii, elevation

### 4.1 Spacing scale (base unit 4px)

```
--s-1: 4px    --s-2: 8px    --s-3: 12px   --s-4: 16px
--s-5: 24px   --s-6: 32px   --s-7: 40px   --s-8: 48px
--s-9: 64px   --s-10: 80px  --s-11: 112px --s-12: 160px --s-13: 224px
```
Maps 1:1 onto Tailwind's `1,2,3,4,6,8,10,12,16,20,28,40,56` — extend the theme rather than inventing arbitrary values. **No value outside this scale ships.**

Vertical section rhythm: `padding-block: clamp(80px, 5rem + 5vw, 160px)` (`--s-section`). The Projects section gets `clamp(96px, 6rem + 6vw, 224px)` — it is the centerpiece and needs more air around it.

### 4.2 Container and breakpoints

```js
// tailwind.config.js
screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' }
```

- Container: `width: 100%; max-width: 1320px; margin-inline: auto;`
- Container inline padding: `clamp(20px, 4vw, 56px)` — **[Bold call]** *56px of gutter at desktop is generous; it's what lets the flush-left display type feel deliberate rather than cramped.*
- A **full-bleed** utility (`.bleed`) escapes the container for: the bone band, the marquee strip, the hero canvas, and the footer rule.
- Grid: 12 columns, `gap: var(--s-5)` (24px) below `lg`, `var(--s-6)` (32px) at `lg` and up.
- Column counts by breakpoint for the standard project grid: **1 col** `< 640px` · **2 col** `640–1023px` · **3 col** `≥ 1024px`.
- The **metadata rail** (a 1px vertical hairline in `--c-border` with rotated mono text) is rendered only at `≥ 1280px`, absolutely positioned in the left container gutter. It is decorative and `aria-hidden="true"`.

### 4.3 Radii

```
--r-xs: 2px    --r-sm: 4px    --r-pill: 999px
```
**That's the entire scale.** **[Bold call]** *Cards, images, buttons, and inputs are all `2px`. Near-sharp corners are the fastest visual signal that a human with a point of view laid this out; `rounded-2xl` on everything is the template tell. Pills (`999px`) are permitted for tags only, where the contrast against sharp cards is the joke.*

### 4.4 Elevation

**There are no soft blurred shadows anywhere on the ink shell.** Depth is expressed three ways:

1. **Surface step** — `--c-bg` → `--c-surface-1` → `--c-surface-2`.
2. **Hairline** — `1px solid var(--c-border)`, brightening to `var(--c-text-muted)` or `var(--c-accent)` on interaction.
3. **Hard offset** — the signature. Un-blurred, un-spread solid shadow:
   ```css
   --e-offset-sm: 4px 4px 0 0 var(--c-accent);
   --e-offset-md: 8px 8px 0 0 var(--c-accent);
   --e-offset-lg: 12px 12px 0 0 var(--c-accent);
   --e-offset-alt: 8px 8px 0 0 var(--c-accent-2);  /* live/outbound items */
   ```
   Always paired with an equal-and-opposite `translate(-Npx, -Npx)` so the element appears to lift off a fixed shadow rather than grow one.

On the **bone band** only, one soft shadow is permitted because paper casts real shadows:
```css
--e-paper: 0 2px 0 0 var(--c-bone-border), 0 12px 24px -12px rgb(16 16 18 / 0.18);
```

---

## 5. Motion

### 5.1 Easing and duration tokens

```css
--ease-out-expo:  cubic-bezier(0.16, 1, 0.30, 1);   /* entrances, reveals */
--ease-out-quart: cubic-bezier(0.25, 1, 0.50, 1);   /* hover, hero canvas */
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);   /* nav, state swaps   */
--ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);/* tags, badges only  */

--d-instant: 120ms   --d-fast: 200ms   --d-base: 320ms
--d-slow:    560ms   --d-reveal: 900ms
```

Global rule: anything the user initiates (hover, click, focus) uses `--d-instant`/`--d-fast`. Anything the page initiates (scroll reveal, hero entrance) uses `--d-base`/`--d-slow`/`--d-reveal`. **Only `transform`, `opacity`, `clip-path`, `box-shadow`, and `filter` are ever animated.** No animated `width`, `height`, `top`, `left`, or `background-position`.

### 5.2 Hero background — "Transaction tape"

**Technique: a single Canvas 2D element.** No WebGL, no library, no Vanta, no Three.

- One `<canvas class="hero-canvas" aria-hidden="true">` absolutely positioned inside the hero, `inset: 0`, `z-index: 0`, hero content at `z-index: 2`.
- Ground fill `--c-bg-deep`. A grid of cells at **28px pitch**, capped at **1,600 cells total** (grid is clipped, not densified, on large screens).
- Each cell renders a 2×2px `fillRect` "tick" in `rgb(58 58 68)`.
- A **diagonal luminance sweep** — a moving band, ~35% of the diagonal wide — raises ticks within it toward `--c-accent`, interpolated by distance from the band center. Sweep traverses the canvas once every **9 seconds**, linear.
- **Packets:** 4 concurrent 3-cell-long dashes in `--c-accent-2` travel along random grid rows/columns at 1 cell per 80ms, respawning on exit. These are the "orders in transit."
- **Vignette:** a static `radial-gradient` overlay div (CSS, not canvas) darkening to `--c-bg` at the edges, so the grid dissolves rather than getting cropped.

**Performance contract — these are acceptance criteria, not aspirations:**
- `devicePixelRatio` clamped to **max 2**.
- rAF loop throttled to **30 fps** (skip frames on a timestamp accumulator).
- Canvas backing store resized on a **debounced (200ms) `resize`**, never per-frame.
- Loop **stops** (`cancelAnimationFrame`) when: `IntersectionObserver` reports the hero < 10% visible, **or** `document.visibilityState === 'hidden'`.
- On viewports `< 640px` the grid pitch increases to 40px and packets drop to 2 — mobile GPUs get a lighter scene.
- Budget: **≤ 3.0 KB** minified JS, **≤ 4% CPU** on a 2019 mid-tier laptop, **zero** layout thrash (canvas is `contain: strict`).
- If `canvas.getContext('2d')` returns null, or JS fails, the CSS fallback (below) is already painted underneath and nothing breaks.

**CSS fallback (also the reduced-motion state, also the no-JS state)** — always painted on the hero element itself, canvas simply covers it:
```css
.hero { background:
  radial-gradient(120% 90% at 20% 0%, #101015 0%, var(--c-bg-deep) 62%),
  repeating-linear-gradient(0deg,  #1B1B22 0 1px, transparent 1px 28px),
  repeating-linear-gradient(90deg, #1B1B22 0 1px, transparent 1px 28px);
}
```

### 5.3 Named effects

| Name | What it does | Trigger | Timing | Reduced-motion fallback |
|---|---|---|---|---|
| `wipe` | Hero display lines revealed by `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`, each line in its own `overflow:hidden` mask | On load, after fonts settle (`document.fonts.ready`) | `--d-reveal`, `--ease-out-expo`, stagger **90ms** per line | Lines render final state instantly; `opacity` 0→1 over 200ms |
| `rise` | `translateY(24px) + opacity 0` → `translateY(0) + opacity 1` | `IntersectionObserver`, `threshold: 0.15`, `rootMargin: '0px 0px -10% 0px'`, **fires once** | `--d-slow`, `--ease-out-expo`, stagger **60ms** within a group, capped at 6 steps | No transform; `opacity` 0→1 over 200ms |
| `rule-draw` | Section hairlines animate `transform: scaleX(0)` → `1`, `transform-origin: left` | Same observer as `rise` | `--d-slow`, `--ease-out-expo` | Rendered at `scaleX(1)` immediately |
| `offset-lift` | Card hover: `translate(-6px, -6px)` + `box-shadow: --e-offset-md` + border → `--c-accent` | `:hover` / `:focus-within` on the card | `--d-fast`, `--ease-out-quart` | Border color change only, no transform, no shadow, 0ms |
| `zoom-warm` | Project thumbnail: `scale(1) filter: grayscale(0.55) contrast(1.05)` → `scale(1.05) grayscale(0)` | Parent card `:hover` / `:focus-within` | `--d-base` (`filter` `--d-fast`), `--ease-out-quart` | `grayscale` transition only, 200ms; no scale |
| `underline-wipe` | Link/title underline `scaleX(0)` → `1` from left; on mouse-out it collapses to the **right** (origin flips) | `:hover` / `:focus-visible` | `--d-fast`, `--ease-out-quart` | Underline is permanently visible; color change only |
| `slot-in` | Project card's bottom "VIEW LIVE ↗" bar slides up from beneath the card edge via `translateY(100%)` → `0` | Card `:hover` / `:focus-within` | `--d-fast`, `--ease-out-expo`, **40ms** delay after `offset-lift` | Bar is permanently visible at 100% opacity |
| `tag-pop` | Tag hover: `scale(1.06)` + border → accent | `:hover` | `--d-instant`, `--ease-overshoot` | Border/color change only |
| `nav-condense` | Header height `88px → 64px`, background → `--c-surface-1` at 92% + `backdrop-filter: blur(12px)`, bottom hairline fades in | `scrollY > 24`, toggled by a class from a throttled scroll listener (rAF-gated) | `--d-base`, `--ease-in-out` | Header renders in condensed state from the start; no transition |
| `progress-rail` | 2px lime hairline across the bottom edge of the header, `scaleX` = document scroll fraction | rAF-gated scroll | none (direct, per-frame) | Hidden entirely (`display: none`) |
| `marquee` | Ticker strip translates `-50%` on a duplicated track | Always (CSS `@keyframes`, linear, **32s**) | linear, infinite | Animation paused; track shows the first 100% statically, `overflow: hidden` |
| `count-up` | Stat numerals count 0 → target | `IntersectionObserver`, once | 1200ms, `--ease-out-expo` | Final value rendered immediately |
| `menu-cascade` | Mobile nav items `translateY(28px)` + `opacity 0` → in | Menu open | `--d-base`, `--ease-out-expo`, stagger **50ms** | Panel cross-fades over 150ms, items static |
| `pulse-live` | 8px vermilion availability dot, `box-shadow` ring expands and fades | Always, 2.4s loop | `ease-out`, infinite | Static dot, no ring |

### 5.4 Reduced-motion implementation

Do **not** rely on a blanket kill-switch alone — but do install one as a floor:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Then, per the table above, restore the specific opacity-only transitions inside a `@media (prefers-reduced-motion: reduce)` block using explicit selectors (the `!important` floor is overridden by re-declaring with `!important` on the intended properties). Additionally, in JS:

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
```
- If `reduced.matches`: **do not initialise the hero canvas at all** (CSS fallback shows), skip `count-up` (write final values), skip `progress-rail`, and have the `IntersectionObserver` add the `is-in` class with no transition.
- Listen to `reduced.addEventListener('change', …)` and tear down / boot the canvas live. A user flipping the OS setting should not need a reload.
- `scroll-behavior: smooth` on `html` is set **only** when `reduced.matches === false`.

---

## 6. Section-by-section layout

Page order: **Nav → Hero → Ticker → About (bone) → Skills (bone) → Projects → Contact → Footer.**

### 6.0 Nav

**Desktop (`≥ 1024px`)** — fixed, full-bleed, `z-index: 100`.
- Height `88px` at top of page → `64px` condensed (`nav-condense`). Transparent at top (hero canvas shows through), `--c-surface-1 / 92%` + `blur(12px)` + `1px` bottom border `--c-border` once condensed.
- Left: wordmark **`CELSO AQUINO`** in `--t-eyebrow` mono, `--c-text`, with a superscript `↗` sized `0.6em` in `--c-accent`. **No logo mark, no "DevPortfolio."** The name is the brand.
- Center-right: link row, `gap: var(--s-6)`. Each link is `--t-eyebrow` mono uppercase, prefixed with its two-digit index in `--c-text-muted`:
  `01 WORK · 02 ABOUT · 03 STACK · 04 CONTACT`.
  - Rest: `--c-text-2`. Hover/focus: `--c-text` + `underline-wipe` in `--c-accent`.
  - **Active section**: index numeral turns `--c-accent`, label turns `--c-text`, and a 2px lime bar sits under the label. Driven by an `IntersectionObserver` over the four sections (`rootMargin: '-45% 0px -45% 0px'` so exactly one is active), with `aria-current="true"` set on the active anchor.
- Far right: a `btn-primary` **`Hire me`** (lime), `--t-eyebrow`, height 40px.
- Bottom edge: `progress-rail`, 2px, lime, `transform-origin: left`.

**Tablet (`768–1023px`)** — same bar, link row collapses to the mobile trigger; the `Hire me` button stays visible.

**Mobile (`< 768px`) — real, working nav.**
- Trigger: a 44×44px button, `aria-controls="site-menu"`, `aria-expanded="false"`, `aria-label="Open menu"`. Visual: two 20px-wide, 2px-tall `--c-text` bars, 6px apart. Open state morphs to an X (`rotate(45deg)/rotate(-45deg)` + `translateY`), `--d-fast`, `--ease-in-out`.
- Panel: **full-viewport overlay**, `position: fixed; inset: 0;` `background: var(--c-bg)` (opaque — not translucent, the hero canvas behind would fight the type), `z-index: 200`, `100dvh` (not `100vh` — mobile browser chrome).
- Panel content, top to bottom:
  - Header row mirroring the bar (wordmark left, X right) so nothing jumps.
  - Link list: each item is a full-width row, `min-height: 64px`, `1px` bottom border `--c-border`, index numeral in mono `--c-text-muted` left, label in `--t-d3` `.fx-semi` `--c-text`. Active row: index and a left 3px lime bar in `--c-accent`.
  - Footer block: `Hire me` full-width lime button, then email + WhatsApp + GitHub + LinkedIn as mono rows.
- Behavior — all required:
  - `menu-cascade` on open; reverse fade `--d-fast` on close.
  - **Focus trap** inside the panel; focus moves to the first link on open and returns to the trigger on close.
  - **`Esc`** closes.
  - Scroll lock: `document.documentElement.style.overflow = 'hidden'` plus preserve/restore `scrollTop` to avoid the iOS jump.
  - Clicking any link closes the panel, then scrolls.
  - `inert` (or `aria-hidden="true"`) applied to `<main>` and `<footer>` while open.
  - Panel closes automatically if the viewport crosses to `≥ 768px`.

### 6.1 Hero

Height `min-height: 100svh` (small-viewport unit, so mobile chrome can't clip the CTAs), `display: grid`, content bottom-anchored with `padding-block-end: var(--s-11)`.

**Desktop:** 12-col grid. Display block occupies cols 1–9. Right gutter (cols 11–12) holds a vertical mono metadata stack, bottom-aligned, `--c-text-muted`:
```
AVAILABLE FOR CONTRACT   ● (pulse-live, vermilion)
12 SHIPPED PROJECTS
4 CONTINENTS · 2+ YEARS
```
Below the display block: `--t-lead` intro (max 46ch, cols 1–6), then CTA row.
- CTA row: `btn-primary` **`See the work ↓`** (lime, anchors to `#work`) + `btn-ghost` **`Start a project`** (anchors to `#contact`). `gap: var(--s-4)`.
- Bottom-left corner: a mono `SCROLL` label with a 40px vertical lime hairline that loops `scaleY` 0→1→0 over 2s (killed by reduced-motion).

**Tablet:** display block spans cols 1–11; metadata stack moves below the CTA row as a horizontal mono row separated by `·`.

**Mobile:** single column. Display at `wdth 100`. Metadata collapses to two mono lines under the CTAs. CTAs stack full-width with `gap: var(--s-3)`. Eyebrow shortens to `TAGUIG, PH · UTC+8`.

Hierarchy: display type → lead → primary CTA → metadata → everything else.

### 6.2 Ticker strip

Full-bleed band, `height: 56px`, `background: var(--c-accent-2)`, text `--c-bg`, `--t-eyebrow` mono uppercase, items separated by a `◆` glyph. Sits directly beneath the hero as a hard color slam.

Content: `SHOPIFY · WORDPRESS · LIQUID · REACT · TYPESCRIPT · TAILWIND · UNITED STATES · AUSTRALIA · BELGIUM · SOUTH AFRICA ·` (track duplicated for a seamless `marquee`). Rotated `-0.6deg` and slightly over-wide so the ends bleed past the viewport. **[Bold call]** *The tilt is the one piece of pure attitude in the layout; it earns "expressive" without adding a single decorative element.*

`aria-hidden="true"` — it's a decorative restatement of content that appears in Skills.

### 6.3 About (bone band)

Full-bleed `--c-bone`, `--c-ink` type. Top and bottom edges are hard — no gradient transition. **[Bold call]** *A hard seam is the whole move; feathering it into the dark makes it look like an accident.*

**Desktop:** 12-col.
- Cols 1–4: the headshot. `photo.png` is a headshot on a black background, so it must be treated, not just placed: render it inside a **`--c-ink` block** (`aspect-ratio: 4/5`, `object-fit: cover`, `object-position: 50% 20%`) with a `12px` bone border inset, and apply `filter: grayscale(1) contrast(1.08)` with a `mix-blend-mode: multiply` lime duotone overlay at 18% opacity. Result: the black background becomes intentional. On hover, `filter: grayscale(0)` over `--d-base`.
- Cols 6–12: eyebrow `02 / ABOUT` → `--t-d2` heading (2 lines, max 14ch) → two `--t-body` paragraphs at 68ch → a **stats row**.
- Stats row: three cells, `1px` `--c-bone-border` dividers, each with a `count-up` numeral at `--t-d3` in `--c-accent-2-deep` and a mono label in `--c-ink-2`:
  `12 PROJECTS SHIPPED` · `4 COUNTRIES SERVED` · `2+ YEARS BUILDING`.

**Tablet:** photo becomes a 5-col block, text 7-col, stats wrap to a 3-up row below.
**Mobile:** photo first at `aspect-ratio: 3/2`, `max-width: 260px`, left-aligned (not centered); text below; stats become a 1-col list with hairline separators.

### 6.4 Skills (bone band, continuous)

Same bone ground — **no gap or seam between About and Skills**; they are one paper sheet. Separated only by a `rule-draw` hairline in `--c-bone-border`.

Eyebrow `03 / STACK`, heading `--t-d2`.

**Not four glass cards.** Rendered as a **spec table** — four labelled rows, each a full-width band with a mono category label in the left 3 columns and the items as bone tags flowing across the right 9:

| Label (mono, `--c-ink-2`) | Items |
|---|---|
| `PLATFORMS` | Shopify · Liquid · WordPress · WooCommerce · GoHighLevel · FlutterFlow |
| `LANGUAGES` | HTML · CSS · JavaScript · TypeScript · PHP · React |
| `DATA & APIS` | Supabase · Firebase · Xano · SQLite · REST integrations |
| `PRACTICE` | Technical SEO · Performance · Agile delivery · Client comms |

- Each row: `padding-block: var(--s-6)`, `border-bottom: 1px solid var(--c-bone-border)`.
- Row hover: label slides `translateX(6px)` and turns `--c-accent-2-deep`, `--d-fast`.
- Tags here use the **bone tag** variant (§7.2).
- **Mobile:** label stacks above its tag cluster; rows keep their hairlines.
- **[Bold call]** *Icon-topped skill cards are pure template DNA and imply nothing about proficiency. A table reads as a spec sheet, matches the manifest concept, and lets a hiring manager scan for a keyword in two seconds.*

### 6.5 Projects — **two tiers, not a uniform 3×4 grid**

**A uniform 3-column grid of 12 cards is the wrong call here** and this is the most consequential layout decision in the doc. Three reasons: (1) twelve equal cards means twelve equally-unimportant cards — the visitor has no entry point and the client work drowns among the personal React demos; (2) the projects are genuinely not peers — three of them are revenue-generating e-commerce storefronts for real businesses, which is exactly what Celso is hired to build, and the rest are supporting evidence; (3) a 3×4 grid is visually monotonous, which kills the "expressive" brief on the page that matters most.

**Structure: 3 featured case rows + a filterable 9-card grid.**

Section head: eyebrow `01 / SELECTED WORK`, heading `--t-d2` (`TWELVE THINGS THAT ARE LIVE RIGHT NOW`), plus a right-aligned mono counter `12 / 12 SHIPPED`.

#### Tier 1 — Featured case rows (3)

**Which three:** `Building Controls & Solutions`, `Light + Glo Designs`, `Basix Plastics`. Rationale: all three are real commerce storefronts on three continents (US, AU, ZA), which is the exact proof a prospective e-commerce client is shopping for.

**Desktop layout** — full-width row, 12-col, `min-height: 420px`, alternating: row 1 image cols 1–7 / text cols 8–12; row 2 mirrored; row 3 back to row-1 order. Rows separated by a `rule-draw` hairline, `margin-block: var(--s-10)`.

- **Image side:** `aspect-ratio: 16/10`, `object-fit: cover; object-position: top center`, `--r-xs`, `1px solid var(--c-border)`. Sits on a `--c-surface-1` plate offset `16px` down-right so the plate reads as the shadow. On row hover the image runs `zoom-warm` and the plate turns `--c-accent`.
- **Text side:** giant mono index `01` at `--t-d3` in `--c-accent` → title at `--t-d3` `.fx-disp` `--c-text` → description at `--t-body` `--c-text-2` (max 52ch) → tag row → link row.
- **Link row:** `Live site ↗` as `link-arrow` in `--c-accent-2`; `Source ↗` in `--c-text-2` where a GitHub URL exists.
- The **whole row is a link** to the primary (live) URL via a stretched-link pseudo-element; the secondary GitHub link sits above it with `position: relative; z-index: 1`.

**Tablet:** image full width on top, text below, no alternation.
**Mobile:** identical to tablet; index numeral shrinks to `--t-index` and sits inline with the tag row.

#### Tier 2 — The grid (9)

Preceded by a **filter bar**: `ALL (9) · E-COMMERCE · WORDPRESS · APPS`.
- Buttons are mono `--t-eyebrow`, `--r-pill`, `1px` border. Rest: border `--c-border-strong`, text `--c-text-2`. Active: `--c-accent` fill, `--c-bg` text.
- Implementation: `data-cat` attributes on cards; JS toggles a `.is-hidden` class (`opacity: 0; transform: scale(0.97); pointer-events: none;` then `display: none` after `--d-fast` via `transitionend`). No layout library.
- Accessibility: buttons are `<button aria-pressed>` in a `role="group"` with an accessible name; an `aria-live="polite"` visually-hidden region announces `Showing 4 of 9 projects.` Filtering is progressive enhancement — with JS off, the bar is hidden and all 9 show.

Grid: 3 cols `≥ 1024px` · 2 cols `640–1023px` · 1 col `< 640px`, `gap: var(--s-6)`.

**Card anatomy (top → bottom):**
1. Thumbnail, `aspect-ratio: 16/10`, `object-position: top center`, `loading="lazy"`, `decoding="async"`, explicit `width`/`height` to reserve space (CLS = 0).
2. Meta row: mono index (`04`–`12`) in `--c-text-muted`, and a right-aligned category chip.
3. Title, `--t-h3`.
4. Description, `--t-sm`, `--c-text-2`, clamped to **3 lines** (`-webkit-line-clamp: 3`) so card heights stay even.
5. Tag row — **max 4 tags**, overflow rendered as `+N`.
6. The `slot-in` action bar, flush to the card's bottom edge, `height: 44px`, `background: var(--c-accent)`, `color: var(--c-bg)`, mono, reading `VIEW LIVE ↗` (or `VIEW CODE ↗` where there is no live URL).

**Card states:**
- **Rest:** `--c-surface-1`, `1px solid --c-border`, `--r-xs`, image at `grayscale(0.55)`, action bar translated out of view.
- **Hover / focus-within:** `offset-lift` + `zoom-warm` + `slot-in` + border `--c-accent` + index numeral turns `--c-accent`.
- **Focus-visible (keyboard):** identical to hover **plus** the focus ring (§7.6). The card is a single tab stop; the secondary GitHub link is the second.
- **Touch (`@media (hover: none)`):** hover states never fire, so the action bar is **permanently visible** and the image is permanently at `grayscale(0)`. Do not ship hover-only affordances.

**Below the grid:** a full-width `btn-ghost` **`All 12 on GitHub ↗`**.

### 6.6 Contact

Ink shell. Full-bleed top hairline in `--c-accent-dim`.

**Desktop:** 12-col split.
- Cols 1–5: eyebrow `04 / CONTACT` → `--t-d2` heading (`LET'S BUILD THE THING`) → `--t-lead` line → a mono **contact ledger**: four rows, each `1px` bottom border `--c-border`, `min-height: 56px`, label left in `--c-text-muted`, value right in `--c-text`:
  `EMAIL cvaquino03@outlook.com` · `WHATSAPP +63 929 379 8597` · `BASED IN Taguig City, PH · UTC+8` · `STATUS ● Open to contract` (vermilion `pulse-live` dot).
  Row hover: value turns `--c-accent`, `underline-wipe`. Rows are real `<a href="mailto:…">` / `<a href="https://wa.me/…">`.
  Below: social row — GitHub, LinkedIn, WhatsApp as 44×44px square outline buttons.
- Cols 7–12: the Formspree form on a `--c-surface-1` plate, `--s-8` padding, `1px --c-border`.

**Tablet / Mobile:** ledger stacks above the form, full width. The form plate loses its border on mobile and becomes flush (`padding-inline: 0`) to preserve horizontal room.

**Form fields:** Name, Email, Subject, Message (5 rows) + submit. Spec in §7.4.
**Submit:** `btn-primary`, full width, label `Send it →`. States: default → `:active` (translate 2px,2px, shadow removed) → sending (label `Sending…`, `aria-busy="true"`, disabled) → success (a lime confirmation panel replaces the form, `rise`) → error (vermilion inline message, `role="alert"`, form preserved). **Handle submission with `fetch()` to Formspree and stay on the page** — never let it navigate away to the Formspree confirmation screen. Progressive enhancement: without JS the native POST still works.

### 6.7 Footer

`--c-bg-deep`, `padding-block: var(--s-9) var(--s-6)`, top border `1px --c-border`.

- **Row 1 (the flex):** the name set enormous — `CELSO AQUINO` at `--t-d1` scale, `.fx-wide`, in `--c-surface-2` (barely-there, ~1.4:1 against the ground, purely decorative), clipped at the bottom by the container so the letterforms bleed off the page edge. `aria-hidden="true"` and duplicated in an accessible visually-hidden text node. **[Bold call]** *A giant bleeding wordmark is the standard sign-off of studio sites; it costs nothing and lands the "crafted" impression on the last thing the visitor sees.*
- **Row 2:** three columns — left `© 2026 Celso Aquino`, center the four nav links repeated in mono, right `Built with Vite + Tailwind · No template ↗` linking to the repo. All `--t-eyebrow`, `--c-text-muted`.
- **Row 3:** a single mono line, `--c-text-muted`, `MANIFEST COMPLETE — 12 / 12 ITEMS ACCOUNTED FOR`.
- **Mobile:** rows 2 and 3 stack left-aligned with `gap: var(--s-4)`.

---

## 7. Component specs

### 7.1 Buttons

All buttons: `--font-mono`, `--t-eyebrow` (12px / 600 / `0.16em` / uppercase), `--r-xs` (2px), `min-height: 48px` (**44px minimum touch target satisfied**), `padding-inline: var(--s-5)`, `display: inline-flex; align-items: center; gap: var(--s-2)`.

| Variant | Rest | Hover | Active | Disabled |
|---|---|---|---|---|
| **`btn-primary`** | bg `--c-accent`, text `--c-bg`, no border | `translate(-3px,-3px)` + `box-shadow: --e-offset-sm` using `--c-accent-2` | `translate(0,0)`, shadow removed, bg `--c-accent-dim` | `opacity: 0.45`, `cursor: not-allowed`, `pointer-events: none` |
| **`btn-ghost`** | transparent, `1px solid --c-text-muted`, text `--c-text` | border + text → `--c-accent`, `translate(-3px,-3px)` + `--e-offset-sm` | `translate(0,0)`, shadow removed | as above |
| **`btn-quiet`** | transparent, no border, text `--c-text-2` | text `--c-text` + `underline-wipe` in `--c-accent` | text `--c-accent` | as above |
| **`btn-icon`** (social) | 44×44px square, `1px solid --c-border-strong`, icon `--c-text-2` | border `--c-accent`, icon `--c-accent`, `translate(-2px,-2px)` + `4px 4px 0 --c-accent` | `translate(0,0)` | as above |

On the bone band, `btn-primary` becomes bg `--c-ink` / text `--c-bone` with an `--c-accent-2-deep` offset shadow; `btn-ghost` uses `--c-ink-2` borders. Lime never appears on paper.

Transition: `transform, box-shadow, background-color, border-color, color` at `--d-fast` `--ease-out-quart`.
Reduced motion: color and border changes only; no transform, no shadow.

### 7.2 Tags / badges

**Ink variant (default):** mono `--t-mono` (13px), `--r-pill`, `padding: 5px 12px`, `1px solid --c-border-strong`, text `--c-text-2`, transparent fill.
- Hover: `tag-pop` — `scale(1.06)`, border `--c-accent`, text `--c-accent`.
- Tags are **not** interactive by default (`pointer-events: none` inside project cards, so they don't steal the card's click). They become buttons only in the filter bar.

**Category chip** (project card meta row): same geometry, but color-coded by family, filled at 12% alpha with a full-opacity 1px border and full-opacity text:
- `E-COMMERCE` → `--c-accent-2`
- `WORDPRESS` → `--c-accent`
- `APP` → `--c-text-2`
Only these three. **[Bold call]** *Color-coding all eight-plus tech tags would produce confetti; coding only the three project families gives the grid a scannable rhythm.*

**Bone variant** (Skills table): `1px solid --c-bone-border`, text `--c-ink-2`, fill `--c-bone-2`. Hover: border and text → `--c-accent-2-deep`.

**`+N` overflow tag:** no border, text `--c-text-muted`, `title` attribute listing the hidden tags.

### 7.3 Cards

| Property | Ink card | Featured row | Bone plate |
|---|---|---|---|
| Background | `--c-surface-1` | transparent (image plate `--c-surface-1`) | `--c-bone-2` |
| Border | `1px solid --c-border` | none; `1px` hairline separator between rows | `1px solid --c-bone-border` |
| Radius | `--r-xs` (2px) | `--r-xs` on the image | `--r-xs` |
| Padding | `var(--s-5)` (24px), image is flush/bleeding | `0` (grid-managed) | `var(--s-6)` |
| Elevation rest | none | none | `--e-paper` |
| Elevation hover | `--e-offset-md` + `translate(-6px,-6px)` | image plate turns `--c-accent` | none (paper doesn't lift) |
| Overflow | `hidden` (required for `slot-in`) | `hidden` on the image only | `visible` |

Every card sets `transition: transform var(--d-fast) var(--ease-out-quart), box-shadow var(--d-fast) var(--ease-out-quart), border-color var(--d-fast) linear;` and `will-change: transform` **only while hovered** (add via the hover selector, never statically — 12 permanently-promoted layers is a memory cost for nothing).

### 7.4 Form fields

- **Label:** `--t-eyebrow` mono, `--c-text-muted`, `margin-bottom: var(--s-2)`. Always visible — **no placeholder-only fields.**
- **Input / textarea:** full width, `min-height: 52px` (textarea `min-height: 160px`, `resize: vertical`), `background: --c-surface-2`, `border: 1px solid --c-text-muted` (5.53:1 — meets the 3:1 non-text minimum), `--r-xs`, `padding: 14px 16px`, `--t-body`, `color: --c-text`.
- **Placeholder:** `--c-text-muted`, used only for format examples, never as the label.
- **Hover:** border `--c-text`.
- **Focus-visible:** border `--c-accent`, plus the focus ring (§7.6). No blur glow.
- **Invalid** (`:user-invalid`, not `:invalid` — don't shout before they've typed): border `--c-accent-2`, and a `--t-sm` message below in `--c-accent-2` wired via `aria-describedby`, `aria-invalid="true"`.
- **Filled/valid:** border `--c-border-strong`, a 12px lime check glyph at the trailing edge.
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`.
- **Autofill:** override the UA yellow — `input:-webkit-autofill { -webkit-text-fill-color: var(--c-text); box-shadow: 0 0 0 1000px var(--c-surface-2) inset; }`.
- Required fields marked with a `--c-accent-2` asterisk **and** `required` + a legend explaining the asterisk. Never color alone.

### 7.5 Links

- **`link-inline`** (in body copy): `--c-text`, `border-bottom: 1px solid --c-accent-dim`. Hover: `border-bottom-color: --c-accent`, text `--c-accent`.
- **`link-arrow`** (outbound): text + a `↗` glyph in a `span`. Hover: `underline-wipe` in the link's own color, and the arrow translates `2px, -2px` over `--d-instant`. Live-site links are `--c-accent-2`; source/GitHub links are `--c-text-2` → `--c-text` on hover.
- **`link-nav`**: see §6.0.
- All outbound links get `target="_blank" rel="noopener noreferrer"` and a visually-hidden `(opens in a new tab)`.
- Underline offset globally: `text-underline-offset: 0.22em; text-decoration-thickness: 1px;`.

### 7.6 Focus states

**Single global rule, `:focus-visible` only** (never `:focus`, so mouse clicks don't ring):

```css
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 3px;
  border-radius: var(--r-xs);
}
.bone :where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline-color: var(--c-focus-ink);
}
```

- On the lime `btn-primary`, where a lime ring would vanish, override to `outline-color: var(--c-bg)` with `outline-offset: 3px` — 17.24:1 against the button, unmissable.
- Never `outline: none` without an equivalent replacement. This is a hard review gate.
- Ring contrast check: `--c-accent` on `--c-bg` = **17.24 : 1**; `--c-ink` on `--c-bone` = **16.00 : 1**. Both exceed the 3:1 focus-indicator requirement by a wide margin.
- **Skip link:** first element in `<body>`, visually hidden until focused, then pinned top-left with `--c-accent` fill / `--c-bg` text, targeting `#main`.
- Tab order is DOM order throughout. **No positive `tabindex` values anywhere.**

### 7.7 Global utilities to define once

```css
.u-visually-hidden   /* clip-rect pattern, not display:none */
.u-bleed             /* full-viewport-width escape from container */
.u-rule              /* 1px --c-border hairline, animatable via rule-draw */
.u-index             /* mono two-digit numeral, --c-text-muted */
.u-eyebrow           /* --t-eyebrow, mono, uppercase, with a 24px lime leading dash */
.u-clamp-3           /* -webkit-line-clamp: 3 */
```

---

## 8. Implementation checklist

- [ ] `tokens.css` imported before Tailwind's `@tailwind base` so tokens are available to `theme.extend`.
- [ ] Fonts self-hosted via npm; Archivo variable preloaded; `font-display: swap`; `font-synthesis: none`.
- [ ] All 12 screenshots converted to **WebP** (keep the originals as `<source>` fallbacks or drop them entirely — every target browser supports WebP), served at 2 widths via `srcset` (`720w`, `1280w`), `loading="lazy"` on everything below the fold, explicit `width`/`height` on every `<img>`.
- [ ] Rename `dashboard app.PNG` → `dashboard-app.webp`. **A space in a filename is a broken URL waiting to happen on GitHub Pages.**
- [ ] Hero canvas: dpr capped at 2, 30fps, IO-paused, visibility-paused, ≤3 KB, torn down under reduced-motion.
- [ ] Mobile nav: `aria-expanded`, focus trap, `Esc`, scroll lock, `inert` on background, auto-close at `≥768px`.
- [ ] Every animated effect in §5.3 has its reduced-motion branch implemented and verified with the OS setting on.
- [ ] Keyboard pass: every project card, filter button, form field, and nav link reachable and visibly ringed.
- [ ] Contrast pass re-verified in-browser after implementation (values in §2.2 are the source of truth).
- [ ] Lighthouse targets: **Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100**, CLS = 0.
- [ ] Zero third-party runtime dependencies at page load — no CDN scripts, no AOS, no Vanta, no Feather. Icons ship as inline SVG.

---

**Design system v1 — 2026-08-14**
Direction: Bold & expressive · Concept: The Manifest
Ready for developer handoff.
