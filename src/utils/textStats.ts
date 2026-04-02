export interface TextStats {
  words: number;
  sentences: number;
  paragraphs: number;
  characters: number;
  avgWordsPerSentence: number;
  avgSentenceLength: number;
  fleschKincaid: number;
  dialogueRatio: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;
  for (const ch of word) {
    const isVowel = vowels.includes(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (word.endsWith('e')) count--;
  return Math.max(1, count);
}

export function analyzeText(text: string): TextStats {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const characters = text.length;

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = wordCount / sentenceCount;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  const fleschKincaid = wordCount > 0
    ? 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
    : 0;

  const dialogueLines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return (trimmed.startsWith('"') || trimmed.startsWith('\u201C') || trimmed.startsWith('\u2018'));
  });
  const dialogueRatio = paragraphs.length > 0
    ? dialogueLines.length / paragraphs.length
    : 0;

  return {
    words: wordCount,
    sentences: sentenceCount,
    paragraphs: paragraphs.length,
    characters,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentenceLength: Math.round(avgWordsPerSentence * 10) / 10,
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    dialogueRatio: Math.round(dialogueRatio * 100),
  };
}

export function readabilityLabel(fk: number): string {
  if (fk <= 5) return 'Easy (5th grade)';
  if (fk <= 8) return 'Standard (8th grade)';
  if (fk <= 12) return 'Advanced (12th grade)';
  return 'Complex (college+)';
}
