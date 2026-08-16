# Image optimization

The image payload went from **12.9 MB across 25 files** to **1004 KB across the 14 images the
site actually uses** — a 92.2% reduction on the bytes a browser downloads.

This document covers three things: how the pipeline works, the exact markup change needed to
serve the WebP (**someone other than the image agent has to make this change** — see
[Markup recommendation](#markup-recommendation)), and what was moved where.

---

## Markup recommendation

> **This is the one thing still outstanding.** The optimized files are committed and the
> existing `.png` / `.jpg` references still resolve, so nothing is broken right now — but until
> the markup below lands, the site serves the JPEG/PNG fallback instead of the WebP and leaves
> roughly **320 KB** on the table.

### The pattern

Every project card and the headshot should render as a `<picture>` with a WebP source and a
JPEG fallback:

```html
<picture>
  <source srcset="/images/wedding.webp" type="image/webp">
  <img
    src="/images/wedding.jpg"
    alt="TinEli wedding website"
    width="1400"
    height="761"
    loading="lazy"
    decoding="async"
    class="…"
  >
</picture>
```

Four details that matter:

- **`width` and `height` are required, not optional.** They are the intrinsic pixel dimensions
  of the file, not the display size. Without them the browser cannot reserve space before the
  image loads and every card shifts on load — that is Cumulative Layout Shift, and it is the
  single easiest Core Web Vital to fail by omission. CSS (`w-full h-auto` or similar) still
  controls actual rendered size; the attributes only supply the aspect ratio.
- **`loading="lazy"` on everything below the fold**, which is every project card. Do **not**
  put it on the headshot if the About section is above the fold on desktop — lazy-loading an
  in-viewport image delays it for no benefit.
- **`decoding="async"`** keeps a large decode off the main thread.
- **The `<img>`, not the `<source>`, carries `alt`, `class`, and the sizing attributes.** A
  common mistake is styling the `<picture>` element; it is a wrapper with no box of its own by
  default. Add `class="block"` to the `<picture>` if the layout needs it to be a block.

### Resolving the filename

`content/copy.json` still stores legacy names (`basix.PNG`, `dashboard app.PNG`, `wedding.PNG`).
Rather than hardcoding a translation table, the pipeline emits
[`public/images/manifest.json`](../public/images/manifest.json), keyed by the normalized legacy
filename:

```json
"wedding.png": {
  "webp": "wedding.webp",
  "fallback": "wedding.jpg",
  "compat": "wedding.png",
  "width": 1400,
  "height": 761,
  "bytes": { "webp": 146199, "fallback": 150925 }
}
```

So in `src/main.js`:

```js
import manifest from '/images/manifest.json';

const BASE = import.meta.env.BASE_URL; // '/WebPortfolio/'

/** copy.json stores 'dashboard app.PNG'; the files on disk are 'dashboard-app.*'. */
const normalize = (name) => name.toLowerCase().replace(/\s+/g, '-');

function pictureFor(project) {
  const entry = manifest.images[normalize(project.image)];
  return `
    <picture>
      <source srcset="${BASE}images/${entry.webp}" type="image/webp">
      <img src="${BASE}images/${entry.fallback}"
           alt="${project.imageAlt}"
           width="${entry.width}" height="${entry.height}"
           loading="lazy" decoding="async">
    </picture>`;
}
```

Note `import.meta.env.BASE_URL`. The site deploys to a subpath
(`https://beefbowl03.github.io/WebPortfolio/`), and a hardcoded `/images/…` in a JS-built
string is **not** rewritten by Vite the way it is in HTML — it would 404 in production while
working locally. This is the trap the asset-map notes already warn about for file extensions;
it applies to the base path too.

### Also worth doing

- Preload the headshot if it is above the fold, in `<head>`:
  ```html
  <link rel="preload" as="image" href="/images/photo.webp" type="image/webp" fetchpriority="high">
  ```
- `style.css:120` references `/images/hero-background.jpg`, **which does not exist** and never
  did — it 404s on every page load today. It is legacy CSS; delete the rule or point it at a
  real file.

---

## Running the pipeline

```bash
npm run images         # re-encode everything from the masters
npm run images:check   # verify committed output is in budget; writes nothing (CI-safe)
```

Run `npm run images` when you add or replace a project screenshot, then commit the output. It is
deliberately **not** a Vite plugin: images change a few times a year, and re-encoding 14 files on
every `vite build` would cost seconds per build forever to save a command you run rarely.

### Adding a new project image

1. Drop the master into `assets-src/originals/`.
2. Add an entry to the `PLAN` array in `scripts/optimize-images.mjs`:
   ```js
   { file: 'newproject.png', width: 1400, budget: 150 * KB, kind: 'photo' },
   ```
   A source not listed in `PLAN` is skipped, and the script tells you it skipped it.
3. `npm run images`, then commit both `assets-src/originals/newproject.png` and the generated
   files in `public/images/`.

### How it decides quality

Rather than applying one blunt quality setting to every file, the script walks a quality ladder
downward until the output fits its byte budget. A flat, low-detail screenshot lands at the top
of the ladder; a dense photographic one gets compressed harder. The ladder has a floor (WebP
q62), and a file that cannot fit its budget at the floor is reported as a **failure** rather
than silently shipped as mush — the fix in that case is to lower the width, not the quality.

In practice 12 of 14 images landed at the top of the ladder (q86) and none came near the floor:

| Stepped down | WebP quality | Reason |
| --- | --- | --- |
| `wedding.png` | 82 | Dense foliage, high-entropy |
| `gem.jpg` | 78 | Already a lossy JPEG; re-encoding a JPEG costs quality twice |

Everything else: q86.

---

## What ships, and what does not

| Directory | Tracked in git | Copied into `dist/` | Contents |
| --- | --- | --- | --- |
| `public/images/` | yes | **yes** | 14 optimized images × 2–3 formats, + `manifest.json` |
| `public/images/_unused/` | yes | **yes** ⚠️ | 11 orphaned files pending owner review |
| `assets-src/originals/` | yes | **no** | 14 lossless masters, 12.9 MB |

### Why the masters live outside `public/`

Vite copies `publicDir` into `dist/` **verbatim** — no hashing, no filtering, no transformation.
Anything placed under `public/` ships. Putting the 12.9 MB of lossless masters in
`public/images/_originals/` would therefore have deployed every single byte we just spent effort
removing. They live in `assets-src/originals/` at the repo root instead: still tracked in git,
still `git log --follow`-able through the move, never deployed.

### ⚠️ `_unused/` currently ships

`public/images/_unused/` is inside `publicDir`, so its 1.1 MB is copied into `dist/` and
deployed. **No visitor downloads it** — nothing references those files, so there is zero
user-facing payload cost — but it is 1.1 MB of dead weight in every deploy.

Two ways to resolve it, in order of preference:

1. **Confirm the files are dead and delete them** (see the list below). This is the intent of
   the staging directory; it exists so the owner can eyeball the contents before they are gone.
2. If they need to be kept but not deployed, move the directory to `assets-src/_unused/`
   alongside the masters. Adding an ignore to `vite.config.js` is *not* a clean option — Vite
   has no `publicDir` exclude, so it would mean a custom plugin for a problem that a `git mv`
   solves.

---

## Unreferenced files moved to `public/images/_unused/`

Verified by grepping `content/copy.json`, `docs/asset-map.json`, `index.html`, `src/`,
`script.js`, and `style.css`. **Nothing was deleted** — confirm this list before removing them
for good.

| File | Size | Note |
| --- | --- | --- |
| `beefbowl.png` | 421 KB | |
| `herobanner.png` | 163 KB | |
| `linguista.jpeg` | 164 KB | Distinct image from `linguista.png`, which **is** used |
| `presenthvac.jpeg` | 137 KB | |
| `presententerprises.jpeg` | 132 KB | |
| `perfect.jpeg` | 132 KB | |
| `light-glo.jpeg` | 130 KB | Distinct image from `lightglo.png`, which **is** used |
| `chasing.jpeg` | 48 KB | |
| `rpg.jpeg` | 24 KB | |
| `cv-removebg-preview.png` | 24 KB | Looks like a cut-out headshot; superseded by `photo.png` |
| `beefbowl-logo.svg` | 2 B | Empty file — 2 bytes, not a valid SVG |
| **Total** | **1.1 MB** | |

Two of these deserve a second look before deletion:

- **`light-glo.jpeg` and `linguista.jpeg`** are genuinely different images from the `.png` files
  of nearly the same name, as `docs/asset-map.json` explicitly warns. The `.png` versions are
  the ones `copy.json` uses. The `.jpeg` versions appear to be older screenshots of the same
  two client sites.
- **`beefbowl-logo.svg` is a 2-byte file.** It is not a truncated logo, it is effectively empty.
  If a BeefBowl logo is wanted anywhere, it needs to be re-exported from source.

---

## Results

### Totals

| | Before | After | Change |
| --- | --- | --- | --- |
| Files in `public/images/` | 25 | 14 sources → 39 files | — |
| **Bytes a browser downloads (WebP path)** | **12.9 MB** | **1004 KB** | **−92.2%** |
| Bytes a browser downloads (fallback path) | 12.9 MB | 1322 KB | −89.7% |
| Largest single image | 3663 KB | 149.5 KB | −95.9% |
| Headshot | 1355 KB | 47.1 KB | −96.5% |

The "before" figure counts only the 14 referenced images (12.9 MB); the 11 orphans add another
1.1 MB that was tracked but never served.

### Per file

Sizes are the WebP the browser actually downloads. All dimensions preserve the source aspect
ratio.

| Image | Before | WebP | JPEG fallback | Dimensions | Saved |
| --- | ---: | ---: | ---: | --- | ---: |
| `wedding.png` | 3662.8 KB | **142.8 KB** | 147.4 KB | 1632×887 → 1400×761 | 96.1% |
| `ps.png` | 1864.9 KB | **107.7 KB** | 137.9 KB | 1812×918 → 1400×709 | 94.2% |
| `photo.png` (headshot) | 1355.0 KB | **47.1 KB** | 73.0 KB | 1024×1536 → 800×1200 | 96.5% |
| `presentrentals.png` | 1181.7 KB | **33.9 KB** | 60.8 KB | 1539×867 → 1400×789 | 97.1% |
| `lightglo.png` | 1150.2 KB | **46.5 KB** | 82.4 KB | 1813×937 → 1400×724 | 96.0% |
| `basix.png` | 1124.3 KB | **74.3 KB** | 110.4 KB | 1546×721 → 1400×653 | 93.4% |
| `cvlinens.png` | 743.6 KB | **140.1 KB** | 143.2 KB | 1280×900 (unchanged) | 81.2% |
| `linguista.png` | 735.7 KB | **52.4 KB** | 72.8 KB | 1705×825 → 1400×677 | 92.9% |
| `gem.jpg` | 432.3 KB | **129.2 KB** | 149.5 KB | 1788×908 → 1400×711 | 70.1% |
| `building-controls.jpg` | 245.3 KB | **78.0 KB** | 118.0 KB | 1915×944 → 1400×690 | 68.2% |
| `solitudelabs.jpg` | 156.5 KB | **51.9 KB** | 82.3 KB | 1648×911 → 1400×774 | 66.8% |
| `domain.png` | 109.0 KB | **21.8 KB** | 32.7 KB | 1110×402 (unchanged) | 80.0% |
| `dashboard-app.png` | 106.1 KB | **53.3 KB** | 77.5 KB | 1300×887 (unchanged) | 49.8% |
| `legal.png` | 50.8 KB | **25.2 KB** | 33.8 KB | 1004×532 (unchanged) | 50.4% |
| **Total** | **12918.2 KB** | **1004.3 KB** | 1321.6 KB | | **92.2%** |

Notes on the outliers:

- **`cvlinens.png` (81.2%)** is already below the 1400px ceiling at 1280×900, so it gets no
  resize win — the entire saving is format. It is also the densest screenshot in the set, which
  is why it lands closest to its budget.
- **`gem.jpg` (70.1%)** and the other `.jpg` sources were already lossy, so there was less
  slack. Re-encoding a JPEG applies loss a second time, which is why `gem` needed q78.
- **`dashboard-app.png` (49.8%)** and **`legal.png` (50.4%)** were small to begin with and stay
  at native resolution. Halving them is a fine result for files already under 110 KB.

### A third file per image

Each source emits up to three files. Only one is ever downloaded:

- `<name>.webp` — what modern browsers get. This is the number that matters.
- `<name>.jpg` — the `<picture>` fallback.
- `<name>.png` — **legacy compatibility only.** `copy.json` still names these files with a
  `.png` extension, so this exists purely so a reference that has not been migrated does not
  404. Because a palette PNG of a photograph cannot reach the byte budget at full width without
  visible banding, these trade *resolution* for size — they are downscaled (e.g. `photo.png` at
  460px wide) rather than colour-crushed. They are soft on a 2x display, which is the correct
  tradeoff for a file that should never be fetched. **Once the markup uses `<picture>`, delete
  the compat PNG generation block from the script and the files with it.**
