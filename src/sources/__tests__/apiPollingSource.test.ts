import { describe, expect, it, vi } from 'vitest';
import { ApiPollingSource, backendAvailable } from '../apiPollingSource';
import { DetectionFrame, SourceStatus } from '@/types/detection';

const frame = (frameId: number): DetectionFrame => ({
  frameId,
  ts: Date.now(),
  source: { width: 1280, height: 720 },
  detections: [{ trackId: 'T1', classId: 'person', confidence: 0.9, bbox: { x: 0.1, y: 0.1, w: 0.2, h: 0.3 } }],
});

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('ApiPollingSource', () => {
  it('emits new frames and asks only for newer ones', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(frame(1)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(ok(frame(2)));
    const src = new ApiPollingSource(1_000_000, fetchMock as unknown as typeof fetch);
    const frames: number[] = [];
    src.onFrame((f) => frames.push(f.frameId));
    await src.start();

    await src.pollOnce();
    await src.pollOnce();
    await src.pollOnce();
    src.stop();

    expect(frames).toEqual([1, 2]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/frames/latest');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/frames/latest?after=1');
  });

  it('drops invalid frames', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ frameId: 'x' }));
    const src = new ApiPollingSource(1_000_000, fetchMock as unknown as typeof fetch);
    const cb = vi.fn();
    src.onFrame(cb);
    await src.start();
    await src.pollOnce();
    src.stop();
    expect(cb).not.toHaveBeenCalled();
  });

  it('reports an error after repeated failures', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    const src = new ApiPollingSource(1_000_000, fetchMock as unknown as typeof fetch);
    const statuses: SourceStatus[] = [];
    src.onStatus((s) => statuses.push(s));
    await src.start();
    await src.pollOnce();
    await src.pollOnce();
    await src.pollOnce();
    src.stop();
    expect(statuses.some((s) => s.state === 'error')).toBe(true);
  });

  it('does not emit while paused', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(frame(1)));
    const src = new ApiPollingSource(1_000_000, fetchMock as unknown as typeof fetch);
    const cb = vi.fn();
    src.onFrame(cb);
    await src.start();
    src.pause();
    await src.pollOnce();
    src.stop();
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('backendAvailable', () => {
  it('is true only for a healthy response', async () => {
    expect(await backendAvailable((async () => ok({ ok: true })) as unknown as typeof fetch)).toBe(true);
    expect(await backendAvailable((async () => new Response('', { status: 404 })) as unknown as typeof fetch)).toBe(false);
    expect(await backendAvailable((async () => { throw new Error('x'); }) as unknown as typeof fetch)).toBe(false);
  });
});
