import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import PanelMaxBtn from '../ui/PanelMaxBtn';
import styles from './VonnegutTimeline.module.css';
import type { CharacterAppearance } from '../../types';

/* ─── Layout constants ─── */
const PADDING_TOP = 70;
const PADDING_BOTTOM = 65;
const LABEL_GAP = 18;
const LABEL_PAD_LEFT = 10;
const LABEL_FONT_SIZE = 15;
const CHAR_PX_WIDTH = 9.5;
const AXIS_LABEL_X = 10; // fortune axis label inset from the line area
const FORTUNE_GRID = [0.25, 0.5, 0.75]; // horizontal guide lines

export default function VonnegutTimeline() {
  const chapters = useProjectStore((s) => s.chapters);
  const scenes = useProjectStore((s) => s.scenes);
  const characters = useProjectStore((s) => s.characters);
  const appearances = useProjectStore((s) => s.appearances);
  const timelineEvents = useProjectStore((s) => s.timelineEvents);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const createCharacter = useProjectStore((s) => s.createCharacter);
  const createTimelineEvent = useProjectStore((s) => s.createTimelineEvent);
  const updateTimelineEvent = useProjectStore((s) => s.updateTimelineEvent);
  const deleteTimelineEvent = useProjectStore((s) => s.deleteTimelineEvent);
  const updateAppearance = useProjectStore((s) => s.updateAppearance);
  const createAppearance = useProjectStore((s) => s.createAppearance);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const theme = useUIStore((s) => s.theme);

  const [hoveredChar, setHoveredChar] = useState<number | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string } | null>(null);
  const [showAddChar, setShowAddChar] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharColor, setNewCharColor] = useState('#5a9e9e');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventPos, setNewEventPos] = useState(0.5);
  const [newEventWidth, setNewEventWidth] = useState(0.05);
  const [newEventColor, setNewEventColor] = useState('#c4915e');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* ─── Drag state ─── */
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ position: number; fortune: number } | null>(null);
  const dragStartRef = useRef<{ id: number; startPos: number; startFortune: number } | null>(null);

  /* ─── Container size tracking ─── */
  const [containerW, setContainerW] = useState(600);
  const [containerH, setContainerH] = useState(400);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setContainerW(el.clientWidth);
      setContainerH(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ─── Auto-select first character if none selected ─── */
  useEffect(() => {
    if (characters.length > 0 && selectedCharId === null) {
      setSelectedCharId(characters[0].id!);
    }
    // Clear selection if the selected character was deleted
    if (selectedCharId !== null && !characters.find((c) => c.id === selectedCharId)) {
      setSelectedCharId(characters.length > 0 ? characters[0].id! : null);
    }
  }, [characters, selectedCharId]);

  /* ─── Left margin for character labels ─── */
  const leftMargin = useMemo(() => {
    if (characters.length === 0) return 60;
    const maxLen = Math.max(...characters.map((c) => c.name.length));
    return LABEL_PAD_LEFT + maxLen * CHAR_PX_WIDTH + LABEL_GAP;
  }, [characters]);

  /* ─── Dynamic dimensions ─── */
  const totalScenes = scenes.length;
  const contentWidth = Math.max(600, totalScenes * 80 + 200 + leftMargin);
  const timelineWidth = Math.max(contentWidth, containerW - 4);
  const lineAreaWidth = timelineWidth - leftMargin;
  const timelineHeight = Math.max(400, containerH);
  const plotTop = PADDING_TOP;
  const plotBottom = timelineHeight - PADDING_BOTTOM;
  const plotHeight = plotBottom - plotTop;

  /* ─── Coordinate mapping helpers ─── */
  const posToX = useCallback(
    (pos: number) => leftMargin + pos * lineAreaWidth,
    [leftMargin, lineAreaWidth]
  );
  const fortuneToY = useCallback(
    (f: number) => plotBottom - f * plotHeight, // 1 = top, 0 = bottom
    [plotBottom, plotHeight]
  );
  const svgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * timelineWidth,
        y: ((clientY - rect.top) / rect.height) * timelineHeight,
      };
    },
    [timelineWidth, timelineHeight]
  );
  const xToPos = useCallback(
    (x: number) => Math.max(0, Math.min(1, (x - leftMargin) / lineAreaWidth)),
    [leftMargin, lineAreaWidth]
  );
  const yToFortune = useCallback(
    (y: number) => Math.max(0, Math.min(1, (plotBottom - y) / plotHeight)),
    [plotBottom, plotHeight]
  );

  /* ─── Chapter divisions ─── */
  const chapterDivisions = useMemo(() => {
    const divs: { x: number; label: string }[] = [];
    let sceneOffset = 0;
    for (const chapter of chapters) {
      const chapterScenes = scenes
        .filter((s) => s.chapterId === chapter.id)
        .sort((a, b) => a.order - b.order);
      const x =
        totalScenes > 0
          ? leftMargin + (sceneOffset / totalScenes) * lineAreaWidth
          : leftMargin;
      divs.push({ x, label: chapter.title });
      sceneOffset += chapterScenes.length;
    }
    return divs;
  }, [chapters, scenes, totalScenes, leftMargin, lineAreaWidth]);

  /* ─── Build character paths using fortune for Y ─── */
  const charPaths = useMemo(() => {
    if (characters.length === 0) return [];
    const n = characters.length;
    return characters.map((char, idx) => {
      let charApps = appearances
        .filter((a) => a.characterId === char.id)
        .sort((a, b) => a.position - b.position);

      // Apply live drag override
      if (dragId !== null && dragPos) {
        charApps = charApps.map((a) =>
          a.id === dragId
            ? { ...a, position: dragPos.position, fortune: dragPos.fortune }
            : a
        );
        charApps.sort((a, b) => a.position - b.position);
      }

      const points = charApps.map((app) => ({
        x: posToX(app.position),
        y: fortuneToY(app.fortune ?? 0.5),
        appearance: app,
      }));

      // If no appearances, spread characters evenly across the fortune range
      // so their default lines don't all overlap at 0.5
      if (points.length === 0) {
        const spread = n > 1 ? 0.2 + (0.6 * (n - 1 - idx)) / (n - 1) : 0.5;
        const defaultY = fortuneToY(spread);
        return {
          character: char,
          points: [
            { x: leftMargin, y: defaultY, appearance: null as unknown as CharacterAppearance },
            { x: timelineWidth, y: defaultY, appearance: null as unknown as CharacterAppearance },
          ],
          hasData: false,
          defaultFortune: spread,
        };
      }

      return { character: char, points, hasData: true, defaultFortune: undefined as number | undefined };
    });
  }, [characters, appearances, posToX, fortuneToY, leftMargin, timelineWidth, dragId, dragPos]);

  /* ─── Check if any characters lack appearance data ─── */
  const hasAnyAppearances = charPaths.some((cp) => cp.hasData);

  /* ─── SVG path builder (smooth bezier curves) ─── */
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  /* ─── Handlers ─── */
  const handleAddCharacter = async () => {
    if (!newCharName.trim() || !activeProjectId) return;
    await createCharacter({ name: newCharName.trim(), color: newCharColor });
    setNewCharName('');
    setShowAddChar(false);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !activeProjectId) return;
    await createTimelineEvent({
      projectId: activeProjectId,
      title: newEventTitle.trim(),
      position: newEventPos,
      width: newEventWidth,
      color: newEventColor,
    });
    setNewEventTitle('');
    setNewEventPos(0.5);
    setNewEventWidth(0.05);
    setShowAddEvent(false);
  };

  /* ─── Editing event helpers ─── */
  const editingEvent = editingEventId !== null
    ? timelineEvents.find((e) => e.id === editingEventId) ?? null
    : null;

  /* ─── Drag handlers ─── */
  const handleDragStart = useCallback(
    (e: React.MouseEvent, app: CharacterAppearance) => {
      e.stopPropagation();
      if (!app.id) return;
      dragStartRef.current = {
        id: app.id,
        startPos: app.position,
        startFortune: app.fortune ?? 0.5,
      };
      setDragId(app.id);
      setDragPos({ position: app.position, fortune: app.fortune ?? 0.5 });
    },
    []
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStartRef.current) return;
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const pos = xToPos(x);
      const fort = yToFortune(y);
      setDragPos({ position: pos, fortune: fort });
    },
    [svgPoint, xToPos, yToFortune]
  );

  const handleDragEnd = useCallback(async () => {
    if (!dragStartRef.current || !dragPos) {
      dragStartRef.current = null;
      setDragId(null);
      setDragPos(null);
      return;
    }
    const { id } = dragStartRef.current;
    await updateAppearance(id, {
      position: Math.round(dragPos.position * 1000) / 1000,
      fortune: Math.round(dragPos.fortune * 1000) / 1000,
    });
    dragStartRef.current = null;
    setDragId(null);
    setDragPos(null);
  }, [dragPos, updateAppearance]);

  /* ─── Double-click to add appearance for the selected character ─── */
  const handleDoubleClick = useCallback(
    async (e: React.MouseEvent<SVGSVGElement>) => {
      if (!activeProjectId || !selectedCharId) return;
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const pos = xToPos(x);
      const fort = yToFortune(y);

      await createAppearance({
        characterId: selectedCharId,
        projectId: activeProjectId,
        position: Math.round(pos * 1000) / 1000,
        fortune: Math.round(fort * 1000) / 1000,
        note: '',
      });
    },
    [activeProjectId, selectedCharId, svgPoint, xToPos, yToFortune, createAppearance]
  );

  /* ─── Hover on control points ─── */
  const handleDotHover = useCallback(
    (e: React.MouseEvent, app: CharacterAppearance, charId: number) => {
      setHoveredChar(charId);
      if (app.note) {
        const el = scrollRef.current;
        if (!el) return;
        const scrollRect = el.getBoundingClientRect();
        setHoverInfo({
          x: e.clientX - scrollRect.left + el.scrollLeft,
          y: e.clientY - scrollRect.top + el.scrollTop,
          text: app.note,
        });
      }
    },
    []
  );

  /* ─── Click on control point → navigate to scene ─── */
  const handleDotClick = useCallback(
    (e: React.MouseEvent, app: CharacterAppearance) => {
      e.stopPropagation();
      if (app.sceneId) setActiveScene(app.sceneId);
    },
    [setActiveScene]
  );

  const mono = theme === 'matrix' ? "'JetBrains Mono'" : "'Inter'";

  /* ─── Mouse wheel fine adjustment for sliders ─── */
  const sliderWheel = (
    e: React.WheelEvent<HTMLInputElement>,
    value: number,
    setValue: (v: number) => void,
    step: number,
    min: number,
    max: number
  ) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setValue(Math.round(Math.max(min, Math.min(max, value + delta)) * 1000) / 1000);
  };

  return (
    <div className={styles.container}>
      {/* ──── Header ──── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>The Wallpaper</span>
          <PanelMaxBtn />
        </div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => setShowAddChar(!showAddChar)}>
            + Character
          </button>
          <button className={styles.actionBtn} onClick={() => setShowAddEvent(!showAddEvent)}>
            + Event
          </button>
        </div>
      </div>

      {/* ──── Add character form ──── */}
      {showAddChar && (
        <motion.div className={styles.addForm} initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
          <input className={styles.formInput} placeholder="Character name" value={newCharName} onChange={(e) => setNewCharName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()} autoFocus />
          <input type="color" value={newCharColor} onChange={(e) => setNewCharColor(e.target.value)} className={styles.colorPicker} />
          <button className={styles.formBtn} onClick={handleAddCharacter}>Add</button>
        </motion.div>
      )}

      {/* ──── Add event form ──── */}
      {showAddEvent && (
        <motion.div className={styles.eventForm} initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
          <div className={styles.eventFormRow}>
            <input className={styles.formInput} placeholder="Event title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()} autoFocus />
            <input type="color" value={newEventColor} onChange={(e) => setNewEventColor(e.target.value)} className={styles.colorPicker} />
            <button className={styles.formBtn} onClick={handleAddEvent}>Add</button>
          </div>
          <div className={styles.eventFormRow}>
            <span className={styles.sliderLabel}>Pos</span>
            <input type="range" min={0} max={1} step={0.01} value={newEventPos} onChange={(e) => setNewEventPos(parseFloat(e.target.value))} onWheel={(e) => sliderWheel(e, newEventPos, setNewEventPos, 0.01, 0, 1)} className={styles.slider} />
            <span className={styles.sliderLabel}>Width</span>
            <input type="range" min={0.01} max={0.3} step={0.005} value={newEventWidth} onChange={(e) => setNewEventWidth(parseFloat(e.target.value))} onWheel={(e) => sliderWheel(e, newEventWidth, setNewEventWidth, 0.005, 0.01, 0.3)} className={styles.slider} />
          </div>
        </motion.div>
      )}

      {/* ──── Edit event form ──── */}
      {editingEvent && (
        <motion.div className={styles.eventForm} initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
          <div className={styles.eventFormRow}>
            <input
              className={styles.formInput}
              value={editingEvent.title}
              onChange={(e) => updateTimelineEvent(editingEvent.id!, { title: e.target.value })}
            />
            <input
              type="color"
              value={editingEvent.color}
              onChange={(e) => updateTimelineEvent(editingEvent.id!, { color: e.target.value })}
              className={styles.colorPicker}
            />
            <button className={styles.doneBtn} onClick={() => setEditingEventId(null)}>Done</button>
            <button className={styles.deleteBtn} onClick={async () => { await deleteTimelineEvent(editingEvent.id!); setEditingEventId(null); }}>Delete</button>
          </div>
          <div className={styles.eventFormRow}>
            <span className={styles.sliderLabel}>Pos</span>
            <input type="range" min={0} max={1} step={0.01} value={editingEvent.position} onChange={(e) => updateTimelineEvent(editingEvent.id!, { position: parseFloat(e.target.value) })} onWheel={(e) => sliderWheel(e, editingEvent.position, (v) => updateTimelineEvent(editingEvent.id!, { position: v }), 0.01, 0, 1)} className={styles.slider} />
            <span className={styles.sliderLabel}>Width</span>
            <input type="range" min={0.01} max={0.3} step={0.005} value={editingEvent.width} onChange={(e) => updateTimelineEvent(editingEvent.id!, { width: parseFloat(e.target.value) })} onWheel={(e) => sliderWheel(e, editingEvent.width, (v) => updateTimelineEvent(editingEvent.id!, { width: v }), 0.005, 0.01, 0.3)} className={styles.slider} />
          </div>
        </motion.div>
      )}

      {/* ──── Legend — click to select active character ──── */}
      {characters.length > 0 && (
        <div className={styles.legend}>
          {characters.map((char) => {
            const isSelected = selectedCharId === char.id;
            return (
              <div
                key={char.id}
                className={`${styles.legendItem} ${isSelected ? styles.legendSelected : ''} ${hoveredChar === char.id ? styles.legendActive : ''}`}
                onClick={() => setSelectedCharId(char.id!)}
                onMouseEnter={() => setHoveredChar(char.id!)}
                onMouseLeave={() => setHoveredChar(null)}
                style={isSelected ? { borderColor: char.color } : undefined}
              >
                <span className={styles.legendDot} style={{ backgroundColor: char.color }} />
                <span className={styles.legendName}>{char.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ──── Hint when characters exist but have no timeline data ──── */}
      {characters.length > 0 && !hasAnyAppearances && (
        <div className={styles.hint}>
          Select a character above, then double-click on the timeline to add story points. Drag points to adjust.
        </div>
      )}

      {/* ──── Timeline SVG ──── */}
      <div ref={scrollRef} className={styles.scrollArea}>
        <svg
          ref={svgRef}
          width={timelineWidth}
          height={timelineHeight}
          className={styles.svg}
          onMouseMove={dragId ? handleDragMove : undefined}
          onMouseUp={dragId ? handleDragEnd : undefined}
          onMouseLeave={dragId ? handleDragEnd : undefined}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: dragId ? 'grabbing' : undefined }}
        >
          <defs>
            {/* Clip path to keep line-area content from bleeding into the label column */}
            <clipPath id="lineAreaClip">
              <rect x={leftMargin} y={0} width={timelineWidth - leftMargin} height={timelineHeight} />
            </clipPath>
            {/* Glow filters per character */}
            {characters.map((char) => (
              <filter key={char.id} id={`glow-${char.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* ──── Fortune grid lines ──── */}
          {FORTUNE_GRID.map((f) => {
            const y = fortuneToY(f);
            return (
              <line
                key={f}
                x1={leftMargin}
                y1={y}
                x2={timelineWidth}
                y2={y}
                stroke="var(--divider)"
                strokeWidth={f === 0.5 ? 1 : 0.5}
                strokeDasharray={f === 0.5 ? '8,4' : '3,6'}
                opacity={f === 0.5 ? 0.6 : 0.3}
              />
            );
          })}

          {/* Fortune axis labels */}
          <text
            x={leftMargin + AXIS_LABEL_X}
            y={plotTop + 6}
            className={styles.axisLabel}
            fontFamily={mono}
          >
            Good Fortune
          </text>
          <text
            x={leftMargin + AXIS_LABEL_X}
            y={plotBottom - 4}
            className={styles.axisLabel}
            fontFamily={mono}
          >
            Ill Fortune
          </text>

          {/* ──── Chapter division lines ──── */}
          {chapterDivisions.map((div, i) => (
            <g key={i}>
              <line
                x1={div.x}
                y1={plotTop - 20}
                x2={div.x}
                y2={plotBottom + 5}
                stroke="var(--timeline-grid)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text
                x={div.x + 8}
                y={plotTop - 28}
                fill="var(--text-secondary)"
                fontSize={14}
                fontWeight={600}
                fontFamily={mono}
              >
                {div.label}
              </text>
            </g>
          ))}

          {/* ──── Event bands with gradient (clipped to line area) ──── */}
          <g clipPath="url(#lineAreaClip)">
          {timelineEvents.map((event) => {
            const x = posToX(event.position);
            const w = event.width * lineAreaWidth;
            const isEditing = editingEventId === event.id;
            return (
              <g key={event.id}>
                {/* Gradient definition */}
                <linearGradient id={`evtGrad-${event.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={event.color} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={event.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={event.color} stopOpacity={0.25} />
                </linearGradient>
                <rect
                  x={x - w / 2}
                  y={plotTop - 5}
                  width={w}
                  height={plotHeight + 10}
                  fill={`url(#evtGrad-${event.id})`}
                  rx={4}
                />
                {/* Cross-hatching */}
                <pattern
                  id={`hatch-${event.id}`}
                  width={6}
                  height={6}
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1={0} y1={0} x2={0} y2={6} stroke={event.color} strokeWidth={1} opacity={0.15} />
                </pattern>
                <rect
                  x={x - w / 2}
                  y={plotTop - 5}
                  width={w}
                  height={plotHeight + 10}
                  fill={`url(#hatch-${event.id})`}
                  rx={4}
                />
                {/* Editing highlight outline */}
                {isEditing && (
                  <rect
                    x={x - w / 2}
                    y={plotTop - 5}
                    width={w}
                    height={plotHeight + 10}
                    fill="none"
                    stroke={event.color}
                    strokeWidth={2}
                    strokeDasharray="6,3"
                    rx={4}
                    opacity={0.8}
                  />
                )}
                {/* Clickable event label */}
                <text
                  x={x}
                  y={plotBottom + 18}
                  textAnchor="middle"
                  fill={event.color}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily={mono}
                  opacity={0.9}
                  transform={`rotate(-30, ${x}, ${plotBottom + 18})`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setEditingEventId(isEditing ? null : event.id!); }}
                >
                  {event.title}
                </text>
              </g>
            );
          })}

          {/* ──── Live preview band while adding ──── */}
          {showAddEvent && (() => {
            const px = posToX(newEventPos);
            const pw = newEventWidth * lineAreaWidth;
            return (
              <g>
                <rect
                  x={px - pw / 2}
                  y={plotTop - 5}
                  width={pw}
                  height={plotHeight + 10}
                  fill={newEventColor}
                  opacity={0.1}
                  rx={4}
                />
                <rect
                  x={px - pw / 2}
                  y={plotTop - 5}
                  width={pw}
                  height={plotHeight + 10}
                  fill="none"
                  stroke={newEventColor}
                  strokeWidth={2}
                  strokeDasharray="8,4"
                  rx={4}
                  opacity={0.7}
                />
                {newEventTitle && (
                  <text
                    x={px}
                    y={plotBottom + 18}
                    textAnchor="middle"
                    fill={newEventColor}
                    fontSize={12}
                    fontWeight={700}
                    fontFamily={mono}
                    opacity={0.6}
                    transform={`rotate(-30, ${px}, ${plotBottom + 18})`}
                  >
                    {newEventTitle}
                  </text>
                )}
              </g>
            );
          })()}
          </g>

          {/* ──── Character lines ──── */}
          {charPaths.map((cp) => {
            const isHovered = hoveredChar === cp.character.id;
            const isSelected = selectedCharId === cp.character.id;
            const isHighlighted = hoveredChar === null ? true : isHovered;
            const isActive = isSelected || isHovered; // extra emphasis
            const pathD = buildPath(cp.points);

            return (
              <g key={cp.character.id}>
                {/* Character name label — right-aligned, same Y as the average line position */}
                <text
                  x={leftMargin - LABEL_GAP}
                  y={
                    cp.points.length > 0
                      ? cp.points.reduce((s, p) => s + p.y, 0) / cp.points.length
                      : fortuneToY(0.5)
                  }
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={cp.character.color}
                  fontSize={LABEL_FONT_SIZE}
                  fontWeight={700}
                  fontFamily={mono}
                  opacity={isHighlighted ? 0.9 : 0.25}
                  style={{ transition: 'opacity 0.3s' }}
                >
                  {cp.character.name}
                </text>

                {/* Glow line (background) */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={cp.character.color}
                    strokeWidth={isActive ? 10 : 6}
                    opacity={isActive ? 0.2 : 0.12}
                    strokeLinecap="round"
                    filter={`url(#glow-${cp.character.id})`}
                  />
                )}

                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={cp.character.color}
                  strokeWidth={isActive ? 3 : isHighlighted ? 2.5 : 1.5}
                  strokeLinecap="round"
                  className={isHighlighted ? styles.charPath : styles.charPathDim}
                  style={{ '--glow-color': cp.character.color } as React.CSSProperties}
                />

                {/* Control points */}
                {cp.hasData &&
                  cp.points.map((pt, i) => {
                    const app = pt.appearance;
                    const isDragging = dragId === app?.id;
                    const isDeath = app?.isDeath;
                    const r = isDragging ? 9 : isDeath ? 7 : 6;

                    return (
                      <g key={i}>
                        {/* Outer halo on hover/drag */}
                        {(isDragging || (isHighlighted && hoveredChar === cp.character.id)) && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={r + 5}
                            fill={cp.character.color}
                            opacity={0.12}
                          />
                        )}

                        {/* Main dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={r}
                          fill={isDeath ? '#e55' : cp.character.color}
                          opacity={isHighlighted ? 0.9 : 0.2}
                          className={isDragging ? styles.controlDotDragging : styles.controlDot}
                          style={{ '--glow-color': cp.character.color } as React.CSSProperties}
                          onMouseDown={(e) => app?.id && handleDragStart(e, app)}
                          onMouseEnter={(e) => app?.id && handleDotHover(e, app, cp.character.id!)}
                          onMouseLeave={() => {
                            if (!dragId) {
                              setHoveredChar(null);
                              setHoverInfo(null);
                            }
                          }}
                          onClick={(e) => app?.id && handleDotClick(e, app)}
                        />

                        {/* Death mark — X */}
                        {isDeath && (
                          <g
                            transform={`translate(${pt.x}, ${pt.y})`}
                            opacity={isHighlighted ? 0.9 : 0.3}
                            className={styles.deathMark}
                          >
                            <line x1={-5} y1={-5} x2={5} y2={5} stroke="#e55" strokeWidth={2.5} />
                            <line x1={5} y1={-5} x2={-5} y2={5} stroke="#e55" strokeWidth={2.5} />
                          </g>
                        )}
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* ──── Drag tooltip (HTML overlay) ──── */}
        {dragId && dragPos && (
          <div
            className={styles.dragTooltip}
            style={{
              left: posToX(dragPos.position),
              top: fortuneToY(dragPos.fortune) - 20,
            }}
          >
            fortune: {dragPos.fortune.toFixed(2)}
          </div>
        )}

        {/* ──── Hover tooltip (HTML overlay) ──── */}
        {hoverInfo && !dragId && (
          <div
            className={styles.hoverTooltip}
            style={{ left: hoverInfo.x, top: hoverInfo.y }}
          >
            {hoverInfo.text}
          </div>
        )}
      </div>

      {/* ──── Empty state ──── */}
      {characters.length === 0 && (
        <div className={styles.empty}>
          <p>Add characters to see their threads</p>
          <p className={styles.emptyHint}>
            Each character becomes a colored line through your story — rising and falling with fortune
          </p>
        </div>
      )}
    </div>
  );
}
