import { useState, useEffect } from 'react';
import styles from './DuplicateTabWarning.module.css';

export default function DuplicateTabWarning() {
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('sutra-tab-check');
    const tabId = `${Date.now()}-${Math.random()}`;

    channel.postMessage({ type: 'ping', tabId });

    channel.onmessage = (e) => {
      if (e.data.type === 'ping' && e.data.tabId !== tabId) {
        setIsDuplicate(true);
        channel.postMessage({ type: 'pong', tabId });
      }
      if (e.data.type === 'pong' && e.data.tabId !== tabId) {
        setIsDuplicate(true);
      }
    };

    return () => channel.close();
  }, []);

  if (!isDuplicate) return null;

  return (
    <div className={styles.warning} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        ⚠
      </span>
      <span className={styles.text}>
        Sutra is open in another tab. Editing in multiple tabs may cause data conflicts.
      </span>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setIsDuplicate(false)}
        aria-label="Dismiss duplicate tab warning"
      >
        Dismiss
      </button>
    </div>
  );
}
