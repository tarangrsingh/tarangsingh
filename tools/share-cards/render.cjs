// Renders the share cards (the 1200 x 630 images shown when a page's link is shared) into assets/share/.
// Each page's <head> points its og:image / twitter:image at one of these files.
//
//   node tools/share-cards/render.cjs            (from the repository root; needs Playwright: npm i -D playwright)
//
// Run it again after adding a Quote of the Week: the star card always shows the newest quote in star.html.
// CHROMIUM_PATH can point at a Chromium binary if Playwright's own browser is not installed.
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'share');

// The newest quote, read from the QUOTES list in star.html (its last entry)
function latestQuote() {
  const src = fs.readFileSync(path.join(ROOT, 'star.html'), 'utf8');
  const all = [...src.matchAll(/\{\s*week:\s*(\d+),\s*year:\s*(\d+),\s*text:\s*("(?:[^"\\]|\\.)*"),\s*cite:\s*("(?:[^"\\]|\\.)*")/g)];
  if (!all.length) throw new Error('No quotes found in star.html');
  const m = all[all.length - 1];
  return { week: +m[1], year: +m[2], text: JSON.parse(m[3]), cite: JSON.parse(m[4]) };
}

// Titles and subtitles are the pages' own; backgrounds and their framing match each page's photo
const CARDS = [
  { page: 'home', title: 'Tarang Singh', lede: 'IIT (BHU), Varanasi · M.Sc. in Physics', bg: 'bg-qchip.jpg', pos: '70% 40%' },
  { page: 'research', title: 'Research Experience', lede: 'The labs I have worked in, and what I did there.', bg: 'bg-26e2d7b5.jpg', pos: '82% 32%' },
  { page: 'scholastic', title: 'Scholastic Achievements', lede: 'Entrance-exam ranks and the academic path so far.', bg: 'bg-416785b6.jpg', pos: '80% 35%' },
  { page: 'contact', title: 'Contact me', bg: 'bg-26e2d7b5.jpg', pos: '30% 60%' },
  { page: 'ideas', title: 'Ideas', lede: 'Still under construction', bg: 'bg-fa5bc326.jpg', pos: '72% 40%' },
  { page: 'star', title: 'Quote of the Week', quote: latestQuote(), bg: 'bg-416785b6.jpg', pos: '80% 20%' },
  { page: 'theoretical-models', title: 'Theoretical Models', lede: 'Site under construction' }
];

const TYPES = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('Playwright is needed: npm i -D playwright (or set NODE_PATH to a global install).'); process.exit(1); }
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  fs.mkdirSync(OUT, { recursive: true });
  for (const card of CARDS) {
    await page.goto(base + '/tools/share-cards/card.html');
    await page.evaluate(c => window.renderCard(c), card);
    await page.evaluate(() => Promise.all([document.fonts.ready].concat([...document.images].map(i => i.decode().catch(() => {})))));
    await page.waitForFunction(() => [...document.querySelectorAll('.bg')].every(el => {
      const u = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/); if (!u) return true;
      const img = new Image(); img.src = u[1]; return img.complete;
    }));
    await page.screenshot({ path: path.join(OUT, card.page + '.jpg'), type: 'jpeg', quality: 84 });
    console.log('assets/share/' + card.page + '.jpg');
  }
  await browser.close();
  server.close();
})().catch(e => { console.error(e); server.close(); process.exit(1); });
