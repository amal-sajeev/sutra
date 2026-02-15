import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useIdeaStore } from '../../stores/ideaStore';
import styles from './QuickCapture.module.css';

export default function QuickCapture() {
  const isOpen = useUIStore((s) => s.quickCaptureOpen);
  const setOpen = useUIStore((s) => s.setQuickCaptureOpen);
  const theme = useUIStore((s) => s.theme);
  const createIdea = useProjectStore((s) => s.createIdea);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const rebuildIndex = useIdeaStore((s) => s.rebuildIndex);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!text.trim() || !activeProjectId) return;

    // Extract tags from #hashtags
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }

    const content = text.replace(tagRegex, '').trim();
    await createIdea(content, tags);

    // Rebuild TF-IDF index
    const updatedIdeas = useProjectStore.getState().ideas;
    rebuildIndex(updatedIdeas);

    setText('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!activeProjectId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className={`${styles.capture} ${theme === 'matrix' ? styles.matrix : styles.lain} chromatic`}
            initial={theme === 'matrix'
              ? { opacity: 0, y: -10 }
              : { opacity: 0, x: 40 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={theme === 'matrix'
              ? { opacity: 0, y: -10 }
              : { opacity: 0, x: 40 }
            }
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {theme === 'matrix' && (
              <div className={styles.matrixPrompt}>
                <span className={styles.promptChar}>&gt;</span>
                <span className={styles.promptLabel}>CAPTURE_THREAD</span>
              </div>
            )}
            {theme === 'lain' && (
              <div className={styles.lainHeader}>
                <span>Capture an idea</span>
              </div>
            )}
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                className={styles.input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={theme === 'matrix' ? 'enter thought...' : 'What comes to mind?'}
              />
            </div>
            <div className={styles.hint}>
              <span>Press Enter to save</span>
              <span>Use #tags for categories</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
