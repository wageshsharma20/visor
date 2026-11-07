import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { UiReviewPage } from './pages/UiReviewPage';
import { Button } from './components/ui';

const LiveStub: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-0 text-text-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md p-6 bg-bg-1 border border-line-1 rounded-[4px] space-y-4">
        <div className="font-mono text-section uppercase tracking-widest text-cyan">
          VISOR // FOUNDATION READY
        </div>
        <h1 className="text-metric font-mono">Phase 1 Primitives Loaded</h1>
        <p className="text-small text-text-2">
          Project foundation and UI primitives are verified. Phase 2 will construct the app shell, top bar, and sidebar.
        </p>
        <div className="pt-2">
          <Link to="/__ui">
            <Button variant="primary" size={32}>
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
