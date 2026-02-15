import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../stores/projectStore';
import styles from './SnowflakeWizard.module.css';

interface SnowflakeWizardProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: 'One-Sentence Summary',
    description: 'Distill your entire story into a single sentence. What is this book about?',
    placeholder: 'A young woman discovers that her memories are being harvested by an ancient intelligence living in the internet.',
    field: 'oneSentence' as const,
  },
  {
    title: 'One-Paragraph Summary',
    description: 'Expand to a paragraph: setup, three disasters/turning points, and ending.',
    placeholder: 'When Maya discovers gaps in her memory, she traces them to a pattern in her online activity...',
    field: 'oneParag' as const,
  },
  {
    title: 'Characters',
    description: 'Define your main characters — name, motivation, goal, conflict, and pick a color for each (Vonnegut\'s crayons).',
    placeholder: '',
    field: 'characters' as const,
  },
];

export default function SnowflakeWizard({ onClose }: SnowflakeWizardProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    oneSentence: '',
    oneParag: '',
  });
  const [charList, setCharList] = useState<{ name: string; color: string; motivation: string; goal: string; conflict: string }[]>([
    { name: '', color: '#5a9e9e', motivation: '', goal: '', conflict: '' },
  ]);

  const updateProject = useProjectStore((s) => s.updateProject);
  const createCharacter = useProjectStore((s) => s.createCharacter);
  const createChapter = useProjectStore((s) => s.createChapter);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await handleFinish();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    if (!activeProjectId) return;

    // Save summary fields
    await updateProject(activeProjectId, {
      oneSentence: values.oneSentence || undefined,
      oneParag: values.oneParag || undefined,
    });

    // Create characters
    for (const char of charList) {
      if (char.name.trim()) {
        await createCharacter({
          name: char.name.trim(),
          color: char.color,
          motivation: char.motivation,
          goal: char.goal,
          conflict: char.conflict,
        });
      }
    }

    // Create initial chapter structure from paragraph
    if (values.oneParag) {
      const sentences = values.oneParag.split(/\.\s+/).filter((s) => s.trim());
      if (sentences.length > 0) {
        await createChapter('Act I — Setup');
        await createChapter('Act II — Rising Action');
        await createChapter('Act III — Resolution');
      }
    } else {
      await createChapter('Chapter 1');
    }

    onClose();
  };

  const addCharacter = () => {
    setCharList([...charList, { name: '', color: `hsl(${Math.random() * 360}, 60%, 55%)`, motivation: '', goal: '', conflict: '' }]);
  };

  const updateChar = (index: number, field: string, value: string) => {
    const updated = [...charList];
    (updated[index] as Record<string, string>)[field] = value;
    setCharList(updated);
  };

  return (
    <motion.div
      className={styles.wizard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className={styles.header}>
        <span className={styles.stepLabel}>Step {step + 1} of {STEPS.length}</span>
        <button className={styles.closeBtn} onClick={onClose}>Skip</button>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progress} style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className={styles.stepContent}
        >
          <h2 className={styles.stepTitle}>{currentStep.title}</h2>
          <p className={styles.stepDesc}>{currentStep.description}</p>

          {currentStep.field === 'characters' ? (
            <div className={styles.charList}>
              {charList.map((char, i) => (
                <div key={i} className={styles.charForm}>
                  <div className={styles.charRow}>
                    <input
                      className={styles.input}
                      placeholder="Name"
                      value={char.name}
                      onChange={(e) => updateChar(i, 'name', e.target.value)}
                    />
                    <input
                      type="color"
                      value={char.color}
                      onChange={(e) => updateChar(i, 'color', e.target.value)}
                      className={styles.colorPicker}
                      data-tooltip="Vonnegut's crayon color"
                    />
                  </div>
                  <input
                    className={styles.input}
                    placeholder="Motivation — What do they want?"
                    value={char.motivation}
                    onChange={(e) => updateChar(i, 'motivation', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Goal — What are they trying to achieve?"
                    value={char.goal}
                    onChange={(e) => updateChar(i, 'goal', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Conflict — What stands in their way?"
                    value={char.conflict}
                    onChange={(e) => updateChar(i, 'conflict', e.target.value)}
                  />
                </div>
              ))}
              <button className={styles.addCharBtn} onClick={addCharacter}>
                + Add another character
              </button>
            </div>
          ) : (
            <textarea
              className={styles.textarea}
              placeholder={currentStep.placeholder}
              value={values[currentStep.field] || ''}
              onChange={(e) => setValues({ ...values, [currentStep.field]: e.target.value })}
              rows={currentStep.field === 'oneParag' ? 6 : 3}
              autoFocus
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className={styles.footer}>
        {step > 0 && (
          <button className={styles.backBtn} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        <button className={styles.nextBtn} onClick={handleNext}>
          {isLastStep ? 'Finish & Start Writing' : 'Next'}
        </button>
      </div>
    </motion.div>
  );
}
