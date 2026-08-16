#!/usr/bin/env node
/**
 * optimize-images.mjs
 * -----------------------------------------------------------------------------
 * One-shot, re-runnable image pipeline for the portfolio.
 *
 *   SOURCE  assets-src/originals/**   (lossless masters, NOT published)
 *   OUTPUT  public/images/**          (optimized, published verbatim by Vite)
 *
 * This is deliberately NOT a Vite plugin. Images change roughly once per new
 * project; re-encoding 14 files on every `vite build` would cost seconds per
 * build forever to save a manual command a handful of times a year. Run this
 * when you add or replace a project screenshot, then commit the output.
 *
 *   npm run images
 *   npm run images -- --check     # verify committed output is in budget, no writes
 *
 * WHY THE ORIGINALS LIVE OUTSIDE public/
 * Vite copies `publicDir` into `dist/` verbatim. Anything under public/ ships.
 * The masters are ~14 MB of lossless PNG that no browser should ever be offered,
 * so they sit in assets-src/ at the repo root: tracked in git, never deployed.
 *
 * OUTPUT CONTRACT
 * Each source produces two files under public/images/:
 *   - <name>.webp   primary, served via <picture><source type="image/webp">
 *   - <name>.<ext>  fallback at the ORIGINAL canonical filename, so every
 *                   existing reference in content/copy.json keeps resolving
 *                   even if the markup is never upgraded to <picture>.
 * Transparency is the only thing that justifies a PNG fallback. Every source
 * here is photographic, so opaque masters get a mozjpeg fallback. When the
 * master was a .png, the canonical <name>.png is ALSO re-emitted (resized and
 * palette-quantized, still a real PNG) so that any reference still pointing at
 * the .png resolves instead of 404ing. Bytes on the wire come from the .webp.
 * -----------------------------------------------------------------------------
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'assets-src', 'originals');
const OUT_DIR = path.join(ROOT, 'public', 'images');

const CHECK_ONLY = process.argv.includes('--check');

const KB = 1024;

/**
 * PLAN
 *
 * `width`  - hard ceiling on output width. These render as cards in a grid and
 *            as case rows, never full-bleed. The widest layout slot is ~700 CSS
 *            px, so 1400 covers a 2x display with nothing to spare wasted.
 *            Small UI screenshots that were already modest stay modest.
 * `budget` - bytes the WEBP must come in under. The encoder walks quality down
 *            in steps until it fits, so a busy screenshot is compressed harder
 *            than a flat one instead of every file sharing one blunt quality.
 * `kind`   - 'photo'  : JPEG fallback, no transparency.
 *            'flat-ui': screenshot with large flat regions; PNG fallback is
 *                       competitive there, but JPEG still wins on these at the
 *                       sizes involved, so it is only a hint for min quality.
 */
const PLAN = [
  // Featured case rows - the widest slot on the page.
  { file: 'wedding.png',           width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'ps.png',                width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'presentrentals.png',    width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'lightglo.png',          width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'basix.png',             width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'cvlinens.png',          width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'linguista.png',         width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'gem.jpg',               width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'building-controls.jpg', width: 1400, budget: 150 * KB, kind: 'photo' },
  { file: 'solitudelabs.jpg',      width: 1400, budget: 150 * KB, kind: 'photo' },

  // App/tool screenshots - dark flat UI, cheap to encode, already small.
  { file: 'dashboard-app.png',     width: 1400, budget: 120 * KB, kind: 'flat-ui' },
  { file: 'domain.png',            width: 1400, budget: 120 * KB, kind: 'flat-ui' },
  { file: 'legal.png',             width: 1400, budget: 120 * KB, kind: 'flat-ui' },

  // Headshot - portrait, rendered in an about-section column, never wide.
  { file: 'photo.png',             width:  800, budget: 100 * KB, kind: 'photo' },
];

// Quality ladder, walked high-to-low until the budget is met. Floors are set so
// the search can never bottom out into visible blocking/banding: if a file
// cannot fit its budget at the floor, that is reported as a failure rather than
// silently shipping mush.
const WEBP_LADDER = [86, 82, 78, 75, 72, 70, 68, 66, 64, 62];
const JPEG_LADDER = [88, 85, 82, 80, 78, 76, 74, 72, 70];
const WEBP_FLOOR_NOTE = 62;

const fmtKB = (b) => `${(b / KB).toFixed(1)} KB`;

/** Resize pipeline shared by every encoder, so WebP and JPEG stay pixel-identical. */
function base(input, width) {
  return sharp(input, { failOn: 'error' })
    .rotate() // honour EXIF orientation before we drop the metadata
    .resize({
      width,
      // No `height`: aspect ratio is preserved and `withoutEnlargement` means a
      // source narrower than the ceiling is passed through at native size.
      withoutEnlargement: true,
      fit: 'inside',
      kernel: 'lanczos3',
    });
}

/** Encode at descending quality until the result fits `budget`. */
async function encodeToBudget(input, width, budget, ladder, encode) {
  let last = null;
  for (const quality of ladder) {
    const buf = await encode(base(input, width), quality);
    last = { buf, quality };
    if (buf.length <= budget) return { ...last, fitted: true };
  }
  return { ...last, fitted: false };
}

const encWebp = (p, q) =>
  p.webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();

const encJpeg = (p, q) =>
  p
    .jpeg({
      quality: q,
      progressive: true,      // meaningful perceived-load win at these sizes
      mozjpeg: true,          // better rate/distortion than libjpeg defaults
      chromaSubsampling: '4:2:0',
    })
    .toBuffer();

const encPng = (p) =>
  p.png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer();

async function hasAlpha(input) {
  const meta = await sharp(input).metadata();
  return Boolean(meta.hasAlpha) && meta.channels === 4;
}

/**
 * True if the alpha channel actually varies. A great many PNGs carry a fully
 * opaque alpha channel purely because the tool that wrote them always does;
 * treating those as transparent would force a PNG fallback and cost ~10x.
 */
async function usesTransparency(input) {
  if (!(await hasAlpha(input))) return false;
  const { data, info } = await sharp(input)
    .resize(200, 200, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = info.channels - 1; i < data.length; i += info.channels) {
    if (data[i] < 250) return true;
  }
  return false;
}

async function run() {
  if (!existsSync(SRC_DIR)) {
    console.error(`\n  Source directory missing: ${path.relative(ROOT, SRC_DIR)}`);
    console.error('  Originals must live there. Nothing to do.\n');
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  const planned = new Set(PLAN.map((p) => p.file));
  const onDisk = (await readdir(SRC_DIR)).filter((f) => !f.startsWith('.'));
  const unplanned = onDisk.filter((f) => !planned.has(f));

  const rows = [];
  const failures = [];
  let srcTotal = 0;
  let outTotal = 0;

  for (const item of PLAN) {
    const srcPath = path.join(SRC_DIR, item.file);
    if (!existsSync(srcPath)) {
      failures.push(`missing source: ${item.file}`);
      continue;
    }

    const input = await readFile(srcPath);
    const meta = await sharp(input).metadata();
    srcTotal += input.length;

    const stem = item.file.replace(/\.[^.]+$/, '');
    const transparent = await usesTransparency(input);

    // --- WebP (primary) ------------------------------------------------------
    const webp = await encodeToBudget(input, item.width, item.budget, WEBP_LADDER, encWebp);
    if (!webp.fitted) {
      failures.push(
        `${item.file}: WebP ${fmtKB(webp.buf.length)} exceeds budget ${fmtKB(item.budget)} ` +
          `even at quality ${WEBP_FLOOR_NOTE} - lower the width rather than the quality`
      );
    }

    // --- Fallback ------------------------------------------------------------
    // Transparency is the only reason to keep PNG. Everything else is
    // photographic and gets mozjpeg, which beats PNG by an order of magnitude.
    let fallbackName;
    let fallbackBuf;
    let fallbackQuality;

    if (transparent) {
      fallbackName = `${stem}.png`;
      fallbackBuf = await encPng(base(input, item.width));
      fallbackQuality = 'png/palette';
    } else {
      // The fallback keeps the ORIGINAL canonical extension so that existing
      // references (content/copy.json, any un-migrated markup) resolve without
      // edits. If the master was a .png we still emit a .jpg alongside it for
      // clean <picture> markup, and the .png is written as a real PNG.
      const jpeg = await encodeToBudget(input, item.width, item.budget, JPEG_LADDER, encJpeg);
      if (!jpeg.fitted) {
        failures.push(
          `${item.file}: JPEG ${fmtKB(jpeg.buf.length)} exceeds budget ${fmtKB(item.budget)}`
        );
      }
      fallbackName = `${stem}.jpg`;
      fallbackBuf = jpeg.buf;
      fallbackQuality = `q${jpeg.quality}`;
    }

    const outputs = [
      { name: `${stem}.webp`, buf: webp.buf, quality: `q${webp.quality}` },
      { name: fallbackName, buf: fallbackBuf, quality: fallbackQuality },
    ];

    // ---- Legacy safety net --------------------------------------------------
    // content/copy.json still names these files with their original extension
    // (`basix.PNG`, `dashboard app.PNG`, ...). Until the markup is switched to
    // <picture> + the .webp/.jpg pair, a reference to `basix.png` must not 404.
    //
    // A palette PNG of a photograph cannot reach the byte budget at full width
    // without visible banding, so the compat copy trades RESOLUTION for size
    // instead of colour depth: step the width down until it fits. The result is
    // soft on a 2x display, which is correct -- this file is a fallback of last
    // resort and should stop being fetched the moment the markup is updated.
    const canonical = item.file;
    if (!outputs.some((o) => o.name === canonical)) {
      let buf = null;
      let usedWidth = item.width;
      for (const w of [item.width, 1100, 900, 760, 640, 540, 460, 400]) {
        if (w > item.width) continue;
        buf = await encPng(base(input, w));
        usedWidth = w;
        if (buf.length <= item.budget) break;
      }
      if (buf.length > item.budget) {
        failures.push(
          `${item.file}: compat PNG ${fmtKB(buf.length)} exceeds budget ${fmtKB(item.budget)}`
        );
      }
      outputs.push({ name: canonical, buf, quality: `png/compat @${usedWidth}w` });
    }

    const dims = await sharp(webp.buf).metadata();

    for (const out of outputs) {
      if (!CHECK_ONLY) await writeFile(path.join(OUT_DIR, out.name), out.buf);
      outTotal += out.buf.length;
    }

    rows.push({
      source: item.file,
      srcBytes: input.length,
      srcDims: `${meta.width}x${meta.height}`,
      outDims: `${dims.width}x${dims.height}`,
      outputs,
      // What a browser actually downloads: the WebP, or the fallback if not.
      servedWebp: webp.buf.length,
      servedFallback: fallbackBuf.length,
      webpQuality: webp.quality,
      fallbackQuality,
    });
  }

  // A machine-readable map so markup can resolve a legacy name from
  // content/copy.json onto the optimized pair without hardcoding a table.
  // Lives in public/images so it is importable at build time and trivially
  // fetchable at runtime; it is ~1 KB.
  const manifest = {
    $comment:
      'Generated by scripts/optimize-images.mjs. Do not edit by hand. Keys are the ' +
      'legacy filenames used in content/copy.json (lowercased, spaces -> hyphens). ' +
      'Use `webp` in a <picture><source>, `fallback` in the <img src>. `compat` is a ' +
      'reduced-resolution PNG kept only so un-migrated .png references do not 404.',
    generated: new Date().toISOString().slice(0, 10),
    basePath: '/images/',
    images: Object.fromEntries(
      rows.map((r) => {
        const stem = r.source.replace(/\.[^.]+$/, '');
        const find = (ext) => r.outputs.find((o) => o.name.endsWith(ext));
        const fb = r.outputs.find((o) => /\.(jpg|png)$/.test(o.name) && o.name !== r.source)
          ?? r.outputs.find((o) => o.name === r.source);
        return [
          r.source,
          {
            webp: `${stem}.webp`,
            fallback: fb.name,
            compat: r.outputs.some((o) => o.name === r.source) ? r.source : null,
            width: Number(r.outDims.split('x')[0]),
            height: Number(r.outDims.split('x')[1]),
            bytes: { webp: find('.webp').buf.length, fallback: fb.buf.length },
          },
        ];
      })
    ),
  };
  if (!CHECK_ONLY) {
    await writeFile(
      path.join(OUT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n'
    );
  }

  report({ rows, srcTotal, outTotal, failures, unplanned });

  if (failures.length) process.exit(1);
}

function report({ rows, srcTotal, outTotal, failures, unplanned }) {
  const pad = (s, n) => String(s).padEnd(n);
  const lpad = (s, n) => String(s).padStart(n);

  console.log(`\n${CHECK_ONLY ? 'CHECK' : 'BUILD'}  assets-src/originals -> public/images\n`);
  console.log(
    pad('source', 24) + lpad('src', 11) + lpad('webp', 11) + lpad('q', 5) +
      lpad('fallback', 11) + lpad('q', 5) + '  ' + pad('dimensions', 22) + 'saved'
  );
  console.log('-'.repeat(106));

  for (const r of rows) {
    const saved = 100 - (r.servedWebp / r.srcBytes) * 100;
    console.log(
      pad(r.source, 24) +
        lpad(fmtKB(r.srcBytes), 11) +
        lpad(fmtKB(r.servedWebp), 11) +
        lpad(r.webpQuality, 5) +
        lpad(fmtKB(r.servedFallback), 11) +
        lpad(r.fallbackQuality, 5) +
        '  ' +
        pad(`${r.srcDims} -> ${r.outDims}`, 22) +
        `${saved.toFixed(1)}%`
    );
  }

  const servedWebpTotal = rows.reduce((a, r) => a + r.servedWebp, 0);
  const servedFallbackTotal = rows.reduce((a, r) => a + r.servedFallback, 0);

  console.log('-'.repeat(96));
  console.log(`originals (masters, not shipped)     ${fmtKB(srcTotal)}`);
  console.log(`shipped payload, WebP path           ${fmtKB(servedWebpTotal)}`);
  console.log(`shipped payload, fallback path       ${fmtKB(servedFallbackTotal)}`);
  console.log(`all files written to public/images   ${fmtKB(outTotal)}`);
  console.log(
    `\nreduction on the WebP path: ${(100 - (servedWebpTotal / srcTotal) * 100).toFixed(1)}%`
  );

  if (unplanned.length) {
    console.log(
      `\nNOTE  ${unplanned.length} file(s) in assets-src/originals are not in PLAN and were skipped:`
    );
    for (const f of unplanned) console.log(`      ${f}`);
    console.log('      Add an entry to PLAN in scripts/optimize-images.mjs to include them.');
  }

  if (failures.length) {
    console.log(`\nFAILED  ${failures.length} budget/source problem(s):`);
    for (const f of failures) console.log(`        ${f}`);
    console.log('');
  } else {
    console.log('\nAll outputs within budget.\n');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
