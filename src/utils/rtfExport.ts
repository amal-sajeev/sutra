import type { Project, Chapter, Scene, ExportOptions } from '../types';
import { gatherContent } from './export';

interface TTNode {
  type: string;
  content?: TTNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
}

function parseTT(jsonStr: string): TTNode | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as TTNode;
  } catch {
    return null;
  }
}

function escRtf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/[\u0080-\uffff]/g, ch => `\\u${ch.charCodeAt(0)}?`);
}

function nodeToRtf(node: TTNode, fontSize: number): string {
  switch (node.type) {
    case 'paragraph': {
      const inline = inlineRtf(node);
      return `\\pard\\sa120\\fs${fontSize * 2} ${inline}\\par\n`;
    }
    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const sz = fontSize + (level === 1 ? 8 : level === 2 ? 4 : 2);
      return `\\pard\\sa200\\fs${sz * 2}\\b ${inlineRtf(node)}\\b0\\par\n`;
    }
    case 'bulletList':
      return (node.content || [])
        .map(
          item =>
            `\\pard\\li720\\fi-360\\sa60\\fs${fontSize * 2} \\bullet  ${item.content?.map(c => (c.type === 'paragraph' ? inlineRtf(c) : '')).join('') || ''}\\par\n`,
        )
        .join('');
    case 'orderedList':
      return (node.content || [])
        .map(
          (item, i) =>
            `\\pard\\li720\\fi-360\\sa60\\fs${fontSize * 2} ${i + 1}. ${item.content?.map(c => (c.type === 'paragraph' ? inlineRtf(c) : '')).join('') || ''}\\par\n`,
        )
        .join('');
    case 'blockquote':
      return (node.content || [])
        .map(
          child =>
            `\\pard\\li720\\ri720\\sa120\\fs${fontSize * 2}\\i ${child.type === 'paragraph' ? inlineRtf(child) : ''}\\i0\\par\n`,
        )
        .join('');
    case 'codeBlock':
      return `\\pard\\sa120\\f1\\fs${(fontSize - 2) * 2} ${escRtf(plainText(node))}\\f0\\par\n`;
    case 'horizontalRule':
      return '\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par\n';
    default:
      return '';
  }
}

function inlineRtf(node: TTNode): string {
  if (!node.content) return '';
  return node.content
    .map(c => {
      if (c.type === 'text') {
        let text = escRtf(c.text || '');
        const marks = c.marks || [];
        for (const m of marks) {
          if (m.type === 'bold') text = `\\b ${text}\\b0 `;
          if (m.type === 'italic') text = `\\i ${text}\\i0 `;
          if (m.type === 'strike') text = `\\strike ${text}\\strike0 `;
        }
        return text;
      }
      if (c.type === 'hardBreak') return '\\line\n';
      return '';
    })
    .join('');
}

function plainText(node: TTNode): string {
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(plainText).join('');
}

function sepRtf(sep: string, fontSize: number): string {
  switch (sep) {
    case 'asterisks':
      return `\\pard\\qc\\sa200\\fs${fontSize * 2} * * *\\par\n`;
    case 'rule':
      return '\\pard\\brdrb\\brdrs\\brdrw10\\brsp20\\sa200 \\par\n';
    case 'hash':
      return `\\pard\\qc\\sa200\\fs${fontSize * 2} #\\par\n`;
    default:
      return '\\pard\\sa200 \\par\n';
  }
}

export function buildRTF(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
  activeSceneId?: number | null,
): string {
  const g = gatherContent(chapters, scenes, options, activeSceneId);
  const rawFont = options.fontFamily?.split(',')[0]?.trim().replace(/['"]/g, '') || 'Georgia';
  const fontSize = options.fontSize || 12;

  let rtf = '{\\rtf1\\ansi\\deff0\n';
  rtf += `{\\fonttbl{\\f0 ${rawFont};}{\\f1 Courier New;}}\n`;
  rtf += `\\paperw${options.pageSize === 'a4' ? '11906' : '12240'}\\paperh${options.pageSize === 'a4' ? '16838' : '15840'}\n`;
  rtf += '\\margl1440\\margr1440\\margt1440\\margb1440\n';

  if (options.includeFrontMatter) {
    rtf += `\\pard\\qc\\sa400\\fs${(fontSize + 12) * 2}\\b ${escRtf(project.title)}\\b0\\par\n`;
    if (options.authorName) {
      rtf += `\\pard\\qc\\sa200\\fs${(fontSize + 4) * 2} ${escRtf(options.authorName)}\\par\n`;
    }
    if (project.oneSentence) {
      rtf += `\\pard\\qc\\sa200\\fs${fontSize * 2}\\i ${escRtf(project.oneSentence)}\\i0\\par\n`;
    }
    rtf += '\\page\n';
  }

  for (let ci = 0; ci < g.chapters.length; ci++) {
    const ch = g.chapters[ci];

    if (options.chapterPageBreaks && ci > 0) rtf += '\\page\n';

    if (options.includeChapterHeadings) {
      rtf += `\\pard\\sa300\\fs${(fontSize + 8) * 2}\\b ${escRtf(ch.title)}\\b0\\par\n`;
    }

    const ss = g.scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    for (let si = 0; si < ss.length; si++) {
      const scene = ss[si];

      if (options.includeSceneTitles) {
        rtf += `\\pard\\sa200\\fs${(fontSize + 2) * 2}\\b ${escRtf(scene.title)}\\b0\\par\n`;
      }

      if (options.includeSynopsis && scene.synopsis) {
        rtf += `\\pard\\li720\\sa120\\fs${(fontSize - 1) * 2}\\i Synopsis: ${escRtf(scene.synopsis)}\\i0\\par\n`;
      }

      const doc = parseTT(scene.content);
      if (doc?.content) {
        for (const n of doc.content) rtf += nodeToRtf(n, fontSize);
      }

      if (si < ss.length - 1 && options.sceneSeparator !== 'none') {
        rtf += sepRtf(options.sceneSeparator, fontSize);
      }
    }
  }

  rtf += '}';
  return rtf;
}
