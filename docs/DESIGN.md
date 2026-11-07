# DESIGN.md — VISOR design system

The look is closer to a flight-test telemetry console or a defense-grade ISR (intelligence, surveillance, reconnaissance) station than to a SaaS dashboard. Structure comes from hairlines and alignment, not from cards and shadows. The video is the brightest thing on screen, and everything around it stays quiet.

## 1. Color tokens

Define these as CSS variables in `src/styles/tokens.css` and map them into `tailwind.config`.

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#07090B` | App background, area behind the video |
| `--bg-1` | `#0B0E12` | Panels, top bar, sidebar |
| `--bg-2` | `#10141A` | Raised rows, inputs, chips |
| `--bg-3` | `#161B22` | Hover |
| `--line-1` | `#1C232B` | Default hairline borders and dividers |
| `--line-2` | `#28313B` | Input borders, emphasized dividers |
| `--text-1` | `#E6EDF3` | Primary text |
| `--text-2` | `#97A3AF` | Secondary text |
| `--text-3` | `#5C6773` | Tertiary text, disabled, axis labels |
| `--cyan` | `#2BD9F0` | The single accent: selection, focus, live, primary action |
| `--cyan-dim` | `rgba(43,217,240,0.14)` | Selected row background, chip fill |
| `--amber` | `#F5A524` | Warning, flagged detection, demo/simulation badge |
| `--green` | `#3DD68C` | Healthy, connected, running |
| `--red` | `#F2555A` | Error, failed, recording dot |

**Detection class colors** are the only additional hues. Use them at full strength only on the box stroke and the class swatch, never as fills larger than 8px:

- person `#2BD9F0` (cyan), vehicle `#7FA8FF`, bag/backpack/suitcase `#C7A6FF` desaturated to `#B8A9D9`, animal `#8FD3A8`, other `#97A3AF`
- A **flagged** detection (any class on the watchlist) overrides its class color with amber.

Ratio target: about 85% neutrals, 10% text, and 5% accent on any screen.

## 2. Typography

- UI font: **Inter Variable**. Mono font: **JetBrains Mono**, used for every number, ID, timestamp, coordinate, and HUD text.
- Enable `font-variant-numeric: tabular-nums` globally on mono text so numbers don't jitter while updating.

| Role | Font | Size / line-height | Weight | Notes |
|---|---|---|---|---|
| Section label | Mono | 11 / 16 | 500 | UPPERCASE, `letter-spacing: 0.08em`, `--text-3` |
| Body | Inter | 13 / 20 | 400 | Default UI text |
| Body strong | Inter | 13 / 20 | 550 | Names, row titles |
| Small | Inter | 12 / 16 | 400 | Secondary metadata |
| Data | Mono | 12 / 16 | 400 | IDs, times, coords |
| Metric | Mono | 20 / 24 | 500 | The largest text in the app (e.g. confidence on the detail card) |
| HUD | Mono | 10.5 / 14 | 500 | Uppercase, 0.06em tracking, on-video text |

Never use font sizes above 20px. Never use more than two weights on one panel.

## 3. Spacing, radius, borders

- 4px base grid. Allowed spacing values are 4, 8, 12, 16, 20, 24, and 32. Panel inner padding is 12px, and 16px only on Model Management forms.
- Radius: 2px for HUD elements, chips and bounding-box labels; 4px for buttons, inputs and rows; 6px for drawers and dialogs. Never use more than 6px.
- Borders are 1px `--line-1`. Panels are separated by borders, not gaps. The layout should read as one machined surface divided by hairlines.
- Shadows only appear on floating layers (menus, dialogs, tooltips): `0 8px 24px rgba(0,0,0,0.5)`.
- Focus ring: `0 0 0 1px var(--bg-0), 0 0 0 2px var(--cyan)` on every interactive element.

## 4. Layout (desktop ≥ 1280px)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ TOP BAR 44px                                                              │
├────┬─────────────────────────────────────────────────────┬────────────────┤
│ SB │  VIEWPORT TOOLBAR 40px                              │  INTEL PANEL   │
│56px│ ┌─────────────────────────────────────────────────┐ │  360px         │
│    │ │                                                 │ │  Current det.  │
│    │ │          CAMERA VIEWPORT (16:9, letterboxed)    │ │  Attributes    │
│    │ │          + overlay + HUD                        │ │  AI descr.     │
│    │ │                                                 │ │  ───────────   │
│    │ └─────────────────────────────────────────────────┘ │  Recent        │
│    ├─────────────────────────────────────────────────────┤  detections    │
│    │  DETECTION TIMELINE 136px                           │  (scrolls)     │
└────┴─────────────────────────────────────────────────────┴────────────────┘
```

- CSS grid: `grid-template-columns: var(--sb) 1fr 360px; grid-template-rows: 44px 1fr;` with `--sb` at 56px collapsed and 208px expanded.
- The center column is `grid-template-rows: 40px 1fr 136px`. The video area is the `1fr`, and the video is letterboxed inside it on `--bg-0`.
- The app is exactly the viewport height (`100dvh`). Only the recent detections list, history table and forms scroll. The page itself never scrolls on Live Monitor.

**Responsive**
- 1024–1279px: intel panel is 320px wide, and the sidebar is forced collapsed.
- 640–1023px: the intel panel becomes a right drawer (360px, overlays the content) opened from a top-bar button that shows the live track count. Sidebar becomes a left drawer opened from a menu button.
- < 640px: single column. Order is top bar → viewport (full width, 16:9) → segmented control [Current · Recent · Timeline] → selected section. Viewport toolbar collapses into an overflow menu. All tap targets are at least 40px.
- Horizontal overflow is a bug at every width.

## 5. The camera viewport (the hero)

**Frame.** The video sits on `--bg-0`, with a 1px `--line-1` border around the letterboxed content rect (not the container). A very subtle inner vignette (`radial-gradient` to 25% black at the edges) is the only effect on the video.

**HUD.** All HUD text uses the HUD style, sits 12px inside the content rect, and is placed on a `rgba(7,9,11,0.55)` chip with 2px radius and 2px 6px padding so it's readable on any footage.
- Top-left: `● REC` (red dot, 1.2s opacity pulse) · `CAM_01 · LOBBY-N` (camera id · location)
- Top-right: `2026-11-07 13:42:08.214 IST` with live milliseconds updated through rAF, and no React re-render per frame
- Bottom-left: `1920×1080 · 30.0 FPS · 42 MS` (resolution · measured fps · source latency)
- Bottom-right: model chip, either `MODEL · yolov8n · 14 OBJ` or `NO MODEL` or `SIMULATED · DEMO SCENE` in amber
- Four 14px L-shaped corner marks in `--line-2` at the corners of the content rect. These are the viewfinder and should stay static.

**Bounding boxes.** This is the most important visual in the product.
- **Default track:** a 1px rectangle in class color at 35% opacity, plus 10px corner brackets at 100% opacity and 1.5px stroke. Use `vector-effect: non-scaling-stroke`.
- **Label chip** sits attached above the box's top-left corner, flush with the box edge. It has a class-color fill at 92%, `#061014` text, HUD font, and reads `PERSON  #004  98.4%`. If the box is within 20px of the top edge, the chip flips inside the box. Labels collide when boxes overlap, so a label must never cover another box's chip. Offset it down by chip height instead.
- **Hover:** rectangle goes to 70% opacity, cursor pointer, and a tooltip-free 120ms transition.
- **Selected:** rectangle goes to 100% at 1.5px, brackets become 2px with 14px arms, and a small 6px crosshair appears at the box center. Every other box dims to 45%. A 1px dashed leader line runs from the box's right edge to the inline detail card (see below).
- **New track:** brackets start at scale 1.12 and opacity 0, then animate to 1 and 1 over 200ms ease-out. Do it once only.
- **Lost track** (not seen for >1s): dashed rectangle, `--text-3` color, label reads `#004 LOST`, and it fades out over 600ms at 5s.
- **Trail** (toggle): polyline through the last 30 centroids, 1px class color with opacity going from 0 to 0.5 along its length.
- **Motion:** boxes interpolate between frames (lerp position and size over the frame interval) so they glide instead of jumping.

**Inline detail card** (selected track only). This is a 220px-wide floating card anchored beside the box (right side, or left if there's no room), clamped inside the content rect. It uses `--bg-1` at 92% opacity with a 1px class-color border at 40% and 2px radius. Contents: class + ID, confidence bar (2px tall), first-seen time, 2–3 key attributes, and a "View details →" link that scrolls the intel panel to the selected track.

**Viewport states.** Each one is centered in the content rect, uses mono 12px text, includes one icon and one action, and never shows a blank black box.
- Idle: "Camera off", with actions [Start webcam] [Run demo scene].
- Requesting permission: "Waiting for camera permission…", plus a hint about the browser prompt.
- Permission denied: explains how to re-enable it in the browser, with an action [Run demo scene instead].
- No camera found / in use by another app: same pattern, with the specific message.
- Paused: video freezes, the overlay stays frozen, and the HUD shows a `PAUSED` amber chip.
- Webcam, no model: video plays, no boxes, and a bottom-center chip reads "No detection model connected · Connect model →".

## 6. Panels and lists

- Panel header: 36px tall, section label on the left, optional count or action on the right, and a 1px bottom border.
- Recent detections row: 52px tall. Layout is a 32×32 thumbnail (crop of the frame at detection time, 2px radius, falls back to the class icon on `--bg-2`), then name + ID on line 1 and time + status on line 2, with confidence right-aligned in mono. The selected row gets a `--cyan-dim` background and a 2px cyan left edge. A row arriving new gets a 400ms `--cyan-dim` flash, once.
- Status pills: 18px tall, 2px radius, mono 10.5px uppercase, tinted background at 14% with full-color text. VISIBLE = cyan, LOST = text-3, FLAGGED = amber.
- Confidence is always shown as `98.4%` (one decimal) in mono. Below the confidence threshold, it is never shown at all, because those detections are filtered.

## 7. Timeline

- A horizontal time axis spans the last 5 minutes (a 1 / 5 / 15 min toggle sits on the right of the header). "Now" is at the right edge and the axis scrolls left smoothly.
- There's one lane per class (max 5 visible lanes, 20px each), with a class swatch + name label column 88px wide.
- Each track renders as a bar from first-seen to last-seen in class color at 50% (100% when selected). Point events (new, lost, flagged) are 6px ticks. Flagged ticks are amber.
- Hover shows a tooltip with class, ID, time range, and peak confidence. Clicking a bar selects that track.
- Mono 10.5px axis labels every 30s / 1min / 3min.

## 8. Controls

- Buttons are 28px tall (32px in forms). Variants:
  - Primary: cyan fill, `#061014` text. Use at most one per view.
  - Secondary: `--bg-2` fill with a `--line-2` border.
  - Ghost: transparent, `--text-2` text, `--bg-3` on hover.
  - Danger: red text, red background on confirm.
- Icon buttons are 28×28 with a 16px Lucide icon at stroke 1.5. Each needs a tooltip with its name and keyboard shortcut.
- Toggles inside the viewport toolbar are icon buttons with a pressed state (`--cyan-dim` fill, cyan icon).
- Slider (confidence threshold): 2px track, 10px square thumb with 2px radius, and the value shown in mono at the right.

## 9. Motion

- Durations: 120ms (hover, press), 180ms (panel/row changes), 240ms (drawers, dialogs). Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- The only looping animations allowed are the REC dot pulse and the "analyzing" shimmer on a pending AI description. Don't add scanning lines, radar sweeps, glitch effects, or typing effects.
- `prefers-reduced-motion`: disable box interpolation easing (snap), disable flashes and pulses, and keep only opacity fades ≤120ms.

## 10. Banned list

Don't use any of these: gradient text, purple/pink, backdrop-blur panels, rounded-xl/2xl, cards with drop shadows on the main layout, emoji, stock illustrations, big hero headings, numbers that animate by counting up, fake terminal logs, decorative boxes not driven by detection data, radar/sonar decorations, hexagon patterns, or "AI" sparkle icons.
