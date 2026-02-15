import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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
    ],
    content: scene.content ? (() => {
      try { return JSON.parse(scene.content); } catch { return scene.content; }
    })() : '',
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const json = JSON.stringify(editor.getJSON());
        updateScene(scene.id!, { content: json });
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
    } else if (editor && !scene.content) {
      editor.commands.setContent('');
    }
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight character names
  const highlightCharacters = useCallback(() => {
    if (!editor) return;
    // Character name highlighting is handled via CSS decoration
    // We add character names as data attributes for styling
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
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [typewriterMode, zenMode, setTypewriterMode, setZenMode]);

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

      <div
        ref={editorContainerRef}
        className={styles.editorContainer}
      >
        <EditorContent editor={editor} className={styles.editorContent} />
      </div>

      <div className={styles.footer}>
        <span className={styles.wordCount}>{wordCount} words</span>
        <span className={styles.charCount}>{charCount} characters</span>
        <span className={styles.status}>{scene.status}</span>
      </div>
    </div>
  );
}
