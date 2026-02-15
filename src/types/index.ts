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
  theme?: 'lain' | 'matrix';
  typewriterMode?: boolean;
  focusMode?: boolean;
  digitalRain?: boolean;
}

export interface Chapter {
  id?: number;
  projectId: number;
  title: string;
  order: number;
}

export interface Scene {
  id?: number;
  chapterId: number;
  projectId: number;
  title: string;
  content: string; // TipTap JSON string
  order: number;
  synopsis?: string;
  status: 'draft' | 'revision' | 'final';
  lastEditedAt: number;
}

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

/* ==============================
   UI State Types
   ============================== */

export type ThemeMode = 'lain' | 'matrix';

export type RightPanelView = 'timeline' | 'constellation' | 'characters' | 'snapshots' | 'none';

export interface BinderItem {
  type: 'chapter' | 'scene';
  id: number;
  title: string;
  children?: BinderItem[];
  lastEditedAt?: number;
}
