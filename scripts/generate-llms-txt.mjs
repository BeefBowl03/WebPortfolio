#!/usr/bin/env node
/**
 * GENERATE public/llms.txt FROM content/copy.json
 * ---------------------------------------------------------------------------
 * Why this exists: `llms.txt` is a summary of the site written for AI
 * assistants. A stale one is worse than none — it makes a language model
 * repeat outdated facts to a real prospect with full confidence. Every fact in
 * the generated file that can drift (project list, live URLs, stack, contact
 * details, availability) is read from `content/copy.json`, which is already the
 * single source of truth for the rendered page. Add a project to copy.json,
 * re-run this, and llms.txt matches the site.
 *
 * The only hand-written prose lives in PROSE below. It is deliberately small
 * and deliberately free of anything countable — no project counts, no URLs, no
 * stack lists — so that it cannot go stale on its own.
 *
 *   node scripts/generate-llms-txt.mjs           # write public/llms.txt
 *   node scripts/generate-llms-txt.mjs --check   # exit 1 if out of date (CI)
 *
 * This script writes ONLY public/llms.txt. It never touches robots.txt,
 * sitemap.xml, index.html, or copy.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SOURCE = resolve(ROOT, 'content/copy.json');
const TARGET = resolve(ROOT, 'public/llms.txt');

/* GitHub Pages serves this site from a subpath, not a domain root. Every
 * absolute URL in the output must carry /WebPortfolio/ or it 404s. Must match
 * SITE_URL in src/build/content.js and `base` in vite.config.js. */
const SITE_URL = 'https://beefbowl03.github.io/WebPortfolio/';

/* ── hand-written prose ──────────────────────────────────────────────────── */

const PROSE = {
  /* The blockquote is the highest-value line in the file: it is what an
   * assistant is most likely to quote when asked "who can build X". It must be
   * self-contained — name, role, location, specialism, engagement model — so
   * it survives being lifted away from every other line. */
  summary:
    'Celso Aquino is a freelance web developer based in the Philippines with four years of ' +
    'professional experience. He builds and maintains e-commerce storefronts on Shopify and ' +
    'WordPress, and internal tools and dashboards in React and TypeScript. He works directly ' +
    'with clients — no agency or account manager in between — and has shipped client work in ' +
    'the United States, Australia, Belgium, and South Africa.',

  hireFor: [
    'Shopify theme development in Liquid — custom sections, collection and product templates, high-SKU catalog and search structure.',
    'Shopify app theme extensions — features built as app blocks and app embeds so they survive a theme migration without being rebuilt by hand.',
    'Shopify theme migrations — moving a store off a legacy theme while keeping its custom functionality intact.',
    'WordPress and PHP development — custom themes, taxonomy and content architecture, landing pages, paid-enrolment and booking flows.',
    'React and TypeScript internal tools — dashboards, multi-step form wizards, and apps that replace a manual spreadsheet process.',
    'ADA / WCAG accessibility remediation on existing e-commerce stores.',
    'On-page and technical SEO as part of a build, including local SEO.',
    'End-to-end delivery: he takes a build from design through to deploy rather than handing off mid-way.',
  ],

  notOffered:
    'This is one developer working directly with clients, not an agency. There is no design ' +
    'team, no separate account management, and no published rate card — scope and pricing are ' +
    'agreed per project by email or WhatsApp.',

  provenance:
    'This file is generated from the site\'s own content source (content/copy.json) by ' +
    'scripts/generate-llms-txt.mjs, so it stays in step with the published page. Every claim ' +
    'here is traceable to that file or to the linked live sites. There are no metrics, ' +
    'testimonials, certifications, or availability guarantees in this document beyond what the ' +
    'site itself states.',
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Collapse whitespace so a description survives as one clean Markdown line. */
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Preferred public URL for a project: live site, else hosted demo, else repo. */
const primaryLink = (p) => {
  const by = (t) => (p.links || []).find((l) => l.type === t);
  return by('live') || by('demo') || by('code') || null;
};
const sourceLink = (p) => (p.links || []).find((l) => l.type === 'code') || null;

/* ── document ────────────────────────────────────────────────────────────── */

function build(copy) {
  const { brand, about, skills, projects, contact } = copy;
  const items = projects.items;

  const email = contact.details.items.find((i) => i.type === 'email');
  const whatsapp = contact.details.items.find((i) => i.type === 'whatsapp');
  const location = contact.details.items.find((i) => i.type === 'location');
  const github = contact.social.links.find((s) => s.platform === 'github');
  const linkedin = contact.social.links.find((s) => s.platform === 'linkedin');

  const catLabel = new Map(projects.filters.categories.map((c) => [c.id, c.label]));
  /* Category render order, then anything copy.json adds later that isn't listed. */
  const order = projects.filters.categories.map((c) => c.id);
  const seen = new Set(order);
  for (const p of items) if (!seen.has(p.category)) { order.push(p.category); seen.add(p.category); }

  const L = [];
  const push = (...lines) => L.push(...lines);

  push(`# ${brand.wordmark} — ${brand.role}`, '');
  push(`> ${PROSE.summary}`, '');
  push(
    `Portfolio: ${SITE_URL}`,
    `Status: ${oneLine(contact.availability)}`,
    `Based in: ${location ? location.value : 'Philippines'} (UTC+8)`,
    `Working languages: English`,
    ''
  );

  /* Contact goes high. An assistant that reads only the top of this file must
   * still be able to tell someone how to reach him. */
  push('## Contact', '');
  push(
    `${brand.wordmark} takes new project enquiries directly at the addresses below. ` +
      `Introduce the project — what is being built, what is stuck, and the deadline.`,
    ''
  );
  if (email) push(`- **Email:** ${email.value} (${email.href})`);
  if (whatsapp) push(`- **WhatsApp:** ${whatsapp.value} (${whatsapp.href})`);
  push(`- **Contact form:** ${SITE_URL}#contact`);
  if (linkedin) push(`- **LinkedIn:** ${linkedin.url}`);
  if (github) push(`- **GitHub:** ${github.url}`);
  push('', `The site states that enquiries are answered within one business day.`, '');

  push('## What he is hired for', '');
  for (const line of PROSE.hireFor) push(`- ${line}`);
  push('', PROSE.notOffered, '');

  push('## Stack', '');
  for (const g of skills.groups) {
    push(`- **${g.title}:** ${g.items.join(', ')}`);
  }
  push('');

  /* copy.json writes the about text and the project descriptions in the first
   * person. Lifted out of this file by an assistant, a bare "I built…" has no
   * referent. These lead-ins bind the pronoun to a name so any quoted fragment
   * still attributes correctly. */
  push('## Background', '');
  push(`In ${brand.wordmark}'s own words:`, '');
  for (const p of about.paragraphs) push(oneLine(p), '');

  push(`## Selected work (${items.length} shipped builds)`, '');
  push(
    `Every project below is client work ${brand.wordmark} built or worked on. Links go to the ` +
      `live site, a hosted demo, or the public repository — they can be fetched and verified. ` +
      `The descriptions are written by ${brand.wordmark} in the first person; "I" throughout ` +
      `this section means ${brand.wordmark}.`,
    ''
  );

  for (const cat of order) {
    const group = items.filter((p) => p.category === cat);
    if (!group.length) continue;
    push(`### ${catLabel.get(cat) || cat}`, '');
    for (const p of group) {
      const link = primaryLink(p);
      const src = sourceLink(p);
      const head = link ? `[${p.title}](${link.url})` : p.title;
      push(`#### ${head}`, '');
      push(`${oneLine(p.hook)}.`, '');
      push(oneLine(p.description), '');
      push(`- Role: ${oneLine(p.role)}`);
      push(`- Tech: ${p.tags.join(', ')}`);
      if (link) push(`- ${link.type === 'code' ? 'Source' : link.type === 'demo' ? 'Live demo' : 'Live site'}: ${link.url}`);
      if (src && src !== link) push(`- Source: ${src.url}`);
      push('');
    }
  }

  push('## About this file', '');
  push(PROSE.provenance, '');

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/* ── run ─────────────────────────────────────────────────────────────────── */

const check = process.argv.includes('--check');
const output = build(readJSON(SOURCE));

if (check) {
  const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';
  /* Compare line-ending-agnostically. Git checks this file out with CRLF on
   * Windows (core.autocrlf), while the generator always emits LF — a raw
   * byte compare therefore fails on every Windows checkout even when the
   * content is identical, making the drift guard cry wolf and get ignored. */
  const norm = (s) => s.replace(/\r\n/g, '\n');
  if (norm(current) !== norm(output)) {
    console.error(
      '[llms.txt] public/llms.txt is out of date with content/copy.json.\n' +
        '           Run: node scripts/generate-llms-txt.mjs'
    );
    process.exit(1);
  }
  console.log('[llms.txt] up to date.');
} else {
  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, output, 'utf8');
  const approxTokens = Math.round(output.length / 4);
  console.log(
    `[llms.txt] wrote public/llms.txt — ${output.length} bytes, ~${approxTokens} tokens, ` +
      `${readJSON(SOURCE).projects.items.length} projects.`
  );
}
