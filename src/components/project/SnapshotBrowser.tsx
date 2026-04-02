import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import PanelMaxBtn from '../ui/PanelMaxBtn';
import ConfirmDialog from '../ui/ConfirmDialog';
import styles from './SnapshotBrowser.module.css';

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';
  let t = '';
  if (Array.isArray(node.content)) {
    for (const c of node.content) t += extractText(c as Record<string, unknown>);
    if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.type as string)) t += '\n';
  }
  return t;
}

function getText(jsonStr: string): string {
  if (!jsonStr) return '';
  try { return extractText(JSON.parse(jsonStr)); } catch { return jsonStr; }
}

function diffLines(oldText: string, newText: string): { type: 'same' | 'add' | 'remove'; text: string }[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: { type: 'same' | 'add' | 'remove'; text: string }[] = [];
  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: 'same', text: oldLines[oi] });
      oi++; ni++;
    } else if (oi < oldLines.length) {
      result.push({ type: 'remove', text: oldLines[oi] });
      oi++;
    } else {
      result.push({ type: 'add', text: newLines[ni] });
      ni++;
    }
  }
  return result;
}

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
  const [diffId, setDiffId] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ content: string; name: string } | null>(null);

  useEffect(() => {
    if (activeSceneId) loadSnapshots(activeSceneId);
  }, [activeSceneId, loadSnapshots]);

  const handleCreate = async () => {
    if (!name.trim() || !activeSceneId || !activeScene) return;
    await createSnapshot(activeSceneId, name.trim(), activeScene.content, note.trim() || undefined);
    setName(''); setNote(''); setShowCreate(false);
  };

  const handleRestore = async () => {
    if (!activeSceneId || !confirmRestore) return;
    await createSnapshot(activeSceneId, `Auto-save before restore`, activeScene?.content || '', 'Auto-saved before restoring snapshot');
    await updateScene(activeSceneId, { content: confirmRestore.content });
    setConfirmRestore(null);
  };

  const diffResult = useMemo(() => {
    if (!diffId || !activeScene) return null;
    const snap = snapshots.find(s => s.id === diffId);
    if (!snap) return null;
    const oldText = getText(snap.content);
    const newText = getText(activeScene.content);
    return diffLines(oldText, newText);
  }, [diffId, activeScene, snapshots]);

  if (!activeSceneId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.title}>Snapshots</span>
            <PanelMaxBtn />
          </div>
        </div>
        <div className={styles.empty}><p>Select a scene to view its snapshots</p></div>
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
        <button className={styles.saveBtn} onClick={() => setShowCreate(!showCreate)}>+ Save</button>
      </div>

      {showCreate && (
        <motion.div className={styles.createForm} initial={{ height: 0 }} animate={{ height: 'auto' }}>
          <input className={styles.input} placeholder="Snapshot name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <input className={styles.input} placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          <button className={styles.formBtn} onClick={handleCreate} disabled={!name.trim()}>Save Snapshot</button>
        </motion.div>
      )}

      {diffResult && diffId && (
        <div className={styles.diffView}>
          <div className={styles.diffHeader}>
            <span>Comparing: {snapshots.find(s => s.id === diffId)?.name} vs Current</span>
            <button className={styles.diffClose} onClick={() => setDiffId(null)}>×</button>
          </div>
          <div className={styles.diffBody}>
            {diffResult.map((line, i) => (
              <div key={i} className={`${styles.diffLine} ${styles[`diff_${line.type}`]}`}>
                <span className={styles.diffSymbol}>{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
                <span>{line.text || '\u00A0'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.list}>
        <AnimatePresence>
          {snapshots.map(snapshot => (
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
                <div className={styles.itemInlineActions}>
                  <button
                    type="button"
                    className={styles.inlineBtn}
                    onClick={e => { e.stopPropagation(); setConfirmRestore({ content: snapshot.content, name: snapshot.name }); }}
                    title="Restore this snapshot"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    className={styles.inlineBtn}
                    onClick={e => { e.stopPropagation(); deleteSnapshot(snapshot.id!); }}
                    title="Delete snapshot"
                  >
                    ×
                  </button>
                  <span className={styles.itemDate}>{new Date(snapshot.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {snapshot.note && <p className={styles.itemNote}>{snapshot.note}</p>}

              {previewId === snapshot.id && (
                <motion.div className={styles.itemActions} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button className={styles.restoreBtn} onClick={e => { e.stopPropagation(); setConfirmRestore({ content: snapshot.content, name: snapshot.name }); }}>Restore</button>
                  <button className={styles.diffBtn} onClick={e => { e.stopPropagation(); setDiffId(snapshot.id!); }}>Compare</button>
                  <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteSnapshot(snapshot.id!); setPreviewId(null); }}>Delete</button>
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

      <ConfirmDialog
        isOpen={!!confirmRestore}
        title="Restore Snapshot"
        message={`Restore "${confirmRestore?.name}"? A backup of your current content will be auto-saved first.`}
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(null)}
      />
    </div>
  );
}
