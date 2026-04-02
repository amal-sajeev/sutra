import { useState, useEffect, useRef, useId } from 'react';
import styles from './ShortcutSheet.module.css';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+P', action: 'Quick open (Command Palette)' },
      { keys: 'Ctrl+Shift+B', action: 'Toggle sidebar' },
      { keys: 'Ctrl+Shift+I', action: 'Toggle inspector' },
      { keys: 'Ctrl+\\', action: 'Toggle split editor' },
      { keys: '?', action: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: 'Ctrl+B', action: 'Bold' },
      { keys: 'Ctrl+I', action: 'Italic' },
      { keys: 'Ctrl+U', action: 'Underline' },
      { keys: 'Ctrl+Shift+X', action: 'Strikethrough' },
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Shift+Z', action: 'Redo' },
      { keys: 'Ctrl+Shift+7', action: 'Numbered list' },
      { keys: 'Ctrl+Shift+8', action: 'Bullet list' },
    ],
  },
  {
    title: 'Views',
    shortcuts: [
      { keys: 'Ctrl+1', action: 'Editor view' },
      { keys: 'Ctrl+2', action: 'Corkboard view' },
      { keys: 'Ctrl+3', action: 'Outliner view' },
      { keys: 'Ctrl+4', action: 'Scrivenings view' },
    ],
  },
  {
    title: 'Project',
    shortcuts: [
      { keys: 'Ctrl+Shift+E', action: 'Export manuscript' },
      { keys: 'Ctrl+Shift+F', action: 'Project search' },
      { keys: 'Ctrl+Q', action: 'Quick capture idea' },
    ],
  },
];

export default function ShortcutSheet() {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      const editable = el?.getAttribute('contenteditable');
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable === 'true') return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className={styles.sheetHeader}>
          <h2 id={titleId} className={styles.sheetTitle}>
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Close keyboard shortcuts"
          >
            ×
          </button>
        </div>
        <div className={styles.groups}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <ul className={styles.shortcuts} aria-label={`${group.title} shortcuts`}>
                {group.shortcuts.map((s) => (
                  <li key={s.keys} className={styles.shortcut}>
                    <kbd className={styles.kbd}>{s.keys}</kbd>
                    <span className={styles.action}>{s.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p id={descId} className={styles.footer}>
          Press <kbd className={styles.kbd}>?</kbd> or Escape to close
        </p>
      </div>
    </div>
  );
}
