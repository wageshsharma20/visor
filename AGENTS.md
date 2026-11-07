# AGENTS.md — Standing rules for every task in this repo

These rules apply to every phase. Read them, plus `docs/SPEC.md` and `docs/DESIGN.md`, before planning any change.

## Product in one line
VISOR is a frontend-only command center for a real-time visual detection model: a camera feed is the hero, detections are drawn on it, and every detection is logged to an intelligence panel and timeline.

## Stack (do not change without asking)
- Vite + React 18 + TypeScript (`strict: true`)
- Tailwind CSS, configured from the tokens in `docs/DESIGN.md`. No hard-coded hex values in components; use tokens only.
- `zustand` for state, `lucide-react` for icons, `react-router-dom` for routing
- Fonts self-hosted through `@fontsource-variable/inter` and `@fontsource/jetbrains-mono` (no Google Fonts CDN)
- `vitest` for unit tests of all non-UI logic
- No UI kits (no shadcn, MUI, Chakra, Ant). Build the primitives in `src/components/ui/`.
- No charting library unless a phase says so. Small charts are hand-written SVG.

## Architecture rules
- Data flows one way: `DetectionSource` → `tracker` → stores → components. Components never generate detections, never set timers that create data, and never import from `src/sources/` directly.
- All coordinates from a source are normalized (0–1) relative to the source frame. Only `src/lib/geometry.ts` converts them to screen space.
- High-frequency data (frames at 10–30 Hz) must not re-render panels. Overlay subscribes with narrow selectors. Panels read throttled (≤4 Hz) derived state.
- Every list in memory is capped (ring buffers). Nothing grows forever.
- Anything simulated is labeled as simulated in the UI. Never display "AI ACTIVE", "inference running" or similar unless a real model is producing the frames.

## Simplicity rules (the user's top priority)
- Three pages only: Live, Model, History. Settings is a drawer. Never add Overview/Analytics pages, workspace switchers, avatars or decorative status dots.
- Each piece of status (camera, source, model) is shown in exactly ONE place per screen. Don't repeat it in strips, chips or HUD corners.
- Live Monitor has only these parts: the viewport (with 2 HUD chips), a 5-item toolbar and a 2-card side panel. Nothing else.
- Prefer fewer words, fewer chips and fewer borders. If removing something loses no information, remove it.

## Visual rules (summary; full detail in DESIGN.md)
- "Graphite Node" (DESIGN.md v2): near-black dot-grid canvas, floating `--bg-2` cards with 1px `--line-1` borders, small titled card headers with a status dot, green wires that show real data flow. Use the named radius tokens only (chip 6 / control 8 / card 12 / panel 14 / full). No shadows on regular cards.
- One accent: signal green (`accent`, `accent-bright`, `accent-dim`). Amber means attention or warning. Red means error. `steel` is only for the active toolbar tool and the vehicle class. Primary buttons, active segments and slider fills are the white pill (`fill-white`). No cyan, blue or purple.
- Type tokens only (DESIGN.md §2); max 20px, max weight 600. Inter for UI, JetBrains Mono for numbers/IDs/HUD. Uppercase only in HUD and status pills. Field labels sit above `--bg-3` fields.
- Do not use gradients on surfaces, glassmorphism/backdrop-blur panels, purple, emoji, decorative illustrations, or marketing hero sections.
- Animate only `transform` and `opacity`, 120–240ms. Respect `prefers-reduced-motion`.
- `npm run audit:tokens` must pass before you report done.

## Definition of done for every task
1. `npm run typecheck`, `npm run lint`, `npm run test` all pass with zero errors.
2. Start the dev server and open the app in the browser. Zero console errors or warnings.
3. Take screenshots at 1440×900, 1024×768 and 390×844. Look at them critically against DESIGN.md and fix misalignment, overflow, clipped text and inconsistent spacing before reporting done.
4. Every button you added does something real. If a feature isn't built yet, the control is not rendered. Do not render disabled placeholders that never get used.
5. Report what you changed, which acceptance checks passed, and anything you deliberately left out.

## Never
- Do not rewrite files outside the scope of the current phase.
- Do not "simplify" by deleting features from earlier phases.
- Do not invent new dependencies when the stack above covers it.
- Do not leave TODO comments, lorem ipsum, or "Coming soon" screens.
