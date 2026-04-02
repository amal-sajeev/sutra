import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentLink: {
      insertDocumentLink: (sceneId: number, title: string) => ReturnType;
    };
  }
}

const DocumentLink = Node.create({
  name: 'documentLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      sceneId: { default: null },
      title: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-document-link]',
        getAttrs: (el) => {
          const element = el as HTMLElement;
          const id = element.getAttribute('data-document-link');
          if (!id) return false;
          const fromAttr = element.getAttribute('data-document-title');
          const text = element.textContent?.trim() || '';
          const title =
            fromAttr ||
            (text.startsWith('[[') && text.endsWith(']]') ? text.slice(2, -2) : text) ||
            '';
          return { sceneId: Number(id), title };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { sceneId, title } = node.attrs as { sceneId: number | null; title: string };
    const label = title || 'Scene';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-document-link': sceneId != null ? String(sceneId) : '',
        'data-document-title': label,
        class: 'document-link',
        title: `Link to: ${label}`,
      }),
      `[[${label}]]`,
    ];
  },

  addCommands() {
    return {
      insertDocumentLink:
        (sceneId: number, title: string) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { sceneId, title },
            })
            .run();
        },
    };
  },
});

export default DocumentLink;
