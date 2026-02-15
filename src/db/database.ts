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

    // v2: add fortune field to character appearances (default 0.5 for existing)
    this.version(2).stores({
      characterAppearances: '++id, characterId, projectId, sceneId, position',
    }).upgrade((tx) => {
      return tx.table('characterAppearances').toCollection().modify((app) => {
        if (app.fortune === undefined) {
          app.fortune = 0.5;
        }
      });
    });
  }
}

export const db = new SutraDatabase();
