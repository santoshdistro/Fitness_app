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

// Two ways an installed app loses height, and they are not interchangeable.
//
// black-translucent: the viewport starts at the top of the SCREEN and is short
// by the top inset, so `lostBelow` falls off the bottom where nothing can be
// drawn, and env(safe-area-inset-bottom) describes a screen we were not given.
//
// default: the viewport starts BELOW an opaque band, and reaches the bottom of
// the screen — so nothing is lost below and the bottom inset is real. This is
// what the app ships; the translucent rows stay because the layout still has to
// be correct on an older install that was added to the home screen under it.
const DEVICES = [
  { name: 'iphone-15-pro-dynamic-island', w: 393, h: 852, top: 47, bottom: 34 },
  { name: 'iphone-13-mini-notch', w: 375, h: 812, top: 44, bottom: 34 },
  { name: 'iphone-se-flat-top', w: 375, h: 667, top: 20, bottom: 0 },
];
const CASES = DEVICES.flatMap(d => [
  { ...d, mode: 'default', lostBelow: 0, safeBottom: d.bottom },
  { ...d, mode: 'translucent', lostBelow: d.top, safeBottom: 0 },
]).concat({
  name: 'browser-tab',
  w: 412,
  h: 915,
  mode: 'browser',
  lostBelow: 0,
  safeBottom: 0,
});

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const theme of ['light', 'dark']) {
  for (const d of CASES) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h } });
    // `default` puts its band ABOVE the viewport, so the frame is offset down by
    // it and loses nothing below; black-translucent starts at the screen top and
    // loses the same height off the bottom.
    const offset = d.mode === 'default' ? d.top : 0;
    await page.setContent(`<!doctype html><html><body style="margin:0">
      <iframe id="f" src="${base}/nav.html" style="border:0;width:${d.w}px;height:${d.h - offset - d.lostBelow}px;display:block;margin-top:${offset}px"></iframe>
    </body></html>`);
    const frame = page.frames()[1] ?? page.frames()[0];
    await frame.waitForSelector('nav');
    await frame.evaluate(
      ({ mode, safeBottom, theme }) => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-surface', 'normal');
        // env() cannot be set from script, so the inset is injected directly.
        root.style.setProperty('--safe-bottom', `${safeBottom}px`);
        if (mode !== 'browser') root.classList.add('standalone');
        if (mode === 'translucent') root.classList.add('viewport-short');
      },
      { mode: d.mode, safeBottom: d.safeBottom, theme },
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
    }, d.lostBelow);
    console.log(
      `${theme.padEnd(5)} ${d.mode.padEnd(11)} ${d.name.padEnd(30)} lostBelow=${String(d.lostBelow).padStart(2)}  ` +
        `barHeight=${String(box.furniture).padStart(3)}  labelToEdge=${String(box.labelToScreenEdge).padStart(2)}  ` +
        `tap=${box.tabHeight}  left=${box.navLeft}  r=${box.radius}  ` +
        `border=${box.borderWidths}  fill=${box.navFill}  strip=${edge}`,
    );
    await page.screenshot({ path: `/tmp/nav-${theme}-${d.mode}-${d.name}.png` });
    await page.close();
  }
}

await browser.close();
server.close();
