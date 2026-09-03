/**
 * Simulates the iOS "short viewport" case the bottom nav has to survive: the OS
 * hands the page a viewport shorter than the screen, and whatever falls off the
 * bottom can only ever show the body background. The app is loaded in an iframe
 * sized to the viewport iOS would give, inside a page sized to the whole screen
 * and painted with the app's own body background — which is exactly what the
 * device does — then screenshotted per device so the strip is visible.
 *
 * Not part of the build; run by hand with:
 *   node scripts/check-nav-edge.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url).pathname;
const HARNESS = new URL('./harness/nav.html', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

// The harness lives outside dist (a build wipes it) and points at whatever
// stylesheet this build emitted, so it is always testing the shipped CSS.
const stylesheet = (await readdir(join(ROOT, 'assets'))).find(f => f.endsWith('.css'));
if (!stylesheet) throw new Error('no built stylesheet in dist/assets — run the build first');

const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  try {
    if (url === '/nav.html') {
      const html = await readFile(HARNESS, 'utf8');
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(html.replace('APP_CSS', `/assets/${stylesheet}`));
    }
    const path = join(ROOT, url);
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

// screen height, and the inset each of these actually loses off the bottom.
const DEVICES = [
  { name: 'iphone-15-pro-dynamic-island', w: 393, h: 852, lost: 47 },
  { name: 'iphone-13-mini-notch', w: 375, h: 812, lost: 44 },
  { name: 'iphone-se-flat-top', w: 375, h: 667, lost: 20 },
  { name: 'android-no-loss', w: 412, h: 915, lost: 0 },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const theme of ['light', 'dark']) {
  for (const d of DEVICES) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h } });
    await page.setContent(`<!doctype html><html><body style="margin:0">
      <iframe id="f" src="${base}/nav.html" style="border:0;width:${d.w}px;height:${d.h - d.lost}px;display:block"></iframe>
    </body></html>`);
    const frame = page.frames()[1] ?? page.frames()[0];
    await frame.waitForSelector('nav');
    await frame.evaluate(
      ({ lost, theme }) => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-surface', 'normal');
        if (lost > 0) {
          root.classList.add('viewport-short');
          root.style.setProperty('--edge-lost', `${lost}px`);
        }
      },
      { lost: d.lost, theme },
    );
    // The OS paints the leftover strip from the page's body background.
    const edge = await frame.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.evaluate(c => (document.body.style.background = c), edge);

    // Distances are reported from the bottom of the SCREEN, not the viewport:
    // the strip is the part of the bar the user sees but the page cannot reach,
    // so anything measured against the viewport flatters the result. A native
    // iOS tab bar is ~83pt of furniture with labels ~40pt off the screen edge.
    const box = await frame.evaluate(lost => {
      const nav = document.querySelector('nav');
      const r = nav.getBoundingClientRect();
      const label = nav.querySelector('.tab span').getBoundingClientRect();
      const tab = nav.querySelector('.tab').getBoundingClientRect();
      const cs = getComputedStyle(nav);
      const screenBottom = window.innerHeight + lost;
      return {
        furniture: Math.round(screenBottom - r.top),
        labelToScreenEdge: Math.round(screenBottom - label.bottom),
        tabHeight: Math.round(tab.height),
        navLeft: Math.round(r.left),
        radius: cs.borderRadius,
        borderWidths: `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`,
        navFill: cs.backgroundColor,
      };
    }, d.lost);
    console.log(
      `${theme.padEnd(5)} ${d.name.padEnd(30)} lost=${String(d.lost).padStart(2)}  ` +
        `barHeight=${String(box.furniture).padStart(3)}  labelToEdge=${String(box.labelToScreenEdge).padStart(2)}  ` +
        `tap=${box.tabHeight}  left=${box.navLeft}  r=${box.radius}  ` +
        `border=${box.borderWidths}  fill=${box.navFill}  strip=${edge}`,
    );
    await page.screenshot({ path: `/tmp/nav-${theme}-${d.name}.png` });
    await page.close();
  }
}

await browser.close();
server.close();
