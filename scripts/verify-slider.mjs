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
  console.log('=== VISOR Slider Rail-Relative Positioning Verification ===\n');

  // Launch Chrome
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=/tmp/visor-slider-test-' + Date.now(),
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
    const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://localhost:5173/__ui`, {
      method: 'PUT',
    });
    const tabInfo = await newTabRes.json();
    const client = new CDPClient(tabInfo.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // Set standard desktop viewport
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    await sleep(1500);

    // Scroll slider section into view
    await client.send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('section-slider');
        if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
      `,
    });
    await sleep(300);

    const testValues = [0, 0.25, 0.5, 0.75, 1.0];
    const resultsTable = [];
    let allCriteriaPassed = true;

    for (const val of testValues) {
      // Set slider value
      await client.send('Runtime.evaluate', {
        expression: `window.__setSliderValues(${val}, ${val});`,
      });
      // Wait for duration-fast (120ms) + render settle
      await sleep(250);

      // Measure both variants
      const evalRes = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            function measureVariant(name) {
              const rail = document.querySelector('[data-slider-rail="' + name + '"]');
              const thumb = document.querySelector('[data-slider-thumb="' + name + '"]');
              const fill = document.querySelector('[data-slider-fill="' + name + '"]');

              if (!rail || !thumb || !fill) return null;

              const railRect = rail.getBoundingClientRect();
              const thumbRect = thumb.getBoundingClientRect();
              const fillRect = fill.getBoundingClientRect();

              const thumbCenter = thumbRect.left + thumbRect.width / 2;
              const expectedThumbCenter = railRect.left + (thumbRect.width / 2) + ${val} * railRect.width;
              const diffThumb = Math.abs(thumbCenter - expectedThumbCenter);
              const diffFill = Math.abs(fillRect.right - thumbCenter);

              let minLabelCheck = null;
              let maxLabelCheck = null;

              if (name === 'default') {
                const minLabelEl = document.querySelector('[data-slider-min-label]');
                const maxLabelEl = document.querySelector('[data-slider-max-label]');
                if (minLabelEl && maxLabelEl) {
                  const minRect = minLabelEl.getBoundingClientRect();
                  const maxRect = maxLabelEl.getBoundingClientRect();
                  minLabelCheck = {
                    minLeft: minRect.left,
                    minRight: minRect.right,
                    thumbRight: thumbRect.right,
                    visibleAtZero: minRect.left >= thumbRect.right,
                  };
                  maxLabelCheck = {
                    maxLeft: maxRect.left,
                    maxRight: maxRect.right,
                  };
                }
              }

              return {
                railWidth: railRect.width,
                thumbWidth: thumbRect.width,
                thumbLeft: thumbRect.left,
                thumbCenter,
                fillRight: fillRect.right,
                expectedThumbCenter,
                diffThumb,
                diffFill,
                minLabelCheck,
                maxLabelCheck,
              };
            }

            // Also get cardBox for screenshot
            const card = document.getElementById('section-slider');
            const cardRect = card ? card.getBoundingClientRect() : null;

            return {
              defaultVariant: measureVariant('default'),
              compactVariant: measureVariant('compact'),
              cardBox: cardRect ? {
                x: cardRect.left + window.scrollX,
                y: cardRect.top + window.scrollY,
                width: cardRect.width,
                height: cardRect.height,
              } : null,
            };
          })()
        `,
        returnByValue: true,
      });

      const res = evalRes.result.value;
      const def = res.defaultVariant;
      const cmp = res.compactVariant;

      if (val === 0) {
        console.log('DEBUG at val=0:', { def, cmp });
      }

      const thumbPassDef = def.diffThumb <= 1.0;
      const fillPassDef = def.diffFill <= 1.0;
      const thumbPassCmp = cmp.diffThumb <= 1.0;
      const fillPassCmp = cmp.diffFill <= 1.0;

      let minLabelPass = true;
      if (val === 0) {
        minLabelPass = def.minLabelCheck.visibleAtZero;
      }

      const passed = thumbPassDef && fillPassDef && thumbPassCmp && fillPassCmp && minLabelPass;
      if (!passed) allCriteriaPassed = false;

      resultsTable.push({
        value: val,
        default_thumb_diff: def.diffThumb.toFixed(3) + 'px',
        default_fill_diff: def.diffFill.toFixed(3) + 'px',
        compact_thumb_diff: cmp.diffThumb.toFixed(3) + 'px',
        compact_fill_diff: cmp.diffFill.toFixed(3) + 'px',
        min_label_visible: val === 0 ? (minLabelPass ? 'YES (PASS)' : 'NO (FAIL)') : 'N/A',
        status: passed ? 'PASS' : 'FAIL',
      });

      // Capture screenshot at 0, 0.5, 1.0
      if (val === 0 || val === 0.5 || val === 1.0) {
        const valName = val === 0 ? '0' : val === 0.5 ? '0_5' : '1';
        const shot = await client.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: {
            x: res.cardBox.x,
            y: res.cardBox.y,
            width: res.cardBox.width,
            height: res.cardBox.height,
            scale: 1,
          },
        });
        const shotPath = path.join(ARTIFACT_DIR, `slider_val_${valName}.png`);
        fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
        console.log(`Saved screenshot at value ${val}: ${shotPath}`);
      }
    }

    console.log('\n--- Slider Verification Results Table ---');
    console.table(resultsTable);

    client.close();
    chromeProcess.kill('SIGTERM');

    if (!allCriteriaPassed) {
      console.error('\nFAIL: Some slider criteria failed.');
      process.exit(1);
    } else {
      console.log('\nSUCCESS: All slider criteria passed with sub-pixel precision!');
    }
  } catch (err) {
    console.error('Error during slider verification:', err);
    cleanup();
    process.exit(1);
  }
}

main();
