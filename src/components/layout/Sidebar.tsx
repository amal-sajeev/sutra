import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { computeWarmth, getHeatColor } from '../../utils/heatmap';
import ContextMenu, { type ContextMenuItem } from '../ui/ContextMenu';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const chapters = useProjectStore((s) => s.chapters);
  const scenes = useProjectStore((s) => s.scenes);
  const ideas = useProjectStore((s) => s.ideas);
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const createChapter = useProjectStore((s) => s.createChapter);
  const createScene = useProjectStore((s) => s.createScene);
  const deleteChapter = useProjectStore((s) => s.deleteChapter);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const updateChapter = useProjectStore((s) => s.updateChapter);
  const updateScene = useProjectStore((s) => s.updateScene);
  const setRightPanel = useUIStore((s) => s.setRightPanel);

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<{ type: 'chapter' | 'scene'; id: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const toggleExpand = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'binder' | 'chapter' | 'scene', id?: number) => {
      e.preventDefault();
      const items: ContextMenuItem[] = [];

      if (type === 'binder') {
        items.push({ label: 'New Chapter', action: () => createChapter('New Chapter') });
      } else if (type === 'chapter' && id) {
        items.push({ label: 'New Scene', action: () => createScene(id, 'New Scene') });
        items.push({
          label: 'Rename',
          action: () => {
            const ch = chapters.find((c) => c.id === id);
            setEditingId({ type: 'chapter', id });
            setEditText(ch?.title || '');
          },
        });
        items.push({ label: 'Delete Chapter', action: () => deleteChapter(id), danger: true });
      } else if (type === 'scene' && id) {
        items.push({
          label: 'Rename',
          action: () => {
            const sc = scenes.find((s) => s.id === id);
            setEditingId({ type: 'scene', id });
            setEditText(sc?.title || '');
          },
        });
        items.push({ label: 'Delete Scene', action: () => deleteScene(id), danger: true });
      }

      setContextMenu({ x: e.clientX, y: e.clientY, items });
    },
    [chapters, scenes, createChapter, createScene, deleteChapter, deleteScene]
  );

  const handleRenameSubmit = () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    if (editingId.type === 'chapter') {
      updateChapter(editingId.id, { title: editText.trim() });
    } else {
      updateScene(editingId.id, { title: editText.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className={styles.sidebar} onContextMenu={(e) => handleContextMenu(e, 'binder')}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Manuscript</span>
        <button
          className={styles.addBtn}
          onClick={() => createChapter('New Chapter')}
          data-tooltip="New Chapter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className={styles.tree}>
        <AnimatePresence initial={false}>
          {chapters.map((chapter) => {
            const chapterScenes = scenes
              .filter((s) => s.chapterId === chapter.id)
              .sort((a, b) => a.order - b.order);
            const isExpanded = expandedChapters.has(chapter.id!);

            return (
              <motion.div
                key={chapter.id}
                className={styles.chapterGroup}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div
                  className={styles.chapterItem}
                  onClick={() => toggleExpand(chapter.id!)}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, 'chapter', chapter.id);
                  }}
                >
                  <span className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                  {editingId?.type === 'chapter' && editingId.id === chapter.id ? (
                    <input
                      className={styles.renameInput}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={styles.chapterTitle}>{chapter.title}</span>
                  )}
                  <span className={styles.sceneCount}>{chapterScenes.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className={styles.sceneList}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {chapterScenes.map((scene) => {
                        const warmth = computeWarmth(scene.lastEditedAt);
                        const heatColor = getHeatColor(warmth);

                        return (
                          <div
                            key={scene.id}
                            className={`${styles.sceneItem} ${activeSceneId === scene.id ? styles.active : ''}`}
                            style={{ borderLeftColor: heatColor }}
                            onClick={() => setActiveScene(scene.id!)}
                            onContextMenu={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, 'scene', scene.id);
                            }}
                          >
                            {editingId?.type === 'scene' && editingId.id === scene.id ? (
                              <input
                                className={styles.renameInput}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className={styles.sceneTitle}>{scene.title}</span>
                            )}
                          </div>
                        );
                      })}
                      <button
                        className={styles.addSceneBtn}
                        onClick={() => createScene(chapter.id!, 'New Scene')}
                      >
                        + Scene
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Ideas Section */}
      <div className={styles.ideasSection}>
        <button
          className={styles.ideasHeader}
          onClick={() => setRightPanel('constellation')}
        >
          <span>Ideas</span>
          <span className={styles.ideaCount}>{ideas.length}</span>
        </button>
        <div className={styles.ideaList}>
          {ideas.slice(0, 5).map((idea) => (
            <div key={idea.id} className={styles.ideaItem}>
              <span className={styles.ideaText}>{idea.content}</span>
            </div>
          ))}
          {ideas.length > 5 && (
            <button className={styles.viewAllBtn} onClick={() => setRightPanel('constellation')}>
              View all {ideas.length} ideas
            </button>
          )}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          isOpen={true}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
