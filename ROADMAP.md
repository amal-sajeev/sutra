# Sutra — Scrivener-Parity Roadmap

> A detailed audit of missing features, bugs, and improvements needed to bring Sutra to Scrivener-level quality for writing and exporting books.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Missing Features](#2-critical-missing-features)
3. [Export & Compile Engine](#3-export--compile-engine)
4. [Editor Enhancements](#4-editor-enhancements)
5. [Project & Document Organization](#5-project--document-organization)
6. [Research & Reference System](#6-research--reference-system)
7. [Character & World-Building Tools](#7-character--world-building-tools)
8. [Writing Targets & Analytics](#8-writing-targets--analytics)
9. [UI / UX Gaps](#9-ui--ux-gaps)
10. [Import Capabilities](#10-import-capabilities)
11. [Data Persistence & Backup](#11-data-persistence--backup)
12. [Bugs & Known Issues](#12-bugs--known-issues)
13. [Performance](#13-performance)
14. [Accessibility](#14-accessibility)
15. [Priority Matrix](#15-priority-matrix)

---

## 1. Executive Summary

Sutra is a well-architected, local-first writing application with strong visualization features (Vonnegut Timeline, Character Web, Idea Constellation). However, to reach Scrivener-level quality — the de facto standard for professional novel writing software — it requires significant investment in six core areas:

| Area | Sutra Today | Scrivener Standard |
|---|---|---|
| Compile / Export | Basic, 7 formats, limited layout control | Fully programmable compile with style mapping, transforms, and presets |
| Document structure | 2-level (chapter → scene) | Arbitrary depth binder with folders, documents, groups |
| Research & notes | Minimal NoteDocument | Dedicated Research folder with web pages, images, PDFs |
| Annotations | None | Inline comments, footnotes, endnotes, revision marks |
| Styles | None (unstyled prose) | Named paragraph & character styles with compile mapping |
| Import | JSON only | DOCX, RTF, Markdown, Final Draft, Fountain, Scrivener .scriv |

The sections below detail every gap with specific implementation guidance.

---

## 2. Critical Missing Features

### 2.1 Inline Comments & Annotations

**What Scrivener does:** Authors can highlight any span of text and attach an inline comment (shown as a bubble or margin note). Comments are distinct from the document body and can be shown/hidden. Footnotes and endnotes are first-class, compile-aware citizens.

**What Sutra has:** Nothing. There is no annotation layer whatsoever.

**Required work:**
- Add a TipTap `Comment` extension (custom mark storing `commentId` as an attribute)
- Add a `Comment` table to Dexie: `{ id, sceneId, projectId, selectedText, body, createdAt, resolved }`
- Add a `Footnote` / `Endnote` TipTap node type
- Build a comment sidebar that lists all comments for the active scene
- Support resolving/deleting comments
- Compile must strip comments from exported body and optionally collect footnotes/endnotes at the chapter or book level

---

### 2.2 Revision / Track-Changes Mode

**What Scrivener does:** A dedicated revision layer where deletions are colored strikethroughs and insertions are underlined. Revisions are color-coded by revision round (1st, 2nd, etc.). Authors can accept or reject individual changes.

**What Sutra has:** Snapshot system that saves full copies of a scene — useful but not surgical.

**Required work:**
- Integrate TipTap's `Collaboration` or a custom `TrackChanges` extension (ProseMirror has `prosemirror-track-changes`)
- Store revision metadata: `{ changeId, sceneId, type: 'insert'|'delete', author, round, timestamp }`
- Add a "Revision Mode" toggle in the toolbar
- Build accept/reject UI in the Inspector panel
- Revision rounds should be color-coded (round 1 = red, round 2 = blue, etc.)

---

### 2.3 Named Paragraph & Character Styles

**What Scrivener does:** The editor supports named styles (Body Text, Scene Heading, Block Quote, etc.). Styles drive compile formatting — you can map "Scene Heading" → bold 14pt with page break, without ever touching the raw text.

**What Sutra has:** Inline formatting only (bold, italic, etc.) with no concept of named styles.

**Required work:**
- Add a `Style` entity: `{ id, projectId, name, type: 'paragraph'|'character', tipTapAttrs }`
- Implement a TipTap custom node/mark for style application
- Build a Styles panel (like a Word styles pane) that shows all styles and allows creating/editing
- Default style set: Body Text, Chapter Heading, Scene Heading, Block Quote, Dialogue, Epigraph, First Paragraph
- Compile engine must read style assignments and apply format-specific transformations per output format

---

### 2.4 Scriptwriting / Screenplay Mode

**What Scrivener does:** Full Final Draft-compatible screenplay mode with element types (Scene Heading, Action, Character, Parenthetical, Dialogue, Transition) and tab/return navigation between them.

**What Sutra has:** No script mode.

**Required work:**
- Add a `scriptMode` flag per scene/project
- Implement Fountain syntax support (Fountain is the plain-text screenplay format)
- Build a TipTap extension for Fountain element recognition and styling
- Export screenplay scenes to PDF with standard screenplay formatting (Courier 12pt, specific margins)
- Optionally import `.fountain` and `.fdx` (Final Draft XML) files

---

### 2.5 Collections (Smart & Manual)

**What Scrivener does:** Collections are saved groupings of documents that cut across the project tree. A "Search Results" collection persists. Authors create manual collections (e.g., "All scenes with Marcus") or smart collections (auto-populated by metadata rules).

**What Sutra has:** No collections. Search results are transient.

**Required work:**
- Add a `Collection` entity: `{ id, projectId, name, type: 'manual'|'smart', rules?: FilterRule[], sceneIds?: number[] }`
- `FilterRule`: `{ field: 'status'|'label'|'tag'|'character'|'wordCount', operator, value }`
- Collections appear as a third section in the sidebar (after Draft, Research)
- Smart collections re-evaluate on every project load
- Manual collections support drag-to-add from the binder
- Saved search results become a collection

---

### 2.6 Custom Metadata Fields

**What Scrivener does:** Authors define project-wide custom metadata fields (text, checkbox, date, list) that appear on every document in the Inspector. These fields are filterable and can be included in the compile.

**What Sutra has:** Fixed metadata: synopsis, notes, status (3 values), label, tags, word target.

**Required work:**
- Add a `CustomMetaField` entity: `{ id, projectId, name, type: 'text'|'number'|'date'|'checkbox'|'select', options?: string[] }`
- Add a `CustomMetaValue` entity: `{ id, sceneId, fieldId, value: string }`
- Inspector panel shows custom fields below built-in metadata
- Outliner can display custom fields as columns (user-configurable)
- Export dialog can optionally write custom metadata into DOCX Properties

---

### 2.7 Bookmarks & Document Links

**What Scrivener does:** Any document in the binder can be bookmarked. Authors can also drag documents into a "Bookmarks" list in the Inspector for quick cross-reference. Inline document links (`[[Scene Title]]`) navigate to another document.

**What Sutra has:** No bookmarks, no document cross-linking.

**Required work:**
- Add a `Bookmark` entity: `{ id, sceneId, projectId, targetSceneId, note }` for per-document bookmarks
- Add a project-level bookmark list (global quick-access panel)
- Implement `[[` trigger in TipTap that fuzzy-searches scene titles and inserts a document link node
- Document link nodes render as clickable badges in the editor and navigate to the linked scene
- Inspector panel shows "Referenced By" — scenes that link to the current scene

---

## 3. Export & Compile Engine

The compile engine is Scrivener's most powerful and most-used feature. Sutra's current export is a baseline implementation.

### 3.1 Compile Presets

**Missing:** Saved compile configurations. Users need presets like "Standard Manuscript", "E-book", "Paperback 6×9", "Agent Submission" that pre-configure all compile options.

**Required work:**
- Add `CompilePreset` entity: `{ id, projectId, name, isBuiltIn, options: ExportOptions }`
- Built-in presets: Standard Manuscript Format, E-book (EPUB), Trade Paperback (6×9 DOCX), Screenplay PDF, Query Letter, Chapter Sampler
- Save/load/duplicate/delete presets from the Export dialog
- Presets store all current `ExportOptions` fields plus style overrides

---

### 3.2 Section Types & Layout Mapping

**Missing:** Scrivener's compile maps document types (Part, Chapter, Scene, Front Matter, Back Matter) to layout templates that control page breaks, headings, numbering, spacing, and running headers.

**What Sutra has:** A flat set of boolean options applied uniformly to all chapters/scenes.

**Required work:**
- Define `SectionType`: `{ id, name }` — e.g., Part, Chapter, Scene, Prologue, Epilogue, Front Matter
- Assign a `sectionType` to each chapter/scene (default: Chapter for chapters, Scene for scenes)
- Define `SectionLayout`: `{ id, sectionTypeId, titleFormat, pageBreakBefore, titleVisible, prefix, separator, headerFooterRule }`
- Compile engine applies the correct layout per section
- UI: "Assign Section Layouts" step in export dialog with a visual table showing Type → Layout mapping

---

### 3.3 DOCX Quality

**Current gaps in DOCX export:**
- No running headers/footers (author name, book title, page number — standard manuscript format requires "Surname / SHORT TITLE / Page #" in the top-right)
- No first-page header suppression
- No widow/orphan control paragraph settings
- No proper "double-spaced 12pt Times New Roman, 1-inch margins" Standard Manuscript Format preset
- No embedded fonts
- No proper scene separator rendering (currently just text)
- No drop cap support
- No table of contents generation

**Required work for each:**
- Running headers: use `docx` library's `Header` and `Footer` with page number field
- SMF preset: Courier/Times 12pt, double-spaced, 1-inch margins, author/title header after page 1
- Scene separators: render as centered `* * *` paragraph with correct spacing or a horizontal rule shape
- TOC: generate using `docx` TableOfContents block with auto-updated fields
- Drop caps: use `docx` DropCap run property on first character of chapter

---

### 3.4 EPUB Quality

**Current gaps in EPUB export:**
- No cover image support
- No table of contents (NCX / nav document)
- No proper metadata (dc:creator, dc:publisher, dc:rights, dc:language, ISBN)
- No chapter landmark navigation
- No custom CSS per chapter type
- EPUB 3 vs EPUB 2 choice not exposed

**Required work:**
- Export dialog: "Cover Image" upload (stored as `projectCoverImage` blob in the Project record)
- EPUB metadata form: Author, Publisher, Language, ISBN, Series, Series Number, Rights statement
- Auto-generate NCX (`toc.ncx`) and EPUB 3 nav (`nav.xhtml`) from chapter structure
- Apply CSS classes matching section types for chapter styling
- Expose EPUB 2 / EPUB 3 toggle (EPUB 2 for maximum device compatibility)

---

### 3.5 PDF Export

**Current gap:** PDF is delegated entirely to the browser's print dialog. This produces inconsistent output with browser chrome, no headers/footers, and poor control over page breaks.

**Required work:**
- Integrate `@react-pdf/renderer` or `pdfmake` for programmatic PDF generation
- Render the compiled manuscript into PDF with correct page dimensions, margins, fonts, running headers, page numbers
- Support Letter and A4 page sizes with correct bleed/trim if printing
- Alternatively: generate a high-fidelity HTML document and use `Puppeteer` via a local Node.js server process (since this is a local app using Vite, this is viable)

---

### 3.6 Markdown Export

**Current gaps:**
- No front matter (YAML front matter for title, author, date — required for Pandoc compatibility)
- No footnote syntax (`[^1]: footnote text`)
- No image embedding
- MultiMarkdown table support missing
- No option to export one file per chapter vs. single combined file

**Required work:**
- Add YAML front matter block: `---\ntitle: ...\nauthor: ...\ndate: ...\n---`
- Export footnotes as MultiMarkdown / Pandoc footnotes
- Add "Split by chapter" option creating a ZIP of `.md` files
- Ensure heading levels are correct relative to document structure depth

---

### 3.7 RTF Export

**Missing entirely.** RTF is the universal interchange format for word processors, required for submissions to publishers using older tools. Scrivener's primary native format is RTF internally.

**Required work:**
- Add `rtf-builder` or generate RTF manually from TipTap JSON
- RTF must support: bold, italic, underline, paragraph styles, page breaks, headers/footers
- This format is critical for agent/publisher submission compatibility

---

### 3.8 Final Draft / Fountain Export

**Missing.** Required for screenwriters.

**Required work:**
- Implement Fountain plain-text serializer for screenplay scenes
- Implement FDX (Final Draft XML) serializer for screenplay scenes
- Both export only scenes/chapters marked as `scriptMode: true`

---

## 4. Editor Enhancements

### 4.1 Tables

**Missing.** Scrivener supports tables for reference material, character sheets embedded in research docs, etc.

**Required work:**
- Add `@tiptap/extension-table` with `TableRow`, `TableCell`, `TableHeader`
- Add table insertion UI in the toolbar (insert N×M grid)
- Table cell merging/splitting support
- Table resizing by dragging column borders
- Tables in DOCX/EPUB export must render as proper table elements

---

### 4.2 Images in Documents

**Current state:** The TipTap `Image` extension is listed as a dependency but image insertion in the editor is not wired to a UI control. Images in scenes are not stored in IndexedDB.

**Required work:**
- Wire up an "Insert Image" toolbar button that opens a file picker
- Store images as Blobs in a new Dexie `Asset` table: `{ id, projectId, filename, mimeType, data: Blob }`
- TipTap image node stores an `assetId` (not a URL) to work offline
- Images must embed in DOCX (as `ImageRun`), EPUB (as media items), and HTML exports
- Add an Image Manager panel showing all images used in the project

---

### 4.3 Lists & Nesting

**Current state:** Bullet and ordered lists are available via TipTap StarterKit. However, nested list handling (Tab to indent, Shift+Tab to dedent) may not be keyboard-accessible.

**Missing:**
- Definition lists (term / definition pairs — useful for glossaries)
- Task lists (`[ ]` checkbox items — useful for research notes)
- List continue behavior: pressing Enter on an empty list item exits the list

**Required work:**
- Add `@tiptap/extension-task-list` and `TaskItem`
- Verify nested list keyboard navigation works correctly
- Add `TaskList` toolbar button

---

### 4.4 Text Statistics & Readability

**Missing:**
- Flesch-Kincaid readability score per scene
- Average sentence length
- Dialogue vs. prose ratio
- Overused word detection ("just", "very", "really", etc. highlighted on demand)
- POV perspective detection (1st/3rd person by pronoun frequency)

**Required work:**
- Implement a `textStats` utility that parses plain text from TipTap JSON
- Show readability panel in the Inspector under "Statistics" tab
- "Overused Words" mode: scan active scene for a configurable list of weak words, highlight them

---

### 4.5 Typewriter Scrolling & Composition Mode

**Current state:** Typewriter mode exists in `uiStore`. Zen mode exists.

**Missing:**
- Background image / texture for composition mode (Scrivener lets you set a full-screen background)
- Adjustable "paper width" in composition mode (narrow column on a wide screen)
- Ambient sound player (rain, coffee shop, library — common in writing apps)
- Paper color / texture customization

---

### 4.6 Auto-Correct & Smart Substitutions

**Missing:**
- Smart quotes (straight → curly) — the Typography TipTap extension partially handles this but it needs to be configurable
- Em dash substitution (`--` → `—`)
- Ellipsis substitution (`...` → `…`)
- Capitalize first word of sentence
- User-defined substitution table (like Scrivener's "Auto-Correct" preferences)

**Required work:**
- Build a substitution settings panel in Settings
- Store substitution rules in `ProjectSettings`
- Apply substitutions on keydown in the TipTap editor via `InputRule`

---

### 4.7 Linguistic Focus Tools

**Missing (from Scrivener and competitors like Ulysses):**
- "Focus Mode": dim everything except the current sentence/paragraph/line
- Name highlighting: highlight all occurrences of a character name in the scene
- POV camera indicator: show which POV character is active for this scene

---

## 5. Project & Document Organization

### 5.1 Arbitrary Depth Binder

**Current state:** Sutra has exactly two levels: Chapter → Scene. This is adequate for simple novels but insufficient for:
- Non-fiction books (Parts → Chapters → Sections → Sub-sections)
- Screenplay (Acts → Sequences → Scenes)
- Series bibles or world-building wikis
- Research folders with sub-folders

**What Scrivener does:** The Binder is a full tree of arbitrary depth. Any node can be a "folder" (container) or a "document" (has its own text). Documents can have sub-documents.

**Required work:**
- Extend the schema: add a generic `BinderNode` table replacing the current Chapter/Scene split
  ```typescript
  BinderNode {
    id: number
    projectId: number
    parentId: number | null     // null = root level
    type: 'folder' | 'document'
    title: string
    order: number
    sectionType?: string
    content?: string            // null for folders
    synopsis?: string
    // ... all existing Scene metadata fields
  }
  ```
- Migrate existing Chapter/Scene data into BinderNode on schema v4 upgrade
- Rewrite Sidebar to render a recursive tree with expand/collapse
- Support drag-and-drop at any level (including promoting/demoting nodes)
- This is the most architecturally significant change required

---

### 5.2 Research Folder

**Current state:** `NoteDocument` exists in the schema but is minimally implemented (basic text editor, no rich media).

**What Scrivener does:** The Research folder in the Binder holds web archives, PDFs, images, and text documents. Web pages can be imported as WebArchive (offline snapshots). All research materials are stored in the .scriv package.

**Required work:**
- Integrate Research into the Binder as a dedicated top-level folder (sibling to "Draft")
- Research nodes can be of type: `text`, `image`, `pdf`, `webarchive`
- `text` nodes: full rich-text editor (same TipTap instance)
- `image` nodes: display an imported image with zoom
- `pdf` nodes: embed a PDF viewer (use `pdfjs-dist`)
- `webarchive` nodes: snapshot a URL via a headless fetch + HTML serialization, store in IndexedDB
- Add "Import Web Page" action that fetches, inlines CSS/images, and saves as a webarchive node

---

### 5.3 Front Matter & Back Matter

**Current state:** Export dialog has `includeFrontMatter: boolean` but front matter content is not editable anywhere in the UI. There is no back matter concept.

**What Scrivener does:** Front matter is a special Binder folder (e.g., "Front Matter / E-book / Title Page") with actual editable documents. Different compile presets include different front matter folders.

**Required work:**
- Add dedicated "Front Matter" and "Back Matter" top-level binder folders
- These folders are excluded from main manuscript word count
- Each compile preset specifies which front matter folder to prepend and which back matter folder to append
- Default front matter documents: Title Page, Copyright Page, Dedication, Table of Contents placeholder, Epigraph
- Default back matter documents: About the Author, Also By, Acknowledgements

---

### 5.4 Scene / Document Templates

**Current state:** New scenes are always created blank.

**What Scrivener does:** New documents can be created from a template (a document in the "Templates" folder). Common templates: Character Sheet, Location Sheet, Scene with standard fields, Interview Q&A.

**Required work:**
- Add a "Templates" folder as a special Binder section
- Any document in Templates can be used as a new document template
- "New Scene from Template" context menu option
- Built-in template: Character Sheet (with Name, Age, Role, Description, Motivation, Backstory headings), Location Sheet, Scene Card

---

### 5.5 Labels, Status, and Keywords — Full System

**Current state:**
- `status` is hardcoded to `'draft' | 'revision' | 'final'`
- `label` is a freeform string (color intent unclear)
- `tags` is a string array (good foundation)

**What Scrivener does:**
- Status: configurable per-project list (users can rename/add values, assign colors)
- Label: configurable per-project colored label (used for POV, location, etc. — entirely user-defined meaning)
- Keywords: hierarchical keyword tree. A scene can have multiple keywords. Keywords can be searched, filtered on, and used in smart collections.

**Required work:**
- Add `StatusOption` entity: `{ id, projectId, name, color }`
- Add `LabelOption` entity: `{ id, projectId, name, color }`
- `Scene.status` and `Scene.label` become foreign keys to these tables
- Add a `Keyword` entity: `{ id, projectId, name, parentId }` (hierarchical)
- Add `SceneKeyword` junction table
- Keyword panel in Inspector: shows keywords for current scene with add/remove
- Keyword browser: shows all project keywords as a tree with document counts
- Migrate existing `tags` to the new Keyword system

---

### 5.6 Outliner Enhancements

**Current state:** Outliner shows fixed columns: Title, Synopsis, Words, Status, Chapter, Last Edited.

**Missing:**
- User-configurable column set (add/remove columns, reorder by drag)
- Custom metadata columns
- Inline synopsis editing (click cell to edit, currently the outliner is read-only for synopsis)
- Multi-select rows for bulk status/label changes
- Drag-to-reorder rows within the outliner
- Color-coded label column (color swatch, not just text)
- Group by Chapter toggle (flat list vs. grouped)

---

### 5.7 Corkboard Enhancements

**Current state:** Cards show title, synopsis, status indicator, word count. Drag-to-reorder within a chapter.

**Missing:**
- Freeform layout mode (place cards anywhere on the board, not just in a grid)
- Card size options (small/medium/large)
- Multi-chapter view (all scenes across all chapters on one board)
- Pinning cards to fixed positions
- Index card back side (notes visible on flip)
- Color-coded card borders by label
- Card stamps (status icons shown prominently on card face)
- View all scenes as a linear strip (horizontal scroll, like Scrivener's "Index Card" horizontal layout)

---

## 6. Research & Reference System

### 6.1 Project Notes (Global)

**Current state:** NoteDocuments exist but lack rich structure.

**Missing:**
- A dedicated "Project Notes" pane (a single always-accessible scratchpad for the whole project)
- "Document Notes" (per-scene notes — the `notes` field exists but has no dedicated UI panel, it's buried in the Inspector)
- Notes should use the same full TipTap editor as scenes

---

### 6.2 Name Generator

**Missing.** Scrivener doesn't have this either, but competitors like Ulysses and many writing tools integrate a name generator. Very useful during drafting.

**Required work:**
- Integrate a name database (first names + surnames by nationality/era)
- Name generator panel accessible from Tools menu
- Generate N names by: gender, nationality, era, first/last/full
- Click to insert at cursor

---

### 6.3 Glossary / World-Building Database

**Missing.** For fantasy/sci-fi writers, a structured glossary of terms, places, and lore is essential.

**Required work:**
- Add a `GlossaryEntry` entity: `{ id, projectId, term, definition, category, aliases: string[] }`
- Glossary view: searchable table of all terms
- Inline dictionary: right-click a word in the editor → "Add to Glossary" or "Look Up in Glossary"
- Glossary can be exported as an appendix in compile

---

## 7. Character & World-Building Tools

### 7.1 Character Sheet — Full Form

**Current state:** Characters have: name, color, description, role, motivation, goal, conflict, epiphany.

**Missing (Scrivener / dedicated character tools have):**
- Physical description fields: age, gender, height, eye color, hair, distinguishing features
- Backstory freeform rich text
- Character arc summary (beginning → midpoint → end state)
- Internal vs. external conflict distinction
- Character image / portrait (upload and display)
- Voice notes (characteristic phrases, speech patterns)
- Character tags / keywords
- Export character sheets as a formatted document

**Required work:**
- Expand `Character` entity with additional fields
- Build a dedicated "Character Detail" modal/panel with sections: Identity, Appearance, Psychology, Arc, Voice, Notes
- Allow attaching an image (stored as Asset)
- "Character Report" export: generate a formatted PDF or DOCX of all characters

---

### 7.2 Scene-Character Linking (Formal)

**Current state:** Character appearances in the Vonnegut Timeline can be linked to a `sceneId`, but there is no UI to do this linking systematically. The character web and timeline are disconnected from the actual scene content.

**Missing:**
- Inspector panel section: "Characters in this Scene" — tag which characters appear in the current scene
- From the character list, see which scenes a character appears in (click to navigate)
- This data drives smart collections: "All scenes with Marcus and Elena"
- Scene-character links are formal (own join table), not inferred from text

**Required work:**
- Add `SceneCharacter` junction table: `{ sceneId, characterId, role: 'POV'|'present'|'mentioned' }`
- Inspector: "Characters" tab showing scene cast with add/remove
- Character detail: "Appearances" tab listing scenes in order

---

### 7.3 Location / Setting Database

**Missing entirely.** Scrivener treats this as a research document; dedicated tools give it structure.

**Required work:**
- Add `Location` entity: `{ id, projectId, name, description, parentLocationId, tags }`
- Location hierarchy: Country → City → Building → Room
- Attach locations to scenes (a scene can have one primary location)
- Location map: a simple 2D "map" where locations can be positioned as labeled dots (optional)
- Locations exported as appendix

---

### 7.4 Timeline Enhancements

**Current state:** Vonnegut Timeline shows fortune arcs and timeline event bands. Character appearances are draggable.

**Missing:**
- **Story-time vs. Plot-time axis toggle:** Scrivener + Aeon Timeline distinguish between when events happen in the story world (chronological) and the order they appear in the manuscript (plot order)
- **Date/time anchoring:** Assign a calendar date to each scene (or timeline event), show actual dates on the axis
- **Gantt-style chapter bands:** Show chapter boundaries as horizontal bands behind character lines
- **Scene card overlay:** Hovering a character appearance shows the associated scene card
- **Export timeline as image (SVG/PNG)**
- **Multiple character line colors** beyond the character's node color

---

### 7.5 Plot Structure Templates

**Current state:** Snowflake Method wizard creates chapters and scenes based on a 3-act structure.

**Missing:**
- Hero's Journey template (12 stages)
- Save the Cat Beat Sheet (15 beats)
- 7-Point Story Structure
- Story Circle (Dan Harmon)
- User-defined beat sheet
- Visual beat sheet view showing all story beats as a horizontal track against word count progress

**Required work:**
- Add `PlotStructure` entity with named beat templates
- "Plot Beats" view: a horizontal bar divided into named beats, each beat shows which scenes are assigned to it
- Scenes can be tagged with a beat (stored as custom metadata or a dedicated `beatId` field)

---

## 8. Writing Targets & Analytics

### 8.1 Project Deadline & Daily Target Calculator

**Current state:** Word goal exists in `uiStore` but is a simple number with no deadline or session logic.

**What Scrivener does:** Set a manuscript target word count + a deadline date. Scrivener calculates the required daily word count to meet the deadline, adjusting automatically as you fall behind or ahead. "Allow target to increase" option.

**Required work:**
- Store in `ProjectSettings`: `{ manuscriptTarget, deadlineDate, writingDaysPerWeek, countDirection: 'up'|'down', allowOverrun }`
- Dashboard / stats panel: show daily required words, current pace, projected completion date
- "On track / Behind / Ahead" status indicator

---

### 8.2 Session Targets

**Current state:** Session target exists in `uiStore` but resets on page reload (not persisted).

**Missing:**
- Persist session target to `localStorage` with date expiry
- Session target can be words written OR time spent
- Session timer (a count-up or count-down timer visible in the bottom bar)
- Session completion celebration (confetti / toast) when target is hit
- "Fresh start" button to reset session counter mid-day

---

### 8.3 Writing Streak & History

**Current state:** `WritingHistory` table stores daily word counts. A 30-day history graph exists in `ProjectStats`.

**Missing:**
- Streak counter (consecutive days with at least N words written)
- Calendar heatmap view (GitHub-style, 52 weeks × 7 days)
- Best day / best week stats
- Per-project vs. total-across-projects stats
- Export writing history as CSV

---

### 8.4 Readability & Manuscript Statistics

**Missing:**
- Page count estimation (words ÷ 250 words/page for standard manuscript)
- Reading time estimation (already exists — good)
- Chapter-level word count targets with progress bars
- Pacing graph: word count per chapter visualized as a bar chart to spot short/long outlier chapters

---

## 9. UI / UX Gaps

### 9.1 Multiple Windows / Tabs

**Current state:** Single-window app. Opening in multiple tabs will cause IndexedDB write conflicts.

**Missing:**
- Open any document in a separate floating window
- Or at minimum, detect duplicate tab and show a warning

---

### 9.2 Keyboard Shortcut System — Completeness

**Current state:** Settings panel mentions keyboard shortcuts but the implementation is unclear.

**Missing:**
- Full keyboard shortcut reference sheet (accessible via `?` or `Cmd+/`)
- Shortcuts for every major action: open scene, create chapter, compile, switch view, etc.
- Vim mode toggle (for users who prefer modal editing)
- Shortcuts for navigating between scenes (Up/Down arrows in binder focus)

---

### 9.3 Quick Open (Command Palette)

**Missing.** Modern writing apps and IDEs all have Cmd+P / Cmd+K quick-open.

**Required work:**
- Cmd+P opens a fuzzy-search palette searching scene titles, character names, note titles
- Results show type icon (scene, character, note) and chapter/location context
- Pressing Enter navigates to the item
- Recent items shown when palette is empty

---

### 9.4 Distraction-Free / Composition Mode

**Current state:** "Zen mode" hides some UI. Typewriter mode centers scroll.

**Missing:**
- True full-screen composition mode (hides OS taskbar)
- Custom background color or image behind the "paper"
- Adjustable paper width (percentage of screen)
- Fade-in/out UI controls on mouse movement
- Background audio player (ambient sounds)

---

### 9.5 Context Menus — Completeness

**Current state:** Right-click on scenes/chapters in the sidebar provides a context menu.

**Missing context menu items:**
- "Duplicate Scene" (with content copy)
- "Merge Scene Down" (append content to next scene, delete this one)
- "Split Scene at Cursor" (from within editor, split at current cursor position)
- "Move to Research"
- "Export Scene Only"
- "Lock Scene" (make read-only to prevent accidental edits)

---

### 9.6 Binder Icon & Status Indicators

**Missing:**
- Document icons showing status (colored dot, stamp icon) directly in the binder tree
- Paperclip icon when a scene has inspector notes attached
- Target icon when a scene has a word target set
- Lock icon when a scene is locked

---

### 9.7 Appearance & Theming

**Current state:** Two themes: Lain (dark, purple) and Matrix (dark, green).

**Missing:**
- Light theme variant
- High-contrast accessibility theme
- User-customizable accent color
- Custom CSS import (power user feature)
- Page / paper background color separate from editor chrome color
- Custom font upload (WOFF2 support)

---

## 10. Import Capabilities

### 10.1 DOCX Import

**Missing.** This is critical — most writers have existing manuscripts in Word.

**Required work:**
- Integrate `mammoth.js` (excellent DOCX → HTML converter, already battle-tested)
- Import wizard: select file → preview conversion → choose: "New Project" or "Import into current project as chapter"
- Map heading styles (Heading 1 → Chapter, Heading 2 → Scene)
- Preserve bold, italic, underline, block quotes
- Handle images by storing them as Assets
- Show a diff summary: "Imported 12 chapters, 48 scenes, 3 images"

---

### 10.2 Markdown Import

**Missing.** Essential for writers who draft in Markdown editors (iA Writer, Obsidian, Typora).

**Required work:**
- Use a Markdown parser (e.g., `marked` or `unified`) to parse `.md` files
- Support `# Heading` → Chapter, `## Heading` → Scene splitting
- YAML front matter parsed for title, author
- Import single file or a folder of `.md` files (ZIP upload)
- Footnote syntax (`[^1]`) → Footnote nodes

---

### 10.3 Scrivener `.scriv` Import

**Highly desirable.** Many target users are migrating from Scrivener.

**Required work:**
- A `.scriv` package is a folder; on macOS it presents as a file. Accept ZIP upload of the `.scriv` contents.
- Parse `project.scrivx` (XML) for the binder structure
- Read RTF content files and convert to TipTap JSON (RTF → HTML via a JS RTF parser, then HTML → TipTap)
- Import characters, labels, status values, keywords, synopsis
- This is complex but strategically very important

---

### 10.4 Plain Text / RTF Import

**Missing.**
- Plain text: parse `---` or multiple blank lines as scene breaks
- RTF: use `rtf.js` or similar to convert to HTML then to TipTap JSON

---

### 10.5 Fountain Import (Screenplay)

**Missing.**
- Parse `.fountain` files
- Each scene heading becomes a new Scene node in screenplay mode

---

## 11. Data Persistence & Backup

### 11.1 Auto-Backup to File System (OPFS / File System Access API)

**Current state:** All data is in IndexedDB. IndexedDB can be cleared by the browser without warning (especially in incognito mode, or if the browser decides to reclaim storage). There is no file on disk.

**Critical risk:** Users can lose their entire manuscript if they clear site data.

**Required work:**
- Use the **File System Access API** (`window.showDirectoryPicker`) to let users choose a folder for their project files
- Auto-save the project JSON to this folder on every change (debounced)
- Show a "Backup Location" indicator in the top bar
- On app start, offer to load from a previously chosen folder
- Alternatively, use the **Origin Private File System (OPFS)** for a sandboxed persistent folder

---

### 11.2 Automatic Timed Backup

**Missing.**
- Every 30 minutes (configurable), auto-export a full project JSON backup to the user-chosen backup folder
- Keep the last N backups (configurable, default 10)
- Show "Last backup: 12 minutes ago" in status bar
- Manual "Back Up Now" button

---

### 11.3 Cloud Sync (Optional)

**Out of scope for a local-first app but worth noting for future:**
- Sync via user's own Dropbox / Google Drive / iCloud using their OAuth token + File System API
- Git-based sync (export to a local git repo, user syncs via their own git service)

---

### 11.4 Project Portability

**Current state:** Export as JSON (entire project) and re-import. Good foundation.

**Missing:**
- Export project as a `.sutra` package (ZIP containing JSON + all assets/images)
- Import `.sutra` package
- Show project size (total bytes in IndexedDB)
- "Move project" — export + re-import to a new profile / browser

---

## 12. Bugs & Known Issues

### 12.1 [CRITICAL] No Data Durability Warning

IndexedDB data can be evicted by the browser. Users are never warned that their manuscript is stored in a browser database that could be cleared. This is the single highest-risk issue in the application.

**Fix:** Show a persistent banner on first use explaining the storage limitation. Prompt users to set up a backup location. Add a "Storage Health" indicator.

---

### 12.2 [HIGH] PDF Export Is Not Real PDF Export

The PDF "export" opens the browser print dialog. The output is browser-dependent, includes browser chrome on some platforms, and gives the user no control over page dimensions, running headers, or manuscript formatting.

**Fix:** Implement programmatic PDF generation as described in §3.5.

---

### 12.3 [HIGH] Image Support Is Incomplete

The TipTap `Image` extension is registered but image insertion is not wired up in the toolbar or stored in IndexedDB. Attempting to insert an image (if a user pastes one) will produce a broken `<img src="blob:...">` reference that disappears on reload.

**Fix:** Implement the Asset table and image storage pipeline described in §4.2.

---

### 12.4 [MEDIUM] Note Documents Lack Rich Editing

`NoteDocument` exists in the schema with a title and content field, but the `NoteEditor` component uses a basic `<textarea>` or minimal editor instead of the full TipTap instance used for scenes. Notes cannot contain formatted text, links, or images.

**Fix:** Swap `NoteEditor` for the full `Editor` component (reuse the same TipTap configuration).

---

### 12.5 [MEDIUM] WritingHistory Timezone Issues

`WritingHistory` groups writing sessions by `YYYY-MM-DD` using the browser's local timezone. If a user writes just after midnight local time but their browser's `new Date().toISOString()` produces the previous day's date in UTC, the word count is credited to the wrong day.

**Fix:** Use `new Date().toLocaleDateString('en-CA')` consistently (this returns YYYY-MM-DD in local time) or store a timezone-aware timestamp.

---

### 12.6 [MEDIUM] Snapshot Name Length for Non-English Locales

Auto-generated snapshot names use `new Date().toLocaleString()` which in some locales produces very long strings (e.g., Japanese locale produces "2024年11月15日 午後3:45:22"). This overflows the snapshot list UI.

**Fix:** Use a fixed format: `new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())` or limit to 40 characters.

---

### 12.7 [MEDIUM] Force Simulation Rebuilds on Every Render

In `CharacterWeb.tsx` and `IdeaConstellation.tsx`, the d3-force simulation is restarted whenever the characters/ideas arrays change. This causes visible thrashing when adding a single character or idea.

**Fix:** Use `simulation.nodes(updatedNodes)` to update nodes in-place and call `simulation.alpha(0.3).restart()` for incremental updates instead of full rebuilds.

---

### 12.8 [LOW] Trash Accumulates Indefinitely

Deleted items in the Trash table are never automatically cleaned. A user who has been using the app for months could accumulate thousands of trash items, slowing down the Trash view's load.

**Fix:** Add an auto-purge policy: trash items older than 30 days are permanently deleted. Show this policy in the Trash UI. Add a configurable retention period in Settings.

---

### 12.9 [LOW] Corrupted Scene Content Silent Failure

If a scene's TipTap JSON content is malformed, parsing fails silently and the scene appears blank. The user receives no indication that their content has been lost or corrupted.

**Fix:** On parse failure, show an error state in the editor with a "Recover raw content" button that displays the raw JSON string in a `<pre>` block so the user can manually recover data.

---

### 12.10 [LOW] Long Scene Titles Break Sidebar Layout

Scene and chapter titles with 60+ characters overflow the sidebar list items, causing text truncation without a tooltip showing the full title.

**Fix:** Add `title` tooltip attributes to sidebar items. Truncate with CSS `text-overflow: ellipsis` and ensure the truncation is visible (not just hidden overflow).

---

### 12.11 [LOW] No Confirmation on Permanent Trash Empty

The "Empty Trash" button permanently deletes all trashed items. There is a generic `ConfirmDialog` system in place but it's unclear if it's wired to the Empty Trash action.

**Fix:** Require confirmation with the exact count: "Permanently delete 12 items? This cannot be undone."

---

## 13. Performance

### 13.1 Large Projects (100k+ Words)

**Risk:** With many scenes open in Scrivenings view, the app creates N TipTap editor instances simultaneously. At 100+ scenes this will cause significant memory pressure and slow initial render.

**Fix:**
- Implement virtual scrolling in Scrivenings view (only render editors for visible scenes)
- Or use a single merged editor for Scrivenings and treat scene boundaries as special nodes

### 13.2 TF-IDF Index Rebuild

The TF-IDF index for Idea Constellation rebuilds synchronously when any idea is added/removed. With 500+ ideas this could block the main thread for hundreds of milliseconds.

**Fix:** Move TF-IDF computation to a Web Worker.

### 13.3 IndexedDB Read on Every Keystroke

The auto-save debounce at 500ms calls `db.scenes.update()` on every writing pause. This is fine for single scenes but if multiple scene editors are mounted (Scrivenings), writes could queue up.

**Fix:** Batch writes using a write queue in the store. Confirm only one pending write per scene ID at a time.

---

## 14. Accessibility

### 14.1 ARIA Labels

The sidebar tree, context menus, and modal dialogs likely lack full ARIA role/label/state attributes. Screen reader users cannot navigate the binder.

**Required:** Full ARIA tree widget for the binder, `role="dialog"` and focus trap for modals, `aria-expanded` on collapsible sections.

### 14.2 Keyboard Navigation

Force-directed graph visualizations (Character Web, Idea Constellation) are currently mouse-only. Keyboard users cannot interact with them.

**Fix:** Add keyboard navigation for force graphs: Tab to focus nodes, arrow keys to select adjacent nodes, Enter to edit, Delete to remove.

### 14.3 Color Contrast

Both themes (Lain, Matrix) are dark with low-contrast UI elements. Ensure all text meets WCAG AA (4.5:1 for body text, 3:1 for UI elements).

### 14.4 Reduced Motion

Framer Motion animations and the digital rain effect do not respect `prefers-reduced-motion`. Add `useReducedMotion()` from Framer Motion and disable or minimize animations accordingly.

---

## 15. Priority Matrix

The following table ranks all items by **impact** (how much it moves toward Scrivener parity) and **effort** (estimated implementation complexity).

| Priority | Feature / Fix | Impact | Effort | Notes |
|---|---|---|---|---|
| **P0** | Data durability warning + File System API backup | Critical | Medium | Users can lose manuscripts today |
| **P0** | Programmatic PDF export | High | Medium | Current PDF is unusable for submission |
| **P0** | DOCX import (mammoth.js) | High | Low | Most users have existing Word manuscripts |
| **P0** | Inline comments / annotations | High | High | Core writing workflow feature |
| **P1** | RTF export | High | Medium | Required for publisher submission |
| **P1** | Named paragraph styles + compile mapping | High | High | Unlocks professional formatting |
| **P1** | Arbitrary depth binder (multi-level tree) | High | Very High | Architectural change, enables non-fiction |
| **P1** | DOCX running headers/footers + SMF preset | High | Medium | Standard manuscript format is non-negotiable |
| **P1** | Revision / track changes mode | High | High | Critical for editing phase |
| **P1** | Compile presets (save/load) | Medium | Low | High daily use value |
| **P2** | Research folder with PDF/image/web support | High | High | Core Scrivener feature |
| **P2** | Collections (smart + manual) | Medium | Medium | Power-user organization feature |
| **P2** | Custom metadata fields | Medium | Medium | Required for non-fiction and complex projects |
| **P2** | Quick Open command palette (Cmd+P) | Medium | Low | High UX value, low effort |
| **P2** | Scene/character linking (formal) | Medium | Medium | Drives smart collections |
| **P2** | Deadline + daily target calculator | Medium | Low | NaNoWriMo users expect this |
| **P2** | EPUB cover image + TOC + metadata | Medium | Medium | EPUB is currently incomplete |
| **P2** | Image storage in Assets table | Medium | Medium | Required for illustrated books |
| **P3** | Configurable status/label options | Medium | Low | Low effort, removes friction |
| **P3** | Markdown import | Medium | Low | Obsidian/iA Writer users |
| **P3** | Tables in editor + export | Medium | Medium | Reference material, non-fiction |
| **P3** | Corkboard freeform layout | Low | High | Nice but not critical |
| **P3** | Scriptwriting / Fountain mode | Medium | High | Only needed for screenwriters |
| **P3** | Plot structure templates (HSJ, Save the Cat) | Medium | Medium | Good for plot planning |
| **P3** | Name generator | Low | Low | QoL feature |
| **P3** | Ambient sound player | Low | Low | QoL feature |
| **P4** | Light theme | Medium | Low | Accessibility |
| **P4** | Scrivener .scriv import | High | Very High | Strategic but extremely complex |
| **P4** | Web Worker for TF-IDF | Low | Low | Only matters at 500+ ideas |
| **P4** | Virtual scrolling in Scrivenings | Low | Medium | Only matters at 100+ scenes |

---

## 16. Live UI Review — Confirmed Visual & Interaction Bugs

> This section was produced by running the application and systematically inspecting every view, panel, dialog, and interaction. Issues are confirmed real, not theoretical.

---

### 16.1 [CRITICAL — FIXED] Modal Rendered Inside TopBar's `backdrop-filter` Container

**Status: Fixed in this session.**

All modals (Export, Settings, Stats, Search, Trash, Confirm) were rendered inside the TopBar's DOM tree. The TopBar `<header>` has `backdrop-filter: blur(10px)`, which per the CSS spec creates a new containing block for `position: fixed` descendants. The modal backdrop was trapped inside the 48px-tall topbar, rendering the modal body 297px above the viewport. The format selector, title, and upper content of every modal were completely invisible.

**Fix applied:** `Modal.tsx` now uses `createPortal(…, document.body)` to escape the containing block, plus `max-height: calc(100vh - 48px)` and `overflow-y: auto` on the modal body.

---

### 16.2 [HIGH] Export Button Is Invisible to Users

The export button in the TopBar is an unlabelled icon (`aria-label="Export manuscript"`) with no text, no distinctive color, and no visual weight separating it from 5 other identical icon buttons beside it. In testing, the button was effectively undiscoverable.

**Fix:**
- Give the export button a visible text label ("Export") or use a visually distinct filled/accent-colored button style
- Alternatively add a dedicated "Compile" button styled prominently like Scrivener's compile button (blue, large, far right)

---

### 16.3 [HIGH] Split Editor Has No TopBar Toggle Button

The split editor is only accessible via right-click context menu on a scene item ("Open in Split View") or the keyboard shortcut `Ctrl+\`. There is no button in the TopBar to toggle it. The Shortcuts reference lists `Ctrl+\` but most users will never discover it.

**Fix:** Add a split-editor toggle button to the TopBar (between the Inspector toggle and Settings). Use the ⊟ / ⊞ icon or similar. The existing `[class*="iconBtn"]` style can be reused.

---

### 16.4 [HIGH] Chapter Right-Click Has No Context Menu

Right-clicking a chapter header in the sidebar shows only "New Chapter" — a single option that appears at the top of the sidebar rather than as a proper context menu. There is no chapter-level context menu for: Rename, Delete, Move Up/Down, Add Scene, Export Chapter, or Duplicate.

**Fix:** Wire a full `ContextMenu` component to chapter right-click with items:
- Rename Chapter
- Add Scene to Chapter
- Duplicate Chapter
- Move Up / Move Down
- Export Chapter…
- Move to Trash

---

### 16.5 [HIGH] Scene Context Menu Missing Critical Actions

The scene right-click menu has: Open in Split View, Move to Chapter X (×3), Rename, Move to Trash. Missing:

- **Duplicate Scene** — copy content to a new scene below
- **Add Scene Below** — insert blank scene after this one
- **Create Snapshot** — save a version without opening the Inspector
- **Export Scene…** — open the export dialog scoped to this scene
- **Lock / Unlock** — make scene read-only

---

### 16.6 [HIGH] Snapshots Panel Has No "Restore" Button

The dedicated Snapshots right panel shows existing snapshots with their name, date, and notes — but no button to restore or delete them. The only way to restore a snapshot is via the Inspector panel's snapshot list (which duplicates the UI). The right panel shows snapshots as read-only cards with no actions.

**Fix:** Add "Restore" and "Delete" (🗑) buttons to each snapshot card in the Snapshots panel. Confirm restore with a dialog: "Restore this snapshot? The current content will be saved as a new snapshot first."

---

### 16.7 [HIGH] Snapshot Save Is Duplicated and Inconsistent

Saving a snapshot exists in two places with different UIs:
1. **Inspector panel** — has a "Snapshot name" text input + "Save" button
2. **Snapshots right panel** — has only a "+ Save" button with no name input

Clicking "+ Save" in the Snapshots panel saves with an auto-generated name, with no way to give it a meaningful name first.

**Fix:** Consolidate to one save interaction. Either: show a small name-input popover when clicking "+ Save" in the Snapshots panel, or remove the duplicate save button from the Inspector entirely and direct users to the Snapshots panel.

---

### 16.8 [HIGH] Inspector Word Target Layout Broken

In the Inspector panel, the "WORD TARGET" row shows the target input on the left and the current word count ("950 w") on the right. At typical inspector widths, "950 w" is clipped off the right edge — the word count is not visible. The row has no overflow handling.

**Fix:** Restructure the Word Target row to stack vertically, or use a full-width layout: `[Target input] words / [current count]` on one line, with a progress bar below.

---

### 16.9 [MEDIUM] "THE WALLPAPER" — Confusing Timeline Panel Title

The Vonnegut Timeline right panel is labelled **"THE WALLPAPER"** in large capitals. This is a Vonnegut reference (he described his fortune-arc diagrams as "wallpaper") but it is completely opaque to any user who hasn't read his essay. It looks like a UI bug or placeholder.

**Fix:** Rename the panel header to **"Story Arc"** or **"Fortune Timeline"** with a small subtitle: *"Character arcs across the story"*. Move the Vonnegut reference to a tooltip or About page.

---

### 16.10 [MEDIUM] Idea Constellation Node Labels Invisible

In the Idea Constellation right panel, idea nodes render as tiny coloured dots (~8px diameter) with no visible text labels. Labels only appear on hover (tooltip). With 12 ideas the graph looks like a scatter plot of anonymous dots — there is no way to get an overview of all ideas without hovering each one individually.

**Fix:**
- Render a short label (first 20 chars) below or beside each node
- Scale node size with idea length/importance
- Add a "List view" toggle that shows ideas as a sortable list instead of a graph

---

### 16.11 [MEDIUM] Idea Constellation Header Says "12 threads"

The Idea Constellation panel header shows the count as **"12 threads"** with "threads" misaligned on a separate line. The word "threads" is both confusingly labelled (these are ideas, not threads) and badly laid out.

**Fix:** Change to **"12 ideas"** or **"12 captured ideas"**. Fix the layout so count and label are on one line. Add a "+ Add Idea" button in the header.

---

### 16.12 [MEDIUM] Character Web — Severe Label Overlapping

With 8+ characters, the Character Web force graph clusters all nodes near the center with relationship labels overlapping each other and character names colliding. The graph is unreadable in a ~250px wide right panel.

**Fix:**
- Increase repulsion force so nodes spread further apart
- Clip relationship labels at 15 chars with an ellipsis, show full label on hover
- Add a "Expand" / fullscreen button to view the character web in a larger modal
- Increase minimum panel width or allow the right panel to be resized

---

### 16.13 [MEDIUM] Character Web "Relationship" Button Truncated

The "+ Relationship" button in the Character Web header is truncated to **"Relatio..."** at the default panel width. The button text is cut off before the word is readable.

**Fix:** Use a short label "+ Link" or an icon-only button (with tooltip "Add Relationship") instead of the truncated full word.

---

### 16.14 [MEDIUM] Search Results Have No Match Highlighting

The Search dialog shows result snippets like *"Down the Rabbit-Hole Alice was beginning to get very tired of her sister on..."* but the search term ("Alice") is not highlighted in the snippet. Users cannot see at a glance where the match occurs.

**Fix:** Wrap matching substrings in a `<mark>` element within the result snippet. Apply a highlighted background style (yellow or accent color) to `mark` elements.

---

### 16.15 [MEDIUM] Search Has No Filters

The search dialog accepts only a free-text query with no filter options. Users cannot search within a specific chapter, filter by status, filter by label/tag, or search only synopses vs. body text.

**Fix:** Add a collapsible "Filters" row below the search input:
- Chapter filter (dropdown, "All chapters" default)
- Status filter (checkboxes: Draft, Revision, Final)
- Search scope: Body text / Synopsis / Notes / All

---

### 16.16 [MEDIUM] Project Stats — Targets Set Inside Stats Popup

The Project Statistics modal contains editable input fields for "MANUSCRIPT TARGET" and "SESSION TARGET". This is conceptually wrong — statistics views should be read-only. Users who open Stats to check their word count are confronted with editable fields that look like part of the display.

**Fix:** Move target inputs to Settings > Project tab (where Manuscript Target already exists as a separate field). The Stats modal should show targets as read-only display values with a progress bar, and a small "Edit targets →" link that opens Settings.

---

### 16.17 [MEDIUM] Project Stats — No Writing History Graph

The `WritingHistory` table records daily word counts and the data is being written correctly, but the Stats modal shows no chart or graph of writing history. There is no visual feedback on writing streak, daily pace, or progress over time.

**Fix:** Add a 30-day sparkline bar chart inside the Stats modal (below the scene statistics section). Each bar = one day, height = words written. Show streak counter and "best day" stat.

---

### 16.18 [MEDIUM] Settings — `Ctrl+B` Shortcut Collision

The Shortcuts tab lists `Ctrl+B` for **"Toggle sidebar"** and separately lists `Ctrl+B (in editor)` for **"Bold"**. This dual-listing implies a context-sensitive conflict that users must understand and remember. In practice, if focus is in the editor, `Ctrl+B` bolds text; if focus is on the sidebar/topbar, it toggles the sidebar.

**Fix:** Change the sidebar toggle shortcut to something that doesn't conflict — e.g., `Ctrl+Shift+B` or keep `Ctrl+B` but clearly document that it only toggles the sidebar when the editor is not focused. Update the Shortcuts display to reflect this.

---

### 16.19 [MEDIUM] Labels Tab Starts Empty — No Defaults Loaded

The Settings > Labels tab is empty by default. There is a "Load default labels" button, but users have no indication that labels exist or what they're for until they click it. The Inspector shows a "LABEL" dropdown that says "None" with no options — first-time users don't know labels need to be configured first.

**Fix:**
- Auto-load default labels when a new project is created (POV, Location, Tone, etc.)
- Or at minimum show the default labels as greyed-out examples in the Labels tab with a "Activate" button
- Add a small helper text next to the LABEL dropdown in the Inspector: "Configure labels in Settings"

---

### 16.20 [MEDIUM] Quick Capture Has No Close Button

The Quick Capture popover (opened via `Ctrl+Shift+I` or the "⊕ Idea" button) has no visible close/dismiss button. Only pressing `Escape` closes it. The popover also overlaps the Snapshots panel header when both are open.

**Fix:**
- Add an ✕ close button in the top-right corner of the Quick Capture popover
- Prevent the popover from rendering over other panels — position it as a floating card anchored to the "⊕ Idea" button with a safe offset

---

### 16.21 [MEDIUM] Dashboard Project Cards Show No Metadata

Dashboard project cards show: title, description, and relative date ("Today"). They do not show word count, scene count, chapter count, or last-opened scene — information a writer checks frequently when choosing which project to open.

**Fix:** Add a metadata row to each project card showing: `12 scenes · 5,547 words · 4 chapters`. Pull this from the project's stored stats or compute it on dashboard load.

---

### 16.22 [MEDIUM] Dashboard Has No Project Card Actions

Hovering or right-clicking a project card on the Dashboard shows no actions. The only way to interact with a project is to click it (which opens it). Rename, Delete, Duplicate, and Export are not accessible from the Dashboard without opening the project.

**Fix:** Show action buttons on card hover:
- **Rename** (pencil icon) — inline rename
- **Export** (download icon) — export full project JSON
- **Delete** (trash icon) — delete with confirmation
- Or expose these via a `⋯` overflow menu on each card

---

### 16.23 [LOW] Typewriter & Focus Buttons Are Text, Not Icons

In the editor header, "Typewriter" and "Focus" are rendered as text-label buttons while all other toolbar controls are icon-only buttons. This creates visual inconsistency in the topbar.

**Fix:** Replace with icon buttons (🔤 or a scroll icon for Typewriter, 👁 or a fullscreen icon for Focus) with tooltips. Or keep text labels but apply the same styling as the panel toggle buttons (Timeline, Ideas, Characters, Snapshots) for visual consistency.

---

### 16.24 [LOW] Corkboard Status Dot Has No Legend

Each corkboard card has a small coloured dot in the top-right corner indicating status (Draft/Revision/Final). There is no legend, tooltip, or label explaining what the colours mean. Green/yellow/grey dots are used but undocumented in the UI.

**Fix:** Add a `title` attribute (browser tooltip) to the status dot: `title="Status: Draft"`. Or add a micro-legend below the chapter filter dropdown.

---

### 16.25 [LOW] Corkboard Cards Cannot Be Clicked to Open Scene

Clicking a corkboard card selects it visually but does not navigate to the scene in the editor. To open a scene from the Corkboard, the user must click it in the sidebar. There is no "Open" affordance on the card.

**Fix:** Double-clicking a card should switch to Editor view and open that scene. Add a small "Open →" button that appears on card hover.

---

### 16.26 [LOW] Outliner Has No Sort Direction Indicators

The Outliner column headers (Title, Synopsis, Words, Status, Chapter, Edited) are clickable for sorting, but no visual indicator shows which column is currently sorted or in which direction (ascending/descending). Clicking a column header silently changes the sort with no feedback.

**Fix:** Show a `↑` / `↓` arrow beside the active sort column header. Apply an `aria-sort` attribute for accessibility.

---

### 16.27 [LOW] Outliner Has No Chapter Grouping

The Outliner displays all scenes in a flat list regardless of chapter. There is a chapter filter dropdown but no option to group scenes by chapter with expandable chapter rows.

**Fix:** Add a "Group by Chapter" toggle above the outliner table. When enabled, insert chapter header rows as non-editable separators with chapter word count totals.

---

### 16.28 [LOW] Idea Sidebar List Has No Interaction

The IDEAS section in the sidebar shows 3 preview snippets and a "View all 12 ideas →" button. Clicking a preview idea does nothing — it doesn't navigate to the idea, open it for editing, or expand it. The ideas in the sidebar are purely decorative.

**Fix:** Clicking an idea preview in the sidebar should either:
- Open the Idea Constellation panel with that idea highlighted, or
- Open a small inline "Edit Idea" popover

---

### 16.29 [LOW] Matrix Theme — Digital Rain Obscures Background Content

When the Matrix theme is active with Digital Rain enabled, the animated green characters render as a full-screen overlay behind the editor. The animation is high-contrast and distracting, making it hard to see the document content in adjacent panels (inspector, sidebar).

**Fix:**
- Reduce the digital rain opacity to ≤15% so it is subtle background texture, not foreground noise
- Apply the rain only to empty/panel areas, not behind the editor text area
- Add a rain intensity slider in Settings (Low / Medium / High / Off)

---

### 16.30 [LOW] No "Restore" Action Visible in Trash View

The Trash modal shows a list of deleted items but — in testing with an empty trash — it was not possible to verify whether the "Restore" button exists per item. The Trash view needs a confirmed per-item "Restore" button, a "Restore All" button, and an "Empty Trash" button with count confirmation.

---

## 17. Unwired Features Confirmed in Live Review

The following features exist in the codebase (schema, store actions, or utilities) but have **no accessible UI**. Confirmed by inspecting the running application:

| Feature | Where It Exists | What's Missing |
|---|---|---|
| **Typewriter scroll behavior** | `uiStore.typewriterMode` toggle button exists | Toggle fires but does **nothing** — no scroll-to-center behavior implemented |
| **Focus mode** | `uiStore.focusMode` state exists | No toggle button, no keyboard shortcut, no visual effect |
| **Relationship deletion** | `projectStore.deleteRelationship()` | No delete button anywhere in Character Web UI |
| **Relationship label editing** | `Relationship.label` field in schema | No UI to set or edit the label after creation |
| **Idea TF-IDF vector** | Auto-computed and stored in `Idea.tfidfVector` | Never read by any component — computed data is silently discarded |
| **Split editor toggle** | `uiStore.splitEditor`, `Ctrl+\` shortcut | No visible button in TopBar — only discoverable via scene right-click or keyboard shortcut |
| **Project settings persistence** | `ProjectSettings.typewriterMode`, `.focusMode`, `.digitalRain` | Fields stored per-project in DB but never read back on project open — preferences reset every session |

---

## Updated Priority Matrix

Items added from the live review are marked **[NEW]**.

| Priority | Feature / Fix | Impact | Effort |
|---|---|---|---|
| **P0** | ~~Modal portal fix (backdrop-filter bug)~~ | Critical | Low | **DONE** |
| **P0** | Data durability warning + File System API backup | Critical | Medium | |
| **P0** | Programmatic PDF export | High | Medium | |
| **P0** | DOCX import (mammoth.js) | High | Low | |
| **P0** | Inline comments / annotations | High | High | |
| **P0** | Export button — add visible label/accent style **[NEW]** | High | Low | Currently undiscoverable |
| **P0** | Snapshot Restore button in Snapshots panel **[NEW]** | High | Low | Core feature with no UI |
| **P1** | Split editor TopBar toggle button **[NEW]** | High | Low | |
| **P1** | Chapter context menu (Rename, Delete, Add Scene) **[NEW]** | High | Low | |
| **P1** | Scene context menu — add Duplicate, Lock, Export **[NEW]** | High | Low | |
| **P1** | Inspector Word Target layout fix **[NEW]** | High | Low | Data cut off, unreadable |
| **P1** | Implement Typewriter scroll behavior **[NEW]** | High | Low | Toggle exists, does nothing |
| **P1** | Wire Focus mode — add toggle + dim effect **[NEW]** | High | Low | Completely unwired |
| **P1** | RTF export | High | Medium | |
| **P1** | Named paragraph styles + compile mapping | High | High | |
| **P1** | DOCX running headers/footers + SMF preset | High | Medium | |
| **P1** | Revision / track changes mode | High | High | |
| **P1** | Compile presets (save/load) | Medium | Low | |
| **P2** | Rename "THE WALLPAPER" → "Story Arc" **[NEW]** | Medium | Low | Confusing internal label |
| **P2** | Idea Constellation — visible node labels **[NEW]** | Medium | Low | Nodes are anonymous dots |
| **P2** | Character Web — fix label overlap + expand view **[NEW]** | Medium | Medium | |
| **P2** | Search — highlight matched terms in snippets **[NEW]** | Medium | Low | |
| **P2** | Search — add chapter/status/scope filters **[NEW]** | Medium | Low | |
| **P2** | Stats — move targets to Settings, add history graph **[NEW]** | Medium | Low | |
| **P2** | Labels — auto-load defaults on project creation **[NEW]** | Medium | Low | |
| **P2** | Dashboard — project card metadata + hover actions **[NEW]** | Medium | Low | |
| **P2** | Fix `Ctrl+B` shortcut collision **[NEW]** | Medium | Low | |
| **P2** | Consolidate duplicate Snapshot save UI **[NEW]** | Medium | Low | |
| **P2** | Quick Capture — add close button, fix overlap **[NEW]** | Medium | Low | |
| **P2** | Research folder with PDF/image/web support | High | High | |
| **P2** | Collections (smart + manual) | Medium | Medium | |
| **P2** | Custom metadata fields | Medium | Medium | |
| **P2** | Quick Open command palette (Cmd+P) | Medium | Low | |
| **P2** | Scene/character linking (formal) | Medium | Medium | |
| **P2** | Deadline + daily target calculator | Medium | Low | |
| **P2** | EPUB cover image + TOC + metadata | Medium | Medium | |
| **P2** | Image storage in Assets table | Medium | Medium | |
| **P3** | Corkboard — click card to open scene **[NEW]** | Medium | Low | |
| **P3** | Corkboard — status dot legend/tooltip **[NEW]** | Low | Low | |
| **P3** | Outliner — sort direction arrows **[NEW]** | Low | Low | |
| **P3** | Outliner — group by chapter option **[NEW]** | Medium | Low | |
| **P3** | Typewriter/Focus buttons — icon style consistency **[NEW]** | Low | Low | |
| **P3** | Matrix theme — reduce digital rain opacity **[NEW]** | Low | Low | |
| **P3** | Relationship deletion UI in Character Web **[NEW]** | Medium | Low | Store action exists |
| **P3** | Relationship label edit UI **[NEW]** | Low | Low | Field exists in schema |
| **P3** | Configurable status/label options | Medium | Low | |
| **P3** | Markdown import | Medium | Low | |
| **P3** | Tables in editor + export | Medium | Medium | |
| **P3** | Corkboard freeform layout | Low | High | |
| **P3** | Scriptwriting / Fountain mode | Medium | High | |
| **P3** | Plot structure templates (HSJ, Save the Cat) | Medium | Medium | |
| **P3** | Arbitrary depth binder (multi-level tree) | High | Very High | |
| **P4** | Light theme | Medium | Low | |
| **P4** | Scrivener .scriv import | High | Very High | |
| **P4** | Persist typewriterMode/focusMode/digitalRain to project **[NEW]** | Low | Low | |
| **P4** | Web Worker for TF-IDF | Low | Low | |
| **P4** | Virtual scrolling in Scrivenings | Low | Medium | |

---

*Static analysis: 2026-04-02. Live UI review: 2026-04-02. Application version: 1.0.0 (React 19 / TipTap 3 / Dexie 4 / Zustand 5 / Vite 7).*
