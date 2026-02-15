import { useEffect, useState, useRef, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import type { Character, Relationship } from '../../types';
import PanelMaxBtn from '../ui/PanelMaxBtn';
import styles from './CharacterWeb.module.css';

interface CharNode extends SimulationNodeDatum {
  id: number;
  character: Character;
}

interface CharLink extends SimulationLinkDatum<CharNode> {
  relationship: Relationship;
}

const VIEWBOX_SIZE = 500;
const TARGET_FONT_PX = 14; // desired on-screen pixel size for labels
const TARGET_FONT_SM = 11; // desired on-screen pixel size for initials
const TARGET_FONT_REL = 12; // desired on-screen pixel size for relationship labels
const TARGET_NODE_R = 16; // desired on-screen pixel radius for nodes
const TARGET_GLOW_R = 22; // desired on-screen pixel radius for glow
const TARGET_NAME_OFFSET = 28; // y offset for name below node

const RELATIONSHIP_TYPES: Relationship['type'][] = ['ally', 'rival', 'mentor', 'love', 'family', 'enemy', 'other'];
const RELATIONSHIP_COLORS: Record<string, string> = {
  ally: '#5a9e9e',
  rival: '#e55555',
  mentor: '#c4915e',
  love: '#d46a9e',
  family: '#7ab85e',
  enemy: '#e55555',
  other: '#888888',
};

export default function CharacterWeb() {
  const characters = useProjectStore((s) => s.characters);
  const relationships = useProjectStore((s) => s.relationships);
  const createCharacter = useProjectStore((s) => s.createCharacter);
  const deleteCharacter = useProjectStore((s) => s.deleteCharacter);
  const createRelationship = useProjectStore((s) => s.createRelationship);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const [nodes, setNodes] = useState<CharNode[]>([]);
  const [links, setLinks] = useState<CharLink[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddRel, setShowAddRel] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#5a9e9e');
  const [relFrom, setRelFrom] = useState<number | ''>('');
  const [relTo, setRelTo] = useState<number | ''>('');
  const [relType, setRelType] = useState<Relationship['type']>('ally');
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // scale factor: how many screen pixels per SVG unit
  const [pxPerUnit, setPxPerUnit] = useState(1);

  // Track container size so we can compensate SVG text scaling
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPxPerUnit(w / VIEWBOX_SIZE);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Convert a desired screen-pixel size to SVG units
  const px = useCallback((screenPx: number) => screenPx / pxPerUnit, [pxPerUnit]);

  useEffect(() => {
    if (characters.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    const charNodes: CharNode[] = characters
      .filter((c) => c.id !== undefined)
      .map((c) => ({
        id: c.id!,
        character: c,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
      }));

    const nodeMap = new Map(charNodes.map((n) => [n.id, n]));

    const charLinks: CharLink[] = relationships
      .filter((r) => nodeMap.has(r.characterAId) && nodeMap.has(r.characterBId))
      .map((r) => ({
        source: nodeMap.get(r.characterAId)!,
        target: nodeMap.get(r.characterBId)!,
        relationship: r,
      }));

    const simulation = forceSimulation(charNodes)
      .force('link', forceLink<CharNode, CharLink>(charLinks).id((d) => d.id).distance(100))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(35))
      .alpha(0.8);

    simulation.on('tick', () => {
      setNodes([...charNodes]);
      setLinks([...charLinks]);
    });

    return () => { simulation.stop(); };
  }, [characters, relationships]);

  const handleAddChar = async () => {
    if (!newName.trim() || !activeProjectId) return;
    await createCharacter({ name: newName.trim(), color: newColor });
    setNewName('');
    setShowAddChar(false);
  };

  const handleAddRel = async () => {
    if (!relFrom || !relTo || relFrom === relTo || !activeProjectId) return;
    await createRelationship({
      projectId: activeProjectId,
      characterAId: relFrom as number,
      characterBId: relTo as number,
      type: relType,
    });
    setRelFrom('');
    setRelTo('');
    setShowAddRel(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Character Web</span>
          <PanelMaxBtn />
        </div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => setShowAddChar(!showAddChar)}>
            + Character
          </button>
          <button className={styles.actionBtn} onClick={() => setShowAddRel(!showAddRel)}>
            + Relation
          </button>
        </div>
      </div>

      {showAddChar && (
        <motion.div className={styles.form} initial={{ height: 0 }} animate={{ height: 'auto' }}>
          <input
            className={styles.formInput}
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChar()}
            autoFocus
          />
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className={styles.colorPicker} />
          <button className={styles.formBtn} onClick={handleAddChar}>Add</button>
        </motion.div>
      )}

      {showAddRel && (
        <motion.div className={styles.form} initial={{ height: 0 }} animate={{ height: 'auto' }}>
          <select className={styles.formSelect} value={relFrom} onChange={(e) => setRelFrom(Number(e.target.value))}>
            <option value="">From...</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={styles.formSelect} value={relType} onChange={(e) => setRelType(e.target.value as Relationship['type'])}>
            {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={styles.formSelect} value={relTo} onChange={(e) => setRelTo(Number(e.target.value))}>
            <option value="">To...</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className={styles.formBtn} onClick={handleAddRel}>Link</button>
        </motion.div>
      )}

      <div ref={wrapRef} className={styles.svgWrap}>
        <svg ref={svgRef} className={styles.svg} viewBox="-250 -250 500 500">
          <defs>
            <filter id="charGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Relationship edges */}
          {links.map((link, i) => {
            const source = link.source as CharNode;
            const target = link.target as CharNode;
            const color = RELATIONSHIP_COLORS[link.relationship.type] || '#888';
            const midX = ((source.x || 0) + (target.x || 0)) / 2;
            const midY = ((source.y || 0) + (target.y || 0)) / 2;

            return (
              <g key={i}>
                <line
                  x1={source.x || 0}
                  y1={source.y || 0}
                  x2={target.x || 0}
                  y2={target.y || 0}
                  stroke={color}
                  strokeWidth={px(2)}
                  opacity={0.6}
                />
                <text
                  x={midX}
                  y={midY - px(6)}
                  textAnchor="middle"
                  fill={color}
                  fontSize={px(TARGET_FONT_REL)}
                  fontWeight={700}
                  opacity={0.9}
                >
                  {link.relationship.type}
                </text>
              </g>
            );
          })}

          {/* Character nodes */}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x || 0}, ${node.y || 0})`}
              onClick={() => setSelectedChar(selectedChar?.id === node.character.id ? null : node.character)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={px(TARGET_GLOW_R)}
                fill={node.character.color}
                opacity={0.15}
                filter="url(#charGlow)"
              />
              <circle
                r={px(TARGET_NODE_R)}
                fill={node.character.color}
                opacity={0.7}
              />
              <text
                y={px(1)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={px(TARGET_FONT_SM)}
                fontWeight={700}
              >
                {node.character.name.slice(0, 3).toUpperCase()}
              </text>
              <text
                y={px(TARGET_NAME_OFFSET)}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize={px(TARGET_FONT_PX)}
                fontWeight={600}
              >
                {node.character.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Character detail card */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardDot} style={{ background: selectedChar.color }} />
              <span className={styles.cardName}>{selectedChar.name}</span>
              <button className={styles.cardClose} onClick={() => setSelectedChar(null)}>x</button>
            </div>
            {selectedChar.role && <p className={styles.cardRole}>{selectedChar.role}</p>}
            {selectedChar.description && <p className={styles.cardDesc}>{selectedChar.description}</p>}
            {selectedChar.motivation && <p className={styles.cardField}><strong>Motivation:</strong> {selectedChar.motivation}</p>}
            {selectedChar.goal && <p className={styles.cardField}><strong>Goal:</strong> {selectedChar.goal}</p>}
            {selectedChar.conflict && <p className={styles.cardField}><strong>Conflict:</strong> {selectedChar.conflict}</p>}
            {selectedChar.epiphany && <p className={styles.cardField}><strong>Epiphany:</strong> {selectedChar.epiphany}</p>}
            <button
              className={styles.deleteCharBtn}
              onClick={() => { deleteCharacter(selectedChar.id!); setSelectedChar(null); }}
            >
              Delete Character
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {characters.length === 0 && (
        <div className={styles.empty}>
          <p>No characters yet</p>
          <p className={styles.emptyHint}>Add characters to see their relationships</p>
        </div>
      )}
    </div>
  );
}
