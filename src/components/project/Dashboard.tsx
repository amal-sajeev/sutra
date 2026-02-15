import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { exportProject, importProject } from '../../db/operations';
import { downloadFile } from '../../utils/export';
import { seedDemoProject } from '../../utils/seed';
import ThemeToggle from '../ui/ThemeToggle';
import SnowflakeWizard from './SnowflakeWizard';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [newTitle, setNewTitle] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [activeWizardProjectId, setActiveWizardProjectId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleQuickCreate = async () => {
    if (!newTitle.trim()) return;
    const id = await createProject(newTitle.trim());
    setNewTitle('');
    navigate(`/project/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleQuickCreate();
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
        alert('Invalid Sutra project file.');
        return;
      }
      const newId = await importProject(data);
      await loadProjects();
      navigate(`/project/${newId}`);
    } catch (err) {
      alert('Failed to import project. Make sure this is a valid .sutra.json file.');
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
                  alert('Failed to create demo project.');
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
            <h2 className={styles.sectionTitle}>Recent Projects</h2>
            <div className={styles.grid}>
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  className={`${styles.card} chromatic glow-pulse`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    {project.oneSentence && (
                      <p className={styles.cardSynopsis}>{project.oneSentence}</p>
                    )}
                    <span className={styles.cardDate}>{formatDate(project.updatedAt)}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.exportBtn}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const data = await exportProject(project.id!);
                        downloadFile(JSON.stringify(data, null, 2), `${project.title}.sutra.json`, 'application/json');
                      }}
                      data-tooltip="Export as JSON"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this project and all its data?')) {
                          deleteProject(project.id!);
                        }
                      }}
                      data-tooltip="Delete project"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
