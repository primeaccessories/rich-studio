/**
 * The pages the books open onto.
 *
 * When you press a sheet in the hero rail it opens like a book, and what
 * is inside is a capture of the case study page it is about to take you
 * to — the real header, the real hero, the real title. These are those
 * captures.
 *
 * THEY ARE BUILD OUTPUT COMMITTED TO THE REPO, and nothing regenerates
 * them automatically. If a case study's images, copy or layout change,
 * its book will keep opening onto the old page until you re-run this.
 *
 *   npm run build
 *   npx serve out -p 4325 &
 *   node scripts/capture-spreads.mjs
 *
 * WebGL is disabled deliberately: with it on, the case study hero is
 * mid-press-pass at capture time and the halftone gets baked into the
 * picture. Off, RegistrationHero shows its plain image, which is what the
 * page settles to anyway.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, unlinkSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SLUGS = [
  'silverstone', 'hellmanns', 'walls',
  'absolut', 'networkrail', 'strongbow',
];
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:4325';
const OUT = 'public/press/spread';

/* Captured at 1440, which is a compromise with a reason.

   This image is what the cinematic zooms to full screen, and it then
   hands over to the REAL page. A capture is a fixed layout; the page is
   responsive — so at a window far from the capture's width the two do not
   match, and the handover reads as a jump: the captured type is scaled by
   window/captureWidth while the real page has re-laid itself out. There
   is no scale that fixes that, because responsive is not the same as
   scaled.

   1440 is the middle of the desktop range, so the mismatch is smallest
   where most people are, and it is still 1.33x of a 1920 window rather
   than a soft upscale. Wider captures are sharper and match worse;
   narrower ones match more windows and blur on big screens. */
const W = 1440;
const H = 947;

const tmp = mkdtempSync(join(tmpdir(), 'spreads-'));
const manifest = {};

try {
  const browser = await chromium.launch({
    args: ['--disable-webgl', '--disable-webgl2'],
  });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  for (const slug of SLUGS) {
    const page = await ctx.newPage();
    await page.goto(`${ORIGIN}/work/${slug}`, { waitUntil: 'domcontentloaded' });

    /* The right HUD reads the VISITOR's location and their local time,
       ticking. Baking it into the capture would print one machine's clock
       into every book — so a reader in Tokyo would open a book and find
       London's time sitting in the corner, contradicting the live header
       right above it. A printed page has no clock; leave the corner
       empty. Everything else in the header captures as it is. */
    await page.addStyleTag({ content: '.hud-r { visibility: hidden !important; }' });

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const shot = join(tmp, `${slug}.png`);
    await page.screenshot({ path: shot });
    await page.close();

    // ~80KB each. Six of them load through idle time after the rail is
    // up, so this is weight the hero never waits on — but it is still
    // half a megabyte, which is why it is not full size.
    const tmpWebp = join(tmp, `${slug}.webp`);
    /* 1600, not 1216. The cinematic ends with this filling the window, so
       at 1216 a 1920-wide screen was upscaling it 1.58x and the page you
       land on looked soft. Quality drops a little to keep the weight
       roughly where it was. */
    execFileSync('convert', [
      shot, '-resize', '1440x947', '-strip',
      '-quality', '70', '-define', 'webp:method=6',
      tmpWebp,
    ]);

    /* Content-hashed filename, and this is load-bearing rather than tidy.
       At a stable name Cloudflare Pages kept serving the OLD capture from
       its edge long after a successful deploy — the deployment's own URL
       had the new bytes, the production alias did not, and there is no
       purge for a pages.dev alias. A new filename cannot be stale. */
    const bytes = readFileSync(tmpWebp);
    const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 8);
    const name = `${slug}-${hash}.webp`;

    for (const old of readdirSync(OUT)) {
      if (old.startsWith(`${slug}-`) || old === `${slug}.webp`) {
        unlinkSync(join(OUT, old));
      }
    }
    writeFileSync(join(OUT, name), bytes);
    manifest[slug] = `/press/spread/${name}`;
    console.log('captured', slug, '->', name);
  }

  await browser.close();

  // The rail reads this rather than guessing at filenames it cannot know.
  writeFileSync('content/spreads.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log('wrote content/spreads.json');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
