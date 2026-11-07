import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/wageshsharma/.gemini/antigravity/brain/f5e2eee6-3556-440b-8107-cf672c389495';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9222;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('1. Starting headless Chrome with remote debugging on port', DEBUG_PORT);
  const chromeProc = spawn(CHROME_PATH, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1440,900',
    'http://localhost:5173/live',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const tabs = await listRes.json();
    const tab = tabs.find((t) => t.type === 'page');
    if (!tab) {
      throw new Error('No page tab found in Chrome CDP');
    }

    console.log('2. Connected to Chrome tab:', tab.url);
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    const consoleLogs = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
        consoleLogs.push({ type, text });
      }
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result, msg.error);
      }
    };

    await new Promise((res) => (ws.onopen = res));

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        callbacks.set(msgId, (result, err) => {
          if (err) reject(err);
          else resolve(result);
        });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function captureScreenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log('Saved screenshot:', filepath);
    }

    // Give Vite a second to render
    await sleep(800);

    // STATE 1: Start State Checks
    console.log('\n--- State 1: Start State Inspection ---');
    const state1Counts = await evaluate(`(() => {
      const railNav = document.querySelectorAll('aside nav button').length;
      const topBarRight = document.querySelectorAll('header > div:last-child > *').length;
      const startCard = !!document.querySelector('h2');
      const startCardText = document.querySelector('h2')?.textContent;
      const viewport = !!document.querySelector('#viewport-card');
      const toolbar = !!document.querySelector('[aria-label="Viewport Controls"]');
      const sidePanel = !!document.querySelector('aside.w-full, aside.lg\\\\:w-intel-sm');
      const statusPill = !!document.querySelector('header span[class*="rounded-full"]');
      return {
        railNav,
        topBarRight,
        startCard,
        startCardText,
        viewport,
        toolbar,
        sidePanel,
        statusPill
      };
    })()`);
    console.log('State 1 Counts:', state1Counts);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'phase35_live_start_1440.png'));

    // Test clicking [Try demo scene]
    console.log('\n--- Transitioning to Demo Scene ---');
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.textContent.includes('Try demo scene'));
      if (demoBtn) demoBtn.click();
    })()`);

    // Wait 300ms for streaming to start (State 2 or State 3)
    await sleep(400);

    console.log('\n--- State 2 / 3 Inspection ---');
    const state2Counts = await evaluate(`(() => {
      const viewport = !!document.querySelector('#viewport-card');
      const toolbarItems = document.querySelectorAll('[aria-label="Viewport Controls"] > div').length;
      const topBarRight = document.querySelectorAll('header > div:last-child > *').length;
      const statusPillText = document.querySelector('header button')?.textContent || '';
      const hudLive = document.querySelector('#viewport-card')?.textContent || '';
      return {
        viewport,
        toolbarItems,
        topBarRight,
        statusPillText,
        hudLive: hudLive.slice(0, 100)
      };
    })()`);
    console.log('Streaming State Elements:', state2Counts);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'phase35_live_streaming_1440.png'));

    // Wait 1.5s for synthetic scene entities to spawn and emit detections (State 3: side panel appears)
    console.log('\nWaiting 2s for detections to arrive and side panel to slide in...');
    await sleep(2000);

    const state3Counts = await evaluate(`(() => {
      const sidePanel = !!document.querySelector('aside.w-full, aside.lg\\\\:w-intel-sm, aside.xl\\\\:w-intel');
      const detectionCards = document.querySelectorAll('aside [data-testid="detections-card"]').length;
      const detectionRows = document.querySelectorAll('[data-testid="track-row"]').length;
      return {
        sidePanel,
        detectionCards,
        detectionRows
      };
    })()`);
    console.log('State 3 (Detections Arriving) Elements:', state3Counts);

    // Select the first detection row to verify Selected Object card appearance
    await evaluate(`(() => {
      const firstRow = document.querySelector('[data-testid="track-row"]');
      if (firstRow) firstRow.click();
    })()`);

    await sleep(500);

    const selectedCounts = await evaluate(`(() => {
      const selectedObjectCard = !!document.querySelector('[data-testid="selected-object-card"]');
      const detectionsCard = !!document.querySelector('[data-testid="detections-card"]');
      const totalSidePanelCards = (selectedObjectCard ? 1 : 0) + (detectionsCard ? 1 : 0);
      return {
        selectedObjectCard,
        detectionsCard,
        totalSidePanelCards
      };
    })()`);
    console.log('With Track Selected:', selectedCounts);

    await captureScreenshot(path.join(ARTIFACT_DIR, 'phase35_live_detections_1440.png'));

    // Check Console Warnings
    console.log('\n--- Console Messages Check ---');
    const warningsAndErrors = consoleLogs.filter(
      (l) => l.type === 'error' || l.type === 'warning'
    );
    console.log('Total Warnings/Errors:', warningsAndErrors.length);
    if (warningsAndErrors.length > 0) {
      console.log('Logs:', warningsAndErrors);
    } else {
      console.log('ZERO console warnings or errors detected!');
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
