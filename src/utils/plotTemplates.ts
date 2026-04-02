export interface PlotBeat {
  name: string;
  description: string;
  position: number; // 0-1 position in the story
}

export interface PlotTemplate {
  id: string;
  name: string;
  beats: PlotBeat[];
}

export const PLOT_TEMPLATES: PlotTemplate[] = [
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    beats: [
      { name: 'Setup', description: 'Introduce characters, world, and status quo', position: 0.0 },
      { name: 'Inciting Incident', description: 'Event that disrupts the status quo', position: 0.1 },
      { name: 'Plot Point 1', description: 'Protagonist commits to the journey', position: 0.25 },
      { name: 'Rising Action', description: 'Obstacles and complications increase', position: 0.35 },
      { name: 'Midpoint', description: 'Major revelation or reversal', position: 0.5 },
      { name: 'Plot Point 2', description: 'All seems lost or darkest moment', position: 0.75 },
      { name: 'Climax', description: 'Final confrontation', position: 0.9 },
      { name: 'Resolution', description: 'New status quo established', position: 1.0 },
    ],
  },
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    beats: [
      { name: 'Ordinary World', description: 'Hero in their normal environment', position: 0.0 },
      { name: 'Call to Adventure', description: 'Hero receives the challenge', position: 0.08 },
      { name: 'Refusal of the Call', description: 'Hero hesitates or declines', position: 0.12 },
      { name: 'Meeting the Mentor', description: 'Hero gains guidance', position: 0.17 },
      { name: 'Crossing the Threshold', description: 'Hero enters the special world', position: 0.25 },
      { name: 'Tests, Allies, Enemies', description: 'Hero faces challenges and makes friends', position: 0.35 },
      { name: 'Approach to Inmost Cave', description: 'Hero prepares for major ordeal', position: 0.45 },
      { name: 'The Ordeal', description: 'Hero faces greatest challenge', position: 0.5 },
      { name: 'Reward', description: 'Hero achieves the goal', position: 0.6 },
      { name: 'The Road Back', description: 'Hero begins the return journey', position: 0.7 },
      { name: 'Resurrection', description: 'Final test using lessons learned', position: 0.85 },
      { name: 'Return with Elixir', description: 'Hero returns transformed', position: 1.0 },
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat Beat Sheet',
    beats: [
      { name: 'Opening Image', description: 'Visual that captures the tone and starting state', position: 0.0 },
      { name: 'Theme Stated', description: 'Someone states the theme (hero doesn\'t get it yet)', position: 0.05 },
      { name: 'Setup', description: 'Establish the status quo', position: 0.08 },
      { name: 'Catalyst', description: 'Life-changing event', position: 0.1 },
      { name: 'Debate', description: 'Hero doubts the journey', position: 0.15 },
      { name: 'Break into Two', description: 'Hero enters the new world', position: 0.2 },
      { name: 'B Story', description: 'Subplot begins (often love story)', position: 0.22 },
      { name: 'Fun and Games', description: 'The promise of the premise', position: 0.3 },
      { name: 'Midpoint', description: 'Stakes are raised', position: 0.5 },
      { name: 'Bad Guys Close In', description: 'Opposition intensifies', position: 0.6 },
      { name: 'All Is Lost', description: 'Hero hits rock bottom', position: 0.75 },
      { name: 'Dark Night of the Soul', description: 'Wallowing in defeat', position: 0.8 },
      { name: 'Break into Three', description: 'Solution discovered', position: 0.85 },
      { name: 'Finale', description: 'Hero triumphs using lessons learned', position: 0.9 },
      { name: 'Final Image', description: 'Mirror of opening — shows change', position: 1.0 },
    ],
  },
  {
    id: 'story-circle',
    name: 'Story Circle (Dan Harmon)',
    beats: [
      { name: 'You (Comfort Zone)', description: 'Character in their zone of comfort', position: 0.0 },
      { name: 'Need', description: 'They want something', position: 0.125 },
      { name: 'Go', description: 'They enter an unfamiliar situation', position: 0.25 },
      { name: 'Search', description: 'They adapt to it', position: 0.375 },
      { name: 'Find', description: 'They get what they wanted', position: 0.5 },
      { name: 'Take', description: 'They pay a heavy price', position: 0.625 },
      { name: 'Return', description: 'They go back to the familiar', position: 0.75 },
      { name: 'Change', description: 'They have changed', position: 1.0 },
    ],
  },
  {
    id: 'seven-point',
    name: '7-Point Story Structure',
    beats: [
      { name: 'Hook', description: 'Opposite of the resolution', position: 0.0 },
      { name: 'Plot Turn 1', description: 'Introduce the conflict', position: 0.15 },
      { name: 'Pinch Point 1', description: 'Apply pressure from antagonist', position: 0.3 },
      { name: 'Midpoint', description: 'Hero moves from reaction to action', position: 0.5 },
      { name: 'Pinch Point 2', description: 'More pressure, higher stakes', position: 0.7 },
      { name: 'Plot Turn 2', description: 'Hero gets final piece to win', position: 0.85 },
      { name: 'Resolution', description: 'Conflict resolved', position: 1.0 },
    ],
  },
];
