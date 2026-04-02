import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import Modal from '../ui/Modal';
import styles from './ProjectSearch.module.css';

interface ProjectSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  sceneId: number;
  sceneTitle: string;
  chapterTitle: string;
  excerpt: string;
  matchCount: number;
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';
  let t = '';
  if (Array.isArray(node.content)) {
    for (const c of node.content) t += extractText(c as Record<string, unknown>) + ' ';
  }
  return t;
}

function getExcerpt(text: string, query: string, radius = 60): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let excerpt = '';
  if (start > 0) excerpt += '...';
  excerpt += text.slice(start, end);
  if (end < text.length) excerpt += '...';
  return excerpt;
}

function highlightMatches(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let lastIndex = 0;
  let idx = lower.indexOf(q);
  let key = 0;
  while (idx !== -1) {
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    parts.push(<mark key={key++}>{text.slice(idx, idx + query.length)}</mark>);
    lastIndex = idx + query.length;
    idx = lower.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

export default function ProjectSearch({ isOpen, onClose }: ProjectSearchProps) {
  const scenes = useProjectStore(s => s.scenes);
  const chapters = useProjectStore(s => s.chapters);
  const setActiveScene = useProjectStore(s => s.setActiveScene);
  const setCenterView = useUIStore(s => s.setCenterView);
  const [query, setQuery] = useState('');
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(['draft', 'revision', 'final']));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const chapterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of chapters) if (c.id) m.set(c.id, c.title);
    return m;
  }, [chapters]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    for (const scene of scenes) {
      if (chapterFilter !== 'all' && scene.chapterId !== chapterFilter) continue;
      if (!statusFilter.has(scene.status)) continue;
      let text = scene.title;
      if (scene.synopsis) text += ' ' + scene.synopsis;
      if (scene.content) {
        try {
          text += ' ' + extractText(JSON.parse(scene.content));
        } catch { /* skip */ }
      }
      const lower = text.toLowerCase();
      let count = 0;
      let idx = 0;
      while ((idx = lower.indexOf(q, idx)) !== -1) { count++; idx += q.length; }
      if (count > 0) {
        out.push({
          sceneId: scene.id!,
          sceneTitle: scene.title,
          chapterTitle: chapterMap.get(scene.chapterId) || '',
          excerpt: getExcerpt(text, query),
          matchCount: count,
        });
      }
    }
    out.sort((a, b) => b.matchCount - a.matchCount);
    return out;
  }, [query, scenes, chapterMap, chapterFilter, statusFilter]);

  const handleSelect = useCallback((sceneId: number) => {
    setActiveScene(sceneId);
    setCenterView('editor');
    onClose();
  }, [setActiveScene, setCenterView, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Project" width="600px">
      <div className={styles.container}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search across all scenes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>×</button>
          )}
        </div>

        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={chapterFilter === 'all' ? 'all' : String(chapterFilter)}
            onChange={e => setChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All chapters</option>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <div className={styles.statusFilters}>
            {['draft', 'revision', 'final'].map(s => (
              <label key={s} className={styles.statusCheck}>
                <input
                  type="checkbox"
                  checked={statusFilter.has(s)}
                  onChange={() => {
                    const next = new Set(statusFilter);
                    if (next.has(s)) next.delete(s);
                    else next.add(s);
                    setStatusFilter(next);
                  }}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        {query.length >= 2 && (
          <div className={styles.meta}>
            {results.length} result{results.length !== 1 ? 's' : ''} in {scenes.length} scenes
          </div>
        )}

        <div className={styles.results}>
          {results.map(r => (
            <button
              key={r.sceneId}
              className={styles.result}
              onClick={() => handleSelect(r.sceneId)}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>{r.sceneTitle}</span>
                <span className={styles.resultChapter}>{r.chapterTitle}</span>
              </div>
              <p className={styles.resultExcerpt}>{highlightMatches(r.excerpt, query)}</p>
              <span className={styles.matchBadge}>{r.matchCount} match{r.matchCount !== 1 ? 'es' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
