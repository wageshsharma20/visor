import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Tooltip, IconButton } from '../index';
import { Camera } from 'lucide-react';

describe('Tooltip & Keyboard Focus Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
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

  it('appears on pointer hover and on keyboard focus', () => {
    render(
      <div>
        <Tooltip content="Toggle Camera" shortcut="C" delay={50}>
          <button id="cam-btn">Camera</button>
        </Tooltip>
      </div>
    );

    const btn = screen.getByRole('button', { name: 'Camera' });

    // Focus via keyboard
    act(() => {
      fireEvent.focus(btn);
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Toggle Camera')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();

    // Blur
    act(() => {
      fireEvent.blur(btn);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Hover via pointer
    act(() => {
      fireEvent.mouseEnter(btn);
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(btn);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('IconButton triggers tooltip on focus and hover', () => {
    render(
      <IconButton
        icon={<Camera />}
        label="Start Snapshot"
        shortcut="S"
      />
    );

    const btn = screen.getByRole('button', { name: 'Start Snapshot' });
    expect(btn).toHaveAttribute('aria-label', 'Start Snapshot');

    act(() => {
      fireEvent.focus(btn);
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Start Snapshot')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
