# WebPortfolio

Personal portfolio site. Static site built with [Vite](https://vite.dev) and
[Tailwind CSS](https://tailwindcss.com), deployed to GitHub Pages at
**https://beefbowl03.github.io/WebPortfolio/**

---

## ⚠️ Required one-time manual step

**This repo has been migrated from "deploy from a branch" to a GitHub Actions
build. Until the Pages source is switched over in repo settings, the workflow
will fail and the live site will keep serving the old unbuilt files.**

Do this once, in the browser:

1. Go to **Settings → Pages** in the GitHub repo.
2. Under **Build and deployment → Source**, change
   **"Deploy from a branch"** → **"GitHub Actions"**.
3. Save. Then re-run the latest workflow from the **Actions** tab (or push any
   commit to `master`).

No other setting needs to change. There is no `gh-pages` branch and none is
created — the built `dist/` is uploaded directly as a Pages artifact.

---

## Local development

```bash
npm install     # first time only
npm run dev     # dev server with hot module replacement
npm run build   # production build into dist/
npm run preview # serve the built dist/ locally, exactly as production
```

The dev server runs at **http://localhost:5173/WebPortfolio/** and `preview` at
**http://localhost:4173/WebPortfolio/**.

Note the `/WebPortfolio/` path in both. That is deliberate: GitHub Pages serves
this site from a subpath, not from a domain root, so `base` is set to
`/WebPortfolio/` in `vite.config.js`. Keeping dev and prod on the same subpath
means a link or asset that works locally also works in production.

Requires Node **20.19+** or **22.12+** (Vite 8's engine requirement). CI uses Node 22.

---

## Project structure

```
index.html              Page markup. Must include the module script (see below).
src/
  main.js               JS entry point. Imports the stylesheet.
  styles/main.css       Tailwind directives + the :root design-token block.
public/
  images/               All image assets. Copied verbatim into dist/.
docs/
  asset-map.json        Old filename -> new filename mapping (see below).
  design-system.md      Design tokens and visual language.
content/
  copy.json             Site copy.
vite.config.js          Build config; owns the /WebPortfolio/ base path.
tailwind.config.js      Tailwind content globs and theme extensions.
dist/                   Build output. Generated, git-ignored, never edited.
```

### `index.html` must reference the entry script

For the stylesheet and JS to be bundled at all, `index.html` needs:

```html
<script type="module" src="/src/main.js"></script>
```

Without it Vite emits the HTML but no CSS — the page ships unstyled. Do not add
a `<link>` to `src/styles/main.css` directly; the import in `main.js` is what
routes it through PostCSS and Tailwind.

---

## Asset path convention

All images live in **`public/images/`**. Files in `public/` are copied into
`dist/` byte-for-byte with their names intact — no hashing, no transformation —
so paths stay stable and predictable.

**In HTML, reference them root-relative with a leading slash and no base prefix:**

```html
<img src="/images/herobanner.png" alt="…">
```

Vite rewrites that to `/WebPortfolio/images/herobanner.png` at build time.
Write the leading slash; do **not** hardcode `/WebPortfolio/` yourself, or you
will get `/WebPortfolio/WebPortfolio/…` in production.

**In JavaScript**, the rewrite does not happen automatically. Build the URL from
the base:

```js
const src = `${import.meta.env.BASE_URL}images/herobanner.png`;
```

(`BASE_URL` already ends in a slash, so no extra one before `images`.)

**In CSS**, relative URLs from `src/styles/` resolve normally:

```css
background-image: url('/images/herobanner.png');
```

### Why not `src/assets/`?

Assets in `src/assets/` get content-hashed and inlined by the bundler, which is
better for cache-busting but requires every reference to be a JS `import` or a
path Vite can statically analyze. For a portfolio whose images are referenced
from hand-written markup and a JSON copy file, stable predictable filenames in
`public/` are the far less fragile choice.

### Renamed files — read this before wiring up markup

The images used to sit in the repo root with names that break a build pipeline:
one contained a **space** (`dashboard app.PNG`) and many used an **uppercase
`.PNG`** extension. Uppercase extensions are especially dangerous here — they
resolve fine on a case-insensitive Windows dev machine but **404 on GitHub
Pages**, which serves from a case-sensitive filesystem.

Every file was moved with `git mv` (history preserved) into `public/images/`
and normalized to lowercase kebab-case.

**`docs/asset-map.json` holds the complete old → new mapping.** Use it to
translate any image reference in `content/copy.json` or the legacy `index.html`
onto the new names.

Two traps recorded there, worth repeating:

- `linguista.png` (was `linguista.PNG`) and `linguista.jpeg` are **two different
  images**.
- `lightglo.png` (was `lightglo.PNG`) and `light-glo.jpeg` are **two different
  images**.

---

## Styling and design tokens

`src/styles/main.css` contains the three Tailwind directives followed by an
intentionally empty `:root` block. The design system's CSS custom properties get
pasted there; anything that should also be available as a Tailwind utility gets
mirrored into `theme.extend` in `tailwind.config.js`.

Tailwind purges any class it does not find in the `content` globs
(`index.html`, `./*.html`, `src/**/*.{js,ts,html}`). If markup ever moves into a
file outside those globs, extend the globs or the styles will vanish from the
production build while still working in dev.

---

## How deployment works

`.github/workflows/deploy.yml` runs on every push to `master` (and on manual
dispatch from the Actions tab):

1. **build job** — checks out, installs Node 22, runs `npm ci` then
   `npm run build`, and uploads `dist/` as a Pages artifact.
2. **deploy job** — publishes that artifact to the `github-pages` environment.

Details worth knowing:

- The workflow uses `npm ci`, which requires **`package-lock.json` to be
  committed**. If the lockfile is missing or out of sync with `package.json`,
  the build fails. Commit the lockfile alongside any dependency change.
- Permissions are least-privilege: `contents: read`, `pages: write`,
  `id-token: write`. The OIDC token (`id-token`) is what `deploy-pages`
  exchanges for deploy credentials — without it the deploy step fails.
- A `concurrency: pages` group with `cancel-in-progress: false` means only one
  deployment runs at a time and in-flight runs finish rather than being killed,
  so a partially uploaded artifact never becomes the live site.
- `dist/` is git-ignored. Never commit it — it is rebuilt on every push.

### Rollback

Re-run a previous successful workflow from the **Actions** tab, or revert the
offending commit and push. Each run deploys a complete artifact, so any green run
in the history is a working site.

---

## Note on `.gitignore`

The ignore file deliberately contains **no image globs** (`*.png`, `*.jpg`, …).
The site's real assets are images; a blanket image ignore would silently drop
them from the build and produce a live site full of broken pictures. If a
screenshot ever needs excluding, ignore it by exact path.
