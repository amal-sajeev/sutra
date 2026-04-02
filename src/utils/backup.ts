import { exportProject } from '../db/operations';

const BACKUP_DISMISSED_KEY = 'sutra-backup-warning-dismissed';

/** Reserved for folder-handle persistence in a later phase. */
export const BACKUP_DIR_KEY = 'sutra-backup-dir-handle';

export function isBackupWarningDismissed(): boolean {
  return localStorage.getItem(BACKUP_DISMISSED_KEY) === 'true';
}

export function dismissBackupWarning(): void {
  localStorage.setItem(BACKUP_DISMISSED_KEY, 'true');
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  };

export async function pickBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    return await (window as DirectoryPickerWindow).showDirectoryPicker({ mode: 'readwrite' });
  } catch {
    return null;
  }
}

export async function saveBackupToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  projectId: number,
  projectTitle: string,
): Promise<void> {
  const data = await exportProject(projectId);
  const fileName = `${projectTitle.replace(/[<>:"/\\|?*]/g, '_')}.sutra.json`;
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
