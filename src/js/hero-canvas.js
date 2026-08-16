/**
 * Hero background — "transaction tape" (design system §5.2).
 *
 * A single Canvas 2D element. No WebGL, no library. A grid of ticks with a
 * diagonal luminance sweep passing over it and a handful of vermilion packets
 * running along grid lines — orders in transit.
 *
 * Performance contract, all enforced below:
 *   dpr capped at 2 · 30fps · debounced resize · paused when off-screen or the
 *   tab is hidden · lighter scene under 640px · torn down under reduced motion.
 *
 * If any of this fails to start, the CSS gradient painted on `.hero` itself is
 * already visible underneath — the canvas only ever covers it.
 */

import { prefersReduced, onMotionChange } from './motion.js';

const TICK = 'rgb(58, 58, 68)';
const ACCENT = [216, 255, 61];   // --c-accent
const ACCENT_2 = '#FF5A1F';      // --c-accent-2
const GROUND = '#060607';        // --c-bg-deep
const FRAME_MS = 1000 / 30;
const SWEEP_MS = 9000;
const MAX_CELLS = 1600;
const PACKET_MS = 80;

export function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const hero = document.querySelector('[data-hero]');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return; // fallback gradient is already painted

  let raf = 0;
  let running = false;
  let onScreen = true;
  let started = false;

  let cols = 0, rows = 0, pitch = 28, w = 0, h = 0;
  let packets = [];
  let last = 0;
  let elapsed = 0;

  /* ── sizing ─────────────────────────────────────────────────────────── */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    pitch = w < 640 ? 40 : 28;
    cols = Math.ceil(w / pitch) + 1;
    rows = Math.ceil(h / pitch) + 1;

    // Clip the grid rather than densifying it on very large screens.
    while (cols * rows > MAX_CELLS) {
      if (cols >= rows) cols--; else rows--;
    }

    const count = w < 640 ? 2 : 4;
    packets = Array.from({ length: count }, spawnPacket);
  }

  function spawnPacket() {
    const horizontal = Math.random() < 0.5;
    return {
      horizontal,
      line: Math.floor(Math.random() * (horizontal ? rows : cols)),
      pos: -3 - Math.floor(Math.random() * 12),
      acc: 0,
    };
  }

  /* ── frame ──────────────────────────────────────────────────────────── */
  function draw(dt) {
    elapsed = (elapsed + dt) % SWEEP_MS;

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    // Diagonal sweep band: a line travelling across the diagonal axis.
    const diag = w + h;
    const centre = (elapsed / SWEEP_MS) * (diag * 1.4) - diag * 0.2;
    const band = diag * 0.35;

    for (let y = 0; y < rows; y++) {
      const py = y * pitch;
      for (let x = 0; x < cols; x++) {
        const px = x * pitch;
        const d = Math.abs(px + py - centre);
        if (d < band) {
          const t = 1 - d / band;
          const r = Math.round(58 + (ACCENT[0] - 58) * t);
          const g = Math.round(58 + (ACCENT[1] - 58) * t);
          const b = Math.round(68 + (ACCENT[2] - 68) * t);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          ctx.fillStyle = TICK;
        }
        ctx.fillRect(px, py, 2, 2);
      }
    }

    // Packets: 3-cell dashes at 1 cell / 80ms.
    ctx.fillStyle = ACCENT_2;
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i];
      p.acc += dt;
      while (p.acc >= PACKET_MS) { p.acc -= PACKET_MS; p.pos++; }

      const limit = p.horizontal ? cols : rows;
      if (p.pos - 3 > limit) { packets[i] = spawnPacket(); continue; }

      for (let s = 0; s < 3; s++) {
        const c = p.pos - s;
        if (c < 0 || c > limit) continue;
        const px = p.horizontal ? c * pitch : p.line * pitch;
        const py = p.horizontal ? p.line * pitch : c * pitch;
        ctx.fillRect(px, py, 3, 3);
      }
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = now - last;
    if (dt < FRAME_MS) return;      // 30fps throttle via timestamp accumulator
    last = now;
    draw(Math.min(dt, 100));        // clamp after a background stall
  }

  /* ── lifecycle ──────────────────────────────────────────────────────── */
  function start() {
    if (running || prefersReduced() || !onScreen || document.visibilityState === 'hidden') return;
    if (!started) { resize(); started = true; }
    running = true;
    last = performance.now();
    canvas.style.opacity = '1';
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function teardown() {
    stop();
    started = false;
    // Reveal the CSS gradient underneath rather than a stale frozen frame.
    canvas.style.opacity = '0';
    ctx.clearRect(0, 0, w, h);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!started) return;
      resize();
    }, 200);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
    else start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start(); else stop();
      },
      { threshold: 0.1 }
    ).observe(hero);
  }

  onMotionChange((reduced) => {
    if (reduced) teardown();
    else start();
  });

  canvas.style.transition = 'opacity 200ms linear';
  canvas.style.opacity = '0';

  if (prefersReduced()) return; // never initialised; CSS fallback shows
  start();
}
