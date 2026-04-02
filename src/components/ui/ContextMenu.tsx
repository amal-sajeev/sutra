import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  isOpen: boolean;
}

export default function ContextMenu({ x, y, items, onClose, isOpen }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) setOpenSubmenu(null);
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Flip to prevent overflow
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x, ny = y;
    if (rect.right > vw) nx = Math.max(0, x - rect.width);
    if (rect.bottom > vh) ny = Math.max(0, y - rect.height);
    if (nx !== x || ny !== y) {
      menuRef.current.style.left = `${nx}px`;
      menuRef.current.style.top = `${ny}px`;
    }
  }, [isOpen, x, y]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className={styles.menu}
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
        >
          {items.map((item, i) =>
            item.submenu && item.submenu.length > 0 ? (
              <div
                key={i}
                className={styles.submenuParent}
                onMouseEnter={() => {
                  clearLeaveTimer();
                  setOpenSubmenu(i);
                }}
                onMouseLeave={() => {
                  clearLeaveTimer();
                  leaveTimerRef.current = setTimeout(() => setOpenSubmenu((s) => (s === i ? null : s)), 180);
                }}
              >
                <div className={`${styles.item} ${styles.submenuTrigger}`} role="menuitem">
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span className={styles.submenuLabel}>{item.label}</span>
                  <span className={styles.submenuChevron} aria-hidden>
                    ▸
                  </span>
                </div>
                {openSubmenu === i && (
                  <div
                    className={styles.submenu}
                    role="menu"
                    onMouseEnter={() => {
                      clearLeaveTimer();
                      setOpenSubmenu(i);
                    }}
                    onMouseLeave={() => {
                      clearLeaveTimer();
                      leaveTimerRef.current = setTimeout(() => setOpenSubmenu(null), 180);
                    }}
                  >
                    {item.submenu.map((sub, j) => (
                      <button
                        key={j}
                        type="button"
                        className={`${styles.item} ${sub.danger ? styles.danger : ''}`}
                        onClick={() => {
                          sub.action?.();
                          onClose();
                        }}
                      >
                        {sub.icon && <span className={styles.icon}>{sub.icon}</span>}
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                onClick={() => {
                  item.action?.();
                  onClose();
                }}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
