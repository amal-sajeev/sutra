import type { SceneTemplate } from '../types';

function paragraphNode(p: { text: string; bold?: boolean }) {
  if (!p.text && !p.bold) {
    return { type: 'paragraph' as const };
  }
  return {
    type: 'paragraph' as const,
    content: [
      {
        type: 'text' as const,
        text: p.text,
        ...(p.bold ? { marks: [{ type: 'bold' as const }] } : {}),
      },
    ],
  };
}

function makeDoc(...paragraphs: { text: string; bold?: boolean }[]) {
  return JSON.stringify({
    type: 'doc',
    content: paragraphs.map((p) => paragraphNode(p)),
  });
}

export const BUILT_IN_TEMPLATES: SceneTemplate[] = [
  {
    id: 'character-sheet',
    name: 'Character Sheet',
    category: 'built-in',
    content: makeDoc(
      { text: 'Character Name', bold: true },
      { text: 'Age: ' },
      { text: 'Role: ' },
      { text: '' },
      { text: 'Physical Description', bold: true },
      { text: '' },
      { text: 'Personality', bold: true },
      { text: '' },
      { text: 'Motivation', bold: true },
      { text: '' },
      { text: 'Backstory', bold: true },
      { text: '' },
      { text: 'Arc / Growth', bold: true },
      { text: '' },
    ),
  },
  {
    id: 'location-sheet',
    name: 'Location Sheet',
    category: 'built-in',
    content: makeDoc(
      { text: 'Location Name', bold: true },
      { text: 'Setting: ' },
      { text: 'Time Period: ' },
      { text: '' },
      { text: 'Physical Description', bold: true },
      { text: '' },
      { text: 'Atmosphere / Mood', bold: true },
      { text: '' },
      { text: 'Key Details', bold: true },
      { text: '' },
      { text: 'History', bold: true },
      { text: '' },
    ),
  },
  {
    id: 'scene-card',
    name: 'Scene Card',
    category: 'built-in',
    content: makeDoc(
      { text: 'Scene Goal', bold: true },
      { text: '' },
      { text: 'Conflict', bold: true },
      { text: '' },
      { text: 'Outcome / Disaster', bold: true },
      { text: '' },
      { text: 'Emotional Change', bold: true },
      { text: 'From:  →  To: ' },
      { text: '' },
      { text: 'Notes', bold: true },
      { text: '' },
    ),
  },
  {
    id: 'interview',
    name: 'Interview Q&A',
    category: 'built-in',
    content: makeDoc(
      { text: 'Interview: [Subject Name]', bold: true },
      { text: '' },
      { text: 'Q: What is your earliest memory?', bold: true },
      { text: 'A: ' },
      { text: '' },
      { text: 'Q: What do you want more than anything?', bold: true },
      { text: 'A: ' },
      { text: '' },
      { text: 'Q: What are you most afraid of?', bold: true },
      { text: 'A: ' },
      { text: '' },
      { text: 'Q: What is your biggest secret?', bold: true },
      { text: 'A: ' },
      { text: '' },
    ),
  },
];
