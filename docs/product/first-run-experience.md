# First-Run Experience (FRE)

## Overview

The First-Run Experience (FRE) is the sequence of interactions a new user has when first signing up for Inkwell. It includes:

1. **Account creation** (signup form)
2. **Onboarding survey** (optional: goals, experience level)
3. **Sample project creation** (pre-populated with demo content)
4. **Spotlight Tour** (guided walkthrough of key features)
5. **First action prompt** (create your own project)

## Goals

- **Reduce time-to-value**: Help users see the value of Inkwell within 5 minutes
- **Increase activation**: Guide users to complete a meaningful action (create a project, write a chapter)
- **Build confidence**: Show users where key features are and how to use them
- **Set expectations**: Communicate what Inkwell can do and what it's for

## User Flow

```
┌─────────────────┐
│   Signup Form   │
│  (email, pwd)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Onboarding    │  (Optional, can skip)
│     Survey      │
│ (goals, level)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Create Sample  │
│     Project     │
│ (auto-created)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Spotlight Tour │
│  (8-10 steps)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Dashboard with │
│  "Create First  │
│    Project" CTA │
└─────────────────┘
```

## Onboarding Survey

### Questions

1. **What brings you to Inkwell?**
   - [ ] Writing a novel
   - [ ] Screenplay/script
   - [ ] Short stories
   - [ ] World-building/RPG
   - [ ] Other

2. **How would you describe your writing experience?**
   - [ ] Beginner (first major project)
   - [ ] Intermediate (completed 1-2 projects)
   - [ ] Advanced (published author or multiple projects)

3. **What's your biggest challenge with writing?**
   - [ ] Staying organized
   - [ ] Plot development
   - [ ] Character consistency
   - [ ] Motivation/discipline
   - [ ] Other

### Data Usage

- **Personalize tour**: Show relevant features based on goals
- **Segment analytics**: Track activation by experience level
- **Feature discoverability**: Highlight tools for their challenges

### Implementation

```tsx
// src/components/onboarding/OnboardingSurvey.tsx
export function OnboardingSurvey({ onComplete }: Props) {
  const [responses, setResponses] = useState({
    goal: '',
    experience: '',
    challenge: '',
  });

  const handleSubmit = () => {
    analytics.track('onboarding_survey_completed', responses);
    onComplete(responses);
  };

  return <form onSubmit={handleSubmit}>{/* Survey questions */}</form>;
}
```

## Sample Project

### Purpose

- Give users something to explore immediately
- Demonstrate best practices (chapter organization, notes, etc.)
- Provide a template to reference when creating their own project

### Content

**Project**: "The Dragon's Apprentice" (fantasy adventure)

**Chapters**:

1. **The Summons**: Protagonist receives a mysterious letter
2. **Into the Mountains**: Journey to the dragon's lair
3. **The First Lesson**: Learning to communicate with dragons
4. **The Dark Threat**: Discovery of an ancient evil

**Characters**:

- **Aria**: Young apprentice, curious and determined
- **Zephyr**: Ancient dragon, wise but enigmatic
- **Lord Malakai**: Antagonist, seeks to control dragons

**World Notes**:

- **Magic System**: Dragon bonds grant elemental powers
- **Geography**: Mountain kingdom of Drakmoor
- **History**: Dragons once ruled, now rare

### Implementation

```typescript
// src/services/sampleProject.ts
export async function createSampleProject(userId: string) {
  const project = await db.projects.create({
    userId,
    title: "The Dragon's Apprentice",
    description: 'A sample project to help you get started with Inkwell.',
    isSample: true,
  });

  await db.chapters.createMany([
    { projectId: project.id, title: 'The Summons', content: CHAPTER_1_CONTENT, order: 1 },
    { projectId: project.id, title: 'Into the Mountains', content: CHAPTER_2_CONTENT, order: 2 },
    // ... more chapters
  ]);

  await db.characters.createMany([
    {
      projectId: project.id,
      name: 'Aria',
      description: 'Young apprentice...',
      role: 'protagonist',
    },
    // ... more characters
  ]);

  return project;
}
```

## Spotlight Tour

### Tour Steps

#### Step 1: Welcome

- **Target**: Dashboard header
- **Placement**: bottom
- **Content**: "Welcome to Inkwell! Let's take a quick tour of the key features."

#### Step 2: Projects

- **Target**: Projects sidebar or grid
- **Placement**: right
- **Content**: "This is your project library. Each project can have multiple chapters, characters, and notes."

#### Step 3: Sample Project

- **Target**: Sample project card
- **Placement**: right
- **Content**: "We've created a sample project for you. Open it to explore how Inkwell works."

#### Step 4: Chapter Editor

- **Route**: `/project/[sampleId]/editor`
- **Target**: Editor interface
- **Placement**: bottom
- **Content**: "Write and edit your chapters here. Use the toolbar for formatting and structure."

#### Step 5: Chapter Outline

- **Target**: Chapters sidebar
- **Placement**: left
- **Content**: "Organize your chapters by dragging them into the right order."

#### Step 6: Character Management

- **Route**: `/project/[sampleId]/characters`
- **Target**: Character list
- **Placement**: right
- **Content**: "Keep track of your characters, their traits, and relationships."

#### Step 7: AI Tools

- **Target**: AI analysis button
- **Placement**: top
- **Content**: "Use AI to analyze plot structure, check character consistency, and get writing suggestions."

#### Step 8: Export

- **Target**: Export button
- **Placement**: left
- **Content**: "When you're ready, export your project to PDF, DOCX, or other formats."

#### Step 9: Create Your Own

- **Route**: `/dashboard`
- **Target**: "New Project" button
- **Placement**: right
- **Content**: "You're all set! Click here to create your first project."

### Tour Configuration

```typescript
// src/tour/config.ts
export const onboardingTourConfig: TourConfig = {
  version: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Inkwell',
      body: "Let's take a quick tour of the key features.",
      selectors: ['[data-tour-id="dashboard-header"]'],
      placement: 'bottom',
    },
    {
      id: 'projects',
      title: 'Your Projects',
      body: 'This is your project library. Each project can have multiple chapters, characters, and notes.',
      selectors: ['[data-tour-id="projects-list"]'],
      placement: 'right',
    },
    // ... more steps
  ],
  fallbackPlacement: 'bottom',
  defaultSpotlightPadding: 12,
  timeoutMs: 5000,
  analyticsEnabled: true,
};
```

## First Action Prompt

### Purpose

- Guide users to take a meaningful action after the tour
- Create a sense of ownership (their project vs. sample)
- Increase activation rate

### Implementation

```tsx
// src/components/dashboard/FirstActionPrompt.tsx
export function FirstActionPrompt() {
  const hasProjects = useProjectCount() > 0;
  const hasSample = useSampleProjectExists();

  if (hasProjects && !hasSample) return null; // User already has projects

  return (
    <div className="bg-accent-50 dark:bg-accent-900/20 p-6 rounded-lg border border-accent-200 dark:border-accent-800">
      <h3 className="text-lg font-semibold mb-2">Ready to start your own project?</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        You've explored the sample project. Now create your own and bring your story to life.
      </p>
      <button onClick={handleCreateProject} className="btn-primary">
        Create Your First Project
      </button>
    </div>
  );
}
```

## Metrics & Optimization

### Key Metrics

1. **Activation Rate**: % of signups who create a project
2. **Time to Activation**: Average time from signup to first project
3. **Tour Completion**: % of users who complete the tour
4. **Sample Project Engagement**: % who open the sample project
5. **Retention**: % who return within 7 days

### Target Benchmarks

- Activation rate: > 40%
- Time to activation: < 10 minutes
- Tour completion: > 60%
- Sample project opened: > 80%
- 7-day retention: > 30%

### A/B Testing Ideas

1. **Tour length**: 5 steps vs. 10 steps
2. **Sample project**: Fantasy vs. Sci-Fi vs. Mystery
3. **Onboarding survey**: Required vs. optional
4. **First action prompt**: Immediate vs. delayed

## Accessibility

### Screen Readers

- Tour announcements use ARIA live regions
- All buttons have descriptive labels
- Survey questions have proper label associations

### Keyboard Navigation

- Tour can be navigated with arrow keys
- All interactive elements are keyboard-accessible
- Focus is managed correctly throughout FRE

### Mobile

- Tour works on mobile (responsive tooltips)
- Survey is touch-friendly
- Sample project is accessible on small screens

## Edge Cases

### User Skips Tour

- Tour completion state is saved
- User can restart tour from help menu
- First action prompt still shown

### User Deletes Sample Project

- No impact on tour (tour uses data-tour-id, not dynamic selectors)
- User can recreate sample from help menu

### User Already Has Projects (from import)

- Skip sample project creation
- Offer tour as optional ("Want a quick walkthrough?")

### User Returns Before Completing FRE

- Resume FRE from where they left off
- Persist progress in localStorage or IndexedDB

## Related Documentation

- [Feature Guide: Tour](../features/tour.md)
- [Architecture: Spotlight Tour](../architecture/spotlight-tour-architecture.md)
- [Operations: Telemetry](../ops/telemetry.md)
- [QA Checklist](../../QA_CHECKLIST.md)
- [User Guide](../../USER_GUIDE.md)
