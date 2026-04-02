import { useState, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import SettingsDialog from '../ui/SettingsDialog';
import ExportDialog from '../export/ExportDialog';
import ProjectSearch from '../views/ProjectSearch';
import ProjectStats from '../views/ProjectStats';
import type { CenterView } from '../../types';
import type { UseAutoBackupResult } from '../../hooks/useAutoBackup';
import styles from './TopBar.module.css';

interface TopBarProps {
  onBack: () => void;
  autoBackup?: UseAutoBackupResult;
}

export default function TopBar({ onBack, autoBackup }: TopBarProps) {
  const project = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const rightPanel = useUIStore((s) => s.rightPanel);
  const setRightPanel = useUIStore((s) => s.setRightPanel);
  const centerView = useUIStore((s) => s.centerView);
  const setCenterView = useUIStore((s) => s.setCenterView);
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const splitEditor = useUIStore((s) => s.splitEditor);
  const setSplitEditor = useUIStore((s) => s.setSplitEditor);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');

  const handleTitleSubmit = useCallback(() => {
    if (project?.id && titleText.trim()) {
      updateProject(project.id, { title: titleText.trim() });
    }
    setEditingTitle(false);
  }, [project, titleText, updateProject]);

  const panelButtons = [
    { key: 'timeline' as const, label: 'Timeline', icon: '\u2015' },
    { key: 'constellation' as const, label: 'Ideas', icon: '\u2726' },
    { key: 'characters' as const, label: 'Characters', icon: '\u25CE' },
    { key: 'snapshots' as const, label: 'Snapshots', icon: '\u25F7' },
    { key: 'nameGenerator' as const, label: 'Names', icon: '\u25C7' },
  ];

  return (
    <header className={styles.topBar} role="banner">
      <div className={styles.left}>
        <button className={styles.iconBtn} onClick={onBack} data-tooltip="Back to Dashboard" data-tooltip-pos="bottom" aria-label="Back to Dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button className={styles.iconBtn} onClick={toggleSidebar} data-tooltip="Toggle Sidebar (Ctrl+Shift+B)" data-tooltip-pos="bottom" aria-label="Toggle Sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>

        <div className={styles.viewModes}>
          {([
            { key: 'editor', label: 'Editor', icon: '✎' },
            { key: 'corkboard', label: 'Corkboard', icon: '▦' },
            { key: 'outliner', label: 'Outliner', icon: '☰' },
            { key: 'plotBeats', label: 'Plot Beats', icon: '▬' },
            { key: 'scrivenings', label: 'Scrivenings', icon: '⫏' },
          ] as { key: CenterView; label: string; icon: string }[]).map(v => (
            <button
              key={v.key}
              className={`${styles.viewBtn} ${centerView === v.key ? styles.viewBtnActive : ''}`}
              onClick={() => setCenterView(v.key)}
              data-tooltip={v.label}
              data-tooltip-pos="bottom"
              aria-label={v.label}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {editingTitle ? (
          <input
            className={styles.titleInput}
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            autoFocus
          />
        ) : (
          <span
            className={styles.projectTitle}
            onDoubleClick={() => {
              setTitleText(project?.title || '');
              setEditingTitle(true);
            }}
            data-tooltip="Double-click to rename"
          >
            {project?.title}
          </span>
        )}
      </div>

      <div className={styles.center}>
        {panelButtons.map((btn) => (
          <button
            key={btn.key}
            className={`${styles.panelBtn} ${rightPanel === btn.key ? styles.active : ''}`}
            onClick={() => setRightPanel(rightPanel === btn.key ? 'none' : btn.key)}
            data-tooltip={btn.label} data-tooltip-pos="bottom"
          >
            <span className={styles.panelIcon}>{btn.icon}</span>
            <span className={styles.panelLabel}>{btn.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          onClick={() => setSearchOpen(true)}
          data-tooltip="Search Project (Ctrl+Shift+F)"
          data-tooltip-pos="bottom"
          aria-label="Search Project"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <ProjectSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <button
          className={styles.iconBtn}
          onClick={() => setStatsOpen(true)}
          data-tooltip="Project Statistics"
          data-tooltip-pos="bottom"
          aria-label="Project Statistics"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </button>
        <ProjectStats isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
        <button
          className={`${styles.iconBtn} ${inspectorOpen ? styles.active : ''}`}
          onClick={toggleInspector}
          data-tooltip="Toggle Inspector (Ctrl+I)"
          data-tooltip-pos="bottom"
          aria-label="Toggle Inspector"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M15 3v18" />
            <path d="M19 8h-3M19 12h-3M19 16h-3" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${splitEditor ? styles.active : ''}`}
          onClick={() => setSplitEditor(!splitEditor)}
          data-tooltip="Toggle Split View (Ctrl+\\)"
          data-tooltip-pos="bottom"
          aria-label="Toggle Split View"
          aria-pressed={splitEditor}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <rect x="3" y="4" width="8" height="16" rx="1" />
            <rect x="13" y="4" width="8" height="16" rx="1" />
          </svg>
        </button>
        <button
          className={styles.iconBtn}
          onClick={() => setSettingsOpen(true)}
          data-tooltip="Settings" data-tooltip-pos="bottom"
          aria-label="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} autoBackup={autoBackup} />
        <button
          type="button"
          className={styles.exportBtn}
          onClick={() => setExportOpen(true)}
          data-tooltip="Export" data-tooltip-pos="bottom"
          aria-label="Export manuscript"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>Export</span>
        </button>
        <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} />
        <button
          className={styles.captureBtn}
          onClick={() => useUIStore.getState().toggleQuickCapture()}
          data-tooltip="Capture an Idea (Ctrl+Shift+I)" data-tooltip-pos="bottom"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span>Idea</span>
        </button>
      </div>
    </header>
  );
}
