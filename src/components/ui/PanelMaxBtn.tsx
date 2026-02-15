import { useUIStore } from '../../stores/uiStore';
import styles from './PanelMaxBtn.module.css';

export default function PanelMaxBtn() {
  const maximized = useUIStore((s) => s.rightPanelMaximized);
  const toggle = useUIStore((s) => s.toggleRightPanelMaximized);

  return (
    <button
      className={styles.btn}
      onClick={toggle}
      data-tooltip={maximized ? 'Restore (Esc)' : 'Maximize'}
      data-tooltip-pos="bottom"
    >
      {maximized ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="7" width="12" height="12" rx="1" />
          <path d="M7 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 00-2 2v3" />
          <path d="M21 8V5a2 2 0 00-2-2h-3" />
          <path d="M3 16v3a2 2 0 002 2h3" />
          <path d="M16 21h3a2 2 0 002-2v-3" />
        </svg>
      )}
    </button>
  );
}
