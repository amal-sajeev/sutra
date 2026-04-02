import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    revision: {
      setRevision: (round: number) => ReturnType;
      unsetRevision: () => ReturnType;
    };
  }
}

const REVISION_COLORS = ['#e55555', '#4488cc', '#44aa44', '#cc8844', '#8844cc'];

const RevisionMark = Mark.create({
  name: 'revision',

  addAttributes() {
    return {
      round: {
        default: 1,
        parseHTML: (el) => parseInt(el.getAttribute('data-revision-round') || '1', 10),
        renderHTML: (attrs) => ({
          'data-revision-round': String(attrs.round),
          style: `color: ${REVISION_COLORS[(attrs.round - 1) % REVISION_COLORS.length]}; text-decoration: underline;`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-revision-round]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'revision-mark' }), 0];
  },

  addCommands() {
    return {
      setRevision: (round: number) => ({ commands }) => {
        return commands.setMark(this.name, { round });
      },
      unsetRevision: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export default RevisionMark;
