#!/usr/bin/env node
// Stand-in for a detection model: pushes synthetic DetectionFrames to the VISOR API.
// Usage: node scripts/push-demo-frames.mjs [baseUrl] [seconds]
//   VISOR_API_KEY must match the server (local dev default: visor-dev-key).
const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const seconds = Number(process.argv[3] ?? 30);
const key = process.env.VISOR_API_KEY ?? 'visor-dev-key';
const FPS = 10;

const actors = [
  { id: 'P1', cls: 'person', x: 0.05, y: 0.45, vx: 0.004, w: 0.06, h: 0.22 },
  { id: 'P2', cls: 'person', x: 0.7, y: 0.5, vx: -0.003, w: 0.06, h: 0.22 },
  { id: 'C1', cls: 'car', x: -0.2, y: 0.22, vx: 0.006, w: 0.16, h: 0.1 },
];

let frameId = 0;
const end = Date.now() + seconds * 1000;
const clamp = (v) => Math.min(1, Math.max(0, v));

async function tick() {
  frameId++;
  const detections = [];
  for (const a of actors) {
    a.x += a.vx;
    if (a.x > 1.1) a.x = -0.2;
    if (a.x < -0.2) a.x = 1.1;
    const x = clamp(a.x);
    const w = clamp(Math.min(a.w, 1 - x));
    if (w < 0.01) continue;
    detections.push({
      trackId: a.id,
      classId: a.cls,
      confidence: Number((0.85 + Math.random() * 0.14).toFixed(3)),
      bbox: { x, y: a.y, w, h: a.h },
    });
  }
  const res = await fetch(`${base}/api/frames`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ frameId, ts: Date.now(), source: { width: 1280, height: 720 }, detections }),
  });
  if (!res.ok) {
    console.error(`frame ${frameId}: HTTP ${res.status}`, await res.text());
    process.exit(1);
  }
}

console.log(`Pushing ${FPS} fps to ${base}/api/frames for ${seconds}s…`);
while (Date.now() < end) {
  const t = Date.now();
  await tick();
  await new Promise((r) => setTimeout(r, Math.max(0, 1000 / FPS - (Date.now() - t))));
}
console.log(`Done: ${frameId} frames.`);
