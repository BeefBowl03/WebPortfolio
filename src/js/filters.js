/**
 * Project filter bar — progressive enhancement.
 *
 * With JavaScript off the bar is hidden by CSS (`html.js .filters`) and every
 * card renders, so nothing is gated behind script. With JavaScript on, the
 * buttons are `aria-pressed` toggles inside a named `role="group"`, and each
 * change is announced through a visually-hidden `aria-live` region.
 *
 * Cards animate out (`opacity` + `scale`) and are only removed from layout
 * after the transition, so the grid does not snap.
 */

import { prefersReduced } from './motion.js';

export function initFilters() {
  const bar = document.getElementById('project-filters');
  const grid = document.getElementById('project-grid');
  const status = document.getElementById('filter-status');
  if (!bar || !grid) return;

  const buttons = [...bar.querySelectorAll('[data-filter]')];
  const cells = [...grid.querySelectorAll('[data-cat]')];
  if (!buttons.length || !cells.length) return;

  const total = cells.length;

  /* A filtered-out cell fades for ~200ms BEFORE it leaves layout, and it holds
   * two real links. Marking it `aria-hidden` alone left focusable content
   * inside a hidden subtree for that whole window (WCAG 4.1.2) — and a fast
   * Tab could land on an invisible card. `inert` removes it from the
   * accessibility tree AND the tab order in one go, so the two can never
   * disagree; aria-hidden is kept only as a fallback where inert is missing. */
  const INERT_SUPPORTED = 'inert' in HTMLElement.prototype;

  const setHiddenFromAT = (cell, state) => {
    if (INERT_SUPPORTED) cell.inert = state;
    if (state) cell.setAttribute('aria-hidden', 'true');
    else cell.removeAttribute('aria-hidden');
  };

  const show = (cell) => {
    cell.classList.remove('is-hidden');
    // Reflow so the fade-in has a start frame.
    void cell.offsetWidth;
    cell.classList.remove('is-hiding');
    setHiddenFromAT(cell, false);
  };

  const hide = (cell) => {
    setHiddenFromAT(cell, true);
    if (prefersReduced()) {
      cell.classList.add('is-hiding', 'is-hidden');
      return;
    }
    cell.classList.add('is-hiding');
    const done = (e) => {
      if (e.target !== cell) return;
      // No removeEventListener needed — registered with { once: true }.
      if (cell.classList.contains('is-hiding')) cell.classList.add('is-hidden');
    };
    cell.addEventListener('transitionend', done, { once: true });
    // transitionend does not fire if the element is already at the end state.
    setTimeout(() => {
      if (cell.classList.contains('is-hiding')) cell.classList.add('is-hidden');
    }, 260);
  };

  function apply(filter, label) {
    let shown = 0;
    for (const cell of cells) {
      const match = filter === 'all' || cell.dataset.cat === filter;
      if (match) { show(cell); shown++; } else { hide(cell); }
    }

    for (const b of buttons) {
      b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
    }

    if (status) {
      status.textContent =
        filter === 'all'
          ? `Showing all ${total} projects.`
          : `Showing ${shown} of ${total} projects in ${label}.`;
    }
  }

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn || !bar.contains(btn)) return;
    const label = btn.textContent.replace(/\(\d+\)/, '').trim();
    apply(btn.dataset.filter, label);
  });

  // Only now — with the handler attached — is the bar allowed to appear.
  document.documentElement.classList.add('filters-on');
}
