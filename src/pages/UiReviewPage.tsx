import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Pill,
  Card,
  CardHeader,
  Slider,
  Switch,
  SegmentedControl,
  Select,
  Input,
  Tooltip,
  Menu,
  Drawer,
  Dialog,
  ToastContainer,
  toast,
  EmptyState,
  Kbd,
  Skeleton,
  StatusDot,
  MetaChip,
  AvatarStack,
} from '@/components/ui';
import {
  Wire,
  HubNode,
  NodeCard,
} from '@/components/graph';
import {
  Play,
  Layers,
  Crosshair,
  Maximize2,
  Trash2,
  Bell,
  Cpu,
  Download,
  AlertTriangle,
  Camera,
  Activity,
  Sliders,
  Sparkles,
  Video,
} from 'lucide-react';

export const UiReviewPage: React.FC = () => {
  // State for interactive primitives
  const [sliderVal, setSliderVal] = useState(0.65);
  const [compactSliderVal, setCompactSliderVal] = useState(0.5);
  const [switchVal, setSwitchVal] = useState(true);
  const [segmentVal, setSegmentVal] = useState<'demo' | 'webcam'>('demo');
  const [selectVal, setSelectVal] = useState<string>('yolov8n');
  const [inputVal, setInputVal] = useState('Lobby-North-01');
  const [inputErrVal, setInputErrVal] = useState('Invalid device identifier');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('right');
  const [iconBtnActive, setIconBtnActive] = useState(false);

  // Sample avatars matching the reference design
  const sampleAvatars = [
    { id: '1', name: 'Alex M', fallback: 'AM' },
    { id: '2', name: 'Sarah K', fallback: 'SK' },
    { id: '3', name: 'Devin R', fallback: 'DR' },
    { id: '4', name: 'Elena T', fallback: 'ET' },
    { id: '5', name: 'Marcus W', fallback: 'MW' },
  ];

  return (
    <div className="min-h-screen bg-canvas bg-bg-1 text-text-1 p-6 font-sans">
      <ToastContainer />

      {/* Top Header Bar */}
      <div className="max-w-6xl mx-auto mb-8 pb-4 border-b border-line-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-label uppercase tracking-widest text-accent">
              VISOR // GRAPHITE NODE
            </span>
            <Badge variant="accent">DESIGN V2</Badge>
            <StatusDot state="live" pulse />
          </div>
          <h1 className="text-metric font-mono text-text-1 mt-1">Design Tokens & Primitives Audit</h1>
          <p className="text-small text-text-2 mt-1">
            Near-black dot canvas, floating graphite cards, signal-green accents, and node wires (DESIGN.md v2).
          </p>
        </div>

        {/* Right header capsule cluster */}
        <div className="flex flex-wrap items-center gap-3">
          <AvatarStack avatars={sampleAvatars} max={3} />
          <Button
            variant="secondary"
            size={32}
            onClick={() => {
              toast.info('Telemetry Synchronized', 'Pipeline streaming at 30.0 FPS · 42ms');
              toast.success('Inference Active', 'yolov8n model weights warm');
            }}
          >
            Trigger Toasts
          </Button>
          <Button variant="primary" size={32} onClick={() => setDialogOpen(true)}>
            Open Dialog
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* SECTION 1: BUTTONS & ICON BUTTONS */}
        <Card>
          <CardHeader
            title="1. Buttons & Icon Buttons (DESIGN.md §8)"
            icon={<Sliders />}
            badge={<span className="font-mono text-data text-text-3">WHITE PILLS · ACCENT GREEN · STEEL</span>}
          />
          <div className="p-4 space-y-6">
            {/* Height 32px */}
            <div>
              <div className="text-label text-text-2 mb-3">
                Standard Height 32px
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={32}>
                  Primary Pill
                </Button>
                <Button variant="accent" size={32}>
                  Accent Green
                </Button>
                <Button variant="secondary" size={32} icon={<Camera />}>
                  Secondary
                </Button>
                <Button variant="ghost" size={32}>
                  Ghost
                </Button>
                <Button variant="danger" size={32} icon={<Trash2 />}>
                  Danger
                </Button>
                <Button variant="primary" size={32} loading>
                  Loading
                </Button>
                <Button variant="secondary" size={32} disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Height 36px Form Size */}
            <div>
              <div className="text-label text-text-2 mb-3">
                Form Height 36px
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={36}>
                  Deploy Model
                </Button>
                <Button variant="accent" size={36} icon={<Download />}>
                  Export Dataset
                </Button>
                <Button variant="secondary" size={36}>
                  Cancel
                </Button>
                <Button variant="danger" size={36}>
                  Stop Process
                </Button>
                <Button variant="primary" size={36} loading>
                  Deploying
                </Button>
              </div>
            </div>

            {/* IconButtons */}
            <div>
              <div className="text-label text-text-2 mb-3">
                IconButtons (32x32, 16px icon, stroke 1.75, tooltips with Kbd)
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <IconButton
                  icon={<Play />}
                  label="Start feed"
                  shortcut="Space"
                  size={32}
                  onClick={() => toast.info('Action', 'Start feed clicked')}
                />
                <IconButton
                  icon={<Layers />}
                  label="Toggle bounding boxes"
                  shortcut="B"
                  active={iconBtnActive}
                  activeVariant="steel"
                  size={32}
                  onClick={() => setIconBtnActive(!iconBtnActive)}
                />
                <IconButton
                  icon={<Crosshair />}
                  label="Active Rail Tool"
                  shortcut="L"
                  size={32}
                  active={true}
                  activeVariant="accent"
                />
                <IconButton
                  icon={<Maximize2 />}
                  label="Fullscreen viewport"
                  shortcut="F"
                  size={32}
                />
                <IconButton
                  icon={<Camera />}
                  label="Disabled Action"
                  size={32}
                  disabled
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 2: PILLS, BADGES & STATUS INDICATORS */}
        <Card>
          <CardHeader
            title="2. Status Pills, Meta Chips & Badges (DESIGN.md §2, §6.8, §8)"
            icon={<Activity />}
            badge={<span className="font-mono text-data text-text-3">20PX PILLS · 22PX META CHIPS</span>}
          />
          <div className="p-4 space-y-5">
            <div>
              <div className="text-label text-text-2 mb-3">
                Status Pills (20px tall, rounded-full, 11px font weight 500, tinted 14% fill)
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Pill variant="visible">VISIBLE</Pill>
                <Pill variant="lost">LOST</Pill>
                <Pill variant="exited">EXITED</Pill>
                <Pill variant="flagged" dot>
                  FLAGGED
                </Pill>
                <Pill variant="rec" pulse>
                  REC
                </Pill>
                <Pill variant="neutral">SIMULATED</Pill>
              </div>
            </div>

            <div>
              <div className="text-label text-text-2 mb-3">
                Meta Chips (Reference &quot;Opus 4.6 · 20 Tokens · 10.0 Sec&quot; pattern)
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <MetaChip icon={<Cpu />}>yolov8n · 640×640</MetaChip>
                <MetaChip icon={<Activity />}>30.0 FPS · 42ms</MetaChip>
                <MetaChip icon={<Sparkles />}>14 Objects Tracked</MetaChip>
                <MetaChip icon={<Video />}>CAM_01</MetaChip>
              </div>
            </div>

            <div>
              <div className="text-label text-text-2 mb-3">
                Status Dots &amp; Badges (rounded-chip 6px)
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-data text-text-2">
                  <StatusDot state="live" pulse />
                  <span>Live / Healthy</span>
                </div>
                <div className="flex items-center gap-1.5 text-data text-text-2">
                  <StatusDot state="idle" />
                  <span>Idle</span>
                </div>
                <div className="flex items-center gap-1.5 text-data text-text-2">
                  <StatusDot state="warning" />
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-1.5 text-data text-text-2">
                  <StatusDot state="error" />
                  <span>Error</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="accent">ONLINE</Badge>
                  <Badge variant="default">SIMULATED</Badge>
                  <Badge variant="amber">ATTENTION</Badge>
                  <Badge variant="red">DISCONNECTED</Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="text-label text-text-2 mb-3">
                Keyboard Chips (Kbd — rounded-chip)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Kbd>Space</Kbd>
                <Kbd>ESC</Kbd>
                <Kbd>B</Kbd>
                <Kbd>L</Kbd>
                <Kbd>T</Kbd>
                <Kbd>F</Kbd>
                <Kbd>G L</Kbd>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3: FORM CONTROLS & PILL SLIDERS */}
        <Card>
          <CardHeader
            title="3. Controls & Form Primitives (DESIGN.md §8)"
            icon={<Sliders />}
            badge={<span className="font-mono text-data text-text-3">WHITE PILL SLIDER · BG-3 FIELDS</span>}
          />
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* White Pill Sliders */}
            <div className="p-4 bg-bg-3 rounded-control space-y-4">
              <div className="text-label text-text-2">
                Pill Sliders (28px track in bg-3, fill-white pill, 20px dark thumb)
              </div>
              <Slider
                label="Confidence Threshold"
                min={0.3}
                max={0.95}
                step={0.05}
                minLabel="Low"
                maxLabel="High"
                value={sliderVal}
                onChange={setSliderVal}
              />

              <div className="pt-2">
                <div className="text-label text-text-2 mb-1.5">Compact Toolbar Variant (20px tall)</div>
                <Slider
                  variant="compact"
                  min={0}
                  max={1}
                  step={0.05}
                  value={compactSliderVal}
                  onChange={setCompactSliderVal}
                />
              </div>
            </div>

            {/* Switch & Segmented Control */}
            <div className="p-4 bg-bg-3 rounded-control space-y-5">
              <div className="text-label text-text-2">
                Toggles &amp; Segmented Controls
              </div>
              <div className="flex items-center justify-between">
                <Switch
                  checked={switchVal}
                  onChange={setSwitchVal}
                  label="Mirror video feed"
                />
                <Switch
                  checked={false}
                  onChange={() => {}}
                  disabled
                  label="Disabled switch"
                />
              </div>

              <div>
                <div className="text-label text-text-2 mb-1.5">Source Mode Selection</div>
                <SegmentedControl
                  value={segmentVal}
                  onChange={setSegmentVal}
                  options={[
                    { value: 'demo', label: 'Demo Scene' },
                    { value: 'webcam', label: 'Webcam Feed' },
                  ]}
                />
              </div>
            </div>

            {/* Inputs in Field Pattern */}
            <div className="p-4 bg-bg-2 border border-line-1 rounded-card space-y-4">
              <div className="text-label text-text-2">
                Inputs (Field Pattern: label above in text-label with 6px gap)
              </div>
              <Input
                label="Device Identifier"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter camera label"
              />
              <Input
                label="WebSocket Endpoint"
                value={inputErrVal}
                error="Invalid scheme. Expected wss://"
                onChange={(e) => setInputErrVal(e.target.value)}
              />
            </div>

            {/* Select & Menu */}
            <div className="p-4 bg-bg-2 border border-line-1 rounded-card space-y-4">
              <div className="text-label text-text-2">
                Custom Select &amp; Floating Action Menu
              </div>
              <Select
                label="Inference Model (Claude 4 pattern)"
                value={selectVal}
                onChange={setSelectVal}
                options={[
                  { value: 'yolov8n', label: 'YOLOv8 Nano (640×640)' },
                  { value: 'yolov8m', label: 'YOLOv8 Medium (960×960)' },
                  { value: 'coco-ssd', label: 'COCO-SSD MobileNet' },
                ]}
              />

              <div className="pt-2 flex items-center justify-between">
                <Menu
                  trigger={
                    <Button variant="secondary" size={32} icon={<Cpu />}>
                      Action Menu ▾
                    </Button>
                  }
                  items={[
                    { id: '1', label: 'Inspect Telemetry', icon: <Cpu />, shortcut: '⌘I' },
                    { id: '2', label: 'Download Tracks JSON', icon: <Download /> },
                    { id: 'div1', label: '', divider: true },
                    {
                      id: '3',
                      label: 'Purge Buffer',
                      icon: <Trash2 />,
                      danger: true,
                      onClick: () => toast.warning('Buffer Purged', 'All 2000 events removed'),
                    },
                  ]}
                />

                <Tooltip content="Quick action tooltip" shortcut="⌥A">
                  <Button variant="ghost" size={32}>
                    Hover or Focus Me
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 4: NODE GRAPH LANGUAGE (DESIGN.md §4) */}
        <Card>
          <CardHeader
            title="4. Node Graph Language (DESIGN.md §4 &amp; §9)"
            icon={<Sparkles />}
            statusDot={<StatusDot state="live" pulse />}
            badge={<span className="font-mono text-data text-text-3">WIRES · PORTS · HUB NODE</span>}
          />
          <div className="p-6 relative overflow-hidden bg-bg-1 border-t border-line-1">
            <div className="text-label text-text-2 mb-4">
              Real-time SVG Bezier Wires with Traveling Pulse Dots (Reference Pipeline Architecture)
            </div>

            {/* Visual Node Graph Demonstration */}
            <div className="relative h-44 flex items-center justify-between px-6 bg-canvas border border-line-1 rounded-card overflow-hidden">
              {/* Left Node Card */}
              <NodeCard
                title="Camera Source"
                icon={<Camera />}
                statusDot={<StatusDot state="live" />}
                rightPort="streaming"
                className="w-48 z-10"
              >
                <div className="text-data font-mono text-text-1">1920×1080 · 30 FPS</div>
                <div className="text-small text-text-3">CAM_01 Active</div>
              </NodeCard>

              {/* Center Hub Node */}
              <div className="z-10 flex flex-col items-center">
                <HubNode label="yolov8n" active />
              </div>

              {/* Right Output Node Card */}
              <NodeCard
                title="Tracker Output"
                icon={<Activity />}
                statusDot={<StatusDot state="live" />}
                leftPort="streaming"
                className="w-48 z-10"
              >
                <div className="text-data font-mono text-accent-bright">14 Objects Tracked</div>
                <div className="text-small text-text-3">Trails &amp; BBoxes</div>
              </NodeCard>

              {/* SVG Wires connecting nodes */}
              <Wire
                start={{ x: 216, y: 88 }}
                end={{ x: 440, y: 88 }}
                state="streaming"
              />
              <Wire
                start={{ x: 476, y: 88 }}
                end={{ x: 700, y: 88 }}
                state="streaming"
              />
            </div>
          </div>
        </Card>

        {/* SECTION 5: OVERLAYS, DRAWERS & DIALOGS */}
        <Card>
          <CardHeader
            title="5. Floating Layers &amp; Overlays (DESIGN.md §3)"
            icon={<Layers />}
            badge={<span className="font-mono text-data text-text-3">PORTAL ROOT #PORTAL-ROOT</span>}
          />
          <div className="p-4 flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              size={32}
              onClick={() => {
                setDrawerSide('left');
                setDrawerOpen(true);
              }}
            >
              Open Left Drawer (Rail Nav)
            </Button>
            <Button
              variant="secondary"
              size={32}
              onClick={() => {
                setDrawerSide('right');
                setDrawerOpen(true);
              }}
            >
              Open Right Drawer (Intel)
            </Button>
            <Button
              variant="danger"
              size={32}
              onClick={() => setDialogOpen(true)}
            >
              Open Confirm Dialog
            </Button>
            <Button
              variant="ghost"
              size={32}
              icon={<Bell />}
              onClick={() => {
                toast.error('Connection Timeout', 'WebSocket endpoint disconnected');
              }}
            >
              Trigger Error Toast
            </Button>
          </div>
        </Card>

        {/* SECTION 6: FEEDBACK, EMPTY STATES & SKELETONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="6A. Empty State Pattern (DESIGN.md §6.6)" icon={<Camera />} />
            <EmptyState
              icon={<Camera />}
              title="Camera feed off"
              description="Start the local webcam or run the deterministic demo scene to stream detections."
              action={
                <div className="flex items-center gap-2">
                  <Button variant="primary" size={32}>
                    Start Webcam
                  </Button>
                  <Button variant="secondary" size={32}>
                    Run Demo
                  </Button>
                </div>
              }
            />
          </Card>

          <Card>
            <CardHeader title="6B. Shimmer Skeletons (DESIGN.md §10)" icon={<Sparkles />} />
            <div className="p-4 space-y-3">
              <div className="text-label text-text-2">
                AI Description Shimmer (bg-3 to bg-4)
              </div>
              <Skeleton width="w-full" height="h-3.5" radius="control" />
              <Skeleton width="w-4/5" height="h-3.5" radius="control" />
              <Skeleton width="w-2/3" height="h-3.5" radius="control" />

              <div className="text-label text-text-2 pt-2">
                Card &amp; Thumbnail Placeholder
              </div>
              <div className="flex items-center gap-3">
                <Skeleton width="w-9" height="h-9" radius="control" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="w-1/3" height="h-3" radius="chip" />
                  <Skeleton width="w-1/2" height="h-2.5" radius="chip" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Interactive Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Clear Detection History"
        description="Are you sure you want to delete 214 detections? This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" size={32} onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size={32}
              onClick={() => {
                setDialogOpen(false);
                toast.success('History Cleared', 'All logged records deleted');
              }}
            >
              Confirm Clear
            </Button>
          </>
        }
      >
        <div className="p-3 bg-bg-3 rounded-control text-small text-text-2 flex items-center gap-2 border border-line-2">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0" />
          <span>Active streaming detection pipeline will remain running.</span>
        </div>
      </Dialog>

      {/* Interactive Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerSide === 'left' ? 'Navigation Drawer' : 'Intel Panel Drawer'}
        side={drawerSide}
        footer={
          <Button variant="secondary" size={32} onClick={() => setDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-body text-text-2">
            Drawer sliding in from the {drawerSide}. The edge touching the viewport side has no radius; the free edge has a 14px panel radius.
          </p>
          <div className="p-3 bg-bg-3 rounded-control space-y-3 border border-line-2">
            <div className="text-label text-text-2">Inside Drawer Test</div>
            <p className="text-small text-text-2">
              Focus trap is active inside this drawer. Pressing <Kbd>ESC</Kbd> will close it and restore focus.
            </p>
            <Input label="Search within drawer" placeholder="Filter..." />
            <Button variant="primary" size={32} className="w-full mt-2">
              Action Inside Drawer
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
