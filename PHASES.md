# VISOR — Antigravity phase prompts

## How to use this

1. Create an empty folder. Put `AGENTS.md` at the root, `docs/SPEC.md` and `docs/DESIGN.md` in `docs/`, and `tools/make_demo_tracks.py` in `tools/`. Also add AGENTS.md's contents as a workspace rule in Antigravity's Customizations → Rules if your version supports it, so it's always in context.
2. Use **Planning mode**. For each phase, start a **new conversation**, paste one prompt below, read the implementation plan it produces, and only then let it execute. Push back on the plan if it skips anything in the acceptance list.
3. After each phase, check the acceptance list yourself in the browser, then `git commit`. If a phase goes badly, `git reset --hard` and rerun it. Don't try to fix it up across ten follow-ups.
4. When something looks wrong, use the **Fix prompt** at the bottom with a screenshot.

Every prompt starts with the same first line on purpose. Weak frontend agents drift, and re-anchoring them to the files each time is what keeps phase 6 consistent with phase 1.

---

## Phase 1 — Project setup, design tokens, primitives

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. Follow them exactly; where this prompt and those files disagree, the files win.

Goal of this phase: project foundation and the UI primitive set. No camera, no detections yet.

1. Scaffold Vite + React 18 + TypeScript (strict) with the exact stack in AGENTS.md. Add npm scripts: dev, build, typecheck, lint, test.
2. Create src/styles/tokens.css with every token from DESIGN.md §1–3 and map them into tailwind.config (colors, font families, font sizes with line-heights, radii 2/4/6, spacing). Self-host Inter Variable and JetBrains Mono. Set global base styles: --bg-0 background, --text-1, 13px Inter, tabular nums on .font-mono, focus ring, custom 8px dark scrollbars, ::selection in cyan-dim.
3. Build these primitives in src/components/ui/ exactly per DESIGN.md §6 and §8: Button (primary/secondary/ghost/danger, sizes 28/32), IconButton (with required tooltip + optional Kbd), Badge, Pill (status pills), Panel + PanelHeader, Slider, Switch, SegmentedControl, Select, Input (with label + error), Tooltip, Menu, Drawer, Dialog (focus trap, Esc, restore focus), Toast (top-right stack, auto-dismiss 4s), EmptyState (icon + title + one line + one action), Kbd, Skeleton.
4. Create a dev-only route /__ui that shows every primitive in every state (default, hover note, disabled, error, loading) on the real background colors so it can be visually reviewed. This page is a tool, not a product page. Hide it from the sidebar.

Acceptance (verify each, with screenshots, before reporting):
- typecheck, lint and test pass; zero console errors.
- /__ui renders every primitive; nothing uses a radius > 6px, a font size > 20px, a shadow on non-floating elements, or a hex color outside tokens.css (grep to prove it).
- Dialog traps focus and restores it; Tooltip appears on keyboard focus, not only hover.
- Screenshot /__ui at 1440×900 and check alignment of label baselines and 4px-grid spacing; fix anything off.
```

## Phase 2 — App shell: layout, top bar, sidebar, routes

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. Reuse the Phase 1 primitives; do not restyle them.

Goal: the full application shell and routing, with every page present and honest (no fake content), but no camera/detection features yet.

1. AppLayout with the exact CSS grid from DESIGN.md §4 (100dvh, no page scroll on /live). Responsive behavior exactly as DESIGN.md §4 Responsive, including the left and right drawers below 1024px and the single-column layout below 640px.
2. TopBar per SPEC.md §3. The source/model/camera chips read from stores (create cameraStore, modelStore, uiStore skeletons with the types from SPEC.md §4 now) and show their idle states: source "NO SOURCE", model "NO MODEL", camera "OFF".
3. Sidebar per SPEC.md §2: 56px collapsed with icon + tooltip, 208px expanded with labels; toggle button at the bottom; state persisted to localStorage; active item = cyan 2px left edge + text-1, others text-2.
4. Routes per SPEC.md §2. /live shows the real layout regions (viewport toolbar row, viewport area showing the "Camera off" ViewportState from DESIGN.md §5, timeline region with its empty state, intel panel with its empty states). Other pages show their real headers and proper empty states that explain what will appear and link to /live. No "Coming soon".
5. Keyboard: `[` toggles sidebar; `g l`, `g h`, `g m` navigate to live/history/models.

Acceptance:
- Screenshots of /live at 1440×900, 1280×800, 1024×768, 768×1024, 390×844: no horizontal overflow at any width, drawers work below 1024, the viewport region is always the visually dominant area.
- Every top-bar and sidebar control does something. No dead buttons.
- The layout reads as one surface split by 1px hairlines — no floating cards, no gaps between panels.
```

## Phase 3 — Detection engine (logic only, fully tested)

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning.

Goal: the entire data layer, with NO new UI except a temporary debug readout. This phase is pure TypeScript and tests.

1. src/types/detection.ts exactly as SPEC.md §4.
2. src/engine/ringBuffer.ts, src/engine/tracker.ts (all lifecycle rules in SPEC.md §5 "Tracker rules", threshold filtering, watchlist flagging, trails capped at 30), src/engine/export.ts (CSV with proper quoting/escaping and JSON).
3. src/lib/geometry.ts:
   - contentRect(containerW, containerH, sourceW, sourceH) → letterboxed rect for object-fit: contain
   - toScreen(bbox, rect, mirrored) → px rect
   - resolveLabelPositions(boxes, rect, chipH) → label placements that never overlap another chip and flip inside the box near the top edge
   - lerpBox(a, b, t)
4. src/sources/simulatedScene.ts per SPEC.md §6 "Synthetic": a deterministic simulation (seedable RNG) exposing both draw(ctx) and the DetectionSource interface, so the picture and the detections come from the same state. Include enters/exits, occlusion (to trigger lost/reacquired), and the unattended-suitcase scenario every ~60s.
5. src/sources/recordedTracks.ts: loads public/demo/scene.tracks.json (format documented at the top of tools/make_demo_tracks.py), syncs emission to a video element's currentTime, handles looping.
6. src/sources/descriptions.ts: simulated VLM producing descriptions from a track's actual attributes and position with a 1.5–3s delay; emits via onDescription.
7. src/sources/websocketSource.ts: real implementation — connect, parse DetectionFrame JSON, validate shape (drop malformed frames, count them), reconnect with backoff, status events.
8. stores/detectionStore.ts wired through a useDetectionPipeline() hook as described in SPEC.md §5 (batching, 4 Hz derived selectors).
9. Unit tests (vitest) covering: tracker new/lost/reacquired/exited timing with fake timers; threshold filtering; flagged events; contentRect for wider/taller sources; mirroring; label collision; CSV escaping of commas/quotes/newlines; websocket frame validation.

Acceptance:
- npm run test passes with meaningful tests (not snapshot-only). Paste the test summary in your report.
- A temporary <PipelineDebug/> in the /live intel panel shows live counts (frames/s, active tracks, events) when the synthetic source runs; remove it at the end of Phase 4.
- No React imports anywhere under src/engine or src/sources.
```

## Phase 4 — Camera viewport, overlays, HUD (the hero)

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. DESIGN.md §5 is the most important section of the whole project — follow it to the pixel. Use the engine from Phase 3; do not put detection logic in components.

Goal: the Live Monitor viewport is finished and looks exceptional.

1. CameraViewport: VideoLayer (video element for webcam/recorded demo, canvas for synthetic scene), DetectionOverlay, HudLayer, InlineDetailCard, ViewportState — stacked in that order, all positioned using geometry.contentRect via a ResizeObserver, so everything aligns to the letterboxed picture, not the container.
2. Camera handling per SPEC.md §6: webcam with typed errors and cleanup, device from Settings, mirror; Demo scene uses recorded files when present, else synthetic. Every ViewportState from DESIGN.md §5.
3. Overlay: boxes drawn in one <svg> sized to the content rect with vector-effect non-scaling strokes; labels in an HTML layer using resolveLabelPositions; rAF interpolation between frames; every box state in DESIGN.md §5 (default, hover, selected with dimming + crosshair + leader line, new, lost, trail, flagged amber). Boxes are focusable buttons per SPEC.md §12.
4. HUD exactly per DESIGN.md §5, timestamp updated by rAF writing to a ref (no per-frame React render).
5. ViewportToolbar with every control and shortcut in SPEC.md §6. Fullscreen applies to the viewport element and keeps overlay + HUD; snapshot exports video+overlay as PNG.
6. Selection per SPEC.md §7 (click box, click empty to clear, Esc, Tab cycling). InlineDetailCard anchored and clamped as specified.
7. Remove <PipelineDebug/>.

Acceptance (verify all in the browser, with screenshots and a short screen recording):
- Synthetic demo: boxes sit exactly on the drawn objects at 1440, 1024 and 390 widths and after resizing the window live; fullscreen keeps alignment.
- Webcam: permission prompt flow works; denying shows the denied state with "Run demo scene instead"; no simulated boxes ever appear over the webcam.
- Pause freezes video + overlay; threshold slider immediately hides/shows boxes; B/L/T/F/Space shortcuts work.
- Labels never overlap; near-top boxes flip their label inside.
- Profile with React DevTools/Performance panel for 10s of demo: the intel panel and timeline do not re-render on every frame. Report what you measured.
- Compare your 1440×900 screenshot against DESIGN.md §5 line by line and list any deviations you fixed.
```

## Phase 5 — Intelligence panel and timeline

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. Reuse primitives and stores; all data comes from detectionStore/uiStore.

Goal: the right-hand intel panel (SPEC.md §8) and the bottom timeline (DESIGN.md §7) are complete and synchronized with the viewport.

1. IntelPanel sections: CurrentDetection, AttributeGrid, AiDescription (pending shimmer → ready → unavailable), RecentDetections (thumbnails, pills, new-row flash once, class filter chips, keyboard ↑/↓, virtualization past 100 rows), "Auto-follow newest" toggle in the header (default off).
2. Selection rules from SPEC.md §7 exactly — a new detection must never steal the selection; exited tracks remain inspectable with "No longer in frame".
3. DetectionTimeline: class lanes, track bars from first to last seen, event ticks, 1/5/15 min window, live scrolling "now" edge, hover tooltip, click to select, selected bar highlighted, axis labels in mono.
4. Below 1024px the intel panel lives in the right drawer; below 640px use the segmented [Current · Recent · Timeline] layout from DESIGN.md §4.

Acceptance:
- Click a box → panel + recent row + timeline bar all highlight the same track. Click a recent row → box highlights in the feed (if visible). Click a timeline bar → same.
- Leave the demo running 3 minutes with a track selected: selection never changes on its own (auto-follow off), memory stays flat (check the Performance monitor), list stays smooth.
- Screenshots at 1440, 1024 (drawer open), 390. Information density matches DESIGN.md §6 row specs exactly (52px rows, 32px thumbs).
```

## Phase 6 — History, Overview, Analytics, Settings

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. No new visual language — these pages must look like they belong to the Live Monitor.

1. /history per SPEC.md §9: sortable table, all filters as removable chips, search across class/ID/description/attributes, Export menu (CSV/JSON of filtered rows, include-thumbnails option for JSON), Clear history with a named-count confirm dialog, empty and zero-results states. Clicking a row selects the track and offers "Show in Live Monitor".
2. /overview per SPEC.md §2: 4 stat tiles (label 11px mono uppercase, value 20px mono — no count-up animations), live thumbnail of the viewport, last 10 events, source/model status.
3. /analytics: three hand-drawn SVG charts from store data (detections/min bars for the session, class distribution horizontal bars, confidence histogram). Axes in mono 10.5px text-3, bars in class colors or cyan, gridlines in line-1, hover values. Proper empty state before any data exists.
4. /settings: camera device select (enumerateDevices, with a permission hint), mirror, overlay defaults (boxes/labels/trails), default threshold, history cap, watchlist classes, "Reset all settings" with confirm. Persist via localStorage with try/catch.

Acceptance:
- Exported CSV opens correctly in a spreadsheet (commas/quotes inside descriptions don't break columns); JSON is valid and matches the Track type.
- Filters combine correctly (AND) and the export uses the filtered set — test with at least 3 combinations.
- All four pages at 1440 and 390 without overflow.
```

## Phase 7 — Model Management (simulated deployment, real WebSocket test)

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. Follow SPEC.md §10 exactly, including the persistent amber simulation banner.

1. ModelUpload: dropzone + picker, type/size/empty validation with inline messages, simulated progress with cancel, file summary row.
2. ModelConfigForm with every field in SPEC.md §10, blur-first validation, instant error clearing, Deploy enabled only when valid. Verb-first button labels ("Deploy model", "Stop model", "Test connection") — never "Submit"/"OK".
3. DeploymentCard with the full state machine (not_configured, ready, deploying with 4-step checklist, running, stopped, failed via the "Simulate failure" checkbox), uptime, and correct actions per state.
4. EndpointForm: real WebSocket connection test with 5s timeout and the true error; "Use as detection source" switch that swaps the active source to websocketSource; collapsible DetectionFrame message format documentation (copyable JSON example).
5. Integration: a "running" simulated model updates the simulator's label, classes, threshold and watchlist; the top bar and HUD model chips reflect state everywhere ("yolov8n@1.2.0 · SIMULATED").
6. Persist config to localStorage.

Acceptance:
- Walk every state transition and screenshot each state.
- Nowhere in the UI claims a real model is executing in simulated mode (grep the copy).
- Test connection against wss://echo.websocket.org (or any echo server) shows success; against an invalid host shows a clear failure within 5s.
```

## Phase 8 — Design and engineering audit (no new features)

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully. Do NOT add features. Your job is to make what exists flawless.

Work through this as a checklist and report each item as fixed / already OK:

Visual
- Screenshot every route at 1440×900, 1024×768, 390×844. For each, compare against DESIGN.md: type scale, weights, label style, spacing on the 4px grid, radius ≤ 6, hairline usage, color ratios, icon size/stroke consistency (16px, 1.5).
- grep for hex colors outside tokens.css, font sizes not in the scale, rounded-lg/xl, shadow-* on non-floating elements, gradients, backdrop-blur. Fix all.
- Bounding boxes: check every state on the synthetic scene and webcam (no boxes). Label collisions, top-edge flip, mirroring, fullscreen alignment.
- Banned list in DESIGN.md §10 — confirm none present.

Interaction
- Every button/toggle/shortcut does what it says. Every empty, loading, error state reachable and correct. Camera permission denied/granted/no-device paths. Model state machine. Export files open correctly.
- Keyboard-only pass through /live and /models; visible focus everywhere; dialogs trap and restore focus.
- prefers-reduced-motion (emulate in DevTools) behaves per DESIGN.md §9.

Engineering
- Zero TypeScript, lint, test and console errors/warnings. Remove dead code, unused exports and the /__ui route from the production router (keep it behind import.meta.env.DEV).
- 5-minute demo soak: memory flat, no growing listeners, fps steady; report numbers.
- npm run build succeeds; report bundle size.

Finish with a list of the 10 most impactful fixes you made, with before/after screenshots for the top 3.
```

## Phase 9 (optional) — Real in-browser detection on the webcam

Only do this once 1–8 are solid. It turns webcam mode from "No model connected" into real detection without any backend.

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning.

Add src/sources/browserModelSource.ts implementing DetectionSource with kind "browser-model", using @tensorflow-models/coco-ssd (lite_mobilenet_v2) on the webcam video element, running inference at most every 100ms off the render loop. Convert outputs to normalized RawDetection. Since COCO-SSD has no tracker, add a simple IoU-based track assignment in src/engine/iouTracker.ts (unit-tested) so IDs are stable across frames.

UI: in webcam mode the "No detection model connected" chip gets a second action "Use browser model (COCO-SSD)". While loading the model show a progress state in the viewport. HUD/top bar show "BROWSER MODEL · COCO-SSD" (not "SIMULATED"). Descriptions show "unavailable" (no VLM in browser). The model is lazy-loaded so it doesn't affect initial bundle size.

Acceptance: real people/objects in front of the webcam get correct, stable boxes; switching back to demo mode unloads the model and stops inference; no console errors; initial bundle size unchanged (report it).
```

---

## Fix prompt (use whenever something looks off)

Attach a screenshot, then:

```
Re-read docs/DESIGN.md. In the attached screenshot of <route> at <width>px, these things are wrong:
1. <exact problem, e.g. "label chips on the two left people overlap">
2. <...>
For each: find the cause in code, fix it at the source (tokens/primitives/geometry, not one-off overrides), then re-screenshot at the same size and at 1440 and 390 to confirm you didn't break other layouts. Do not change anything else.
```

Being specific about *what* is wrong works far better with Antigravity than "make it look more premium". If you can't name the problem, ask it: "Compare this screenshot against DESIGN.md §5 and list every deviation before changing anything."
