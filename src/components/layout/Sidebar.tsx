import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { computeWarmth, getHeatColor } from '../../utils/heatmap';
import ContextMenu, { type ContextMenuItem } from '../ui/ContextMenu';
import TrashView from '../views/TrashView';
import type { Chapter, Scene } from '../../types';
import { BUILT_IN_TEMPLATES } from '../../utils/sceneTemplates';
import styles from './Sidebar.module.css';

const BINDER_STATUS_COLOR: Record<Scene['status'], string> = {
  draft: 'var(--text-tertiary)',
  revision: '#d4a745',
  final: '#4aa86a',
};

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

const FRONT_MATTER = 'Front Matter';
const BACK_MATTER = 'Back Matter';

function isMatterChapter(ch: Chapter): boolean {
  return ch.sectionType === FRONT_MATTER || ch.sectionType === BACK_MATTER;
}

function chapterMatchesBinderFilter(ch: Chapter, scenesList: Scene[], q: string): boolean {
  if (!q.trim()) return true;
  const ql = q.toLowerCase();
  if (ch.title.toLowerCase().includes(ql)) return true;
  return scenesList.some((s) => s.chapterId === ch.id && s.title.toLowerCase().includes(ql));
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
  const updateNote = useProjectStore((s) => s.updateNote);
  const setRightPanel = useUIStore((s) => s.setRightPanel);
  const setSplitEditor = useUIStore((s) => s.setSplitEditor);

  const [binderFilter, setBinderFilter] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<{ type: 'chapter' | 'scene' | 'note'; id: number } | null>(null);
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

  const matterExcludedChapterIds = useMemo(() => {
    const set = new Set<number>();
    for (const c of chapters) {
      if (c.id != null && isMatterChapter(c)) set.add(c.id);
    }
    return set;
  }, [chapters]);

  const totalWordCount = useMemo(() => {
    return scenes.reduce((sum, s) => {
      if (matterExcludedChapterIds.has(s.chapterId)) return sum;
      return sum + countWordsInContent(s.content);
    }, 0);
  }, [scenes, matterExcludedChapterIds]);

  const chapterWordCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const scene of scenes) {
      if (matterExcludedChapterIds.has(scene.chapterId)) continue;
      const current = counts.get(scene.chapterId) || 0;
      counts.set(scene.chapterId, current + countWordsInContent(scene.content));
    }
    return counts;
  }, [scenes, matterExcludedChapterIds]);

  const binderChaptersGrouped = useMemo(() => {
    const q = binderFilter.trim();
    const filtered = chapters.filter((c) => chapterMatchesBinderFilter(c, scenes, q));
    const byOrder = (a: Chapter, b: Chapter) => a.order - b.order;
    return {
      front: filtered.filter((c) => c.sectionType === FRONT_MATTER).sort(byOrder),
      main: filtered.filter((c) => c.sectionType !== FRONT_MATTER && c.sectionType !== BACK_MATTER).sort(byOrder),
      back: filtered.filter((c) => c.sectionType === BACK_MATTER).sort(byOrder),
    };
  }, [chapters, scenes, binderFilter]);

  type BinderRow =
    | { type: 'divider'; label: string }
    | { type: 'chapter'; chapter: Chapter };

  const binderRows = useMemo((): BinderRow[] => {
    const { front, main, back } = binderChaptersGrouped;
    const rows: BinderRow[] = [];
    if (front.length) {
      rows.push({ type: 'divider', label: 'Front matter' });
      front.forEach((c) => rows.push({ type: 'chapter', chapter: c }));
    }
    if (main.length) {
      if (front.length || back.length) {
        rows.push({ type: 'divider', label: 'Manuscript' });
      }
      main.forEach((c) => rows.push({ type: 'chapter', chapter: c }));
    }
    if (back.length) {
      rows.push({ type: 'divider', label: 'Back matter' });
      back.forEach((c) => rows.push({ type: 'chapter', chapter: c }));
    }
    return rows;
  }, [binderChaptersGrouped]);

  const toggleExpand = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const addSceneBelowWithContent = useCallback(
    async (chapterId: number, afterSceneId: number, title: string, content?: string) => {
      await createScene(chapterId, title, content);
      const all = useProjectStore.getState().scenes;
      const chapterScenes = all
        .filter((s) => s.chapterId === chapterId)
        .sort((a, b) => a.order - b.order);
      const orderedIds = chapterScenes.map((s) => s.id!);
      const newSceneId = orderedIds[orderedIds.length - 1];
      const others = orderedIds.filter((i) => i !== newSceneId);
      const pos = others.indexOf(afterSceneId);
      if (pos < 0) return;
      const newOrder = [...others.slice(0, pos + 1), newSceneId, ...others.slice(pos + 1)];
      await reorderScenes(chapterId, newOrder);
    },
    [createScene, reorderScenes]
  );

  const sceneTemplateSubmenu = useCallback(
    (chapterId: number): ContextMenuItem[] => [
      { label: 'Blank', action: () => createScene(chapterId, 'New Scene') },
      ...BUILT_IN_TEMPLATES.map((t) => ({
        label: t.name,
        action: () => createScene(chapterId, t.name, t.content),
      })),
    ],
    [createScene]
  );

  const newFromTemplateSubmenu = useCallback(
    (sceneId: number): ContextMenuItem[] => {
      const sc = scenes.find((s) => s.id === sceneId);
      if (!sc) return [];
      return [
        {
          label: 'Blank',
          action: () => addSceneBelowWithContent(sc.chapterId, sceneId, 'New Scene'),
        },
        ...BUILT_IN_TEMPLATES.map((t) => ({
          label: t.name,
          action: () => addSceneBelowWithContent(sc.chapterId, sceneId, t.name, t.content),
        })),
      ];
    },
    [scenes, addSceneBelowWithContent]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'binder' | 'chapter' | 'scene', id?: number) => {
      e.preventDefault();
      const items: ContextMenuItem[] = [];

      if (type === 'binder') {
        items.push({ label: 'New Chapter', action: () => createChapter('New Chapter') });
      } else if (type === 'chapter' && id) {
        const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
        const chIndex = sortedChapters.findIndex((c) => c.id === id);

        items.push({ label: 'New Scene', action: () => createScene(id, 'New Scene') });
        items.push({
          label: 'Add Scene from Template',
          submenu: sceneTemplateSubmenu(id),
        });
        items.push({
          label: 'Duplicate Chapter',
          action: async () => {
            const ch = chapters.find((c) => c.id === id);
            if (!ch) return;
            const sourceScenes = scenes
              .filter((s) => s.chapterId === id)
              .sort((a, b) => a.order - b.order);
            const newChId = await createChapter(`${ch.title} (Copy)`, undefined, ch.sectionType);
            for (const sc of sourceScenes) {
              const newScId = await createScene(newChId, sc.title);
              await updateScene(newScId, {
                content: sc.content,
                synopsis: sc.synopsis,
                notes: sc.notes,
                status: sc.status,
                label: sc.label,
                tags: sc.tags,
                wordTarget: sc.wordTarget,
              });
            }
          },
        });
        if (chIndex > 0) {
          items.push({
            label: 'Move Up',
            action: () => {
              const ids = sortedChapters.map((c) => c.id!);
              const next = [...ids];
              [next[chIndex - 1], next[chIndex]] = [next[chIndex], next[chIndex - 1]];
              reorderChapters(next);
            },
          });
        }
        if (chIndex >= 0 && chIndex < sortedChapters.length - 1) {
          items.push({
            label: 'Move Down',
            action: () => {
              const ids = sortedChapters.map((c) => c.id!);
              const next = [...ids];
              [next[chIndex], next[chIndex + 1]] = [next[chIndex + 1], next[chIndex]];
              reorderChapters(next);
            },
          });
        }
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
          label: 'Duplicate Scene',
          action: async () => {
            const sc = scenes.find((s) => s.id === id);
            if (!sc) return;
            const title = `${sc.title} (Copy)`;
            const newId = await createScene(sc.chapterId, title);
            await updateScene(newId, {
              content: sc.content,
              synopsis: sc.synopsis,
              notes: sc.notes,
              status: sc.status,
              label: sc.label,
              tags: sc.tags,
              wordTarget: sc.wordTarget,
            });
            const all = useProjectStore.getState().scenes;
            const chapterScenes = all
              .filter((s) => s.chapterId === sc.chapterId)
              .sort((a, b) => a.order - b.order);
            const orderedIds = chapterScenes.map((s) => s.id!);
            const others = orderedIds.filter((i) => i !== newId);
            const pos = others.indexOf(id);
            if (pos < 0) return;
            const newOrder = [...others.slice(0, pos + 1), newId, ...others.slice(pos + 1)];
            await reorderScenes(sc.chapterId, newOrder);
          },
        });
        items.push({
          label: 'Add Scene Below',
          action: async () => {
            const sc = scenes.find((s) => s.id === id);
            if (!sc) return;
            await createScene(sc.chapterId, 'New Scene');
            const all = useProjectStore.getState().scenes;
            const chapterScenes = all
              .filter((s) => s.chapterId === sc.chapterId)
              .sort((a, b) => a.order - b.order);
            const orderedIds = chapterScenes.map((s) => s.id!);
            const newId = orderedIds[orderedIds.length - 1];
            const others = orderedIds.filter((i) => i !== newId);
            const pos = others.indexOf(id);
            if (pos < 0) return;
            const newOrder = [...others.slice(0, pos + 1), newId, ...others.slice(pos + 1)];
            await reorderScenes(sc.chapterId, newOrder);
          },
        });

        items.push({
          label: 'New from Template',
          submenu: newFromTemplateSubmenu(id),
        });

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
    [
      chapters,
      scenes,
      createChapter,
      createScene,
      trashChapter,
      trashScene,
      setSplitScene,
      setSplitEditor,
      moveScene,
      reorderChapters,
      reorderScenes,
      updateScene,
      sceneTemplateSubmenu,
      newFromTemplateSubmenu,
    ]
  );

  const handleRenameSubmit = () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    if (editingId.type === 'chapter') {
      updateChapter(editingId.id, { title: editText.trim() });
    } else if (editingId.type === 'note') {
      updateNote(editingId.id, { title: editText.trim() });
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

      <div className={styles.binderMatterActions}>
        <button
          type="button"
          className={styles.addBtn}
          onClick={async () => {
            const orders = chapters.map((c) => c.order);
            const minOrder = orders.length ? Math.min(0, ...orders) - 1 : -1;
            await createChapter('Front Matter', minOrder, 'Front Matter');
          }}
          data-tooltip="Add front matter section"
        >
          + Front Matter
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
          {binderRows.map((row, rowIdx) =>
            row.type === 'divider' ? (
              <div key={`div-${row.label}-${rowIdx}`} className={styles.sectionDivider}>
                {row.label}
              </div>
            ) : (() => {
              const chapter = row.chapter;
              const chapterScenes = scenes
                .filter((s) => s.chapterId === chapter.id)
                .filter(
                  (s) =>
                    !binderFilter.trim() || s.title.toLowerCase().includes(binderFilter.toLowerCase())
                )
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
                    <span className={styles.chapterTitle} title={chapter.title}>
                      {chapter.title}
                    </span>
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
                              <span className={styles.sceneTitle} title={scene.title}>
                                {scene.title}
                              </span>
                            )}
                            {scene.notes?.trim() ? (
                              <span className={styles.notesIcon} title="Has notes" aria-hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <line x1="8" y1="13" x2="16" y2="13" />
                                  <line x1="8" y1="17" x2="12" y2="17" />
                                </svg>
                              </span>
                            ) : null}
                            <span
                              className={styles.statusDot}
                              style={{ background: BINDER_STATUS_COLOR[scene.status] }}
                              title={scene.status}
                              aria-hidden
                            />
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
            })()
          )}
        </AnimatePresence>
        <div className={styles.binderMatterActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={async () => {
              const orders = chapters.map((c) => c.order);
              const maxOrder = orders.length ? Math.max(0, ...orders) + 1 : 1;
              await createChapter('Back Matter', maxOrder, 'Back Matter');
            }}
            data-tooltip="Add back matter section"
          >
            + Back Matter
          </button>
        </div>
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
            <div
              key={idea.id}
              className={styles.ideaItem}
              onClick={() => setRightPanel('constellation')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setRightPanel('constellation');
                }
              }}
            >
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
                    {
                      label: 'Rename',
                      action: () => {
                        setEditingId({ type: 'note', id: note.id! });
                        setEditText(note.title);
                      },
                    },
                    { label: 'Delete Note', action: () => deleteNote(note.id!), danger: true },
                  ],
                });
              }}
              style={{ borderLeftColor: 'var(--accent-primary)', paddingLeft: '12px' }}
            >
              {editingId?.type === 'note' && editingId.id === note.id ? (
                <input
                  className={styles.renameInput}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  autoFocus
                  onClick={(ev) => ev.stopPropagation()}
                  style={{ fontStyle: 'italic' }}
                />
              ) : (
                <span className={styles.sceneTitle} style={{ fontStyle: 'italic' }} title={note.title}>
                  {note.title}
                </span>
              )}
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
