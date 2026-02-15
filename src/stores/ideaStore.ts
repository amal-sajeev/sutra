import { create } from 'zustand';
import { computeTFIDF, cosineSimilarity, tokenize } from '../engine/tfidf';
import type { Idea } from '../types';

interface IdeaSimilarity {
  idA: number;
  idB: number;
  score: number;
}

interface IdeaStoreState {
  vocabulary: Map<string, number>; // word -> document frequency
  idfCache: Map<string, number>;   // word -> idf value
  vectors: Map<number, number[]>;  // ideaId -> tfidf vector
  similarities: IdeaSimilarity[];
  totalDocs: number;

  rebuildIndex: (ideas: Idea[]) => void;
  addToIndex: (idea: Idea, allIdeas: Idea[]) => void;
  removeFromIndex: (ideaId: number, allIdeas: Idea[]) => void;
  getSimilarities: () => IdeaSimilarity[];
}

export const useIdeaStore = create<IdeaStoreState>((set, get) => ({
  vocabulary: new Map(),
  idfCache: new Map(),
  vectors: new Map(),
  similarities: [],
  totalDocs: 0,

  rebuildIndex: (ideas) => {
    if (ideas.length === 0) {
      set({ vocabulary: new Map(), idfCache: new Map(), vectors: new Map(), similarities: [], totalDocs: 0 });
      return;
    }

    // Build document frequency
    const df = new Map<string, number>();
    const docs = ideas.map((idea) => tokenize(idea.content));

    for (const tokens of docs) {
      const unique = new Set(tokens);
      for (const token of unique) {
        df.set(token, (df.get(token) || 0) + 1);
      }
    }

    // Compute IDF
    const n = ideas.length;
    const idf = new Map<string, number>();
    for (const [term, freq] of df) {
      idf.set(term, Math.log((n + 1) / (freq + 1)) + 1);
    }

    // Compute TF-IDF vectors
    const vectors = new Map<number, number[]>();
    const vocabList = Array.from(df.keys());

    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      if (!idea.id) continue;
      const vec = computeTFIDF(docs[i], idf, vocabList);
      vectors.set(idea.id, vec);
    }

    // Compute pairwise similarities
    const similarities: IdeaSimilarity[] = [];
    const ideaIds = Array.from(vectors.keys());

    for (let i = 0; i < ideaIds.length; i++) {
      for (let j = i + 1; j < ideaIds.length; j++) {
        const vecA = vectors.get(ideaIds[i])!;
        const vecB = vectors.get(ideaIds[j])!;
        const score = cosineSimilarity(vecA, vecB);
        if (score > 0.05) {
          similarities.push({ idA: ideaIds[i], idB: ideaIds[j], score });
        }
      }
    }

    set({ vocabulary: df, idfCache: idf, vectors, similarities, totalDocs: n });
  },

  addToIndex: (_idea, allIdeas) => {
    // For simplicity, rebuild on add (efficient enough for hundreds of ideas)
    get().rebuildIndex(allIdeas);
  },

  removeFromIndex: (_ideaId, allIdeas) => {
    get().rebuildIndex(allIdeas);
  },

  getSimilarities: () => get().similarities,
}));
