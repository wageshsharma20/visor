import { DetectionFrame, ModelConfig, frameError, modelPatchError } from './contract';
import { error, getStore, handle, json, readJson, requireKey } from './http';

/** GET /api/health */
export const health = handle(async () => {
  return json({
    ok: true,
    storage: process.env.DATABASE_URL ? 'postgres' : 'memory',
    writesEnabled: Boolean(process.env.VISOR_API_KEY),
  });
});

/** POST /api/frames — a model pushes one DetectionFrame. Requires the API key. */
export const postFrame = handle(async (req) => {
  const denied = requireKey(req);
  if (denied) return denied;
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const reason = frameError(body.value);
  if (reason) return error(422, reason);
  const frame = body.value as DetectionFrame;
  await getStore().ingestFrame(frame);
  return json({ accepted: true, frameId: frame.frameId, detections: frame.detections.length }, 202);
});

/**
 * GET /api/frames/latest[?after=<frameId>] — the browser polls this.
 * Returns 204 when there is no frame, or none newer than `after`.
 */
export const getLatestFrame = handle(async (req) => {
  const afterRaw = new URL(req.url).searchParams.get('after');
  const after = afterRaw === null ? null : Number(afterRaw);
  if (after !== null && !Number.isFinite(after)) return error(400, 'after must be a number');
  const frame = await getStore().latestFrame();
  if (!frame || (after !== null && frame.frameId <= after)) return new Response(null, { status: 204 });
  return json(frame);
});

export const MAX_LIMIT = 500;

/** GET /api/detections?class=&limit=&before= — history, newest first. */
export const listDetections = handle(async (req) => {
  const p = new URL(req.url).searchParams;
  const limit = p.has('limit') ? Number(p.get('limit')) : 100;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return error(400, `limit must be an integer from 1 to ${MAX_LIMIT}`);
  }
  const before = p.has('before') ? Number(p.get('before')) : undefined;
  if (before !== undefined && !Number.isFinite(before)) return error(400, 'before must be a number');
  const classId = p.get('class') || undefined;

  const items = await getStore().listDetections({ classId, limit, before });
  const nextBefore = items.length === limit ? items[items.length - 1].lastSeen : null;
  return json({ items, nextBefore });
});

/** DELETE /api/detections — clear history. Requires the API key. */
export const clearDetections = handle(async (req) => {
  const denied = requireKey(req);
  if (denied) return denied;
  const deleted = await getStore().clearDetections();
  return json({ deleted });
});

/** GET /api/model */
export const getModel = handle(async () => json(await getStore().getModel()));

/** PATCH /api/model — partial update. Requires the API key. */
export const patchModel = handle(async (req) => {
  const denied = requireKey(req);
  if (denied) return denied;
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const reason = modelPatchError(body.value);
  if (reason) return error(422, reason);
  const v = body.value as Partial<ModelConfig>;
  const patch: Partial<ModelConfig> = {};
  for (const k of ['name', 'version', 'runtime', 'confidenceThreshold', 'iouThreshold', 'classes'] as const) {
    if (v[k] !== undefined) (patch as Record<string, unknown>)[k] = v[k];
  }
  return json(await getStore().updateModel(patch));
});
