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
  NoteDocument,
  WritingHistory,
  TrashItem,
  Comment,
  CompilePreset,
  Collection,
  Asset,
  Location,
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
    settings: {
      labels: [
        { name: 'Concept', color: '#4488cc' },
        { name: 'To Do', color: '#e55555' },
        { name: 'In Progress', color: '#d4a745' },
        { name: 'First Draft', color: '#cc5599' },
        { name: 'Revised Draft', color: '#8844cc' },
        { name: 'Final', color: '#4aa86a' },
      ],
    },
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
  await db.transaction('rw', [db.projects, db.chapters, db.scenes, db.characters, db.relationships, db.ideas, db.timelineEvents, db.characterAppearances, db.snapshots, db.comments, db.compilePresets, db.collections, db.assets, db.locations], async () => {
    await db.chapters.where('projectId').equals(id).delete();
    await db.scenes.where('projectId').equals(id).delete();
    await db.characters.where('projectId').equals(id).delete();
    await db.relationships.where('projectId').equals(id).delete();
    await db.ideas.where('projectId').equals(id).delete();
    await db.timelineEvents.where('projectId').equals(id).delete();
    await db.characterAppearances.where('projectId').equals(id).delete();
    await db.snapshots.where('projectId').equals(id).delete();
    await db.comments.where('projectId').equals(id).delete();
    await db.compilePresets.where('projectId').equals(id).delete();
    await db.collections.where('projectId').equals(id).delete();
    await db.assets.where('projectId').equals(id).delete();
    await db.locations.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

/* ==============================
   Chapter Operations
   ============================== */

export async function createChapter(
  projectId: number,
  title: string,
  order?: number,
  sectionType?: string
): Promise<number> {
  let finalOrder = order;
  if (finalOrder === undefined) {
    const list = await db.chapters.where('projectId').equals(projectId).toArray();
    finalOrder = list.length === 0 ? 0 : Math.max(...list.map((c) => c.order), -Infinity) + 1;
  }
  return db.chapters.add({
    projectId,
    title,
    order: finalOrder,
    sectionType: sectionType || 'Chapter',
  });
}

export async function getChapters(projectId: number): Promise<Chapter[]> {
  return db.chapters.where('projectId').equals(projectId).sortBy('order');
}

export async function updateChapter(id: number, changes: Partial<Chapter>): Promise<void> {
  await db.chapters.update(id, changes);
}

export async function reorderChapters(_projectId: number, orderedIds: number[]): Promise<void> {
  await db.transaction('rw', db.chapters, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.chapters.update(orderedIds[i], { order: i });
    }
  });
}

export async function deleteChapter(id: number): Promise<void> {
  await db.transaction('rw', [db.chapters, db.scenes, db.snapshots, db.comments], async () => {
    const scenes = await db.scenes.where('chapterId').equals(id).toArray();
    for (const scene of scenes) {
      if (scene.id) {
        await db.snapshots.where('sceneId').equals(scene.id).delete();
        await db.comments.where('sceneId').equals(scene.id).delete();
      }
    }
    await db.scenes.where('chapterId').equals(id).delete();
    await db.chapters.delete(id);
  });
}

/* ==============================
   Scene Operations
   ============================== */

export async function createScene(
  chapterId: number,
  projectId: number,
  title: string,
  initialContent?: string
): Promise<number> {
  const count = await db.scenes.where('chapterId').equals(chapterId).count();
  const now = Date.now();
  return db.scenes.add({
    chapterId,
    projectId,
    title,
    content: initialContent ?? '',
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

export async function reorderScenes(_chapterId: number, orderedIds: number[]): Promise<void> {
  await db.transaction('rw', db.scenes, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.scenes.update(orderedIds[i], { order: i });
    }
  });
}

export async function moveScene(sceneId: number, newChapterId: number): Promise<void> {
  const count = await db.scenes.where('chapterId').equals(newChapterId).count();
  await db.scenes.update(sceneId, { chapterId: newChapterId, order: count });
}

export async function deleteScene(id: number): Promise<void> {
  await db.transaction('rw', [db.scenes, db.snapshots, db.comments], async () => {
    await db.snapshots.where('sceneId').equals(id).delete();
    await db.comments.where('sceneId').equals(id).delete();
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
    age: data.age,
    gender: data.gender,
    appearance: data.appearance,
    backstory: data.backstory,
    arc: data.arc,
    notes: data.notes,
    tags: data.tags,
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
   Location Operations
   ============================== */

export async function createLocation(data: Omit<Location, 'id'>): Promise<number> {
  return db.locations.add(data);
}

export async function getLocations(projectId: number): Promise<Location[]> {
  return db.locations.where('projectId').equals(projectId).toArray();
}

export async function updateLocation(id: number, changes: Partial<Location>): Promise<void> {
  await db.locations.update(id, changes);
}

export async function deleteLocation(id: number): Promise<void> {
  await db.locations.delete(id);
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
  const locations = await getLocations(projectId);

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
    locations,
  };
}

/**
 * Import a project from a previously exported JSON backup.
 * All IDs are re-generated so there are no collisions with existing data.
 * Cross-references (projectId, chapterId, sceneId, characterId, etc.) are remapped.
 * Returns the new project ID.
 */
export async function importProject(data: ReturnType<typeof exportProject> extends Promise<infer T> ? T : never): Promise<number> {
  return db.transaction('rw', [db.projects, db.chapters, db.scenes, db.characters, db.relationships, db.ideas, db.timelineEvents, db.characterAppearances, db.snapshots, db.locations], async () => {
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
        sectionType: ch.sectionType,
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
        age: char.age,
        gender: char.gender,
        appearance: char.appearance,
        backstory: char.backstory,
        arc: char.arc,
        notes: char.notes,
        tags: char.tags,
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

    // 7. Timeline events — remap IDs
    const timelineIdMap = new Map<number, number>();
    for (const evt of data.timelineEvents) {
      const oldId = evt.id!;
      const newId = await db.timelineEvents.add({
        projectId: newProjectId,
        title: evt.title,
        position: evt.position,
        width: evt.width,
        color: evt.color,
        description: evt.description,
      });
      timelineIdMap.set(oldId, newId);
    }

    // 8. Character appearances — remap characterId, sceneId, timelineEventId
    for (const app of data.appearances) {
      await db.characterAppearances.add({
        characterId: characterIdMap.get(app.characterId) || app.characterId,
        projectId: newProjectId,
        sceneId: app.sceneId ? sceneIdMap.get(app.sceneId) : undefined,
        timelineEventId: app.timelineEventId ? timelineIdMap.get(app.timelineEventId) : undefined,
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

    // 10. Locations — remap IDs and parentId
    const locationIdMap = new Map<number, number>();
    const locs = data.locations ?? [];
    for (const loc of locs) {
      if (loc.id == null) continue;
      const oldId = loc.id;
      const newId = await db.locations.add({
        projectId: newProjectId,
        name: loc.name,
        description: loc.description,
        tags: loc.tags,
      });
      locationIdMap.set(oldId, newId);
    }
    for (const loc of locs) {
      if (loc.id == null || loc.parentId == null) continue;
      const newId = locationIdMap.get(loc.id);
      const newParentId = locationIdMap.get(loc.parentId);
      if (newId != null && newParentId != null) {
        await db.locations.update(newId, { parentId: newParentId });
      }
    }

    return newProjectId;
  });
}

/* ==============================
   Note Document Operations
   ============================== */

export async function createNoteDocument(projectId: number, title: string): Promise<number> {
  const count = await db.noteDocuments.where('projectId').equals(projectId).count();
  return db.noteDocuments.add({
    projectId,
    title,
    content: '',
    order: count,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function getNoteDocuments(projectId: number): Promise<NoteDocument[]> {
  return db.noteDocuments.where('projectId').equals(projectId).sortBy('order');
}

export async function getNoteDocument(id: number): Promise<NoteDocument | undefined> {
  return db.noteDocuments.get(id);
}

export async function updateNoteDocument(id: number, changes: Partial<NoteDocument>): Promise<void> {
  await db.noteDocuments.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteNoteDocument(id: number): Promise<void> {
  await db.noteDocuments.delete(id);
}

/* ==============================
   Writing History Operations
   ============================== */

export async function recordWritingHistory(projectId: number, wordsWritten: number, totalWords: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await db.writingHistory.where('[projectId+date]').equals([projectId, date]).first();
  if (existing?.id) {
    await db.writingHistory.update(existing.id, {
      wordsWritten: existing.wordsWritten + wordsWritten,
      totalWords,
    });
  } else {
    await db.writingHistory.add({ projectId, date, wordsWritten, totalWords });
  }
}

export async function getWritingHistory(projectId: number, days = 30): Promise<WritingHistory[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return db.writingHistory
    .where('projectId').equals(projectId)
    .filter(h => h.date >= cutoffStr)
    .sortBy('date');
}

/* ==============================
   Trash Operations
   ============================== */

export async function trashItem(projectId: number, itemType: TrashItem['itemType'], data: string, originalTitle: string): Promise<number> {
  return db.trash.add({ projectId, itemType, data, deletedAt: Date.now(), originalTitle });
}

export async function getTrashItems(projectId: number): Promise<TrashItem[]> {
  return db.trash.where('projectId').equals(projectId).reverse().sortBy('deletedAt');
}

export async function deleteTrashItem(id: number): Promise<void> {
  await db.trash.delete(id);
}

export async function emptyTrash(projectId: number): Promise<void> {
  await db.trash.where('projectId').equals(projectId).delete();
}

/* ==============================
   Comment Operations
   ============================== */

export async function createComment(data: Omit<Comment, 'id'>): Promise<number> {
  return db.comments.add(data);
}

export async function getComments(sceneId: number): Promise<Comment[]> {
  return db.comments.where('sceneId').equals(sceneId).sortBy('createdAt');
}

export async function getProjectComments(projectId: number): Promise<Comment[]> {
  return db.comments.where('projectId').equals(projectId).sortBy('createdAt');
}

export async function updateComment(id: number, changes: Partial<Comment>): Promise<void> {
  await db.comments.update(id, changes);
}

export async function deleteComment(id: number): Promise<void> {
  await db.comments.delete(id);
}

/* ==============================
   Compile preset operations
   ============================== */

export async function createCompilePreset(data: Omit<CompilePreset, 'id'>): Promise<number> {
  return db.compilePresets.add(data);
}

export async function getCompilePresets(projectId: number): Promise<CompilePreset[]> {
  return db.compilePresets.where('projectId').equals(projectId).toArray();
}

export async function deleteCompilePreset(id: number): Promise<void> {
  await db.compilePresets.delete(id);
}

/* ==============================
   Collection operations
   ============================== */

export async function createCollection(data: Omit<Collection, 'id'>): Promise<number> {
  return db.collections.add(data);
}

export async function getCollections(projectId: number): Promise<Collection[]> {
  return db.collections.where('projectId').equals(projectId).toArray();
}

export async function updateCollection(id: number, changes: Partial<Collection>): Promise<void> {
  await db.collections.update(id, changes);
}

export async function deleteCollection(id: number): Promise<void> {
  await db.collections.delete(id);
}

/* ==============================
   Asset operations
   ============================== */

export async function createAsset(data: Omit<Asset, 'id'>): Promise<number> {
  return db.assets.add(data);
}

export async function getAsset(id: number): Promise<Asset | undefined> {
  return db.assets.get(id);
}

export async function getProjectAssets(projectId: number): Promise<Asset[]> {
  return db.assets.where('projectId').equals(projectId).toArray();
}

export async function deleteAsset(id: number): Promise<void> {
  await db.assets.delete(id);
}
