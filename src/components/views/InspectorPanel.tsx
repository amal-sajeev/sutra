import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import styles from './InspectorPanel.module.css';

export default function InspectorPanel() {
  const activeScene = useProjectStore(s => s.activeScene);
  const activeProject = useProjectStore(s => s.activeProject);
  const updateScene = useProjectStore(s => s.updateScene);
  const snapshots = useProjectStore(s => s.snapshots);
  const loadSnapshots = useProjectStore(s => s.loadSnapshots);
  const createSnapshot = useProjectStore(s => s.createSnapshot);

  const [synopsis, setSynopsis] = useState('');
  const [notes, setNotes] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<'draft' | 'revision' | 'final'>('draft');
  const [tags, setTags] = useState('');
  const [wordTarget, setWordTarget] = useState(0);
  const [snapName, setSnapName] = useState('');

  const labels = useMemo(() => activeProject?.settings?.labels || [], [activeProject]);

  useEffect(() => {
    if (activeScene) {
      setSynopsis(activeScene.synopsis || '');
      setNotes(activeScene.notes || '');
      setLabel(activeScene.label || '');
      setStatus(activeScene.status);
      setTags((activeScene.tags || []).join(', '));
      setWordTarget(activeScene.wordTarget || 0);
      loadSnapshots(activeScene.id!);
    }
  }, [activeScene?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((changes: Record<string, unknown>) => {
    if (activeScene?.id) updateScene(activeScene.id, changes);
  }, [activeScene, updateScene]);

  const handleSnapshot = useCallback(() => {
    if (!activeScene?.id) return;
    const name = snapName.trim() || `Snapshot ${new Date().toLocaleString()}`;
    createSnapshot(activeScene.id, name, activeScene.content);
    setSnapName('');
  }, [activeScene, snapName, createSnapshot]);

  if (!activeScene) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}><p>No scene selected</p></div>
      </div>
    );
  }

  const wordCount = (() => {
    if (!activeScene.content) return 0;
    try {
      const doc = JSON.parse(activeScene.content);
      return countW(doc);
    } catch { return 0; }
  })();

  const targetPct = wordTarget > 0 ? Math.min(100, Math.round((wordCount / wordTarget) * 100)) : 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Inspector</h3>

      <div className={styles.section}>
        <label className={styles.label}>Synopsis</label>
        <textarea
          className={styles.textarea}
          value={synopsis}
          onChange={e => setSynopsis(e.target.value)}
          onBlur={() => save({ synopsis })}
          placeholder="Scene synopsis..."
          rows={3}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Notes</label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => save({ notes })}
          placeholder="Private scene notes..."
          rows={3}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Status</label>
        <select
          className={styles.select}
          value={status}
          onChange={e => { const v = e.target.value as typeof status; setStatus(v); save({ status: v }); }}
        >
          <option value="draft">Draft</option>
          <option value="revision">Revision</option>
          <option value="final">Final</option>
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Label</label>
        <select
          className={styles.select}
          value={label}
          onChange={e => { setLabel(e.target.value); save({ label: e.target.value || undefined }); }}
        >
          <option value="">None</option>
          {labels.map(l => (
            <option key={l.name} value={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Tags</label>
        <input
          className={styles.input}
          value={tags}
          onChange={e => setTags(e.target.value)}
          onBlur={() => {
            const arr = tags.split(',').map(t => t.trim()).filter(Boolean);
            save({ tags: arr.length > 0 ? arr : undefined });
          }}
          placeholder="tag1, tag2, ..."
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Word Target</label>
        <div className={styles.targetRow}>
          <input
            type="number"
            className={styles.input}
            value={wordTarget || ''}
            onChange={e => setWordTarget(Number(e.target.value) || 0)}
            onBlur={() => save({ wordTarget: wordTarget || undefined })}
            placeholder="0"
            min={0}
            step={100}
          />
          <span className={styles.targetCount}>{wordCount} w</span>
        </div>
        {wordTarget > 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${targetPct}%` }} />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Snapshots ({snapshots.length})</label>
        <div className={styles.snapRow}>
          <input
            className={styles.input}
            value={snapName}
            onChange={e => setSnapName(e.target.value)}
            placeholder="Snapshot name"
            onKeyDown={e => { if (e.key === 'Enter') handleSnapshot(); }}
          />
          <button className={styles.snapBtn} onClick={handleSnapshot}>Save</button>
        </div>
        <div className={styles.snapList}>
          {snapshots.slice(0, 5).map(s => (
            <div key={s.id} className={styles.snapItem}>
              <span>{s.name}</span>
              <span className={styles.snapDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {snapshots.length > 5 && (
            <span className={styles.snapMore}>{snapshots.length - 5} more...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function countW(node: Record<string, unknown>): number {
  if (node.type === 'text') return ((node.text as string) || '').split(/\s+/).filter(Boolean).length;
  let n = 0;
  if (Array.isArray(node.content)) for (const c of node.content) n += countW(c as Record<string, unknown>);
  return n;
}
