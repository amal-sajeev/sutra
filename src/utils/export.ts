import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  BorderStyle,
  LevelFormat,
  Header,
  Footer,
  PageNumber,
  TabStopType,
} from 'docx';
import type { Project, Chapter, Scene, ExportOptions, CompilePreset, ParagraphStyle } from '../types';
import RevisionMark from '../extensions/RevisionMark';

/* ------------------------------------------------------------------ */
/*  TipTap JSON node / mark shapes                                    */
/* ------------------------------------------------------------------ */

interface TTNode {
  type: string;
  content?: TTNode[];
  text?: string;
  marks?: TTMark[];
  attrs?: Record<string, unknown>;
}

interface TTMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Shared TipTap extensions (mirrors Editor.tsx)                     */
/* ------------------------------------------------------------------ */

const tiptapExtensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Link.configure({ openOnClick: false }),
  Typography,
  RevisionMark,
];

export const DEFAULT_PARAGRAPH_STYLES: Omit<ParagraphStyle, 'id' | 'projectId'>[] = [
  { name: 'Body Text', type: 'paragraph', fontSize: 12, lineSpacing: 1.8, indent: 1.5 },
  { name: 'Chapter Heading', type: 'paragraph', fontSize: 24, bold: true, alignment: 'center', spaceAfter: 40 },
  { name: 'Scene Heading', type: 'paragraph', fontSize: 16, bold: true, spaceAfter: 20 },
  { name: 'Block Quote', type: 'paragraph', fontSize: 12, italic: true, indent: 2, lineSpacing: 1.6 },
  { name: 'Dialogue', type: 'paragraph', fontSize: 12, lineSpacing: 1.6 },
  { name: 'Epigraph', type: 'paragraph', fontSize: 11, italic: true, alignment: 'right', spaceAfter: 30 },
];

/* ------------------------------------------------------------------ */
/*  Parse helper                                                      */
/* ------------------------------------------------------------------ */

function parseTT(jsonStr: string): TTNode | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as TTNode;
  } catch {
    return null;
  }
}

/* ================================================================== */
/*  CORE CONVERTERS                                                   */
/* ================================================================== */

export function tiptapToHTML(jsonStr: string): string {
  const doc = parseTT(jsonStr);
  if (!doc) return jsonStr || '';
  try {
    return generateHTML(doc as never, tiptapExtensions);
  } catch {
    return plainExtract(doc);
  }
}

export function tiptapToMarkdown(jsonStr: string): string {
  const doc = parseTT(jsonStr);
  if (!doc) return jsonStr || '';
  return blocksToMd(doc.content || []).trim();
}

export function tiptapToPlainText(jsonStr: string): string {
  const doc = parseTT(jsonStr);
  if (!doc) return jsonStr || '';
  return plainExtract(doc).trim();
}

/* ------------------------------------------------------------------ */
/*  Markdown walker                                                   */
/* ------------------------------------------------------------------ */

function blocksToMd(nodes: TTNode[], indent = ''): string {
  return nodes.map(n => blockToMd(n, indent)).join('\n\n');
}

function blockToMd(node: TTNode, indent = ''): string {
  switch (node.type) {
    case 'paragraph':
      return indent + inlineMd(node);

    case 'heading': {
      const lvl = (node.attrs?.level as number) || 1;
      return indent + '#'.repeat(lvl) + ' ' + inlineMd(node);
    }

    case 'bulletList':
      return (node.content || [])
        .map(item => {
          const parts = item.content || [];
          let out = indent + '- ' + (parts[0] ? inlineMd(parts[0]) : '');
          if (parts.length > 1) out += '\n' + blocksToMd(parts.slice(1), indent + '  ');
          return out;
        })
        .join('\n');

    case 'orderedList':
      return (node.content || [])
        .map((item, i) => {
          const parts = item.content || [];
          let out = indent + `${i + 1}. ` + (parts[0] ? inlineMd(parts[0]) : '');
          if (parts.length > 1) out += '\n' + blocksToMd(parts.slice(1), indent + '   ');
          return out;
        })
        .join('\n');

    case 'blockquote':
      return (node.content || []).map(c => '> ' + blockToMd(c, '')).join('\n>\n');

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || '';
      return indent + '```' + lang + '\n' + plainExtract(node).trim() + '\n' + indent + '```';
    }

    case 'horizontalRule':
      return indent + '---';

    default:
      return indent + inlineMd(node);
  }
}

function inlineMd(node: TTNode): string {
  if (!node.content) return '';
  return node.content
    .map(c => {
      if (c.type === 'text') return marksMd(c.text || '', c.marks || []);
      if (c.type === 'hardBreak') return '  \n';
      return inlineMd(c);
    })
    .join('');
}

function marksMd(text: string, marks: TTMark[]): string {
  let r = text;
  for (const m of marks) {
    switch (m.type) {
      case 'bold':   r = `**${r}**`; break;
      case 'italic': r = `*${r}*`;   break;
      case 'strike': r = `~~${r}~~`; break;
      case 'code':   r = `\`${r}\``; break;
      case 'link':   r = `[${r}](${(m.attrs?.href as string) || ''})`; break;
    }
  }
  return r;
}

/* ------------------------------------------------------------------ */
/*  Plain-text extractor                                              */
/* ------------------------------------------------------------------ */

function plainExtract(node: TTNode): string {
  if (node.type === 'text') return node.text || '';

  let t = '';
  for (const c of node.content || []) t += plainExtract(c);

  if (['paragraph', 'heading'].includes(node.type)) t += '\n\n';
  else if (['listItem', 'blockquote'].includes(node.type)) t += '\n';
  else if (node.type === 'hardBreak') t += '\n';
  else if (node.type === 'horizontalRule') t += '\n---\n';

  return t;
}

/* ================================================================== */
/*  CONTENT GATHERING                                                 */
/* ================================================================== */

export function gatherContent(
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
  activeSceneId?: number | null,
): { chapters: Chapter[]; scenes: Scene[] } {
  const sortedC = [...chapters].sort((a, b) => a.order - b.order);
  const sortedS = [...scenes].sort((a, b) => a.order - b.order);

  switch (options.scope) {
    case 'chapter': {
      if (!options.scopeId) return { chapters: sortedC, scenes: sortedS };
      return {
        chapters: sortedC.filter(c => c.id === options.scopeId),
        scenes: sortedS.filter(s => s.chapterId === options.scopeId),
      };
    }
    case 'scene': {
      const sid = options.scopeId || activeSceneId;
      if (!sid) return { chapters: sortedC, scenes: sortedS };
      const sc = sortedS.filter(s => s.id === sid);
      const chIds = new Set(sc.map(s => s.chapterId));
      return { chapters: sortedC.filter(c => chIds.has(c.id!)), scenes: sc };
    }
    default:
      return { chapters: sortedC, scenes: sortedS };
  }
}

/* ------------------------------------------------------------------ */
/*  Separator helpers                                                 */
/* ------------------------------------------------------------------ */

function sepHTML(sep: string): string {
  switch (sep) {
    case 'asterisks': return '<p style="text-align:center;margin:1.5em 0;color:#888">* * *</p>';
    case 'rule':      return '<hr />';
    case 'hash':      return '<p style="text-align:center;margin:1.5em 0;color:#888">#</p>';
    case 'blank':     return '<br />';
    default:          return '';
  }
}

function sepText(sep: string, variant: 'md' | 'txt'): string {
  switch (sep) {
    case 'asterisks': return '* * *';
    case 'rule':      return variant === 'md' ? '---' : '\u2500'.repeat(20);
    case 'hash':      return '#';
    case 'blank':     return '';
    default:          return '';
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'manuscript';
}

/* ================================================================== */
/*  FORMAT BUILDERS — Text                                            */
/* ================================================================== */

export function exportAsMarkdown(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): string {
  let md = '';

  if (options.includeFrontMatter) {
    md += `# ${project.title}\n\n`;
    if (project.oneSentence) md += `> ${project.oneSentence}\n\n`;
    if (options.authorName) md += `*by ${options.authorName}*\n\n`;
    md += '---\n\n';
  }

  for (const ch of chapters) {
    if (options.includeChapterHeadings) md += `## ${ch.title}\n\n`;

    const ss = scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    for (let i = 0; i < ss.length; i++) {
      if (options.includeSceneTitles) md += `### ${ss[i].title}\n\n`;
      if (options.includeSynopsis && ss[i].synopsis) md += `> *Synopsis: ${ss[i].synopsis}*\n\n`;
      md += tiptapToMarkdown(ss[i].content) + '\n\n';
      if (i < ss.length - 1 && options.sceneSeparator !== 'blank') {
        const s = sepText(options.sceneSeparator, 'md');
        if (s) md += s + '\n\n';
      }
    }
  }

  return md.trimEnd() + '\n';
}

export function exportAsPlainText(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): string {
  let txt = '';

  if (options.includeFrontMatter) {
    txt += `${project.title}\n${'='.repeat(project.title.length)}\n\n`;
    if (project.oneSentence) txt += `${project.oneSentence}\n\n`;
    if (options.authorName) txt += `by ${options.authorName}\n\n`;
  }

  for (const ch of chapters) {
    if (options.includeChapterHeadings)
      txt += `${ch.title}\n${'-'.repeat(ch.title.length)}\n\n`;

    const ss = scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    for (let i = 0; i < ss.length; i++) {
      if (options.includeSceneTitles) txt += `[${ss[i].title}]\n\n`;
      if (options.includeSynopsis && ss[i].synopsis) txt += `Synopsis: ${ss[i].synopsis}\n\n`;
      txt += tiptapToPlainText(ss[i].content) + '\n\n';
      if (i < ss.length - 1 && options.sceneSeparator !== 'blank') {
        const s = sepText(options.sceneSeparator, 'txt');
        if (s) txt += s + '\n\n';
      }
    }
  }

  return txt.trimEnd() + '\n';
}

/* ================================================================== */
/*  FORMAT BUILDERS — HTML                                            */
/* ================================================================== */

export function buildFullHTML(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): string {
  const font = options.fontFamily || 'Georgia, serif';
  const sz = options.fontSize || 16;
  const lh = options.lineSpacing || 1.8;

  let body = '';

  if (options.includeFrontMatter) {
    body += `<div class="tp"><h1>${esc(project.title)}</h1>`;
    if (options.authorName) body += `<p class="au">${esc(options.authorName)}</p>`;
    if (project.oneSentence) body += `<p class="tl"><em>${esc(project.oneSentence)}</em></p>`;
    body += '</div>';
  }

  for (const ch of chapters) {
    if (options.includeChapterHeadings)
      body += `<h2 class="ch"${options.chapterPageBreaks ? ' style="page-break-before:always"' : ''}>${esc(ch.title)}</h2>`;

    const ss = scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    for (let i = 0; i < ss.length; i++) {
      if (options.includeSceneTitles) body += `<h3 class="st">${esc(ss[i].title)}</h3>`;
      if (options.includeSynopsis && ss[i].synopsis)
        body += `<blockquote class="sy"><em>Synopsis: ${esc(ss[i].synopsis!)}</em></blockquote>`;
      body += `<div class="sc">${tiptapToHTML(ss[i].content)}</div>`;
      if (i < ss.length - 1 && options.sceneSeparator !== 'none') body += sepHTML(options.sceneSeparator);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(project.title)}</title>
<style>
body{font-family:${font};font-size:${sz}px;line-height:${lh};max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a}
.tp{text-align:center;margin:80px 0 60px;page-break-after:always}
.tp h1{font-size:2.4em;margin-bottom:.3em}
.au{font-size:1.2em;color:#555}
.tl{color:#777;margin-top:1em}
.ch{font-size:1.6em;margin-top:2.5em;border-bottom:1px solid #ddd;padding-bottom:.3em}
.st{font-size:1.1em;margin-top:2em;color:#444}
.sy{font-size:.9em;color:#888;border-left:3px solid #ddd;padding-left:12px;margin:.5em 0 1em}
.sc{margin-bottom:1.5em}
.sc p{margin:.8em 0;text-indent:1.5em}
.sc p:first-child{text-indent:0}
.sc h1,.sc h2,.sc h3{text-indent:0}
.sc blockquote{margin:1em 0;padding-left:1em;border-left:3px solid #ccc;color:#555}
.sc ul,.sc ol{margin:.8em 0;padding-left:2em}
.sc code{background:#f4f4f4;padding:1px 4px;border-radius:3px;font-size:.9em}
.sc pre{background:#f4f4f4;padding:12px;border-radius:4px;overflow-x:auto}
hr{border:none;border-top:1px solid #ddd;margin:2em 0}
a{color:#2563eb}
@media print{body{max-width:none;margin:0;padding:0 1cm}.tp{margin:3cm 0}}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

/* ================================================================== */
/*  FORMAT BUILDERS — EPUB                                            */
/* ================================================================== */

export async function buildEPUB(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): Promise<Blob> {
  const { default: epubGen } = await import('epub-gen-memory');

  const font = options.fontFamily || 'Georgia, serif';
  const sz = options.fontSize || 16;
  const lh = options.lineSpacing || 1.8;

  const css = [
    `body{font-family:${font};font-size:${sz}px;line-height:${lh};color:#1a1a1a}`,
    '.sep{text-align:center;margin:2em 0;color:#888}',
    '.st{font-size:1.1em;color:#444;margin-top:2em}',
    '.sy{font-size:.9em;color:#888;border-left:3px solid #ddd;padding-left:12px}',
    'p{margin:.6em 0;text-indent:1.5em}',
    'p:first-child{text-indent:0}',
    'blockquote{margin:1em 0;padding-left:1em;border-left:3px solid #ccc}',
    'code{background:#f4f4f4;padding:1px 4px;border-radius:3px}',
  ].join('\n');

  const epubChapters: { title: string; content: string; excludeFromToc?: boolean; beforeToc?: boolean }[] = [];

  if (options.includeFrontMatter) {
    let front = '<div style="text-align:center;margin:40px 0">';
    front += `<h1>${esc(project.title)}</h1>`;
    if (options.authorName) front += `<p style="font-size:1.2em;color:#555">${esc(options.authorName)}</p>`;
    if (project.oneSentence) front += `<p><em>${esc(project.oneSentence)}</em></p>`;
    front += '</div>';
    epubChapters.push({ title: 'Title Page', content: front, beforeToc: true });
  }

  for (const ch of chapters) {
    const ss = scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);
    let html = '';
    for (let i = 0; i < ss.length; i++) {
      if (options.includeSceneTitles) html += `<h3 class="st">${esc(ss[i].title)}</h3>`;
      if (options.includeSynopsis && ss[i].synopsis)
        html += `<blockquote class="sy"><em>Synopsis: ${esc(ss[i].synopsis!)}</em></blockquote>`;
      html += tiptapToHTML(ss[i].content);
      if (i < ss.length - 1 && options.sceneSeparator !== 'none') html += sepHTML(options.sceneSeparator) || '<br/><br/>';
    }

    epubChapters.push({
      title: options.includeChapterHeadings ? ch.title : `Chapter ${ch.order + 1}`,
      content: html || '<p>&nbsp;</p>',
    });
  }

  const result = await epubGen(
    {
      title: project.title,
      author: options.authorName || 'Unknown Author',
      description: project.oneSentence || '',
      css,
      prependChapterTitles: options.includeChapterHeadings,
      verbose: false,
    },
    epubChapters,
  );

  if (result instanceof Blob) return result;
  return new Blob([result as BlobPart], { type: 'application/epub+zip' });
}

/* ================================================================== */
/*  FORMAT BUILDERS — DOCX                                            */
/* ================================================================== */

const TWIP = 1440; // 1 inch

const PAGE_DIMS: Record<string, { w: number; h: number }> = {
  letter: { w: 12240, h: 15840 },
  a4:     { w: 11906, h: 16838 },
  a5:     { w: 8396,  h: 11906 },
  '6x9':  { w: 8640,  h: 12960 },
};

export async function buildDOCX(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): Promise<Blob> {
  const rawFont = options.fontFamily?.split(',')[0]?.trim().replace(/['"]/g, '') || 'Georgia';
  const halfPt  = Math.round((options.fontSize || 16) * 1.5);
  const lineSp  = Math.round((options.lineSpacing || 1.8) * 240);
  const pg      = PAGE_DIMS[options.pageSize] || PAGE_DIMS.letter;

  const kids: Paragraph[] = [];

  /* -- title page -- */
  if (options.includeFrontMatter) {
    kids.push(new Paragraph({ spacing: { before: 3000 } }));
    kids.push(new Paragraph({
      children: [new TextRun({ text: project.title, bold: true, size: halfPt + 16, font: rawFont })],
      alignment: AlignmentType.CENTER,
    }));
    if (options.authorName) {
      kids.push(new Paragraph({ spacing: { before: 400 } }));
      kids.push(new Paragraph({
        children: [new TextRun({ text: options.authorName, size: halfPt + 4, font: rawFont, color: '555555' })],
        alignment: AlignmentType.CENTER,
      }));
    }
    if (project.oneSentence) {
      kids.push(new Paragraph({ spacing: { before: 600 } }));
      kids.push(new Paragraph({
        children: [new TextRun({ text: project.oneSentence, italics: true, size: halfPt, font: rawFont, color: '777777' })],
        alignment: AlignmentType.CENTER,
      }));
    }
    kids.push(new Paragraph({ children: [new PageBreak()] }));
  }

  /* -- chapters -- */
  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];

    if (options.chapterPageBreaks && ci > 0)
      kids.push(new Paragraph({ children: [new PageBreak()] }));

    if (options.includeChapterHeadings)
      kids.push(new Paragraph({
        children: [new TextRun({ text: ch.title, bold: true, size: halfPt + 8, font: rawFont })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));

    const ss = scenes.filter(s => s.chapterId === ch.id).sort((a, b) => a.order - b.order);

    for (let si = 0; si < ss.length; si++) {
      const scene = ss[si];

      if (options.includeSceneTitles)
        kids.push(new Paragraph({
          children: [new TextRun({ text: scene.title, bold: true, size: halfPt + 2, font: rawFont })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        }));

      if (options.includeSynopsis && scene.synopsis)
        kids.push(new Paragraph({
          children: [new TextRun({ text: `Synopsis: ${scene.synopsis}`, italics: true, size: halfPt - 2, font: rawFont, color: '888888' })],
          indent: { left: Math.round(TWIP * 0.4) },
          spacing: { after: 100 },
          border: { left: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 8 } },
        }));

      kids.push(...ttToDocxParas(scene.content, rawFont, halfPt, lineSp));

      if (si < ss.length - 1 && options.sceneSeparator !== 'none')
        kids.push(docxSep(options.sceneSeparator, rawFont, halfPt));
    }
  }

  const headerDefault = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: options.authorName || '', size: 18, color: '999999', font: rawFont }),
          new TextRun({ text: '\t' }),
          new TextRun({
            text: project.title.slice(0, 40),
            size: 18,
            color: '999999',
            font: rawFont,
            italics: true,
          }),
          new TextRun({ text: '\t' }),
        ],
        tabStops: [
          { type: TabStopType.CENTER, position: Math.round(pg.w / 2 - TWIP) },
          { type: TabStopType.RIGHT, position: pg.w - TWIP * 2 },
        ],
      }),
    ],
  });

  const headerFirst = new Header({
    children: [new Paragraph({ children: [] })],
  });

  const footerDefault = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '999999' })],
      }),
    ],
  });

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'sutra-ol',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: Math.round(TWIP * 0.5), hanging: Math.round(TWIP * 0.25) } } },
        }],
      }],
    },
    sections: [{
      properties: {
        titlePage: options.includeFrontMatter,
        page: {
          size: { width: pg.w, height: pg.h },
          margin: { top: TWIP, right: TWIP, bottom: TWIP, left: TWIP },
        },
      },
      headers: options.includeFrontMatter
        ? { default: headerDefault, first: headerFirst }
        : { default: headerDefault },
      footers: { default: footerDefault },
      children: kids,
    }],
  });

  return Packer.toBlob(doc);
}

/* -- TipTap → docx paragraphs ------------------------------------ */

function ttToDocxParas(jsonStr: string, font: string, sz: number, ls: number): Paragraph[] {
  const doc = parseTT(jsonStr);
  if (!doc?.content) return [];
  return doc.content.flatMap(n => nodeToParas(n, font, sz, ls));
}

function nodeToParas(n: TTNode, font: string, sz: number, ls: number): Paragraph[] {
  switch (n.type) {
    case 'paragraph':
      return [new Paragraph({
        children: ttRuns(n, font, sz),
        spacing: { line: ls, after: 80 },
        widowControl: true,
      })];

    case 'heading': {
      const lvl = (n.attrs?.level as number) || 1;
      const hl = lvl === 1 ? HeadingLevel.HEADING_1 : lvl === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const bump = lvl === 1 ? 8 : lvl === 2 ? 4 : 2;
      return [new Paragraph({
        children: ttRuns(n, font, sz + bump),
        heading: hl,
        spacing: { before: 300, after: 150 },
      })];
    }

    case 'bulletList':
      return (n.content || []).flatMap(item =>
        (item.content || []).flatMap(child =>
          child.type === 'paragraph'
            ? [new Paragraph({ children: ttRuns(child, font, sz), bullet: { level: 0 }, spacing: { line: ls, after: 40 } })]
            : nodeToParas(child, font, sz, ls),
        ),
      );

    case 'orderedList':
      return (n.content || []).flatMap(item =>
        (item.content || []).flatMap(child =>
          child.type === 'paragraph'
            ? [new Paragraph({ children: ttRuns(child, font, sz), numbering: { reference: 'sutra-ol', level: 0 }, spacing: { line: ls, after: 40 } })]
            : nodeToParas(child, font, sz, ls),
        ),
      );

    case 'blockquote':
      return (n.content || []).flatMap(child => {
        if (child.type === 'paragraph') {
          return [new Paragraph({
            children: ttRuns(child, font, sz),
            indent: { left: Math.round(TWIP * 0.5) },
            border: { left: { style: BorderStyle.SINGLE, size: 2, color: 'AAAAAA', space: 8 } },
            spacing: { line: ls, after: 80 },
          })];
        }
        return nodeToParas(child, font, sz, ls);
      });

    case 'codeBlock':
      return [new Paragraph({
        children: [new TextRun({ text: plainExtract(n).trim(), font: 'Courier New', size: sz - 2 })],
        spacing: { line: ls, after: 80 },
      })];

    case 'horizontalRule':
      return [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999', space: 8 } },
        spacing: { before: 200, after: 200 },
      })];

    default:
      return [];
  }
}

function ttRuns(node: TTNode, font: string, sz: number): TextRun[] {
  const runs: TextRun[] = [];
  for (const c of node.content || []) {
    if (c.type === 'text') {
      const m = c.marks || [];
      runs.push(new TextRun({
        text: c.text || '',
        bold: m.some(x => x.type === 'bold'),
        italics: m.some(x => x.type === 'italic'),
        strike: m.some(x => x.type === 'strike'),
        font: m.some(x => x.type === 'code') ? 'Courier New' : font,
        size: sz,
      }));
    } else if (c.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1 }));
    }
  }
  if (runs.length === 0) runs.push(new TextRun({ text: '', font, size: sz }));
  return runs;
}

function docxSep(sep: string, font: string, sz: number): Paragraph {
  switch (sep) {
    case 'asterisks':
      return new Paragraph({
        children: [new TextRun({ text: '* * *', font, size: sz, color: '888888' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 300 },
      });
    case 'rule':
      return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999', space: 8 } },
        spacing: { before: 300, after: 300 },
      });
    case 'hash':
      return new Paragraph({
        children: [new TextRun({ text: '#', font, size: sz, color: '888888' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 300 },
      });
    default:
      return new Paragraph({ spacing: { before: 200, after: 200 } });
  }
}

/* ================================================================== */
/*  FORMAT BUILDERS — Print / PDF                                     */
/* ================================================================== */

export function printDocument(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
): void {
  const html = buildFullHTML(project, chapters, scenes, options);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

/* ================================================================== */
/*  MAIN ENTRY POINT                                                  */
/* ================================================================== */

export async function performExport(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[],
  options: ExportOptions,
  activeSceneId?: number | null,
): Promise<void> {
  const g = gatherContent(chapters, scenes, options, activeSceneId);
  const name = sanitize(project.title);

  switch (options.format) {
    case 'markdown':
      downloadFile(exportAsMarkdown(project, g.chapters, g.scenes, options), `${name}.md`, 'text/markdown');
      break;
    case 'plaintext':
      downloadFile(exportAsPlainText(project, g.chapters, g.scenes, options), `${name}.txt`, 'text/plain');
      break;
    case 'html':
      downloadFile(buildFullHTML(project, g.chapters, g.scenes, options), `${name}.html`, 'text/html');
      break;
    case 'epub':
      downloadBlob(await buildEPUB(project, g.chapters, g.scenes, options), `${name}.epub`);
      break;
    case 'docx':
      downloadBlob(await buildDOCX(project, g.chapters, g.scenes, options), `${name}.docx`);
      break;
    case 'rtf': {
      const { buildRTF } = await import('./rtfExport');
      downloadFile(buildRTF(project, g.chapters, g.scenes, options, activeSceneId), `${name}.rtf`, 'application/rtf');
      break;
    }
    case 'pdf': {
      const { buildPDF } = await import('./pdfExport');
      downloadBlob(
        await buildPDF(project, g.chapters, g.scenes, options, activeSceneId),
        `${name}.pdf`,
      );
      break;
    }
    case 'json':
      break;
  }
}

/* ================================================================== */
/*  DOWNLOAD UTILITIES                                                */
/* ================================================================== */

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ================================================================== */
/*  DEFAULT OPTIONS                                                   */
/* ================================================================== */

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'markdown',
  scope: 'full',
  includeTitle: true,
  includeChapterHeadings: true,
  includeSceneTitles: true,
  sceneSeparator: 'blank',
  includeSynopsis: false,
  includeFrontMatter: true,
  fontFamily: 'Georgia, serif',
  fontSize: 16,
  lineSpacing: 1.8,
  pageSize: 'letter',
  authorName: '',
  chapterPageBreaks: true,
};

export const BUILT_IN_PRESETS: Omit<CompilePreset, 'id' | 'projectId'>[] = [
  {
    name: 'Standard Manuscript',
    isBuiltIn: true,
    options: {
      format: 'docx',
      scope: 'full',
      includeTitle: true,
      includeChapterHeadings: true,
      includeSceneTitles: false,
      sceneSeparator: 'asterisks',
      includeSynopsis: false,
      includeFrontMatter: true,
      fontFamily: '"Times New Roman", serif',
      fontSize: 12,
      lineSpacing: 2.0,
      pageSize: 'letter',
      authorName: '',
      chapterPageBreaks: true,
    },
  },
  {
    name: 'E-book EPUB',
    isBuiltIn: true,
    options: {
      format: 'epub',
      scope: 'full',
      includeTitle: true,
      includeChapterHeadings: true,
      includeSceneTitles: false,
      sceneSeparator: 'asterisks',
      includeSynopsis: false,
      includeFrontMatter: true,
      fontFamily: 'Georgia, serif',
      fontSize: 16,
      lineSpacing: 1.6,
      pageSize: 'letter',
      authorName: '',
      chapterPageBreaks: true,
    },
  },
  {
    name: 'Trade Paperback',
    isBuiltIn: true,
    options: {
      format: 'pdf',
      scope: 'full',
      includeTitle: true,
      includeChapterHeadings: true,
      includeSceneTitles: false,
      sceneSeparator: 'asterisks',
      includeSynopsis: false,
      includeFrontMatter: true,
      fontFamily: '"Garamond", serif',
      fontSize: 11,
      lineSpacing: 1.5,
      pageSize: '6x9',
      authorName: '',
      chapterPageBreaks: true,
    },
  },
  {
    name: 'Proofing Copy',
    isBuiltIn: true,
    options: {
      format: 'pdf',
      scope: 'full',
      includeTitle: true,
      includeChapterHeadings: true,
      includeSceneTitles: true,
      sceneSeparator: 'rule',
      includeSynopsis: true,
      includeFrontMatter: true,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      lineSpacing: 1.8,
      pageSize: 'letter',
      authorName: '',
      chapterPageBreaks: true,
    },
  },
];
