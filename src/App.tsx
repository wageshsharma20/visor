import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { LivePage } from '@/pages/LivePage';
import { ModelsPage } from '@/pages/ModelsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { UiReviewPage } from '@/pages/UiReviewPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/live" replace />} />

        {/* Core application routes wrapped in standard AppLayout */}
        <Route
          path="/live"
          element={
            <AppLayout>
              <LivePage />
            </AppLayout>
          }
        />
        <Route
          path="/models"
          element={
            <AppLayout>
              <ModelsPage />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          }
        />

        {/* Redirect removed routes to /live per Phase 3.5 */}
        <Route path="/overview" element={<Navigate to="/live" replace />} />
        <Route path="/analytics" element={<Navigate to="/live" replace />} />
        <Route path="/settings" element={<Navigate to="/live" replace />} />

        {/* Dev-only UI review page */}
        {import.meta.env.DEV && <Route path="/__ui" element={<UiReviewPage />} />}

        {/* Fallback to /live */}
        <Route path="*" element={<Navigate to="/live" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
