import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { UiReviewPage } from './pages/UiReviewPage';
import { Button } from './components/ui';

const LiveStub: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas bg-bg-1 text-text-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md p-6 bg-bg-2 border border-line-1 rounded-card space-y-4">
        <div className="font-mono text-label uppercase tracking-widest text-accent">
          VISOR // GRAPHITE NODE
        </div>
        <h1 className="text-metric font-mono">Phase 1.5 Foundations Active</h1>
        <p className="text-small text-text-2">
          Node-based AI workbench design system loaded. Click below to inspect the UI Review harness.
        </p>
        <div className="pt-2">
          <Link to="/__ui">
            <Button variant="primary" size={36}>
              Open UI Review Harness (/__ui) →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/live" replace />} />
        <Route path="/live" element={<LiveStub />} />
        {import.meta.env.DEV && <Route path="/__ui" element={<UiReviewPage />} />}
        <Route path="*" element={<Navigate to="/live" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
