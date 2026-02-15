import { create } from 'zustand';
import type { Project, Chapter, Scene, Character, Relationship, Idea, TimelineEvent, CharacterAppearance, Snapshot } from '../types';
import * as ops from '../db/operations';

interface ProjectState {
  /* Current data */
  projects: Project[];
  activeProjectId: number | null;
  activeProject: Project | null;
  chapters: Chapter[];
  scenes: Scene[];
  characters: Character[];
  relationships: Relationship[];
  ideas: Idea[];
  timelineEvents: TimelineEvent[];
  appearances: CharacterAppearance[];
  snapshots: Snapshot[];
  activeSceneId: number | null;
  activeScene: Scene | null;
  splitSceneId: number | null;

  /* Loaders */
  loadProjects: () => Promise<void>;
  loadProject: (id: number) => Promise<void>;
  unloadProject: () => void;

  /* Project CRUD */
  createProject: (title: string) => Promise<number>;
  updateProject: (id: number, changes: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  /* Chapter CRUD */
  createChapter: (title: string) => Promise<number>;
  updateChapter: (id: number, changes: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: number) => Promise<void>;

  /* Scene CRUD */
  createScene: (chapterId: number, title: string) => Promise<number>;
  setActiveScene: (id: number | null) => Promise<void>;
  setSplitScene: (id: number | null) => void;
  updateScene: (id: number, changes: Partial<Scene>) => Promise<void>;
  deleteScene: (id: number) => Promise<void>;

  /* Character CRUD */
  createCharacter: (data: Partial<Character>) => Promise<number>;
  updateCharacter: (id: number, changes: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: number) => Promise<void>;

  /* Relationship CRUD */
  createRelationship: (data: Omit<Relationship, 'id'>) => Promise<number>;
  updateRelationship: (id: number, changes: Partial<Relationship>) => Promise<void>;
  deleteRelationship: (id: number) => Promise<void>;

  /* Idea CRUD */
  createIdea: (content: string, tags?: string[]) => Promise<number>;
  updateIdea: (id: number, changes: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: number) => Promise<void>;

  /* Timeline CRUD */
  createTimelineEvent: (data: Omit<TimelineEvent, 'id'>) => Promise<number>;
  updateTimelineEvent: (id: number, changes: Partial<TimelineEvent>) => Promise<void>;
  deleteTimelineEvent: (id: number) => Promise<void>;

  /* Appearances */
  createAppearance: (data: Omit<CharacterAppearance, 'id'>) => Promise<number>;
  updateAppearance: (id: number, changes: Partial<CharacterAppearance>) => Promise<void>;
  deleteAppearance: (id: number) => Promise<void>;

  /* Snapshots */
  createSnapshot: (sceneId: number, name: string, content: string, note?: string) => Promise<number>;
  loadSnapshots: (sceneId: number) => Promise<void>;
  deleteSnapshot: (id: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  activeProject: null,
  chapters: [],
  scenes: [],
  characters: [],
  relationships: [],
  ideas: [],
  timelineEvents: [],
  appearances: [],
  snapshots: [],
  activeSceneId: null,
  activeScene: null,
  splitSceneId: null,

  /* ---- Loaders ---- */
  loadProjects: async () => {
    const projects = await ops.getAllProjects();
    set({ projects });
  },

  loadProject: async (id) => {
    const project = await ops.getProject(id);
    if (!project) return;
    const chapters = await ops.getChapters(id);
    const scenes = await ops.getAllProjectScenes(id);
    const characters = await ops.getCharacters(id);
    const relationships = await ops.getRelationships(id);
    const ideas = await ops.getIdeas(id);
    const timelineEvents = await ops.getTimelineEvents(id);
    const appearances = await ops.getAppearances(id);
    set({
      activeProjectId: id,
      activeProject: project,
      chapters,
      scenes,
      characters,
      relationships,
      ideas,
      timelineEvents,
      appearances,
      activeSceneId: null,
      activeScene: null,
      splitSceneId: null,
      snapshots: [],
    });
  },

  unloadProject: () => {
    set({
      activeProjectId: null,
      activeProject: null,
      chapters: [],
      scenes: [],
      characters: [],
      relationships: [],
      ideas: [],
      timelineEvents: [],
      appearances: [],
      activeSceneId: null,
      activeScene: null,
      splitSceneId: null,
      snapshots: [],
    });
  },

  /* ---- Project CRUD ---- */
  createProject: async (title) => {
    const id = await ops.createProject(title);
    await get().loadProjects();
    return id;
  },

  updateProject: async (id, changes) => {
    await ops.updateProject(id, changes);
    const project = await ops.getProject(id);
    set({ activeProject: project || null });
    await get().loadProjects();
  },

  deleteProject: async (id) => {
    await ops.deleteProject(id);
    if (get().activeProjectId === id) get().unloadProject();
    await get().loadProjects();
  },

  /* ---- Chapter CRUD ---- */
  createChapter: async (title) => {
    const pid = get().activeProjectId;
    if (!pid) throw new Error('No active project');
    const id = await ops.createChapter(pid, title);
    const chapters = await ops.getChapters(pid);
    set({ chapters });
    return id;
  },

  updateChapter: async (id, changes) => {
    await ops.updateChapter(id, changes);
    const pid = get().activeProjectId!;
    const chapters = await ops.getChapters(pid);
    set({ chapters });
  },

  deleteChapter: async (id) => {
    await ops.deleteChapter(id);
    const pid = get().activeProjectId!;
    const chapters = await ops.getChapters(pid);
    const scenes = await ops.getAllProjectScenes(pid);
    set({ chapters, scenes });
  },

  /* ---- Scene CRUD ---- */
  createScene: async (chapterId, title) => {
    const pid = get().activeProjectId;
    if (!pid) throw new Error('No active project');
    const id = await ops.createScene(chapterId, pid, title);
    const scenes = await ops.getAllProjectScenes(pid);
    set({ scenes });
    return id;
  },

  setActiveScene: async (id) => {
    if (id === null) {
      set({ activeSceneId: null, activeScene: null, snapshots: [] });
      return;
    }
    const scene = await ops.getScene(id);
    set({ activeSceneId: id, activeScene: scene || null });
  },

  setSplitScene: (id) => set({ splitSceneId: id }),

  updateScene: async (id, changes) => {
    await ops.updateScene(id, changes);
    const pid = get().activeProjectId!;
    const scenes = await ops.getAllProjectScenes(pid);
    const activeScene = get().activeSceneId === id ? await ops.getScene(id) : get().activeScene;
    set({ scenes, activeScene: activeScene || null });
  },

  deleteScene: async (id) => {
    await ops.deleteScene(id);
    const pid = get().activeProjectId!;
    const scenes = await ops.getAllProjectScenes(pid);
    if (get().activeSceneId === id) set({ activeSceneId: null, activeScene: null, snapshots: [] });
    if (get().splitSceneId === id) set({ splitSceneId: null });
    set({ scenes });
  },

  /* ---- Character CRUD ---- */
  createCharacter: async (data) => {
    const pid = get().activeProjectId;
    if (!pid) throw new Error('No active project');
    const id = await ops.createCharacter(pid, data);
    const characters = await ops.getCharacters(pid);
    set({ characters });
    return id;
  },

  updateCharacter: async (id, changes) => {
    await ops.updateCharacter(id, changes);
    const characters = await ops.getCharacters(get().activeProjectId!);
    set({ characters });
  },

  deleteCharacter: async (id) => {
    await ops.deleteCharacter(id);
    const pid = get().activeProjectId!;
    const characters = await ops.getCharacters(pid);
    const relationships = await ops.getRelationships(pid);
    const appearances = await ops.getAppearances(pid);
    set({ characters, relationships, appearances });
  },

  /* ---- Relationship CRUD ---- */
  createRelationship: async (data) => {
    const id = await ops.createRelationship(data);
    const relationships = await ops.getRelationships(get().activeProjectId!);
    set({ relationships });
    return id;
  },

  updateRelationship: async (id, changes) => {
    await ops.updateRelationship(id, changes);
    const relationships = await ops.getRelationships(get().activeProjectId!);
    set({ relationships });
  },

  deleteRelationship: async (id) => {
    await ops.deleteRelationship(id);
    const relationships = await ops.getRelationships(get().activeProjectId!);
    set({ relationships });
  },

  /* ---- Idea CRUD ---- */
  createIdea: async (content, tags = []) => {
    const pid = get().activeProjectId;
    if (!pid) throw new Error('No active project');
    const id = await ops.createIdea(pid, content, tags);
    const ideas = await ops.getIdeas(pid);
    set({ ideas });
    return id;
  },

  updateIdea: async (id, changes) => {
    await ops.updateIdea(id, changes);
    const ideas = await ops.getIdeas(get().activeProjectId!);
    set({ ideas });
  },

  deleteIdea: async (id) => {
    await ops.deleteIdea(id);
    const ideas = await ops.getIdeas(get().activeProjectId!);
    set({ ideas });
  },

  /* ---- Timeline CRUD ---- */
  createTimelineEvent: async (data) => {
    const id = await ops.createTimelineEvent(data);
    const timelineEvents = await ops.getTimelineEvents(get().activeProjectId!);
    set({ timelineEvents });
    return id;
  },

  updateTimelineEvent: async (id, changes) => {
    await ops.updateTimelineEvent(id, changes);
    const timelineEvents = await ops.getTimelineEvents(get().activeProjectId!);
    set({ timelineEvents });
  },

  deleteTimelineEvent: async (id) => {
    await ops.deleteTimelineEvent(id);
    const timelineEvents = await ops.getTimelineEvents(get().activeProjectId!);
    set({ timelineEvents });
  },

  /* ---- Appearance CRUD ---- */
  createAppearance: async (data) => {
    const id = await ops.createAppearance(data);
    const appearances = await ops.getAppearances(get().activeProjectId!);
    set({ appearances });
    return id;
  },

  updateAppearance: async (id, changes) => {
    await ops.updateAppearance(id, changes);
    const appearances = await ops.getAppearances(get().activeProjectId!);
    set({ appearances });
  },

  deleteAppearance: async (id) => {
    await ops.deleteAppearance(id);
    const appearances = await ops.getAppearances(get().activeProjectId!);
    set({ appearances });
  },

  /* ---- Snapshot CRUD ---- */
  createSnapshot: async (sceneId, name, content, note) => {
    const pid = get().activeProjectId!;
    const id = await ops.createSnapshot(sceneId, pid, name, content, note);
    if (get().activeSceneId === sceneId) {
      const snapshots = await ops.getSnapshots(sceneId);
      set({ snapshots });
    }
    return id;
  },

  loadSnapshots: async (sceneId) => {
    const snapshots = await ops.getSnapshots(sceneId);
    set({ snapshots });
  },

  deleteSnapshot: async (id) => {
    await ops.deleteSnapshot(id);
    const sceneId = get().activeSceneId;
    if (sceneId) {
      const snapshots = await ops.getSnapshots(sceneId);
      set({ snapshots });
    }
  },
}));
