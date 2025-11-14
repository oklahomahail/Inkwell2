// src/types/storyTemplates.ts
// Story beat sheet templates for planning panel

export type TemplateCategory = 'core' | 'advanced';

export interface TemplateBeat {
  id: string;
  label: string;
  prompt: string;
  order: number;
}

export interface StoryTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  shortDescription: string;
  tooltip: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  idealUses: string[];
  structureType: 'acts' | 'beats' | 'curve' | 'method' | 'grid';
  beatCount: number;
  beats: TemplateBeat[];
}

const beat = (id: string, label: string, prompt: string, order: number): TemplateBeat => ({
  id,
  label,
  prompt,
  order,
});

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    category: 'core',
    shortDescription: 'Classic beginning, middle, and end with clear turning points.',
    tooltip:
      'Three-act structure divides your story into Setup, Confrontation, and Resolution with clear turning points.',
    difficulty: 'beginner',
    idealUses: ['novel', 'screenplay', 'mg', 'ya'],
    structureType: 'acts',
    beatCount: 6,
    beats: [
      beat(
        'act1-opening',
        'Act I: Setup',
        'Introduce the world, tone, and protagonist in their ordinary life.',
        1,
      ),
      beat(
        'inciting-incident',
        'Inciting Incident',
        'The event that disturbs the status quo and demands a response.',
        2,
      ),
      beat(
        'act1-break',
        'Break into Act II',
        'The protagonist makes a choice and crosses into a new situation.',
        3,
      ),
      beat(
        'midpoint',
        'Midpoint',
        'A major development that raises the stakes or reveals new information.',
        4,
      ),
      beat(
        'act2-break',
        'Break into Act III',
        'A low point or crisis that forces a final push or new strategy.',
        5,
      ),
      beat(
        'act3-resolution',
        'Act III: Resolution',
        'Climax and aftermath, showing how the character and world have changed.',
        6,
      ),
    ],
  },
  {
    id: 'heros-journey',
    name: "Hero's Journey (Simplified)",
    category: 'core',
    shortDescription: 'Mythic arc from ordinary world to transformation and return.',
    tooltip:
      "Hero's Journey follows a character leaving the ordinary world, confronting trials, transforming, and returning changed.",
    difficulty: 'intermediate',
    idealUses: ['novel', 'mg', 'ya', 'fantasy', 'adventure'],
    structureType: 'beats',
    beatCount: 12,
    beats: [
      beat(
        'ordinary-world',
        'Ordinary World',
        "Show the hero's everyday life and what feels incomplete.",
        1,
      ),
      beat(
        'call-to-adventure',
        'Call to Adventure',
        'An invitation or challenge that disrupts the ordinary world.',
        2,
      ),
      beat(
        'refusal',
        'Refusal of the Call',
        'The hero hesitates, resists, or tries to avoid the journey.',
        3,
      ),
      beat(
        'mentor',
        'Meeting the Mentor',
        'A guide offers wisdom, tools, or encouragement to face the journey.',
        4,
      ),
      beat(
        'crossing-threshold',
        'Crossing the Threshold',
        'The hero commits and enters a new world or situation.',
        5,
      ),
      beat(
        'tests-allies-enemies',
        'Tests, Allies, Enemies',
        'Early trials reveal skills, friends, and opposition.',
        6,
      ),
      beat(
        'approach',
        'Approach to the Inmost Cave',
        'The hero draws near to the central danger or deepest truth.',
        7,
      ),
      beat(
        'ordeal',
        'Ordeal',
        'A major crisis or confrontation that brings the hero close to defeat.',
        8,
      ),
      beat(
        'reward',
        'Reward',
        'The hero gains insight, power, or a literal reward after surviving the ordeal.',
        9,
      ),
      beat(
        'road-back',
        'The Road Back',
        'Consequences follow, and the hero must return or face a final challenge.',
        10,
      ),
      beat(
        'resurrection',
        'Resurrection',
        'A final test where the hero proves their transformation under pressure.',
        11,
      ),
      beat(
        'return-elixir',
        'Return with the Elixir',
        'The hero comes home with something that benefits them or their community.',
        12,
      ),
    ],
  },
  {
    id: 'story-circle',
    name: 'Story Circle (8-Step)',
    category: 'core',
    shortDescription: 'Tight, modern loop of need, change, and return.',
    tooltip:
      'Story Circle is an eight-step loop where a character leaves comfort, changes through struggle, and returns transformed.',
    difficulty: 'beginner',
    idealUses: ['novel', 'screenplay', 'mg', 'episodic'],
    structureType: 'beats',
    beatCount: 8,
    beats: [
      beat('you', '1. You', 'A character in a comfort zone with something missing.', 1),
      beat('need', '2. Need', 'We see what they want and, underneath, what they really need.', 2),
      beat('go', '3. Go', 'They enter an unfamiliar situation in pursuit of what they want.', 3),
      beat('search', '4. Search', 'They adapt, experiment, and struggle in this new situation.', 4),
      beat('find', '5. Find', 'They get what they wanted or think they did.', 5),
      beat('take', '6. Take', 'They pay a price, facing real consequences or loss.', 6),
      beat('return', '7. Return', 'They head back toward their old world, changed or shaken.', 7),
      beat('change', '8. Change', 'We see how they have truly changed in action or choice.', 8),
    ],
  },
  {
    id: 'seven-point',
    name: 'Seven-Point Story Structure',
    category: 'core',
    shortDescription: 'Start with the end, then fill in the path to get there.',
    tooltip:
      'Seven-point structure starts with the end in mind and traces the path from hook to resolution through key turns.',
    difficulty: 'intermediate',
    idealUses: ['novel', 'mg', 'fantasy', 'romance'],
    structureType: 'beats',
    beatCount: 7,
    beats: [
      beat('hook', 'Hook', 'Introduce the character in their starting state before change.', 1),
      beat(
        'plot-turn-1',
        'Plot Turn 1',
        'Something pushes the character out of the old world toward a goal.',
        2,
      ),
      beat(
        'pinch-1',
        'Pinch Point 1',
        'Apply pressure by showing the threat or stakes clearly.',
        3,
      ),
      beat(
        'midpoint',
        'Midpoint',
        'The character moves from reacting to acting with new understanding.',
        4,
      ),
      beat('pinch-2', 'Pinch Point 2', 'Increase the pressure and cost; things get worse.', 5),
      beat(
        'plot-turn-2',
        'Plot Turn 2',
        'A revelation or resource appears that enables the final push.',
        6,
      ),
      beat(
        'resolution',
        'Resolution',
        "Show the outcome and the character's new state after change.",
        7,
      ),
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat (Simplified 15-Beat)',
    category: 'core',
    shortDescription: 'Fifteen practical beats for pacing and emotional payoffs.',
    tooltip:
      'Save the Cat offers fifteen concrete beats that keep pacing tight and emotional payoffs satisfying.',
    difficulty: 'intermediate',
    idealUses: ['screenplay', 'novel', 'mg', 'commercial'],
    structureType: 'beats',
    beatCount: 15,
    beats: [
      beat('opening-image', 'Opening Image', 'A snapshot of the world and hero before change.', 1),
      beat(
        'theme-stated',
        'Theme Stated',
        'A line or moment that hints at what the story is really about.',
        2,
      ),
      beat('setup', 'Setup', 'Establish everyday life, relationships, and flaws.', 3),
      beat(
        'catalyst',
        'Catalyst',
        'An event that upends the status quo and raises a hard question.',
        4,
      ),
      beat('debate', 'Debate', 'The hero hesitates, argues, or waffles about what to do.', 5),
      beat(
        'break-into-two',
        'Break into Two',
        'The hero commits and enters a new world or approach.',
        6,
      ),
      beat('b-story', 'B Story', 'Introduce a relationship or subplot that supports the theme.', 7),
      beat(
        'fun-and-games',
        'Fun and Games',
        'Deliver the promise of the premise: the core fun or exploration.',
        8,
      ),
      beat(
        'midpoint',
        'Midpoint',
        'A big win or loss that raises the stakes and sharpens the goal.',
        9,
      ),
      beat(
        'bad-guys-close-in',
        'Bad Guys Close In',
        'External and internal pressures tighten around the hero.',
        10,
      ),
      beat('all-is-lost', 'All Is Lost', 'A low point where it seems the hero cannot succeed.', 11),
      beat(
        'dark-night-of-soul',
        'Dark Night of the Soul',
        'The hero reflects on what went wrong and why.',
        12,
      ),
      beat(
        'break-into-three',
        'Break into Three',
        'A new idea or insight suggests a way forward.',
        13,
      ),
      beat('finale', 'Finale', 'The hero applies what they have learned to solve the problem.', 14),
      beat(
        'final-image',
        'Final Image',
        'A contrasting picture that shows the change from the opening.',
        15,
      ),
    ],
  },
  {
    id: 'fichtean-curve',
    name: 'Fichtean Curve',
    category: 'core',
    shortDescription: 'Crisis-driven, high-tension structure with minimal setup.',
    tooltip:
      'Fichtean Curve minimizes setup and stacks crises that drive the story toward a sharp climax and quick resolution.',
    difficulty: 'intermediate',
    idealUses: ['thriller', 'mystery', 'mg', 'shorter novels'],
    structureType: 'curve',
    beatCount: 7,
    beats: [
      beat(
        'in-medias-res',
        'In Medias Res',
        'Drop the reader into an active, engaging situation.',
        1,
      ),
      beat(
        'backfill-context',
        'Backfill Context',
        'Slip in just enough background to ground us.',
        2,
      ),
      beat('crisis-1', 'Crisis 1', 'A problem forces the protagonist to act and choose.', 3),
      beat('crisis-2', 'Crisis 2', 'A bigger complication or reversal raises the stakes.', 4),
      beat('crisis-3', 'Crisis 3', 'The highest-pressure crisis that leads directly to climax.', 5),
      beat(
        'climax',
        'Climax',
        'The decisive confrontation where the central question is answered.',
        6,
      ),
      beat(
        'denouement',
        'Denouement',
        'Brief fallout and emotional release, showing the new normal.',
        7,
      ),
    ],
  },
  {
    id: 'snowflake-lite',
    name: 'Snowflake Method (Lite)',
    category: 'advanced',
    shortDescription: 'Five expanding passes from one sentence to a detailed synopsis.',
    tooltip:
      'Snowflake Method Lite expands your idea from a single sentence to a structured synopsis in five steps.',
    difficulty: 'advanced',
    idealUses: ['novel', 'epic', 'series-planning'],
    structureType: 'method',
    beatCount: 5,
    beats: [
      beat(
        'one-sentence',
        'Step 1: One-Sentence Summary',
        'Capture your story in a single, clear sentence.',
        1,
      ),
      beat(
        'one-paragraph',
        'Step 2: One-Paragraph Summary',
        'Expand to a paragraph covering major turns.',
        2,
      ),
      beat(
        'character-summaries',
        'Step 3: Character Summaries',
        "Write a short summary for each major character's goal and arc.",
        3,
      ),
      beat(
        'expand-paragraph',
        'Step 4: Expand Paragraph',
        'Turn each sentence of the paragraph into its own paragraph of detail.',
        4,
      ),
      beat(
        'scene-list',
        'Step 5: Scene List',
        'Rough out a list of scenes or beats that will realize the synopsis.',
        5,
      ),
    ],
  },
  {
    id: 'story-grid-simple',
    name: 'Story Grid (Simplified)',
    category: 'advanced',
    shortDescription: 'High-level diagnostic grid for genre, stakes, and key turns.',
    tooltip:
      'Story Grid Simplified helps you diagnose genre, stakes, and key turning points without the full technical spreadsheet.',
    difficulty: 'advanced',
    idealUses: ['revision', 'genre-fiction', 'long-form'],
    structureType: 'grid',
    beatCount: 8,
    beats: [
      beat(
        'genre',
        'Global Genre',
        'Define the primary genre and its core value (for example, life vs death).',
        1,
      ),
      beat(
        'controlling-idea',
        'Controlling Idea',
        'State the core message or outcome of the story in one sentence.',
        2,
      ),
      beat(
        'obligatory-scenes',
        'Obligatory Scenes',
        'List key scenes your genre expects you to deliver.',
        3,
      ),
      beat(
        'conventions',
        'Conventions',
        'List the character types, settings, or situations your genre needs.',
        4,
      ),
      beat(
        'inciting-incident',
        'Inciting Incident',
        'Identify the event that kicks off the central conflict.',
        5,
      ),
      beat(
        'progressive-complications',
        'Progressive Complications',
        'Summarize how problems escalate over time.',
        6,
      ),
      beat('crisis', 'Crisis', 'Note the core decision forced on the protagonist.', 7),
      beat(
        'climax-resolution',
        'Climax and Resolution',
        'Capture how that decision plays out and what changes.',
        8,
      ),
    ],
  },
];
