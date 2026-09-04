import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ScrollToTop } from './components/common/ScrollToTop';
import { SmoothScroll } from './components/common/SmoothScroll';
import { HomePage } from './pages/HomePage';
import { BuildPage } from './pages/BuildPage';
import { CostEstimationPage } from './pages/CostEstimationPage';
import { HistoryPage } from './pages/HistoryPage';
import { GuidelinePage } from './pages/GuidelinePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <ScrollToTop />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/build" element={<BuildPage />} />
              <Route path="/cost-estimation" element={<CostEstimationPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/guideline" element={<GuidelinePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </SmoothScroll>
    </BrowserRouter>
  );
};

export default App;
