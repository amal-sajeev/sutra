import { useEffect, useRef, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useIdeaStore } from '../../stores/ideaStore';
import type { Idea } from '../../types';
import PanelMaxBtn from '../ui/PanelMaxBtn';
import styles from './IdeaConstellation.module.css';

interface IdeaNode extends SimulationNodeDatum {
  id: number;
  idea: Idea;
}

interface IdeaLink extends SimulationLinkDatum<IdeaNode> {
  score: number;
}

export default function IdeaConstellation() {
  const ideas = useProjectStore((s) => s.ideas);
  const deleteIdea = useProjectStore((s) => s.deleteIdea);
  const similarities = useIdeaStore((s) => s.similarities);
  const rebuildIndex = useIdeaStore((s) => s.rebuildIndex);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<IdeaNode[]>([]);
  const [links, setLinks] = useState<IdeaLink[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [viewBox, setViewBox] = useState({ x: -300, y: -250, w: 600, h: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pxPerUnit, setPxPerUnit] = useState(1);

  // Track container width for SVG scaling compensation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPxPerUnit(w / viewBox.w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewBox.w]);

  // Convert desired screen pixels to SVG units
  const px = useCallback((screenPx: number) => screenPx / pxPerUnit, [pxPerUnit]);

  // Build index on mount
  useEffect(() => {
    rebuildIndex(ideas);
  }, [ideas, rebuildIndex]);

  // Run force simulation
  useEffect(() => {
    if (ideas.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    const ideaNodes: IdeaNode[] = ideas
      .filter((i) => i.id !== undefined)
      .map((idea) => ({
        id: idea.id!,
        idea,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
      }));

    const nodeMap = new Map(ideaNodes.map((n) => [n.id, n]));

    const ideaLinks: IdeaLink[] = similarities
      .filter((s) => nodeMap.has(s.idA) && nodeMap.has(s.idB) && s.score > 0.1)
      .map((s) => ({
        source: nodeMap.get(s.idA)!,
        target: nodeMap.get(s.idB)!,
        score: s.score,
      }));

    const simulation = forceSimulation(ideaNodes)
      .force('link', forceLink<IdeaNode, IdeaLink>(ideaLinks)
        .id((d) => d.id)
        .distance((d) => Math.max(30, 150 * (1 - d.score)))
        .strength((d) => d.score * 0.5)
      )
      .force('charge', forceManyBody().strength(-80))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(20))
      .alpha(0.8)
      .alphaDecay(0.02);

    simulation.on('tick', () => {
      setNodes([...ideaNodes]);
      setLinks([...ideaLinks]);
    });

    return () => { simulation.stop(); };
  }, [ideas, similarities]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setViewBox((v) => ({ ...v, x: v.x - dx * (v.w / 600), y: v.y - dy * (v.h / 600) }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((v) => {
      const newW = v.w * scale;
      const newH = v.h * scale;
      return {
        x: v.x - (newW - v.w) / 2,
        y: v.y - (newH - v.h) / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const selectedIdea = ideas.find((i) => i.id === selectedId);

  const hoveredIdea = ideas.find((i) => i.id === hoveredId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Idea Constellation</span>
          <PanelMaxBtn />
        </div>
        <span className={styles.count}>{ideas.length} threads</span>
      </div>

      <div className={styles.svgWrap} ref={containerRef}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Links */}
        {links.map((link, i) => {
          const source = link.source as IdeaNode;
          const target = link.target as IdeaNode;
          const isHighlighted = hoveredId === source.id || hoveredId === target.id;

          return (
            <line
              key={i}
              x1={source.x || 0}
              y1={source.y || 0}
              x2={target.x || 0}
              y2={target.y || 0}
              stroke={isHighlighted ? 'var(--accent-primary)' : 'var(--link-color)'}
              strokeWidth={isHighlighted ? px(2) : px(1)}
              opacity={isHighlighted ? 0.7 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          const isHovered = hoveredId === node.id;
          const hasTag = node.idea.tags.length > 0;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x || 0}, ${node.y || 0})`}
              onClick={() => setSelectedId(isSelected ? null : node.id)}
              onMouseEnter={(e) => {
                setHoveredId(node.id);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => { setHoveredId(null); setHoverPos(null); }}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow for hovered/selected */}
              {(isHovered || isSelected) && (
                <circle
                  r={px(14)}
                  fill="var(--node-glow)"
                  opacity={0.35}
                  filter="url(#softGlow)"
                />
              )}

              {/* Tag ring */}
              {hasTag && (
                <circle
                  r={px(10)}
                  fill="none"
                  stroke="var(--accent-warm)"
                  strokeWidth={px(1.5)}
                  opacity={0.5}
                />
              )}

              {/* Main node */}
              <circle
                r={isSelected ? px(7) : px(5)}
                fill="var(--node-fill)"
                opacity={isHovered || isSelected ? 1 : 0.8}
                filter="url(#glow)"
              />
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip — rendered in HTML so it uses CSS pixels */}
      {hoveredIdea && hoverPos && (
        <div
          className={styles.hoverTooltip}
          style={{ left: hoverPos.x, top: hoverPos.y - 12 }}
        >
          {hoveredIdea.content.slice(0, 60)}{hoveredIdea.content.length > 60 ? '...' : ''}
        </div>
      )}
      </div>

      {/* Selected idea detail */}
      {selectedIdea && (
        <motion.div
          className={styles.detail}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className={styles.detailContent}>
            <p>{selectedIdea.content}</p>
            {selectedIdea.tags.length > 0 && (
              <div className={styles.tags}>
                {selectedIdea.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            )}
            <div className={styles.detailMeta}>
              <span>{new Date(selectedIdea.createdAt).toLocaleDateString()}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => {
                  deleteIdea(selectedIdea.id!);
                  setSelectedId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {ideas.length === 0 && (
        <div className={styles.empty}>
          <p>No ideas captured yet</p>
          <p className={styles.emptyHint}>Press Ctrl+Space to capture a thought</p>
        </div>
      )}
    </div>
  );
}
