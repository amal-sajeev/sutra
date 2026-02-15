import { motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <motion.button
      className={styles.toggle}
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      data-tooltip={`Switch to ${theme === 'lain' ? 'Matrix' : 'Lain'} mode`}
    >
      <motion.div
        className={styles.icon}
        initial={false}
        animate={{ rotateY: theme === 'matrix' ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {theme === 'lain' ? (
          // Lain eye icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          // Matrix rain icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v16M8 4v12M12 4v16M16 4v8M20 4v16" strokeLinecap="round" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}
