import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import Modal from './Modal';
import styles from './SettingsDialog.module.css';
import { formatBytes, getStorageEstimate, requestPersistentStorage, pickBackupDirectory } from '../../utils/backup';
import { useToastStore } from '../../stores/toastStore';
import type { UseAutoBackupResult } from '../../hooks/useAutoBackup';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  autoBackup?: UseAutoBackupResult;
}

type SettingsTab = 'editor' | 'project' | 'shortcuts' | 'about';

const FONT_OPTIONS = [
  { value: 'Georgia, serif', label: 'Georgia (serif)' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Lora", serif', label: 'Lora' },
  { value: 'system-ui, sans-serif', label: 'System Sans' },
  { value: '"Inter", sans-serif', label: 'Inter' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+Shift+I', action: 'Quick Idea Capture' },
  { keys: 'Ctrl+Shift+B', action: 'Toggle sidebar' },
  { keys: 'Ctrl+\\', action: 'Toggle split editor' },
  { keys: 'Ctrl+Shift+T', action: 'Typewriter scroll mode' },
  { keys: 'Ctrl+Shift+Z', action: 'Zen/focus mode' },
  { keys: 'Ctrl+F', action: 'Find & Replace' },
  { keys: 'Ctrl+Z', action: 'Undo' },
  { keys: 'Ctrl+Y', action: 'Redo' },
  { keys: 'Ctrl+B (in editor)', action: 'Bold' },
  { keys: 'Ctrl+I', action: 'Italic' },
  { keys: 'Ctrl+Shift+X', action: 'Strikethrough' },
  { keys: 'Ctrl+E', action: 'Inline code' },
  { keys: 'Escape', action: 'Close panel / exit maximized' },
];

function StorageHealth() {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null | undefined>(undefined);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [est, isPersisted] = await Promise.all([
        getStorageEstimate(),
        navigator.storage?.persisted?.() ?? Promise.resolve(false),
      ]);
      if (!cancelled) {
        setEstimate(est);
        setPersisted(isPersisted);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToast = useToastStore(s => s.addToast);

  const handlePersist = async () => {
    const result = await requestPersistentStorage();
    const [est, isPersisted] = await Promise.all([
      getStorageEstimate(),
      navigator.storage?.persisted?.() ?? Promise.resolve(false),
    ]);
    setEstimate(est);
    setPersisted(isPersisted);
    if (result || isPersisted) {
      addToast('Persistent storage enabled.', 'success');
    } else {
      addToast('Browser denied persistent storage. Try bookmarking the site or installing it as a PWA, then try again.', 'error', 6000);
    }
  };

  const pct =
    estimate && estimate.quota > 0
      ? Math.min(100, Math.round((estimate.usage / estimate.quota) * 100))
      : null;

  return (
    <div className={styles.storageSection}>
      <h3 className={styles.storageHeading}>Browser storage</h3>
      {estimate === undefined && <p className={styles.storageHint}>Loading…</p>}
      {estimate === null && (
        <p className={styles.storageHint}>This browser does not report storage usage.</p>
      )}
      {estimate && estimate.quota > 0 && (
        <>
          <p className={styles.storageStats}>
            {formatBytes(estimate.usage)} of {formatBytes(estimate.quota)} used
            {pct !== null && ` (${pct}%)`}
          </p>
          <div className={styles.storageBarTrack} role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.storageBarFill} style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      {estimate && estimate.quota === 0 && estimate.usage > 0 && (
        <p className={styles.storageStats}>{formatBytes(estimate.usage)} in use (quota unknown)</p>
      )}
      <p className={styles.storagePersist}>
        {persisted ? (
          <span className={styles.storagePersistOk}>Persistent storage is granted.</span>
        ) : (
          <>
            <span className={styles.storageHint}>Data may still be cleared if the browser evicts site storage. </span>
            <button type="button" className={styles.storagePersistBtn} onClick={handlePersist}>
              Request persistent storage
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function formatLastBackup(ts: number): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

export default function SettingsDialog({ isOpen, onClose, autoBackup }: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>('editor');
  const [backupUiTick, setBackupUiTick] = useState(0);
  const bumpBackupUi = useCallback(() => setBackupUiTick((n) => n + 1), []);
  const editorFontFamily = useUIStore((s) => s.editorFontFamily);
  const editorFontSize = useUIStore((s) => s.editorFontSize);
  const wordCountGoal = useUIStore((s) => s.wordCountGoal);
  const theme = useUIStore((s) => s.theme);
  const digitalRain = useUIStore((s) => s.digitalRain);
  const setEditorFontFamily = useUIStore((s) => s.setEditorFontFamily);
  const setEditorFontSize = useUIStore((s) => s.setEditorFontSize);
  const setWordCountGoal = useUIStore((s) => s.setWordCountGoal);
  const setTheme = useUIStore((s) => s.setTheme);
  const setDigitalRain = useUIStore((s) => s.setDigitalRain);
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="560px">
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'editor' ? styles.tabActive : ''}`} onClick={() => setTab('editor')}>Editor</button>
          <button className={`${styles.tab} ${tab === 'project' ? styles.tabActive : ''}`} onClick={() => setTab('project')}>Project</button>
          <button className={`${styles.tab} ${tab === 'shortcuts' ? styles.tabActive : ''}`} onClick={() => setTab('shortcuts')}>Shortcuts</button>
          <button className={`${styles.tab} ${tab === 'about' ? styles.tabActive : ''}`} onClick={() => setTab('about')}>About</button>
        </div>

        <div className={styles.content}>
          {tab === 'editor' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}>Theme</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radio}>
                    <input type="radio" checked={theme === 'lain'} onChange={() => setTheme('lain')} />
                    <span>Lain</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" checked={theme === 'matrix'} onChange={() => setTheme('matrix')} />
                    <span>Matrix</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" checked={theme === 'light'} onChange={() => setTheme('light')} />
                    <span>Clean Light</span>
                  </label>
                </div>
              </div>

              {theme === 'matrix' && (
                <div className={styles.field}>
                  <label className={styles.label}>Digital Rain</label>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={digitalRain} onChange={(e) => setDigitalRain(e.target.checked)} />
                    <span>{digitalRain ? 'On' : 'Off'}</span>
                  </label>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Editor Font</label>
                <select
                  className={styles.select}
                  value={editorFontFamily}
                  onChange={(e) => setEditorFontFamily(e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Font Size</label>
                <div className={styles.rangeRow}>
                  <input
                    type="range"
                    min={12}
                    max={28}
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    className={styles.range}
                  />
                  <span className={styles.rangeValue}>{editorFontSize}px</span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Daily Word Count Goal</label>
                <input
                  type="number"
                  className={styles.input}
                  value={wordCountGoal || ''}
                  onChange={(e) => setWordCountGoal(Number(e.target.value) || 0)}
                  placeholder="0 = no goal"
                  min={0}
                  step={100}
                />
              </div>
            </div>
          )}

          {tab === 'project' && activeProject && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}>Project Theme Override</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radio}>
                    <input type="radio" checked={!activeProject.settings?.theme} onChange={() => updateProject(activeProject.id!, { settings: { ...activeProject.settings, theme: undefined } })} />
                    <span>Global default</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" checked={activeProject.settings?.theme === 'lain'} onChange={() => updateProject(activeProject.id!, { settings: { ...activeProject.settings, theme: 'lain' } })} />
                    <span>Lain</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" checked={activeProject.settings?.theme === 'matrix'} onChange={() => updateProject(activeProject.id!, { settings: { ...activeProject.settings, theme: 'matrix' } })} />
                    <span>Matrix</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" checked={activeProject.settings?.theme === 'light'} onChange={() => updateProject(activeProject.id!, { settings: { ...activeProject.settings, theme: 'light' } })} />
                    <span>Clean Light</span>
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Project Editor Font</label>
                <select
                  className={styles.select}
                  value={activeProject.settings?.editorFont || ''}
                  onChange={e => updateProject(activeProject.id!, { settings: { ...activeProject.settings, editorFont: e.target.value || undefined } })}
                >
                  <option value="">Use global default</option>
                  {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Project Author Name</label>
                <input
                  className={styles.input}
                  value={activeProject.settings?.authorName || ''}
                  onChange={e => updateProject(activeProject.id!, { settings: { ...activeProject.settings, authorName: e.target.value || undefined } })}
                  placeholder="Author name for exports"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Manuscript Target</label>
                <input
                  type="number"
                  className={styles.input}
                  value={activeProject.settings?.manuscriptTarget || ''}
                  onChange={e => updateProject(activeProject.id!, { settings: { ...activeProject.settings, manuscriptTarget: Number(e.target.value) || undefined } })}
                  placeholder="e.g. 80000"
                  min={0}
                  step={1000}
                />
              </div>

              {autoBackup && (
                <div className={styles.labelsBlock} data-backup-rev={backupUiTick}>
                  <h4 className={styles.sectionTitle}>Timed backup</h4>
                  <p className={styles.labelHint}>
                    Saves a JSON copy of this project to a folder you choose on a timer. The folder permission lasts until you close the tab.
                  </p>
                  {!autoBackup.isSupported ? (
                    <p className={styles.storageHint}>Your browser does not support folder backups. Try Chrome or Edge.</p>
                  ) : (
                    <>
                      <p className={styles.storageStats}>
                        {autoBackup.hasBackupDirectory ? 'Backup folder is set.' : 'No folder selected — timed backups are paused.'}
                        {' '}
                        Last backup: {formatLastBackup(autoBackup.getLastBackupTime())}
                      </p>
                      <div className={styles.backupActions}>
                        <button
                          type="button"
                          className={styles.storagePersistBtn}
                          onClick={async () => {
                            const h = await pickBackupDirectory();
                            if (h) {
                              autoBackup.setBackupDirectory(h);
                              bumpBackupUi();
                            }
                          }}
                        >
                          Choose backup folder
                        </button>
                        {autoBackup.hasBackupDirectory && (
                          <>
                            <button
                              type="button"
                              className={styles.backupSecondaryBtn}
                              onClick={() => {
                                autoBackup.clearBackupDirectory();
                                bumpBackupUi();
                              }}
                            >
                              Clear folder
                            </button>
                            <button
                              type="button"
                              className={styles.storagePersistBtn}
                              onClick={async () => {
                                await autoBackup.performBackup();
                                bumpBackupUi();
                              }}
                            >
                              Back up now
                            </button>
                          </>
                        )}
                      </div>
                      <div className={styles.field} style={{ marginTop: 12 }}>
                        <label className={styles.label}>Backup interval (minutes)</label>
                        <input
                          type="number"
                          className={styles.input}
                          min={1}
                          max={1440}
                          value={autoBackup.intervalMinutes}
                          onChange={(e) => autoBackup.setIntervalMinutes(Number(e.target.value) || 30)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className={styles.labelsBlock}>
                <h4 className={styles.sectionTitle}>Labels</h4>
                <p className={styles.labelHint}>Used in the binder, corkboard, and outliner. Press Enter to add a label; colors cycle automatically.</p>
                <div className={styles.labelList}>
                  {(activeProject.settings?.labels || []).map((label, i) => (
                    <div key={i} className={styles.labelItem}>
                      <span className={styles.labelDot} style={{ background: label.color }} />
                      <span>{label.name}</span>
                      <button
                        type="button"
                        className={styles.labelRemove}
                        onClick={() => {
                          const labels = [...(activeProject.settings?.labels || [])];
                          labels.splice(i, 1);
                          if (activeProject.id) {
                            updateProject(activeProject.id, { settings: { ...activeProject.settings, labels } });
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.labelAdd}>
                  <input
                    className={styles.labelInput}
                    placeholder="New label name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = (e.target as HTMLInputElement).value.trim();
                        if (name && activeProject.id) {
                          const colors = ['#e55555', '#d4a745', '#4aa86a', '#4488cc', '#8844cc', '#cc5599'];
                          const labels = [
                            ...(activeProject.settings?.labels || []),
                            { name, color: colors[(activeProject.settings?.labels || []).length % colors.length] },
                          ];
                          updateProject(activeProject.id, { settings: { ...activeProject.settings, labels } });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className={styles.shortcutList}>
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className={styles.shortcutRow}>
                  <kbd className={styles.kbd}>{s.keys}</kbd>
                  <span className={styles.shortcutAction}>{s.action}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'about' && (
            <div className={styles.about}>
              <h2 className={styles.aboutTitle}>
                <span className={styles.sanskrit}>सूत्र</span> Sutra
              </h2>
              <p className={styles.aboutVersion}>Version 1.0.0</p>
              <p className={styles.aboutDesc}>
                A stylish, local-first writing application for novelists and storytellers.
                All data lives in your browser's IndexedDB — no server, no account, no sync.
              </p>
              <p className={styles.aboutDesc}>
                Named after the Sanskrit word सूत्र (sutra) — "thread."
                Each character is a thread. The story is the tapestry.
              </p>
              <div className={styles.aboutTech}>
                <span>React 19</span>
                <span>TipTap</span>
                <span>Dexie</span>
                <span>Zustand</span>
                <span>d3-force</span>
                <span>Framer Motion</span>
              </div>
              <StorageHealth />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
