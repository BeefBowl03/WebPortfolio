# SEO — audit, changes, and open items

Site: **https://beefbowl03.github.io/WebPortfolio/**
Audited: 2026-08-16 · Branch: `revamp`

Target searches, in priority order:

1. **Commercial** — businesses hiring: *freelance Shopify developer*, *Shopify
   Liquid developer*, *WordPress developer for hire*, *Shopify app theme
   extension developer*, *hire e-commerce developer Philippines*.
2. **Navigational / evaluative** — hiring managers checking him out:
   *Celso Aquino*, *Celso Aquino developer*, *BeefBowl03*.

Everything below is written against those two intents. Where a recommendation is
not implemented, it says so and says why.

---

## 0. Verification status — READ THIS FIRST

**I could not run `npm run build`.** The shell tool was disabled for the session
that produced these changes, so no command in this document was executed by me
and I am not going to claim otherwise.

What I audited instead: the **`dist/index.html` from a previous build**, which
was present in the working tree. It is stale relative to the current
`content/copy.json` (it renders "two years" where the JSON now says "four
years"), but it is a faithful sample of what the token pipeline emits, which is
what the audit needed.

**Before merging, someone must run:**

```bash
npm run build          # must exit 0
```

and then confirm three things in `dist/index.html`:

1. A `<script type="application/ld+json">` block exists in `<head>` and its
   contents parse — `node -e "JSON.parse(require('fs').readFileSync('dist/index.html','utf8').match(/ld\+json\">([\s\S]*?)<\/script>/)[1])"`
   should print nothing and exit 0.
2. No literal `{{` survives anywhere in the file. (`applyTokens` throws on an
   unresolved token, so a green build already proves this — the new tokens are
   `meta.jsonLd`, `meta.ogImageType`, `meta.ogImageWidth`, `meta.ogImageHeight`,
   `site.llmsTxt`, and the reworked `meta.ogImage`.)
3. `dist/robots.txt`, `dist/sitemap.xml` and `dist/llms.txt` are present (copied
   verbatim from `public/`).
4. The `llms.txt` `<link rel="alternate">` href is
   `https://beefbowl03.github.io/WebPortfolio/llms.txt` — **one** `WebPortfolio`,
   not two. See §4c.
5. Project headings no longer contain "(opens in a new tab)":
   `grep -c 'opens in a new tab' dist/index.html` should drop by 13 versus the
   previous build, and no `<h3 class="case-row__title">` or
   `<h3 class="card__title">` should contain the phrase.

### Provenance of the findings

Because I could not execute anything, it matters where each claim came from:

- **Verified by me, from the built HTML in the repo:** everything in §1 and §1b,
  the 13 polluted project headings (`dist/index.html` lines 294, 315, 336, 371…),
  the missing `robots.txt`/`sitemap.xml`/JSON-LD, the OG image being a client
  screenshot with a mismatched alt, and the duplicated `h1` text.
- **Reached independently, then corroborated against the spec:** the robots.txt
  subpath problem. I wrote §4 before it was raised by the AEO agent, and then
  confirmed it against **RFC 9309 §2.3**, quoted in that section, rather than
  taking either my own reasoning or another agent's word for it.
- **Accepted from the AEO agent without independent verification:** only that
  `public/llms.txt` is theirs to own. I did confirm the file exists and read its
  opening lines; I did not review or edit its contents.
- **Not verified by anyone yet:** that `npm run build` exits 0 with these
  changes. See the checklist above.

Then paste the built page into the **Rich Results Test** and the **Schema Markup
Validator** (https://validator.schema.org/). `ItemList`-of-`CreativeWork` is not
an eligible *rich result* type, so the Rich Results Test will report "no items
detected" — that is expected and not an error. The Schema Markup Validator is the
one that matters; it should show four top-level nodes and zero errors.

---

## 1. Audit — what was already right

Verified in the built HTML, not assumed. The frontend agent's work holds up:

| Item | Status |
|---|---|
| `<title>`, `<meta name="description">` | Present, single, non-empty |
| Open Graph (`type`, `site_name`, `locale`, `url`, `title`, `description`, `image`, `image:alt`) | Present |
| Twitter card (`summary_large_image` + title/description/image/image:alt) | Present |
| Favicon | Present, `public/favicon.svg`, correctly base-rewritten to `/WebPortfolio/favicon.svg` |
| `<link rel="canonical">` | Present and **absolute** — `https://beefbowl03.github.io/WebPortfolio/` |
| `<html lang="en">` | Correct |
| Renders with JS disabled | **Confirmed.** All 13 projects, all About paragraphs, all form fields are in the shipped HTML. Nothing is client-rendered. |
| Image `width`/`height` | Present on every `<img>`, from `public/images/manifest.json` — no CLS from images |
| `loading="lazy"` / `decoding="async"` | Present on every `<img>` |
| WebP with JPEG fallback | Present via `<picture>` on every image |
| Font preload | Injected by `preloadDisplayFont()` with the real hashed filename |
| Heading hierarchy | Valid. One `h1`; `h2` per section; `h3` for project titles, stack groups, contact sub-heads. No skipped levels. |
| Outbound link hygiene | Every external link has `rel="noopener noreferrer"` and a visually-hidden "(opens in a new tab)" |
| Anchor targets | Every nav/footer `href="#x"` has a matching `id` (`#top`, `#about`, `#skills`, `#projects`, `#contact`) |
| Skip link | Present, `#main` exists |

This is a genuinely well-built page. The gaps were all in the *machine-readable*
layer, not the rendering layer.

## 1b. Audit — what was actually missing

| Gap | Severity | Fixed? |
|---|---|---|
| **No structured data of any kind** — zero JSON-LD, zero microdata | High | ✅ |
| **No `robots.txt`** | Medium | ⚠️ shipped but **inert at this URL** — §4 |
| **All 13 project `h3`s extracted as `Title (opens in a new tab)`** | Medium | ✅ |
| No discovery tag for `public/llms.txt` | Low–Medium | ✅ §4c |
| **No `sitemap.xml`** | Medium | ✅ |
| **No `<meta name="robots">`** — page indexable by default, but not opted into large image previews or untruncated snippets | Medium | ✅ |
| Title/description not targeting the commercial intent — no "freelance", no "hire" | High | ✅ |
| `og:image` is a client-site screenshot, not a social card; no `og:image:width/height/type` | Medium | ⚠️ partly — see §6 |
| `og:image:alt` described a portfolio, but the image is a screenshot of one client store | Low | ✅ |
| Image alt text generic ("Domain Generator app", "Solitude Labs website") | Low–Medium | ✅ |
| No apple-touch-icon | Low | ❌ out of scope — see §7 |
| No Search Console property | High (measurement) | ❌ needs owner action — see §7 |

---

## 2. Title and meta description

**Before**

```
Celso Aquino — Web Developer | E-commerce & Internal Tools        (57 chars)
Web developer building Shopify and WordPress storefronts, React apps, and
internal tools. Shipped client work in the US, Australia, Belgium, and
South Africa.                                                    (157 chars)
```

**After**

```
Celso Aquino — Freelance Shopify & WordPress Developer            (54 chars)
Freelance Shopify and WordPress developer, four years in. 13 shipped
storefronts, React internal tools, and e-commerce builds. Available for
select projects.                                                 (157 chars)
```

Reasoning:

- **"Freelance" was missing entirely.** It is the single highest-intent
  qualifier for the commercial searches and it was nowhere in the head. A
  business searching "freelance Shopify developer" needs to see that word.
- **Named the two platforms in the title.** "E-commerce & Internal Tools" is
  how *he* thinks about the work; "Shopify" and "WordPress" is what buyers type.
  The name stays first because brand queries are the other half of the target
  and the name is the strongest entity signal on the page.
- **The description now closes.** "Available for select projects" is a CTA and
  an availability signal, both of which lift CTR on hiring queries. It reuses
  the site's own wording verbatim so it cannot overclaim.
- **"13 shipped storefronts"** — a specific number outperforms an adjective in a
  SERP snippet, and it is already the site's headline stat.
- Both are inside the truncation limits (~60 chars / ~155–160 chars). Google
  rewrites titles about 60% of the time regardless; the goal is to give it
  nothing worth rewriting.

The geography (US / Australia / Belgium / South Africa) was dropped from the
meta description to make room, and **kept in `ogDescription`**, which has no
length pressure and is read by humans on social, where the four-continent thing
is a credibility flex rather than a keyword.

`<meta name="keywords">` was left alone. Every major engine has ignored it since
roughly 2009. It is inert, not harmful, and removing it would be churn.

---

## 3. Structured data

Emitted as a single `@graph` in one `<script type="application/ld+json">`, built
by `buildJsonLd()` in `src/build/content.js`.

**It is generated from `content/copy.json`.** There is no second copy of the
content to fall out of sync — change a project title in the JSON and the schema
follows. This was the explicit requirement and it is the reason not to hand-write
JSON-LD into `index.html`.

Four nodes, cross-referenced by `@id`:

| `@id` | Type | What it does |
|---|---|---|
| `…/#person` | `Person` | The entity. `name`, `jobTitle`, `image`, `email`, `telephone`, `address` (country PH), `knowsAbout` (the rendered stack, deduped), `sameAs` (GitHub + LinkedIn), `contactPoint`. |
| `…/#website` | `WebSite` | Site-level node, `publisher` → Person. |
| `…/#webpage` | `WebPage` + `ProfilePage` | The document. `mainEntity` → Person, `hasPart` → the ItemList. |
| `…/#projects` | `ItemList` | 13 `ListItem`s wrapping a `CreativeWork` each. |

Why these choices:

- **`ProfilePage`** is the correct type for a page whose subject is one person.
  It is what tells Google "this page *is about* Celso Aquino" rather than "this
  page mentions him", which is the whole game for the brand/evaluative queries
  and for knowledge-panel eligibility down the line.
- **`sameAs` is the single most valuable property here.** GitHub and LinkedIn are
  the two corroborating profiles; `sameAs` is how the entity gets reconciled
  across them. The WhatsApp `wa.me` link is deliberately **not** in `sameAs` —
  it is a chat deep link, not a profile — it sits on `contactPoint` instead.
- **`CreativeWork`, not `SoftwareApplication`.** `SoftwareApplication` wants
  `offers` and `aggregateRating` to do anything useful, and neither exists.
  The four projects with a public repo get a second type,
  `["CreativeWork","SoftwareSourceCode"]`, plus `codeRepository` — which is
  accurate and costs nothing.
- Each `CreativeWork.url` points at the **live client site**, because that is the
  work being described. `creator` is an `@id` reference back to the Person, so
  all 13 works attribute to the same entity node rather than 13 detached copies.

**Deliberately excluded, because it would be fabrication:**
`aggregateRating`, `review`, `Organization`, `priceRange`, `foundingDate`,
`alumniOf`, employment history, and — note — `hasCredential`. `copy.json`
contains a `positioningPoints` entry reading "Certified web developer", but that
string is **not rendered on the page** and carries no issuer or credential name.
Marking it up would be both unverifiable and a description of something not on
the page. Left out.

Also excluded: `WebSite.potentialAction` / `SearchAction`. There is no site
search. Declaring a sitelinks searchbox that does not exist is a fabrication.

**Injection safety.** `serialiseJsonLd()` escapes `<`, `>` and `&` to their
`\uXXXX` JSON forms. Still valid JSON, but no copy string — a project title, an
About paragraph — can ever close the `</script>` element early. This matters
because the content is author-controlled JSON flowing straight into HTML.

---

## 4. robots.txt — SHIPPED BUT INERT

> **Do not count robots.txt as delivered crawl control.** At the current URL this
> file is **inert**. No crawl directive written in it is in force, and nobody
> should later assume otherwise. If you need to actually block or throttle a
> crawler on this site today, this file cannot do it — see the escape hatches at
> the end of this section.

`public/robots.txt` ships, and it is **advisory only at this path.**

This is normative, not folklore. **RFC 9309 §2.3 (Access Method):** *"The rules
MUST be accessible in a file named `/robots.txt` (all lowercase) in the top-level
path of the service."* The spec defines the URI as `scheme:[//authority]/robots.txt`
and says nothing about subdirectories, because there are none to say anything
about — the top-level path is the only location a crawler will request.

robots.txt is honoured **at the host root and nowhere else.** Crawlers fetch:

```
https://beefbowl03.github.io/robots.txt          ← the only one that counts
https://beefbowl03.github.io/WebPortfolio/robots.txt   ← never fetched, never obeyed
```

The host root is the GitHub **user page**, which is a different repo
(`BeefBowl03/BeefBowl03.github.io`) and may not exist at all. So:

- Nothing in this repo can change crawl rules for `beefbowl03.github.io`.
- In practice this is fine — the desired rule is "crawl everything", which is
  the default when no robots.txt is served.
- The file is shipped anyway because it costs nothing, documents intent, and
  becomes authoritative the instant a custom domain is attached.

**To control this for real** — the only three options:

1. Attach a custom domain. `public/robots.txt` becomes the root file and Just
   Works. This is the real fix, and it is item 3 in §7.
2. Create a `BeefBowl03/BeefBowl03.github.io` repo containing a root
   `robots.txt`. Note that this file then governs **every** repo published under
   `beefbowl03.github.io`, not just this one.
3. For per-page control that does not depend on robots.txt at all, use the
   `<meta name="robots">` tag — which this page now has (§1b). Meta robots is
   served with the document, so it is honoured regardless of path. **This is
   currently the only crawl directive on this site that is actually in force.**
   It says `index, follow`, which is what we want.

**Sitemap discovery does not depend on robots.txt here.** The `Sitemap:` line in
the shipped file is a no-op. The sitemap must be **submitted manually in Search
Console** — see §7 item 1. Do not treat the robots.txt line as the discovery
mechanism; it is documentation of intent, nothing more.

## 4b. sitemap.xml

`public/sitemap.xml` → served at
`https://beefbowl03.github.io/WebPortfolio/sitemap.xml`. A sitemap in a
subdirectory is valid for URLs at or below that path, so this is correct for the
subpath deployment and can be submitted as-is.

**One URL.** The site is a single document with in-page anchors. Fragments are
not separate URLs — a `<loc>` of `…/#projects` would be ignored or folded into
the canonical, so listing the anchors would inflate the file without adding one
indexable page. I did not invent URLs that do not exist.

`changefreq` and `priority` are omitted; Google has publicly stated it ignores
both. `lastmod` is the only consumed hint and is set to `2026-08-16` — **update
it when the page content materially changes**, or it degrades into a signal
Google learns to ignore.

## 4c. llms.txt discovery tag

`public/llms.txt` is written and owned by the AEO agent. **I did not edit it.**
What I added is the discovery tag in `<head>`, which is my file:

```html
<link rel="alternate" type="text/markdown" href="{{site.llmsTxt}}" title="llms.txt">
```

The token resolves to the **absolute** `https://beefbowl03.github.io/WebPortfolio/llms.txt`,
not a root-relative path, and that is deliberate. Vite's own `index.html` asset
rewriting runs *before* our `transformIndexHtml` hook, so writing
`href="/llms.txt"` would depend on Vite spotting and base-prefixing it, while
hand-writing `href="/WebPortfolio/llms.txt"` risks the
`/WebPortfolio/WebPortfolio/…` double-prefix the README warns about. An absolute
URL is unambiguous at every stage of the pipeline. It is also generated from the
same `SITE_URL` constant as the canonical, so it cannot drift if the domain
changes.

Precedent that this is safe: `<link rel="canonical" href="{{site.url}}">` already
uses an unsubstituted token in a `link[href]` and survives the build intact —
confirmed in the existing `dist/index.html`.

---

## 5. Headings, alt text, link text, anchors

**Heading structure — audited, correct.** One `h1`, `h2` per section, `h3` for
project titles / stack groups / contact sub-heads, no skipped levels, and the
`h3` inside `<template id="form-success-template">` is not part of the document
outline. Clean.

**Heading *text* — one real bug, fixed.** All 13 project headings extracted as:

```
CV Linens (opens in a new tab)
```

The visually-hidden "(opens in a new tab)" span sat **inside the anchor, inside
the `h3`**, so it became part of the heading's text content. Verified in the
built HTML (`dist/index.html` lines 294, 315, 336, 371, …) — this affected every
featured case row and every grid card, i.e. all 13 project titles, which are the
most semantically loaded strings on the page after the `h1`.

Fixed in `renderFeatured()` and `renderGrid()` in `src/build/content.js`: the
new-tab warning moved from an inline span to `aria-label` on the anchor. Heading
text content is now just `CV Linens`; the link still announces the new-tab
behaviour. The `NEWTAB` constant is unchanged and still used by the ledger,
mobile nav, social and "Source" links — those are **not** inside headings, where
the inline-span pattern is correct and was left alone.

One honest caveat: `aria-label` on a descendant still contributes to the
*heading's* accessible name under the accname spec, so a screen reader may still
read "CV Linens, opens in a new tab" for the heading. The win here is that the
**extracted text content** — what crawlers, AI extractors and the document
outline see — is now clean, and the link's own accessible name is correct. Fully
removing it from the heading's accname would mean restructuring the markup so the
anchor is not inside the `h3`, which changes the visual design and is not worth
it.

**Alt text — improved in `copy.json`.** The alts were accurate but thin
("Domain Generator app", "Solitude Labs website"). Each one now names the
platform and the domain, which is what makes an image findable and what makes
the alt useful to a screen reader:

- `Celso Aquino` → `Celso Aquino, freelance web developer`
- `Solitude Labs website` → `Solitude Labs cybersecurity WordPress site`
- `Basix Plastics Shopify store` → `Basix Plastics Shopify store for a South African homeware retailer`
- …and 11 more.

Every added fact is drawn from that project's own approved description. No
project description or About paragraph was rewritten.

**Link text — audited, no fix needed.** Project links use the project title as
anchor text, which is correct. The `Live site ↗` / `VIEW LIVE ↗` strings are
`aria-hidden` decorations, not links. The only weak text is `Visit ↗` in the
mobile nav's contact rows, and each is preceded by its own `<span>GITHUB</span>`
label in the same anchor, so the accessible name resolves to "GITHUB Visit" —
adequate, and inside a mobile panel that carries no ranking weight.

**Outbound links left `dofollow`.** 13 outbound links from a one-page site is a
lot of link equity leaving, and nofollowing them would retain it. I did not,
because these are genuine editorial references to real client work, they are the
*evidence* the page is built on, and cloaking them would be exactly the kind of
manipulation this site does not need.

**Not fixable in my scope, reported instead:**

- The `h1` contains its text **twice** — once in a `u-visually-hidden` span for
  screen readers, once in `aria-hidden` spans for the line-wipe animation. A
  crawler reads "I build storefronts and the tools that run behind them." twice
  in a row. Harmless, but untidy. Fixing it means restructuring the hero markup
  against `src/styles/` (not mine), and the animation depends on that structure.
  Low priority; I would leave it.
- The `h1` contains **no target keyword** — it is a positioning statement, not
  "Shopify developer". This is a real trade-off and the copy is client-approved,
  so I did not touch it. It is partly mitigated: the eyebrow directly above reads
  "WEB DEVELOPER — PHILIPPINES", the ticker names the platforms, and the title
  and description now carry the commercial terms. If rankings for
  *shopify developer* stall, the h1 is the first lever to revisit — **with the
  client**, not unilaterally.

### Declined: a keyword-bearing `hero.headlineAccessible`

It was proposed that I add a `hero.headlineAccessible` key so the `h1`'s
accessible text reads *"Celso Aquino — freelance Shopify and WordPress
developer"* without changing the visible display type. **I did not implement
this, and I recommend against it.**

The hero `h1` is built as an accessibility swap: the visible lines are in
`aria-hidden="true"` spans (they are chopped up for the line-wipe animation) and
a single `u-visually-hidden` span carries the real text. Today that hidden span
holds `hero.headlinePlain`, which is **character-for-character the visible
headline**. That is a textbook, legitimate use of the pattern: the hidden text is
an *equivalent* of the visible text.

The proposal changes it from an equivalent into an *augmentation* — hidden text
that says something more keyword-rich than what any user can see. That is the
definition of hidden text under Google's spam policies, and it is precisely the
technique the policy exists to catch. The fact that it sits in an `h1` (the
highest-weighted element on the page) makes it look more deliberate, not less.
It also runs straight into two of my own constraints for this job: no keyword
stuffing, and no copy changes that introduce claims outside the approved copy.

The payoff is small, too. Google has repeatedly said the `h1` is one signal among
many, and the exact string proposed is already on the page in visible form:
"CELSO AQUINO" in the header wordmark and footer, "WEB DEVELOPER — PHILIPPINES"
in the eyebrow immediately above the `h1`, "Shopify, WordPress, and React work
for clients in…" in the visible sub-headline, and now "Freelance Shopify &
WordPress Developer" in the `<title>`. The entity and the keywords are
established. Risking a hidden-text flag to restate them in a hidden span is a bad
trade.

**If the keyword genuinely needs to be in the `h1`, the correct fix is to make it
visible** — change `hero.headlineLines` so the displayed headline itself carries
the role. That is a client copy decision, not an SEO one, and it needs sign-off.
I have flagged it; I have not made it.
- **DOM order vs. numbering.** Sections render About(02) → Stack(03) →
  Work(01) → Contact(04). The eyebrow numbers imply Work is first but it is
  third in the DOM. Purely cosmetic for users; for crawlers it means the
  strongest evidence (13 client builds) sits below the About and Stack blocks.
  Not worth a layout change, but worth knowing.
- The decorative ticker repeats SHOPIFY / WORDPRESS / LIQUID / REACT twice
  (a seamless-marquee requirement). It is `aria-hidden`, but crawlers still read
  the text, so those terms appear 2× more than the visible design suggests. This
  is a legitimate design element, not stuffing, and I would not change it —
  logged so nobody later mistakes it for a manipulation attempt.

---

## 6. Social preview — an OG image is NOT in place

There is **no purpose-built social card.** `og:image` currently points at
`/WebPortfolio/images/building-controls.jpg` — a **screenshot of a client's
store**. It is not broken and it is not nothing, but as a share preview it is
wrong: someone shares Celso's portfolio and the card shows an HVAC parts
catalogue with no name, no role, and no branding on it.

What I did (within scope):

- `og:image` is now **resolved through `public/images/manifest.json`** instead of
  being a hardcoded string, so the newly added `og:image:width` (1400) and
  `og:image:height` (690) and `og:image:type` can never disagree with the real
  file.
- Fixed `og:image:alt`, which previously read "Celso Aquino — portfolio of
  shipped e-commerce builds" while pointing at a single client storefront. It now
  describes the image that is actually there.

What I did **not** do: generate an image, or touch anything in `public/images/`.
Both are out of my scope, and generating one would be the wrong call anyway —
this needs the design system, not a robot.

### Spec for whoever builds it

- **File:** `public/images/og-card.jpg` (or `.png`)
- **Dimensions:** exactly **1200 × 630** (1.91:1). Satisfies Facebook, LinkedIn,
  Slack, and Twitter `summary_large_image` with no cropping. The current
  1400×690 is 2.03:1 and gets edge-cropped on LinkedIn.
- **Weight:** under 300 KB. LinkedIn is unreliable above ~1 MB.
- **Must contain, legible at 300px wide** (that is the real render size in a
  Slack sidebar): the name **Celso Aquino**; the role **Freelance Shopify &
  WordPress Developer**; the URL or wordmark.
- **Design:** `docs/design-system.md` — ink `#0A0A0B` ground, lime `#D8FF3D`
  accent, Archivo display + IBM Plex Mono, same as the favicon.
- **No text smaller than ~24px** at 1200×630.

Then update `content.js`: change the `resolveImage('building-controls.jpg', …)`
call in `buildTokens()` to the new filename (run `npm run images` first so the
manifest knows about it). That is a one-line change; the width/height/type
tokens follow automatically.

**Also missing:** an `apple-touch-icon` (180×180 PNG). The SVG favicon covers
browsers; iOS home-screen bookmarks will fall back to a screenshot. Needs a
raster file in `public/`, so it is outside my scope. Low priority.

---

## 7. Open items requiring owner action

Ordered by impact.

1. **Set up Google Search Console.** Nothing in this document can be measured
   without it. A *Domain* property is impossible (no custom domain), so create a
   **URL-prefix** property for exactly
   `https://beefbowl03.github.io/WebPortfolio/`. Verify with the HTML meta tag
   method — send me the token and it goes in `index.html`; the file-upload method
   also works via `public/`. Then submit
   `https://beefbowl03.github.io/WebPortfolio/sitemap.xml` directly, since the
   robots.txt discovery route is unavailable (§4).
2. **Bing Webmaster Tools** — same property, imports from GSC in one click.
   Bing is also the index behind ChatGPT search, which matters more each quarter
   for "find me a Shopify developer" style prompts.
3. **Buy a domain.** This is the highest-leverage SEO action available and it is
   not a code change. `github.io` is on the Public Suffix List, so
   `beefbowl03.github.io` is treated as its own site — but the site lives on a
   *subpath* of it, sharing a host with every other repo he ever publishes.
   A `celsoaquino.dev`-style domain gives him: a root `robots.txt` that actually
   works, a cleaner canonical, a credible brand in the SERP, and somewhere to
   put a `/blog` later. Cost is ~$15/yr; GitHub Pages supports it natively and
   only `vite.config.js`'s `base` and `SITE_URL` in `content.js` need to change.
4. **Link acquisition — the real bottleneck.** The page is now technically
   correct, and technical correctness does not rank a brand-new zero-authority
   subpath. Realistic, white-hat, and available to him today:
   - Ask the four clients whose sites are live for a footer or "built by" credit
     link. This is normal, honest, and the highest-quality link he can get.
   - Complete GitHub and LinkedIn profiles with the portfolio URL (these are the
     two `sameAs` targets — they need to point back for the entity to reconcile).
   - Shopify Partners / Shopify Experts directory listing, if he qualifies.
   - Write up the CV Linens **app theme extensions vs. theme migration** approach
     as a public post. That is a genuinely under-documented problem with real
     search demand, he has first-hand experience of it, and it is the strongest
     E-E-A-T asset he could produce. It is also the one thing here that would
     earn links rather than ask for them.
5. **Expect a slow curve.** New site, no domain authority, no backlinks. Brand
   queries ("Celso Aquino") should land within 2–4 weeks of indexing.
   Competitive commercial terms ("freelance Shopify developer") will not rank on
   a subpath portfolio without items 3 and 4 above, and that is a 6–12 month
   story, not a 6-week one. Anyone promising otherwise is selling something.

---

## 8. Files changed

| File | Change |
|---|---|
| `content/copy.json` | `meta.siteTitle`, `meta.metaDescription`, `meta.ogTitle` rewritten for commercial intent; 14 `imageAlt` values enriched. **No project description, About paragraph, or other approved copy was touched.** |
| `index.html` | Added `<meta name="robots">`; `og:image:type` / `:width` / `:height`; the JSON-LD `<script>`; the `llms.txt` discovery `<link>`; comments on the canonical. |
| `src/build/content.js` | Added `buildJsonLd()`, `serialiseJsonLd()`, `prune()`, `abs()` and the `@id` constants. Registered tokens `meta.jsonLd`, `meta.ogImageType`, `meta.ogImageWidth`, `meta.ogImageHeight`, `site.llmsTxt`. Reworked `meta.ogImage` to resolve via the manifest. Corrected `meta.ogImageAlt`. Moved the new-tab warning out of the project `h3`s into `aria-label` in `renderFeatured()` and `renderGrid()`. |
| `public/robots.txt` | New. **Inert at this URL** — see §4. |
| `public/sitemap.xml` | New. One URL. |
| `docs/seo.md` | This file. |

Untouched, as required: `src/styles/`, `src/js/`, `src/main.js`,
`public/images/**`, `scripts/`, `vite.config.js`, `tailwind.config.js`,
`.github/`, `public/llms.txt`.
