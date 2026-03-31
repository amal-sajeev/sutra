import { useProjectStore } from '../../stores/projectStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useState } from 'react';
import Modal from '../ui/Modal';
import styles from './TrashView.module.css';

interface TrashViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrashView({ isOpen, onClose }: TrashViewProps) {
  const trashItems = useProjectStore(s => s.trashItems);
  const restoreTrashItem = useProjectStore(s => s.restoreTrashItem);
  const deleteTrashItem = useProjectStore(s => s.deleteTrashItem);
  const emptyTrash = useProjectStore(s => s.emptyTrash);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trash" width="520px">
      <div className={styles.container}>
        {trashItems.length > 0 && (
          <div className={styles.header}>
            <span className={styles.count}>{trashItems.length} item{trashItems.length !== 1 ? 's' : ''} in trash</span>
            <button className={styles.emptyBtn} onClick={() => setConfirmEmpty(true)}>Empty Trash</button>
          </div>
        )}

        {trashItems.length === 0 ? (
          <div className={styles.empty}><p>Trash is empty</p></div>
        ) : (
          <div className={styles.list}>
            {trashItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemType}>{item.itemType}</span>
                  <span className={styles.itemTitle}>{item.originalTitle}</span>
                  <span className={styles.itemDate}>{formatDate(item.deletedAt)}</span>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.restoreBtn} onClick={() => restoreTrashItem(item.id!)}>Restore</button>
                  <button className={styles.deleteBtn} onClick={() => deleteTrashItem(item.id!)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmEmpty}
        title="Empty Trash"
        message="Permanently delete all items in the trash? This cannot be undone."
        confirmLabel="Empty Trash"
        onConfirm={() => { emptyTrash(); setConfirmEmpty(false); }}
        onCancel={() => setConfirmEmpty(false)}
      />
    </Modal>
  );
}
