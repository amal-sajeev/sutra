import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Editor from '../editor/Editor';
import SplitEditor from '../editor/SplitEditor';
import RightPanel from './RightPanel';
import styles from './ProjectWorkspace.module.css';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadProject = useProjectStore((s) => s.loadProject);
  const activeProject = useProjectStore((s) => s.activeProject);
  const unloadProject = useProjectStore((s) => s.unloadProject);
  const activeScene = useProjectStore((s) => s.activeScene);
  const splitSceneId = useProjectStore((s) => s.splitSceneId);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const rightPanel = useUIStore((s) => s.rightPanel);
  const rightPanelWidth = useUIStore((s) => s.rightPanelWidth);
  const setRightPanelWidth = useUIStore((s) => s.setRightPanelWidth);
  const rightPanelMaximized = useUIStore((s) => s.rightPanelMaximized);
  const splitEditor = useUIStore((s) => s.splitEditor);

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
  }, [rightPanelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      // Dragging left increases width, dragging right decreases
      const delta = resizeRef.current.startX - e.clientX;
      setRightPanelWidth(resizeRef.current.startWidth + delta);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setRightPanelWidth]);

  useEffect(() => {
    if (id) {
      loadProject(Number(id));
    }
    return () => unloadProject();
  }, [id, loadProject, unloadProject]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        useUIStore.getState().setSplitEditor(!useUIStore.getState().splitEditor);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!activeProject) {
    return (
      <motion.div className={styles.loading} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p>Loading project...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.workspace}
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <TopBar onBack={() => navigate('/')} />

      <div className={styles.main}>
        {!rightPanelMaximized && (
          <>
            <motion.div
              className={styles.sidebar}
              animate={{
                width: sidebarOpen ? 260 : 0,
                opacity: sidebarOpen ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Sidebar />
            </motion.div>

            <div className={styles.editorArea}>
              {activeScene ? (
                <div className={styles.editorContainer}>
                  <Editor scene={activeScene} />
                  {splitEditor && splitSceneId && <SplitEditor sceneId={splitSceneId} />}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <span className={styles.emptyIcon}>सू</span>
                    <p>Select a scene from the sidebar to begin writing</p>
                    <p className={styles.emptyHint}>or create a new chapter to get started</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {rightPanel !== 'none' && (
          <>
            {!rightPanelMaximized && (
              <div
                className={`${styles.resizeHandle} ${isResizing ? styles.resizeActive : ''}`}
                onMouseDown={handleResizeStart}
              />
            )}
            <motion.div
              className={`${styles.rightPanel} ${rightPanelMaximized ? styles.rightPanelMaximized : ''}`}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: rightPanelMaximized ? '100%' : rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={isResizing ? { duration: 0 } : { duration: 0.3 }}
              style={isResizing && !rightPanelMaximized ? { width: rightPanelWidth } : undefined}
            >
              <RightPanel />
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
