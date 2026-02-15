/* ==============================
   TF-IDF Engine
   Pure client-side text similarity
   No models, no APIs — just math
   ============================== */

// Stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'were',
  'been', 'are', 'am', 'will', 'would', 'could', 'should', 'have', 'has',
  'had', 'do', 'does', 'did', 'not', 'no', 'so', 'if', 'then', 'than',
  'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
  'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
  'same', 'too', 'very', 'just', 'because', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out',
  'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there',
  'can', 'up', 'down', 'also', 'my', 'your', 'his', 'her', 'its',
  'our', 'their', 'me', 'him', 'them', 'we', 'they', 'i', 'you', 'he',
  'she', 'it', 'we', 'us',
]);

/**
 * Tokenize text into normalized words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Compute term frequency for a document
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by max frequency
  const maxFreq = Math.max(...tf.values(), 1);
  for (const [term, freq] of tf) {
    tf.set(term, freq / maxFreq);
  }
  return tf;
}

/**
 * Compute TF-IDF vector for a document given IDF values and vocabulary list
 */
export function computeTFIDF(
  tokens: string[],
  idf: Map<string, number>,
  vocabulary: string[]
): number[] {
  const tf = termFrequency(tokens);
  return vocabulary.map((term) => {
    const tfVal = tf.get(term) || 0;
    const idfVal = idf.get(term) || 0;
    return tfVal * idfVal;
  });
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
