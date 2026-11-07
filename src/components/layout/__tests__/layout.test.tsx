import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { useCameraStore } from '@/stores/cameraStore';
import { useModelStore } from '@/stores/modelStore';

describe('AppLayout Component', () => {
  beforeEach(() => {
    useCameraStore.getState().reset();
    useModelStore.getState().reset();
  });

  it('renders top bar brand mark and idle state chips', () => {
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

    expect(screen.getByText('VISOR')).toBeInTheDocument();
    expect(screen.getByText(/CAM_01 · offline/i)).toBeInTheDocument();
    expect(screen.getByText(/NO MODEL/i)).toBeInTheDocument();
    expect(screen.getByText(/NO SOURCE/i)).toBeInTheDocument();
    expect(screen.getByTestId('live-content')).toBeInTheDocument();
  });

  it('renders desktop icon rail with all navigation items', () => {
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
    expect(screen.getAllByLabelText('Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Model Management')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Detection History')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Analytics')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Settings')[0]).toBeInTheDocument();
  });
});
