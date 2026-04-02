import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useUIStore } from './stores/uiStore';
import Dashboard from './components/project/Dashboard';
import ProjectWorkspace from './components/layout/ProjectWorkspace';
import QuickCapture from './components/capture/QuickCapture';
import DigitalRain from './components/ui/DigitalRain';
import ToastContainer from './components/ui/ToastContainer';
import BackupWarning from './components/ui/BackupWarning';
import CommandPalette from './components/ui/CommandPalette';
import ShortcutSheet from './components/ui/ShortcutSheet';
import DuplicateTabWarning from './components/ui/DuplicateTabWarning';

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const digitalRain = useUIStore((s) => s.digitalRain);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyI') {
        e.preventDefault();
        useUIStore.getState().toggleQuickCapture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell" style={{ position: 'relative', height: '100vh', width: '100vw' }} role="application" aria-label="Sutra Writing Application">
      <a href="#main-content" className="skip-link">Skip to content</a>
      {theme === 'matrix' && digitalRain && <DigitalRain />}

      <main id="main-content">
      <DuplicateTabWarning />
      <ShortcutSheet />
      <BackupWarning />
      <CommandPalette />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectWorkspace />} />
        </Routes>
      </AnimatePresence>
      </main>

      <QuickCapture />
      <ToastContainer />
    </div>
  );
}
