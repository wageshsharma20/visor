// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStore, MEMORY_RECORD_CAP } from '../store.js';
import { setStore } from '../http.js';
import {
  clearDetections,
  getLatestFrame,
  getModel,
  health,
  listDetections,
  patchModel,
  postFrame,
} from '../routes.js';

const KEY = 'test-key';
const BASE = 'http://localhost/api';

function frame(frameId: number, dets: Array<[string, string, number]> = [['T1', 'person', 0.9]]) {
  return {
    frameId,
    ts: 1_000 + frameId,
    source: { width: 1280, height: 720 },
    detections: dets.map(([trackId, classId, confidence]) => ({
      trackId,
      classId,
      confidence,
      bbox: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
    })),
  };
}

function post(path: string, body: unknown, key: string | null = KEY, method = 'POST') {
  return new Request(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(key ? { authorization: `Bearer ${key}` } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const get = (path: string) => new Request(`${BASE}${path}`);

beforeEach(() => {
  setStore(new MemoryStore());
  vi.stubEnv('VISOR_API_KEY', KEY);
  vi.stubEnv('DATABASE_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  setStore(null);
});

describe('health', () => {
  it('reports storage and whether writes are enabled', async () => {
    const res = await health(get('/health'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, storage: 'memory', writesEnabled: true });
  });
});

describe('auth', () => {
  it('rejects writes without a key', async () => {
    expect((await postFrame(post('/frames', frame(1), null))).status).toBe(401);
  });

  it('rejects writes with a wrong key', async () => {
    expect((await postFrame(post('/frames', frame(1), 'nope'))).status).toBe(401);
  });

  it('fails closed when no key is configured', async () => {
    vi.stubEnv('VISOR_API_KEY', '');
    expect((await postFrame(post('/frames', frame(1)))).status).toBe(503);
  });

  it('does not require a key to read', async () => {
    expect((await listDetections(get('/detections'))).status).toBe(200);
  });
});

describe('POST /frames', () => {
  it('accepts a valid frame', async () => {
    const res = await postFrame(post('/frames', frame(1)));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ accepted: true, frameId: 1, detections: 1 });
  });

  it('rejects malformed JSON', async () => {
    expect((await postFrame(post('/frames', '{oops'))).status).toBe(400);
  });

  it.each([
    ['missing frameId', { ...frame(1), frameId: undefined }],
    ['bad source', { ...frame(1), source: { width: 0, height: 720 } }],
    ['bbox out of range', { ...frame(1), detections: [{ trackId: 'T', classId: 'p', confidence: 0.5, bbox: { x: 2, y: 0, w: 0.1, h: 0.1 } }] }],
    ['confidence out of range', frame(1, [['T', 'person', 1.5]])],
    ['empty trackId', frame(1, [['', 'person', 0.5]])],
  ])('rejects %s with 422', async (_name, body) => {
    const res = await postFrame(post('/frames', body));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBeTypeOf('string');
  });

  it('rejects oversized bodies', async () => {
    const huge = 'x'.repeat(300 * 1024);
    expect((await postFrame(post('/frames', huge))).status).toBe(413);
  });
});

describe('GET /frames/latest', () => {
  it('is 204 before any frame', async () => {
    expect((await getLatestFrame(get('/frames/latest'))).status).toBe(204);
  });

  it('returns the newest frame and ignores out-of-order older ones', async () => {
    await postFrame(post('/frames', frame(5)));
    await postFrame(post('/frames', frame(3)));
    const res = await getLatestFrame(get('/frames/latest'));
    expect(res.status).toBe(200);
    expect((await res.json()).frameId).toBe(5);
  });

  it('is 204 when nothing is newer than ?after', async () => {
    await postFrame(post('/frames', frame(5)));
    expect((await getLatestFrame(get('/frames/latest?after=5'))).status).toBe(204);
    expect((await getLatestFrame(get('/frames/latest?after=4'))).status).toBe(200);
  });

  it('rejects a non-numeric ?after', async () => {
    expect((await getLatestFrame(get('/frames/latest?after=x'))).status).toBe(400);
  });
});

describe('detections history', () => {
  it('merges a track across frames', async () => {
    await postFrame(post('/frames', frame(1, [['T1', 'person', 0.6]])));
    await postFrame(post('/frames', frame(2, [['T1', 'person', 0.9]])));
    await postFrame(post('/frames', frame(3, [['T1', 'person', 0.7]])));
    const { items } = await (await listDetections(get('/detections'))).json();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      trackId: 'T1',
      firstSeen: 1001,
      lastSeen: 1003,
      confidence: 0.7,
      peakConfidence: 0.9,
      frames: 3,
    });
  });

  it('filters by class and sorts newest first', async () => {
    await postFrame(post('/frames', frame(1, [['A', 'person', 0.9]])));
    await postFrame(post('/frames', frame(2, [['B', 'car', 0.9]])));
    await postFrame(post('/frames', frame(3, [['C', 'person', 0.9]])));
    const all = (await (await listDetections(get('/detections'))).json()).items;
    expect(all.map((r: { trackId: string }) => r.trackId)).toEqual(['C', 'B', 'A']);
    const people = (await (await listDetections(get('/detections?class=person'))).json()).items;
    expect(people.map((r: { trackId: string }) => r.trackId)).toEqual(['C', 'A']);
  });

  it('paginates with limit and before', async () => {
    for (let i = 1; i <= 5; i++) await postFrame(post('/frames', frame(i, [[`T${i}`, 'person', 0.9]])));
    const page1 = await (await listDetections(get('/detections?limit=2'))).json();
    expect(page1.items.map((r: { trackId: string }) => r.trackId)).toEqual(['T5', 'T4']);
    const page2 = await (await listDetections(get(`/detections?limit=2&before=${page1.nextBefore}`))).json();
    expect(page2.items.map((r: { trackId: string }) => r.trackId)).toEqual(['T3', 'T2']);
  });

  it.each(['0', '501', '1.5', 'abc'])('rejects limit=%s', async (limit) => {
    expect((await listDetections(get(`/detections?limit=${limit}`))).status).toBe(400);
  });

  it('clears history with the key only', async () => {
    await postFrame(post('/frames', frame(1)));
    expect((await clearDetections(post('/detections', '', null, 'DELETE'))).status).toBe(401);
    const res = await clearDetections(post('/detections', '', KEY, 'DELETE'));
    expect(await res.json()).toEqual({ deleted: 1 });
    expect((await (await listDetections(get('/detections'))).json()).items).toEqual([]);
    expect((await getLatestFrame(get('/frames/latest'))).status).toBe(204);
  });

  it('caps the memory store', async () => {
    const store = new MemoryStore();
    setStore(store);
    const dets = Array.from({ length: 200 }, (_, i) => [`T${i}`, 'person', 0.5] as [string, string, number]);
    for (let f = 0; f < 30; f++) {
      await store.ingestFrame(frame(f, dets.map(([id, c, s]) => [`${f}-${id}`, c, s])));
    }
    const items = await store.listDetections({ limit: 10_000 });
    expect(items.length).toBe(MEMORY_RECORD_CAP);
  });
});

describe('model config', () => {
  it('returns defaults', async () => {
    const m = await (await getModel(get('/model'))).json();
    expect(m).toMatchObject({ name: 'yolov8n', confidenceThreshold: 0.5 });
  });

  it('applies a partial update and ignores unknown fields', async () => {
    const res = await patchModel(
      post('/model', { confidenceThreshold: 0.7, classes: ['person'], evil: true }, KEY, 'PATCH'),
    );
    expect(res.status).toBe(200);
    const m = await res.json();
    expect(m).toMatchObject({ name: 'yolov8n', confidenceThreshold: 0.7, classes: ['person'] });
    expect(m.evil).toBeUndefined();
    expect(m.updatedAt).toBeGreaterThan(0);
  });

  it('validates the patch', async () => {
    expect((await patchModel(post('/model', { iouThreshold: 2 }, KEY, 'PATCH'))).status).toBe(422);
    expect((await patchModel(post('/model', { classes: [''] }, KEY, 'PATCH'))).status).toBe(422);
  });

  it('requires the key', async () => {
    expect((await patchModel(post('/model', { name: 'x' }, null, 'PATCH'))).status).toBe(401);
  });
});
