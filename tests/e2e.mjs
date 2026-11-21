// End-to-end checks for the MINDED preview. Usage: node tests/e2e.mjs <baseURL> <screenshotPrefix>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = (process.argv[2] || 'http://127.0.0.1:8091').replace(/\/$/, '');
const PRE = process.argv[3] || 'local';
const SHOTS = '/workspace/minded/screenshots';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass: !!pass, info: String(info) }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };
const shot = (p, n) => p.screenshot({ path: `${SHOTS}/${PRE}-${n}.png` });
async function ctxPage(opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push(`HTTP ${r.status()} ${r.url()}`); });
  return { ctx, p, errs };
}
const T = async (name, fn) => { try { await fn(); } catch (e) { ok(name, false, e.message.split('\n')[0]); } };
const nav = (p) => p.evaluate(() => { const n = window.__minded.nav; return { x: n.x, z: n.z, yaw: n.yaw, path: n.path.length, glide: !!n.glide }; });
const waitStill = async (p, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const n = await nav(p); if (!n.glide && !n.path) return; await p.waitForTimeout(200); } };
const place = (p, x, z, yaw = 0, pitch = 0) => p.evaluate(([x, z, yaw, pitch]) => { const n = window.__minded.nav; n.glide = null; n.path = []; n.x = x; n.z = z; n.yaw = yaw; n.pitch = pitch; }, [x, z, yaw, pitch]);

/* ---------------- DESKTOP ---------------- */
{
  const { ctx, p, errs } = await ctxPage();
  await T('intro', async () => {
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('[data-testid=intro]', { timeout: 5000 });
    await p.waitForTimeout(1900);
    await shot(p, 'd01-intro');
    ok('Intro shows MINDED and tagline', (await p.textContent('[data-testid=intro]')).includes('Saboteur'));
    await p.click('[data-testid=skip-intro]');
    await p.waitForSelector('[data-testid=intro]', { state: 'detached', timeout: 3000 });
    ok('Skip intro dismisses intro', true);
    await p.waitForTimeout(500);
    await shot(p, 'd02-home');
    const links = await p.$$eval('[data-testid^=home-link-]', (a) => a.map((x) => x.textContent));
    ok('Home links: Enter Gallery, Selected Works, About, Archive, Contact', ['Enter Gallery', 'Selected Works', 'About MINDED', 'Archive', 'Contact'].every((l) => links.some((t) => t.includes(l))), links.length + ' links');
    await p.reload({ waitUntil: 'networkidle' });
    ok('Intro not repeated within the session', !(await p.isVisible('[data-testid=intro]')));
  });
  await T('nav', async () => {
    const pages = [['/works/', 'Works'], ['/gallery/?view=2d', 'First Rooms'], ['/archive/', 'The Archive'], ['/literature/', 'Literature'], ['/about/', 'Saboteur'], ['/contact/', 'Correspondence']];
    for (const [u, h] of pages) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const h1 = await p.textContent('h1');
      ok(`Page ${u} renders`, h1 && h1.includes(h), h1?.trim());
    }
    // header navigation by click
    await p.goto(BASE + '/about/', { waitUntil: 'networkidle' });
    await p.click('header nav >> text=Works');
    await p.waitForURL(/\/works\/?$/);
    ok('Header link navigates (About → Works)', true);
  });
  await T('filters', async () => {
    await p.goto(BASE + '/works/', { waitUntil: 'networkidle' });
    await shot(p, 'd03-works');
    const counts = {};
    for (const f of ['all', 'photography', 'installation', 'mixed-media', 'digital-art', 'sculpture', 'in-development']) {
      await p.click(`[data-testid=filter-${f}]`);
      await p.waitForTimeout(150);
      counts[f] = await p.$$eval('[data-testid=artwork-card]', (c) => c.length);
    }
    ok('Filters change the catalogue', counts.all === 8 && counts.photography === 4 && counts.installation === 2 && counts.sculpture === 0 && counts['in-development'] === 7, JSON.stringify(counts));
    await p.click('[data-testid=filter-sculpture]');
    ok('Empty category shows honest empty state', await p.isVisible('[data-testid=empty-filter]'));
    await p.click('[data-testid=filter-all]');
    const broken = await p.$$eval('img', (i) => i.filter((x) => x.complete && x.naturalWidth === 0).map((x) => x.src));
    ok('No broken images on Works', broken.length === 0, broken.join(','));
  });
  await T('artwork pages', async () => {
    const slugs = ['aura-001', 'lonely', 'lonely-golden-sun', 'justice', 'justice-vinyl-edition', 'shades-of', 'shades-of-green', 'black-and-gold', '15-shades-of-green'];
    let good = 0; const bad = [];
    for (const s of slugs) {
      await p.goto(`${BASE}/works/${s}/`, { waitUntil: 'networkidle' });
      const title = await p.title();
      const desc = await p.getAttribute('meta[name=description]', 'content');
      const og = await p.getAttribute('meta[property="og:title"]', 'content');
      const label = await p.isVisible('[data-testid=artwork-label]');
      const broken = await p.$$eval('img', (i) => i.filter((x) => x.complete && x.naturalWidth === 0).length);
      if (title.includes('MINDED') && desc && og && label && broken === 0) good++; else bad.push(s);
      if (s === 'lonely') await shot(p, 'd04-artwork-lonely');
      if (s === 'aura-001') { await shot(p, 'd05-artwork-aura'); const t = await p.textContent('[data-testid=aura-in-development]'); ok('AURA page: voice not finished, music designed not built', /Not finished/.test(t) && /Designed but not built/.test(t)); }
      if (s === 'justice') { ok('JUSTICE: rights note shown, no JUSTICE image published', (await p.isVisible('[data-testid=rights-note]')) && (await p.$$eval('img', (i) => i.filter((x) => /justice/.test(x.src)).length)) === 0); await shot(p, 'd06-artwork-justice'); }
      if (s === 'shades-of') ok('SHADES OF: six studies individually linked', (await p.$$eval('[data-testid=series-item]', (x) => x.length)) === 6);
    }
    ok('Artwork pages have title, meta description, OG tags, label, no broken images', good === slugs.length, bad.join(','));
    await p.goto(`${BASE}/works/lonely/`, { waitUntil: 'networkidle' });
    await p.click('[data-testid=enquire]');
    await p.waitForURL(/contact/);
    await p.waitForFunction(() => document.querySelector('[data-testid=message]')?.value.includes('LONELY'), null, { timeout: 5000 }).catch(() => {});
    ok('Enquire leads to Contact with the work pre-filled', (await p.inputValue('[data-testid=message]')).includes('LONELY'));
    ok('Contact does not pretend to send', (await p.isDisabled('[data-testid=submit]')) && (await p.textContent('[data-testid=form-notice]')).includes('Phase 3'));
    const opts = await p.$$eval('[data-testid=enquiry-type] option', (o) => o.map((x) => x.textContent));
    ok('Enquiry types dropdown', opts.length === 6, opts.join(' | '));
    await p.goto(`${BASE}/literature/`, { waitUntil: 'networkidle' });
    ok('Literature: manuscript in development, not published', (await p.textContent('[data-testid=lit-status]')).includes('not published'));
    await p.goto(`${BASE}/archive/`, { waitUntil: 'networkidle' });
    await shot(p, 'd07-archive');
    ok('No broken images on Archive', (await p.$$eval('img', (i) => i.filter((x) => x.complete && x.naturalWidth === 0).length)) === 0);
  });
  await T('gallery', async () => {
    await p.goto(BASE + '/gallery/', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__minded && window.__minded.ui.getState().ready, null, { timeout: 90000 });
    await p.waitForTimeout(1200);
    await shot(p, 'd08-gallery-start');
    await p.click('[data-testid=start-free]');
    await p.waitForTimeout(1500);
    await shot(p, 'd09-gallery-entrance');
    // walk forward with W
    const a = await nav(p);
    await p.keyboard.down('w'); await p.waitForTimeout(1500); await p.keyboard.up('w');
    const bpos = await nav(p);
    ok('WASD walking moves the visitor', a.z - bpos.z > 1.5, `z ${a.z.toFixed(2)} → ${bpos.z.toFixed(2)}`);
    // collisions: walk into feature wall
    await place(p, 0, -5, 0);
    await p.keyboard.down('w'); await p.waitForTimeout(3500); await p.keyboard.up('w');
    let c = await nav(p);
    ok('Collision: cannot walk through the entrance feature wall', c.z > -9.3, `stopped at z=${c.z.toFixed(2)}`);
    // side wall
    await place(p, 4, -9, -Math.PI / 2);
    await p.keyboard.down('w'); await p.waitForTimeout(4000); await p.keyboard.up('w');
    c = await nav(p);
    ok('Collision: cannot walk through curved side walls', c.x < 10.6 && c.x > 8, `stopped at x=${c.x.toFixed(2)}`);
    // partition (away from door)
    await place(p, 6, -15, 0);
    await p.keyboard.down('w'); await p.waitForTimeout(3000); await p.keyboard.up('w');
    c = await nav(p);
    ok('Collision: cannot walk through partition walls', c.z > -17.85, `stopped at z=${c.z.toFixed(2)}`);
    // through the door
    await place(p, 0, -15, 0);
    await p.keyboard.down('w'); await p.waitForTimeout(3000); await p.keyboard.up('w');
    c = await nav(p);
    ok('Doorways are walkable (Entrance → Room 01)', c.z < -19 && (await p.textContent('[data-testid=room-name]')).includes('01'), `z=${c.z.toFixed(2)}`);
    // drag to look
    const y0 = (await nav(p)).yaw;
    await p.mouse.move(700, 450); await p.mouse.down(); await p.mouse.move(900, 450, { steps: 8 }); await p.mouse.up();
    ok('Drag to look rotates the view', Math.abs((await nav(p)).yaw - y0) > 0.3);
    // click to walk
    await place(p, 0, -22, 0, -0.35);
    await p.waitForTimeout(300);
    await p.mouse.click(720, 700);
    await p.waitForTimeout(200);
    const cw = await nav(p);
    await p.waitForTimeout(2500);
    const cw2 = await nav(p);
    ok('Click-to-walk on the floor', cw.path > 0 || cw2.z < -22.3, `z → ${cw2.z.toFixed(2)}`);
    // room transitions via menu
    await p.click('[data-testid=rooms-btn]');
    await p.click('[data-testid=room-item-3]');
    await p.waitForTimeout(1200);
    ok('Rooms menu moves between rooms', (await p.textContent('[data-testid=room-name]')).includes('03'));
    await shot(p, 'd10-room03');
    // open a work by clicking it in the 3D scene (LONELY)
    const h = await p.evaluate(() => window.__minded.hangs.find((x) => x.id.includes(':lonely:')));
    await p.evaluate((h) => { const n = window.__minded.nav; n.glide = null; n.path = []; n.x = h.view.x; n.z = h.view.z; const dx = h.view.look[0] - n.x, dz = h.view.look[2] - n.z; n.yaw = Math.atan2(-dx, -dz); n.pitch = 0; }, h);
    await p.waitForTimeout(1500);
    await shot(p, 'd11-lonely-wall');
    await p.mouse.click(720, 450);
    await p.waitForSelector('[data-testid=detail-panel]', { timeout: 5000 });
    ok('Clicking a work in 3D opens its detail panel', (await p.textContent('#detail-title')) === 'LONELY');
    await shot(p, 'd12-detail-panel');
    await p.click('[data-testid=detail-image]');
    ok('Enlarged image view opens', await p.isVisible('[data-testid=lightbox]'));
    await shot(p, 'd13-lightbox');
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    ok('Esc closes the panel', !(await p.isVisible('[data-testid=detail-panel]')));
    // near prompt + E key
    await p.waitForTimeout(400);
    ok('Approaching a work shows a View prompt', await p.isVisible('[data-testid=near-prompt]'));
    await p.keyboard.press('e');
    await p.waitForSelector('[data-testid=detail-panel]', { timeout: 3000 });
    ok('E key opens the nearest work', true);
    await p.click('[data-testid=detail-close]');
    // guided mode
    await p.click('[data-testid=mode-btn]');
    await p.waitForSelector('[data-testid=tour-bar]');
    const t1 = await p.textContent('[data-testid=tour-title]');
    const p1 = await nav(p);
    await p.click('[data-testid=tour-next]'); await p.waitForTimeout(2600);
    await p.click('[data-testid=tour-next]'); await p.waitForTimeout(2600);
    const t2 = await p.textContent('[data-testid=tour-title]');
    const p2 = await nav(p);
    ok('Guided tour: Next moves between stops', t1 !== t2 && Math.hypot(p2.x - p1.x, p2.z - p1.z) > 0.5, `${t1} → ${t2}`);
    await shot(p, 'd14-guided');
    // jump to AURA via tour
    const ai = await p.evaluate(() => window.__minded.tour.findIndex((s) => s.title.includes('SIMULATION')));
    await p.evaluate((i) => window.__minded.goStop(i), ai); await p.waitForTimeout(2000); await waitStill(p);
    await shot(p, 'd15-aura-art');
    await p.click('[data-testid=mode-btn]');
    await p.waitForTimeout(400);
    await p.click('[data-testid=aura-toggle]');
    await p.waitForTimeout(7000);
    ok('AURA SIMULATION toggles to MIRROR', await p.evaluate(() => window.__minded.ui.getState().auraMirror));
    await shot(p, 'd16-aura-mirror');
    await p.click('[data-testid=aura-toggle]');
    // archive room
    await p.click('[data-testid=rooms-btn]'); await p.click('[data-testid=room-item-5]'); await p.waitForTimeout(1500);
    const arch = await p.evaluate(() => window.__minded.tour.findIndex((s) => s.title === 'The Archive'));
    await p.evaluate((i) => window.__minded.goStop(i), arch); await p.waitForTimeout(1500); await waitStill(p);
    await shot(p, 'd17-archive-room');
    // entrance directory
    await p.evaluate(() => window.__minded.goStop(2)); await p.waitForTimeout(1500); await waitStill(p);
    await shot(p, 'd18-directory');
    // sound toggle
    await p.click('[data-testid=sound-btn]');
    ok('Ambient sound toggle (off by default → on)', (await p.getAttribute('[data-testid=sound-btn]', 'aria-pressed')) === 'true');
    await p.click('[data-testid=sound-btn]');
    // 2D view
    await p.click('[data-testid=view-toggle]');
    await p.waitForSelector('[data-testid=gallery-2d]');
    await p.click('[data-testid=room2d-work] >> nth=0');
    ok('2D view lists rooms and opens works', await p.isVisible('[data-testid=detail-panel]'));
    await shot(p, 'd19-gallery-2d');
    await p.click('[data-testid=detail-close]');
    await p.click('[data-testid=return-home]');
    await p.waitForURL((u) => new URL(u).pathname.replace(/\/$/, '').endsWith('') && !/gallery/.test(u.toString()));
    ok('Return home button', !/gallery/.test(p.url()));
    // deep link from artwork page
    await p.goto(BASE + '/gallery/?work=black-and-gold', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__minded && window.__minded.ui.getState().ready, null, { timeout: 90000 });
    await p.click('[data-testid=start-free]');
    await p.waitForSelector('[data-testid=detail-panel]', { timeout: 8000 });
    ok('"View in gallery" deep link opens the work', (await p.textContent('#detail-title')) === 'BLACK & GOLD');
    const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
    ok('Frame rate measured (software renderer, informational)', true, `${fps.toFixed(0)} fps in headless SwiftShader`);
  });
  ok('Desktop: no console errors / failed requests', errs.length === 0, errs.slice(0, 5).join(' | '));
  await ctx.close();
}

/* ---------------- FALLBACK + REDUCED MOTION ---------------- */
await T('fallback', async () => {
  const { ctx, p } = await ctxPage();
  await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return g.call(this, t, ...a); }; });
  await p.goto(BASE + '/gallery/', { waitUntil: 'networkidle' });
  await p.waitForSelector('[data-testid=gallery-2d]', { timeout: 10000 });
  ok('No WebGL → 2D gallery with explanation', await p.isVisible('[data-testid=webgl-notice]'));
  await shot(p, 'd20-webgl-fallback');
  await ctx.close();
});
await T('reduced motion', async () => {
  const { ctx, p } = await ctxPage({ reducedMotion: 'reduce' });
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-testid=intro]');
  const t0 = Date.now();
  await p.waitForSelector('[data-testid=intro]', { state: 'detached', timeout: 4000 });
  ok('Reduced motion: intro shortened', Date.now() - t0 < 3000, `${Date.now() - t0} ms`);
  await ctx.close();
});
await T('intro auto', async () => {
  const { ctx, p } = await ctxPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const t0 = Date.now();
  await p.waitForSelector('[data-testid=intro]', { state: 'detached', timeout: 8000 });
  ok('Intro ends by itself (does not hold visitors)', Date.now() - t0 < 6000, `${Date.now() - t0} ms`);
  await ctx.close();
});

/* ---------------- MOBILE ---------------- */
for (const [name, vp, ua] of [['iphone', { width: 390, height: 844 }, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'], ['android', { width: 412, height: 915 }, 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36']]) {
  await T(`mobile ${name}`, async () => {
    const { ctx, p, errs } = await ctxPage({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: ua });
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1600);
    await shot(p, `m-${name}-01-intro`);
    await p.tap('[data-testid=skip-intro]');
    await p.waitForTimeout(1000);
    await shot(p, `m-${name}-02-home`);
    await p.tap('[data-testid=menu-toggle]');
    await p.tap('#mobile-nav >> text=Works');
    await p.waitForURL(/works/);
    await p.tap('[data-testid=filter-photography]');
    ok(`${name}: menu + works filter`, (await p.$$eval('[data-testid=artwork-card]', (c) => c.length)) === 4);
    await shot(p, `m-${name}-03-works`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(`${name}: no horizontal overflow on Works`, !overflow);
    await p.goto(BASE + '/works/aura-001/', { waitUntil: 'networkidle' });
    await shot(p, `m-${name}-04-artwork`);
    await p.goto(BASE + '/gallery/', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__minded && window.__minded.ui.getState().ready, null, { timeout: 90000 });
    await shot(p, `m-${name}-05-gallery-start`);
    await p.tap('[data-testid=start-guided]');
    await p.waitForSelector('[data-testid=tour-bar]');
    await p.tap('[data-testid=tour-next]'); await p.waitForTimeout(2600);
    await p.tap('[data-testid=tour-next]'); await p.waitForTimeout(2600);
    await p.tap('[data-testid=tour-next]'); await p.waitForTimeout(800);
    await p.tap('[data-testid=tour-next]'); await p.waitForTimeout(2800);
    ok(`${name}: guided tour works on touch`, (await p.textContent('[data-testid=tour-title]')).length > 0, await p.textContent('[data-testid=tour-title]'));
    await shot(p, `m-${name}-06-guided`);
    await p.tap('[data-testid=tour-view]');
    await p.waitForSelector('[data-testid=detail-panel]');
    await shot(p, `m-${name}-07-detail`);
    await p.tap('[data-testid=detail-close]');
    // free mode with joystick
    await p.tap('text=Exit tour');
    await p.waitForSelector('[data-testid=joystick]');
    const cdp = await ctx.newCDPSession(p);
    const jb = await p.$eval('[data-testid=joystick]', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const before = await nav(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jb.x, y: jb.y }] });
    for (let i = 1; i <= 5; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jb.x, y: jb.y - i * 10 }] }); await p.waitForTimeout(20); }
    await p.waitForTimeout(1500);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const after = await nav(p);
    ok(`${name}: touch joystick walks`, Math.hypot(after.x - before.x, after.z - before.z) > 0.8, `${Math.hypot(after.x - before.x, after.z - before.z).toFixed(2)} m`);
    // swipe to look
    const y0 = (await nav(p)).yaw;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 400 }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - i * 15, y: 400 }] }); await p.waitForTimeout(20); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(`${name}: swipe to look`, Math.abs((await nav(p)).yaw - y0) > 0.2);
    await shot(p, `m-${name}-08-free`);
    ok(`${name}: no console errors`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  });
}

await b.close();
fs.writeFileSync(`${SHOTS}/${PRE}-results.json`, JSON.stringify(results, null, 2));
const f = results.filter((r) => !r.pass);
console.log(`\n${results.length - f.length}/${results.length} passed`);
