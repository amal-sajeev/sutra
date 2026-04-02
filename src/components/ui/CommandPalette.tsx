import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './CommandPalette.module.css';

interface PaletteItem {
  type: 'scene' | 'character' | 'note' | 'chapter';
  id: number;
  title: string;
  subtitle?: string;
  icon: string;
}

/** True if every character of needle appears in order in haystack (case-insensitive). */
function fuzzySubsequence(haystack: string, needle: string): boolean {
  if (!needle) return true;
  let i = 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  for (let j = 0; j < h.length && i < n.length; j++) {
    if (h[j] === n[i]) i++;
  }
  return i === n.length;
}

function itemMatchesQuery(item: PaletteItem, q: string): boolean {
  const t = item.title.toLowerCase();
  const sub = item.subtitle?.toLowerCase() ?? '';
  return (
    t.includes(q) ||
    sub.includes(q) ||
    fuzzySubsequence(item.title, q) ||
    (item.subtitle ? fuzzySubsequence(item.subtitle, q) : false)
  );
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const scenes = useProjectStore((s) => s.scenes);
  const chapters = useProjectStore((s) => s.chapters);
  const characters = useProjectStore((s) => s.characters);
  const noteDocuments = useProjectStore((s) => s.noteDocuments);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setActiveNote = useProjectStore((s) => s.setActiveNote);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setCenterView = useUIStore((s) => s.setCenterView);
  const setRightPanel = useUIStore((s) => s.setRightPanel);

  const chapterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of chapters) if (c.id) m.set(c.id, c.title);
    return m;
  }, [chapters]);

  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    for (const s of scenes) {
      items.push({
        type: 'scene',
        id: s.id!,
        title: s.title,
        subtitle: chapterMap.get(s.chapterId),
        icon: '✎',
      });
    }
    for (const c of characters) {
      items.push({
        type: 'character',
        id: c.id!,
        title: c.name,
        subtitle: c.role || undefined,
        icon: '◎',
      });
    }
    for (const n of noteDocuments) {
      items.push({
        type: 'note',
        id: n.id!,
        title: n.title,
        subtitle: 'Note',
        icon: '📝',
      });
    }
    return items;
  }, [scenes, characters, noteDocuments, chapterMap]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 15);
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => itemMatchesQuery(item, q)).slice(0, 15);
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      switch (item.type) {
        case 'scene':
          void setActiveScene(item.id);
          setCenterView('editor');
          break;
        case 'note':
          void setActiveNote(item.id);
          setCenterView('editor');
          break;
        case 'character':
          setRightPanel('characters');
          break;
        case 'chapter':
          break;
      }
      setIsOpen(false);
      setQuery('');
    },
    [setActiveScene, setActiveNote, setCenterView, setRightPanel]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (activeProjectId) {
          setIsOpen((prev) => !prev);
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, activeProjectId]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    const maxIdx = Math.max(0, filtered.length - 1);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, maxIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      />
      <div className={styles.palette}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search scenes, characters, notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.results}>
          {filtered.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className={`${styles.item} ${i === selectedIndex ? styles.itemActive : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className={styles.itemIcon}>{item.icon}</span>
              <span className={styles.itemTitle}>{item.title}</span>
              {item.subtitle && <span className={styles.itemSub}>{item.subtitle}</span>}
              <span className={styles.itemType}>{item.type}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className={styles.empty}>No matches</div>}
        </div>
        <div className={styles.footer}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </>
  );
}
