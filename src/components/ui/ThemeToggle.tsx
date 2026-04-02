import { motion } from 'framer-motion';
import type { ThemeMode } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import styles from './ThemeToggle.module.css';

const NEXT_THEME_LABEL: Record<ThemeMode, string> = {
  lain: 'Matrix',
  matrix: 'Clean Light',
  light: 'Lain',
};

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const digitalRain = useUIStore((s) => s.digitalRain);
  const setDigitalRain = useUIStore((s) => s.setDigitalRain);

  return (
    <div className={styles.toggleGroup}>
      <motion.button
        className={styles.toggle}
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        data-tooltip={`Switch to ${NEXT_THEME_LABEL[theme]} mode`}
      >
        <motion.div
          className={styles.icon}
          initial={false}
          animate={{ rotateY: theme === 'matrix' ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {theme === 'lain' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          {theme === 'matrix' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v16M8 4v12M12 4v16M16 4v8M20 4v16" strokeLinecap="round" />
            </svg>
          )}
          {theme === 'light' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </motion.div>
      </motion.button>
      {theme === 'matrix' && (
        <motion.button
          className={`${styles.rainToggle} ${digitalRain ? styles.rainActive : ''}`}
          onClick={() => setDigitalRain(!digitalRain)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          data-tooltip={digitalRain ? 'Disable digital rain' : 'Enable digital rain'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v6M8 4v4M16 3v5M4 8v8M20 7v9M12 10v12M8 12v10M16 11v11" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
