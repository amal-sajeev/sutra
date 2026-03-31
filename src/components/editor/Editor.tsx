import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { recordWritingHistory } from '../../db/operations';
import EditorToolbar from './EditorToolbar';
import FindReplace from './FindReplace';
import type { Scene } from '../../types';
import styles from './Editor.module.css';

interface EditorProps {
  scene: Scene;
}

export default function Editor({ scene }: EditorProps) {
  const updateScene = useProjectStore((s) => s.updateScene);
  const characters = useProjectStore((s) => s.characters);
  const typewriterMode = useUIStore((s) => s.typewriterMode);
  const zenMode = useUIStore((s) => s.zenMode);
  const setTypewriterMode = useUIStore((s) => s.setTypewriterMode);
  const setZenMode = useUIStore((s) => s.setZenMode);
  const editorFontFamily = useUIStore((s) => s.editorFontFamily);
  const editorFontSize = useUIStore((s) => s.editorFontSize);
  const wordCountGoal = useUIStore((s) => s.wordCountGoal);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [synopsisText, setSynopsisText] = useState(scene.synopsis || '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const lastWordCountRef = useRef<number>(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Begin writing...',
      }),
      CharacterCount,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: scene.content ? (() => {
      try { return JSON.parse(scene.content); } catch { return scene.content; }
    })() : '',
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      saveTimerRef.current = setTimeout(() => {
        const json = JSON.stringify(editor.getJSON());
        updateScene(scene.id!, { content: json });

        const currentWords = editor.storage.characterCount?.words() || 0;
        const delta = currentWords - lastWordCountRef.current;
        if (delta > 0 && scene.projectId) {
          recordWritingHistory(scene.projectId, delta, currentWords).catch(() => {});
        }
        lastWordCountRef.current = currentWords;

        setSaveState('saved');
        if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current);
        saveIndicatorRef.current = setTimeout(() => setSaveState('idle'), 2000);
      }, 500);

      // Typewriter mode: scroll current line to center
      if (typewriterMode && editorContainerRef.current) {
        const { view } = editor;
        const coords = view.coordsAtPos(view.state.selection.from);
        const container = editorContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height / 2;
        const offset = coords.top - centerY;
        container.scrollBy({ top: offset, behavior: 'smooth' });
      }
    },
    editorProps: {
      attributes: {
        class: `${styles.prosemirror} ${zenMode ? styles.zenActive : ''}`,
        spellcheck: 'true',
        style: `font-family: ${editorFontFamily}; font-size: ${editorFontSize}px;`,
      },
    },
  });

  // Update content when scene changes
  useEffect(() => {
    if (editor && scene.content) {
      const currentJson = JSON.stringify(editor.getJSON());
      if (currentJson !== scene.content) {
        try {
          editor.commands.setContent(JSON.parse(scene.content));
        } catch {
          editor.commands.setContent(scene.content);
        }
      }
      lastWordCountRef.current = editor.storage.characterCount?.words() || 0;
    } else if (editor && !scene.content) {
      editor.commands.setContent('');
      lastWordCountRef.current = 0;
    }
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevSceneIdRef = useRef(scene.id);
  if (prevSceneIdRef.current !== scene.id) {
    prevSceneIdRef.current = scene.id;
    setSynopsisText(scene.synopsis || '');
  }

  const handleSynopsisBlur = () => {
    updateScene(scene.id!, { synopsis: synopsisText });
  };

  // Highlight character names using TipTap search/decorations
  const highlightCharacters = useCallback(() => {
    if (!editor || characters.length === 0) return;
    const { doc } = editor.state;
    const characterNames = characters.map((c) => c.name).filter(Boolean);
    if (characterNames.length === 0) return;

    const decorations: Array<{ from: number; to: number; color: string }> = [];
    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        for (const char of characters) {
          if (!char.name) continue;
          const regex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let match;
          while ((match = regex.exec(node.text)) !== null) {
            decorations.push({
              from: pos + match.index,
              to: pos + match.index + match[0].length,
              color: char.color,
            });
          }
        }
      }
    });

    const editorEl = editor.view.dom;
    editorEl.setAttribute('data-character-count', String(decorations.length));
  }, [editor, characters]);

  useEffect(() => {
    highlightCharacters();
  }, [highlightCharacters]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTypewriterMode(!typewriterMode);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        setZenMode(!zenMode);
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setFindReplaceOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [typewriterMode, zenMode, setTypewriterMode, setZenMode]);

  const statusCycle: Array<'draft' | 'revision' | 'final'> = ['draft', 'revision', 'final'];
  const cycleStatus = () => {
    const currentIdx = statusCycle.indexOf(scene.status);
    const next = statusCycle[(currentIdx + 1) % statusCycle.length];
    updateScene(scene.id!, { status: next });
  };

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div className={`${styles.editorWrapper} ${zenMode ? styles.zen : ''}`}>
      <div className={styles.sceneHeader}>
        <span className={styles.sceneTitle}>{scene.title}</span>
        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${typewriterMode ? styles.controlActive : ''}`}
            onClick={() => setTypewriterMode(!typewriterMode)}
            data-tooltip="Keeps the current line centered as you type (Ctrl+Shift+T)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M12 8v8M9 20h6" />
              <path d="M6 12h12" opacity="0.4" />
            </svg>
            <span>Typewriter</span>
          </button>
          <button
            className={`${styles.controlBtn} ${zenMode ? styles.controlActive : ''}`}
            onClick={() => setZenMode(!zenMode)}
            data-tooltip="Hides everything except the editor (Ctrl+Shift+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Focus</span>
          </button>
        </div>
      </div>

      <EditorToolbar editor={editor} />
      <FindReplace editor={editor} isOpen={findReplaceOpen} onClose={() => setFindReplaceOpen(false)} />

      <div className={styles.synopsisArea}>
        <button className={styles.synopsisToggle} onClick={() => setSynopsisOpen(!synopsisOpen)}>
          {synopsisOpen ? '▾ Synopsis' : '▸ Synopsis'}
        </button>
        {synopsisOpen && (
          <textarea
            className={styles.synopsisInput}
            value={synopsisText}
            onChange={(e) => setSynopsisText(e.target.value)}
            onBlur={handleSynopsisBlur}
            placeholder="Brief summary of this scene..."
            rows={2}
          />
        )}
      </div>

      <div
        ref={editorContainerRef}
        className={styles.editorContainer}
      >
        <EditorContent editor={editor} className={styles.editorContent} />
      </div>

      <div className={styles.footer}>
        {saveState !== 'idle' && (
          <span className={`${styles.saveIndicator} ${saveState === 'saving' ? styles.saving : styles.saved}`}>
            {saveState === 'saving' ? '● Saving...' : '✓ Saved'}
          </span>
        )}
        <span className={styles.wordCount}>
          {wordCount} words
          {wordCountGoal > 0 && (
            <span className={styles.goalProgress}> / {wordCountGoal} ({Math.min(100, Math.round((wordCount / wordCountGoal) * 100))}%)</span>
          )}
        </span>
        <span className={styles.charCount}>{charCount} characters</span>
        <button
          className={styles.statusBtn}
          onClick={cycleStatus}
          data-tooltip="Click to change status"
        >
          {scene.status}
        </button>
      </div>
    </div>
  );
}
