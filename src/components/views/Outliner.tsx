import { useMemo, useState, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import styles from './Outliner.module.css';

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

type SortKey = 'order' | 'title' | 'words' | 'status' | 'lastEdited';

export default function Outliner() {
  const chapters = useProjectStore(s => s.chapters);
  const scenes = useProjectStore(s => s.scenes);
  const setActiveScene = useProjectStore(s => s.setActiveScene);
  const activeProject = useProjectStore(s => s.activeProject);

  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<number | 'all'>('all');

  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

  const chapterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of chapters) if (c.id) m.set(c.id, c.title);
    return m;
  }, [chapters]);

  const scenesWithWc = useMemo(() => {
    let ss = [...scenes];
    if (filter !== 'all') ss = ss.filter(s => s.chapterId === filter);
    return ss.map(s => ({ ...s, wc: wordCount(s.content) }));
  }, [scenes, filter]);

  const sorted = useMemo(() => {
    const arr = [...scenesWithWc];
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case 'title': arr.sort((a, b) => a.title.localeCompare(b.title) * dir); break;
      case 'words': arr.sort((a, b) => (a.wc - b.wc) * dir); break;
      case 'status': arr.sort((a, b) => a.status.localeCompare(b.status) * dir); break;
      case 'lastEdited': arr.sort((a, b) => (a.lastEditedAt - b.lastEditedAt) * dir); break;
      default: arr.sort((a, b) => (a.order - b.order) * dir); break;
    }
    return arr;
  }, [scenesWithWc, sortKey, sortAsc]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }, [sortKey, sortAsc]);

  const indicator = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Outliner</h2>
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
      </div>

      {activeProject && sorted.length === 0 ? (
        <div className={styles.empty}><p>No scenes to display.</p></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className={styles.sortable}>Title{indicator('title')}</th>
                <th className={styles.synopsisCol}>Synopsis</th>
                <th onClick={() => handleSort('words')} className={styles.sortable}>Words{indicator('words')}</th>
                <th onClick={() => handleSort('status')} className={styles.sortable}>Status{indicator('status')}</th>
                <th>Chapter</th>
                <th onClick={() => handleSort('lastEdited')} className={styles.sortable}>Edited{indicator('lastEdited')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} className={styles.row} onClick={() => setActiveScene(s.id!)}>
                  <td className={styles.titleCell}>{s.title}</td>
                  <td className={styles.synopsisCell}>{s.synopsis || ''}</td>
                  <td className={styles.numCell}>{s.wc.toLocaleString()}</td>
                  <td><span className={`${styles.statusBadge} ${styles[s.status]}`}>{s.status}</span></td>
                  <td className={styles.chapterCell}>{chapterMap.get(s.chapterId) || ''}</td>
                  <td className={styles.dateCell}>{new Date(s.lastEditedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
