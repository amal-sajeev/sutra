# Sutra (सूत्र)

**Thread your stories together.**

Sutra is a stylish, local-first writing application for novelists and storytellers. Inspired by Scrivener's project structure, the Snowflake Method for plotting, and Kurt Vonnegut's famous "character wallpaper" visualization from Slaughterhouse-Five.

All data lives in your browser's IndexedDB — no server, no account, no sync. Just you and your story.

## Features

- **Distraction-free editor** — TipTap-powered with markdown shortcuts, typewriter scroll, and zen/focus mode
- **Project binder** — organize chapters and scenes with drag-and-drop, context menus, and a writing heat map
- **Quick Idea Capture** — press `Ctrl+Space` anywhere to capture a thought without leaving your work
- **Idea Constellation** — your ideas self-organize into a force-directed graph using TF-IDF similarity clustering. Similar ideas drift together naturally.
- **Vonnegut Timeline ("The Wallpaper")** — each character is a colored line through the story. Lines cross when characters meet, stop when they die, and pass through vertical event bands
- **Character Relationship Web** — a node graph showing connections between characters (ally, rival, mentor, love, etc.)
- **Snowflake Method Wizard** — optional guided project setup: one-sentence summary, paragraph expansion, character sheets, scene generation
- **Scene Snapshots** — save named versions of any scene, browse, and restore
- **Split Editor** — view two scenes side by side
- **Two themes** — Lain mode (light, inspired by the NAVI OS from Serial Experiments Lain) and Matrix mode (dark, phosphor green, digital rain, CRT effects)
- **Export** — JSON full backup (re-importable) and Markdown/plain text manuscript export

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings > Pages > Source** and select **GitHub Actions**
3. The included workflow (`.github/workflows/deploy.yml`) auto-deploys on push to `main`
4. Your app will be live at `https://<username>.github.io/sutra/`

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Space` | Quick Idea Capture |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+\` | Toggle split editor |
| `Ctrl+Shift+T` | Typewriter scroll mode |
| `Ctrl+Shift+Z` | Zen/focus mode |

## Tech Stack

- React 18 + TypeScript
- Vite
- Framer Motion
- TipTap (ProseMirror)
- Dexie.js (IndexedDB)
- Zustand
- d3-force
- CSS Modules + Custom Properties

## Data

All data is stored locally in IndexedDB. Export your project as JSON at any time for backup. Nothing leaves your browser.

---

*Named after the Sanskrit word सूत्र (sutra) — "thread." Each character is a thread. The story is the tapestry.*
