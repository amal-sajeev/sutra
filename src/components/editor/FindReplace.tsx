import { useState, useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import styles from './FindReplace.module.css';

interface FindReplaceProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MatchResult {
  from: number;
  to: number;
}

export default function FindReplace({ editor, isOpen, onClose }: FindReplaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [showReplace, setShowReplace] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const findMatches = useCallback(() => {
    if (!editor || !searchTerm) {
      setMatches([]);
      setCurrentMatch(-1);
      return;
    }

    const { doc } = editor.state;
    const results: MatchResult[] = [];
    const search = searchTerm.toLowerCase();

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const text = node.text.toLowerCase();
        let index = text.indexOf(search);
        while (index !== -1) {
          results.push({
            from: pos + index,
            to: pos + index + searchTerm.length,
          });
          index = text.indexOf(search, index + 1);
        }
      }
    });

    setMatches(results);
    setCurrentMatch(results.length > 0 ? 0 : -1);

    if (results.length > 0) {
      scrollToMatch(results[0]);
    }
  }, [editor, searchTerm]);

  const scrollToMatch = useCallback((match: MatchResult) => {
    if (!editor) return;
    editor.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .scrollIntoView()
      .run();
  }, [editor]);

  useEffect(() => {
    const timer = setTimeout(findMatches, 200);
    return () => clearTimeout(timer);
  }, [findMatches]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const goToNext = () => {
    if (matches.length === 0) return;
    const next = (currentMatch + 1) % matches.length;
    setCurrentMatch(next);
    scrollToMatch(matches[next]);
  };

  const goToPrev = () => {
    if (matches.length === 0) return;
    const prev = currentMatch <= 0 ? matches.length - 1 : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(matches[prev]);
  };

  const replaceOne = () => {
    if (!editor || currentMatch < 0 || currentMatch >= matches.length) return;
    const match = matches[currentMatch];
    editor.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceTerm)
      .run();
    findMatches();
  };

  const replaceAll = () => {
    if (!editor || matches.length === 0) return;
    const reversed = [...matches].reverse();
    editor.chain().focus().run();
    for (const match of reversed) {
      editor.chain()
        .setTextSelection({ from: match.from, to: match.to })
        .insertContent(replaceTerm)
        .run();
    }
    findMatches();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) goToPrev();
      else goToNext();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find..."
        />
        <span className={styles.count}>
          {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : '0'}
        </span>
        <button className={styles.navBtn} onClick={goToPrev} disabled={matches.length === 0} aria-label="Previous match">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        <button className={styles.navBtn} onClick={goToNext} disabled={matches.length === 0} aria-label="Next match">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button className={styles.navBtn} onClick={() => setShowReplace(!showReplace)} data-tooltip="Toggle replace" aria-label="Toggle replace">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/>
            <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
          </svg>
        </button>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close find">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      {showReplace && (
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace with..."
          />
          <button className={styles.actionBtn} onClick={replaceOne} disabled={currentMatch < 0}>Replace</button>
          <button className={styles.actionBtn} onClick={replaceAll} disabled={matches.length === 0}>All</button>
        </div>
      )}
    </div>
  );
}
