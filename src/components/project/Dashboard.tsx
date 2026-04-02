import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { exportProject, importProject } from '../../db/operations';
import { downloadFile } from '../../utils/export';
import { seedDemoProject } from '../../utils/seed';
import ThemeToggle from '../ui/ThemeToggle';
import ConfirmDialog from '../ui/ConfirmDialog';
import SnowflakeWizard from './SnowflakeWizard';
import ImportDialog from '../import/ImportDialog';
import { useToastStore } from '../../stores/toastStore';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const [newTitle, setNewTitle] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [activeWizardProjectId, setActiveWizardProjectId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'oldest'>('recent');
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.oneSentence && p.oneSentence.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'alpha':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'oldest':
        result.sort((a, b) => a.updatedAt - b.updatedAt);
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  const handleQuickCreate = async () => {
    if (!newTitle.trim()) return;
    const id = await createProject(newTitle.trim());
    setNewTitle('');
    navigate(`/project/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleQuickCreate();
  };

  const handleRename = (projectId: number) => {
    if (!editTitle.trim()) {
      setEditingProjectId(null);
      return;
    }
    updateProject(projectId, { title: editTitle.trim() });
    setEditingProjectId(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.project) {
        addToast('Invalid Sutra project file.', 'error');
        return;
      }
      const newId = await importProject(data);
      await loadProjects();
      addToast('Project imported successfully!', 'success');
      navigate(`/project/${newId}`);
    } catch (err) {
      addToast('Failed to import. Make sure this is a valid .sutra.json file.', 'error');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      className={styles.dashboard}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <ThemeToggle />

      <div className={styles.content}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className={styles.title}>
            <span className={styles.titleSanskrit}>सूत्र</span>
            <span className={styles.titleLatin}>Sutra</span>
          </h1>
          <p className={styles.subtitle}>Thread your stories together</p>
        </motion.div>

        <motion.div
          className={styles.quickStart}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Name your story and press Enter..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className={styles.createBtn} onClick={handleQuickCreate} disabled={!newTitle.trim()}>
              Begin
            </button>
          </div>
          <div className={styles.secondaryActions}>
            <button
              className={styles.wizardBtn}
              onClick={async () => {
                const id = await createProject(newTitle.trim() || 'Untitled');
                setActiveWizardProjectId(id);
                await useProjectStore.getState().loadProject(id);
                setShowWizard(true);
                setNewTitle('');
              }}
            >
              Snowflake Wizard
            </button>
            <span className={styles.actionDivider}>|</span>
            <button
              className={styles.wizardBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import Project'}
            </button>
            <span className={styles.actionDivider}>|</span>
            <button className={styles.wizardBtn} onClick={() => setImportDialogOpen(true)}>
              Import DOCX/MD
            </button>
            <span className={styles.actionDivider}>|</span>
            <button
              className={styles.wizardBtn}
              onClick={async () => {
                const id = await createProject('Novel');
                await useProjectStore.getState().loadProject(id);
                const store = useProjectStore.getState();
                for (const title of ['Prologue', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Epilogue']) {
                  const chId = await store.createChapter(title);
                  await store.createScene(chId, 'Scene 1');
                }
                navigate(`/project/${id}`);
              }}
            >
              Novel Template
            </button>
            <span className={styles.actionDivider}>|</span>
            <button
              className={styles.wizardBtn}
              onClick={async () => {
                const id = await createProject('Short Story');
                await useProjectStore.getState().loadProject(id);
                const ch = await useProjectStore.getState().createChapter('Story');
                await useProjectStore.getState().createScene(ch, 'Opening');
                await useProjectStore.getState().createScene(ch, 'Rising Action');
                await useProjectStore.getState().createScene(ch, 'Climax');
                await useProjectStore.getState().createScene(ch, 'Denouement');
                navigate(`/project/${id}`);
              }}
            >
              Short Story
            </button>
            <span className={styles.actionDivider}>|</span>
            <button
              className={styles.wizardBtn}
              onClick={async () => {
                setSeeding(true);
                try {
                  const id = await seedDemoProject();
                  await loadProjects();
                  navigate(`/project/${id}`);
                } catch (err) {
                  console.error(err);
                  addToast('Failed to create demo project.', 'error');
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
            >
              {seeding ? 'Loading...' : 'Load Demo Project'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.sutra.json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {showWizard && activeWizardProjectId && (
            <SnowflakeWizard
              onClose={() => {
                setShowWizard(false);
                if (activeWizardProjectId) navigate(`/project/${activeWizardProjectId}`);
              }}
            />
          )}
        </AnimatePresence>

        {projects.length > 0 && (
          <motion.div
            className={styles.projects}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.projectsHeader}>
              <h2 className={styles.sectionTitle}>Recent Projects</h2>
              <div className={styles.projectControls}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha' | 'oldest')}
                  aria-label="Sort projects"
                >
                  <option value="recent">Recent</option>
                  <option value="alpha">A-Z</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
            <div className={styles.grid}>
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  className={`${styles.card} chromatic glow-pulse`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                  onClick={() => {
                    if (editingProjectId !== project.id) navigate(`/project/${project.id}`);
                  }}
                >
                  <div className={styles.cardContent}>
                    {editingProjectId === project.id ? (
                      <input
                        className={styles.renameInput}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(project.id!)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(project.id!);
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <h3 className={styles.cardTitle}>{project.title}</h3>
                    )}
                    {project.oneSentence && (
                      <p className={styles.cardSynopsis}>{project.oneSentence}</p>
                    )}
                    <div className={styles.cardMeta}>
                      <span className={styles.cardDate}>{formatDate(project.updatedAt)}</span>
                      {project.settings?.manuscriptTarget ? (
                        <span className={styles.cardTarget}>
                          {project.settings.manuscriptTarget.toLocaleString()}w target
                        </span>
                      ) : null}
                      {project.settings?.authorName ? (
                        <span className={styles.cardAuthor}>{project.settings.authorName}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.renameBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProjectId(project.id!);
                        setEditTitle(project.title);
                      }}
                      data-tooltip="Rename project"
                      aria-label="Rename project"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button
                      className={styles.exportBtn}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const data = await exportProject(project.id!);
                        downloadFile(JSON.stringify(data, null, 2), `${project.title}.sutra.json`, 'application/json');
                      }}
                      data-tooltip="Export as JSON"
                      aria-label="Export as JSON"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(project.id!);
                      }}
                      data-tooltip="Delete project"
                      aria-label="Delete project"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredProjects.length === 0 && searchQuery && (
                <p className={styles.noResults}>No projects match "{searchQuery}"</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <ImportDialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} />

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Project"
        message="Delete this project and all its data? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteConfirm) {
            deleteProject(deleteConfirm);
            addToast('Project deleted.', 'info');
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </motion.div>
  );
}
