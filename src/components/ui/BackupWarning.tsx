import { useState, useEffect } from 'react';
import { isBackupWarningDismissed, dismissBackupWarning, requestPersistentStorage } from '../../utils/backup';
import { useToastStore } from '../../stores/toastStore';
import styles from './BackupWarning.module.css';

export default function BackupWarning() {
  const [visible, setVisible] = useState(() => !isBackupWarningDismissed());
  const [persisted, setPersisted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    void navigator.storage?.persisted?.().then((p) => setPersisted(p));
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    dismissBackupWarning();
    setVisible(false);
  };

  const handlePersist = async () => {
    setRequesting(true);
    try {
      const result = await requestPersistentStorage();
      setPersisted(result);
      if (result) {
        addToast('Persistent storage enabled — your data is protected from automatic eviction.', 'success');
      } else {
        addToast('Browser denied persistent storage. Try bookmarking the site or adding it to your home screen, then try again.', 'error', 6000);
      }
    } catch {
      addToast('Failed to request persistent storage.', 'error');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className={styles.text}>
          <strong>Your manuscripts are stored in the browser.</strong>
          {' '}
          Clearing site data will delete everything. Use Export (JSON backup) regularly, or enable persistent storage.
        </div>
        <div className={styles.actions}>
          {!persisted && (
            <button type="button" className={styles.persistBtn} onClick={handlePersist} disabled={requesting}>
              {requesting ? 'Requesting…' : 'Enable Persistent Storage'}
            </button>
          )}
          {persisted && <span className={styles.persistOk}>Storage is persistent ✓</span>}
          <button type="button" className={styles.dismissBtn} onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
