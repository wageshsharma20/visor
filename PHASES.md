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
4. Create a dev-only route /__ui that shows every primitive in every state (default, hover note, disabled, error, loading) on the real background colors so it can be visually reviewed. This page is a tool, not a product page. Hide it from the icon rail.

Acceptance (verify each, with screenshots, before reporting):
- typecheck, lint and test pass; zero console errors.
- /__ui renders every primitive; `npm run audit:tokens` passes.
- Dialog traps focus and restores it; Tooltip appears on keyboard focus, not only hover.
- Screenshot /__ui at 1440×900 and check alignment of label baselines and 4px spacing; fix anything off.
```

## Phase 1.5 — Re-skin to DESIGN.md v2 ("Graphite Node")

Run this before Phase 2. The visual reference is saved at docs/design-reference.png.

```
Read AGENTS.md, docs/DESIGN.md (now v2 "Graphite Node") and docs/SPEC.md fully before planning. Open docs/design-reference.png — it is the visual reference DESIGN.md was derived from — match its feel, but DESIGN.md's exact values win.

The design system changed after Phase 1. src/styles/tokens.css, tailwind.config.ts and scripts/audit-tokens.mjs are ALREADY updated to v2 — do not edit them except to fix a genuine bug (explain it if you do). Your job is to migrate every Phase 1 primitive and /__ui to the new tokens. No new product features.

1. Run `npm run audit:tokens` first and save the output: it lists every v1 usage to migrate (about 107 issues: arbitrary radii, cyan classes, removed v1 tokens like text-section / h-btn-sm / shadow-floating, a raw hex).
2. Global styles (src/styles/index.css): focus ring = --focus-ring; scrollbars in bg-3/bg-4; selection in accent-dim; skeleton shimmer from bg-3 to bg-4. Keep Inter Variable + JetBrains Mono.
3. Re-skin each primitive exactly per DESIGN.md §3 and §8:
   - Button: primary = white pill (fill-white / on-white), new "accent" variant (green), secondary, ghost, danger; 32px (36px form size); rounded-control.
   - IconButton 32×32, 16px icons stroke 1.75, icon-dim → text-1; pressed = steel fill + on-white icon.
   - Input/Select: 36px, bg-3, borderless (line-2 on hover, accent on focus), label above in text-label/text-2 with 6px gap, ChevronDown in text-3.
   - Slider → the white pill slider (28px track bg-3, fill-white fill, 20px dark thumb, min/max labels inside), plus a `compact` 20px variant.
   - SegmentedControl: bg-3 track, active segment = white pill.
   - Switch 32×18 green when on. Pill 20px rounded-full tinted. Badge/Kbd rounded-chip. New MetaChip (icon + data text). New AvatarStack. New StatusDot (live/idle/warning/error).
   - Panel → rename to Card (keep a Panel re-export for now): bg-2, 1px line-1, rounded-card; CardHeader 36px with 14px icon + text-card-title + right slot (status dot/action). Remove PanelHeader's uppercase mono style.
   - Tooltip, Menu, Toast, Dialog, Drawer: bg-2 + 1px line-2 + shadow-float; radii per §3 (dialogs/drawers rounded-panel, menus/toasts rounded-card, tooltips rounded-chip).
   - EmptyState: 36px hub-style icon square + body-strong title + small text + action.
4. Rebuild /__ui on the dot-grid canvas (bg-canvas): show each primitive inside a NodeCard-style card with a header and status dot, so the page itself looks like the reference.
5. Update the tests that assert old class names; keep every behavior test (focus trap, restore, Esc, tooltip on focus, slider keys, toast timing).

Acceptance:
- `npm run audit:tokens`, typecheck, lint, test, build all pass with zero issues.
- Screenshot /__ui at 1440×900, 1024×768, 390×844 and compare against docs/design-reference.png and list what you matched: near-black canvas with faint dot grid, bordered graphite cards with icon + title + green dot headers, dark borderless select fields with labels above, white pill sliders, green used sparingly.
- No cyan, blue or purple anywhere in the rendered UI.
- Commit as "refactor(design): migrate primitives to DESIGN.md v2 Graphite Node".
```

## Phase 2 — App shell: layout, top bar, icon rail, routes

```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN.md fully before planning. Reuse the Phase 1 primitives; do not restyle them.

Goal: the full application shell and routing, with every page present and honest (no fake content), but no camera/detection features yet.

1. AppLayout with the exact structure from DESIGN.md §5: 56px top bar, 52px icon rail, dot-grid canvas content area (bg-canvas, 20px padding), 1fr + 360px column grid with 16px gap (100dvh, no page scroll on /live). Responsive behavior exactly as DESIGN.md §5 Responsive, including the right drawer below 1024px and the bottom floating nav below 640px.
2. TopBar per SPEC.md §3 and DESIGN.md §5 (page title + cloud icon, grouped icon capsule, avatar stack with members popover, source/model chips). The source/model/camera chips read from stores (create cameraStore, modelStore, uiStore skeletons with the types from SPEC.md §4 now) and show their idle states: source "NO SOURCE", model "NO MODEL", camera "OFF".
3. IconRail per DESIGN.md §5: 52px, logo mark on top, 32×32 items with 16px icons in icon-dim, active item = accent green fill + on-accent icon + glow, tooltips on the right, exit at the bottom. Also build the reusable graph primitives from DESIGN.md §4 now (Wire with idle/streaming/error states and traveling pulse, Port, HubNode, NodeCard with 36px header + icon + title + status dot) and show them on /__ui.
4. Routes per SPEC.md §2. /live shows the real layout regions (pipeline strip in its idle state, viewport card showing the "Camera offline" ViewportState from DESIGN.md §6.6, floating toolbar row, timeline region with its empty state, intel panel with its empty states). Other pages show their real headers and proper empty states that explain what will appear and link to /live. No "Coming soon".
5. Keyboard: `g l`, `g o`, `g m`, `g h`, `g a` navigate to live/overview/models/history/analytics.

Acceptance:
- Screenshots of /live at 1440×900, 1280×800, 1024×768, 768×1024, 390×844: no horizontal overflow at any width, drawers work below 1024, the viewport region is always the visually dominant area.
- Every top-bar and rail control does something. No dead buttons.
- The layout matches DESIGN.md §5's diagram: bordered graphite cards floating on the dot-grid canvas with 16px gaps, the viewport card clearly dominant, green used only for the active rail item and status dots.
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

## Phase 3.5 — Simplify (remove clutter before building more)

```
Read AGENTS.md (new "Simplicity rules"), docs/SPEC.md §2, §3, §7, §8 and docs/DESIGN.md §5–§7. The product was too cluttered; the docs now describe a much simpler app. This phase only REMOVES and consolidates — no new features.

1. Pages: keep /live, /models, /history. Delete the Overview and Analytics pages, their routes, rail items and shortcuts. Turn /settings into a SettingsDrawer opened from the top-bar gear (same fields, fewer: camera device, mirror, default threshold, history limit, reset). Redirect /overview, /analytics, /settings to /live.
2. Top bar: page title on the left; on the right only ONE status pill (SPEC §3, reading usePipelineStatus(), with a details popover on hover/focus) and the settings gear. Remove the wordmark, workspace switcher, SRC/MODEL/CAM chips, health dot, avatars and members dialog.
3. Icon rail: logo + Live, Model, History. Exit button removed.
4. Live Monitor: remove the PipelineStrip and the TimelineCard (the timeline moves to History in Phase 6). Viewport takes the freed height.
   - HUD: only "● LIVE · CAM_01" top-left (or PAUSED) and the time top-right. Remove the bottom-corner chips and the viewfinder corner marks.
   - Toolbar: 5 items (Start ▾ menu with Webcam / Demo scene, Pause, Boxes, threshold, Fullscreen). Remove the Webcam|Demo segment, Labels, Trails and Snapshot.
   - Side panel: two cards, "Selected object" (with the AI description inside it) and "Detections". Delete the separate AI Description card.
5. Delete components, stores fields, shortcuts and tests that only served removed features. Keep PipelineDebug for now (Phase 4 removes it).

Acceptance: audit/typecheck/lint/test/build pass; zero console warnings; screenshots of /live at 1440 and 390, /models and /history at 1440. Count and report: rail items (3), top-bar elements right side (2), toolbar items (5), side-panel cards (2). Commit "refactor: simplify app to three pages and a single status surface".
```

## Phase 4 — Camera viewport and detection overlay (the hero)

```
Read AGENTS.md, docs/SPEC.md §6–§7 and docs/DESIGN.md §6.1–§6.5. Use the engine from Phase 3; no detection logic in components. Keep it simple — don't add anything the docs don't list.

1. CameraViewport: VideoLayer (video for webcam, canvas for the synthetic scene), DetectionOverlay, the 2 HUD chips, ViewportState — all positioned with geometry.contentRect + ResizeObserver so they align to the letterboxed picture.
2. Start ▾ menu: "Webcam" (existing real getUserMedia flow) or "Demo scene" (synthetic source drawing into the canvas). Switching stops the previous source. The webcam keeps running when navigating to other pages (the top-bar pill shows it's live).
3. Overlay per DESIGN §6.3: one <svg> for boxes (non-scaling 1.5px strokes), HTML labels via resolveLabelPositions ("PERSON 98%", ID only on hover/selected), rAF interpolation, lost = dashed fade, flagged = amber, selected = 2px + glow + others dimmed. Boxes are focusable buttons.
4. With webcam and no model: no boxes ever; the small "No model connected · Connect →" chip.
5. Toolbar behaviors: Pause freezes video + overlay; Boxes toggles the overlay; threshold immediately hides/shows boxes; Fullscreen on the viewport card; shortcuts Space / B / F.
6. Selection: click box selects (fills the side panel's Selected object card), click empty or Esc clears.
7. Remove PipelineDebug.

Acceptance (in the browser): in Demo scene, boxes sit exactly on the drawn objects at 1440, 1024 and 390 and after live window resizing and in fullscreen; webcam shows no boxes; labels never overlap; the side panel doesn't re-render every frame (report what you measured). Screenshots at 1440 and 390. Commit "feat(phase-4): camera viewport and detection overlay".
```

## Phase 5 — Side panel (Selected object + Detections)

```
Read AGENTS.md, SPEC.md §7–§8 and DESIGN.md §6.6. Two cards only.

1. Selected object card: class + #ID + status pill; metric confidence + thin bar; meta chips (first seen · time in view); up to 3 attribute chips; AI description paragraph inside the card (2-line shimmer while pending; omitted if no description model) with a one-line footer ("simulated" or model name). Empty state per SPEC.
2. Detections card: newest first, last 50 rows (48px, 32px thumbnail, "Person #004", time, confidence), lost/exited rows at 50% opacity, selected row highlighted, new row flashes once, ↑/↓ keyboard selection, "View all in History →".
3. Clicking a row selects the track and highlights its box if visible. New detections never steal the selection.
4. 640–1023px: the panel is a right drawer opened by "Detections (n)" in the top bar. <640px: cards stack under the toolbar.

Acceptance: click box ↔ row stay in sync; 3 minutes of demo with a selection held — selection never changes by itself, memory flat; screenshots at 1440, 768 (drawer open) and 390. Commit "feat(phase-5): side panel".
```

## Phase 6 — History page and Settings drawer

```
Read AGENTS.md, SPEC.md §9 and §2 (Settings drawer), DESIGN.md §7.

1. History: 3 stat cards (Total detections, Flagged, Most seen class); timeline card (lane per class, 5/15/60 min, click bar = select); table (time, class, ID, peak confidence, duration, flagged, description) with one search box + one class select; Export menu (CSV/JSON of filtered rows, hidden when empty); Clear history confirm naming the count; empty and zero-result states.
2. Settings drawer: camera device (enumerateDevices), mirror webcam, default threshold, history limit, Reset to defaults. Persist to localStorage with try/catch.

Acceptance: exported CSV opens correctly in a spreadsheet (commas/quotes in descriptions); search + class filter combine; screenshots at 1440 and 390. Commit "feat(phase-6): history and settings".
```

## Phase 7 — Model page (simulated deployment, real WebSocket)

```
Read AGENTS.md, SPEC.md §10 and DESIGN.md §9. Three nodes + one endpoint card, nothing more.

1. Source node (read-only status + "Change" link), Model node (dropzone with validation + simulated progress, name, runtime, threshold, state pill, one primary action: Deploy (simulated) / Stop / Retry; an invalid file leads to Failed), Output node (stack of last 3 thumbnails or empty state). Wires between them using the graph primitives; pulse only while running/streaming.
2. Endpoint card: WebSocket URL, real Test connection (5s timeout), "Use as detection source" switch after success (switches the active source via the Phase 3 source switching), collapsible DetectionFrame message format.
3. A simulated model shows as "simulated" in the top-bar pill everywhere — never as a real running model.
4. Persist config to localStorage.

Acceptance: walk Not configured → Deploying → Running (simulated) → Stopped, and Failed via invalid file; test connection against a reachable echo server and an invalid host; screenshots at 1440 and 390. Commit "feat(phase-7): model page".
```

## Phase 8 — Final polish audit (no new features)

```
Read AGENTS.md (especially Simplicity rules), DESIGN.md and SPEC.md. Do NOT add features. Make what exists flawless and simple.

- Simplicity check: for every screen, list every element and remove any that repeats information or isn't in the docs. Confirm: 3 rail items, 2 top-bar items on the right, 5 toolbar items, 2 side-panel cards, status shown once per screen.
- Visual: screenshots of every page and the Settings drawer at 1440, 1024 and 390; check type tokens, spacing, radius tokens, borders, green used sparingly; audit:tokens clean.
- Interaction: every button works; webcam allow/deny/stop; demo scene; selection sync; export; model states; keyboard-only pass with visible focus; prefers-reduced-motion.
- Engineering: zero TS/lint/test/console errors or warnings; remove dead code; 5-minute demo soak with flat memory; build succeeds.

Report the 10 most impactful fixes with before/after screenshots for the top 3. Commit "chore: final polish".
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
