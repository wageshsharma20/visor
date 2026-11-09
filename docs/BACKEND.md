# VISOR backend

Serverless API in `/api` (Vercel functions), logic in `/server`. It does not run a model:
a model (or any process) pushes detection frames to it, and the browser reads them.

```
model ──POST /api/frames──▶ API ──▶ Postgres ◀── GET /api/frames/latest (Live, ~10 Hz poll)
                                             ◀── GET /api/detections    (History)
```

Vercel functions can't keep WebSockets open, so the Live page polls. Expect roughly 100–300 ms of delay.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | `{ ok, storage, writesEnabled }` |
| POST | `/api/frames` | key | Push one `DetectionFrame` (max 200 detections, 256 KB) |
| GET | `/api/frames/latest?after=<frameId>` | — | Newest frame, or `204` if none newer |
| GET | `/api/detections?class=&limit=&before=` | — | Tracks, newest first. `limit` 1–500 (default 100); page with `before=<nextBefore>` |
| DELETE | `/api/detections` | key | Clear history |
| GET | `/api/model` | — | Model config |
| PATCH | `/api/model` | key | Partial update: `name`, `version`, `runtime`, `confidenceThreshold`, `iouThreshold`, `classes` |

Writes need `Authorization: Bearer <VISOR_API_KEY>`. If the key isn't set, writes return `503` (fails closed).
Never put the key in frontend code; it belongs to the model process only.

`DetectionFrame` is the same shape the frontend uses (see `src/types/detection.ts`):

```json
{ "frameId": 42, "ts": 1731140000000, "source": { "width": 1280, "height": 720 },
  "detections": [{ "trackId": "T1", "classId": "person", "confidence": 0.93,
                   "bbox": { "x": 0.1, "y": 0.2, "w": 0.15, "h": 0.4 } }] }
```

Boxes are normalized 0–1. Each `trackId` becomes one history row (first/last seen, peak confidence, frame count).

## Environment variables (Vercel → Project → Settings → Environment Variables)

- `DATABASE_URL`: Postgres connection string (Neon, from Vercel's Storage/Marketplace). Tables are created on first use. Rows older than 7 days are pruned.
- `VISOR_API_KEY`: a long random secret, e.g. `openssl rand -hex 32`.

Without `DATABASE_URL` the API uses memory. That's fine locally, but on Vercel each instance has its own memory, so history won't persist.

## Local

`npm run dev` serves the API from the Vite dev server (memory store, key `visor-dev-key`). To fake a model:

```bash
node scripts/push-demo-frames.mjs http://localhost:5173 60
```

Then on Live choose **Connect to backend feed**, and open History.
