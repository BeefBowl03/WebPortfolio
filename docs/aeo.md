# AEO Foundations Audit — Celso Aquino portfolio

**Date:** 2026-08-16
**Branch:** `revamp`
**Deployed URL:** https://beefbowl03.github.io/WebPortfolio/ (subpath, no custom domain)
**Audited by:** AEO Foundations Architect
**Scope:** discovery, parsability, and agent-actionability. Rankings, canonical tags, JSON-LD,
`robots.txt`, and `sitemap.xml` belong to the SEO agent and are only referenced here where the
two lanes touch.

---

## 0. Read this first — the live site is not the site in this repo

The deployed page at https://beefbowl03.github.io/WebPortfolio/ is **the old pre-revamp
portfolio**, not the build in this branch. Fetched 2026-08-16:

| Fact | Live page says | This repo's `dist/index.html` says |
|---|---|---|
| Experience | "2+ years of experience" | "four years" (`grep -c "2+ years" dist/index.html` → **0**) |
| Hero | "I build exceptional digital experiences…" | "I build storefronts and the tools that run behind them." (old string: **0** matches in dist) |
| CV Linens project | absent from all outbound links | present (`cvlinens.com` × 2 in dist) |

This is the single most damaging AEO problem on the list, and no amount of `llms.txt` fixes it.
Anything an AI assistant has already ingested from this URL says Celso has **two** years of
experience and does not know about the CV Linens Shopify app-extension work — which is the
strongest Shopify credential in the portfolio and exactly the evidence a "who can build a
Shopify store" answer needs. AI crawlers cache; a wrong fact served today keeps being repeated
after the fix ships.

**Cause is already documented** in `README.md` lines 9–24: the repo was migrated to a GitHub
Actions build, and **Settings → Pages → Source is still "Deploy from a branch"**. Until someone
flips that to "GitHub Actions" in the browser, the live site keeps serving the old unbuilt files.

**Action (owner, 2 minutes, blocks everything else):** flip the Pages source, re-run the
workflow, then re-fetch the URL and confirm the string "four years" appears.

---

## 1. Foundations scorecard

### Discovery layer

| Check | Status | Detail |
|---|---|---|
| `llms.txt` published | ✅ Now yes | `public/llms.txt` → `dist/llms.txt`, 13,991 bytes, ~3,500 tokens, all 13 projects |
| `llms.txt` kept in sync | ✅ Now yes | Generated from `content/copy.json` by `scripts/generate-llms-txt.mjs`; `--check` mode for CI |
| `llms-full.txt` | ⬜ Not warranted | The entire site is ~2,950 tokens. A second, longer file would duplicate `llms.txt` with nothing added. Revisit only if a blog or case-study pages are added |
| `robots.txt` with AI crawler rules | ❌ Missing | No `public/robots.txt` exists at all. **SEO agent's file** — exact recommendation in §4 |
| `sitemap.xml` | ❌ Missing | No `public/sitemap.xml`. **SEO agent's file** |
| Discoverable at domain root | ⚠️ Not possible | See §3 — the subpath problem |
| AI crawl log evidence | ⬜ Unavailable | GitHub Pages exposes no access logs. Verification has to be behavioural (§6) |

### Parsability layer

| Check | Status | Detail |
|---|---|---|
| Content in HTML, not behind JS | ✅ Pass | All copy is substituted at build time by `src/build/content.js`. All 13 projects, all prose, and the whole contact form are in the shipped `dist/index.html` |
| Page token budget | ✅ Pass | 11,773 chars of extracted text ≈ **2,950 tokens** against a <8,000 landing-page budget |
| Heading hierarchy | ✅ Pass | One `h1`, semantic `h2` per section, one `h3` per project — 13 of them, matching the 13 projects |
| Project links machine-discoverable | ✅ Pass | 21 distinct absolute `https://` hrefs in the HTML, plus 2 `mailto:` |
| Contact parseable | ✅ Pass | Email is visible text *and* a `mailto:` href; WhatsApp is visible text *and* a `wa.me` href |
| Markdown alternative | ✅ Now yes | `/WebPortfolio/llms.txt` is the Markdown mirror |
| Heading text clean | ⚠️ Polluted | Every project `h3` extracts as `CV Linens (opens in a new tab)` — see §2.3 |
| Structured data | ❌ None | `application/ld+json` occurrences in `dist/index.html`: **0**. **SEO agent's lane** |

### Capability layer (Wave 3 — agentic task completion)

| Check | Status | Detail |
|---|---|---|
| Primary task uses a native HTML form | ✅ Pass | The contact form is a real `<form method="POST">` to Formspree with named `name`/`email`/`subject`/`message` fields and proper `<label for>`. A browsing agent can fill and submit it without JS |
| No mandatory auth on first interaction | ✅ Pass | No login anywhere |
| `agent-permissions.json` / `/mcp-actions.json` | ⬜ Deliberately skipped | These declare *multiple* machine-callable actions. This site has exactly one action — "send a message" — already fully declared in native HTML. Publishing pre-1.0 spec files here would add maintenance burden and zero capability. Reconsider only if booking or payment is added |

**Foundation score: 9 / 13 (69%)** — and 3 of the 4 remaining gaps are the SEO agent's files.
With `robots.txt`, `sitemap.xml`, and JSON-LD landed the score is **12 / 13 (92%)**.

---

## 2. Content that survives extraction

The test applied: take one sentence out of the page, hand it to someone with no other context,
and see whether it still identifies who is being described and what they sell. Passing sentences
are the ones an AI assistant can quote in an answer. Failing ones get dropped or, worse, quoted
with the subject guessed wrong.

All wording below is traceable to `content/copy.json`. Nothing invented.

### 2.1 CRITICAL — the words "freelance" and "contract" appear nowhere on the page

`grep` the rendered page: neither word is in the visible text. They exist only in
`meta.keywords`, which every modern engine ignores.

The stated business goal is capturing "find me a freelance Shopify developer" queries. The page
never says he is one. It says "Available for select projects" — which, extracted alone, could
describe an agency, an employee taking side work, or a studio.

**File:** `content/copy.json` → `contact.availability`
**Currently:** `"Available for select projects."`
**Replace with:** `"Available for select freelance and contract projects."`

**File:** `content/copy.json` → `about.positioningPoints[0].label`
**Currently:** `"Available for select projects"`
**Replace with:** `"Available for freelance and contract work — remote, working with clients across US, Australian, and European time zones"`

Both are true (four countries of client work are already documented) and both make the
engagement model unambiguous in a single extracted line.

### 2.2 The `h1` does not name him

**File:** `index.html` line 116 + `content/copy.json` → `hero.headlinePlain`

```html
<span class="u-visually-hidden">{{hero.headlinePlain}}</span>
```

renders as *"I build storefronts and the tools that run behind them."* — the most
heavily-weighted element on the page, and it contains no name, no role, no location, and no
platform. Extracted, it is anonymous.

The fix does not touch the visible design: the sr-only span in the `h1` is a *separate* string
from the animated visible headline. Change only the hidden one.

**Recommended:** add a new key `hero.headlineAccessible` and point line 116 at it:

```json
"headlineAccessible": "Celso Aquino, freelance web developer in the Philippines. I build Shopify and WordPress storefronts and the internal tools that run behind them."
```

This also improves the screen-reader announcement, so it is a straight win, not a trade.

### 2.3 Every project heading carries UI noise

Evidence — extracted `h3` text from `dist/index.html`:

```
h3: Building Controls & Solutions (opens in a new tab)
h3: CV Linens (opens in a new tab)
h3: GEM (Green Energy Management) (opens in a new tab)
```

**Cause:** `src/build/content.js` — the `NEWTAB` visually-hidden span is emitted *inside* the
`<a>`, which is inside the `<h3>` (`renderFeatured` line ~337, `renderGrid` line ~411).

An extractor reading headings gets the accessibility affordance as part of the project name.
Thirteen times. It is not fatal, but it is thirteen slightly-corrupted entity names.

**Fix (in `src/build/content.js`, not my file):** drop the `${NEWTAB}` from the two title
anchors and put the affordance on the link instead:

```js
`<a class="case-row__link" href="${attr(primary.url)}" target="_blank" rel="noopener noreferrer"
    aria-label="${attr(p.title)} — opens in a new tab">${esc(p.title)}</a>`
```

Same accessibility outcome, clean heading text. Leave `NEWTAB` alone everywhere else — the
`ledger`, `social`, and `card__source` links are not headings and are not extracted as entities.

### 2.4 Verifiable claim is weakened by a hedge

**File:** `content/copy.json` → `hero.supportLine`
**Currently ends:** `"Thirteen of those builds are below, most of them live right now."`

"most of them" is vaguer than the truth. Every one of the 13 entries in `projects.items` has a
`live` or `demo` link — I checked all 13 while generating `llms.txt`.

**Replace with:** `"All thirteen are below, each linking to the live site or a working demo."`

Stronger, and independently verifiable by any agent that follows the links — which is exactly
the kind of claim that survives fact-checking and earns a citation.

### 2.5 "Certified web developer" — recommend removing or naming it

**File:** `content/copy.json` → `about.positioningPoints[4].label`

This names no certifying body, no credential, and no date. An AI assistant will repeat it
verbatim — "he's a certified web developer" — to a prospect who then asks *certified in what?*
and gets silence. That converts a positioning line into a credibility problem.

**Either:** replace with the actual credential (e.g. `"Shopify Partner"` or the exact
certificate name and issuer), **or** remove the point and let the 13 linked live builds carry
the proof. They are stronger evidence than an unnamed certificate.

**I deliberately excluded this claim from `llms.txt`** under the "everything must be traceable"
constraint. If the real credential is supplied I will add it.

### 2.6 Lower priority

- `skills.intro` — *"The tools I use often enough to be fast with them."* No subject. Harmless
  on-page; simply won't be quoted. No change needed.
- `footer.tagline` — *"Storefronts and internal tools, built to hold up."* Same. The wordmark
  sits directly above it in the DOM, so most extractors will associate them.
- `index.html` line 115–120 — the `h1` holds the headline twice (visually-hidden plain text plus
  an `aria-hidden` animated copy). Extractors that honour `aria-hidden` see it once; naive ones
  duplicate it. Cosmetic, and the a11y structure is correct as built. Leave it.

---

## 3. The subpath problem, and what to do about it

The `llms.txt` convention places the file at the **domain root**: `example.com/llms.txt`. This
site lives at `beefbowl03.github.io/WebPortfolio/`, so the file can only ever be published at:

```
https://beefbowl03.github.io/WebPortfolio/llms.txt
```

`beefbowl03.github.io/llms.txt` is the root of the GitHub *user* site — a different repo, and
not something this project can or should claim. So the file exists but sits where fewer clients
will probe for it by convention.

Three mitigations, in order of leverage:

1. **Buy a domain and point it at Pages.** This is the highest-leverage infrastructure change
   available for this site, and it is not primarily about `llms.txt`. A `github.io/username/repo`
   URL reads as a hobby project to a human evaluating a contractor and carries no independent
   domain authority for either classic search or AI citation. A custom domain puts `llms.txt`,
   `robots.txt`, and `sitemap.xml` all at a root that clients actually probe.
   Per the brief, the Pages API reports `cname: null`, so nothing is configured yet.
   *(Note for whoever does this: `vite.config.js` `base` must change from `/WebPortfolio/` to
   `/`, and `SITE_URL` in `src/build/content.js` and in `scripts/generate-llms-txt.mjs` must both
   be updated. I own the third of those three.)*
2. **Announce it from `robots.txt`** — see §4. Several crawlers read `robots.txt` first and
   follow declared resources.
3. **Announce it from the HTML head** — see §4.

---

## 4. Recommendations for files I do not own

Handing these over rather than editing them, per the ownership split.

### 4.1 `public/robots.txt` — for the SEO agent

There is currently **no `robots.txt` at all**. GitHub Pages' default in the absence of one is
permissive, so nothing is being blocked today — but an empty policy is an accident waiting to
happen and it forfeits the chance to advertise the discovery files.

The default posture for a portfolio whose entire purpose is being found and quoted should be
**allow every AI crawler**. There is no content licensing downside here: the content *is* the
advertisement. Blocking `GPTBot` or `ClaudeBot` on a site like this would be self-defeating.

```text
# Portfolio of Celso Aquino — content is intended to be indexed, read, and cited.

User-agent: *
Allow: /

# Search-augmented AI crawlers — these produce citations and referral traffic.
User-agent: PerplexityBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

# Training / ingestion crawlers — allowed deliberately. Being in the model is the point.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://beefbowl03.github.io/WebPortfolio/sitemap.xml
```

**Deliberately omitted:** any `Disallow` for `Bytespider` or `CCBot`. On a commercial site I'd
usually block ByteDance's scraper; on a portfolio there is nothing to protect and a blanket
allow is one fewer thing to maintain. Owner's call — say the word and I'll revise.

**Note on the `Sitemap:` line:** `robots.txt` on GitHub Pages is only served from the *domain*
root, i.e. `beefbowl03.github.io/robots.txt`, which belongs to the user-site repo, **not** this
one. A `robots.txt` in `public/` here publishes to `/WebPortfolio/robots.txt` and **will not be
read by any crawler.** It costs nothing to ship and becomes correct the moment a custom domain
is attached — but until then, do not count it as coverage. Same limitation as §3.

### 4.2 `index.html` head — declare the Markdown mirror

Because `robots.txt` is unreachable at a subpath (above), the HTML head is the *only* reliable
discovery signal for `llms.txt` on this deployment. Add inside `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/llms.txt" title="Markdown summary for AI assistants">
```

Write it with the leading slash and **no** `/WebPortfolio/` prefix — per `README.md`, Vite
rewrites it to `/WebPortfolio/llms.txt` at build time. This is currently the highest-value
one-line change on the list.

### 4.3 JSON-LD — SEO agent's lane, one request

There are zero `ld+json` blocks today. When the SEO agent adds `Person` / `ProfilePage` schema,
one field matters disproportionately for AI answer engines:

```json
"knowsAbout": ["Shopify", "Shopify Liquid", "Shopify app theme extensions",
               "WordPress", "PHP", "React", "TypeScript", "E-commerce development",
               "WCAG accessibility remediation"]
```

`knowsAbout` is what maps a person to a capability query. I have not written any structured data
myself and there is nothing in `llms.txt` that contradicts a `Person` schema — the two are
complementary, not duplicate.

---

## 5. What I built

| Path | Purpose |
|---|---|
| `e:\portfolio\public\llms.txt` | Generated. Ships to `dist/llms.txt`, served at `/WebPortfolio/llms.txt` |
| `e:\portfolio\scripts\generate-llms-txt.mjs` | Generator + `--check` drift guard |
| `e:\portfolio\docs\aeo.md` | This report |

Nothing else in the repo was touched.

### Why `llms.txt` is written the way it is

The convention's canonical shape is a short index of links to other pages. This site is a single
page — there are no sub-pages to index — so a link list would be a file containing one link.
Instead the facts are inline: an assistant answering *"who should I hire to build a Shopify
store"* gets the name, the engagement model, the specialisms, the stack, and two contact
channels in **one fetch**, with no follow-up request needed. At ~3,500 tokens it is comfortably
inside any context budget.

Three deliberate choices worth knowing about:

- **The blockquote is the load-bearing line.** It names him, the role, the country, the
  engagement model, the two platform specialisms, and the four client markets in one
  self-contained sentence, because that is the fragment most likely to be quoted alone.
- **First-person passages are bound to a name.** `copy.json` writes the about text and all 13
  project descriptions as "I built…". Lifted out of the file, a bare "I" has no referent, so the
  generator emits *"In Celso Aquino's own words:"* before the background and states explicitly
  that "I" means Celso Aquino throughout the project section.
- **A "not offered" section exists on purpose.** It states plainly that this is one developer,
  not an agency, and that there is no published rate card. Telling an assistant what is *not*
  on offer stops it inventing an answer, and stops unqualified enquiries reaching the inbox.

There is no text in the file addressed to AI systems attempting to influence how they rank or
present it, no hidden content, and no claim that isn't traceable to `content/copy.json` or to a
linked live site.

### npm script to add — `package.json` (not my file)

```json
"llms": "node scripts/generate-llms-txt.mjs",
"llms:check": "node scripts/generate-llms-txt.mjs --check"
```

Matching the existing `images` / `images:check` pair.

**Strongly recommended, one line further:** make the build regenerate it, so `llms.txt` can
never ship stale.

```json
"build": "node scripts/generate-llms-txt.mjs && vite build"
```

Without this, someone adds a 14th project to `copy.json`, the page shows 14, and `llms.txt` keeps
telling ChatGPT there are 13. That drift is the exact failure this generator exists to prevent,
and wiring it into `build` is the only version that survives a busy week. If you prefer to keep
`build` clean, add `npm run llms:check` as a step in `.github/workflows/deploy.yml` before the
build so CI fails loudly instead of drifting silently.

---

## 6. Verification — what actually ran

```
$ node scripts/generate-llms-txt.mjs
[llms.txt] wrote public/llms.txt — 13941 bytes, ~3485 tokens, 13 projects.

$ node scripts/generate-llms-txt.mjs --check
[llms.txt] up to date.

$ npm run build
vite v8.2.1 building client environment for production...
✓ 11 modules transformed.
dist/index.html   57.29 kB │ gzip: 11.80 kB
✓ built in 683ms
EXIT=0

$ ls -la dist/llms.txt
-rw-r--r-- 1 13991 Aug 16 08:18 dist/llms.txt

$ diff -q public/llms.txt dist/llms.txt
IDENTICAL
```

Build exits 0. `llms.txt` lands in `dist/` byte-identical to the source, and will be served at
`https://beefbowl03.github.io/WebPortfolio/llms.txt` once the site actually deploys.

### Still to verify — cannot be done from here

1. **Flip the Pages source** (§0). Nothing else matters until the live URL serves this build.
2. Fetch `https://beefbowl03.github.io/WebPortfolio/llms.txt` and confirm 200, not 404.
3. **Behavioural check, ~2 weeks after deploy.** GitHub Pages gives no access logs, so
   "did AI systems ingest it" can only be tested by asking. Run these in ChatGPT, Claude, and
   Perplexity with browsing on, and record whether the site is cited:
   - "Who is Celso Aquino, the web developer?"
   - "Find me a freelance Shopify developer who has done a theme migration using app extensions."
   - "I need someone to build a WordPress storefront and also fix accessibility on my Shopify
     store — who can do both?"

   The second and third are the queries this whole exercise is aimed at. If the site is not cited
   for them after the fixes in §2 land, the next lever is off-site: the same self-contained
   positioning sentence on the GitHub profile README and the LinkedIn headline, since those are
   crawled far more heavily than a `github.io` subpath.
