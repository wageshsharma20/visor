# DESIGN.md — VISOR design system (v2, "Graphite Node")

**Direction.** This is a near-black AI workbench. Floating graphite cards sit on a faint dot-grid canvas, there is one signal-green accent, small precise type, and green node "wires" show how data flows. The look comes from a node-based AI pipeline editor: a thin icon rail, small titled cards with a green status dot, dark select fields, white pill sliders, a floating bottom toolbar, and bezier wires between nodes.

**Why this fits VISOR:** a detection system *is* a pipeline (Camera → Model → Tracker → Outputs). The node-and-wire language shows the real pipeline state. It is never decoration. The camera feed is still the hero, the largest and brightest element on screen.

> Values were sampled from the reference image. When this file and older code disagree, this file wins.

---

## 1. Color tokens (`src/styles/tokens.css`)

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#070707` | Deepest well: the video letterbox |
| `--bg-1` | `#0A0A0A` | Canvas / app background, with a dot grid (§3) |
| `--bg-2` | `#131313` | Cards, icon rail, top-bar groups, floating toolbar |
| `--bg-3` | `#1C1C1C` | Fields inside cards (selects, inputs), hovered rows, chips |
| `--bg-4` | `#262626` | Pressed state, slider and progress tracks |
| `--line-1` | `#1F1F1F` | 1px card borders, rail edge, dividers |
| `--line-2` | `#2B2B2B` | Field borders, hovered card border |
| `--grid-dot` | `#171717` | Canvas dot grid |

### Text

| Token | Value | Use |
|---|---|---|
| `--text-1` | `#EDEDED` | Primary text, values |
| `--text-2` | `#9A9A9A` | Secondary text, field labels |
| `--text-3` | `#666666` | Tertiary text, timestamps, placeholders. Don't use it for anything a user must read to act |
| `--icon-dim` | `#5C5C5C` | Inactive rail and toolbar icons |
| `--fill-white` | `#EFEFEF` | The white pill (slider fill, active segment, primary button) |
| `--on-accent` | `#08130A` | Icon or text on a green fill |
| `--on-white` | `#111111` | Text on a white fill |

### Accent and status

| Token | Value | Use |
|---|---|---|
| `--accent` | `#5FB84A` | Signal green, the only accent: active rail item, wires, live/healthy, links, focus |
| `--accent-bright` | `#8BE07A` | Bounding boxes, selected states, status dots. It's brighter so it reads over video |
| `--accent-dim` | `rgba(95,184,74,0.14)` | Selected row fill, active chip fill |
| `--steel` | `#92ADB8` | Secondary cool neutral: active floating-toolbar tool, vehicle class |
| `--amber` | `#E8B04B` | Warnings, flagged detections, SIMULATED / DEMO badges |
| `--red` | `#EF5B5B` | Errors, the REC dot |

Green means both "accent" and "healthy/active". That's intentional; it's how the reference uses it. Amber and red are the only other signal colors. **Do not use cyan, blue, purple or decorative gradients anywhere.**

### Detection class colors (box strokes and swatches only)

Use person `#8BE07A` · vehicle `#92ADB8` · bag/backpack/suitcase `#C8B6E8` · animal `#E3B98A` · other `#9A9A9A`. A flagged detection uses `--amber` regardless of class.

### Ratio

Aim for roughly 88% black/graphite, 9% text, 3% green. Green should feel rare and meaningful.

## 2. Typography

- **UI:** Inter Variable (already installed). **Numbers, IDs, timestamps, HUD:** JetBrains Mono with `tabular-nums`.
- The reference is small and quiet. Hierarchy comes from weight and color, not size.

| Token | Font | Size / LH | Weight | Use |
|---|---|---|---|---|
| `title` | Inter | 15 / 20 | 600 | Page title in the top bar ("Lobby-North · Live Monitor") |
| `card-title` | Inter | 12 / 16 | 500 | Card header text next to a 14px icon ("Current Detection") |
| `body` | Inter | 13 / 18 | 400 | Values, descriptions, row titles |
| `body-strong` | Inter | 13 / 18 | 600 | Emphasized values |
| `label` | Inter | 11 / 14 | 500 | Field labels above controls ("Core Model"), in `--text-2` |
| `small` | Inter | 11 / 14 | 400 | Helper text, sublabels ("Medium", "Low / High") |
| `metric` | Mono | 20 / 24 | 500 | The largest text in the app (confidence, stat tiles) |
| `data` | Mono | 11.5 / 16 | 400 | IDs, times, coordinates, meta chips |
| `hud` | Mono | 10.5 / 14 | 500 | On-video HUD and box labels, UPPERCASE, +0.06em |

Rules:
- Max size is 20px. Max weight is 600. No uppercase except `hud` and status pills.
- **Field pattern:** `label` in `--text-2` above a `--bg-3` field or value. This is the reference's "Core Model ▾ / Claude 4" pattern; use it for every key/value block and form.
- **Meta chips:** small `--bg-3` chips with a 12px icon + `data` text (the reference's "Opus 4.6 · 20 Tokens · 10.0 Sec" row). Use them for detection metadata like `#004 · 98.4% · 12.3s`.

## 3. Shape, canvas, elevation

**Radius tokens.** Use the names, never arbitrary values.

| Token | Value | Use |
|---|---|---|
| `rounded-chip` | 6px | Meta chips, HUD chips, box label chips, Kbd, tooltips |
| `rounded-control` | 8px | Buttons, fields, selects, menu items, rows, rail items, toolbar items |
| `rounded-card` | 12px | Cards (nodes), menus, toasts, the floating toolbar |
| `rounded-panel` | 14px | The camera viewport card, dialogs, drawers |
| `rounded-full` | 9999px | Pill sliders, progress tracks, pills, status dots, avatars |

Bounding boxes on video use 3px corners (`rx="3"`).

**Canvas.** The content area background is `--bg-1` with a dot grid: `radial-gradient(var(--grid-dot) 1px, transparent 1px)` at a 20px × 20px size (the `bg-canvas` utility). It's barely visible, which is the point. It sits behind the content area only, not behind the top bar or rail.

**Cards (nodes).**
- `--bg-2` fill, 1px `--line-1` border, `rounded-card`, no shadow.
- Hovering an interactive card raises the border to `--line-2`.
- **Card header:** 36px tall, 12px horizontal padding. It holds a 14px Lucide icon in `--text-2`, the `card-title` in `--text-1`, and a right slot with an optional **status dot** (6px: `--accent-bright` = live/active, `--text-3` = idle, `--amber` = warning, `--red` = error) or a small action.
- There's no divider under the header. Card body padding is 12px.

**Wells.** Fields and inner blocks inside a card are `--bg-3` with `rounded-control` and no border (1px `--line-2` on hover/focus).

**Floating layers** (menus, tooltips, dialogs, drawers, toasts, the floating toolbar) get `--bg-2`, a 1px `--line-2` border, and `--shadow-float`.

**Glow** (`--glow-accent`) is allowed only on:
- the selected bounding box,
- the LIVE dot,
- the active rail item,
- a wire's traveling pulse.

**Focus ring:** `0 0 0 2px var(--bg-1), 0 0 0 3px var(--accent)`.

**Spacing.** Use a 4px base: 4, 8, 12, 16, 20, 24, 32. Canvas padding is 20px, the gap between cards is 16px, card body padding is 12px, and the gap between a field label and its field is 6px.

## 4. Wires: the node-graph language

Wires are the signature element. They must always represent real data flow.

- **Drawing:** SVG cubic bezier, 1.5px `--accent` at 70% opacity, round caps. Each end has a 6px **port dot** (`--accent-bright` fill, 2px `--bg-1` ring) sitting on the card border.
- **States:**
  - *Streaming:* a 3px traveling pulse (`--accent-bright` with glow) moves along the wire once every 1.6s.
  - *Idle:* the wire is `--line-2`, ports are `--text-3`, and there's no pulse.
  - *Error:* the wire is dashed `--red` at 60%.
- **Hub node:** a 36×36 `--bg-2` square, `rounded-control`, 1px `--line-2` border, with a 16px `Zap` icon in `--text-1` at the center (from the reference). This represents the model / inference step.
- **Where wires appear:**
  1. The **pipeline strip** on Live Monitor (§6.1).
  2. The **Model Management** node canvas (§9).
  3. The **selection leader** from the selected box to the inline detail card.

  Do not draw wires anywhere else.

## 5. Layout

### Desktop (≥ 1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚡ │ Lobby-North · Live Monitor ☁        [◐][↗] (avatars +2) [● SIMULATED] [⚙]│  56px top bar
├────┼─────────────────────────────────────────────────────────────────────────┤
│ ▢  │ [CAM_01 ●]───●──[⚡ yolov8n]──●───[Tracker · 14 obj]                     │  pipeline strip 40px
│ ■  │ ┌───────────────────────────────────────────────┐  ┌──────────────────┐│
│ ▢  │ │                                               │  │ ◎ Current Det. ● ││
│ ▢  │ │        CAMERA VIEWPORT CARD (radius 14)       │  ├──────────────────┤│
│ ▢  │ │        video + overlay + HUD                  │  │ ✦ AI Description ││
│ ▢  │ │                                               │  ├──────────────────┤│
│    │ └───────────────────────────────────────────────┘  │ ≡ Recent Detect. ││
│    │     [▶][⏸] │ [Webcam|Demo] │ [▢][Aa][〰] │ ─○── │ [⤢]                 ││
│ ↩  │ ┌───────────────────────────────────────────────┐  │   (scrolls)      ││
│    │ │ ⏱ Detection Timeline                        ● │  │                  ││
│    │ └───────────────────────────────────────────────┘  └──────────────────┘│
└────┴─────────────────────────────────────────────────────────────────────────┘
 52px rail                    dot-grid canvas, 20px padding, 16px gaps     360px
```

**Top bar (56px).** `--bg-1` with a 1px `--line-1` bottom edge.
- Left: the page title in `title` style with a 14px `Cloud` icon in `--text-3`.
- Right: a grouped icon cluster (one `--bg-2` capsule, 1px border, 32px icon buttons) · avatar stack (24px circles with a 2px `--bg-1` ring and a "+2" chip; static demo members, opens a "Workspace members" popover) · source chip (`SIMULATED` amber / `WEBCAM` / `DEMO`) · model chip with status dot · settings.

**Icon rail (52px).** `--bg-1` with a 1px `--line-1` right edge.
- The logo mark is at the top (white, 20px).
- Nav items are 32×32 `rounded-control` buttons with 16px icons in `--icon-dim`.
- **Active:** `--accent` fill, `--on-accent` icon, `--glow-accent` (the reference's green square).
- Exit sits at the bottom. Tooltips appear on the right. There is no expanded state.

**Content area.** `bg-canvas` with 20px padding. Grid is `grid-template-columns: 1fr 360px; gap: 16px`.
- Center column rows: `40px pipeline strip | 1fr viewport | 48px floating toolbar | 168px timeline card`.
- The right column is a stack of cards. Only Recent Detections scrolls.
- Live Monitor is exactly `100dvh`. Other pages scroll inside the canvas.

### Responsive

- **1024–1279px:** the right column is 320px and the pipeline strip collapses to icons + dots.
- **640–1023px:** the right column becomes a right drawer opened from a top-bar button showing the live track count.
- **< 640px:**
  - The rail becomes a bottom floating nav (`rounded-card`, centered, inset 12px from the bottom).
  - Content is single column: pipeline strip (icons only) → viewport → floating toolbar (scrolls horizontally inside its capsule) → segmented [Current · Recent · Timeline] → selected card.
  - All tap targets are at least 40px.
- Horizontal page overflow is a bug at every width.

## 6. Live Monitor components

### 6.1 Pipeline strip

The strip sits on the canvas with no card around it.
- **Node chips:** 32px tall, `--bg-2`, 1px border, `rounded-control`, holding icon + `data` text + status dot. The three chips are:
  1. `CAM_01 · 1920×1080 ●`
  2. the ⚡ hub showing the model name, e.g. `yolov8n` or `No model`
  3. `Tracker · 14 objects`
- Chips are joined by short wires (§4) whose state follows the real pipeline:
  - camera off → idle wires,
  - streaming → pulses,
  - model missing → the second wire is idle and the model chip is dashed.
- Clicking the model chip opens `/models`.

### 6.2 Camera viewport card

- `--bg-0`, 1px `--line-1` border, `rounded-panel`, `overflow: hidden`. The video is letterboxed inside it.
- A very soft inner vignette is the only effect on the video.

### 6.3 HUD

HUD text uses the `hud` style on `--hud-chip` chips, `rounded-chip`, 3px 7px padding, inset 12px from the content rect.
- **Top-left:** `● REC · CAM_01`.
- **Top-right:** time with milliseconds, updated via rAF writing to a ref (no per-frame React render).
- **Bottom-left:** `1920×1080 · 30.0 FPS · 42 MS`.
- **Bottom-right:** `MODEL · yolov8n · 14 OBJ`, `NO MODEL`, or amber `SIMULATED · DEMO SCENE`.
- **Viewfinder corners:** four 16px L marks in `--text-1` at 25%, 1.5px, round caps. They are static.

### 6.4 Bounding boxes

These are the most important visual in the product.

- **Default:**
  - 1.5px class-color rectangle at 40% opacity with `rx=3`, plus 12px corner brackets at 100% opacity, 2px, round caps.
  - Use `vector-effect: non-scaling-stroke`.
- **Label chip:**
  - Attached above the top-left corner. `rounded-chip`, class-color fill at 92%, `--on-accent` text, `hud` style, e.g. `PERSON  #004  98.4%`.
  - It flips inside the box near the top edge (within 24px).
  - It must never overlap another chip; offset it down instead.
- **Hover:** the rectangle goes to 75%, with a 120ms transition.
- **Selected:**
  - The rectangle goes to 100% and the brackets become 2.5px with 16px arms.
  - The box gets a glow (an SVG blur filter) and a 6px center crosshair.
  - All other boxes dim to 40%.
  - A **wire-style bezier leader** with a port dot at each end runs to the inline detail card.
- **New track:** brackets start at scale 1.12 / opacity 0 and animate to 1 / 1 over 220ms. This happens once.
- **Lost track** (not seen for >1s): dashed rectangle in `--text-3`, label reads `#004 LOST`, and it fades over 600ms at 5s.
- **Flagged:** amber box with amber glow, and a 10px `TriangleAlert` glyph in the label.
- **Trail** (toggle): the last 30 centroids as a 1.5px polyline, with opacity going 0 → 0.5 along its length.
- **Motion:** boxes interpolate between frames so they glide.

### 6.5 Inline detail card (a small node)

A 240px card in the §3 style (`--bg-2` at 96%, `--shadow-float`) anchored beside the box and clamped inside the content rect.
- **Header:** class icon + "Person #004" + status dot.
- **Body:**
  - `metric` confidence with a pill progress bar under it,
  - a meta-chip row (`12.3s in view`, `peak 99.1%`),
  - 2 attribute fields in the label-over-value pattern,
  - a "View details →" link in `--accent`.

### 6.6 Viewport states

Each state is centered in the card: a 36px hub-style icon square, `body-strong` title, `small` text in `--text-2`, and one or two buttons. It is never a blank black box.

| State | Title | Supporting text / actions |
|---|---|---|
| Idle | "Camera offline" | [Start webcam] (white primary), [Run demo scene] (secondary) |
| Requesting | "Waiting for camera permission…" | — |
| Denied | "Camera blocked" | Steps to re-enable it, plus [Run demo scene instead] |
| No camera / In use | — | Specific copy for each case |
| Paused | — | The video freezes and the HUD shows an amber `PAUSED` chip |
| Webcam, no model | — | The video plays. A bottom-center chip reads "No detection model connected · Connect model →". The pipeline's model chip is dashed |

### 6.7 Floating toolbar (viewport controls)

This is the reference's bottom toolbar. It's a centered capsule in its own 48px row under the viewport: `--bg-2`, 1px `--line-2` border, `rounded-card`, 4px padding, `--shadow-float`.
- **Items:** 32×32 `rounded-control` icon buttons with 16px icons in `--icon-dim`. Hover goes to `--text-1` on `--bg-3`. On/active is an `--on-white` icon on a `--steel` fill (the reference's pale active tool).
- **Groups** are separated by 1px × 16px `--line-2` dividers:
  1. Start/Stop · Pause
  2. Webcam | Demo segmented control
  3. Boxes · Labels · Trails toggles
  4. Threshold pill slider (120px)
  5. Snapshot · Fullscreen
- Every item has a tooltip with its shortcut.

### 6.8 Right column cards

- **Current Detection:**
  - Header "◎ Current Detection" + status dot.
  - Body is a 2-column field grid: Object, Tracking ID, Status (pill), First Seen, Time in View, BBox (mono).
  - Confidence row: `metric` value + pill bar with a 2px peak tick.
  - Attributes appear as a wrap of meta chips (`upper: dark jacket`, `carrying: backpack`).
  - Empty state: "Select an object in the feed or the list."
- **AI Description:**
  - Header "✦ AI Description" (Lucide `Sparkle` is allowed only here) + status dot.
  - The body is a `--bg-3` well with the text in `body` `--text-2`, like the reference's Prompt card.
  - Below the well, a meta-chip row: `simulated · 1.8s · 13:42:10`.
  - Pending: a 3-line shimmer in the well. Unavailable: "No description model connected."
- **Recent Detections:**
  - Header "≡ Recent Detections", count chip, filter icon button.
  - **Rows:** 52px, `rounded-control`, hover `--bg-3`. Each has:
    - a 36×36 thumbnail (`rounded-control`, falls back to the class icon on `--bg-3`),
    - line 1: `body-strong` "Person", with `data` "#004" in `--text-3`,
    - line 2: `small` time · status,
    - right side: confidence in mono.
  - Selected row: `--accent-dim` fill and a 2px `--accent` left bar.
  - A new row flashes `--accent-dim` for 400ms, once.
- **Status pills:** 20px, `rounded-full`, 11px 500, tinted 14% fill with full-color text. VISIBLE is green, LOST is text-3, EXITED is icon-dim, FLAGGED is amber.

### 6.9 Timeline card

- Header "⏱ Detection Timeline" + event count chip + [1m | 5m | 15m] segmented control.
- Lanes:
  - One lane per class (max 5), 20px each, with an 80px label column.
  - Track bars have `rounded-full` ends, class color at 50% (100% plus glow when selected).
  - Event ticks are 6px dots; flagged ticks are amber.
  - "Now" is a 1px `--accent` line at the right edge.
  - Axis labels are `data` in `--text-3`, and gridlines are `--line-1`.
- Hover shows a tooltip card. Clicking selects the track.

## 7. Other pages

- **Overview:** node-style cards on the canvas.
  - Four stat cards (header icon + title + dot, `metric` value, `small` delta).
  - A small live viewport card.
  - A class breakdown card: rows of name + count + pill bar.
  - A last-events card.
- **History:** one large card holding the table.
  - Header row in `label` `--text-2`, rows 44px with `--line-1` separators, sticky header.
  - Filters are `--bg-3` select chips above the table.
- **Analytics:** three chart cards. Bars are `--accent` (class colors for distribution), gridlines `--line-1`, axes `data` `--text-3`.
- **Settings:** stacked cards with the field pattern.

## 8. Controls

- **Buttons:** 32px tall (36px in forms), `rounded-control`, `body-strong`, 12px horizontal padding.
  - **Primary** is a **white pill**: `--fill-white` fill, `--on-white` text.
  - **Accent:** `--accent` fill, `--on-accent` text. Only for "Deploy model" and the main "Start webcam".
  - Secondary: `--bg-3` fill, `--text-1` text, 1px `--line-2` border.
  - Ghost: transparent, `--text-2` text, `--bg-3` on hover.
  - Danger: `--red` text on a 12% red fill.
  - Use at most one primary or accent per view.
- **Icon buttons:** 32×32, 16px Lucide icons at stroke 1.75, `--icon-dim` → `--text-1` on hover. Each needs a tooltip.
- **Select / Input** (reference "Claude 4 ▾"):
  - 36px tall, `--bg-3` fill, no border (1px `--line-2` on hover), `rounded-control`, 10px padding, `body` text, 14px `ChevronDown` in `--text-3`.
  - The `label` goes above with a 6px gap.
  - Focus: 1px `--accent` border.
  - Error: 1px `--red` border, with the message below in `small` `--red`.
- **Pill slider** (reference "Creativity Level"):
  - 28px tall `rounded-full` track in `--bg-3`.
  - The filled portion is a `--fill-white` pill from the left. The thumb is a 20px dark circle (`--bg-4`, 1px `--line-2` ring) at the end of the fill.
  - Min/max labels (`small`, `--text-3`) sit inside the track ends. The current value is shown in mono in the label row ("Confidence threshold · 0.50").
  - The compact toolbar variant is 20px tall and 120px wide.
- **Segmented control:** `--bg-3` track, `rounded-control`, 3px padding. The active segment is a `--fill-white` pill with `--on-white` text; inactive segments are `--text-2`.
- **Switch:** 32×18, `rounded-full`. Off is `--bg-4`; on is `--accent` with an `--on-accent` knob.
- **Meta chip:** 22px tall, `--bg-3`, `rounded-chip`, 12px icon + `data` text in `--text-2`.
- **Avatar stack:** 24px circles, −6px overlap, 2px `--bg-1` ring, "+N" chip in `--bg-3`.
- **Kbd:** `rounded-chip`, `--bg-3`, `data`.

## 9. Model Management as a node canvas

This page is the closest match to the reference, so build it as a pipeline graph on the dot canvas. It is not a form page.

```
[Source]─────────────┐
                     ├──●──[⚡]──●──[Output Preview]
[Model Configuration]┘      ▲
                [Thresholds]┘
```

- **Source node:** camera/demo select, resolution, fps.
- **Model Configuration node:** dropzone (dashed `--line-2`, `rounded-control`), file row, name, version, task type, runtime and input resolution as selects (reference "AI Configuration").
- **Thresholds node:** confidence and NMS IoU pill sliders, class list, watchlist (reference "Image Settings").
- **⚡ hub:** deployment status. Clicking it opens the Deployment drawer (state machine, 4-step deploy checklist, actions).
- **Output Preview node:** a stack of the last 3 detection thumbnails, offset and rotated 2–4°, as in the reference's "Final Results" stacked cards; or an empty state. Header dot shows deployment state.
- **Endpoint node:** a collapsed node at the bottom for the WebSocket URL, Test connection, and "Use as detection source".
- Wires pulse only while the simulated deployment is running. A persistent amber meta-chip in the top bar reads `Simulated deployment`.
- Layout is fixed on desktop (no dragging). Below 1024px the nodes stack vertically, joined by short vertical wires.

## 10. Motion

- Durations: 120ms (hover), 180ms (state changes), 240ms (drawers and dialogs). Easing is `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Allowed loops:
  - the REC dot pulse,
  - wire pulses (only while streaming),
  - the AI Description shimmer (only while pending).
- Banned: scanlines, radar sweeps, glitch effects, typewriter text, numbers counting up, parallax.
- `prefers-reduced-motion`: wires static, boxes snap, no flashes or pulses, only opacity fades of 120ms or less.

## 11. Banned list

Don't use any of the following:
- cyan, blue, purple, or pink accents;
- decorative gradients (the dot grid and skeleton shimmer are the only gradient uses);
- glassmorphism or backdrop-blur;
- shadows on regular cards;
- text above 20px;
- uppercase outside HUD and pills;
- emoji;
- stock photos or illustrations;
- wires that don't represent data flow;
- decorative boxes not driven by detection data;
- hexagon or circuit patterns;
- fake activity logs.
