import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Pill,
  Panel,
  PanelHeader,
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
} from '@/components/ui';
import {
  Play,
  Pause,
  Camera,
  Layers,
  Crosshair,
  Maximize2,
  Trash2,
  Bell,
  Cpu,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const UiReviewPage: React.FC = () => {
  // State for interactive primitives
  const [sliderVal, setSliderVal] = useState(0.65);
  const [switchVal, setSwitchVal] = useState(true);
  const [segmentVal, setSegmentVal] = useState<'demo' | 'webcam'>('demo');
  const [selectVal, setSelectVal] = useState<string>('yolov8n');
  const [inputVal, setInputVal] = useState('Lobby-North-01');
  const [inputErrVal, setInputErrVal] = useState('Invalid device identifier');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('right');
  const [iconBtnActive, setIconBtnActive] = useState(false);

  return (
    <div className="min-h-screen bg-bg-0 text-text-1 p-6 font-sans">
      <ToastContainer />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 pb-4 border-b border-line-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-section uppercase tracking-widest text-cyan">
              VISOR // UI REVIEW HARNESS
            </span>
            <Badge variant="cyan">DEV ONLY</Badge>
          </div>
          <h1 className="text-metric font-mono text-text-1 mt-1">Design Tokens & Primitives Audit</h1>
          <p className="text-small text-text-2 mt-1">
            Verification of all 18 UI primitives in every state across real dark surfaces (--bg-0, --bg-1, --bg-2).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size={28}
            onClick={() => {
              toast.info('Info notification', 'Telemetry sync initialized at 30 fps');
              toast.success('Model loaded', 'yolov8n model weights loaded in 184ms');
            }}
          >
            Trigger Toasts
          </Button>
          <Button variant="primary" size={28} onClick={() => setDialogOpen(true)}>
            Open Dialog
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* SECTION 1: BUTTONS & ICON BUTTONS */}
        <Panel className="rounded-[4px]">
          <PanelHeader
            title="1. Buttons & Icon Buttons (DESIGN.md §8)"
            badge={<span className="font-mono text-hud text-text-3">4 VARIANTS · SIZES 28 & 32</span>}
          />
          <div className="p-4 space-y-6">
            {/* Size 28px */}
            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                Height 28px (Standard UI)
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={28}>
                  Primary 28
                </Button>
                <Button variant="secondary" size={28} icon={<Camera />}>
                  Secondary 28
                </Button>
                <Button variant="ghost" size={28}>
                  Ghost 28
                </Button>
                <Button variant="danger" size={28} icon={<Trash2 />}>
                  Danger 28
                </Button>
                <Button variant="primary" size={28} loading>
                  Loading
                </Button>
                <Button variant="secondary" size={28} disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Size 32px */}
            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                Height 32px (Forms & Prominent Actions)
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={32}>
                  Deploy Model
                </Button>
                <Button variant="secondary" size={32} icon={<Download />}>
                  Export Dataset
                </Button>
                <Button variant="ghost" size={32}>
                  Cancel
                </Button>
                <Button variant="danger" size={32}>
                  Stop Process
                </Button>
                <Button variant="primary" size={32} loading>
                  Deploying
                </Button>
                <Button variant="secondary" size={32} disabled>
                  Inactive
                </Button>
              </div>
            </div>

            {/* IconButtons */}
            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                IconButtons (28x28 & 32x32, 16px icon, stroke 1.5, tooltips with Kbd)
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <IconButton
                  icon={<Play />}
                  label="Start feed"
                  shortcut="Space"
                  size={28}
                  onClick={() => toast.info('Action', 'Start feed clicked')}
                />
                <IconButton
                  icon={<Layers />}
                  label="Toggle bounding boxes"
                  shortcut="B"
                  active={iconBtnActive}
                  size={28}
                  onClick={() => setIconBtnActive(!iconBtnActive)}
                />
                <IconButton
                  icon={<Crosshair />}
                  label="Lock selection"
                  shortcut="L"
                  size={28}
                  active={true}
                />
                <IconButton
                  icon={<Maximize2 />}
                  label="Fullscreen viewport"
                  shortcut="F"
                  size={28}
                />
                <IconButton
                  icon={<Pause />}
                  label="Disabled action"
                  size={28}
                  disabled
                />
                <IconButton
                  icon={<Camera />}
                  label="32px Snapshot button"
                  shortcut="S"
                  size={32}
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* SECTION 2: PILLS, BADGES & STATUS INDICATORS */}
        <Panel className="rounded-[4px]">
          <PanelHeader
            title="2. Status Pills & Badges (DESIGN.md §6)"
            badge={<span className="font-mono text-hud text-text-3">18PX PILLS · 2PX RADIUS</span>}
          />
          <div className="p-4 space-y-4">
            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                Status Pills (18px tall, 2px radius, 10.5px mono uppercase, 14% tint + full-color text)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant="visible">VISIBLE</Pill>
                <Pill variant="lost">LOST</Pill>
                <Pill variant="flagged" dot>
                  FLAGGED
                </Pill>
                <Pill variant="connected" dot>
                  CONNECTED
                </Pill>
                <Pill variant="rec" pulse>
                  REC
                </Pill>
                <Pill variant="error" dot>
                  FAILED
                </Pill>
                <Pill variant="neutral">SIMULATED</Pill>
              </div>
            </div>

            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                Class Swatches & Badges
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="cyan">PERSON · 14</Badge>
                <Badge variant="default">VEHICLE · 3</Badge>
                <Badge variant="amber">BAG · 1 FLAGGED</Badge>
                <Badge variant="green">ONLINE</Badge>
                <Badge variant="red">OFFLINE</Badge>
              </div>
            </div>

            <div>
              <div className="font-mono text-section uppercase text-text-3 mb-3">
                Keyboard Chips (Kbd — 2px radius)
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
        </Panel>

        {/* SECTION 3: FORM CONTROLS & INTERACTIVE INPUTS */}
        <Panel className="rounded-[4px]">
          <PanelHeader
            title="3. Controls & Form Primitives (DESIGN.md §8)"
            badge={<span className="font-mono text-hud text-text-3">SLIDER · SWITCH · SELECT · INPUT</span>}
          />
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slider */}
            <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] space-y-4">
              <div className="font-mono text-section uppercase text-text-3">
                Confidence Threshold Slider (2px track, 10px square thumb)
              </div>
              <Slider
                label="Threshold"
                min={0.3}
                max={0.95}
                step={0.05}
                value={sliderVal}
                onChange={setSliderVal}
              />
              <Slider
                label="Disabled Slider"
                min={0}
                max={1}
                value={0.5}
                disabled
                onChange={() => {}}
              />
            </div>

            {/* Switch & Segmented */}
            <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] space-y-4">
              <div className="font-mono text-section uppercase text-text-3">
                Toggles & Segmented Controls
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
                <div className="font-mono text-hud uppercase text-text-3 mb-1.5">Source Mode</div>
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

            {/* Inputs */}
            <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] space-y-3">
              <div className="font-mono text-section uppercase text-text-3">
                Text Inputs (Height 32px & 28px)
              </div>
              <Input
                label="Device Label"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter camera name"
              />
              <Input
                label="Endpoint URL"
                value={inputErrVal}
                error="Invalid WebSocket scheme. Expected wss://"
                onChange={(e) => setInputErrVal(e.target.value)}
              />
              <Input
                label="Disabled Input"
                value="READ_ONLY_PORT_8080"
                disabled
                onChange={() => {}}
              />
            </div>

            {/* Select & Menu */}
            <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] space-y-3">
              <div className="font-mono text-section uppercase text-text-3">
                Custom Select & Floating Menu
              </div>
              <Select
                label="Model Selection"
                value={selectVal}
                onChange={setSelectVal}
                options={[
                  { value: 'yolov8n', label: 'YOLOv8 Nano (640x640)' },
                  { value: 'yolov8m', label: 'YOLOv8 Medium (960x960)' },
                  { value: 'coco-ssd', label: 'COCO-SSD MobileNet' },
                ]}
              />

              <div className="pt-2 flex items-center justify-between">
                <Menu
                  trigger={
                    <Button variant="secondary" size={28} icon={<Cpu />}>
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
                  <Button variant="ghost" size={28}>
                    Hover or Focus Me
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </Panel>

        {/* SECTION 4: OVERLAYS, DRAWERS & DIALOGS */}
        <Panel className="rounded-[4px]">
          <PanelHeader
            title="4. Floating Layers & Overlays (DESIGN.md §3, §4)"
            badge={<span className="font-mono text-hud text-text-3">PORTAL ROOT #PORTAL-ROOT</span>}
          />
          <div className="p-4 flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              size={28}
              onClick={() => {
                setDrawerSide('left');
                setDrawerOpen(true);
              }}
            >
              Open Left Drawer (Sidebar)
            </Button>
            <Button
              variant="secondary"
              size={28}
              onClick={() => {
                setDrawerSide('right');
                setDrawerOpen(true);
              }}
            >
              Open Right Drawer (Intel)
            </Button>
            <Button
              variant="danger"
              size={28}
              onClick={() => setDialogOpen(true)}
            >
              Open Confirm Dialog
            </Button>
            <Button
              variant="ghost"
              size={28}
              icon={<Bell />}
              onClick={() => {
                toast.error('Connection timeout', 'WebSocket at wss://echo.websocket.org failed');
              }}
            >
              Trigger Error Toast
            </Button>
          </div>
        </Panel>

        {/* SECTION 5: FEEDBACK, EMPTY STATES & SKELETONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel className="rounded-[4px]">
            <PanelHeader title="5A. Empty State Pattern (DESIGN.md §5)" />
            <EmptyState
              icon={<Camera />}
              title="Camera feed off"
              description="Start the local webcam or run the deterministic demo scene to stream detections."
              action={
                <div className="flex items-center gap-2">
                  <Button variant="primary" size={28}>
                    Start Webcam
                  </Button>
                  <Button variant="secondary" size={28}>
                    Run Demo
                  </Button>
                </div>
              }
            />
          </Panel>

          <Panel className="rounded-[4px]">
            <PanelHeader title="5B. Shimmer Skeletons (DESIGN.md §9)" />
            <div className="p-4 space-y-3">
              <div className="font-mono text-section uppercase text-text-3">
                AI Description Shimmer (3 lines)
              </div>
              <Skeleton width="w-full" height="h-3.5" />
              <Skeleton width="w-4/5" height="h-3.5" />
              <Skeleton width="w-2/3" height="h-3.5" />

              <div className="font-mono text-section uppercase text-text-3 pt-2">
                Card & Thumbnail Placeholder
              </div>
              <div className="flex items-center gap-3">
                <Skeleton width="w-8" height="h-8" radius="2" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="w-1/3" height="h-3" />
                  <Skeleton width="w-1/2" height="h-2.5" />
                </div>
              </div>
            </div>
          </Panel>
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
            <Button variant="ghost" size={28} onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size={28}
              onClick={() => {
                setDialogOpen(false);
                toast.success('History cleared', 'All logged records deleted');
              }}
            >
              Confirm Clear
            </Button>
          </>
        }
      >
        <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] text-small font-mono text-text-2 flex items-center gap-2">
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
          <Button variant="secondary" size={28} onClick={() => setDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-body text-text-2">
            Drawer sliding in from the {drawerSide}. The edge touching the viewport side has no radius; the free edge has a 6px radius.
          </p>
          <div className="p-3 bg-bg-2 border border-line-1 rounded-[4px] space-y-2">
            <div className="font-mono text-section uppercase text-text-3">Inside Drawer Test</div>
            <p className="text-small text-text-2">
              Focus trap is active inside this drawer. Pressing <Kbd>ESC</Kbd> will close it and restore focus.
            </p>
            <Input label="Search within drawer" placeholder="Filter..." />
            <Button variant="primary" size={28} className="w-full mt-2">
              Action Inside Drawer
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
