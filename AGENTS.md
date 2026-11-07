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

## Visual rules (summary; full detail in DESIGN.md)
- Dark, dense, precise. Corners 2–6px max. 1px hairline borders do the structure. Do not use drop shadows on cards.
- One accent (cyan). Amber means attention or warning. Green means healthy. Red means error. Do not use any other accent colors.
- Maximum UI text size is 20px. Labels are 11px uppercase mono with tracking.
- Do not use gradients on surfaces, glassmorphism/backdrop-blur panels, purple, emoji, decorative illustrations, or marketing hero sections.
- Animate only `transform` and `opacity`, 120–240ms. Respect `prefers-reduced-motion`.

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
