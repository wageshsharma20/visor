import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/wageshsharma/.gemini/antigravity/brain/f5e2eee6-3556-440b-8107-cf672c389495';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.events = [];
    this.consoleMessages = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Console.messageAdded') {
          this.consoleMessages.push(msg.params.message);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
          this.consoleMessages.push({ type: msg.params.type, text });
        }
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('--- Phase 1.5 Verification Script ---');

  // Launch headless Chrome
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=/tmp/visor-cdp-profile-' + Date.now(),
    ],
    { stdio: 'ignore' }
  );

  const cleanup = () => {
    try {
      chromeProcess.kill('SIGTERM');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  try {
    await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    console.log('Chrome CDP ready.');

    // Create a new tab for http://localhost:5173/__ui
    const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://localhost:5173/__ui`, {
      method: 'PUT',
    });
    const tabInfo = await newTabRes.json();
    const client = new CDPClient(tabInfo.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Console.enable');

    // Wait for page to load completely
    await sleep(1500);

    const widths = [1440, 1100, 768, 390];
    const results = [];

    for (const width of widths) {
      const height = width === 390 ? 844 : width === 768 ? 1024 : 900;
      console.log(`\nTesting viewport ${width}x${height}...`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 640,
      });

      // Allow ResizeObserver and layout to settle
      await sleep(500);

      // Scroll graph section into view
      await client.send('Runtime.evaluate', {
        expression: `
          const card = document.getElementById('section-node-graph');
          if (card) {
            card.scrollIntoView({ block: 'start', behavior: 'instant' });
          }
        `,
      });
      await sleep(500);

      const checkScript = `
        (() => {
          const canvas = document.querySelector('[data-graph-canvas="true"]');
          if (!canvas) return { error: 'GraphCanvas container not found' };

          const contRect = canvas.getBoundingClientRect();
          const borderLeft = canvas.clientLeft || 0;
          const borderTop = canvas.clientTop || 0;

          function getPortCenter(id) {
            const el = document.querySelector('[data-port-id="' + id + '"]');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              x: Math.round((r.left + r.width / 2 - (contRect.left + borderLeft) + canvas.scrollLeft) * 10) / 10,
              y: Math.round((r.top + r.height / 2 - (contRect.top + borderTop) + canvas.scrollTop) * 10) / 10,
            };
          }

          const camOutCenter = getPortCenter('cam-out');
          const hubInCenter = getPortCenter('hub-in');
          const hubOutCenter = getPortCenter('hub-out');
          const trackerInCenter = getPortCenter('tracker-in');

          const wire1Path = document.querySelector('[data-wire-from="cam-out"][data-wire-to="hub-in"]');
          const wire2Path = document.querySelector('[data-wire-from="hub-out"][data-wire-to="tracker-in"]');

          const wire1 = wire1Path ? {
            startX: parseFloat(wire1Path.getAttribute('data-start-x')),
            startY: parseFloat(wire1Path.getAttribute('data-start-y')),
            endX: parseFloat(wire1Path.getAttribute('data-end-x')),
            endY: parseFloat(wire1Path.getAttribute('data-end-y')),
          } : null;

          const wire2 = wire2Path ? {
            startX: parseFloat(wire2Path.getAttribute('data-start-x')),
            startY: parseFloat(wire2Path.getAttribute('data-start-y')),
            endX: parseFloat(wire2Path.getAttribute('data-end-x')),
            endY: parseFloat(wire2Path.getAttribute('data-end-y')),
          } : null;

          function dist(a, b) {
            if (!a || !b) return 999;
            return Math.hypot(b.x - a.x, b.y - a.y);
          }

          const distCamOut = wire1 ? dist(camOutCenter, { x: wire1.startX, y: wire1.startY }) : null;
          const distHubIn = wire1 ? dist(hubInCenter, { x: wire1.endX, y: wire1.endY }) : null;
          const distHubOut = wire2 ? dist(hubOutCenter, { x: wire2.startX, y: wire2.startY }) : null;
          const distTrackerIn = wire2 ? dist(trackerInCenter, { x: wire2.endX, y: wire2.endY }) : null;

          const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

          // Bounding box of graph card for clipped screenshot in page coordinates
          const cardEl = document.getElementById('section-node-graph') || canvas.closest('.rounded-card');
          const cardRect = cardEl ? cardEl.getBoundingClientRect() : contRect;
          const pageX = cardRect.left + window.scrollX;
          const pageY = cardRect.top + window.scrollY;

          return {
            camOutCenter,
            hubInCenter,
            hubOutCenter,
            trackerInCenter,
            wire1,
            wire2,
            distCamOut,
            distHubIn,
            distHubOut,
            distTrackerIn,
            hasOverflow,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            cardBox: {
              x: pageX,
              y: pageY,
              width: cardRect.width,
              height: cardRect.height,
            }
          };
        })()
      `;

      const evalRes = await client.send('Runtime.evaluate', {
        expression: checkScript,
        returnByValue: true,
      });

      const data = evalRes.result.value;
      console.log(`Port-to-wire distances at ${width}px:`);
      console.log(`  cam-out -> wire1 start: ${data.distCamOut?.toFixed(2)}px`);
      console.log(`  hub-in  -> wire1 end:   ${data.distHubIn?.toFixed(2)}px`);
      console.log(`  hub-out -> wire2 start: ${data.distHubOut?.toFixed(2)}px`);
      console.log(`  tracker -> wire2 end:   ${data.distTrackerIn?.toFixed(2)}px`);
      console.log(`  Horizontal overflow: ${data.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'} (${data.scrollWidth}px vs ${data.clientWidth}px)`);

      const maxDist = Math.max(data.distCamOut, data.distHubIn, data.distHubOut, data.distTrackerIn);
      const passed = maxDist <= 1.0 && !data.hasOverflow;
      results.push({ width, maxDist, passed });

      if (width === 1440 || width === 1100 || width === 390) {
        // Screenshot of the graph section
        const graphShot = await client.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: {
            x: data.cardBox.x,
            y: data.cardBox.y,
            width: data.cardBox.width,
            height: data.cardBox.height,
            scale: 1,
          },
        });
        const graphFile = path.join(ARTIFACT_DIR, `graph_section_${width}.png`);
        fs.writeFileSync(graphFile, Buffer.from(graphShot.data, 'base64'));
        console.log(`Saved screenshot: ${graphFile}`);

        // Viewport screenshot with graph section scrolled in
        const fullShot = await client.send('Page.captureScreenshot', { format: 'png' });
        const fullFile = path.join(ARTIFACT_DIR, `ui_review_v3_${width}.png`);
        fs.writeFileSync(fullFile, Buffer.from(fullShot.data, 'base64'));
        console.log(`Saved screenshot: ${fullFile}`);
      }
    }

    // Test Prefers-Reduced-Motion Emulation
    console.log('\nTesting prefers-reduced-motion emulation...');
    await client.send('Emulation.setEmulatedMedia', {
      media: '',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await sleep(400);

    const reducedRes = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const animateMotionCount = document.querySelectorAll('animateMotion').length;
          const pulseDotsCount = document.querySelectorAll('[data-wire-pulse]').length;
          return { animateMotionCount, pulseDotsCount };
        })()
      `,
      returnByValue: true,
    });
    console.log('Reduced motion check:', reducedRes.result.value);

    // Check Console Messages
    console.log('\nChecking console messages...');
    const warnings = client.consoleMessages.filter(
      (m) => m.type === 'warning' || m.level === 'warning'
    );
    const errors = client.consoleMessages.filter(
      (m) => m.type === 'error' || m.level === 'error'
    );

    console.log(`Console warnings: ${warnings.length}`);
    if (warnings.length > 0) {
      console.warn('Warnings:', warnings);
    }
    console.log(`Console errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }

    client.close();
    chromeProcess.kill('SIGTERM');

    const allPassed =
      results.every((r) => r.passed) &&
      reducedRes.result.value.animateMotionCount === 0 &&
      warnings.length === 0 &&
      errors.length === 0;

    console.log('\n=======================================');
    console.log(`Overall Verification: ${allPassed ? 'ALL PASS' : 'FAILED'}`);
    console.log('=======================================');

    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification error:', err);
    cleanup();
    process.exit(1);
  }
}

main();
