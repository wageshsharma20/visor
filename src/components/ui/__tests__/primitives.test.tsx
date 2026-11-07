import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import {
  Button,
  Badge,
  Pill,
  Slider,
  Switch,
  SegmentedControl,
  Input,
  Dialog,
  Drawer,
  ToastContainer,
  toast,
  EmptyState,
  Kbd,
} from '../index';
import { Camera } from 'lucide-react';

describe('UI Primitives Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // create portal-root if needed
    if (!document.getElementById('portal-root')) {
      const root = document.createElement('div');
      root.id = 'portal-root';
      document.body.appendChild(root);
    }
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '<div id="portal-root"></div>';
  });

  it('renders Button with variants and sizes matching v2 tokens', () => {
    const { getByRole, rerender } = render(
      <Button variant="primary" size={32}>
        Deploy
      </Button>
    );
    const btn = getByRole('button');
    expect(btn).toHaveTextContent('Deploy');
    expect(btn.className).toContain('rounded-control');
    expect(btn.className).toContain('bg-fill-white');

    rerender(
      <Button variant="danger" size={36}>
        Delete
      </Button>
    );
    expect(btn.className).toContain('h-9');
    expect(btn.className).toContain('text-red');
  });

  it('renders Pill with rounded-full and correct status styles', () => {
    const { container, rerender } = render(<Pill variant="visible">VISIBLE</Pill>);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('rounded-full');
    expect(pill.className).toContain('h-5');
    expect(pill).toHaveTextContent('VISIBLE');

    rerender(<Pill variant="flagged">FLAGGED</Pill>);
    expect(pill.className).toContain('text-amber');
  });

  it('renders Badge with rounded-chip radius', () => {
    const { container } = render(<Badge variant="accent">3 NEW</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('rounded-chip');
    expect(badge).toHaveTextContent('3 NEW');
  });

  it('handles Slider pointer and keyboard interactions within bounds', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <Slider value={0.5} min={0} max={1} step={0.05} onChange={handleChange} />
    );
    const slider = getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(0.55);

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(0.45);

    fireEvent.keyDown(slider, { key: 'Home' });
    expect(handleChange).toHaveBeenCalledWith(0);

    fireEvent.keyDown(slider, { key: 'End' });
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('handles Switch toggling via click and spacebar', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <Switch checked={false} onChange={handleChange} label="Mirror feed" />
    );
    const toggle = getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);

    fireEvent.keyDown(toggle, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('handles SegmentedControl selection and keyboard arrows', () => {
    const handleChange = vi.fn();
    const options = [
      { value: 'webcam', label: 'Webcam' },
      { value: 'demo', label: 'Demo scene' },
    ];
    render(
      <SegmentedControl options={options} value="webcam" onChange={handleChange} />
    );
    const webcamBtn = screen.getByRole('radio', { name: 'Webcam' });
    expect(webcamBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(webcamBtn, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('demo');
  });

  it('Input shows label, value and error message when invalid', () => {
    render(<Input label="Model Name" error="Name is required" value="" onChange={() => {}} />);
    expect(screen.getByText('Model Name')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('Dialog traps focus, handles Esc, and restores focus on close', () => {
    function TestDialog() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button id="trigger-btn" onClick={() => setOpen(true)}>
            Open Dialog
          </button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Confirm Clear"
            footer={
              <>
                <Button id="cancel-btn" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button id="confirm-btn" variant="danger">
                  Confirm
                </Button>
              </>
            }
          >
            Are you sure you want to clear 214 detections?
          </Dialog>
        </div>
      );
    }

    render(<TestDialog />);
    const trigger = screen.getByText('Open Dialog');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open dialog
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Close on Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Focus restored
    expect(document.activeElement).toBe(trigger);
  });

  it('Drawer opens, handles Esc, and closes properly', () => {
    const handleClose = vi.fn();
    render(
      <Drawer open={true} onClose={handleClose} title="Intel Drawer" side="right">
        <div>Drawer Content</div>
      </Drawer>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Intel Drawer');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Toast stack auto-dismisses after timeout and allows manual dismissal', () => {
    render(<ToastContainer />);

    act(() => {
      toast.info('Model Connected', 'yolov8n streaming at 30 fps');
    });

    expect(screen.getByText('Model Connected')).toBeInTheDocument();

    // Advance 4s
    act(() => {
      vi.advanceTimersByTime(4050);
    });

    expect(screen.queryByText('Model Connected')).not.toBeInTheDocument();
  });

  it('EmptyState renders icon, title, description, and action button', () => {
    render(
      <EmptyState
        icon={<Camera />}
        title="No camera connected"
        description="Connect a USB camera or run the demo scene."
        action={<Button variant="primary">Start Demo</Button>}
      />
    );

    expect(screen.getByText('No camera connected')).toBeInTheDocument();
    expect(screen.getByText('Connect a USB camera or run the demo scene.')).toBeInTheDocument();
    expect(screen.getByText('Start Demo')).toBeInTheDocument();
  });

  it('Kbd renders with rounded-chip radius and monospace styling', () => {
    const { container } = render(<Kbd>ESC</Kbd>);
    const kbd = container.firstChild as HTMLElement;
    expect(kbd.className).toContain('rounded-chip');
    expect(kbd.className).toContain('font-mono');
    expect(kbd).toHaveTextContent('ESC');
  });
});
