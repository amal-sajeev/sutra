import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ProjectLabel } from '../../types';
import Modal from './Modal';
import styles from './SettingsDialog.module.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'editor' | 'project' | 'labels' | 'shortcuts' | 'about';

const DEFAULT_LABELS: ProjectLabel[] = [
  { name: 'Concept', color: '#5b9bd5' },
  { name: 'Plot', color: '#e67e22' },
  { name: 'Character', color: '#9b59b6' },
  { name: 'Setting', color: '#27ae60' },
  { name: 'Action', color: '#e74c3c' },
];

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
  { keys: 'Ctrl+B', action: 'Toggle sidebar' },
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

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>('editor');
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
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#5b9bd5');

  const labels: ProjectLabel[] = activeProject?.settings?.labels || [];

  const addLabel = () => {
    if (!activeProject?.id || !newLabelName.trim()) return;
    const updated = [...labels, { name: newLabelName.trim(), color: newLabelColor }];
    updateProject(activeProject.id, { settings: { ...activeProject.settings, labels: updated } });
    setNewLabelName('');
  };

  const removeLabel = (name: string) => {
    if (!activeProject?.id) return;
    const updated = labels.filter(l => l.name !== name);
    updateProject(activeProject.id, { settings: { ...activeProject.settings, labels: updated } });
  };

  const initDefaults = () => {
    if (!activeProject?.id) return;
    updateProject(activeProject.id, { settings: { ...activeProject.settings, labels: DEFAULT_LABELS } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="560px">
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'editor' ? styles.tabActive : ''}`} onClick={() => setTab('editor')}>Editor</button>
          <button className={`${styles.tab} ${tab === 'project' ? styles.tabActive : ''}`} onClick={() => setTab('project')}>Project</button>
          <button className={`${styles.tab} ${tab === 'labels' ? styles.tabActive : ''}`} onClick={() => setTab('labels')}>Labels</button>
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
            </div>
          )}

          {tab === 'labels' && (
            <div className={styles.section}>
              <p className={styles.labelHint}>Define color labels for your scenes. Labels appear in the binder, corkboard, and outliner.</p>
              {labels.length === 0 && (
                <button className={styles.initBtn} onClick={initDefaults}>Load default labels</button>
              )}
              <div className={styles.labelList}>
                {labels.map(l => (
                  <div key={l.name} className={styles.labelRow}>
                    <span className={styles.labelSwatch} style={{ background: l.color }} />
                    <span className={styles.labelName}>{l.name}</span>
                    <button className={styles.labelRemove} onClick={() => removeLabel(l.name)}>×</button>
                  </div>
                ))}
              </div>
              <div className={styles.labelAdd}>
                <input
                  className={styles.input}
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  placeholder="Label name"
                  onKeyDown={e => { if (e.key === 'Enter') addLabel(); }}
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={e => setNewLabelColor(e.target.value)}
                  className={styles.colorPicker}
                />
                <button className={styles.addBtn} onClick={addLabel} disabled={!newLabelName.trim()}>Add</button>
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
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
