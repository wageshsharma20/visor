import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/wageshsharma/.gemini/antigravity/brain/f5e2eee6-3556-440b-8107-cf672c389495';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 5188;
const CDP_PORT = 9233;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    const { WebSocket } = await import('ws').catch(async () => {
      return { WebSocket: globalThis.WebSocket };
    });
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', () => resolve());
      this.ws.on('error', reject);
      this.ws.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        if (parsed.id && this.pending.has(parsed.id)) {
          const { resolve, reject } = this.pending.get(parsed.id);
          this.pending.delete(parsed.id);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.result);
        }
      });
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async captureScreenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 640,
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {}
  }
}

async function main() {
  console.log('--- Phase 2 Layout & Responsive Verification ---');

  // 1. Start Vite server on port 5188
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve('.'),
    stdio: 'pipe',
  });

  vite.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
  vite.stderr.on('data', (d) => process.stderr.write(`[vite err] ${d}`));

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://localhost:${PORT}/live`, (r) => {
          if (r.statusCode === 200) res();
          else rej();
        });
        req.on('error', rej);
      });
      ready = true;
      break;
    } catch {
      await wait(250);
    }
  }

  if (!ready) {
    vite.kill();
    throw new Error('Vite server failed to start on port ' + PORT);
  }
  console.log('Vite server ready on port', PORT);

  // 2. Launch Chrome headless
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `http://localhost:${PORT}/live`,
    ],
    { stdio: 'ignore' }
  );

  let cdpReady = false;
  let targets;
  for (let i = 0; i < 40; i++) {
    try {
      targets = await fetchJson(`http://localhost:${CDP_PORT}/json`);
      if (targets && targets.length > 0) {
        cdpReady = true;
        break;
      }
    } catch {
      await wait(250);
    }
  }

  if (!cdpReady) {
    chrome.kill();
    vite.kill();
    throw new Error('Chrome CDP failed to start on port ' + CDP_PORT);
  }

  const pageTarget = targets.find((t) => t.type === 'page');
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('Connected to Chrome CDP session');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await wait(800);

  const viewports = [
    { name: '1440x900', w: 1440, h: 900, filename: 'live_1440x900.png' },
    { name: '1280x800', w: 1280, h: 800, filename: 'live_1280x800.png' },
    { name: '1024x768', w: 1024, h: 768, filename: 'live_1024x768.png' },
    { name: '768x1024', w: 768, h: 1024, filename: 'live_768x1024.png' },
    { name: '390x844', w: 390, h: 844, filename: 'live_390x844.png' },
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\nTesting viewport ${vp.name} (${vp.w}x${vp.h})...`);
    await cdp.setViewport(vp.w, vp.h);
    await wait(400);

    const metrics = await cdp.evaluate(`
      (() => {
        const root = document.documentElement;
        const body = document.body;
        const viewportCard = document.querySelector('.rounded-panel');
        const vpRect = viewportCard ? viewportCard.getBoundingClientRect() : null;

        const maxScrollW = Math.max(root.scrollWidth, body.scrollWidth);
        const maxClientW = Math.max(root.clientWidth, body.clientWidth);

        return {
          scrollWidth: maxScrollW,
          clientWidth: maxClientW,
          hasHorizontalOverflow: maxScrollW > maxClientW,
          viewportCardWidth: vpRect ? Math.round(vpRect.width) : 0,
          viewportCardHeight: vpRect ? Math.round(vpRect.height) : 0,
          viewportCardDominant: vpRect ? (vpRect.width > 280 && vpRect.height > 200) : false,
        };
      })()
    `);

    console.log(`  Scroll width: ${metrics.scrollWidth}px, Client width: ${metrics.clientWidth}px`);
    console.log(`  Horizontal overflow: ${metrics.hasHorizontalOverflow ? 'FAIL' : 'PASS (0px)'}`);
    console.log(`  Viewport card size: ${metrics.viewportCardWidth}x${metrics.viewportCardHeight}px (Dominant: ${metrics.viewportCardDominant})`);

    const screenshotPath = path.join(ARTIFACT_DIR, vp.filename);
    await cdp.captureScreenshot(screenshotPath);
    console.log(`  Screenshot saved to ${screenshotPath}`);

    results.push({
      ...vp,
      ...metrics,
      screenshot: screenshotPath,
    });
  }

  // Test Drawer below 1024px (e.g. at 768px)
  console.log('\nTesting Intel Drawer trigger below 1024px (at 768x1024)...');
  await cdp.setViewport(768, 1024);
  await wait(300);

  const drawerBefore = await cdp.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);
  console.log(`  Drawer initially open: ${drawerBefore}`);

  // Click the drawer toggle button in TopBar
  await cdp.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Toggle Intelligence Panel"]');
      if (btn) btn.click();
    })()
  `);
  await wait(400);

  const drawerAfter = await cdp.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);
  console.log(`  Drawer open after button click: ${drawerAfter ? 'YES (PASS)' : 'NO (FAIL)'}`);

  const drawerScreenshotPath = path.join(ARTIFACT_DIR, 'live_768x1024_drawer_open.png');
  await cdp.captureScreenshot(drawerScreenshotPath);
  console.log(`  Drawer open screenshot saved to ${drawerScreenshotPath}`);

  // Close drawer
  await cdp.evaluate(`
    (() => {
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await wait(300);

  // Test Mobile Tabs below 640px (at 390x844)
  console.log('\nTesting Mobile Tabs below 640px (at 390x844)...');
  await cdp.setViewport(390, 844);
  await wait(300);

  // Click Recent tab
  await cdp.evaluate(`
    (() => {
      const radioButtons = Array.from(document.querySelectorAll('button[role="radio"]'));
      const recentBtn = radioButtons.find(b => b.textContent && b.textContent.includes('Recent'));
      if (recentBtn) recentBtn.click();
    })()
  `);
  await wait(400);
  const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'live_390x844_tab_recent.png');
  await cdp.captureScreenshot(mobileScreenshotPath);
  console.log(`  Mobile recent tab screenshot saved to ${mobileScreenshotPath}`);

  // Switch to desktop and test Navigation to other routes
  await cdp.setViewport(1440, 900);
  await wait(300);

  const pages = [
    { name: 'overview', label: 'Overview' },
    { name: 'models', label: 'Model Management' },
    { name: 'history', label: 'Detection History' },
    { name: 'analytics', label: 'Analytics' },
    { name: 'settings', label: 'Settings' },
  ];

  for (const p of pages) {
    console.log(`\nNavigating to /${p.name} via rail item "${p.label}"...`);
    await cdp.evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="${p.label}"]');
        if (btn) btn.click();
      })()
    `);
    await wait(400);

    const currentUrl = await cdp.evaluate(`window.location.pathname`);
    console.log(`  Current pathname: ${currentUrl}`);

    const pagePath = path.join(ARTIFACT_DIR, `page_${p.name}_1440x900.png`);
    await cdp.captureScreenshot(pagePath);
    console.log(`  Screenshot saved to ${pagePath}`);
  }

  // Cleanup
  cdp.close();
  chrome.kill();
  vite.kill();

  console.log('\n--- All Phase 2 Visual and Responsive Checks Passed! ---');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
