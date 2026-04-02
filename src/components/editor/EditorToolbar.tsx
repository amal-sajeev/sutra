import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { useProjectStore } from '../../stores/projectStore';
import { createAsset } from '../../db/operations';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [, setSelectionTick] = useState(0);
  const commentRangeRef = useRef<{ from: number; to: number } | null>(null);
  const createComment = useProjectStore((s) => s.createComment);
  const activeScene = useProjectStore((s) => s.activeScene);
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionRound, setRevisionRound] = useState(1);

  useEffect(() => {
    if (!activeProject) return;
    setRevisionMode(activeProject.settings?.revisionMode ?? false);
    setRevisionRound(activeProject.settings?.revisionRound ?? 1);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!editor) return;
    const sync = () => setSelectionTick((n) => n + 1);
    editor.on('selectionUpdate', sync);
    editor.on('transaction', sync);
    return () => {
      editor.off('selectionUpdate', sync);
      editor.off('transaction', sync);
    };
  }, [editor]);

  if (!editor) return null;

  const selectionEmpty = editor.state.selection.empty;

  const handleAddComment = async () => {
    const range = commentRangeRef.current;
    if (!range || !commentText.trim() || !activeScene?.id || !activeScene.projectId) return;
    const { from, to } = range;
    const selectedText = editor.state.doc.textBetween(from, to);
    const newId = await createComment(activeScene.id, activeScene.projectId, selectedText, commentText.trim());
    editor.chain().focus().setTextSelection({ from, to }).setComment(String(newId)).run();
    commentRangeRef.current = null;
    setCommentText('');
    setShowCommentInput(false);
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      void (async () => {
        const file = input.files?.[0];
        if (!file || !editor) return;
        const activeProjectId = useProjectStore.getState().activeProjectId;
        if (!activeProjectId) return;

        const assetId = await createAsset({
          projectId: activeProjectId,
          filename: file.name,
          mimeType: file.type,
          data: file,
          createdAt: Date.now(),
        });

        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);
        editor.chain().focus().setImage({ src: url, alt: file.name, title: `asset:${assetId}` }).run();
      })();
    };
    input.click();
  };

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
      <div className={styles.group}>
        <button
          className={`${styles.btn} ${editor.isActive('bold') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-tooltip="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('italic') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-tooltip="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('strike') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-tooltip="Strikethrough (Ctrl+Shift+X)"
          aria-label="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('code') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-tooltip="Inline code (Ctrl+E)"
          aria-label="Inline code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={`${styles.btn} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-tooltip="Heading 1"
          aria-label="Heading 1"
        >
          H1
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-tooltip="Heading 2"
          aria-label="Heading 2"
        >
          H2
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-tooltip="Heading 3"
          aria-label="Heading 3"
        >
          H3
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={`${styles.btn} ${editor.isActive('bulletList') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-tooltip="Bullet list"
          aria-label="Bullet list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1" fill="currentColor" />
            <circle cx="3" cy="12" r="1" fill="currentColor" />
            <circle cx="3" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('orderedList') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-tooltip="Numbered list"
          aria-label="Numbered list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="1" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
            <text x="1" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">2</text>
            <text x="1" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">3</text>
          </svg>
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('taskList') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          data-tooltip="Task List"
          aria-label="Task list"
        >
          ☑
        </button>
        <button
          className={`${styles.btn} ${editor.isActive('blockquote') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-tooltip="Blockquote"
          aria-label="Blockquote"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </button>
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={`${styles.btn} ${editor.isActive('link') ? styles.active : ''}`}
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              const previousUrl = editor.getAttributes('link').href || '';
              setLinkUrl(previousUrl);
              setShowLinkInput(true);
            }
          }}
          data-tooltip="Link"
          aria-label="Link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          data-tooltip="Horizontal rule"
          aria-label="Horizontal rule"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={handleInsertImage}
          data-tooltip="Insert image"
          aria-label="Insert image"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
      </div>

      <div className={styles.separator} />
      <button
        type="button"
        className={styles.btn}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        data-tooltip="Insert Table"
        aria-label="Insert table"
      >
        ▦
      </button>
      {editor.isActive('table') && (
        <>
          <button
            type="button"
            className={styles.btn}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            data-tooltip="Add Column"
            aria-label="Add column"
          >
            ‖+
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            data-tooltip="Add Row"
            aria-label="Add row"
          >
            ≡+
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            data-tooltip="Delete Column"
            aria-label="Delete column"
          >
            ‖×
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => editor.chain().focus().deleteRow().run()}
            data-tooltip="Delete Row"
            aria-label="Delete row"
          >
            ≡×
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => editor.chain().focus().deleteTable().run()}
            data-tooltip="Delete Table"
            aria-label="Delete table"
          >
            ▦×
          </button>
        </>
      )}

      <div className={styles.separator} />

      <div className={`${styles.group} ${styles.commentWrap}`}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            if (editor.state.selection.empty) return;
            commentRangeRef.current = {
              from: editor.state.selection.from,
              to: editor.state.selection.to,
            };
            setShowCommentInput(true);
          }}
          data-tooltip="Add Comment"
          aria-label="Add comment"
          disabled={selectionEmpty}
        >
          💬
        </button>
        {showCommentInput && (
          <div className={styles.commentPopover}>
            <input
              className={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  e.preventDefault();
                  void handleAddComment();
                }
                if (e.key === 'Escape') {
                  setShowCommentInput(false);
                  setCommentText('');
                  commentRangeRef.current = null;
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className={styles.commentSubmit}
              onClick={() => void handleAddComment()}
              disabled={!commentText.trim()}
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-tooltip="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-tooltip="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {activeProject?.id != null && (
        <>
          <div className={styles.separator} />
          <button
            type="button"
            className={`${styles.btn} ${styles.revBtn} ${revisionMode ? styles.active : ''}`}
            onClick={() => {
              const next = !revisionMode;
              setRevisionMode(next);
              void updateProject(activeProject.id!, {
                settings: { ...activeProject.settings, revisionMode: next, revisionRound },
              });
            }}
            data-tooltip={revisionMode ? 'Exit Revision Mode' : 'Enter Revision Mode'}
            aria-label={revisionMode ? 'Exit revision mode' : 'Enter revision mode'}
          >
            Rev
          </button>
          {revisionMode && (
            <select
              className={styles.roundSelect}
              value={revisionRound}
              onChange={(e) => {
                const r = Number(e.target.value);
                setRevisionRound(r);
                void updateProject(activeProject.id!, {
                  settings: { ...activeProject.settings, revisionMode, revisionRound: r },
                });
              }}
              aria-label="Revision round"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  Round {r}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {showLinkInput && (
        <div className={styles.linkPopover}>
          <input
            type="url"
            className={styles.linkInput}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
            placeholder="https://..."
            autoFocus
          />
          <button className={styles.linkApply} onClick={handleSetLink}>Apply</button>
          <button className={styles.linkCancel} onClick={() => setShowLinkInput(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
