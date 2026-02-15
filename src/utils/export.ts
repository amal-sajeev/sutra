import type { Project, Chapter, Scene } from '../types';

/**
 * Export manuscript as Markdown
 */
export function exportAsMarkdown(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[]
): string {
  let md = `# ${project.title}\n\n`;

  if (project.oneSentence) {
    md += `> ${project.oneSentence}\n\n`;
  }

  for (const chapter of chapters) {
    md += `## ${chapter.title}\n\n`;

    const chapterScenes = scenes
      .filter((s) => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);

    for (const scene of chapterScenes) {
      md += `### ${scene.title}\n\n`;
      // Parse TipTap JSON content to plain text
      const text = tiptapToPlainText(scene.content);
      md += `${text}\n\n`;
    }
  }

  return md;
}

/**
 * Export manuscript as plain text
 */
export function exportAsPlainText(
  project: Project,
  chapters: Chapter[],
  scenes: Scene[]
): string {
  let text = `${project.title}\n${'='.repeat(project.title.length)}\n\n`;

  for (const chapter of chapters) {
    text += `${chapter.title}\n${'-'.repeat(chapter.title.length)}\n\n`;

    const chapterScenes = scenes
      .filter((s) => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);

    for (const scene of chapterScenes) {
      text += `[${scene.title}]\n\n`;
      const content = tiptapToPlainText(scene.content);
      text += `${content}\n\n`;
    }
  }

  return text;
}

/**
 * Convert TipTap JSON to plain text
 */
function tiptapToPlainText(jsonStr: string): string {
  if (!jsonStr) return '';

  try {
    const doc = JSON.parse(jsonStr);
    return extractText(doc);
  } catch {
    // If it's already plain text, return as-is
    return jsonStr;
  }
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || '';

  let text = '';
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractText(child as Record<string, unknown>);
    }
  }

  // Add line breaks for block elements
  if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type as string)) {
    text += '\n';
  }

  return text;
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
