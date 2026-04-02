import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { SECTION_TYPES } from '../../types';
import { analyzeText, readabilityLabel } from '../../utils/textStats';
import styles from './InspectorPanel.module.css';

export default function InspectorPanel() {
  const activeScene = useProjectStore(s => s.activeScene);
  const activeProject = useProjectStore(s => s.activeProject);
  const updateScene = useProjectStore(s => s.updateScene);
  const snapshots = useProjectStore(s => s.snapshots);
  const loadSnapshots = useProjectStore(s => s.loadSnapshots);
  const characters = useProjectStore(s => s.characters);
  const comments = useProjectStore(s => s.comments);
  const resolveComment = useProjectStore(s => s.resolveComment);
  const deleteComment = useProjectStore(s => s.deleteComment);
  const [synopsis, setSynopsis] = useState('');
  const [notes, setNotes] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<'draft' | 'revision' | 'final'>('draft');
  const [tags, setTags] = useState('');
  const [wordTarget, setWordTarget] = useState(0);

  const labels = useMemo(() => activeProject?.settings?.labels || [], [activeProject]);

  const textStats = useMemo(() => {
    if (!activeScene?.content) return null;
    try {
      const doc = JSON.parse(activeScene.content) as Record<string, unknown>;
      const text = extractText(doc);
      return analyzeText(text);
    } catch {
      return null;
    }
  }, [activeScene?.content]);

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

      <div className={styles.fieldRow}>
        <label className={styles.label}>Story Date</label>
        <input
          type="date"
          className={styles.input}
          value={activeScene?.storyDate || ''}
          onChange={e => {
            if (activeScene?.id) updateScene(activeScene.id, { storyDate: e.target.value || undefined });
          }}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Section Type</label>
        <select
          className={styles.select}
          value={activeScene?.sectionType || ''}
          onChange={(e) => save({ sectionType: e.target.value || undefined })}
        >
          <option value="">Default</option>
          {SECTION_TYPES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Characters in Scene</label>
        <div className={styles.charTags}>
          {characters.filter(c => (activeScene?.tags || []).includes(`char:${c.id}`)).map(c => (
            <span key={c.id} className={styles.charTag} style={{ borderColor: c.color }}>
              {c.name}
              <button
                type="button"
                className={styles.charTagRemove}
                onClick={() => {
                  const nextTags = (activeScene?.tags || []).filter(t => t !== `char:${c.id}`);
                  save({ tags: nextTags.length > 0 ? nextTags : undefined });
                }}
              >×</button>
            </span>
          ))}
        </div>
        <select
          className={styles.select}
          value=""
          onChange={e => {
            const id = e.target.value;
            if (id) {
              const tag = `char:${id}`;
              const next = [...(activeScene?.tags || []), tag];
              save({ tags: [...new Set(next)] });
            }
            e.target.value = '';
          }}
        >
          <option value="">Add character...</option>
          {characters.filter(c => c.id != null && !(activeScene?.tags || []).includes(`char:${c.id}`)).map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
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
        <div className={styles.sectionHeader}>
          <label className={styles.label}>Custom Fields</label>
          <button
            type="button"
            className={styles.addFieldBtn}
            onClick={() => {
              const name = prompt('Field name:');
              if (name?.trim()) {
                const meta = { ...(activeScene?.customMeta || {}), [name.trim()]: '' };
                save({ customMeta: meta });
              }
            }}
          >
            + Field
          </button>
        </div>
        {Object.entries(activeScene?.customMeta || {}).map(([key, value]) => (
          <div key={key} className={styles.customField}>
            <label className={styles.customFieldLabel}>{key}</label>
            <div className={styles.customFieldRow}>
              <input
                className={styles.input}
                value={value}
                onChange={(e) => {
                  const meta = { ...(activeScene?.customMeta || {}), [key]: e.target.value };
                  save({ customMeta: meta });
                }}
                placeholder={`${key}...`}
              />
              <button
                type="button"
                className={styles.customFieldRemove}
                onClick={() => {
                  const meta = { ...(activeScene?.customMeta || {}) };
                  delete meta[key];
                  save({ customMeta: Object.keys(meta).length > 0 ? meta : undefined });
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {textStats && (
        <div className={styles.section}>
          <label className={styles.label}>Readability</label>
          <div className={styles.readabilityGrid}>
            <div className={styles.readStat}>
              <span className={styles.readValue}>{textStats.fleschKincaid}</span>
              <span className={styles.readLabel}>Grade Level</span>
            </div>
            <div className={styles.readStat}>
              <span className={styles.readValue}>{textStats.avgWordsPerSentence}</span>
              <span className={styles.readLabel}>Avg Words/Sentence</span>
            </div>
            <div className={styles.readStat}>
              <span className={styles.readValue}>{textStats.sentences}</span>
              <span className={styles.readLabel}>Sentences</span>
            </div>
            <div className={styles.readStat}>
              <span className={styles.readValue}>{textStats.dialogueRatio}%</span>
              <span className={styles.readLabel}>Dialogue</span>
            </div>
          </div>
          <span className={styles.readLevel}>{readabilityLabel(textStats.fleschKincaid)}</span>
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.label}>Word Target</label>
        <div className={styles.targetStack}>
          <div className={styles.targetInputRow}>
            <input
              type="number"
              className={styles.input}
              value={wordTarget || ''}
              onChange={e => setWordTarget(Number(e.target.value) || 0)}
              onBlur={() => save({ wordTarget: wordTarget || undefined })}
              placeholder="Target words"
              min={0}
              step={100}
            />
            <span className={styles.targetLabel}>target</span>
          </div>
          <div className={styles.targetCurrent}>
            {wordCount.toLocaleString()} / {wordTarget > 0 ? wordTarget.toLocaleString() : '—'} words
          </div>
          {wordTarget > 0 && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${targetPct}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Comments ({comments.length})</label>
        <div className={styles.commentList}>
          {comments.length === 0 && (
            <p className={styles.commentEmpty}>Select text in the editor and use the comment button on the toolbar.</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className={`${styles.commentCard} ${c.resolved ? styles.commentResolved : ''}`}
            >
              <blockquote className={styles.commentQuote}>{c.selectedText || '—'}</blockquote>
              <p className={styles.commentBody}>{c.body}</p>
              <div className={styles.commentMeta}>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
                {c.resolved && <span className={styles.commentBadge}>Resolved</span>}
              </div>
              <div className={styles.commentActions}>
                {!c.resolved && c.id != null && (
                  <button
                    type="button"
                    className={styles.commentActionBtn}
                    onClick={() => resolveComment(c.id!)}
                  >
                    Resolve
                  </button>
                )}
                {c.id != null && (
                  <button
                    type="button"
                    className={`${styles.commentActionBtn} ${styles.commentActionDanger}`}
                    onClick={() => deleteComment(c.id!)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Snapshots ({snapshots.length})</label>
        <div className={styles.snapList}>
          {snapshots.slice(0, 3).map(s => (
            <div key={s.id} className={styles.snapItem}>
              <span>{s.name}</span>
              <span className={styles.snapDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {snapshots.length > 3 && (
            <span className={styles.snapMore}>{snapshots.length - 3} more...</span>
          )}
        </div>
        <button
          className={styles.snapBtn}
          onClick={() => useUIStore.getState().setRightPanel('snapshots')}
          style={{ width: '100%', marginTop: '6px' }}
        >
          Manage Snapshots
        </button>
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

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';
  let t = '';
  if (Array.isArray(node.content)) {
    for (const c of node.content) t += extractText(c as Record<string, unknown>) + '\n';
  }
  return t;
}
