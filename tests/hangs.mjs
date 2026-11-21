import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://127.0.0.1:8091';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(URL + '/gallery/', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__minded && window.__minded.ui.getState().ready, null, { timeout: 90000 });
await p.click('[data-testid=start-free]');
const stops = await p.evaluate(() => window.__minded.tour.map((s, i) => ({ i, t: s.title })));
for (const s of stops) {
  await p.evaluate(i => { const m = window.__minded; const st = m.tour[i]; const n = m.nav; n.glide = null; n.x = st.x; n.z = st.z; const dx = st.look[0]-st.x, dz = st.look[2]-st.z; n.yaw = Math.atan2(-dx,-dz); n.pitch = Math.atan2(st.look[1]-1.6, Math.hypot(dx,dz)); }, s.i);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/workspace/minded/screenshots/stop-${String(s.i).padStart(2,'0')}.png` });
}
console.log(stops.map(s => s.i + ':' + s.t).join('\n')); console.log(errs.slice(0, 5));
await b.close();
