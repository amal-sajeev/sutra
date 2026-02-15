import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import PanelMaxBtn from '../ui/PanelMaxBtn';
import styles from './SnapshotBrowser.module.css';

export default function SnapshotBrowser() {
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const activeScene = useProjectStore((s) => s.activeScene);
  const snapshots = useProjectStore((s) => s.snapshots);
  const loadSnapshots = useProjectStore((s) => s.loadSnapshots);
  const createSnapshot = useProjectStore((s) => s.createSnapshot);
  const deleteSnapshot = useProjectStore((s) => s.deleteSnapshot);
  const updateScene = useProjectStore((s) => s.updateScene);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [previewId, setPreviewId] = useState<number | null>(null);

  useEffect(() => {
    if (activeSceneId) {
      loadSnapshots(activeSceneId);
    }
  }, [activeSceneId, loadSnapshots]);

  const handleCreate = async () => {
    if (!name.trim() || !activeSceneId || !activeScene) return;
    await createSnapshot(activeSceneId, name.trim(), activeScene.content, note.trim() || undefined);
    setName('');
    setNote('');
    setShowCreate(false);
  };

  const handleRestore = async (content: string) => {
    if (!activeSceneId) return;
    if (confirm('Restore this snapshot? Your current content will be replaced.')) {
      await updateScene(activeSceneId, { content });
    }
  };

  if (!activeSceneId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.title}>Snapshots</span>
            <PanelMaxBtn />
          </div>
        </div>
        <div className={styles.empty}>
          <p>Select a scene to view its snapshots</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Snapshots</span>
          <PanelMaxBtn />
        </div>
        <button className={styles.saveBtn} onClick={() => setShowCreate(!showCreate)}>
          + Save
        </button>
      </div>

      {showCreate && (
        <motion.div className={styles.createForm} initial={{ height: 0 }} animate={{ height: 'auto' }}>
          <input
            className={styles.input}
            placeholder="Snapshot name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <input
            className={styles.input}
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className={styles.formBtn} onClick={handleCreate} disabled={!name.trim()}>
            Save Snapshot
          </button>
        </motion.div>
      )}

      <div className={styles.list}>
        <AnimatePresence>
          {snapshots.map((snapshot) => (
            <motion.div
              key={snapshot.id}
              className={`${styles.item} ${previewId === snapshot.id ? styles.itemActive : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={() => setPreviewId(previewId === snapshot.id ? null : snapshot.id!)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{snapshot.name}</span>
                <span className={styles.itemDate}>
                  {new Date(snapshot.createdAt).toLocaleDateString()}
                </span>
              </div>
              {snapshot.note && <p className={styles.itemNote}>{snapshot.note}</p>}

              {previewId === snapshot.id && (
                <motion.div
                  className={styles.itemActions}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <button
                    className={styles.restoreBtn}
                    onClick={(e) => { e.stopPropagation(); handleRestore(snapshot.content); }}
                  >
                    Restore
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); deleteSnapshot(snapshot.id!); setPreviewId(null); }}
                  >
                    Delete
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {snapshots.length === 0 && (
          <div className={styles.empty}>
            <p>No snapshots for this scene</p>
            <p className={styles.emptyHint}>Save a snapshot to preserve a version</p>
          </div>
        )}
      </div>
    </div>
  );
}
