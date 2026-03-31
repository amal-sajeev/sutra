import { useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './Scrivenings.module.css';

interface SceneBlock {
  id: number;
  title: string;
  chapterTitle: string;
  content: string;
}

function SceneSection({ block }: { block: SceneBlock }) {
  const updateScene = useProjectStore(s => s.updateScene);
  const editorFontFamily = useUIStore(s => s.editorFontFamily);
  const editorFontSize = useUIStore(s => s.editorFontSize);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Begin writing...' }),
      CharacterCount,
    ],
    content: block.content ? (() => {
      try { return JSON.parse(block.content); } catch { return block.content; }
    })() : '',
    onUpdate: ({ editor: ed }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateScene(block.id, { content: JSON.stringify(ed.getJSON()) });
      }, 600);
    },
  });

  const wordCount = editor?.storage.characterCount?.words() || 0;

  return (
    <div className={styles.sceneBlock}>
      <div className={styles.sceneHeader}>
        <span className={styles.sceneTitle}>{block.title}</span>
        <span className={styles.sceneMeta}>{block.chapterTitle} · {wordCount} words</span>
      </div>
      <div
        className={styles.sceneEditor}
        style={{ fontFamily: editorFontFamily, fontSize: `${editorFontSize}px` }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default function Scrivenings() {
  const chapters = useProjectStore(s => s.chapters);
  const scenes = useProjectStore(s => s.scenes);
  const [filter, setFilter] = useState<number | 'all'>('all');

  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

  const blocks = useMemo<SceneBlock[]>(() => {
    const out: SceneBlock[] = [];
    const chMap = new Map(chapters.map(c => [c.id!, c.title]));
    const sorted = [...scenes].sort((a, b) => a.order - b.order);
    const filtered = filter === 'all' ? sorted : sorted.filter(s => s.chapterId === filter);

    const byChapter = new Map<number, typeof filtered>();
    for (const s of filtered) {
      const arr = byChapter.get(s.chapterId) || [];
      arr.push(s);
      byChapter.set(s.chapterId, arr);
    }

    for (const ch of sortedChapters) {
      const ss = byChapter.get(ch.id!);
      if (!ss) continue;
      for (const s of ss) {
        out.push({
          id: s.id!,
          title: s.title,
          chapterTitle: chMap.get(s.chapterId) || '',
          content: s.content,
        });
      }
    }
    return out;
  }, [scenes, chapters, sortedChapters, filter]);

  const totalWords = useMemo(() => {
    let n = 0;
    for (const b of blocks) {
      if (!b.content) continue;
      try {
        const doc = JSON.parse(b.content);
        n += cntW(doc);
      } catch { /* skip */ }
    }
    return n;
  }, [blocks]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Scrivenings</h2>
        <select
          className={styles.filterSelect}
          value={filter === 'all' ? 'all' : String(filter)}
          onChange={e => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">Full Manuscript</option>
          {sortedChapters.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <span className={styles.wordCount}>{totalWords.toLocaleString()} words</span>
      </div>

      <div className={styles.scrollArea}>
        {blocks.length === 0 ? (
          <div className={styles.empty}>No scenes to display.</div>
        ) : (
          blocks.map((block, i) => (
            <div key={block.id}>
              {i > 0 && <div className={styles.divider}><span>✦</span></div>}
              <SceneSection block={block} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function cntW(node: Record<string, unknown>): number {
  if (node.type === 'text') return ((node.text as string) || '').split(/\s+/).filter(Boolean).length;
  let n = 0;
  if (Array.isArray(node.content)) for (const c of node.content) n += cntW(c as Record<string, unknown>);
  return n;
}
