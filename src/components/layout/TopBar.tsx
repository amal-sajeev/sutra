import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './TopBar.module.css';

interface TopBarProps {
  onBack: () => void;
}

export default function TopBar({ onBack }: TopBarProps) {
  const project = useProjectStore((s) => s.activeProject);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const rightPanel = useUIStore((s) => s.rightPanel);
  const setRightPanel = useUIStore((s) => s.setRightPanel);

  const panelButtons = [
    { key: 'timeline' as const, label: 'Timeline', icon: '―' },
    { key: 'constellation' as const, label: 'Ideas', icon: '✦' },
    { key: 'characters' as const, label: 'Characters', icon: '◎' },
    { key: 'snapshots' as const, label: 'Snapshots', icon: '◷' },
  ];

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <button className={styles.iconBtn} onClick={onBack} data-tooltip="Back to Dashboard" data-tooltip-pos="bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button className={styles.iconBtn} onClick={toggleSidebar} data-tooltip="Toggle Sidebar (Ctrl+B)" data-tooltip-pos="bottom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <span className={styles.projectTitle}>{project?.title}</span>
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
    </div>
  );
}
