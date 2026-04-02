import { useState, useMemo } from 'react';
import { PLOT_TEMPLATES } from '../../utils/plotTemplates';
import { useProjectStore } from '../../stores/projectStore';
import styles from './PlotBeats.module.css';

export default function PlotBeats() {
  const scenes = useProjectStore((s) => s.scenes);
  const [templateId, setTemplateId] = useState('three-act');
  const [selectedBeat, setSelectedBeat] = useState<number | null>(null);

  const template = useMemo(
    () => PLOT_TEMPLATES.find((t) => t.id === templateId) || PLOT_TEMPLATES[0],
    [templateId]
  );

  const beatScenes = useMemo(() => {
    const map = new Map<string, typeof scenes>();
    for (const beat of template.beats) {
      const matched = scenes.filter((s) => s.customMeta?.beat === beat.name);
      map.set(beat.name, matched);
    }
    return map;
  }, [scenes, template]);

  const colors = [
    '#4488cc', '#5599dd', '#44aa88', '#88bb44', '#d4a745',
    '#dd8844', '#cc5566', '#aa44cc', '#6644cc', '#4466cc',
    '#448899', '#779944', '#bb6644', '#cc4488', '#5577bb',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Plot Beats</h2>
        <select
          className={styles.templateSelect}
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setSelectedBeat(null);
          }}
        >
          {PLOT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.track}>
        {template.beats.map((beat, i) => {
          const next = template.beats[i + 1];
          const width = next ? (next.position - beat.position) * 100 : (1 - beat.position) * 100;
          const sceneCount = beatScenes.get(beat.name)?.length || 0;
          const isSelected = selectedBeat === i;

          return (
            <div
              key={i}
              className={`${styles.beat} ${isSelected ? styles.beatSelected : ''}`}
              style={{ width: `${Math.max(width, 2)}%`, backgroundColor: colors[i % colors.length] }}
              onClick={() => setSelectedBeat(isSelected ? null : i)}
              title={beat.description}
            >
              <span className={styles.beatName}>{beat.name}</span>
              {sceneCount > 0 && (
                <span className={styles.beatCount}>{sceneCount}</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedBeat !== null && template.beats[selectedBeat] && (
        <div className={styles.detail}>
          <h3 className={styles.detailTitle}>{template.beats[selectedBeat].name}</h3>
          <p className={styles.detailDesc}>{template.beats[selectedBeat].description}</p>
          <div className={styles.detailScenes}>
            <span className={styles.detailLabel}>Scenes assigned:</span>
            {(beatScenes.get(template.beats[selectedBeat].name) || []).length === 0 ? (
              <span className={styles.noScenes}>None — assign scenes via Inspector → Custom Fields → &quot;beat&quot;</span>
            ) : (
              <ul className={styles.sceneList}>
                {(beatScenes.get(template.beats[selectedBeat].name) || []).map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
