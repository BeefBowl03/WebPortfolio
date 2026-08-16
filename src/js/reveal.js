/**
 * Scroll reveal (§5.3 `rise` / `rule-draw`) and the hero `wipe`.
 *
 * THE BUG THIS AVOIDS
 * -------------------
 * The old site left every animated element at `opacity: 0` until it scrolled
 * into view. Anything the observer never reached stayed invisible — in
 * full-page screenshots, for deep links, for find-in-page, and for anyone whose
 * JS failed. So:
 *
 *   1. Content is visible by default. The CSS pre-state is gated behind
 *      `html.reveal-on`, a class this module adds only AFTER the observer has
 *      been constructed and every target handed to it.
 *   2. If IntersectionObserver is missing, the class is never added and the
 *      page simply renders finished.
 *   3. Focus, hash navigation and printing force-reveal, so keyboard users,
 *      deep links and PDF exports never meet a blank section.
 */

import { prefersReduced, onMotionChange } from './motion.js';

export function initReveal() {
  const root = document.documentElement;
  const targets = [...document.querySelectorAll('[data-reveal], [data-rule]')];

  const revealAll = () => {
    for (const el of targets) el.classList.add('is-in');
  };

  if (!('IntersectionObserver' in window) || !targets.length) {
    revealAll();
    return;
  }

  // Stagger within a group, capped at 6 steps.
  const groups = new Map();
  for (const el of targets) {
    if (el.style.getPropertyValue('--reveal-i')) continue;
    const parent = el.parentElement;
    const n = groups.get(parent) || 0;
    groups.set(parent, n + 1);
    el.style.setProperty('--reveal-i', String(Math.min(n, 5)));
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target); // fires once
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach((el) => io.observe(el));

  // Only now is it safe to hide anything.
  root.classList.add('reveal-on');

  /* ── escape hatches: nothing is ever *permanently* hidden ───────────── */

  /* THE IMPORTANT ONE.
   * An IntersectionObserver only fires for what actually enters the viewport,
   * so on a page nobody scrolls — a full-page screenshot, a crawler, a print
   * to PDF, a reader who deep-links and never moves — every below-the-fold
   * block stays at opacity 0 and the page looks empty. That is precisely the
   * bug the old site shipped.
   *
   * So: if no scroll has happened at all within 2.5s, assume nothing is
   * driving the page and render everything finished. The first real scroll
   * cancels the failsafe, because a scrolling visitor proves the observer is
   * doing its job and should get the progressive reveal. */
  let failsafe = setTimeout(revealAll, 2500);
  window.addEventListener(
    'scroll',
    () => { clearTimeout(failsafe); },
    { once: true, passive: true }
  );

  // Keyboard focus landing inside an unrevealed block.
  document.addEventListener(
    'focusin',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-reveal]') : null;
      if (el) el.classList.add('is-in');
    },
    true
  );

  // Deep links and in-page anchors.
  const revealHashTarget = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const section = document.getElementById(id);
    if (!section) return;
    section.querySelectorAll('[data-reveal], [data-rule]').forEach((el) => el.classList.add('is-in'));
  };
  window.addEventListener('hashchange', revealHashTarget);
  revealHashTarget();

  // Print / PDF export must never lose content.
  window.addEventListener('beforeprint', revealAll);
  if (window.matchMedia) {
    const printMq = window.matchMedia('print');
    if (typeof printMq.addEventListener === 'function') {
      printMq.addEventListener('change', (e) => { if (e.matches) revealAll(); });
    }
  }

  // A user turning reduced motion on mid-session should not sit staring at a
  // block that is still waiting for its transition.
  onMotionChange(() => {
    if (prefersReduced()) return; // CSS handles the opacity-only branch
  });
}

/* ── hero wipe ────────────────────────────────────────────────────────── */

export function initHeroWipe() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const arm = () => {
    if (prefersReduced()) {
      hero.classList.add('is-in');
      return;
    }
    document.documentElement.classList.add('wipe-on');
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
  };

  // Wait for fonts so the clip mask does not run against fallback metrics.
  if (document.fonts && document.fonts.ready) {
    // Never let a font that fails to load strand the headline behind a mask —
    // the class that hides it is only added inside `arm()`.
    Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 1200)),
    ]).then(arm);
  } else {
    arm();
  }
}

/* ── count-up (§5.3) ──────────────────────────────────────────────────── */

export function initCountUp() {
  const nodes = [...document.querySelectorAll('[data-count-to]')];
  if (!nodes.length) return;

  const write = (el, value) => {
    el.textContent = `${value}${el.dataset.countSuffix || ''}`;
  };

  if (prefersReduced() || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => write(el, el.dataset.countTo)); // final value immediately
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        run(e.target);
      }
    },
    { threshold: 0.4 }
  );

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function run(el) {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target)) return;
    const duration = 1200;
    const t0 = performance.now();

    const step = (now) => {
      if (prefersReduced()) { write(el, target); return; }
      const t = Math.min(1, (now - t0) / duration);
      write(el, Math.round(easeOutExpo(t) * target));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  nodes.forEach((el) => io.observe(el));
}
