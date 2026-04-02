import { useState, useCallback } from 'react';
import PanelMaxBtn from './PanelMaxBtn';
import styles from './NameGenerator.module.css';

const FIRST_NAMES_M = [
  'James', 'Alexander', 'Theodore', 'Sebastian', 'Nathaniel', 'Gabriel', 'Ezra', 'Silas',
  'Jasper', 'Felix', 'Marcus', 'Adrian', 'Damien', 'Elias', 'Lucian', 'Orion',
  'Dante', 'Rowan', 'Alaric', 'Dorian', 'Cyrus', 'Cassian', 'Leander', 'Ambrose',
  'Victor', 'Evander', 'Theron', 'Atlas', 'Caspian', 'Sterling',
  'Kai', 'Ryu', 'Hiro', 'Akira', 'Ren', 'Soren', 'Bjorn', 'Arjun', 'Rafael',
  'Emilio', 'Nikolai', 'Dimitri', 'Henrik', 'Matteo', 'Zephyr',
];
const FIRST_NAMES_F = [
  'Eleanor', 'Vivienne', 'Genevieve', 'Seraphina', 'Cordelia', 'Isolde', 'Rosalind',
  'Evangeline', 'Ophelia', 'Beatrix', 'Mirabel', 'Celestine', 'Lydia', 'Aurora',
  'Valentina', 'Arianna', 'Thessaly', 'Calista', 'Dahlia', 'Astrid',
  'Freya', 'Ingrid', 'Saoirse', 'Niamh', 'Amara', 'Zara', 'Yuki', 'Mei',
  'Priya', 'Anika', 'Linnea', 'Petra', 'Maren', 'Elara', 'Thalia',
];
const LAST_NAMES = [
  'Ashworth', 'Blackwood', 'Castillon', 'Deveraux', 'Everhart', 'Fairchild',
  'Graves', 'Hartwell', 'Ironwood', 'Kingsley', 'Lockwood', 'Montague',
  'Nightingale', 'Pemberton', 'Ravenswood', 'Sterling', 'Thornton', 'Valencia',
  'Whitmore', 'Ashford', 'Beaumont', 'Carmichael', 'Dalton', 'Sinclair',
  'Harrington', 'Waverly', 'Aldridge', 'Langley', 'Winslow', 'Mercer',
  'Kessler', 'Volkov', 'Nakamura', 'Chen', 'Kim', 'Okafor', 'Singh',
  'Rodriguez', 'Larsson', 'Kozlov', 'Tanaka', 'Park', 'Dubois', 'Moretti',
];
const EPITHETS = [
  'the Bold', 'the Wise', 'the Silent', 'the Scarred', 'the Forgotten',
  'the Lost', 'the Dreamer', 'the Wanderer', 'the Unbroken', 'the Shadow',
  'of the Iron Gate', 'of the Northern Wilds', 'the Last', 'the Reborn',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function NameGenerator() {
  const [names, setNames] = useState<string[]>([]);
  const [style, setStyle] = useState<'modern' | 'fantasy'>('modern');
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useCallback(() => {
    const results: string[] = [];
    for (let i = 0; i < 8; i++) {
      const useMale = Math.random() > 0.5;
      const first = useMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
      if (style === 'modern') {
        results.push(`${first} ${pick(LAST_NAMES)}`);
      } else if (Math.random() > 0.5) {
        results.push(`${first} ${pick(EPITHETS)}`);
      } else {
        results.push(`${first} ${pick(LAST_NAMES)}`);
      }
    }
    setNames(results);
    setCopied(null);
  }, [style]);

  const copyName = (name: string, idx: number) => {
    void navigator.clipboard.writeText(name);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Name Generator</h3>
        <select
          className={styles.styleSelect}
          value={style}
          onChange={(e) => setStyle(e.target.value as 'modern' | 'fantasy')}
        >
          <option value="modern">Modern</option>
          <option value="fantasy">Fantasy</option>
        </select>
        <button type="button" className={styles.generateBtn} onClick={generate}>
          Generate
        </button>
        <PanelMaxBtn />
      </div>
      {names.length === 0 ? (
        <p className={styles.hint}>Click Generate to create random character names</p>
      ) : (
        <div className={styles.nameGrid}>
          {names.map((name, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.nameCard} ${copied === i ? styles.copied : ''}`}
              onClick={() => copyName(name, i)}
              title="Click to copy"
            >
              {copied === i ? 'Copied!' : name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
