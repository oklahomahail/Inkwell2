/**
 * Demo Data for Free Preview Mode
 * Sample project with chapters for unauthenticated users to explore
 */

export interface DemoChapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoProject {
  id: string;
  name: string;
  description: string;
  chapters: DemoChapter[];
  createdAt: number;
  updatedAt: number;
}

export const demoChapters: DemoChapter[] = [
  {
    id: 'demo-chapter-1',
    title: 'Chapter 1: The Disappearance',
    content: `The locker stood alone at the end of the hallway, number 237, exactly where it had always been. But something was different now. Sarah pressed her palm against the cool metal, feeling the faint vibration that no one else seemed to notice.

"You coming to lunch?" Maya's voice echoed from around the corner.

Sarah pulled her hand back quickly. "Yeah, just a second."

But she couldn't stop staring. Three days ago, this locker had belonged to Marcus Chen, the quiet kid who sat in the back of her physics class. Three days ago, Marcus had vanished without a trace. And now, according to everyone else—teachers, students, even his supposed best friend—Marcus Chen had never existed at all.

The locker hummed. Sarah was sure of it now. A low, almost imperceptible vibration that seemed to pulse in rhythm with her heartbeat.

"Sarah!" Maya's footsteps approached. "Are you okay? You've been weird all week."

"Do you remember Marcus?" Sarah asked, her voice barely above a whisper.

Maya frowned. "Marcus who?"

"Chen. Marcus Chen. He sat two rows behind us in physics."

"Sarah, there's no one with that name in our class. Are you feeling alright?"

The locker's vibration intensified. Sarah's fingers tingled where they'd touched the metal. And suddenly she knew—whatever had taken Marcus was still here, waiting in locker 237.

She had to find out what it was. Even if it meant no one would remember her either.`,
    wordCount: 245,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-20T14:22:00Z',
  },
  {
    id: 'demo-chapter-2',
    title: 'Chapter 2: The Discovery',
    content: `The school library closed at 4 PM, but Sarah had learned the janitor's schedule by heart. Mr. Rodriguez always started on the third floor at 4:15, which gave her exactly forty-five minutes in the restricted archive before he made his way down to the basement.

She'd found the first clue in Marcus's abandoned notebook—abandoned to everyone but her, at least. The notebook that officially belonged to no one, sitting in the lost and found for three days, filled with equations that Sarah couldn't quite understand. But one page was different. One page showed a simple diagram: locker 237, with concentric circles radiating outward, and a single word written in Marcus's precise handwriting: "Remember."

The old yearbooks were dusty, their plastic covers cracked with age. Sarah pulled out the volumes one by one, starting from five years ago, working backward. Her fingers left tracks in the dust as she flipped through pages of smiling faces, frozen in time.

That's when she found it. The pattern.

Every year, at least one student had vanished from these pages. Not from the school—from memory itself. But the yearbooks didn't forget. There, in faded color photographs, were the ghosts: Amy Rodriguez, Class of 2020. David Park, Class of 2019. Jennifer Walsh, Class of 2018. Each one crossed out with a thin red line that seemed to pulse when Sarah looked at it directly.

And then she saw her own face, in last year's sophomore class photo. But something was wrong. The Sarah in the photo wasn't smiling at the camera like everyone else. She was looking down at something in her hands—a small brass key.

"Impossible," Sarah whispered. She'd never posed for that photo with a key. Had she?

Her phone buzzed. A text from an unknown number: "Locker 237. Midnight. Come alone. - M"

Marcus. It had to be.

But if Marcus could still text her, where exactly was he? And more importantly—what did he need the key for?`,
    wordCount: 325,
    createdAt: '2025-01-16T09:15:00Z',
    updatedAt: '2025-01-21T16:45:00Z',
  },
  {
    id: 'demo-chapter-3',
    title: 'Chapter 3: Beyond the Door',
    content: `The school at midnight was a different world. Shadows stretched across hallways like dark water, and every sound echoed twice—once when it happened, and once from somewhere impossibly far away.

Sarah's flashlight beam cut through the darkness, illuminating locker 237. The metal no longer hummed. It sang—a high, crystalline note that made her teeth ache.

She'd found the key exactly where the yearbook suggested: taped to the underside of her desk in physics class, where it had apparently been waiting for her to remember it existed. The brass was warm in her palm, despite sitting in the cold classroom for who knew how long.

The key slid into the lock with a soft click. The singing stopped.

For a moment, nothing happened. Then the locker door swung open, not outward into the hallway, but inward into impossible space. Beyond the metal frame, Sarah could see a corridor that definitely didn't exist in the normal geometry of her school. The walls were the same institutional beige, but they stretched far deeper than the locker's shallow interior should allow.

"Sarah. You came."

Marcus stood at the far end of the corridor, his outline slightly translucent, as if he were only partly there. "I wasn't sure if you'd remember me long enough to find the key."

"What is this place?" Sarah's voice echoed strangely, each word arriving twice.

"The In-Between," Marcus said. "It's where the forgotten go. Every time you forget something—a name, a face, a moment—it ends up here. Usually it just fades away completely. But sometimes..." He gestured to the corridor, to the dozens of doors lining both sides. "Sometimes it gets trapped."

"And the red line in the yearbooks?"

"That's not a line. It's a seal. The school's been feeding students to this place for decades. One per year, like clockwork. They're stored here, in the In-Between, powering something. I don't know what yet." Marcus's form flickered. "But Sarah, you have to listen. You're not here by accident. You're different from the rest of us. You can remember."

The corridor began to vibrate. From behind the closed doors, Sarah could hear voices—dozens of them—calling out names, desperate to be remembered.

"We don't have much time," Marcus said. "The seal is breaking. And when it does, either everyone trapped here goes free... or everyone who remembers them gets pulled in too. You have to choose."

Behind Sarah, the locker door started to close.`,
    wordCount: 392,
    createdAt: '2025-01-18T11:00:00Z',
    updatedAt: '2025-01-22T09:30:00Z',
  },
];

export const demoProject: DemoProject = {
  id: 'demo-project-preview',
  name: 'The Forgotten',
  description:
    'A young adult mystery about a high school student who discovers a supernatural phenomenon that makes people vanish from collective memory.',
  chapters: demoChapters,
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
};

/**
 * Get a clone of the demo project to prevent mutations
 */
export function getDemoProject(): DemoProject {
  return structuredClone(demoProject);
}

/**
 * Get demo project statistics
 */
export function getDemoProjectStats() {
  const totalWords = demoChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const avgWordsPerChapter = Math.round(totalWords / demoChapters.length);

  return {
    chapterCount: demoChapters.length,
    totalWords,
    avgWordsPerChapter,
    estimatedReadingTime: Math.ceil(totalWords / 200), // 200 words per minute
  };
}
