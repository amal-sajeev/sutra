import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import type { NoteDocument } from '../../types';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  note: NoteDocument;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const updateNote = useProjectStore(s => s.updateNote);
  const editorFontFamily = useUIStore(s => s.editorFontFamily);
  const editorFontSize = useUIStore(s => s.editorFontSize);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(note.title);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Write your notes...' }),
      CharacterCount,
    ],
    content: note.content ? (() => {
      try { return JSON.parse(note.content); } catch { return note.content; }
    })() : '',
    onUpdate: ({ editor: ed }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateNote(note.id!, { content: JSON.stringify(ed.getJSON()) });
      }, 500);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentContent = JSON.stringify(editor.getJSON());
    if (note.content && note.content !== currentContent) {
      try {
        editor.commands.setContent(JSON.parse(note.content));
      } catch {
        editor.commands.setContent(note.content);
      }
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleSave = useCallback(() => {
    if (titleText.trim() && titleText.trim() !== note.title) {
      updateNote(note.id!, { title: titleText.trim() });
    }
    setEditingTitle(false);
  }, [titleText, note, updateNote]);

  useEffect(() => {
    setTitleText(note.title);
  }, [note.title]);

  const wordCount = editor?.storage.characterCount?.words() || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>Research Note</span>
        {editingTitle ? (
          <input
            className={styles.titleInput}
            value={titleText}
            onChange={e => setTitleText(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); }}
            autoFocus
          />
        ) : (
          <h2
            className={styles.title}
            onDoubleClick={() => setEditingTitle(true)}
          >
            {note.title}
          </h2>
        )}
        <span className={styles.wordCount}>{wordCount.toLocaleString()} words</span>
      </div>
      <div
        className={styles.editorWrap}
        style={{ fontFamily: editorFontFamily, fontSize: `${editorFontSize}px` }}
      >
        <EditorContent editor={editor} className={styles.editor} />
      </div>
    </div>
  );
}
