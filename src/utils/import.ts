import mammoth from 'mammoth';

export interface ImportResult {
  title: string;
  chapters: { title: string; scenes: { title: string; html: string }[] }[];
  imageCount: number;
}

export async function importDocx(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild!;

  const chapters: ImportResult['chapters'] = [];
  let currentChapter: { title: string; scenes: { title: string; html: string }[] } | null = null;
  let currentScene: { title: string; html: string } | null = null;
  let imageCount = 0;

  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();

    if (tag === 'img') imageCount++;
    child.querySelectorAll('img').forEach(() => imageCount++);

    if (tag === 'h1') {
      if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
      if (currentChapter) chapters.push(currentChapter);
      currentChapter = { title: child.textContent?.trim() || 'Untitled Chapter', scenes: [] };
      currentScene = null;
    } else if (tag === 'h2') {
      if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
      currentScene = { title: child.textContent?.trim() || 'Untitled Scene', html: '' };
    } else if (tag === 'h3' || tag === 'h4') {
      if (currentScene) {
        currentScene.html += child.outerHTML;
      } else if (currentChapter) {
        currentScene = { title: child.textContent?.trim() || 'Untitled Scene', html: '' };
      }
    } else {
      if (!currentChapter) {
        currentChapter = { title: 'Chapter 1', scenes: [] };
      }
      if (!currentScene) {
        currentScene = { title: 'Scene 1', html: '' };
      }
      currentScene.html += child.outerHTML;
    }
  }

  if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
  if (currentChapter) chapters.push(currentChapter);

  if (chapters.length === 0) {
    chapters.push({
      title: 'Chapter 1',
      scenes: [{ title: 'Scene 1', html }],
    });
  }

  for (const ch of chapters) {
    if (ch.scenes.length === 0) {
      ch.scenes.push({ title: 'Scene 1', html: '' });
    }
  }

  const title = file.name.replace(/\.docx?$/i, '').trim() || 'Imported Document';

  return { title, chapters, imageCount };
}

type TipTapJSONNode = Record<string, unknown>;

export function htmlToTiptapJson(html: string): string {
  if (!html.trim()) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild!;

  const content: TipTapJSONNode[] = [];

  for (const child of Array.from(root.children)) {
    const node = elementToTiptap(child);
    if (node) content.push(node);
  }

  if (content.length === 0 && root.textContent?.trim()) {
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: root.textContent.trim() }],
    });
  }

  return JSON.stringify({ type: 'doc', content });
}

function elementToTiptap(el: Element): TipTapJSONNode | null {
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'p': {
      const inline = inlineChildren(el);
      return { type: 'paragraph', content: inline.length ? inline : undefined };
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Math.min(parseInt(tag[1]!, 10), 3);
      const inline = inlineChildren(el);
      return { type: 'heading', attrs: { level }, content: inline.length ? inline : undefined };
    }
    case 'ul': {
      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li');
      return {
        type: 'bulletList',
        content: items.map((li) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inlineChildren(li) }],
        })),
      };
    }
    case 'ol': {
      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li');
      return {
        type: 'orderedList',
        content: items.map((li) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inlineChildren(li) }],
        })),
      };
    }
    case 'blockquote': {
      const children: TipTapJSONNode[] = [];
      for (const child of Array.from(el.children)) {
        const node = elementToTiptap(child);
        if (node) children.push(node);
      }
      if (children.length === 0) {
        children.push({ type: 'paragraph', content: inlineChildren(el) });
      }
      return { type: 'blockquote', content: children };
    }
    case 'pre': {
      return {
        type: 'codeBlock',
        content: [{ type: 'text', text: el.textContent || '' }],
      };
    }
    case 'hr':
      return { type: 'horizontalRule' };
    case 'br':
      return null;
    default: {
      const inline = inlineChildren(el);
      if (inline.length > 0) {
        return { type: 'paragraph', content: inline };
      }
      return null;
    }
  }
}

function inlineChildren(el: Element): TipTapJSONNode[] {
  const result: TipTapJSONNode[] = [];
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) result.push({ type: 'text', text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element;
      const childTag = child.tagName.toLowerCase();

      if (['strong', 'b'].includes(childTag)) {
        for (const sub of inlineChildren(child)) {
          sub.marks = [...((sub.marks as TipTapJSONNode[]) || []), { type: 'bold' }];
          result.push(sub);
        }
      } else if (['em', 'i'].includes(childTag)) {
        for (const sub of inlineChildren(child)) {
          sub.marks = [...((sub.marks as TipTapJSONNode[]) || []), { type: 'italic' }];
          result.push(sub);
        }
      } else if (['u'].includes(childTag)) {
        for (const sub of inlineChildren(child)) {
          sub.marks = [...((sub.marks as TipTapJSONNode[]) || []), { type: 'underline' }];
          result.push(sub);
        }
      } else if (['s', 'del', 'strike'].includes(childTag)) {
        for (const sub of inlineChildren(child)) {
          sub.marks = [...((sub.marks as TipTapJSONNode[]) || []), { type: 'strike' }];
          result.push(sub);
        }
      } else if (childTag === 'a') {
        const href = child.getAttribute('href') || '';
        for (const sub of inlineChildren(child)) {
          sub.marks = [...((sub.marks as TipTapJSONNode[]) || []), { type: 'link', attrs: { href } }];
          result.push(sub);
        }
      } else if (childTag === 'code') {
        result.push({ type: 'text', text: child.textContent || '', marks: [{ type: 'code' }] });
      } else if (childTag === 'br') {
        result.push({ type: 'hardBreak' });
      } else if (['span', 'sup', 'sub'].includes(childTag)) {
        result.push(...inlineChildren(child));
      } else {
        const text = child.textContent || '';
        if (text) result.push({ type: 'text', text });
      }
    }
  }
  return result;
}

export async function importMarkdown(file: File): Promise<ImportResult> {
  const text = await file.text();
  const lines = text.split('\n');
  const chapters: ImportResult['chapters'] = [];
  let currentChapter: { title: string; scenes: { title: string; html: string }[] } | null = null;
  let currentScene: { title: string; html: string } | null = null;
  let buffer = '';

  const flushBuffer = () => {
    if (buffer.trim() && currentScene) {
      currentScene.html += `<p>${buffer.trim().replace(/\n/g, '<br>')}</p>`;
    }
    buffer = '';
  };

  for (const line of lines) {
    if (line.startsWith('# ')) {
      flushBuffer();
      if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
      if (currentChapter) chapters.push(currentChapter);
      currentChapter = { title: line.slice(2).trim(), scenes: [] };
      currentScene = null;
    } else if (line.startsWith('## ')) {
      flushBuffer();
      if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
      currentScene = { title: line.slice(3).trim(), html: '' };
    } else if (line.trim() === '') {
      flushBuffer();
    } else {
      buffer += (buffer ? '\n' : '') + line;
    }
  }

  flushBuffer();
  if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
  if (currentChapter) chapters.push(currentChapter);

  if (chapters.length === 0) {
    chapters.push({ title: 'Chapter 1', scenes: [{ title: 'Scene 1', html: `<p>${text}</p>` }] });
  }
  for (const ch of chapters) {
    if (ch.scenes.length === 0) ch.scenes.push({ title: 'Scene 1', html: '' });
  }

  const title =
    file.name.replace(/\.(md|markdown)$/i, '').trim() || 'Imported Document';
  return { title, chapters, imageCount: 0 };
}

export async function importPlainText(file: File): Promise<ImportResult> {
  const text = await file.text();
  const lines = text.split('\n');
  const chapters: ImportResult['chapters'] = [];
  let currentChapter: { title: string; scenes: { title: string; html: string }[] } | null = null;
  let currentScene: { title: string; html: string } | null = null;
  let sceneNum = 1;

  const flushScene = () => {
    if (currentScene && currentChapter) currentChapter.scenes.push(currentScene);
    currentScene = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '* * *' || trimmed === '***' || trimmed === '---' || trimmed === '# # #') {
      flushScene();
      sceneNum++;
      currentScene = { title: `Scene ${sceneNum}`, html: '' };
    } else if (trimmed === '') {
      if (currentScene) currentScene.html += '<p></p>';
    } else {
      if (!currentChapter) currentChapter = { title: 'Chapter 1', scenes: [] };
      if (!currentScene) currentScene = { title: `Scene ${sceneNum}`, html: '' };
      currentScene.html += `<p>${trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  }

  flushScene();
  if (currentChapter) chapters.push(currentChapter);
  if (chapters.length === 0) {
    chapters.push({ title: 'Chapter 1', scenes: [{ title: 'Scene 1', html: `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` }] });
  }

  const title = file.name.replace(/\.txt$/i, '').trim() || 'Imported Text';
  return { title, chapters, imageCount: 0 };
}
