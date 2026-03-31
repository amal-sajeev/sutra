import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { computeWarmth, getHeatColor } from '../../utils/heatmap';
import ContextMenu, { type ContextMenuItem } from '../ui/ContextMenu';
import TrashView from '../views/TrashView';
import styles from './Sidebar.module.css';

function countWordsInContent(content: string): number {
  if (!content) return 0;
  try {
    const doc = JSON.parse(content);
    const text = extractTextFromNode(doc);
    return text.split(/\s+/).filter(Boolean).length;
  } catch {
    return content.split(/\s+/).filter(Boolean).length;
  }
}

function extractTextFromNode(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';
  let text = '';
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromNode(child as Record<string, unknown>) + ' ';
    }
  }
  return text;
}

export default function Sidebar() {
  const chapters = useProjectStore((s) => s.chapters);
  const scenes = useProjectStore((s) => s.scenes);
  const ideas = useProjectStore((s) => s.ideas);
  const activeProject = useProjectStore((s) => s.activeProject);
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const createChapter = useProjectStore((s) => s.createChapter);
  const createScene = useProjectStore((s) => s.createScene);
  const deleteChapter = useProjectStore((s) => s.deleteChapter);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const trashScene = useProjectStore((s) => s.trashScene);
  const trashChapter = useProjectStore((s) => s.trashChapter);
  const trashItems = useProjectStore((s) => s.trashItems);
  const updateChapter = useProjectStore((s) => s.updateChapter);
  const updateScene = useProjectStore((s) => s.updateScene);
  const reorderChapters = useProjectStore((s) => s.reorderChapters);
  const reorderScenes = useProjectStore((s) => s.reorderScenes);
  const moveScene = useProjectStore((s) => s.moveScene);
  const setSplitScene = useProjectStore((s) => s.setSplitScene);
  const noteDocuments = useProjectStore((s) => s.noteDocuments);
  const createNote = useProjectStore((s) => s.createNote);
  const setActiveNote = useProjectStore((s) => s.setActiveNote);
  const activeNoteId = useProjectStore((s) => s.activeNoteId);
  const deleteNote = useProjectStore((s) => s.deleteNote);
  const setRightPanel = useUIStore((s) => s.setRightPanel);
  const setSplitEditor = useUIStore((s) => s.setSplitEditor);

  const [binderFilter, setBinderFilter] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<{ type: 'chapter' | 'scene'; id: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [dragOverSceneId, setDragOverSceneId] = useState<number | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<number | null>(null);
  const dragItemRef = useRef<{ type: 'chapter' | 'scene'; id: number; chapterId?: number } | null>(null);

  // Auto-expand the chapter containing the active scene
  useEffect(() => {
    if (!activeSceneId) return;
    const scene = scenes.find(s => s.id === activeSceneId);
    if (scene) {
      setExpandedChapters(prev => {
        if (prev.has(scene.chapterId)) return prev;
        const next = new Set(prev);
        next.add(scene.chapterId);
        return next;
      });
    }
  }, [activeSceneId, scenes]);

  const totalWordCount = useMemo(() => {
    return scenes.reduce((sum, s) => sum + countWordsInContent(s.content), 0);
  }, [scenes]);

  const chapterWordCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const scene of scenes) {
      const current = counts.get(scene.chapterId) || 0;
      counts.set(scene.chapterId, current + countWordsInContent(scene.content));
    }
    return counts;
  }, [scenes]);

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
        items.push({ label: 'Move to Trash', action: () => trashChapter(id), danger: true });
      } else if (type === 'scene' && id) {
        items.push({
          label: 'Open in Split View',
          action: () => {
            setSplitScene(id);
            setSplitEditor(true);
          },
        });

        const scene = scenes.find((s) => s.id === id);
        if (scene && chapters.length > 1) {
          const otherChapters = chapters.filter((c) => c.id !== scene.chapterId);
          for (const ch of otherChapters) {
            items.push({
              label: `Move to "${ch.title}"`,
              action: () => moveScene(id, ch.id!),
            });
          }
        }

        items.push({
          label: 'Rename',
          action: () => {
            const sc = scenes.find((s) => s.id === id);
            setEditingId({ type: 'scene', id });
            setEditText(sc?.title || '');
          },
        });
        items.push({ label: 'Move to Trash', action: () => trashScene(id), danger: true });
      }

      setContextMenu({ x: e.clientX, y: e.clientY, items });
    },
    [chapters, scenes, createChapter, createScene, deleteChapter, deleteScene, setSplitScene, setSplitEditor, moveScene]
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

  const handleChapterDragStart = (e: React.DragEvent, chapterId: number) => {
    dragItemRef.current = { type: 'chapter', id: chapterId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `chapter:${chapterId}`);
  };

  const handleChapterDragOver = (e: React.DragEvent, chapterId: number) => {
    e.preventDefault();
    if (dragItemRef.current?.type === 'chapter') {
      setDragOverChapterId(chapterId);
    }
  };

  const handleChapterDrop = (e: React.DragEvent, targetChapterId: number) => {
    e.preventDefault();
    setDragOverChapterId(null);
    if (!dragItemRef.current || dragItemRef.current.type !== 'chapter') return;
    const sourceId = dragItemRef.current.id;
    if (sourceId === targetChapterId) return;

    const ids = chapters.map((c) => c.id!);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetChapterId);
    if (fromIndex < 0 || toIndex < 0) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, sourceId);
    reorderChapters(ids);
    dragItemRef.current = null;
  };

  const handleSceneDragStart = (e: React.DragEvent, sceneId: number, chapterId: number) => {
    dragItemRef.current = { type: 'scene', id: sceneId, chapterId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `scene:${sceneId}`);
  };

  const handleSceneDragOver = (e: React.DragEvent, sceneId: number) => {
    e.preventDefault();
    if (dragItemRef.current?.type === 'scene') {
      setDragOverSceneId(sceneId);
    }
  };

  const handleSceneDrop = (e: React.DragEvent, targetSceneId: number, targetChapterId: number) => {
    e.preventDefault();
    setDragOverSceneId(null);
    if (!dragItemRef.current || dragItemRef.current.type !== 'scene') return;

    const sourceId = dragItemRef.current.id;
    const sourceChapterId = dragItemRef.current.chapterId!;
    if (sourceId === targetSceneId) return;

    if (sourceChapterId !== targetChapterId) {
      moveScene(sourceId, targetChapterId);
    } else {
      const chapterScenes = scenes
        .filter((s) => s.chapterId === targetChapterId)
        .sort((a, b) => a.order - b.order);
      const ids = chapterScenes.map((s) => s.id!);
      const fromIndex = ids.indexOf(sourceId);
      const toIndex = ids.indexOf(targetSceneId);
      if (fromIndex < 0 || toIndex < 0) return;

      ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, sourceId);
      reorderScenes(targetChapterId, ids);
    }
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverSceneId(null);
    setDragOverChapterId(null);
    dragItemRef.current = null;
  };

  return (
    <nav className={styles.sidebar} onContextMenu={(e) => handleContextMenu(e, 'binder')} aria-label="Manuscript binder">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Manuscript</span>
          <span className={styles.totalWords}>{totalWordCount.toLocaleString()}w</span>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => createChapter('New Chapter')}
          data-tooltip="New Chapter"
          aria-label="New Chapter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {scenes.length > 5 && (
        <div className={styles.filterBar}>
          <input
            className={styles.filterInput}
            placeholder="Filter binder..."
            value={binderFilter}
            onChange={e => setBinderFilter(e.target.value)}
          />
          {binderFilter && (
            <button className={styles.filterClear} onClick={() => setBinderFilter('')}>×</button>
          )}
        </div>
      )}

      <div className={styles.tree}>
        <AnimatePresence initial={false}>
          {chapters.filter(c => {
            if (!binderFilter) return true;
            const q = binderFilter.toLowerCase();
            if (c.title.toLowerCase().includes(q)) return true;
            return scenes.some(s => s.chapterId === c.id && s.title.toLowerCase().includes(q));
          }).map((chapter) => {
            const chapterScenes = scenes
              .filter((s) => s.chapterId === chapter.id)
              .filter(s => !binderFilter || s.title.toLowerCase().includes(binderFilter.toLowerCase()))
              .sort((a, b) => a.order - b.order);
            const isExpanded = expandedChapters.has(chapter.id!);
            const chapterWords = chapterWordCounts.get(chapter.id!) || 0;

            return (
              <motion.div
                key={chapter.id}
                className={`${styles.chapterGroup} ${dragOverChapterId === chapter.id ? styles.dragOver : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div
                  className={styles.chapterItem}
                  draggable
                  onDragStart={(e) => handleChapterDragStart(e, chapter.id!)}
                  onDragOver={(e) => handleChapterDragOver(e, chapter.id!)}
                  onDrop={(e) => handleChapterDrop(e, chapter.id!)}
                  onDragEnd={handleDragEnd}
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
                  <svg className={styles.docIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
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
                  <span className={styles.chapterMeta}>
                    <span className={styles.chapterWordCount}>{chapterWords.toLocaleString()}w</span>
                    <span className={styles.sceneCount}>{chapterScenes.length}</span>
                  </span>
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

                        const labelColor = scene.label
                          ? activeProject?.settings?.labels?.find(l => l.name === scene.label)?.color
                          : undefined;
                        return (
                          <div
                            key={scene.id}
                            className={`${styles.sceneItem} ${activeSceneId === scene.id ? styles.active : ''} ${dragOverSceneId === scene.id ? styles.sceneDragOver : ''}`}
                            style={{ borderLeftColor: heatColor }}
                            draggable
                            onDragStart={(e) => handleSceneDragStart(e, scene.id!, chapter.id!)}
                            onDragOver={(e) => handleSceneDragOver(e, scene.id!)}
                            onDrop={(e) => handleSceneDrop(e, scene.id!, chapter.id!)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              setActiveScene(scene.id!);
                              useUIStore.getState().setCenterView('editor');
                            }}
                            onContextMenu={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, 'scene', scene.id);
                            }}
                          >
                            <svg className={styles.docIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {labelColor && <span className={styles.labelDot} style={{ background: labelColor }} />}
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

      {/* Research & Notes */}
      <div className={styles.ideasSection}>
        <div className={styles.notesHeader}>
          <button className={styles.ideasHeader} onClick={() => {}}>
            <span>Research & Notes</span>
            <span className={styles.ideaCount}>{noteDocuments.length}</span>
          </button>
          <button
            className={styles.addSceneBtn}
            onClick={() => createNote('New Note')}
            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
          >
            + Note
          </button>
        </div>
        <div className={styles.ideaList}>
          {noteDocuments.map(note => (
            <div
              key={note.id}
              className={`${styles.sceneItem} ${activeNoteId === note.id ? styles.active : ''}`}
              onClick={() => {
                setActiveNote(note.id!);
                useUIStore.getState().setCenterView('editor');
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  items: [
                    { label: 'Rename', action: () => { setEditingId({ type: 'scene', id: note.id! }); setEditText(note.title); } },
                    { label: 'Delete Note', action: () => deleteNote(note.id!), danger: true },
                  ],
                });
              }}
              style={{ borderLeftColor: 'var(--accent-primary)', paddingLeft: '12px' }}
            >
              <span className={styles.sceneTitle} style={{ fontStyle: 'italic' }}>{note.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trash */}
      <div className={styles.trashSection}>
        <button className={styles.trashBtn} onClick={() => setTrashOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span>Trash</span>
          {trashItems.length > 0 && <span className={styles.trashBadge}>{trashItems.length}</span>}
        </button>
      </div>
      <TrashView isOpen={trashOpen} onClose={() => setTrashOpen(false)} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          isOpen={true}
          onClose={() => setContextMenu(null)}
        />
      )}
    </nav>
  );
}
