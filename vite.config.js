import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// vite.config.js is bundled into node_modules/.vite-temp/ before it runs, so a
// relative specifier here resolves against THAT directory, not the repo root.
// An absolute file:// URL is the only form that works — and on Windows a bare
// absolute path fails too, hence pathToFileURL.
const CONTENT_MODULE = pathToFileURL(resolve(process.cwd(), 'src/build/content.js')).href;

/**
 * Templates index.html against content/copy.json at BUILD time.
 *
 * All copy lives in content/copy.json; index.html holds only structure and
 * {{tokens}}. Because substitution happens at build time the shipped HTML is
 * fully static — every project, paragraph and form field is present with
 * JavaScript disabled.
 */
function copyTemplate() {
  let resolvedBase = '/';
  return {
    name: 'portfolio-copy-template',
    enforce: 'pre',
    configResolved(config) { resolvedBase = config.base; },
    async transformIndexHtml(html) {
      // Imported lazily and cache-busted so `npm run dev` picks up copy edits.
      const mod = await import(`${CONTENT_MODULE}?t=${Date.now()}`);
      // NOTE: every transformIndexHtml hook — 'pre' included — runs AFTER
      // Vite has already rewritten the asset URLs it found in index.html. The
      // markup we inject here is therefore never base-prefixed for us, so the
      // renderer has to do it. Hand it the resolved base.
      return mod.applyTokens(html, resolvedBase);
    },
    configureServer(server) {
      for (const f of ['content/copy.json', 'docs/asset-map.json']) {
        server.watcher.add(resolve(process.cwd(), f));
      }
      server.watcher.on('change', (file) => {
        if (/copy\.json|asset-map\.json/.test(file)) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

/**
 * Injects a <link rel="preload"> for the Archivo variable latin woff2 that the
 * bundler actually emitted (the filename is content-hashed, so it can't be
 * written by hand). Silently no-ops if the asset is not found.
 */
function preloadDisplayFont() {
  return {
    name: 'portfolio-preload-font',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const file = Object.keys(ctx?.bundle || {}).find((f) =>
        /archivo-latin-wdth-normal.*\.woff2$/.test(f)
      );
      if (!file) return html;
      const href = `/WebPortfolio/${file}`;
      return html.replace(
        '</head>',
        `  <link rel="preload" as="font" type="font/woff2" crossorigin href="${href}">\n  </head>`
      );
    },
  };
}

// The site is served from a SUBPATH on GitHub Pages:
//   https://beefbowl03.github.io/WebPortfolio/
// `base` must match that subpath (with leading AND trailing slash) so that every
// emitted asset URL is prefixed correctly in the production build.
//
// In dev (`npm run dev`) Vite also serves under /WebPortfolio/, which keeps local
// and production URLs identical -- no "works locally, 404s in prod" surprises.
export default defineConfig({
  base: '/WebPortfolio/',

  plugins: [copyTemplate(), preloadDisplayFont()],

  // Static assets live in `public/` and are copied verbatim into `dist/` at build
  // time (no hashing, no transformation). See README for the reference convention.
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    // Keep the bundle honest: warn early if a chunk balloons.
    chunkSizeWarningLimit: 500,
  },

  server: {
    port: 5173,
    open: '/WebPortfolio/',
  },

  preview: {
    port: 4173,
  },
});
