/**
 * Application entry point.
 *
 * index.html references this file (`<script type="module" src="/src/main.js">`),
 * which is what routes the stylesheet through PostCSS + Tailwind. Without the
 * import below the build ships no CSS at all.
 *
 * Everything here is vanilla JS with zero runtime dependencies — no CDN
 * scripts, no icon library, no animation library. Every module is defensive:
 * a failure in one must not take the rest of the page down with it, and no
 * module may leave content hidden if it does not run.
 */

import './styles/main.css';

import { initNav } from './js/nav.js';
import { initHeroCanvas } from './js/hero-canvas.js';
import { initReveal, initHeroWipe, initCountUp } from './js/reveal.js';
import { initFilters } from './js/filters.js';
import { initForm } from './js/form.js';

/** Run an initialiser in isolation — one throwing module must not stop the rest. */
function safely(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[init:${name}]`, err);
  }
}

function boot() {
  safely('nav', initNav);
  safely('reveal', initReveal);
  safely('hero-wipe', initHeroWipe);
  safely('count-up', initCountUp);
  safely('hero-canvas', initHeroCanvas);
  safely('filters', initFilters);
  safely('form', initForm);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
