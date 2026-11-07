# SPEC.md — VISOR: Visual Intelligence Command Center

## 1. What we're building

VISOR is a frontend for operating a real-time visual detection model. A user connects a camera (or runs a demo scene), connects a model (or uses the simulator), and watches detections appear on the live feed: boxes, labels, tracking IDs, confidence, and an AI-written description per object. Every detection is logged to an intelligence panel, a timeline and a searchable history that can be exported.

**This is frontend only.** There is no backend and no model server. Detections come from a pluggable `DetectionSource`. This build ships with a simulator. A real model plugs in later through WebSocket without UI changes.

**Honesty requirement.** The UI must always make clear where detections come from: `SIMULATED`, `BROWSER MODEL`, or `REMOTE MODEL`. Simulated boxes are never drawn over a live webcam, because they would be meaningless rectangles over the user's room.

## 2. Pages and routes (keep it to three)

| Route | Page | Purpose |
|---|---|---|
| `/` → redirect | — | Goes to `/live` |
| `/live` | Live Monitor | The hero: camera + overlays + one side panel |
| `/models` | Model | Connect or "deploy" a model (simulated) and connect a WebSocket endpoint |
| `/history` | History | Everything detected this session: small summary, timeline, searchable table, export |

**Settings is a right-side drawer**, opened from the gear in the top bar, not a page. It holds: camera device, mirror webcam, default threshold, history limit, and reset.

**Removed on purpose:** Overview and Analytics pages, workspace switcher, avatars/members, and the system health dot. They repeated information shown elsewhere. Don't build them.

Icon rail order: Live Monitor, Model, History. Nothing else.

## 3. Top bar (56px)

Left: the page title (`title` style). Right: **one** status pill and the settings gear. Nothing else. The pill is hidden while no source is running (DESIGN.md §5.1).

The status pill summarizes the whole pipeline in one line, reading from `usePipelineStatus()`:
- `Camera off`
- `● Webcam · no model`
- `● Demo scene · simulated` (amber)
- `● Webcam · yolov8n` (green, real remote model)
- `Camera blocked` (red)

Hovering it shows a small popover with the details: resolution, fps, latency, source, model.

**Rule:** camera, source and model status appear in exactly one place per screen. On Live, that's the top-bar pill plus the single LIVE chip on the video. Don't repeat them in chips, strips or HUD corners.

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
    layout/              AppLayout, TopBar, IconRail, Canvas (dot grid)
    graph/               Wire, Port, HubNode, NodeCard (DESIGN.md §4)
    live/                LiveMonitor, Toolbar, CameraViewport, VideoLayer,
                         DetectionOverlay, BoundingBox, BoxLabel, HudLayer, ViewportState
    panel/               SidePanel, SelectedObjectCard, DetectionsCard
    models/              ModelPage, SourceNode, ModelNode, OutputNode, EndpointCard
    history/             HistoryPage, HistoryStats, HistoryTimeline, HistoryTable, ExportMenu
    settings/            SettingsDrawer
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

**Modes:** chosen from the Start button's menu (DESIGN.md §6.5): `Webcam` · `Demo scene`. There is no separate mode toggle.

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

**Controls (one small toolbar under the viewport, 5 items):** Start ▾ / Stop (the Start menu offers Webcam or Demo scene) · Pause/Resume (`Space`) · Boxes toggle (`B`; labels show with boxes) · confidence threshold slider (0.30–0.95, step 0.05, default 0.50) · fullscreen (`F`, viewport only). Trails, separate label toggle and snapshot are removed.

## 7. Selection model

- `uiStore.selectedTrackId` is the single source of truth. Clicking a box or a list row (on Live or History) sets it.
- `Esc` or clicking empty video clears it.
- New detections never change the selection.
- If the selected track has exited, the side panel still shows its last-known data with "No longer in frame".
- `↑/↓` in the detections list moves the selection.
- There is no floating detail card on the video. Selecting a box highlights it and fills the side panel.

## 8. Side panel (right, 340px): two cards only

1. **Selected object.** Rendered only while something is selected; there's no empty state (DESIGN.md §5.1). When selected:
   - one header line: class + `#004` + status pill;
   - confidence as `metric`, with a thin pill bar;
   - one line of meta chips: first seen · time in view;
   - up to 3 attributes as chips (e.g. dark jacket · backpack · walking east);
   - the AI description as a short paragraph inside the same card, with a single `small` footer line ("simulated" or the model name). There's no separate AI card. While pending, show a 2-line shimmer. If no description model exists, omit the paragraph entirely.
2. **Detections.** Newest on top, simple rows: thumbnail · "Person #004" · time · confidence. No filter chips here (filtering lives on History). Lost or exited rows are dimmed instead of getting a pill. Shows the last 50, with "View all in History →" at the bottom.

## 9. History page

- **Top row:** three small stat cards: Total detections · Flagged · Most seen class. No charts.
- **Timeline card:** one lane per class, last 5/15/60 min. Clicking a bar selects that track. (This replaces the timeline that used to sit on Live.)
- **Table:** time, class, ID, peak confidence, duration, flagged, description (truncated). Sortable, 44px rows, sticky header.
- **Filters:** one search box (class, ID, description) plus a class select. There are no other filters.
- **Export:** one button with a small menu (CSV / JSON) exporting the filtered rows. It's hidden when there are 0 rows.
- **Clear history:** a confirm dialog that names the count.
- Empty and zero-result states.

## 10. Model page (`/models`): clearly a simulation

One amber notice at the top: "Deployment is simulated in this build. Connect a WebSocket endpoint to stream real detections." The top-bar pill shows `simulated` whenever a simulated model is active.

The page is a small node canvas (DESIGN.md §9) with **three nodes**:
**Source** → **⚡ Model** → **Output**, plus an **Endpoint** card below.
- **Source node:** shows the current source (Webcam / Demo scene / WebSocket) and its status. Read-only, with a "Change" link that opens the Start menu on Live.
- **Model node:**
  - upload dropzone (`.onnx .pt .tflite .engine .zip`, max 500 MB, inline validation, simulated progress);
  - name;
  - runtime select;
  - confidence threshold;
  - one primary action that changes with state: Deploy (simulated) / Stop / Retry;
  - a state pill: Not configured · Deploying · Running (simulated) · Stopped · Failed. Deploying shows a single progress line ("Loading weights…"), not a checklist.
- **Output node:** the last 3 detection thumbnails as a stacked preview, or an empty state.
- **Endpoint card:**
  - WebSocket URL + [Test connection] (a real attempt, 5s timeout);
  - when the test succeeds, a "Use as detection source" switch;
  - a collapsible "Message format" code block showing the DetectionFrame JSON.

Dropped from earlier drafts: version, task type, input resolution, NMS IoU, class list, watchlist editor, deployment drawer, debug "simulate failure" checkbox (use an invalid file to trigger Failed instead). Config persists to localStorage.

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
