# SPEC.md — VISOR: Visual Intelligence Command Center

## 1. What we're building

VISOR is a frontend for operating a real-time visual detection model. A user connects a camera (or runs a demo scene), connects a model (or uses the simulator), and watches detections appear on the live feed: boxes, labels, tracking IDs, confidence, and an AI-written description per object. Every detection is logged to an intelligence panel, a timeline and a searchable history that can be exported.

**This is frontend only.** There is no backend and no model server. Detections come from a pluggable `DetectionSource`. This build ships with a simulator. A real model plugs in later through WebSocket without UI changes.

**Honesty requirement.** The UI must always make clear where detections come from: `SIMULATED`, `BROWSER MODEL`, or `REMOTE MODEL`. Simulated boxes are never drawn over a live webcam, because they would be meaningless rectangles over the user's room.

## 2. Pages and routes

| Route | Page | Purpose |
|---|---|---|
| `/` → redirect | — | Goes to `/live` |
| `/live` | Live Monitor | The hero: viewport + intel panel + timeline |
| `/overview` | Overview | Session summary: 4 stat tiles (active tracks, total detections, flagged, uptime), a small live viewport thumbnail that links to `/live`, last 10 events, source + model status |
| `/models` | Model Management | Upload/configure/"deploy" a model (simulated), connect a WebSocket endpoint |
| `/history` | Detection History | Full table with search, filters, export, clear |
| `/analytics` | Analytics | Detections per minute (bar), class distribution (horizontal bars), confidence histogram (10 bins), all hand-drawn SVG from the store |
| `/settings` | Settings | Camera device, mirror webcam, overlay defaults, confidence threshold default, history cap, watchlist classes, reset all |

Sidebar order: Live Monitor, Overview, Models, History, Analytics, then Settings pinned at the bottom.

## 3. Top bar (44px)

From left to right: product mark + `VISOR` + `/ Visual Intelligence` in `--text-3` · workspace switcher (`Lobby-North ▾`, a static list of 2 workspaces that changes the camera label) · spacer · **source chip** (`SIMULATED` amber / `WEBCAM` / `DEMO SCENE`) · **model chip** (`yolov8n · RUNNING` green, `NO MODEL` text-3, `DEPLOYING` amber, `FAILED` red) · **camera chip** (`CAM_01 · CONNECTED` green dot) · system status dot with tooltip (fps, latency, dropped frames) · intel-drawer button (<1024px only) · settings icon · avatar menu (name, workspace, "Reset demo data").

## 4. Data contracts (`src/types/detection.ts`)

These are the integration contract with a future backend. Implement them exactly.

```ts
/** Normalized 0..1, relative to the source frame, origin top-left. */
export interface BBox { x: number; y: number; w: number; h: number }

/** One object in one frame, as emitted by a model. */
export interface RawDetection {
  trackId: string;             // stable across frames, e.g. "T004"
  classId: string;             // "person" | "car" | "backpack" | ...
  confidence: number;          // 0..1
  bbox: BBox;
  attributes?: Record<string, string | number | boolean>;
}

/** One message from a source. */
export interface DetectionFrame {
  frameId: number;
  ts: number;                  // epoch ms when the frame was captured
  source: { width: number; height: number };
  detections: RawDetection[];
  latencyMs?: number;
}

/** Async, slower enrichment from a vision-language model. */
export interface DescriptionUpdate {
  trackId: string;
  text: string;
  ts: number;
}

export type TrackStatus = "visible" | "lost" | "exited";

/** Frontend-owned object built by the tracker from frames. */
export interface Track {
  id: string;
  classId: string;
  label: string;               // display name, e.g. "Person"
  displayId: string;           // "#004"
  status: TrackStatus;
  firstSeen: number;
  lastSeen: number;
  confidence: number;          // latest
  peakConfidence: number;
  bbox: BBox;                  // latest
  trail: Array<{ x: number; y: number }>; // centroids, capped at 30
  attributes: Record<string, string | number | boolean>;
  description: { status: "pending" | "ready" | "unavailable"; text?: string };
  thumbnail?: string;          // small dataURL cropped at first sighting
  flagged: boolean;            // class is on the watchlist
}

export type DetectionEventType =
  | "track.new" | "track.lost" | "track.reacquired" | "track.exited" | "track.flagged";

export interface DetectionEvent {
  id: string;
  ts: number;
  type: DetectionEventType;
  trackId: string;
  classId: string;
  confidence: number;
}

export type SourceStatus =
  | { state: "idle" } | { state: "connecting" } | { state: "streaming"; fps: number }
  | { state: "paused" } | { state: "error"; message: string };

/** The only thing the app knows about where detections come from. */
export interface DetectionSource {
  readonly id: string;
  readonly kind: "simulated" | "browser-model" | "remote";
  readonly label: string;      // shown in the HUD/model chip
  start(ctx: { video?: HTMLVideoElement }): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  onFrame(cb: (f: DetectionFrame) => void): () => void;
  onDescription(cb: (d: DescriptionUpdate) => void): () => void;
  onStatus(cb: (s: SourceStatus) => void): () => void;
}
```

## 5. Architecture

```
src/
  types/                 detection.ts, camera.ts, model.ts
  sources/               DetectionSource implementations (no React)
    simulatedScene.ts    synthetic scene + matching detections
    recordedTracks.ts    plays public/demo/scene.tracks.json synced to the demo video
    websocketSource.ts   real backend adapter (implemented, used when an endpoint is set)
    descriptions.ts      simulated VLM: canned descriptions per class, 1.5–3s delay
  engine/                pure TS, unit-tested
    tracker.ts           frames → tracks + events (lifecycle, thresholds, trails)
    ringBuffer.ts
    export.ts            CSV / JSON serialization
  lib/
    geometry.ts          normalized ↔ content-rect math, letterbox, mirroring, label collision
    camera.ts            getUserMedia wrapper with typed errors
    time.ts              formatting
  stores/                zustand
    cameraStore.ts       mode, status, stream, resolution, fps, mirror, paused
    detectionStore.ts    tracks Map, events ring buffer (cap 2000), counters
    uiStore.ts           selection, overlay toggles, threshold, filters, drawer state
    modelStore.ts        model config, deployment state machine
  components/
    ui/                  Button, IconButton, Badge, Pill, Panel, PanelHeader, Slider, Switch,
                         Select, Input, Tooltip, Menu, Drawer, Dialog, Toast, EmptyState, Kbd
    layout/              AppLayout, TopBar, Sidebar
    live/                LiveMonitor, ViewportToolbar, CameraViewport, VideoLayer,
                         DetectionOverlay, BoundingBox, BoxLabel, TrackTrail, HudLayer,
                         InlineDetailCard, ViewportState
    intel/               IntelPanel, CurrentDetection, AttributeGrid, AiDescription, RecentDetections
    timeline/            DetectionTimeline, TimelineLane, TimelineAxis
    models/              ModelManagement, ModelUpload, ModelConfigForm, DeploymentCard, EndpointForm
    history/             HistoryPage, HistoryFilters, HistoryTable, ExportMenu
  pages/                 thin route components composing the above
```

**Pipeline wiring.** A single `useDetectionPipeline()` hook mounted in `AppLayout` owns the active source. It subscribes to `onFrame` → `tracker.ingest(frame)` → batch-writes to `detectionStore`. The pipeline keeps running when navigating between pages.

**Tracker rules** (`engine/tracker.ts`)
- Detections below `uiStore.threshold` are ignored entirely: no track and no event.
- A new trackId emits `track.new`. If its class is on the watchlist, it also emits `track.flagged`.
- A track not seen for 1000ms becomes `lost` and emits `track.lost`. If it's seen again within 5s, it becomes `visible` and emits `track.reacquired`. After 5s lost, it becomes `exited` and emits `track.exited`, and is removed from the live overlay but kept in history.
- `peakConfidence` = max seen. `trail` = last 30 centroids.
- Thumbnail: on `track.new`, if a video element is available, crop the bbox from the current frame into a 64×64 canvas and save it as a JPEG dataURL (quality 0.7). This happens once per track.

**Performance rules**
- Overlay renders from `detectionStore` through a selector returning only visible/lost tracks. Box positions interpolate via rAF, not React state per frame.
- The intel panel, recent list, timeline and history read derived data throttled to 4 Hz.
- Recent detections list is virtualized once it passes 100 rows (simple windowing; no library).
- `React.memo` on BoundingBox, keyed by track id. Do not pass new object/array literals as props in hot paths.

## 6. Camera and sources

**Modes** (segmented control in the viewport toolbar): `Webcam` · `Demo scene`.

**Webcam**
- `getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } } })`. Device picker in Settings via `enumerateDevices`.
- Map errors to typed states: `NotAllowedError` → permission denied, `NotFoundError` → no camera, `NotReadableError` → in use, insecure context → "Camera requires HTTPS or localhost".
- Stop all tracks on stop, on unmount and on mode change.
- Optional mirror (default on). When mirrored, the overlay mirrors bbox x (`x' = 1 - x - w`) but text stays readable.
- If the source is simulated and the mode is webcam, show no boxes. The viewport shows "No detection model connected".
- Measured FPS comes from `requestVideoFrameCallback` where available, falling back to rAF sampling.

**Demo scene** (detections are guaranteed to align with the picture)
1. **Recorded** (preferred): if `public/demo/scene.mp4` and `public/demo/scene.tracks.json` exist, play the video looped and muted, and emit the tracks entry closest to `video.currentTime`. The tracks file is produced offline by `tools/make_demo_tracks.py` (real YOLO + ByteTrack output), so boxes match real people and cars.
2. **Synthetic** (fallback, always works): a `<canvas>` renders a stylized scene at 1280×720 and 30fps. It shows a dark perspective floor grid, 3–7 moving "people" (simple capsule silhouettes in muted grey) and occasional "vehicles" (rounded rects) crossing a road band at the top, and now and then a "bag" left on the floor. The same simulation state produces both the drawing and the detections, so boxes always match. Add ±1.5% bbox jitter and confidence noise for realism. Objects enter and leave at the edges and sometimes get occluded, which produces lost/reacquired events. Label the HUD `SIMULATED · SYNTHETIC SCENE`.

**Controls (viewport toolbar, left → right):** Start/Stop · Pause/Resume (`Space`) · mode segmented control · divider · Boxes toggle (`B`) · Labels toggle (`L`) · Trails toggle (`T`) · confidence threshold slider (0.30–0.95, step 0.05, default 0.50) · spacer · live track count · snapshot (downloads PNG of video + overlay) · fullscreen (`F`, on the viewport element only, keeps overlay and HUD).

## 7. Selection model

- `uiStore.selectedTrackId` is the single source of truth. Clicking a box, a recent-detection row, a timeline bar or a history row sets it.
- `Esc` clears it. Clicking empty video clears it.
- New detections never change the selection. Exception: if nothing is selected and "Auto-follow newest" (a toggle in the intel panel header, default off) is on, select the newest track.
- If the selected track is exited, the intel panel still shows it with status `EXITED` and its last-known data. The overlay shows nothing for it, and the panel says "No longer in frame".
- `↑/↓` in the recent list moves the selection.

## 8. Intel panel (right, 360px)

1. **Current detection.** Shows class swatch + label + `#004` + status pill. Confidence is the Metric size, with a 2px bar under it and peak shown as `peak 99.1%`. Below that are first seen, last seen, and time in view (live-updating), plus bbox in px of the source (`x 412 y 188 · 164×402`) in mono. Empty state: "Select an object in the feed or the list."
2. **Attributes.** A 2-column key/value grid in mono, from `track.attributes` (e.g. upper: dark jacket, lower: blue jeans, carrying: backpack, direction: → east, speed: walking). Hide the section when there are none.
3. **AI description.** Pending shows a 3-line shimmer and "Analyzing frame…". Ready shows the text in Body size and a footer `generated 13:42:10 · simulated` (or the model name). Unavailable shows "No description model connected".
4. **Recent detections.** The header shows a count and a filter chip row for classes. Newest is on top. Rows follow DESIGN.md §6. Clicking selects the track. A row for a track that isn't visible anymore shows the LOST/EXITED pill and stays selectable.

## 9. History page

- Table columns: thumbnail, time (first seen), class, ID, peak confidence, duration, status, flagged, description (truncated). Columns are sortable. Rows are 40px with a sticky header.
- Filters: text search (class, ID, description, attribute values), class multi-select, minimum confidence, time range (last 5m / 15m / 1h / session), event type, flagged only. Filters show as removable chips with "Clear filters".
- Export menu: CSV and JSON of **the currently filtered** rows (filename `visor-detections-YYYYMMDD-HHmmss.csv`). Thumbnails are excluded from CSV and included in JSON only if "Include thumbnails" is checked.
- "Clear history" opens a confirm dialog that names the count ("Delete 214 detections? This can't be undone."). It clears tracks and events but not the running source.
- Empty and zero-result states each have their own message and action.

## 10. Model Management (`/models`) — clearly a simulation

A persistent amber banner sits at the top: "Deployment is simulated in this build. No model is executed. Connect a WebSocket endpoint to stream real detections."

Two-column layout (single column < 1024px):
- **Left — Configure**
  - Upload dropzone: accepts `.onnx .pt .tflite .engine .zip`, max 500 MB. Shows name, size, type, and a simulated upload progress bar with cancel. Validation errors are inline (wrong type, too large, empty file).
  - Form: name (required), version (semver), description, task type (Object detection / Segmentation / Pose / Vision-language), runtime (ONNX Runtime / TensorRT / PyTorch / TFLite), input resolution (640 / 960 / 1280), confidence threshold, NMS IoU, class list (comma-separated, prefilled with COCO subset), watchlist classes.
  - Endpoint: WebSocket URL (`wss://…`) with a [Test connection] button. It really tries to connect with a 5s timeout and reports success or the actual failure. If it connects, a "Use as detection source" switch makes `websocketSource` the active source. The message format expected is `DetectionFrame` JSON, documented in a collapsible code block on the page.
  - Validation is blur-first, errors clear instantly when fixed, and Deploy is enabled only when the form is valid.
- **Right — Deployment**
  - State machine: `not_configured → ready → deploying → running ⇄ stopped`, plus `failed` (the deploying step has a "Simulate failure" debug checkbox so the state can be shown on demand).
  - Card shows state pill, model name@version, runtime, resolution, uptime, and simulated throughput.
  - Actions per state: Deploy / Stop / Restart / Retry. Deploying shows a 4-step checklist (Validate package → Allocate runtime → Load weights → Warm up) progressing over ~4s.
  - "Running (simulated)" makes the simulated source use this model's name, class list and threshold, so the Live Monitor chip shows `yolov8n@1.2.0 · SIMULATED`.
- Config persists to `localStorage` (wrapped in try/catch).

## 11. Simulated content

- Classes: person, car, truck, bicycle, backpack, handbag, suitcase, dog.
- Attribute pools per class (person: upper/lower clothing colors, carrying, direction, speed; car: color, type, direction; bag: color, attended yes/no).
- Description templates per class combining attributes, e.g. "Adult in a dark jacket and blue jeans walking east near the center of the frame, carrying a backpack." These must be generated from the track's actual attributes and position so they agree with what's shown.
- Default watchlist: `suitcase` unattended for more than 10s triggers flagged (amber box, event).

## 12. Accessibility

- Every icon button has an `aria-label` and tooltip. Visible focus rings appear everywhere.
- Boxes are focusable (`role="button"`, `aria-label="Person #004, 98.4% confidence"`), and `Tab` cycles visible tracks.
- A live region announces flagged events only (not every detection).
- Text contrast is ≥ 4.5:1 for body and ≥ 3:1 for HUD over the chip background.

## 13. Out of scope

Authentication, multiple simultaneous cameras, recording/playback of the session video, any real model execution (except optional Phase 9), backend persistence, and light theme.
