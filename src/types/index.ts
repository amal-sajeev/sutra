/* ==============================
   Sutra — Data Model Types
   ============================== */

export interface Project {
  id?: number;
  title: string;
  oneSentence?: string;
  oneParag?: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  theme?: 'lain' | 'matrix' | 'light';
  typewriterMode?: boolean;
  focusMode?: boolean;
  digitalRain?: boolean;
  editorFont?: string;
  editorSize?: number;
  lineSpacing?: number;
  manuscriptTarget?: number;
  sessionTarget?: number;
  authorName?: string;
  labels?: ProjectLabel[];
  exportDefaults?: Partial<ExportOptions>;
  revisionMode?: boolean;
  revisionRound?: number;
}

export interface ProjectLabel {
  name: string;
  color: string;
}

export interface Chapter {
  id?: number;
  projectId: number;
  title: string;
  order: number;
  sectionType?: string;
}

export interface Scene {
  id?: number;
  chapterId: number;
  projectId: number;
  title: string;
  content: string; // TipTap JSON string
  order: number;
  synopsis?: string;
  notes?: string;
  status: 'draft' | 'revision' | 'final';
  /** ISO date string (YYYY-MM-DD) for in-story timeline anchoring */
  storyDate?: string;
  label?: string;
  tags?: string[];
  wordTarget?: number;
  lastEditedAt: number;
  sectionType?: string;
  customMeta?: Record<string, string>;
}

/** Built-in scene starter content (TipTap JSON string) for templates in sceneTemplates.ts */
export interface SceneTemplate {
  id: string;
  name: string;
  content: string; // TipTap JSON string
  category: 'built-in' | 'custom';
}

export interface ParagraphStyle {
  id?: number;
  projectId: number;
  name: string;
  type: 'paragraph' | 'character';
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
  lineSpacing?: number;
  spaceAfter?: number;
}

export const SECTION_TYPES = [
  'Part',
  'Chapter',
  'Scene',
  'Prologue',
  'Epilogue',
  'Front Matter',
  'Back Matter',
  'Chapter Heading',
  'Part Heading',
  'Title Page',
  'Copyright',
  'Dedication',
  'Epigraph',
  'Table of Contents',
  'Appendix',
  'Notes',
  'Bibliography',
] as const;

export interface Character {
  id?: number;
  projectId: number;
  name: string;
  color: string;
  description?: string;
  role?: string;
  motivation?: string;
  goal?: string;
  conflict?: string;
  epiphany?: string;
  age?: string;
  gender?: string;
  appearance?: string;
  backstory?: string;
  arc?: string;
  notes?: string;
  tags?: string[];
}

export interface Location {
  id?: number;
  projectId: number;
  name: string;
  description?: string;
  parentId?: number;
  tags?: string[];
}

export interface Relationship {
  id?: number;
  projectId: number;
  characterAId: number;
  characterBId: number;
  type: 'ally' | 'rival' | 'mentor' | 'love' | 'family' | 'enemy' | 'other';
  label?: string;
}

export interface Idea {
  id?: number;
  projectId: number;
  content: string;
  createdAt: number;
  tags: string[];
  linkedSceneId?: number;
  tfidfVector?: number[];
}

export interface TimelineEvent {
  id?: number;
  projectId: number;
  title: string;
  position: number; // 0-1 on story axis
  width: number;
  color: string;
  description?: string;
}

export interface CharacterAppearance {
  id?: number;
  characterId: number;
  projectId: number;
  sceneId?: number;
  timelineEventId?: number;
  position: number; // 0-1 on story axis
  fortune: number;  // 0-1 vertical axis: 0 = ill fortune, 0.5 = neutral, 1 = good fortune
  note?: string;
  isDeath?: boolean;
}

export interface Snapshot {
  id?: number;
  sceneId: number;
  projectId: number;
  name: string;
  note?: string;
  content: string; // TipTap JSON string
  createdAt: number;
}

export interface NoteDocument {
  id?: number;
  projectId: number;
  title: string;
  content: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface WritingHistory {
  id?: number;
  projectId: number;
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  totalWords: number;
}

export interface TrashItem {
  id?: number;
  projectId: number;
  itemType: 'scene' | 'chapter' | 'character';
  data: string; // JSON-serialized original object
  deletedAt: number;
  originalTitle: string;
}

export interface Comment {
  id?: number;
  projectId: number;
  sceneId: number;
  selectedText: string;
  body: string;
  createdAt: number;
  resolved: boolean;
}

/* ==============================
   Export Types
   ============================== */

export type ExportFormat = 'markdown' | 'plaintext' | 'html' | 'epub' | 'docx' | 'rtf' | 'pdf' | 'json';

export type ExportScope = 'full' | 'chapter' | 'scene';

export type SceneSeparator = 'blank' | 'asterisks' | 'rule' | 'hash' | 'none';

export type PageSize = 'letter' | 'a4' | 'a5' | '6x9';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  scopeId?: number;
  includeTitle: boolean;
  includeChapterHeadings: boolean;
  includeSceneTitles: boolean;
  sceneSeparator: SceneSeparator;
  includeSynopsis: boolean;
  includeFrontMatter: boolean;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  pageSize: PageSize;
  authorName: string;
  chapterPageBreaks: boolean;
}

export interface CompilePreset {
  id?: number;
  projectId: number;
  name: string;
  isBuiltIn: boolean;
  options: ExportOptions;
}

export interface Collection {
  id?: number;
  projectId: number;
  name: string;
  type: 'manual' | 'smart';
  sceneIds?: number[];
  rules?: CollectionRule[];
}

export interface CollectionRule {
  field: 'status' | 'label' | 'tag' | 'chapter';
  operator: 'equals' | 'contains' | 'not_equals';
  value: string;
}

export interface Asset {
  id?: number;
  projectId: number;
  filename: string;
  mimeType: string;
  data: Blob;
  createdAt: number;
}

/* ==============================
   UI State Types
   ============================== */

export type ThemeMode = 'lain' | 'matrix' | 'light';

export type RightPanelView =
  | 'timeline'
  | 'constellation'
  | 'characters'
  | 'snapshots'
  | 'nameGenerator'
  | 'none';

export type CenterView = 'editor' | 'corkboard' | 'outliner' | 'scrivenings' | 'plotBeats';

export interface BinderItem {
  type: 'chapter' | 'scene';
  id: number;
  title: string;
  children?: BinderItem[];
  lastEditedAt?: number;
}
