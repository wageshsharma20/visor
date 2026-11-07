# DESIGN.md — VISOR design system (v2, "Graphite Node")

**Simplicity first.** Every screen shows one thing well. Each piece of status appears in exactly one place. If a control or chip repeats information that's already visible, remove it. When unsure, leave it out.

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
  - the **Model page** node canvas (§9) only.

  Do not draw wires anywhere else, including Live Monitor.

## 5. Layout

### Desktop (≥ 1280px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚡ │ Live monitor                              [● Webcam · no model] [⚙] │  56px top bar
├────┼─────────────────────────────────────────────────────────────────────┤
│ ■  │ ┌───────────────────────────────────────────────┐ ┌───────────────┐ │
│ ▢  │ │ ● LIVE · CAM_01                     13:42:08  │ │ Selected      │ │
│ ▢  │ │                                               │ │ object        │ │
│    │ │                                               │ │ (+ AI note)   │ │
│    │ │        CAMERA VIEWPORT (as big as possible)   │ ├───────────────┤ │
│    │ │                                               │ │ Detections    │ │
│    │ │                                               │ │ list          │ │
│    │ └───────────────────────────────────────────────┘ │ (scrolls)     │ │
│    │       [▶ Start ▾] [⏸] [▢ Boxes] ──○── 50% [⤢]     │               │ │
│    │                                                   └───────────────┘ │
└────┴─────────────────────────────────────────────────────────────────────┘
 52px rail (3 items)     dot-grid canvas, 20px padding, 16px gaps     340px
```

- **Top bar:** page title on the left; the single status pill and the settings gear on the right (SPEC §3).
- **Icon rail:** logo plus 3 items (Live, Model, History). The active item is a green square.
- **Content:**
  - Grid is `1fr 340px`, gap 16px.
  - Center column: `1fr` viewport, then a 48px toolbar row.
  - The right column has two cards; only the Detections card scrolls.
- **No** pipeline strip, timeline, inline detail card or extra chips on Live.

### Responsive

- **1024–1279px:** the side panel is 300px.
- **640–1023px:** the side panel becomes a right drawer, opened by a "Detections (n)" button in the top bar.
- **< 640px:**
  - The rail becomes a bottom nav with 3 items.
  - The page stacks: viewport → toolbar → Selected object card → Detections card.
- No horizontal overflow at any width.

## 6. Live Monitor components

### 6.1 Camera viewport card

- `--bg-0`, 1px `--line-1` border, `rounded-panel`, `overflow: hidden`. The video is letterboxed inside it.
- There's no vignette and there are no viewfinder corners.

### 6.2 HUD: two chips only

- **Top-left:** `● LIVE · CAM_01` (red dot) while streaming, or `PAUSED` in amber.
- **Top-right:** the time (HH:MM:SS), updated via rAF writing to a ref.
- Nothing in the bottom corners. Resolution, fps and model details live in the top-bar pill's popover.
- Chips use the `hud` style on `--hud-chip`, `rounded-chip`, inset 12px.

### 6.3 Bounding boxes

- **Default:** 1.5px class-color rectangle at 70% opacity, `rx=3`, `vector-effect: non-scaling-stroke`. No corner brackets.
- **Label chip:** attached above the top-left corner, `hud` style, class-color fill. Shows only `PERSON 98%`; the ID appears only when the box is hovered or selected. It flips inside near the top edge, and labels never overlap.
- **Hover:** the rectangle goes to 100%.
- **Selected:** 2px at 100%, a soft glow, and other boxes dim to 40%. No crosshair and no leader line.
- **Lost track:** dashed `--text-3` rectangle that fades out after 5s.
- **Flagged:** amber.
- **Motion:** boxes interpolate between frames so they glide. Trails aren't drawn.

### 6.4 Viewport states

Each state is centered in the card: a 36px icon square, a `body-strong` title, one `small` line, and one or two buttons.

| State | Title | Supporting text / actions |
|---|---|---|
| Idle | "Camera off" | [Start webcam] (white primary), [Run demo scene] (secondary) |
| Requesting | "Waiting for camera permission…" | — |
| Denied | "Camera blocked" | One line on re-enabling it, plus [Try again] [Run demo scene] |
| No camera / In use | — | Specific copy for each case |
| Webcam, no model | — | The video plays. A small bottom-center chip reads "No model connected · Connect →" |

### 6.5 Toolbar (5 items)

A centered capsule under the viewport: `--bg-2`, 1px `--line-2` border, `rounded-card`, 4px padding.

The items are:
1. Start ▾ (a menu offering Webcam / Demo scene) / Stop
2. Pause
3. Boxes toggle
4. Threshold compact slider with a fixed-width readout
5. Fullscreen

Each item gets a tooltip with its shortcut. Separate the groups with dividers (play controls | boxes | threshold | fullscreen).

### 6.6 Side panel cards

- **Selected object card** (SPEC §8): header "Selected object". Content is grouped tightly as class + ID + pill, metric confidence + bar, meta chips, attribute chips, then the AI paragraph. Don't use field grids or BBox coordinates.
- **Detections card:**
  - Header "Detections" with a count chip.
  - Rows are 48px: a 32×32 thumbnail, "Person" in `body-strong` with `#004` in `data` `--text-3`, time in `small` below, and confidence in mono on the right.
  - Selected row: `--accent-dim` fill plus a 2px accent left bar. Lost or exited rows show at 50% opacity.
  - Footer link: "View all in History →".
- **Status pills:** used only in the Selected object card (VISIBLE green, LOST grey, EXITED dim, FLAGGED amber).

## 7. Other pages

- **History:**
  - Three small stat cards (header + `metric` value, nothing else).
  - A timeline card: one lane per class, rounded bars, a "now" line, and clicking a bar selects it.
  - A table card: one search box + one class select above it, rows 44px, sticky header.
  - An export menu and clear button in the page header.
- **Settings drawer:** a 360px right drawer holding one card of fields in the label-above-field pattern, with "Reset to defaults" at the bottom.

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

## 9. Model page as a small node canvas

This is the only place wires appear. It has three nodes on one row, with an Endpoint card below:

```
[Source] ──●── [⚡ Model] ──●── [Output]

[Endpoint · WebSocket URL · Test connection · Use as source]
```

- The nodes are cards from §3. The Model node is the largest; it holds the dropzone, name, runtime, threshold, the state pill and one primary button.
- Wires pulse only while a model is "running (simulated)" or a WebSocket source is streaming.
- Output shows the last 3 thumbnails as a slightly rotated stack (like the reference's "Final Results"), or an empty state.
- One amber notice sits at the top of the page.
- Below 1024px the nodes stack vertically with short vertical wires.

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
