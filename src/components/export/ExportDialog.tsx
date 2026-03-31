import { useState, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useToastStore } from '../../stores/toastStore';
import { performExport, downloadFile, DEFAULT_EXPORT_OPTIONS } from '../../utils/export';
import { exportProject } from '../../db/operations';
import Modal from '../ui/Modal';
import type { ExportOptions, ExportFormat, ExportScope, SceneSeparator, PageSize } from '../../types';
import styles from './ExportDialog.module.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMATS: { key: ExportFormat; label: string; ext: string; desc: string; icon: string }[] = [
  { key: 'markdown',  label: 'Markdown',   ext: '.md',          desc: 'Rich text with formatting',        icon: 'M\u2193' },
  { key: 'plaintext', label: 'Plain Text', ext: '.txt',         desc: 'Stripped formatting',               icon: 'Aa' },
  { key: 'html',      label: 'HTML',       ext: '.html',        desc: 'Standalone web page',               icon: '</>' },
  { key: 'epub',      label: 'EPUB',       ext: '.epub',        desc: 'Standard e-book format',            icon: '\uD83D\uDCD6' },
  { key: 'docx',      label: 'Word',       ext: '.docx',        desc: 'Microsoft Word document',           icon: 'W' },
  { key: 'pdf',       label: 'Print/PDF',  ext: '',             desc: 'Browser print dialog',              icon: '\uD83D\uDDA8' },
  { key: 'json',      label: 'JSON',       ext: '.sutra.json',  desc: 'Full project backup',               icon: '{}' },
];

const FONT_OPTIONS = [
  { value: 'Georgia, serif',                label: 'Georgia' },
  { value: '"Times New Roman", serif',       label: 'Times New Roman' },
  { value: '"Garamond", serif',              label: 'Garamond' },
  { value: '"Palatino Linotype", serif',     label: 'Palatino' },
  { value: '"Bookman Old Style", serif',     label: 'Bookman' },
  { value: '"Libre Baskerville", serif',     label: 'Libre Baskerville' },
  { value: 'system-ui, sans-serif',          label: 'System Sans' },
  { value: '"Inter", sans-serif',            label: 'Inter' },
];

const SEPARATORS: { value: SceneSeparator; label: string }[] = [
  { value: 'blank',     label: 'Blank line' },
  { value: 'asterisks', label: '* * *' },
  { value: 'rule',      label: 'Horizontal rule' },
  { value: 'hash',      label: '#' },
  { value: 'none',      label: 'None' },
];

const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 'letter', label: 'US Letter (8.5 \u00D7 11\u2033)' },
  { value: 'a4',     label: 'A4 (210 \u00D7 297 mm)' },
  { value: 'a5',     label: 'A5 (148 \u00D7 210 mm)' },
  { value: '6x9',    label: 'Trade (6 \u00D7 9\u2033)' },
];

const needsTypography = (f: ExportFormat) => ['html', 'epub', 'docx', 'pdf'].includes(f);
const needsPage       = (f: ExportFormat) => ['docx', 'pdf'].includes(f);
const needsMeta       = (f: ExportFormat) => ['epub', 'docx', 'html', 'pdf'].includes(f);

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const project    = useProjectStore(s => s.activeProject);
  const chapters   = useProjectStore(s => s.chapters);
  const scenes     = useProjectStore(s => s.scenes);
  const activeSceneId = useProjectStore(s => s.activeSceneId);
  const addToast   = useToastStore(s => s.addToast);

  const [opts, setOpts] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [exporting, setExporting] = useState(false);

  const patch = useCallback((p: Partial<ExportOptions>) => {
    setOpts(prev => ({ ...prev, ...p }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!project) return;
    setExporting(true);
    try {
      if (opts.format === 'json') {
        const data = await exportProject(project.id!);
        downloadFile(JSON.stringify(data, null, 2), `${project.title}.sutra.json`, 'application/json');
      } else {
        await performExport(project, chapters, scenes, opts, activeSceneId);
      }
      const fmt = FORMATS.find(f => f.key === opts.format);
      addToast(`Exported as ${fmt?.label || opts.format}`, 'success');
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      addToast(`Export failed: ${(err as Error).message || 'Unknown error'}`, 'error');
    } finally {
      setExporting(false);
    }
  }, [project, chapters, scenes, opts, activeSceneId, addToast, onClose]);

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const activeScene = scenes.find(s => s.id === activeSceneId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Manuscript" width="640px">
      <div className={styles.wrap}>

        {/* ── Format ── */}
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Format</h4>
          <div className={styles.formatGrid}>
            {FORMATS.map(f => (
              <button
                key={f.key}
                className={`${styles.formatCard} ${opts.format === f.key ? styles.formatActive : ''}`}
                onClick={() => patch({ format: f.key })}
              >
                <span className={styles.formatIcon}>{f.icon}</span>
                <span className={styles.formatLabel}>{f.label}</span>
                <span className={styles.formatExt}>{f.ext}</span>
              </button>
            ))}
          </div>
          <p className={styles.formatDesc}>{FORMATS.find(f => f.key === opts.format)?.desc}</p>
        </section>

        {/* ── Scope ── */}
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Scope</h4>
          <div className={styles.scopeRow}>
            {(['full', 'chapter', 'scene'] as ExportScope[]).map(sc => (
              <label key={sc} className={styles.radio}>
                <input
                  type="radio"
                  name="scope"
                  checked={opts.scope === sc}
                  onChange={() => patch({ scope: sc, scopeId: undefined })}
                />
                <span>{sc === 'full' ? 'Full manuscript' : sc === 'chapter' ? 'Chapter' : 'Scene'}</span>
              </label>
            ))}
          </div>

          {opts.scope === 'chapter' && (
            <select
              className={styles.select}
              value={opts.scopeId || ''}
              onChange={e => patch({ scopeId: Number(e.target.value) || undefined })}
            >
              <option value="">Select chapter...</option>
              {sortedChapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}

          {opts.scope === 'scene' && activeScene && (
            <p className={styles.scopeHint}>Current scene: <strong>{activeScene.title}</strong></p>
          )}
          {opts.scope === 'scene' && !activeScene && (
            <p className={styles.scopeHint}>No scene selected — open a scene first.</p>
          )}
        </section>

        {/* ── Content options ── */}
        {opts.format !== 'json' && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Content</h4>
            <div className={styles.checkGrid}>
              <label className={styles.check}>
                <input type="checkbox" checked={opts.includeFrontMatter} onChange={e => patch({ includeFrontMatter: e.target.checked })} />
                <span>Title page</span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={opts.includeChapterHeadings} onChange={e => patch({ includeChapterHeadings: e.target.checked })} />
                <span>Chapter headings</span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={opts.includeSceneTitles} onChange={e => patch({ includeSceneTitles: e.target.checked })} />
                <span>Scene titles</span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={opts.includeSynopsis} onChange={e => patch({ includeSynopsis: e.target.checked })} />
                <span>Scene synopses</span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={opts.chapterPageBreaks} onChange={e => patch({ chapterPageBreaks: e.target.checked })} />
                <span>Chapter page breaks</span>
              </label>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Scene separator</label>
              <select
                className={styles.select}
                value={opts.sceneSeparator}
                onChange={e => patch({ sceneSeparator: e.target.value as SceneSeparator })}
              >
                {SEPARATORS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* ── Typography ── */}
        {needsTypography(opts.format) && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Typography</h4>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Font</label>
              <select
                className={styles.select}
                value={opts.fontFamily}
                onChange={e => patch({ fontFamily: e.target.value })}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Size</label>
                <div className={styles.rangeRow}>
                  <input type="range" min={10} max={24} value={opts.fontSize} onChange={e => patch({ fontSize: Number(e.target.value) })} className={styles.range} />
                  <span className={styles.rangeVal}>{opts.fontSize}px</span>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Line spacing</label>
                <div className={styles.rangeRow}>
                  <input type="range" min={1} max={3} step={0.1} value={opts.lineSpacing} onChange={e => patch({ lineSpacing: Number(e.target.value) })} className={styles.range} />
                  <span className={styles.rangeVal}>{opts.lineSpacing.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Page ── */}
        {needsPage(opts.format) && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Page</h4>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Page size</label>
              <select
                className={styles.select}
                value={opts.pageSize}
                onChange={e => patch({ pageSize: e.target.value as PageSize })}
              >
                {PAGE_SIZES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* ── Metadata ── */}
        {needsMeta(opts.format) && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Metadata</h4>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Author</label>
              <input
                type="text"
                className={styles.input}
                value={opts.authorName}
                onChange={e => patch({ authorName: e.target.value })}
                placeholder="Author name"
              />
            </div>
          </section>
        )}

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={exporting || (opts.scope === 'chapter' && !opts.scopeId) || (opts.scope === 'scene' && !activeScene)}
          >
            {exporting ? 'Exporting\u2026' : `Export ${FORMATS.find(f => f.key === opts.format)?.label || ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
