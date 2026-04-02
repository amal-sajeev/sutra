import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { saveBackupToDirectory, isFileSystemAccessSupported } from '../utils/backup';

const LAST_BACKUP_KEY = 'sutra-last-backup';
const INTERVAL_KEY = 'sutra-backup-interval-min';

export interface UseAutoBackupOptions {
  /** Default 30. Clamped between 1 and 24 * 60. */
  defaultIntervalMinutes?: number;
}

export interface UseAutoBackupResult {
  performBackup: () => Promise<void>;
  setBackupDirectory: (handle: FileSystemDirectoryHandle) => void;
  clearBackupDirectory: () => void;
  getLastBackupTime: () => number;
  isSupported: boolean;
  intervalMinutes: number;
  setIntervalMinutes: (minutes: number) => void;
  hasBackupDirectory: boolean;
}

function readIntervalMinutes(fallback: number): number {
  const n = Number(localStorage.getItem(INTERVAL_KEY));
  if (Number.isFinite(n) && n >= 1 && n <= 24 * 60) return n;
  return fallback;
}

export function useAutoBackup(options?: UseAutoBackupOptions): UseAutoBackupResult {
  const defaultMin = options?.defaultIntervalMinutes ?? 30;
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProject = useProjectStore((s) => s.activeProject);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBackupRef = useRef<number>(0);
  const [backupDirectory, setBackupDirectoryState] = useState<FileSystemDirectoryHandle | null>(null);
  const [intervalMinutes, setIntervalMinutesState] = useState(() => readIntervalMinutes(defaultMin));

  useEffect(() => {
    const stored = Number(localStorage.getItem(LAST_BACKUP_KEY));
    if (Number.isFinite(stored) && stored > 0) lastBackupRef.current = stored;
  }, []);

  const performBackup = useCallback(async () => {
    if (!activeProjectId || !activeProject?.title || !backupDirectory) return;
    try {
      await saveBackupToDirectory(backupDirectory, activeProjectId, activeProject.title);
      const t = Date.now();
      lastBackupRef.current = t;
      localStorage.setItem(LAST_BACKUP_KEY, String(t));
    } catch (err) {
      console.warn('Auto-backup failed:', err);
    }
  }, [activeProjectId, activeProject?.title, backupDirectory]);

  const setBackupDirectory = useCallback((handle: FileSystemDirectoryHandle) => {
    setBackupDirectoryState(handle);
  }, []);

  const clearBackupDirectory = useCallback(() => {
    setBackupDirectoryState(null);
  }, []);

  const setIntervalMinutes = useCallback((minutes: number) => {
    const v = Math.max(1, Math.min(24 * 60, Math.round(minutes)));
    localStorage.setItem(INTERVAL_KEY, String(v));
    setIntervalMinutesState(v);
  }, []);

  const getLastBackupTime = useCallback(() => {
    return lastBackupRef.current || Number(localStorage.getItem(LAST_BACKUP_KEY)) || 0;
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(() => {
      if (backupDirectory) void performBackup();
    }, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeProjectId, performBackup, intervalMinutes, backupDirectory]);

  return {
    performBackup,
    setBackupDirectory,
    clearBackupDirectory,
    getLastBackupTime,
    isSupported: isFileSystemAccessSupported(),
    intervalMinutes,
    setIntervalMinutes,
    hasBackupDirectory: backupDirectory !== null,
  };
}
