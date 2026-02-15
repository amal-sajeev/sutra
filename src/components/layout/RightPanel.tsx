import { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import VonnegutTimeline from '../timeline/VonnegutTimeline';
import IdeaConstellation from '../constellation/IdeaConstellation';
import CharacterWeb from '../characters/CharacterWeb';
import SnapshotBrowser from '../project/SnapshotBrowser';

export default function RightPanel() {
  const rightPanel = useUIStore((s) => s.rightPanel);
  const maximized = useUIStore((s) => s.rightPanelMaximized);
  const toggle = useUIStore((s) => s.toggleRightPanelMaximized);

  // Escape key to restore
  useEffect(() => {
    if (!maximized) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [maximized, toggle]);

  switch (rightPanel) {
    case 'timeline':
      return <VonnegutTimeline />;
    case 'constellation':
      return <IdeaConstellation />;
    case 'characters':
      return <CharacterWeb />;
    case 'snapshots':
      return <SnapshotBrowser />;
    default:
      return null;
  }
}
