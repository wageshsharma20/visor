import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { useCameraStore } from '@/stores/cameraStore';
import { useModelStore } from '@/stores/modelStore';

describe('AppLayout Component', () => {
  beforeEach(() => {
    useCameraStore.getState().reset();
    useModelStore.getState().reset();
  });

  it('renders top bar page title and settings gear; status pill hidden in start state', () => {
    render(
      <MemoryRouter
        initialEntries={['/live']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route
            path="/live"
            element={
              <AppLayout>
                <div data-testid="live-content">Live Viewport</div>
              </AppLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Live Monitor')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    // In start state (no source), status pill is hidden per DESIGN.md §5.1
    expect(screen.queryByText(/● LIVE/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('live-content')).toBeInTheDocument();
  });

  it('renders status pill when stream is connected', () => {
    act(() => {
      useCameraStore.getState().setStatus('connected');
    });

    render(
      <MemoryRouter
        initialEntries={['/live']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route
            path="/live"
            element={
              <AppLayout>
                <div>Content</div>
              </AppLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/ · NO MODEL/i)).toBeInTheDocument();
  });

  it('renders desktop icon rail with exactly three navigation items', () => {
    render(
      <MemoryRouter
        initialEntries={['/live']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route
            path="/live"
            element={
              <AppLayout>
                <div>Content</div>
              </AppLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByLabelText('Live Monitor')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Model Registry')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Detection History')[0]).toBeInTheDocument();

    // Removed items are not rendered
    expect(screen.queryByLabelText('Overview')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Analytics')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Exit Session')).not.toBeInTheDocument();
  });
});
