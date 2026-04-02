import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { useToastStore } from '../../stores/toastStore';
import { importDocx, importMarkdown, importPlainText, htmlToTiptapJson, type ImportResult } from '../../utils/import';
import Modal from '../ui/Modal';
import styles from './ImportDialog.module.css';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const addToast = useToastStore((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setImporting(true);
      try {
        let result: ImportResult;
        if (file.name.endsWith('.txt')) {
          result = await importPlainText(file);
        } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          result = await importMarkdown(file);
        } else {
          result = await importDocx(file);
        }
        setPreview(result);
      } catch (err) {
        addToast(`Import failed: ${(err as Error).message}`, 'error');
        console.error(err);
      } finally {
        setImporting(false);
      }
    },
    [addToast],
  );

  const handleImport = useCallback(async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const projectId = await createProject(preview.title);
      await useProjectStore.getState().loadProject(projectId);
      const store = useProjectStore.getState();

      let totalScenes = 0;
      for (const ch of preview.chapters) {
        const chId = await store.createChapter(ch.title);
        for (const sc of ch.scenes) {
          const scId = await store.createScene(chId, sc.title);
          const content = htmlToTiptapJson(sc.html);
          if (content) {
            await store.updateScene(scId, { content });
          }
          totalScenes++;
        }
      }

      addToast(
        `Imported ${preview.chapters.length} chapter${preview.chapters.length !== 1 ? 's' : ''}, ${totalScenes} scene${totalScenes !== 1 ? 's' : ''}${preview.imageCount > 0 ? `, ${preview.imageCount} images detected` : ''}`,
        'success',
      );
      onClose();
      navigate(`/project/${projectId}`);
    } catch (err) {
      addToast(`Import failed: ${(err as Error).message}`, 'error');
      console.error(err);
    } finally {
      setImporting(false);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [preview, createProject, addToast, onClose, navigate]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Document" width="520px">
      <div className={styles.container}>
        {!preview ? (
          <>
            <p className={styles.info}>
              Import a Word document (.docx), Markdown (.md), or plain text (.txt). Headings and scene breaks map to chapters and scenes.
            </p>
            <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>{importing ? 'Processing...' : 'Click to select a file'}</span>
              <span className={styles.formats}>.docx, .md, .txt</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.md,.markdown,.txt"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </>
        ) : (
          <>
            <div className={styles.previewHeader}>
              <h3>{preview.title}</h3>
              <span className={styles.fileName}>{fileName}</span>
            </div>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNum}>{preview.chapters.length}</span>
                <span>chapter{preview.chapters.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNum}>
                  {preview.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0)}
                </span>
                <span>scenes</span>
              </div>
              {preview.imageCount > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryNum}>{preview.imageCount}</span>
                  <span>images</span>
                </div>
              )}
            </div>
            <div className={styles.previewList}>
              {preview.chapters.map((ch, i) => (
                <div key={i} className={styles.previewChapter}>
                  <span className={styles.previewChapterTitle}>{ch.title}</span>
                  <span className={styles.previewSceneCount}>{ch.scenes.length} scenes</span>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                Back
              </button>
              <button className={styles.importBtn} onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : 'Import as New Project'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
