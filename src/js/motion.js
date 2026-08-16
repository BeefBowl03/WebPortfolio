/**
 * Single source of truth for motion preference.
 *
 * The design system requires a LIVE listener: a visitor flipping the OS setting
 * must not have to reload. Every effect module subscribes here rather than
 * reading matchMedia itself, so there is exactly one place that decides.
 */

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribers = new Set();

function broadcast() {
  applyScrollBehavior();
  for (const fn of subscribers) {
    try { fn(mq.matches); } catch (err) { console.error(err); }
  }
}

function applyScrollBehavior() {
  // §5.4 — smooth scrolling only when motion is welcome.
  document.documentElement.style.scrollBehavior = mq.matches ? 'auto' : 'smooth';
}

if (typeof mq.addEventListener === 'function') {
  mq.addEventListener('change', broadcast);
} else if (typeof mq.addListener === 'function') {
  mq.addListener(broadcast); // Safari < 14
}

applyScrollBehavior();

/** @returns {boolean} true when the user has asked for reduced motion. */
export const prefersReduced = () => mq.matches;

/**
 * Subscribe to preference changes.
 * @param {(reduced: boolean) => void} fn
 * @returns {() => void} unsubscribe
 */
export function onMotionChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
