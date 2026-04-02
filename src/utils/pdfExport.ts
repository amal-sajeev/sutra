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

const PAGE_DIMS: Record<string, { width: number; height: number }> = {
  letter: { width: 612, height: 792 },
  a4: { width: 595.28, height: 841.89 },
  a5: { width: 419.53, height: 595.28 },
  '6x9': { width: 432, height: 648 },
};

function ttToDocDef(node: TTNode, ruleWidth: number): Record<string, unknown>[] {
  if (!node.content) return [];
  return node.content.flatMap(n => nodeToContent(n, ruleWidth));
}

function nodeToContent(n: TTNode, ruleWidth: number): Record<string, unknown>[] {
  switch (n.type) {
    case 'paragraph': {
      const texts = inlineContent(n);
      if (texts.length === 0) return [{ text: '\n', fontSize: 10 }];
      return [{ text: texts, margin: [0, 0, 0, 6] }];
    }
    case 'heading': {
      const level = (n.attrs?.level as number) || 1;
      const sizes: Record<number, number> = { 1: 20, 2: 16, 3: 14 };
      return [
        {
          text: inlineContent(n),
          fontSize: sizes[level] || 14,
          bold: true,
          margin: [0, level === 1 ? 16 : 10, 0, 6],
        },
      ];
    }
    case 'bulletList':
      return [
        {
          ul: (n.content || []).map(item => {
            const parts = item.content || [];
            if (parts.length > 0 && parts[0].type === 'paragraph') {
              return { text: inlineContent(parts[0]) };
            }
            return { text: plainText(item) };
          }),
          margin: [0, 4, 0, 4],
        },
      ];
    case 'orderedList':
      return [
        {
          ol: (n.content || []).map(item => {
            const parts = item.content || [];
            if (parts.length > 0 && parts[0].type === 'paragraph') {
              return { text: inlineContent(parts[0]) };
            }
            return { text: plainText(item) };
          }),
          margin: [0, 4, 0, 4],
        },
      ];
    case 'blockquote':
      return [
        {
          text: (n.content || []).flatMap(c => inlineContent(c)),
          italics: true,
          margin: [20, 4, 0, 4],
          color: '#555555',
        },
      ];
    case 'codeBlock':
      return [
        {
          text: plainText(n),
          font: 'Courier',
          fontSize: 10,
          background: '#f4f4f4',
          margin: [0, 4, 0, 4],
        },
      ];
    case 'horizontalRule':
      return [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: ruleWidth,
              y2: 0,
              lineWidth: 0.5,
              lineColor: '#cccccc',
            },
          ],
          margin: [0, 10, 0, 10],
        },
      ];
    default:
      return [];
  }
}

function inlineContent(node: TTNode): Record<string, unknown>[] {
  if (!node.content) return [];
  return node.content.map(c => {
    if (c.type === 'text') {
      const result: Record<string, unknown> = { text: c.text || '' };
      for (const m of c.marks || []) {
        if (m.type === 'bold') result.bold = true;
        if (m.type === 'italic') result.italics = true;
        if (m.type === 'strike') result.decoration = 'lineThrough';
        if (m.type === 'code') {
          result.font = 'Courier';
          result.fontSize = 10;
        }
        if (m.type === 'link') {
          result.link = m.attrs?.href as string;
          result.color = '#2563eb';
          result.decoration = 'underline';
        }
      }
      return result;
    }
    if (c.type === 'hardBreak') return { text: '\n' };
    return { text: '' };
  });
}

function plainText(node: TTNode): string {
  if (node.type === 'text') return node.text || '';
  let t = '';
  for (const c of node.content || []) t += plainText(c);
  return t;
}

function resolvePdfVfs(mod: unknown): Record<string, string> | undefined {
  const m = mod as Record<string, unknown>;
  const topPm = m.pdfMake as { vfs?: Record<string, string> } | undefined;
  if (topPm?.vfs) return topPm.vfs;
  const def = m.default;
  if (def && typeof def === 'object' && !Array.isArray(def)) {
    const d = def as Record<string, unknown>;
    const inner = d.pdfMake as { vfs?: Record<string, string> } | undefined;
    if (inner?.vfs) return inner.vfs;
    const keys = Object.keys(d);
    if (keys.some(k => k.endsWith('.ttf') || k.endsWith('.otf'))) {
      return d as Record<string, string>;
    }
  }
  return undefined;
}

function sepContent(sep: string, ruleWidth: number): Record<string, unknown>[] {
  switch (sep) {
    case 'asterisks':
      return [{ text: '* * *', alignment: 'center', color: '#888888', margin: [0, 16, 0, 16] }];
    case 'rule':
      return [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: ruleWidth,
              y2: 0,
              lineWidth: 0.5,
              lineColor: '#cccccc',
            },
          ],
          margin: [0, 16, 0, 16],
        },
      ];
    case 'hash':
      return [{ text: '#', alignment: 'center', color: '#888888', margin: [0, 16, 0, 16] }];
    default:
      return [{ text: '', margin: [0, 8, 0, 8] }];
  }
}

export async function buildPDF(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
  activeSceneId?: number | null,
): Promise<Blob> {
  const pdfMakeMod = await import('pdfmake/build/pdfmake');
  const pdfFontsMod = await import('pdfmake/build/vfs_fonts');

  const pdfMake = pdfMakeMod.default as {
    vfs?: Record<string, string>;
    createPdf: (def: object) => { getBlob: (cb: (b: Blob) => void) => void };
  };

  const vfs = resolvePdfVfs(pdfFontsMod);
  if (vfs) {
    pdfMake.vfs = vfs;
  }

  const g = gatherContent(chapters, scenes, options, activeSceneId);
  const pg = PAGE_DIMS[options.pageSize] || PAGE_DIMS.letter;
  const ruleWidth = Math.max(120, pg.width - 144);
  const fontSize = options.fontSize || 12;
  const lineHeight = options.lineSpacing || 1.6;
  const content: Record<string, unknown>[] = [];

  if (options.includeFrontMatter) {
    content.push({ text: '\n\n\n\n' });
    content.push({
      text: project.title,
      fontSize: 28,
      bold: true,
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });
    if (options.authorName) {
      content.push({
        text: options.authorName,
        fontSize: 16,
        alignment: 'center',
        color: '#555555',
        margin: [0, 0, 0, 8],
      });
    }
    if (project.oneSentence) {
      content.push({
        text: project.oneSentence,
        fontSize: 12,
        italics: true,
        alignment: 'center',
        color: '#777777',
        margin: [0, 10, 0, 0],
      });
    }
    content.push({ text: '', pageBreak: 'after' });
  }

  for (let ci = 0; ci < g.chapters.length; ci++) {
    const ch = g.chapters[ci];

    if (options.chapterPageBreaks && ci > 0) {
      content.push({ text: '', pageBreak: 'before' });
    }

    if (options.includeChapterHeadings) {
      content.push({
        text: ch.title,
        fontSize: 22,
        bold: true,
        margin: [0, 20, 0, 12],
      });
    }

    const ss = g.scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    for (let si = 0; si < ss.length; si++) {
      const scene = ss[si];

      if (options.includeSceneTitles) {
        content.push({
          text: scene.title,
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 6],
        });
      }

      if (options.includeSynopsis && scene.synopsis) {
        content.push({
          text: `Synopsis: ${scene.synopsis}`,
          italics: true,
          fontSize: fontSize - 1,
          color: '#888888',
          margin: [16, 0, 0, 8],
        });
      }

      const doc = parseTT(scene.content);
      if (doc) {
        content.push(...ttToDocDef(doc, ruleWidth));
      }

      if (si < ss.length - 1 && options.sceneSeparator !== 'none') {
        content.push(...sepContent(options.sceneSeparator, ruleWidth));
      }
    }
  }

  if (content.length === 0) {
    content.push({ text: 'No content to export.' });
  }

  const authorForHeader = options.authorName || '';
  const titleForHeader =
    project.title.length > 30 ? `${project.title.slice(0, 30)}...` : project.title;

  const docDefinition = {
    pageSize: { width: pg.width, height: pg.height },
    pageMargins: [72, 72, 72, 72],
    defaultStyle: {
      font: 'Roboto',
      fontSize,
      lineHeight,
    },
    header: (currentPage: number) => {
      if (currentPage === 1 && options.includeFrontMatter) return null;
      return {
        columns: [
          {
            text: authorForHeader,
            alignment: 'left',
            fontSize: 9,
            color: '#999999',
            margin: [72, 40, 0, 0],
          },
          {
            text: titleForHeader,
            alignment: 'center',
            fontSize: 9,
            color: '#999999',
            margin: [0, 40, 0, 0],
          },
          {
            text: String(currentPage),
            alignment: 'right',
            fontSize: 9,
            color: '#999999',
            margin: [0, 40, 72, 0],
          },
        ],
      };
    },
    content,
    info: {
      title: project.title,
      author: options.authorName || '',
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBlob((blob: Blob) => {
        resolve(blob);
      });
    } catch (err) {
      reject(err);
    }
  });
}
