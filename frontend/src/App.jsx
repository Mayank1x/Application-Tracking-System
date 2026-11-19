import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Check } from 'lucide-react';
import Sidebar from './components/Navbar';
import BatchAtsPage from './pages/BatchAtsPage';
import SettingsModal, { DEFAULT_SETTINGS } from './components/SettingsModal';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ats_theme') || 'light';
  });

  const [activeNav, setActiveNav] = useState('positions'); // 'positions' | 'jobs' | 'candidates' | 'analytics'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ats_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ats_settings', JSON.stringify(newSettings));
    showToast('ATS Scoring Weights & Model settings saved successfully!');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <BrowserRouter>
      <div
        data-theme={theme}
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          background: 'var(--bg-app)',
          color: 'var(--text-primary)',
          overflow: 'hidden'
        }}
      >
        {/* Global Toast */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '16px',
            right: '24px',
            background: '#059669',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <Check size={14} strokeWidth={2.5} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Slim Nav Sidebar */}
        <Sidebar
          theme={theme}
          toggleTheme={toggleTheme}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
          <Routes>
            <Route path="*" element={
              <BatchAtsPage
                theme={theme}
                toggleTheme={toggleTheme}
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                settings={settings}
                onOpenSettings={() => setShowSettingsModal(true)}
                showToast={showToast}
              />
            } />
          </Routes>
        </main>

        {/* Global ATS Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onSave={handleSaveSettings}
          theme={theme}
        />
      </div>
    </BrowserRouter>
  );
}
