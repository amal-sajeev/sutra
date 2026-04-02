import Dexie, { type Table } from 'dexie';
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

class SutraDatabase extends Dexie {
  projects!: Table<Project, number>;
  chapters!: Table<Chapter, number>;
  scenes!: Table<Scene, number>;
  characters!: Table<Character, number>;
  relationships!: Table<Relationship, number>;
  ideas!: Table<Idea, number>;
  timelineEvents!: Table<TimelineEvent, number>;
  characterAppearances!: Table<CharacterAppearance, number>;
  snapshots!: Table<Snapshot, number>;
  noteDocuments!: Table<NoteDocument, number>;
  writingHistory!: Table<WritingHistory, number>;
  trash!: Table<TrashItem, number>;
  comments!: Table<Comment, number>;
  compilePresets!: Table<CompilePreset, number>;
  collections!: Table<Collection, number>;
  assets!: Table<Asset, number>;
  locations!: Table<Location, number>;

  constructor() {
    super('SutraDB');

    this.version(1).stores({
      projects: '++id, title, updatedAt',
      chapters: '++id, projectId, order',
      scenes: '++id, chapterId, projectId, order, lastEditedAt',
      characters: '++id, projectId, name',
      relationships: '++id, projectId, characterAId, characterBId',
      ideas: '++id, projectId, createdAt, linkedSceneId',
      timelineEvents: '++id, projectId, position',
      characterAppearances: '++id, characterId, projectId, sceneId, position',
      snapshots: '++id, sceneId, projectId, createdAt',
    });

    this.version(2).stores({
      characterAppearances: '++id, characterId, projectId, sceneId, position',
    }).upgrade((tx) => {
      return tx.table('characterAppearances').toCollection().modify((app) => {
        if (app.fortune === undefined) {
          app.fortune = 0.5;
        }
      });
    });

    this.version(3).stores({
      projects: '++id, title, updatedAt',
      chapters: '++id, projectId, order',
      scenes: '++id, chapterId, projectId, order, lastEditedAt',
      characters: '++id, projectId, name',
      relationships: '++id, projectId, characterAId, characterBId',
      ideas: '++id, projectId, createdAt, linkedSceneId',
      timelineEvents: '++id, projectId, position',
      characterAppearances: '++id, characterId, projectId, sceneId, position',
      snapshots: '++id, sceneId, projectId, createdAt',
      noteDocuments: '++id, projectId, order',
      writingHistory: '++id, projectId, date, [projectId+date]',
      trash: '++id, projectId, deletedAt',
    });

    this.version(4).stores({
      projects: '++id, title, updatedAt',
      chapters: '++id, projectId, order',
      scenes: '++id, chapterId, projectId, order, lastEditedAt',
      characters: '++id, projectId, name',
      relationships: '++id, projectId, characterAId, characterBId',
      ideas: '++id, projectId, createdAt, linkedSceneId',
      timelineEvents: '++id, projectId, position',
      characterAppearances: '++id, characterId, projectId, sceneId, position',
      snapshots: '++id, sceneId, projectId, createdAt',
      noteDocuments: '++id, projectId, order',
      writingHistory: '++id, projectId, date, [projectId+date]',
      trash: '++id, projectId, deletedAt',
      comments: '++id, projectId, sceneId, createdAt',
      compilePresets: '++id, projectId, name',
    });

    this.version(5).stores({
      projects: '++id, title, updatedAt',
      chapters: '++id, projectId, order',
      scenes: '++id, chapterId, projectId, order, lastEditedAt',
      characters: '++id, projectId, name',
      relationships: '++id, projectId, characterAId, characterBId',
      ideas: '++id, projectId, createdAt, linkedSceneId',
      timelineEvents: '++id, projectId, position',
      characterAppearances: '++id, characterId, projectId, sceneId, position',
      snapshots: '++id, sceneId, projectId, createdAt',
      noteDocuments: '++id, projectId, order',
      writingHistory: '++id, projectId, date, [projectId+date]',
      trash: '++id, projectId, deletedAt',
      comments: '++id, projectId, sceneId, createdAt',
      compilePresets: '++id, projectId, name',
      collections: '++id, projectId, name',
      assets: '++id, projectId, filename',
    });

    this.version(6).stores({
      projects: '++id, title, updatedAt',
      chapters: '++id, projectId, order',
      scenes: '++id, chapterId, projectId, order, lastEditedAt',
      characters: '++id, projectId, name',
      relationships: '++id, projectId, characterAId, characterBId',
      ideas: '++id, projectId, createdAt, linkedSceneId',
      timelineEvents: '++id, projectId, position',
      characterAppearances: '++id, characterId, projectId, sceneId, position',
      snapshots: '++id, sceneId, projectId, createdAt',
      noteDocuments: '++id, projectId, order',
      writingHistory: '++id, projectId, date, [projectId+date]',
      trash: '++id, projectId, deletedAt',
      comments: '++id, projectId, sceneId, createdAt',
      compilePresets: '++id, projectId, name',
      collections: '++id, projectId, name',
      assets: '++id, projectId, filename',
      locations: '++id, projectId, parentId, name',
    });
  }
}

export const db = new SutraDatabase();
