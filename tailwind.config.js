/** @type {import('tailwindcss').Config} */

/* Every value below is lifted verbatim from docs/design-system.md. The CSS
 * custom properties are the single source of truth (src/styles/tokens.css);
 * this file only surfaces them as utilities so markup can reach them.        */
export default {
  content: [
    './index.html',
    // src/build/content.js composes markup at build time — its class names must
    // be scanned here or they get purged out of the production stylesheet.
    './src/**/*.{js,ts,html}',
  ],
  // NOTE: `./*.html` is deliberately NOT globbed. index_backup.html is the old
  // pre-revamp page; scanning it would pull dead utilities into the bundle.
  theme: {
    /* §4.2 — breakpoints are a full replacement, not an extension. */
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      /* §2.1 Colour tokens */
      colors: {
        bg: 'var(--c-bg)',
        'bg-deep': 'var(--c-bg-deep)',
        'surface-1': 'var(--c-surface-1)',
        'surface-2': 'var(--c-surface-2)',
        line: 'var(--c-border)',
        'line-strong': 'var(--c-border-strong)',
        text: 'var(--c-text)',
        'text-2': 'var(--c-text-2)',
        'text-muted': 'var(--c-text-muted)',
        accent: 'var(--c-accent)',
        'accent-dim': 'var(--c-accent-dim)',
        accent2: 'var(--c-accent-2)',
        'accent2-deep': 'var(--c-accent-2-deep)',
        bone: 'var(--c-bone)',
        'bone-2': 'var(--c-bone-2)',
        'bone-border': 'var(--c-bone-border)',
        ink: 'var(--c-ink)',
        'ink-2': 'var(--c-ink-2)',
      },

      /* §3.1 Families */
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },

      /* §3.2 Type scale — [size, {lineHeight, letterSpacing}] */
      fontSize: {
        d1: ['clamp(3.5rem, 1rem + 11.111vw, 11rem)', { lineHeight: '0.86', letterSpacing: '-0.035em' }],
        d2: ['clamp(2.5rem, 1.333rem + 5.185vw, 6rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        d3: ['clamp(2rem, 1.583rem + 1.852vw, 3.25rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        h3: ['clamp(1.375rem, 1.25rem + 0.556vw, 1.75rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        lead: ['clamp(1.125rem, 1rem + 0.556vw, 1.5rem)', { lineHeight: '1.45', letterSpacing: '-0.01em' }],
        body: ['clamp(1rem, 0.958rem + 0.185vw, 1.125rem)', { lineHeight: '1.6', letterSpacing: '0' }],
        sm: ['0.875rem', { lineHeight: '1.55', letterSpacing: '0' }],
        mono: ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        index: ['clamp(0.875rem, 0.8rem + 0.33vw, 1.125rem)', { lineHeight: '1', letterSpacing: '0.04em' }],
      },

      /* §4.1 Spacing scale (4px base). Tailwind's numeric keys already map
       * 1:1 onto these; the named aliases exist so the intent is readable. */
      spacing: {
        s1: '4px', s2: '8px', s3: '12px', s4: '16px', s5: '24px',
        s6: '32px', s7: '40px', s8: '48px', s9: '64px', s10: '80px',
        s11: '112px', s12: '160px', s13: '224px',
        section: 'clamp(80px, 5rem + 5vw, 160px)',
        'section-lg': 'clamp(96px, 6rem + 6vw, 224px)',
        gutter: 'clamp(20px, 4vw, 56px)',
      },

      /* §4.3 Radii — the entire scale. */
      borderRadius: {
        xs: '2px',
        sm: '4px',
        pill: '999px',
      },

      /* §4.4 Elevation — hard offsets, zero blur. */
      boxShadow: {
        'offset-sm': '4px 4px 0 0 var(--c-accent)',
        'offset-md': '8px 8px 0 0 var(--c-accent)',
        'offset-lg': '12px 12px 0 0 var(--c-accent)',
        'offset-alt': '8px 8px 0 0 var(--c-accent-2)',
        paper: '0 2px 0 0 var(--c-bone-border), 0 12px 24px -12px rgb(16 16 18 / 0.18)',
      },

      /* §5.1 Motion */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.30, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.50, 1)',
        'in-out-manifest': 'cubic-bezier(0.65, 0, 0.35, 1)',
        overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        instant: '120ms',
        fast: '200ms',
        base: '320ms',
        slow: '560ms',
        reveal: '900ms',
      },

      maxWidth: {
        container: '1320px',
        measure: '68ch',
        'measure-lead': '46ch',
        'measure-display': '14ch',
        'measure-desc': '52ch',
      },

      zIndex: {
        nav: '100',
        menu: '200',
        skip: '300',
      },
    },
  },
  plugins: [],
};
