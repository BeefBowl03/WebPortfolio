/**
 * Header behaviour: condense-on-scroll, scroll-progress rail, section
 * scroll-spy, and a real working mobile navigation panel.
 *
 * The old site's hamburger was a button with no menu behind it. This one is
 * the full contract from the design system §6.0: opaque full-viewport panel,
 * focus trap, Esc to close, scroll lock with position restore, `inert` on the
 * background, and an automatic close when the viewport reaches ≥768px.
 */

import { prefersReduced, onMotionChange } from './motion.js';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ── condense + progress rail ─────────────────────────────────────────── */

function initScrollChrome() {
  const header = document.getElementById('site-header');
  const rail = document.getElementById('progress-rail');
  if (!header) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    header.classList.toggle('is-condensed', window.scrollY > 24);

    if (rail && !prefersReduced()) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      rail.style.transform = `scaleX(${frac})`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  onMotionChange((reduced) => {
    if (rail) rail.style.transform = reduced ? '' : rail.style.transform;
    update();
  });

  update();
}

/* ── scroll-spy ───────────────────────────────────────────────────────── */

function initScrollSpy() {
  const links = [...document.querySelectorAll('[data-navlink]')];
  if (!links.length || !('IntersectionObserver' in window)) return;

  const ids = [...new Set(links.map((a) => a.dataset.navlink))].filter(Boolean);
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const visible = new Set();

  const setActive = (id) => {
    for (const a of links) {
      if (a.dataset.navlink === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      // rootMargin makes at most one section qualify; if several do, take the
      // first in document order so the highlight never flickers.
      const active = sections.find((s) => visible.has(s.id));
      setActive(active ? active.id : null);
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );

  sections.forEach((s) => io.observe(s));
}

/* ── mobile panel ─────────────────────────────────────────────────────── */

function initMobileMenu() {
  const panel = document.getElementById('site-menu');
  const trigger = document.getElementById('menu-trigger');
  const closeBtn = document.getElementById('menu-close');
  const main = document.getElementById('main');
  const footer = document.querySelector('.site-footer');
  const header = document.getElementById('site-header');
  if (!panel || !trigger) return;

  const desktop = window.matchMedia('(min-width: 768px)');
  let open = false;
  let scrollY = 0;
  let lastFocused = null;
  let closeTimer = 0;

  /* The panel is an opaque full-viewport overlay, so EVERYTHING behind it has
   * to leave the accessibility tree — including the header. §6.0 only names
   * <main> and <footer>, but the header sits at z-index 100 under a z-index
   * 200 panel: leaving it live meant a screen-reader user could still swipe to
   * the wordmark and the "Start a project" CTA hidden behind the overlay. */
  const backgrounds = [main, footer, header].filter(Boolean);

  const setBackgroundInert = (state) => {
    for (const el of backgrounds) {
      const canInert = 'inert' in el;
      if (canInert) el.inert = state;
      // Only needed where `inert` is unsupported — doubling up is harmless but
      // aria-hidden is the weaker of the two and must never be the only guard.
      if (state) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    }
  };

  function openMenu() {
    if (open) return;
    open = true;
    clearTimeout(closeTimer);

    lastFocused = document.activeElement;
    scrollY = window.scrollY;

    panel.hidden = false;
    // Force a reflow so the opacity transition has a start frame to run from.
    void panel.offsetWidth;
    panel.classList.add('is-open');

    trigger.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';

    /* Focus moves into the panel BEFORE the background goes inert (§6.0: the
     * first link, not the close button). The trigger that was just activated
     * lives inside the header, which is one of the containers about to be
     * inerted — inerting first would blur it to <body> for a frame. */
    const first = panel.querySelector('.mnav__link') || panel.querySelector(FOCUSABLE);
    if (first) first.focus();

    setBackgroundInert(true);
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!open) return;
    open = false;

    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    setBackgroundInert(false);

    document.documentElement.style.overflow = '';
    // Restoring overflow can nudge the scroll position on iOS.
    window.scrollTo(0, scrollY);

    if (restoreFocus && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }

    const delay = prefersReduced() ? 0 : 200; // --d-fast
    closeTimer = setTimeout(() => {
      if (!open) panel.hidden = true;
    }, delay);
  }

  trigger.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  if (closeBtn) closeBtn.addEventListener('click', () => closeMenu());

  // Clicking a link closes the panel first, then lets the navigation run.
  panel.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    // In-page links move focus themselves via the fragment, so dropping focus
    // is correct there. External links (GitHub / LinkedIn / WhatsApp) open in a
    // new tab and leave THIS document focused — without restoring, `hidden`
    // lands on the focused element and focus resets to <body>, stranding
    // keyboard users at the top of the page (WCAG 2.4.3).
    const isInPage = link.getAttribute('href').startsWith('#');
    closeMenu({ restoreFocus: !isInPage });
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key !== 'Tab') return;

    // Focus trap.
    const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!panel.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Auto-close when the viewport crosses to >= 768px (§6.0).
   *
   * The naive version closed with `restoreFocus: false`, which dropped keyboard
   * focus onto <body> — verified in-browser: rotate a tablet with the menu open
   * and Tab restarts from the top of the document (WCAG 2.4.3). Focus has to
   * land somewhere sensible instead. The trigger is still rendered from 768px
   * to 1023px, so it is the natural home; from 1024px it is display:none and
   * unfocusable, and the real nav has appeared, so the first nav link is. */
  const rehomeFocusAfterAutoClose = () => {
    const visible = (el) => el && el.offsetParent !== null;
    const target =
      (visible(trigger) && trigger) ||
      [...document.querySelectorAll('.nav__link')].find(visible) ||
      main;
    if (!target) return;
    if (target === main) target.setAttribute('tabindex', '-1');
    target.focus();
  };

  const onBreakpoint = (e) => {
    if (!e.matches) return;
    const hadFocus = panel.contains(document.activeElement);
    closeMenu({ restoreFocus: false });
    if (hadFocus) rehomeFocusAfterAutoClose();
  };
  if (typeof desktop.addEventListener === 'function') desktop.addEventListener('change', onBreakpoint);
  else if (typeof desktop.addListener === 'function') desktop.addListener(onBreakpoint);
}

export function initNav() {
  initScrollChrome();
  initScrollSpy();
  initMobileMenu();
}
