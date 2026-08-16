/**
 * BUILD-TIME CONTENT RENDERER
 * ---------------------------------------------------------------------------
 * This module is imported by `vite.config.js` only. It is NEVER shipped to the
 * client. It reads `content/copy.json` + `docs/asset-map.json` and produces a
 * flat token map that `index.html` is templated against at build time (and on
 * every dev-server request).
 *
 * Why build-time and not runtime JS:
 *   - every project, every paragraph, every form field must be in the shipped
 *     HTML so the page works with JavaScript disabled and is crawlable;
 *   - but no copy is hardcoded in the markup — `content/copy.json` stays the
 *     single source of truth and a copy edit needs no markup edit.
 *
 * Tailwind scans this file (`./src/**\/*.js` glob), so class names written in
 * these template literals survive the production purge.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const readJSON = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));

/* The canonical deployed origin — used for absolute og:/twitter: URLs and the
 * canonical link, which must be absolute to be valid. */
const SITE_URL = 'https://beefbowl03.github.io/WebPortfolio/';

/* ── The three client-confirmed featured case studies, in render order. ──── */
const FEATURED_ORDER = [
  ['building-controls', 'building controls'],
  ['cv-linens', 'cv linens'],
  ['basix-plastics', 'basix plastics'],
];

/* ── helpers ─────────────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const attr = esc;
const pad2 = (n) => String(n).padStart(2, '0');
const upper = (s) => String(s ?? '').toUpperCase();

/* ── image resolution ────────────────────────────────────────────────────── */

/**
 * copy.json still references the ORIGINAL filenames (spaces, uppercase .PNG).
 * `public/images/manifest.json` (written by scripts/optimize-images.mjs) is
 * keyed by exactly those legacy names, lowercased with spaces → hyphens, and
 * carries the WebP name, the JPEG fallback, and the intrinsic dimensions.
 *
 * `docs/asset-map.json` is consulted as a second chance for anything the
 * manifest does not know about. Anything that resolves to neither throws — a
 * silent 404 on a case-sensitive GitHub Pages filesystem is exactly the
 * failure this guards against.
 */
function buildImageResolver() {
  const manifest = readJSON('public/images/manifest.json').images || {};
  const assetMap = readJSON('docs/asset-map.json');

  const legacyToNew = new Map(assetMap.renames.map((r) => [r.old.toLowerCase(), r.new]));

  let onDisk = new Set();
  try {
    onDisk = new Set(readdirSync(resolve(ROOT, 'public/images')).map((f) => f.toLowerCase()));
  } catch {
    /* best effort — the manifest is the primary source */
  }

  /** 'dashboard app.PNG' -> 'dashboard-app.png' (the manifest key format). */
  const normalize = (name) => String(name).toLowerCase().replace(/\s+/g, '-');

  const exists = (f) => !onDisk.size || onDisk.has(String(f).toLowerCase());

  return function resolveImage(name, label) {
    if (!name) throw new Error(`[content] project "${label}" has no image`);

    let entry = manifest[normalize(name)];

    // Second chance: translate through the asset map, then retry the manifest.
    if (!entry) {
      const mapped = legacyToNew.get(String(name).toLowerCase());
      if (mapped) entry = manifest[normalize(mapped)];
      if (!entry && mapped && exists(mapped)) {
        entry = { fallback: mapped, webp: null, width: 1600, height: 1000 };
      }
    }

    if (!entry) {
      throw new Error(
        `[content] image "${name}" (project "${label}") is in neither ` +
          `public/images/manifest.json nor docs/asset-map.json`
      );
    }
    for (const f of [entry.webp, entry.fallback].filter(Boolean)) {
      if (!exists(f)) {
        throw new Error(`[content] "${f}" (project "${label}") is missing from public/images/`);
      }
    }

    return {
      webp: entry.webp ? `${BASE}images/${entry.webp}` : null,
      src: `${BASE}images/${entry.fallback}`,
      width: entry.width,
      height: entry.height,
    };
  };
}

/* Vite's own index.html asset rewriting runs BEFORE transformIndexHtml, so the
 * markup this module injects is never base-prefixed for us. Every generated
 * URL must therefore carry the base itself, or it 404s under /WebPortfolio/.
 * Set by applyTokens() from the resolved Vite config; always ends in "/". */
let BASE = '/';

/**
 * <picture> with a WebP source and a JPEG fallback.
 *
 * These URLs are root-relative and live in the HTML, so Vite's own index.html
 * asset rewriting prefixes them with the `/WebPortfolio/` base at build time
 * (the copyTemplate plugin is `enforce: 'pre'` precisely so this still runs
 * over the generated markup). No image URL is ever constructed in client JS,
 * where that rewrite would NOT happen.
 */
function picture(img, alt, { className, lazy = true, fetchPriority } = {}) {
  const source = img.webp
    ? `<source srcset="${attr(img.webp)}" type="image/webp">`
    : '';
  return (
    `<picture class="${attr(className ? `${className}-pic` : 'pic')}">${source}` +
    `<img class="${attr(className || '')}" src="${attr(img.src)}" alt="${attr(alt)}" ` +
    `width="${img.width}" height="${img.height}" ` +
    `${lazy ? 'loading="lazy" ' : ''}decoding="async"` +
    `${fetchPriority ? ` fetchpriority="${attr(fetchPriority)}"` : ''}>` +
    `</picture>`
  );
}

import { readdirSync } from 'node:fs';

/* ── inline icons (no icon library, no CDN) ──────────────────────────────── */

const ICON = {
  github: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.24 8.25h4.5V24H.24V8.25ZM8.02 8.25h4.31v2.15h.06c.6-1.13 2.07-2.33 4.26-2.33 4.56 0 5.4 3 5.4 6.9V24h-4.5v-7.93c0-1.89-.03-4.33-2.64-4.33-2.64 0-3.05 2.06-3.05 4.19V24h-4.5V8.25h.66Z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.04 2A9.94 9.94 0 0 0 2.1 11.95c0 1.75.46 3.46 1.34 4.97L2 22.5l5.72-1.5a9.9 9.9 0 0 0 4.32.99h.01a9.94 9.94 0 0 0 9.94-9.95A9.94 9.94 0 0 0 12.04 2Zm0 18.1h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.4.89.91-3.31-.2-.34a8.24 8.24 0 1 1 7.2 4.09Zm4.53-6.17c-.25-.13-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.17.25-.63.8-.78.96-.14.17-.28.19-.53.06a6.76 6.76 0 0 1-3.37-2.95c-.25-.43.25-.4.72-1.33.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42l-.47-.01c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.74 2.66 4.22 3.73 1.57.68 2.19.74 2.98.62.48-.07 1.47-.6 1.68-1.19.2-.58.2-1.08.14-1.18-.06-.11-.22-.17-.47-.3Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><rect x="2.5" y="4.5" width="19" height="15" rx="1"/><path d="m3 6 9 6.5L21 6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
};

const ARROW = `<span class="link-arrow__glyph" aria-hidden="true">↗</span>`;
const NEWTAB = `<span class="u-visually-hidden"> (opens in a new tab)</span>`;

/* ── section renderers ───────────────────────────────────────────────────── */

function renderHeadline(lines) {
  const safe = Array.isArray(lines) && lines.length ? lines : [''];
  return safe
    .map((raw, i) => {
      const isLast = i === safe.length - 1;
      let text = String(raw);
      let tail = '';
      // The design system puts the final full stop in vermilion.
      if (isLast && /[.!?]$/.test(text)) {
        tail = `<span class="hero__stop">${esc(text.slice(-1))}</span>`;
        text = text.slice(0, -1);
      }
      // Line 2 is the single lime word-group on the screen.
      const tone = i === 1 ? ' hero__line-text--accent' : '';
      return (
        `<span class="hero__line" style="--wipe-i:${i}">` +
        `<span class="hero__line-text${tone}">${esc(text)}${tail}</span>` +
        `</span>`
      );
    })
    .join('\n            ');
}

function renderNavLinks(links) {
  return links
    .map(
      (l, i) =>
        `<li class="nav__item">` +
        `<a class="nav__link" href="${attr(l.href)}" data-navlink="${attr(l.href.replace('#', ''))}">` +
        `<span class="nav__index" aria-hidden="true">${pad2(i + 1)}</span>` +
        `<span class="nav__label">${esc(l.label)}</span>` +
        `</a></li>`
    )
    .join('\n              ');
}

function renderMobileLinks(links) {
  return links
    .map(
      (l, i) =>
        `<li class="mnav__item" style="--cascade-i:${i}">` +
        `<a class="mnav__link" href="${attr(l.href)}" data-navlink="${attr(l.href.replace('#', ''))}">` +
        `<span class="mnav__index" aria-hidden="true">${pad2(i + 1)}</span>` +
        `<span class="mnav__label">${esc(l.label)}</span>` +
        `</a></li>`
    )
    .join('\n              ');
}

function renderMobileContact(contact) {
  const rows = [];
  for (const item of contact.details.items) {
    if (!item.href) continue;
    const ext = /^https?:/.test(item.href);
    rows.push(
      `<a class="mnav__meta-row" href="${attr(item.href)}"${
        ext ? ' target="_blank" rel="noopener noreferrer"' : ''
      }><span>${esc(upper(item.label))}</span><span>${esc(item.value)}${ext ? NEWTAB : ''}</span></a>`
    );
  }
  for (const s of contact.social.links) {
    if (s.platform === 'whatsapp') continue; // already in the ledger above
    rows.push(
      `<a class="mnav__meta-row" href="${attr(s.url)}" target="_blank" rel="noopener noreferrer">` +
        `<span>${esc(upper(s.label))}</span><span>Visit${ARROW}${NEWTAB}</span></a>`
    );
  }
  return rows.join('\n              ');
}

function renderHeroMeta(hero, contact) {
  const rows = [
    `<li class="hero__meta-item"><span class="dot-live" aria-hidden="true"></span>${esc(
      contact.availability
    )}</li>`,
  ];
  for (const s of hero.stats) {
    rows.push(`<li class="hero__meta-item">${esc(s.value)} ${esc(upper(s.label))}</li>`);
  }
  return rows.join('\n              ');
}

function renderTicker(skills) {
  const words = [
    'Shopify', 'WordPress', 'Liquid', 'React', 'TypeScript', 'Tailwind CSS',
    'United States', 'Australia', 'Belgium', 'South Africa',
  ];
  const track = words
    .map((w) => `<span class="ticker__item">${esc(upper(w))}</span><span class="ticker__sep">◆</span>`)
    .join('');
  // Duplicated track = seamless -50% marquee.
  return `<div class="ticker__track">${track}</div><div class="ticker__track">${track}</div>`;
}

function renderAboutParagraphs(paras) {
  return paras.map((p) => `<p class="prose-bone">${esc(p)}</p>`).join('\n            ');
}

function renderAboutStats(stats) {
  return stats
    .map((s) => {
      const numeric = /^\d+$/.test(String(s.value).replace(/\D/g, ''))
        ? String(s.value).replace(/\D/g, '')
        : null;
      const suffix = String(s.value).replace(/[\d]/g, '');
      return (
        `<div class="stat">` +
        `<span class="stat__value"${
          numeric ? ` data-count-to="${attr(numeric)}" data-count-suffix="${attr(suffix)}"` : ''
        }>${esc(s.value)}</span>` +
        `<span class="stat__label">${esc(upper(s.label))}</span>` +
        `</div>`
      );
    })
    .join('\n            ');
}

function renderSkillRows(groups) {
  return groups
    .map(
      (g) => `<div class="spec-row" data-reveal>
              <h3 class="spec-row__label">${esc(upper(g.title))}</h3>
              <div class="spec-row__body">
                <p class="spec-row__blurb">${esc(g.blurb)}</p>
                <ul class="spec-row__tags">
                  ${g.items
                    .map((i) => `<li class="tag tag--bone">${esc(i)}</li>`)
                    .join('\n                  ')}
                </ul>
              </div>
            </div>`
    )
    .join('\n            ');
}

function pickLinks(project) {
  const byType = (t) => project.links?.find((l) => l.type === t) || null;
  const primary = byType('live') || byType('demo') || byType('code');
  const source = byType('code');
  const isOutbound = primary && primary !== source;
  return { primary, source, isOutbound };
}

function renderTags(tags, max = 4) {
  const shown = tags.slice(0, max);
  const hidden = tags.slice(max);
  const out = shown.map((t) => `<li class="tag">${esc(t)}</li>`);
  if (hidden.length) {
    /* The overflow pill used to carry the remaining tags in `title` alone.
     * `title` is unreachable by keyboard and unreliable on touch, so the names
     * were effectively sighted-mouse-only content (WCAG 1.3.1). They are now
     * real text in the DOM; `title` stays as the mouse convenience it is, and
     * the "+N" glyph is hidden from AT so it is not read as a bare number. */
    out.push(
      `<li class="tag tag--more" title="${attr(hidden.join(', '))}">` +
        `<span aria-hidden="true">+${hidden.length}</span>` +
        `<span class="u-visually-hidden">${esc(hidden.length)} more: ${esc(
          hidden.join(', ')
        )}</span></li>`
    );
  }
  return out.join('');
}

/**
 * WHY THE PROJECT HEADINGS CARRY AN `aria-label`
 * ----------------------------------------------
 * The title link is `aria-label="<title> (opens in a new tab)"`. Under
 * accname-1.2 a heading with no name of its own is named *from its contents*,
 * and that traversal honours `aria-label` on every descendant it walks — so
 * the <h3> inherited the new-tab hint and screen-reader heading lists read
 * "Basix Plastics (opens in a new tab), heading level 3". Verified in-browser:
 * `role=heading[name="GEM (Green Energy Management) (opens in a new tab)"]`
 * matched the <h3> before this change and no longer does.
 *
 * Naming the heading explicitly wins over content traversal (accname step 2C)
 * and restores a clean heading, while the link keeps the hint that makes it
 * useful. Both strings come from the same `p.title` in the same template
 * literal, so the label can never drift from the visible text — which is also
 * what keeps 2.5.3 Label in Name satisfied.
 */

function renderFeatured(items, resolveImage, labels) {
  return items
    .map((p, i) => {
      const img = resolveImage(p.image, p.title);
      const { primary, source } = pickLinks(p);
      const flip = i % 2 === 1 ? ' case-row--flip' : '';
      const primaryIsCode = primary && primary.type === 'code';
      return `<article class="case-row${flip}" data-reveal>
            <div class="case-row__media">
              <div class="case-row__plate" aria-hidden="true"></div>
              ${picture(img, p.imageAlt, { className: 'case-row__img' })}
            </div>
            <div class="case-row__body">
              <p class="case-row__index" aria-hidden="true">${pad2(i + 1)}</p>
              <h3 class="case-row__title"${primary ? ` aria-label="${attr(p.title)}"` : ''}>
                ${
                  primary
                    ? `<a class="case-row__link" href="${attr(primary.url)}" target="_blank" rel="noopener noreferrer" aria-label="${attr(
                        `${p.title} (opens in a new tab)`
                      )}">${esc(p.title)}</a>`
                    : esc(p.title)
                }
              </h3>
              <p class="case-row__hook">${esc(p.hook)}</p>
              <p class="case-row__desc">${esc(p.description)}</p>
              <p class="case-row__role"><span class="case-row__role-key">Role</span> ${esc(p.role)}</p>
              <ul class="tag-row">${renderTags(p.tags, 5)}</ul>
              <p class="case-row__links">
                ${
                  primary
                    ? `<span class="link-arrow link-arrow--live" aria-hidden="true">${esc(
                        primaryIsCode ? labels.code : primary.label
                      )}${ARROW}</span>`
                    : ''
                }
                ${
                  source && source !== primary
                    ? `<a class="link-arrow link-arrow--source" href="${attr(
                        source.url
                      )}" target="_blank" rel="noopener noreferrer">${esc(source.label)}${ARROW}${NEWTAB}</a>`
                    : ''
                }
              </p>
            </div>
          </article>`;
    })
    .join('\n\n          ');
}

function renderFilters(filters, total, catCounts) {
  const buttons = [
    `<button type="button" class="filter" data-filter="all" aria-pressed="true">${esc(
      filters.allLabel
    )} <span class="filter__count">(${total})</span></button>`,
  ];
  for (const c of filters.categories) {
    const n = catCounts[c.id] || 0;
    if (!n) continue;
    buttons.push(
      `<button type="button" class="filter" data-filter="${attr(
        c.id
      )}" aria-pressed="false">${esc(c.label)} <span class="filter__count">(${n})</span></button>`
    );
  }
  return buttons.join('\n              ');
}

function renderGrid(items, resolveImage, offset, catLabel, labels = {}) {
  return items
    .map((p, i) => {
      const img = resolveImage(p.image, p.title);
      const { primary, source } = pickLinks(p);
      /* Label comes from projects.linkLabels, not a hardcoded string, so the
       * grid bar and the featured rows can't disagree about the same link.
       * Note this is only rendered when `primary` exists — a project with no
       * link previously fell into the code branch and advertised a
       * "VIEW CODE ↗" affordance pointing at nothing. */
      const barLabel = primary
        ? labels[primary.type] || primary.label || 'View live'
        : null;
      return `<li class="card-cell" data-cat="${attr(p.category)}">
              <article class="card" data-reveal>
                <div class="card__media">
                  ${picture(img, p.imageAlt, { className: 'card__img' })}
                </div>
                <div class="card__body">
                  <p class="card__meta">
                    <span class="card__index" aria-hidden="true">${pad2(offset + i + 1)}</span>
                    <span class="chip chip--${attr(p.category)}">${esc(
                      upper(catLabel(p.category))
                    )}</span>
                  </p>
                  <h3 class="card__title"${primary ? ` aria-label="${attr(p.title)}"` : ''}>
                    ${
                      primary
                        ? `<a class="card__link" href="${attr(
                            primary.url
                          )}" target="_blank" rel="noopener noreferrer" aria-label="${attr(
                            `${p.title} (opens in a new tab)`
                          )}">${esc(p.title)}</a>`
                        : esc(p.title)
                    }
                  </h3>
                  <p class="card__desc u-clamp-3">${esc(p.description)}</p>
                  <ul class="tag-row tag-row--tight">${renderTags(p.tags, 4)}</ul>
                </div>
                ${
                  source && source !== primary
                    ? `<a class="card__source" href="${attr(
                        source.url
                      )}" target="_blank" rel="noopener noreferrer">${esc(source.label)}${ARROW}${NEWTAB}</a>`
                    : ''
                }
                ${barLabel ? `<p class="card__bar" aria-hidden="true">${esc(upper(barLabel))} ↗</p>` : ''}
              </article>
            </li>`;
    })
    .join('\n\n            ');
}

function renderLedger(contact) {
  const rows = contact.details.items.map((item) => {
    const inner =
      `<span class="ledger__key">${esc(upper(item.label))}</span>` +
      `<span class="ledger__val">${esc(item.value)}</span>`;
    if (!item.href) return `<li class="ledger__row"><span class="ledger__static">${inner}</span></li>`;
    const ext = /^https?:/.test(item.href);
    return (
      `<li class="ledger__row"><a class="ledger__link" href="${attr(item.href)}"${
        ext ? ' target="_blank" rel="noopener noreferrer"' : ''
      }>${inner}${ext ? NEWTAB : ''}</a></li>`
    );
  });
  rows.push(
    `<li class="ledger__row"><span class="ledger__static">` +
      `<span class="ledger__key">STATUS</span>` +
      `<span class="ledger__val"><span class="dot-live" aria-hidden="true"></span>${esc(
        contact.availability
      )}</span></span></li>`
  );
  return rows.join('\n              ');
}

function renderSocial(links, cls = 'btn-icon') {
  return links
    .map(
      (s) =>
        `<li><a class="${cls}" href="${attr(
          s.url
        )}" target="_blank" rel="noopener noreferrer">${ICON[s.platform] || ICON.mail}` +
        `<span class="u-visually-hidden">${esc(s.label)} (opens in a new tab)</span></a></li>`
    )
    .join('\n                ');
}

function renderFormFields(fields) {
  return fields
    .map((f) => {
      const id = `f-${f.name}`;
      const req = f.required
        ? ` required aria-required="true"`
        : '';
      const star = f.required
        ? ` <span class="field__req" aria-hidden="true">*</span>`
        : '';
      const describedby = `${id}-error`;
      const control =
        f.type === 'textarea'
          ? `<textarea class="field__control field__control--area" id="${id}" name="${attr(
              f.name
            )}" rows="${f.rows || 5}" placeholder="${attr(f.placeholder)}"${req}
                    aria-describedby="${describedby}"></textarea>`
          : `<input class="field__control" id="${id}" name="${attr(f.name)}" type="${attr(
              f.type
            )}" placeholder="${attr(f.placeholder)}"${req}
                    autocomplete="${f.name === 'email' ? 'email' : f.name === 'name' ? 'name' : 'off'}"
                    aria-describedby="${describedby}">`;
      return `<div class="field" data-field="${attr(f.name)}">
                  <label class="field__label" for="${id}">${esc(f.label)}${star}</label>
                  ${control}
                  <p class="field__error" id="${describedby}" data-message="${attr(
                    f.errorMessage
                  )}"></p>
                </div>`;
    })
    .join('\n\n                ');
}

function renderFooterNav(links) {
  return links
    .map(
      (l, i) =>
        `<li><a class="footer__navlink" href="${attr(l.href)}">` +
        `<span aria-hidden="true">${pad2(i + 1)}</span> ${esc(l.label)}</a></li>`
    )
    .join('\n              ');
}

/* ── structured data (JSON-LD) ───────────────────────────────────────────── */

/* Stable node identifiers so the graph can cross-reference itself by @id
 * instead of repeating the Person object inside every project. */
const PERSON_ID = `${SITE_URL}#person`;
const WEBSITE_ID = `${SITE_URL}#website`;
const WEBPAGE_ID = `${SITE_URL}#webpage`;
const ITEMLIST_ID = `${SITE_URL}#projects`;

/** Root-relative ('/WebPortfolio/images/x.jpg') -> absolute. Schema.org URLs
 *  must be absolute to resolve for consumers that see the JSON out of context. */
const abs = (u) => (u ? new URL(u, SITE_URL).href : undefined);

/** Recursively drop undefined/null/empty values so the emitted graph never
 *  carries a key with nothing behind it (an empty property is worse than an
 *  absent one — validators flag it and consumers can't act on it). */
function prune(v) {
  if (Array.isArray(v)) {
    const a = v.map(prune).filter((x) => x !== undefined);
    return a.length ? a : undefined;
  }
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) {
      const p = prune(val);
      if (p !== undefined) o[k] = p;
    }
    return Object.keys(o).length ? o : undefined;
  }
  if (v === null || v === '') return undefined;
  return v;
}

/**
 * Build the schema.org @graph for the page.
 *
 * Everything here is derived from content/copy.json — there is no second copy
 * of the content to drift. Deliberately NOT included, because none of it is
 * verifiable or present on the page: aggregateRating, review, Organization,
 * hasCredential, priceRange, or any employment history.
 */
function buildJsonLd(copy, resolveImage) {
  const { meta, brand, hero, skills, projects, contact } = copy;

  const socialLinks = contact.social?.links || [];
  const detailItems = contact.details?.items || [];
  const find = (t) => detailItems.find((i) => i.type === t);

  const emailItem = find('email');
  const phoneItem = find('whatsapp');

  /* Only real profile pages belong in sameAs. wa.me is a chat deep link, not a
   * profile, so it goes on the contactPoint instead. */
  const sameAs = socialLinks
    .filter((s) => s.platform === 'github' || s.platform === 'linkedin')
    .map((s) => s.url)
    .filter(Boolean);

  const headshot = abs(resolveImage('photo.png', 'about headshot').src);

  /* knowsAbout is the stack that is actually rendered on the page, deduped. */
  const knowsAbout = [...new Set((skills.groups || []).flatMap((g) => g.items || []))];

  const person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: brand.wordmark,
    url: SITE_URL,
    image: headshot,
    jobTitle: brand.role,
    description: hero.subheadline,
    email: emailItem?.value,
    telephone: phoneItem?.value,
    address: { '@type': 'PostalAddress', addressCountry: 'PH' },
    knowsAbout,
    sameAs,
    mainEntityOfPage: { '@id': WEBPAGE_ID },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Business inquiries',
      email: emailItem?.value,
      telephone: phoneItem?.value,
      availableLanguage: 'English',
    },
  };

  const works = (projects.items || []).map((p) => {
    const img = resolveImage(p.image, p.title);
    const { primary, source } = pickLinks(p);
    const isRepo = Boolean(source);
    return {
      '@type': isRepo ? ['CreativeWork', 'SoftwareSourceCode'] : 'CreativeWork',
      name: p.title,
      abstract: p.hook,
      description: p.description,
      url: primary?.url,
      image: abs(img.src),
      keywords: (p.tags || []).join(', '),
      codeRepository: isRepo ? source.url : undefined,
      creator: { '@id': PERSON_ID },
      inLanguage: 'en',
    };
  });

  const itemList = {
    '@type': 'ItemList',
    '@id': ITEMLIST_ID,
    name: projects.heading,
    description: projects.intro,
    numberOfItems: works.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: works.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item,
    })),
  };

  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: `${brand.wordmark} — Portfolio`,
    description: meta.metaDescription,
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID },
    /* No SearchAction: the site has no search endpoint and claiming one that
     * does not exist is a fabrication Google will (rightly) ignore. */
  };

  const webpage = {
    '@type': ['WebPage', 'ProfilePage'],
    '@id': WEBPAGE_ID,
    url: SITE_URL,
    name: meta.siteTitle,
    description: meta.metaDescription,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    mainEntity: { '@id': PERSON_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: headshot },
    hasPart: { '@id': ITEMLIST_ID },
  };

  return prune({
    '@context': 'https://schema.org',
    '@graph': [person, website, webpage, itemList],
  });
}

/**
 * Serialise for embedding in <script type="application/ld+json">.
 *
 * `<`, `>` and `&` are escaped to their \uXXXX JSON forms. This is still valid
 * JSON (so parsers are unaffected) but makes it impossible for any copy string
 * to close the script element early — the classic JSON-in-HTML injection.
 * Order matters: the inserted escapes contain no further `<`, `>` or `&`.
 */
function serialiseJsonLd(data) {
  return JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/* ── the token map ───────────────────────────────────────────────────────── */

export function buildTokens() {
  const copy = readJSON('content/copy.json');
  const resolveImage = buildImageResolver();

  const {
    meta, brand, nav, hero, about, skills, projects, contact, footer,
  } = copy;

  const all = projects.items;

  /* Featured selection is the client-confirmed list, not the JSON flag — the
   * flag is advisory and the three case rows are a layout decision. Anything
   * not matched falls back to the flag so a rename can't empty the tier. */
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const featured = [];
  for (const [id, title] of FEATURED_ORDER) {
    const hit = all.find((p) => norm(p.id) === norm(id) || norm(p.title).startsWith(title));
    if (hit && !featured.includes(hit)) featured.push(hit);
  }
  if (featured.length !== FEATURED_ORDER.length) {
    const missing = FEATURED_ORDER.filter(
      ([id]) => !featured.some((p) => norm(p.id) === norm(id))
    ).map(([id]) => id);
    console.warn(
      `[content] featured project(s) not found in copy.json: ${missing.join(', ')} — ` +
        `falling back to the "featured" flag for the remaining slot(s)`
    );
    for (const p of all) {
      if (featured.length >= FEATURED_ORDER.length) break;
      if (p.featured && !featured.includes(p)) featured.push(p);
    }
  }
  const grid = all.filter((p) => !featured.includes(p));

  const catLabelMap = new Map(projects.filters.categories.map((c) => [c.id, c.label]));
  const catLabel = (id) => catLabelMap.get(id) || id;
  const catCounts = {};
  for (const p of grid) catCounts[p.category] = (catCounts[p.category] || 0) + 1;

  const githubUrl =
    (contact.social.links.find((s) => s.platform === 'github') || {}).url || '#';
  const emailItem = contact.details.items.find((i) => i.type === 'email');

  const total = all.length;

  /* Social preview: a purpose-built 1200x630 card, not a client screenshot.
   * Deliberately NOT resolved through the image manifest — that pipeline emits
   * WebP as the primary source, and several social scrapers still refuse WebP.
   * This is a fixed, hand-sized JPEG, so the dimensions below are the literal
   * dimensions of the file and cannot drift. Regenerate with og-card.html. */
  const ogImg = { src: 'images/og-card.jpg', width: 1200, height: 630 };
  const ogImgType = 'image/jpeg';

  return {
    /* ── head ───────────────────────────────────────────────────────────── */
    'site.url': attr(SITE_URL),
    /* Absolute on purpose. Vite's index.html asset rewriting runs BEFORE our
     * transformIndexHtml, so it never sees the substituted value — and a
     * hand-written "/WebPortfolio/llms.txt" risks becoming
     * "/WebPortfolio/WebPortfolio/llms.txt" if it ever did. An absolute URL is
     * unambiguous at every stage and is what a discovery tag wants anyway.
     * The file itself is owned by the AEO agent; this only points at it. */
    'site.llmsTxt': attr(`${SITE_URL}llms.txt`),
    'meta.title': esc(meta.siteTitle),
    'meta.description': attr(meta.metaDescription),
    'meta.keywords': attr((meta.keywords || []).join(', ')),
    'meta.author': attr(meta.author),
    'meta.locale': attr(meta.locale || 'en'),
    'meta.ogTitle': attr(meta.ogTitle),
    'meta.ogDescription': attr(meta.ogDescription),
    'meta.ogImage': attr(abs(ogImg.src)),
    'meta.ogImageAlt': attr(
      'Celso Aquino — freelance Shopify and WordPress developer. 13 shipped builds, 4 countries, 4+ years building.'
    ),
    'meta.ogImageWidth': attr(String(ogImg.width)),
    'meta.ogImageHeight': attr(String(ogImg.height)),
    'meta.ogImageType': attr(ogImgType),
    'meta.jsonLd': serialiseJsonLd(buildJsonLd(copy, resolveImage)),
    'meta.railText': esc(
      `MANIFEST № 01 — ${upper(
        (contact.details.items.find((i) => i.type === 'location') || {}).value ||
          'TAGUIG CITY, PH'
      )} · UTC+8`
    ),

    /* ── nav ────────────────────────────────────────────────────────────── */
    'brand.wordmark': esc(upper(brand.wordmark)),
    'brand.wordmarkPlain': esc(brand.wordmark),
    'nav.links': renderNavLinks(nav.links),
    'nav.mobileLinks': renderMobileLinks(nav.links),
    'nav.mobileContact': renderMobileContact(contact),
    'nav.ctaLabel': esc(nav.ctaLabel),
    'nav.menuOpenLabel': attr(`Open ${nav.mobileMenuLabel.toLowerCase()}`),
    'nav.menuCloseLabel': attr(`${nav.mobileMenuCloseLabel} menu`),

    /* ── hero ───────────────────────────────────────────────────────────── */
    'hero.eyebrow': esc(upper(hero.eyebrow)),
    'hero.headline': renderHeadline(hero.headlineLines),
    'hero.headlinePlain': esc(hero.headlinePlain),
    'hero.sub': esc(hero.subheadline),
    'hero.support': esc(hero.supportLine),
    'hero.cta1.label': esc(hero.primaryCta.label),
    'hero.cta1.href': attr(hero.primaryCta.href),
    'hero.cta2.label': esc(hero.secondaryCta.label),
    'hero.cta2.href': attr(hero.secondaryCta.href),
    'hero.meta': renderHeroMeta(hero, contact),
    'hero.scroll': esc(upper(hero.scrollHint)),

    /* ── ticker ─────────────────────────────────────────────────────────── */
    'ticker.track': renderTicker(skills),

    /* ── about ──────────────────────────────────────────────────────────── */
    'about.kicker': esc(upper(about.kicker)),
    'about.heading': esc(about.heading),
    'about.paragraphs': renderAboutParagraphs(about.paragraphs),
    'about.stats': renderAboutStats(hero.stats),
    'about.photo': picture(resolveImage('photo.png', 'about headshot'), about.imageAlt, {
      className: 'about__img',
    }),

    /* ── skills ─────────────────────────────────────────────────────────── */
    'skills.kicker': esc(upper(skills.kicker)),
    'skills.heading': esc(skills.heading),
    'skills.intro': esc(skills.intro),
    'skills.rows': renderSkillRows(skills.groups),

    /* ── projects ───────────────────────────────────────────────────────── */
    'projects.kicker': esc(upper(projects.kicker)),
    'projects.heading': esc(projects.heading),
    'projects.intro': esc(projects.intro),
    'projects.counter': esc(`${total} / ${total} SHIPPED`),
    'projects.featured': renderFeatured(featured, resolveImage, projects.linkLabels),
    'projects.filters': renderFilters(projects.filters, grid.length, catCounts),
    'projects.grid': renderGrid(grid, resolveImage, featured.length, catLabel, projects.linkLabels),
    'projects.gridCount': String(grid.length),
    'projects.githubLabel': esc(`All ${total} on GitHub`),
    'projects.githubUrl': attr(githubUrl),

    /* ── contact ────────────────────────────────────────────────────────── */
    'contact.kicker': esc(upper(contact.kicker)),
    'contact.heading': esc(contact.heading),
    'contact.invitation': esc(contact.invitation),
    'contact.ledger': renderLedger(contact),
    'contact.socialHeading': esc(upper(contact.social.heading)),
    'contact.social': renderSocial(contact.social.links),
    'contact.form.heading': esc(contact.form.heading),
    'contact.form.action': attr(contact.form.action),
    'contact.form.method': attr(contact.form.method || 'POST'),
    'contact.form.fields': renderFormFields(contact.form.fields),
    'contact.form.submit': esc(contact.form.submitLabel),
    'contact.form.loading': attr(contact.form.submitLoadingLabel),
    'contact.form.success': esc(contact.form.successMessage),
    'contact.form.error': esc(contact.form.errorMessage),
    'contact.form.privacy': esc(contact.form.privacyNote),
    'contact.email': attr(emailItem ? emailItem.href : 'mailto:'),

    /* ── footer ─────────────────────────────────────────────────────────── */
    'footer.wordmark': esc(upper(footer.wordmark)),
    'footer.wordmarkPlain': esc(footer.wordmark),
    'footer.tagline': esc(footer.tagline),
    'footer.secondary': esc(footer.secondaryLine),
    'footer.nav': renderFooterNav(footer.navLinks),
    'footer.social': renderSocial(footer.social, 'btn-icon btn-icon--sm'),
    'footer.copyright': esc(footer.copyright),
    'footer.backToTop': esc(footer.backToTopLabel),
    'footer.manifest': esc(`MANIFEST COMPLETE — ${total} / ${total} ITEMS ACCOUNTED FOR`),
  };
}

/**
 * Replace every {{token}} in `html`. An unknown token is a hard build error.
 * @param {string} html
 * @param {string} base Vite's resolved `base` (must end in a slash).
 */
export function applyTokens(html, base = '/') {
  BASE = base.endsWith('/') ? base : `${base}/`;
  const tokens = buildTokens();
  const missing = new Set();
  const out = html.replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (m, key) => {
    if (!(key in tokens)) { missing.add(key); return m; }
    return tokens[key];
  });
  if (missing.size) {
    throw new Error(`[content] unknown template token(s): ${[...missing].join(', ')}`);
  }
  return out;
}
