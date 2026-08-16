# Accessibility Audit — Celso Aquino Portfolio

**Standard:** WCAG 2.2 Level AA
**Scope:** the whole single-page site (hero, ticker, bone band, projects, contact, footer), at 1440px, 900px, 640px, 390px and 320px
**Branch:** `revamp`
**Build result:** `npm run build` → **exit 0** (`✓ built in 752ms`, `dist/index.html` 78.35 kB)

---

## How this was tested

Everything below is marked **[verified]** or **[inferred]**.

- **[verified]** means it was reproduced in a real Chromium session driven by
  Playwright against the running dev server — computed styles read from the
  live CSSOM, real `Tab`/`Escape` key presses, real viewport resizes, real
  `prefers-reduced-motion` changes via `emulateMedia`, and accessible names
  resolved by querying Playwright's `role=…[name=…]` engine (which computes
  accname the same way the browser exposes it to AT).
- **[inferred]** means it was found by reading the source and is a correct
  reading of the spec, but the failure mode was not staged in the browser.

Not done, and worth being honest about: **no real screen reader was driven.**
Accessible names, roles and the live-region wiring were verified through the
browser's own accessibility computation, not through NVDA/JAWS/VoiceOver
speech output. Announcement *ordering* and *verbosity* — particularly the
interaction between the new form error summary and the focus move that
follows it — should be confirmed with NVDA + Firefox and VoiceOver + Safari
before this is called done. See "Not fixed / still open".

Tools: Playwright (Chromium), a hand-written contrast sweep that walks every
text-bearing element, composites the real painted background through the
ancestor chain, and applies the WCAG large-text thresholds.

---

## Summary

| Severity | Found | Fixed |
|---|---|---|
| Serious  | 3 | 3 |
| Moderate | 4 | 4 |
| Minor    | 4 | 4 |
| Accepted with rationale | 1 | — |

**Conformance:** was **DOES NOT CONFORM** (1.4.3, 1.4.11, 2.4.3, 2.5.8, 4.1.2).
Now **PARTIALLY CONFORMS** — no known AA failure remains in the audited
surface, but conformance is not claimed until the screen-reader pass below is
run.

Things that were already right, and should not be regressed: content is
visible by default and only hidden *after* the IntersectionObserver attaches;
the hero headline carries a plain-text alternative alongside the
`aria-hidden` display treatment; every form control has a real `<label for>`;
the mobile panel already had a working focus trap, `Esc`, scroll lock and
`inert`; the filter bar already announced through `role="status"`; and the
whole page works with JavaScript disabled.

---

## Issues found and fixed

### 1. Focus indicator invisible on every primary button — Serious
**WCAG 1.4.11 Non-text Contrast (AA), 2.4.7 Focus Visible (AA)** · **[verified]**

`.btn-primary:focus-visible` set `outline-color: var(--c-bg)` — a deliberate
choice, because a lime ring on a lime button would vanish. But the global
focus rule also sets `outline-offset: 3px`, so the ring was painted 3px
*outside* the button, on the page background, which is the same `#0A0A0B`.
Measured contrast of the indicator against its adjacent colour: **1.02:1**.

Verified by reading `getComputedStyle(document.activeElement).outlineColor`
after keyboard-driven focus (`rgb(10, 10, 11)`) and by screenshotting the
focused header CTA — the only visible change on focus was the vermilion
offset shadow, which is also the *hover* treatment and so cannot serve as the
focus indicator.

Affected: header "Start a project", hero "See the work", the mobile panel CTA,
and the contact form's "Send message" — i.e. every primary call to action.

**Fixed** in `src/styles/main.css`: the ring is now inset instead of outset.

```css
.btn-primary:focus-visible { outline-color: var(--c-bg); outline-offset: -4px; }
```

`#0A0A0B` on `#D8FF3D` measures **15.9:1**. The bone-band variant is an ink
block on paper, where an outset vermilion ring reads fine, so that one keeps
`outline-offset: 3px` explicitly.

**Visual change:** on focus, primary buttons now show a thin dark ring drawn
just inside the lime fill instead of an (invisible) ring outside it. The
hard-offset vermilion shadow and the 3px lift are untouched.

Also removed a dead `.card__bar:focus-visible` rule — `.card__bar` is an
`aria-hidden` `<p>` and can never be focused.

---

### 2. Project headings announced with "(opens in a new tab)" — Serious
**WCAG 1.3.1 Info and Relationships (A), 2.4.6 Headings and Labels (AA)** · **[verified]**

This is the item flagged in the brief, and the flag was correct.

The card and case-row titles are `<h3>` elements wrapping a link that carries
`aria-label="<title> (opens in a new tab)"`. A heading with no name of its own
is named *from its contents* (accname-1.2 step 2F), and that traversal honours
`aria-label` on every descendant it walks (step 2C applies recursively). So the
heading inherited the hint.

Verified, not assumed. Before the fix this locator matched the `<h3>`:

```
role=heading[name="GEM (Green Energy Management) (opens in a new tab)"s]  → H3.card__title
```

Every one of the 13 project headings was affected, which means a screen
reader's heading list — the primary way many users navigate a long page — read
"(opens in a new tab)" thirteen times.

**Fixed** in `src/build/content.js`: the heading is now named explicitly, which
wins over content traversal, while the link keeps the hint that makes it
useful.

```js
<h3 class="card__title"${primary ? ` aria-label="${attr(p.title)}"` : ''}>
```

Both strings are interpolated from the same `p.title` in the same template
literal, so the label cannot drift from the visible text — which is also what
keeps **2.5.3 Label in Name** satisfied.

**Verified after:** the polluted locator matches 0 elements, `role=heading[name="GEM (Green Energy Management)"]`
matches 1, `role=heading[name="Basix Plastics"]` matches 1, and
`role=link[name="GEM (Green Energy Management) (opens in a new tab)"]` still
matches 1. 10 card headings + 3 case-row headings carry the label in `dist/`.

*Alternative considered and rejected:* dropping the new-tab hint entirely. It
would also produce a clean heading, and announcing a new tab is advisory
(G201), not required at AA — but it throws away a real affordance to fix a
problem that a two-word attribute fixes properly.

---

### 3. Three text colours below 4.5:1 — Serious
**WCAG 1.4.3 Contrast (Minimum) (AA)** · **[verified]**

The palette table in `docs/design-system.md` §2.2 is honest and its own rule
says `--c-border-strong` #3A3A44 is **2.24:1** and is "decorative hairlines
only … never the *sole* indicator". Three places used it as body text anyway.
Measured against the real composited background:

| Element | Text | Was | Now |
|---|---|---|---|
| `.case-row__role-key` | "Role" | **1.76:1** | 5.47:1 |
| `.footer__manifest` | "MANIFEST COMPLETE — 13 / 13 ITEMS ACCOUNTED FOR" | **1.80:1** | 5.60:1 |
| `.meta-rail__text` | "MANIFEST № 01 — PHILIPPINES · UTC+8" | **1.76:1** | 5.47:1 |

**Fixed** in `src/styles/main.css`: all three move to `--c-text-muted`
#8A8781, which is the token §2.2 already nominates for exactly this.

To keep the two-tone key/value split on the case-row role line, the *value*
(`.case-row__role`) moves up one step to `--c-text-2`, so the key is still
visibly quieter than the value rather than both landing on the same grey.

**Visual change:** the left-gutter manifest rail (≥1280px only) and the footer
manifest line are now legible rather than a whisper — this is the most
noticeable visual change in the audit, and it is unavoidable: they were
informational text at under 2:1. The "Role" key/value pair keeps its
hierarchy, just shifted one step brighter.

**Verified after:** the full-page contrast sweep now returns a single hit, the
decorative footer wordmark below.

---

### 4. Header stayed in the accessibility tree behind the mobile panel — Moderate
**WCAG 1.3.2 Meaningful Sequence (A), 4.1.2 Name, Role, Value (A)** · **[verified]**

`docs/design-system.md` §6.0 requires `inert` on `<main>` and `<footer>` while
the panel is open, and the implementation did exactly that. But the panel is a
`z-index: 200` opaque full-viewport overlay and the header is `z-index: 100` —
so the header sat *behind* the overlay, fully covered, and still live.

Verified with the panel open at 390px: `main.inert === true`,
`footer.inert === true`, `header.inert === false`. A screen-reader user
swiping through the panel would fall out of it into the wordmark link and the
"Start a project" CTA, neither of which is on screen.

**Fixed** in `src/js/nav.js`: `#site-header` joins `backgrounds`. Focus is now
also moved into the panel *before* the background goes inert, because the
trigger that was just activated lives inside the header — inerting first
blurred it to `<body>` for a frame.

**Verified after:** all three containers report `inert === true` with the panel
open, and `false` after `Esc`, with focus correctly restored to the trigger.

---

### 5. Keyboard focus dumped to `<body>` when the menu auto-closed — Moderate
**WCAG 2.4.3 Focus Order (A)** · **[verified]**

§6.0 requires the panel to close automatically at ≥768px. It did — with
`closeMenu({ restoreFocus: false })`. Staged in the browser: open the panel at
390px with focus on a menu link, resize to 900px, and `document.activeElement`
became `BODY`. A keyboard user who rotates a tablet loses their place entirely
and the next `Tab` restarts from the top of the document.

**Fixed** in `src/js/nav.js`: on auto-close, if focus was inside the panel it
is rehomed. The trigger is still rendered from 768–1023px so it is the natural
target; from 1024px it is `display: none` and unfocusable, and the real nav bar
has appeared, so the first `.nav__link` is used instead. `<main>` is the last
resort.

**Verified after:** 390 → 900px lands focus on `BUTTON.menu-trigger`
(`aria-label="Open menu"`); 390 → 1440px lands focus on `A.nav__link` ("01
Work"), with `menu-trigger` confirmed `display: none` at that width.

---

### 6. Filtered-out cards were `aria-hidden` while still holding focusable links — Moderate
**WCAG 4.1.2 Name, Role, Value (A)** · **[verified]**

A filtered-out card gets `aria-hidden="true"` immediately, then fades for
~200ms, and only leaves layout (`display: none`) when the transition ends. For
that whole window the card is visible, tabbable, and hidden from AT — the
`aria-hidden-focus` failure. A fast `Tab` during the transition lands on a
card that is disappearing.

Verified by clicking a filter and sampling synchronously: **4 cells** with
`aria-hidden="true"`, `display: flex`, and two real links inside each.

**Fixed** in `src/js/filters.js`: hidden cells now get `inert`, which removes
them from the accessibility tree *and* the tab order together so the two can
never disagree. `aria-hidden` is retained only as a fallback where `inert` is
unsupported.

**Verified after:** 0 leaky cells, 4 inert cells, and a tab-order walk finds 7
of 14 card links reachable under the "Websites" filter (6 titles + 1 source
link) — exactly the visible set.

---

### 7. `.card__source` below the minimum target size — Moderate
**WCAG 2.2 · 2.5.8 Target Size (Minimum) (AA)** · **[verified]**

The "Source ↗" link measured **58 × 21px**. Normally the spacing exception
would rescue an undersized target, but this one sits *on top of* the card-wide
stretched link (`.card__link::after { inset: 0 }`) — the targets overlap, so
the exception cannot apply and each must be ≥24×24px.

**Fixed** in `src/styles/main.css`: `display: inline-flex; align-items: center;
min-height: 24px`, with the bottom margin dropped from 24px to 16px so the card
does not grow. **Verified after:** 58 × 24px.

**Visual change:** none perceptible — the link's box grew 3px, absorbed by the
margin.

---

### 8. Filter bar revealed by the wrong signal — Minor
**WCAG 4.1.2 (A), progressive enhancement** · **[inferred]**

`.filters` was revealed by `html.js`, a class added by an inline *classic*
script in `<head>`. The behaviour behind it lives in an ES *module*. If the
module fails to load or throws, `js` is still set and the bar renders as a row
of dead buttons — controls that announce themselves as pressable toggles and
do nothing.

**Fixed:** the reveal now hangs off `html.filters-on`, added by `initFilters()`
itself once the click handler is attached. Every card is in the shipped HTML
either way, so nothing is gated behind script.

**Verified:** with JavaScript disabled against the **production build**
(`npm run preview`, not the dev server — in dev the CSS is injected by JS, so a
no-JS test there is meaningless): stylesheet loads, filter bar `display: none`,
all 10 grid cards and 3 case rows visible, 0 elements stranded at `opacity: 0`,
mobile trigger and panel hidden, form retains its real Formspree `action`.

---

### 9. Skip link scrolled but did not move focus — Minor
**WCAG 2.4.1 Bypass Blocks (A)** · **[inferred, then verified after fix]**

`<main id="main">` had no `tabindex`, so in some browsers activating the skip
link scrolls without moving focus and the next `Tab` returns to the header the
user just skipped.

**Fixed** in `index.html`: `tabindex="-1"` on `<main>`. **Verified after:**
`Tab` → skip link, `Enter` → `document.activeElement` is `MAIN#main`.

---

### 10. Overflow tag pill exposed its contents only via `title` — Minor
**WCAG 1.3.1 Info and Relationships (A)** · **[inferred]**

`<li class="tag tag--more" title="WCAG / ADA">+1</li>` — `title` is unreachable
by keyboard and unreliable on touch, so the hidden tag names were effectively
sighted-mouse-only, and the pill announced as a bare "+1".

**Fixed** in `src/build/content.js`: the names are now real text in the DOM
(`<span class="u-visually-hidden">1 more: WCAG / ADA</span>`), the "+N" glyph is
`aria-hidden`, and `title` stays as the mouse convenience it always was.

---

### 11. Failed submit announced one error out of four; submit button stole focus — Minor
**WCAG 3.3.1 Error Identification (A), 2.4.3 Focus Order (A)** · **[verified]**

The form was already in good shape: `<label for>` on every control,
`aria-describedby` wired to a per-field error node, `aria-invalid` toggled,
`role="alert" aria-live="assertive"` status region, and errors conveyed as
**text plus colour**, not colour alone (1.4.1 passes — confirmed in a
screenshot showing all four fields with vermilion borders *and* red error
sentences).

Two gaps:

- Submitting an empty form moved focus to the first bad field, making that one
  error audible and saying nothing about the other three; the alert region
  stayed empty.
- `setBusy(true)` set `submit.disabled = true` on the button the user had just
  activated. A disabled control cannot hold focus, so the browser drops it on
  `<body>` mid-request.

**Fixed** in `src/js/form.js`: a short count is written to the alert region
before focus moves (`"4 fields need attention before this can send."`), and the
busy state uses `aria-disabled` plus an `inFlight` guard instead of the
`disabled` property, keeping the button focusable.

**Verified after:** empty submit → alert region reads "4 fields need attention
before this can send.", focus on `f-name`, `submit.disabled === false`. Tested
client-side only; no request was sent to Formspree.

---

## Accepted with rationale — not changed

### `.footer__giant` decorative wordmark — 1.19:1
**WCAG 1.4.3** · **[verified]**

The 176px "CELSO AQUINO" watermark is `--c-surface-2` on `--c-bg-deep`,
**1.19:1**. It is left as-is on the "pure decoration" exemption in 1.4.3: it is
`aria-hidden="true"`, clipped by its container to `max-height: 0.66em` so only
a sliver of the letterforms is ever painted, it is immediately followed by a
visually-hidden plain-text equivalent, and the same words appear at full
contrast in the header wordmark. It carries no information that is not
available elsewhere at 15:1.

This is a judgement call, and it is the one place where the audit accepts a
measured failure rather than fixing it. Raising it would turn a texture into a
headline and would materially change the footer. Flagging it here so the
decision is explicit rather than silent.

---

## Verified as already correct

- **Reduced motion, including the live listener.** Flipping
  `prefers-reduced-motion` at runtime with no reload: the hero canvas tears
  down (`opacity 1 → 0`), the marquee's `animation-name` goes `marquee → none`,
  the liveness dot stops, the hero wipe's `clip-path` goes to `none`, the
  progress rail goes `display: none`, card/reveal transitions collapse to the
  200ms opacity-only branch, and `scroll-behavior` flips `smooth → auto`.
  Flipping it back restarts the canvas. Two earlier readings that looked like
  bugs were not: the canvas legitimately stays down when the hero is scrolled
  off-screen (the IntersectionObserver has stopped it), and Playwright's
  `emulateMedia` delivers the `change` event with about a second of lag.
- **Reflow.** No horizontal scrolling at 320px, 360px, 390px, or 640×512
  (= 200% zoom of 1280×1024). The only elements crossing the viewport edge are
  the intentionally-rotated `aria-hidden` marquee bands.
- **Focus not obscured (2.4.11).** Every focusable element was focused and
  scrolled into view in turn; none came to rest under the fixed header, thanks
  to `scroll-padding-top: calc(var(--nav-h) + 16px)`.
- **Mobile panel.** Focus moves to the first link on open, `Tab` from the last
  item wraps to the close button, `Esc` closes and returns focus to the
  trigger, `inert` clears, scroll lock releases.
- **Landmarks and headings.** One `<h1>`, `<h2>` per section, `<h3>` below —
  no skipped levels. `header`/`main`/`footer` present; all three `<nav>`
  elements named ("Primary", "Mobile", "Footer"); every `<section>` labelled by
  its heading.
- **Filter live region.** `role="status" aria-live="polite"` updates to
  "Showing 6 of 10 projects in Websites." on each change, and `aria-pressed`
  tracks the active button.
- **Images.** All 14 have alt text; none is empty, none is a filename, none is
  keyword-stuffed. They describe the subject of each screenshot ("Legal Policy
  Generator, a React wizard for store policy pages"). Mild note, not a defect:
  none says "screenshot of", which would be marginally more accurate about
  what the image *is*. Left alone — the alt text is client-facing copy and the
  current wording is honest and useful.

---

## Not fixed / still open

1. **No real screen-reader pass.** The single most important remaining gap.
   Accessible names and roles were computed by the browser and verified
   programmatically, which catches structural errors but not speech behaviour.
   Run at minimum: NVDA + Firefox and VoiceOver + Safari, over (a) the heading
   list, to confirm the 13 project headings now read cleanly; (b) an empty form
   submit, to confirm the new error-summary alert and the focus move do not
   talk over each other — if they do, the fix is a short `setTimeout` before
   the focus call, or dropping the summary in favour of the per-field
   announcement alone; (c) the filter bar, to confirm the `role="status"`
   update is spoken without stealing focus.

2. **Section numbering does not match reading order.** The eyebrows read
   "02 / ABOUT", "03 / STACK", "01 / SELECTED WORK", "04 / CONTACT" in DOM
   order — the numbers follow the *nav* order, not the page order. Not a WCAG
   failure (they are labels, and 3.2.3 is about consistency across pages), but
   a screen-reader user hearing "01" third is reasonably going to wonder
   whether they missed something. A content decision, deliberately not changed:
   the numbers are hardcoded in `index.html` and renumbering them to match the
   page would desynchronise them from the nav indices, which are also numbered.
   Worth a decision from whoever owns the design.

3. **`.u-clamp-3` truncates card descriptions to three lines** with no expand
   affordance. The full text is in the DOM and available to AT, so there is no
   AA failure, but sighted users cannot reach the rest of the sentence at any
   viewport or zoom level. Design decision, left alone.

4. **The busy submit button dips to `opacity: 0.45`**, which puts its label at
   roughly 4.2:1 for the duration of the request. Exempt under 1.4.3's
   "inactive user interface components" clause, and pre-existing. Noted rather
   than changed.

5. **`docs/design-system.md` §2.2 is now slightly out of date** — it lists
   `--c-border-strong` correctly as text-forbidden, but the component specs
   elsewhere in the same document assign it to the role key and the manifest
   line. The CSS is now the corrected source of truth. Worth reconciling the
   doc.

---

## Files changed

| File | Change |
|---|---|
| `index.html` | `tabindex="-1"` on `<main>` |
| `src/styles/main.css` | inset focus ring on `.btn-primary`; explicit offset on the bone variant; contrast fixes on `.case-row__role`/`-key`, `.footer__manifest`, `.meta-rail__text`; 24px min target on `.card__source`; filter bar gated on `html.filters-on`; dead `.card__bar:focus-visible` removed |
| `src/build/content.js` | `aria-label` on card and case-row `<h3>`; overflow tag pill exposes its contents as real text |
| `src/js/nav.js` | header added to the inert set; focus moved into the panel before inerting; focus rehomed on breakpoint auto-close |
| `src/js/filters.js` | `inert` on filtered-out cells; `filters-on` class set by the module |
| `src/js/form.js` | error-count summary in the alert region; `aria-disabled` + `inFlight` guard instead of `disabled` |

`content/copy.json` was **not** modified — no accessibility fix required a copy
change, and the project descriptions and About paragraphs are client-approved.
