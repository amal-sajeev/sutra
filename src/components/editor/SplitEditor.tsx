import { useEffect, useState } from 'react';
import { getScene } from '../../db/operations';
import type { Scene } from '../../types';
import Editor from './Editor';
import styles from './SplitEditor.module.css';

interface SplitEditorProps {
  sceneId: number;
}

export default function SplitEditor({ sceneId }: SplitEditorProps) {
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    getScene(sceneId).then((s) => setScene(s || null));
  }, [sceneId]);

  if (!scene) return null;

  return (
    <div className={styles.splitPane}>
      <div className={styles.divider} />
      <Editor scene={scene} />
    </div>
  );
}
