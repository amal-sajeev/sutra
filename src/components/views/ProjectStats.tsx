import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { getWritingHistory } from '../../db/operations';
import type { WritingHistory } from '../../types';
import Modal from '../ui/Modal';
import styles from './ProjectStats.module.css';

interface ProjectStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

function countWords(content: string): number {
  if (!content) return 0;
  try {
    const doc = JSON.parse(content);
    return extractW(doc);
  } catch {
    return content.split(/\s+/).filter(Boolean).length;
  }
}

function extractW(node: Record<string, unknown>): number {
  if (node.type === 'text') return ((node.text as string) || '').split(/\s+/).filter(Boolean).length;
  let n = 0;
  if (Array.isArray(node.content)) for (const c of node.content) n += extractW(c as Record<string, unknown>);
  return n;
}

export default function ProjectStats({ isOpen, onClose }: ProjectStatsProps) {
  const activeProject = useProjectStore(s => s.activeProject);
  const chapters = useProjectStore(s => s.chapters);
  const scenes = useProjectStore(s => s.scenes);
  const updateProject = useProjectStore(s => s.updateProject);

  const [manuscriptTarget, setManuscriptTarget] = useState(0);
  const [sessionTarget, setSessionTarget] = useState(0);
  const sessionStartWords = useRef<number | null>(null);
  const [history, setHistory] = useState<WritingHistory[]>([]);

  const totalWords = useMemo(() => scenes.reduce((acc, s) => acc + countWords(s.content), 0), [scenes]);

  useEffect(() => {
    if (activeProject?.settings) {
      setManuscriptTarget(activeProject.settings.manuscriptTarget || 0);
      setSessionTarget(activeProject.settings.sessionTarget || 0);
    }
    if (activeProject?.id) {
      getWritingHistory(activeProject.id, 30).then(setHistory).catch(() => {});
    }
  }, [activeProject]);

  useEffect(() => {
    if (sessionStartWords.current === null && scenes.length > 0) {
      sessionStartWords.current = totalWords;
    }
  }, [totalWords, scenes.length]);

  const sessionWords = sessionStartWords.current !== null ? Math.max(0, totalWords - sessionStartWords.current) : 0;

  const sceneStats = useMemo(() => {
    const wcs = scenes.map(s => countWords(s.content)).filter(n => n > 0);
    if (wcs.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
    return {
      avg: Math.round(wcs.reduce((a, b) => a + b, 0) / wcs.length),
      min: Math.min(...wcs),
      max: Math.max(...wcs),
      count: wcs.length,
    };
  }, [scenes]);

  const estPages = Math.ceil(totalWords / 250);
  const estReadMin = Math.ceil(totalWords / 200);

  const saveTargets = useCallback(() => {
    if (!activeProject?.id) return;
    updateProject(activeProject.id, {
      settings: {
        ...activeProject.settings,
        manuscriptTarget,
        sessionTarget,
      },
    });
  }, [activeProject, manuscriptTarget, sessionTarget, updateProject]);

  const manuscriptPct = manuscriptTarget > 0 ? Math.min(100, Math.round((totalWords / manuscriptTarget) * 100)) : 0;
  const sessionPct = sessionTarget > 0 ? Math.min(100, Math.round((sessionWords / sessionTarget) * 100)) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Statistics" width="520px">
      <div className={styles.container}>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalWords.toLocaleString()}</span>
            <span className={styles.statLabel}>Total Words</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{scenes.length}</span>
            <span className={styles.statLabel}>Scenes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{chapters.length}</span>
            <span className={styles.statLabel}>Chapters</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>~{estPages}</span>
            <span className={styles.statLabel}>Pages</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{estReadMin}m</span>
            <span className={styles.statLabel}>Reading Time</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{sceneStats.avg.toLocaleString()}</span>
            <span className={styles.statLabel}>Avg Scene</span>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Manuscript Target</h3>
          <div className={styles.targetRow}>
            <input
              type="number"
              className={styles.targetInput}
              value={manuscriptTarget || ''}
              onChange={e => setManuscriptTarget(Number(e.target.value) || 0)}
              onBlur={saveTargets}
              placeholder="e.g. 80000"
              min={0}
              step={1000}
            />
            <span className={styles.targetLabel}>words</span>
          </div>
          {manuscriptTarget > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${manuscriptPct}%` }} />
              </div>
              <span className={styles.progressText}>{totalWords.toLocaleString()} / {manuscriptTarget.toLocaleString()} ({manuscriptPct}%)</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Session Target</h3>
          <div className={styles.targetRow}>
            <input
              type="number"
              className={styles.targetInput}
              value={sessionTarget || ''}
              onChange={e => setSessionTarget(Number(e.target.value) || 0)}
              onBlur={saveTargets}
              placeholder="e.g. 1000"
              min={0}
              step={100}
            />
            <span className={styles.targetLabel}>words this session</span>
          </div>
          {sessionTarget > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={`${styles.progressFill} ${styles.sessionFill}`} style={{ width: `${sessionPct}%` }} />
              </div>
              <span className={styles.progressText}>{sessionWords.toLocaleString()} / {sessionTarget.toLocaleString()} ({sessionPct}%)</span>
            </div>
          )}
        </div>

        {sceneStats.count > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Scene Statistics</h3>
            <div className={styles.miniGrid}>
              <span>Shortest scene: <strong>{sceneStats.min.toLocaleString()} w</strong></span>
              <span>Longest scene: <strong>{sceneStats.max.toLocaleString()} w</strong></span>
              <span>Average: <strong>{sceneStats.avg.toLocaleString()} w</strong></span>
              <span>With content: <strong>{sceneStats.count} of {scenes.length}</strong></span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Writing History (Last 30 Days)</h3>
            <div className={styles.chartWrap}>
              {(() => {
                const maxW = Math.max(...history.map(h => h.wordsWritten), 1);
                let streak = 0;
                const dates = new Set(history.map(h => h.date));
                const d = new Date();
                while (dates.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
                return (
                  <>
                    <div className={styles.streakBadge}>
                      {streak > 0 ? `${streak}-day streak` : 'No streak'}
                    </div>
                    <div className={styles.chart}>
                      {history.slice(-14).map(h => (
                        <div key={h.date} className={styles.chartBar}>
                          <div className={styles.chartBarFill} style={{ height: `${(h.wordsWritten / maxW) * 100}%` }} />
                          <span className={styles.chartLabel}>{h.date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.chartTotal}>
                      Total: <strong>{history.reduce((a, h) => a + h.wordsWritten, 0).toLocaleString()}</strong> words over {history.length} day{history.length !== 1 ? 's' : ''}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
