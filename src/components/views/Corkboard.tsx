import { useState, useCallback, useRef, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import styles from './Corkboard.module.css';

function wordCount(content: string): number {
  if (!content) return 0;
  try {
    const doc = JSON.parse(content);
    return extractWords(doc);
  } catch {
    return content.split(/\s+/).filter(Boolean).length;
  }
}

function extractWords(node: Record<string, unknown>): number {
  if (node.type === 'text') return ((node.text as string) || '').split(/\s+/).filter(Boolean).length;
  let n = 0;
  if (Array.isArray(node.content)) for (const c of node.content) n += extractWords(c as Record<string, unknown>);
  return n;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-tertiary)',
  revision: '#d4a745',
  final: '#4aa86a',
};

export default function Corkboard() {
  const chapters = useProjectStore(s => s.chapters);
  const scenes = useProjectStore(s => s.scenes);
  const setActiveScene = useProjectStore(s => s.setActiveScene);
  const updateScene = useProjectStore(s => s.updateScene);
  const reorderScenes = useProjectStore(s => s.reorderScenes);
  const activeProject = useProjectStore(s => s.activeProject);

  const [filter, setFilter] = useState<number | 'all'>('all');
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [editSynopsis, setEditSynopsis] = useState<number | null>(null);
  const [synopsisText, setSynopsisText] = useState('');
  const dragItem = useRef<{ id: number; chapterId: number } | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

  const filteredScenes = useMemo(() => {
    const sorted = [...scenes].sort((a, b) => a.order - b.order);
    if (filter === 'all') return sorted;
    return sorted.filter(s => s.chapterId === filter);
  }, [scenes, filter]);

  const chapterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of chapters) if (c.id) m.set(c.id, c.title);
    return m;
  }, [chapters]);

  const handleDragStart = useCallback((id: number, chapterId: number) => {
    dragItem.current = { id, chapterId };
  }, []);

  const handleDrop = useCallback((targetId: number, targetChapterId: number) => {
    if (!dragItem.current || dragItem.current.id === targetId) { setDragOver(null); return; }
    const src = dragItem.current;
    if (src.chapterId === targetChapterId) {
      const chScenes = scenes.filter(s => s.chapterId === targetChapterId).sort((a, b) => a.order - b.order);
      const ids = chScenes.map(s => s.id!);
      const fromIdx = ids.indexOf(src.id);
      const toIdx = ids.indexOf(targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, src.id);
        reorderScenes(targetChapterId, ids);
      }
    }
    dragItem.current = null;
    setDragOver(null);
  }, [scenes, reorderScenes]);

  const handleSynopsisSave = useCallback((sceneId: number) => {
    updateScene(sceneId, { synopsis: synopsisText });
    setEditSynopsis(null);
  }, [synopsisText, updateScene]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Corkboard</h2>
        <div className={styles.headerRight}>
          <div className={styles.headerControlsRow}>
            <select
              className={styles.filterSelect}
              value={filter === 'all' ? 'all' : String(filter)}
              onChange={e => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All chapters</option>
              {sortedChapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <div className={styles.sizeToggle}>
              <button
                type="button"
                className={`${styles.sizeBtn} ${cardSize === 'small' ? styles.active : ''}`}
                onClick={() => setCardSize('small')}
                title="Small cards"
              >
                S
              </button>
              <button
                type="button"
                className={`${styles.sizeBtn} ${cardSize === 'medium' ? styles.active : ''}`}
                onClick={() => setCardSize('medium')}
                title="Medium cards"
              >
                M
              </button>
              <button
                type="button"
                className={`${styles.sizeBtn} ${cardSize === 'large' ? styles.active : ''}`}
                onClick={() => setCardSize('large')}
                title="Large cards"
              >
                L
              </button>
            </div>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS.draft }} />
              Draft
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS.revision }} />
              Revision
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS.final }} />
              Final
            </span>
          </div>
        </div>
      </div>

      {activeProject && filteredScenes.length === 0 && (
        <div className={styles.empty}>
          <p>No scenes yet. Create scenes in the sidebar to see them here.</p>
        </div>
      )}

      <div className={`${styles.board} ${styles[`board_${cardSize}`]}`}>
        {filteredScenes.map(scene => {
          const wc = wordCount(scene.content);
          const labelColor = scene.label
            ? activeProject?.settings?.labels?.find(l => l.name === scene.label)?.color
            : undefined;
          return (
            <div
              key={scene.id}
              className={`${styles.card} ${dragOver === scene.id ? styles.cardDragOver : ''}`}
              draggable
              onDragStart={() => handleDragStart(scene.id!, scene.chapterId)}
              onDragOver={e => { e.preventDefault(); setDragOver(scene.id!); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(scene.id!, scene.chapterId)}
              style={labelColor ? { borderTopColor: labelColor } : undefined}
            >
              <div className={styles.cardHeader}>
                <span
                  className={styles.cardTitle}
                  onClick={() => setActiveScene(scene.id!)}
                  title="Click to edit"
                >
                  {scene.title}
                </span>
                <span
                  className={styles.statusDot}
                  style={{ background: STATUS_COLORS[scene.status] || STATUS_COLORS.draft }}
                  title={scene.status}
                />
              </div>

              {editSynopsis === scene.id ? (
                <textarea
                  className={styles.synopsisEdit}
                  value={synopsisText}
                  onChange={e => setSynopsisText(e.target.value)}
                  onBlur={() => handleSynopsisSave(scene.id!)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSynopsisSave(scene.id!); } }}
                  placeholder="Write a synopsis..."
                  autoFocus
                />
              ) : (
                <p
                  className={styles.synopsis}
                  onClick={() => { setEditSynopsis(scene.id!); setSynopsisText(scene.synopsis || ''); }}
                  title="Click to edit synopsis"
                >
                  {scene.synopsis || 'No synopsis'}
                </p>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.chapterTag}>{chapterMap.get(scene.chapterId) || ''}</span>
                <span className={styles.wordCount}>{wc.toLocaleString()} w</span>
              </div>

              {scene.tags && scene.tags.length > 0 && (
                <div className={styles.tags}>
                  {scene.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
