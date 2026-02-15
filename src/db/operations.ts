import { db } from './database';
import type {
  Project,
  Chapter,
  Scene,
  Character,
  Relationship,
  Idea,
  TimelineEvent,
  CharacterAppearance,
  Snapshot,
} from '../types';

/* ==============================
   Project Operations
   ============================== */

export async function createProject(title: string): Promise<number> {
  const now = Date.now();
  return db.projects.add({
    title,
    createdAt: now,
    updatedAt: now,
    settings: {},
  });
}

export async function getProject(id: number): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function updateProject(id: number, changes: Partial<Project>): Promise<void> {
  await db.projects.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteProject(id: number): Promise<void> {
  await db.transaction('rw', [db.projects, db.chapters, db.scenes, db.characters, db.relationships, db.ideas, db.timelineEvents, db.characterAppearances, db.snapshots], async () => {
    await db.chapters.where('projectId').equals(id).delete();
    await db.scenes.where('projectId').equals(id).delete();
    await db.characters.where('projectId').equals(id).delete();
    await db.relationships.where('projectId').equals(id).delete();
    await db.ideas.where('projectId').equals(id).delete();
    await db.timelineEvents.where('projectId').equals(id).delete();
    await db.characterAppearances.where('projectId').equals(id).delete();
    await db.snapshots.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

/* ==============================
   Chapter Operations
   ============================== */

export async function createChapter(projectId: number, title: string): Promise<number> {
  const count = await db.chapters.where('projectId').equals(projectId).count();
  return db.chapters.add({ projectId, title, order: count });
}

export async function getChapters(projectId: number): Promise<Chapter[]> {
  return db.chapters.where('projectId').equals(projectId).sortBy('order');
}

export async function updateChapter(id: number, changes: Partial<Chapter>): Promise<void> {
  await db.chapters.update(id, changes);
}

export async function deleteChapter(id: number): Promise<void> {
  await db.transaction('rw', [db.chapters, db.scenes, db.snapshots], async () => {
    const scenes = await db.scenes.where('chapterId').equals(id).toArray();
    for (const scene of scenes) {
      if (scene.id) await db.snapshots.where('sceneId').equals(scene.id).delete();
    }
    await db.scenes.where('chapterId').equals(id).delete();
    await db.chapters.delete(id);
  });
}

/* ==============================
   Scene Operations
   ============================== */

export async function createScene(chapterId: number, projectId: number, title: string): Promise<number> {
  const count = await db.scenes.where('chapterId').equals(chapterId).count();
  const now = Date.now();
  return db.scenes.add({
    chapterId,
    projectId,
    title,
    content: '',
    order: count,
    status: 'draft',
    lastEditedAt: now,
  });
}

export async function getScenes(chapterId: number): Promise<Scene[]> {
  return db.scenes.where('chapterId').equals(chapterId).sortBy('order');
}

export async function getScene(id: number): Promise<Scene | undefined> {
  return db.scenes.get(id);
}

export async function getAllProjectScenes(projectId: number): Promise<Scene[]> {
  return db.scenes.where('projectId').equals(projectId).sortBy('order');
}

export async function updateScene(id: number, changes: Partial<Scene>): Promise<void> {
  await db.scenes.update(id, { ...changes, lastEditedAt: Date.now() });
}

export async function deleteScene(id: number): Promise<void> {
  await db.transaction('rw', [db.scenes, db.snapshots], async () => {
    await db.snapshots.where('sceneId').equals(id).delete();
    await db.scenes.delete(id);
  });
}

/* ==============================
   Character Operations
   ============================== */

export async function createCharacter(projectId: number, data: Partial<Character>): Promise<number> {
  return db.characters.add({
    projectId,
    name: data.name || 'New Character',
    color: data.color || '#5a9e9e',
    description: data.description,
    role: data.role,
    motivation: data.motivation,
    goal: data.goal,
    conflict: data.conflict,
    epiphany: data.epiphany,
  });
}

export async function getCharacters(projectId: number): Promise<Character[]> {
  return db.characters.where('projectId').equals(projectId).toArray();
}

export async function updateCharacter(id: number, changes: Partial<Character>): Promise<void> {
  await db.characters.update(id, changes);
}

export async function deleteCharacter(id: number): Promise<void> {
  await db.transaction('rw', [db.characters, db.relationships, db.characterAppearances], async () => {
    await db.relationships.where('characterAId').equals(id).delete();
    await db.relationships.where('characterBId').equals(id).delete();
    await db.characterAppearances.where('characterId').equals(id).delete();
    await db.characters.delete(id);
  });
}

/* ==============================
   Relationship Operations
   ============================== */

export async function createRelationship(data: Omit<Relationship, 'id'>): Promise<number> {
  return db.relationships.add(data);
}

export async function getRelationships(projectId: number): Promise<Relationship[]> {
  return db.relationships.where('projectId').equals(projectId).toArray();
}

export async function updateRelationship(id: number, changes: Partial<Relationship>): Promise<void> {
  await db.relationships.update(id, changes);
}

export async function deleteRelationship(id: number): Promise<void> {
  await db.relationships.delete(id);
}

/* ==============================
   Idea Operations
   ============================== */

export async function createIdea(projectId: number, content: string, tags: string[] = []): Promise<number> {
  return db.ideas.add({
    projectId,
    content,
    createdAt: Date.now(),
    tags,
  });
}

export async function getIdeas(projectId: number): Promise<Idea[]> {
  return db.ideas.where('projectId').equals(projectId).reverse().sortBy('createdAt');
}

export async function updateIdea(id: number, changes: Partial<Idea>): Promise<void> {
  await db.ideas.update(id, changes);
}

export async function deleteIdea(id: number): Promise<void> {
  await db.ideas.delete(id);
}

/* ==============================
   Timeline Event Operations
   ============================== */

export async function createTimelineEvent(data: Omit<TimelineEvent, 'id'>): Promise<number> {
  return db.timelineEvents.add(data);
}

export async function getTimelineEvents(projectId: number): Promise<TimelineEvent[]> {
  return db.timelineEvents.where('projectId').equals(projectId).sortBy('position');
}

export async function updateTimelineEvent(id: number, changes: Partial<TimelineEvent>): Promise<void> {
  await db.timelineEvents.update(id, changes);
}

export async function deleteTimelineEvent(id: number): Promise<void> {
  await db.timelineEvents.delete(id);
}

/* ==============================
   Character Appearance Operations
   ============================== */

export async function createAppearance(data: Omit<CharacterAppearance, 'id'>): Promise<number> {
  return db.characterAppearances.add(data);
}

export async function getAppearances(projectId: number): Promise<CharacterAppearance[]> {
  return db.characterAppearances.where('projectId').equals(projectId).sortBy('position');
}

export async function getCharacterAppearances(characterId: number): Promise<CharacterAppearance[]> {
  return db.characterAppearances.where('characterId').equals(characterId).sortBy('position');
}

export async function updateAppearance(id: number, changes: Partial<CharacterAppearance>): Promise<void> {
  await db.characterAppearances.update(id, changes);
}

export async function deleteAppearance(id: number): Promise<void> {
  await db.characterAppearances.delete(id);
}

/* ==============================
   Snapshot Operations
   ============================== */

export async function createSnapshot(sceneId: number, projectId: number, name: string, content: string, note?: string): Promise<number> {
  return db.snapshots.add({
    sceneId,
    projectId,
    name,
    note,
    content,
    createdAt: Date.now(),
  });
}

export async function getSnapshots(sceneId: number): Promise<Snapshot[]> {
  return db.snapshots.where('sceneId').equals(sceneId).reverse().sortBy('createdAt');
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.snapshots.delete(id);
}

/* ==============================
   Bulk Export / Import
   ============================== */

export async function exportProject(projectId: number) {
  const project = await db.projects.get(projectId);
  const chapters = await getChapters(projectId);
  const scenes = await getAllProjectScenes(projectId);
  const characters = await getCharacters(projectId);
  const relationships = await getRelationships(projectId);
  const ideas = await getIdeas(projectId);
  const timelineEvents = await getTimelineEvents(projectId);
  const appearances = await getAppearances(projectId);
  const snapshots = await db.snapshots.where('projectId').equals(projectId).toArray();

  return {
    version: 1,
    exportedAt: Date.now(),
    project,
    chapters,
    scenes,
    characters,
    relationships,
    ideas,
    timelineEvents,
    appearances,
    snapshots,
  };
}

/**
 * Import a project from a previously exported JSON backup.
 * All IDs are re-generated so there are no collisions with existing data.
 * Cross-references (projectId, chapterId, sceneId, characterId, etc.) are remapped.
 * Returns the new project ID.
 */
export async function importProject(data: ReturnType<typeof exportProject> extends Promise<infer T> ? T : never): Promise<number> {
  return db.transaction('rw', [db.projects, db.chapters, db.scenes, db.characters, db.relationships, db.ideas, db.timelineEvents, db.characterAppearances, db.snapshots], async () => {
    // 1. Create the project (new ID)
    const oldProject = data.project!;
    const now = Date.now();
    const newProjectId = await db.projects.add({
      title: oldProject.title,
      oneSentence: oldProject.oneSentence,
      oneParag: oldProject.oneParag,
      createdAt: oldProject.createdAt,
      updatedAt: now,
      settings: oldProject.settings || {},
    });

    // 2. Chapters — remap IDs
    const chapterIdMap = new Map<number, number>(); // old ID -> new ID
    for (const ch of data.chapters) {
      const oldId = ch.id!;
      const newId = await db.chapters.add({
        projectId: newProjectId,
        title: ch.title,
        order: ch.order,
      });
      chapterIdMap.set(oldId, newId);
    }

    // 3. Scenes — remap IDs and chapterId references
    const sceneIdMap = new Map<number, number>();
    for (const sc of data.scenes) {
      const oldId = sc.id!;
      const newId = await db.scenes.add({
        chapterId: chapterIdMap.get(sc.chapterId) || sc.chapterId,
        projectId: newProjectId,
        title: sc.title,
        content: sc.content,
        order: sc.order,
        synopsis: sc.synopsis,
        status: sc.status,
        lastEditedAt: sc.lastEditedAt,
      });
      sceneIdMap.set(oldId, newId);
    }

    // 4. Characters — remap IDs
    const characterIdMap = new Map<number, number>();
    for (const char of data.characters) {
      const oldId = char.id!;
      const newId = await db.characters.add({
        projectId: newProjectId,
        name: char.name,
        color: char.color,
        description: char.description,
        role: char.role,
        motivation: char.motivation,
        goal: char.goal,
        conflict: char.conflict,
        epiphany: char.epiphany,
      });
      characterIdMap.set(oldId, newId);
    }

    // 5. Relationships — remap character references
    for (const rel of data.relationships) {
      await db.relationships.add({
        projectId: newProjectId,
        characterAId: characterIdMap.get(rel.characterAId) || rel.characterAId,
        characterBId: characterIdMap.get(rel.characterBId) || rel.characterBId,
        type: rel.type,
        label: rel.label,
      });
    }

    // 6. Ideas — remap optional linkedSceneId
    for (const idea of data.ideas) {
      await db.ideas.add({
        projectId: newProjectId,
        content: idea.content,
        createdAt: idea.createdAt,
        tags: idea.tags,
        linkedSceneId: idea.linkedSceneId ? sceneIdMap.get(idea.linkedSceneId) : undefined,
        tfidfVector: idea.tfidfVector,
      });
    }

    // 7. Timeline events
    for (const evt of data.timelineEvents) {
      await db.timelineEvents.add({
        projectId: newProjectId,
        title: evt.title,
        position: evt.position,
        width: evt.width,
        color: evt.color,
        description: evt.description,
      });
    }

    // 8. Character appearances — remap characterId, sceneId, timelineEventId
    for (const app of data.appearances) {
      await db.characterAppearances.add({
        characterId: characterIdMap.get(app.characterId) || app.characterId,
        projectId: newProjectId,
        sceneId: app.sceneId ? sceneIdMap.get(app.sceneId) : undefined,
        position: app.position,
        fortune: app.fortune ?? 0.5,
        note: app.note,
        isDeath: app.isDeath,
      });
    }

    // 9. Snapshots — remap sceneId
    for (const snap of data.snapshots) {
      await db.snapshots.add({
        sceneId: sceneIdMap.get(snap.sceneId) || snap.sceneId,
        projectId: newProjectId,
        name: snap.name,
        note: snap.note,
        content: snap.content,
        createdAt: snap.createdAt,
      });
    }

    return newProjectId;
  });
}
