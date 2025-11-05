/**
 * Welcome Project Seed Content
 *
 * Demo chapters for first-time users showing Inkwell's core features.
 * Content is instructional, actionable, and PII-free.
 */

export interface WelcomeChapterData {
  title: string;
  order: number;
  content: string;
  summary?: string;
}

/**
 * Generate 3 demo chapters for the welcome project
 */
export function seedChapters(): WelcomeChapterData[] {
  return [
    {
      title: 'Getting Started',
      order: 1,
      summary: 'Introduction to Inkwell and basic navigation',
      content: [
        '# Welcome to Inkwell',
        '',
        'Inkwell is your writing companion—designed for authors who need reliability, speed, and powerful tools without complexity.',
        '',
        '## What You Can Try Now',
        '',
        '- **Create a new chapter** — Click the + button in the sidebar',
        '- **Rename this chapter** — Double-click the title above',
        '- **Start writing** — Type anywhere and watch autosave work its magic',
        '- **Navigate quickly** — Use the sidebar to jump between chapters',
        '',
        '## Key Features',
        '',
        '### Automatic Saving',
        "Your work is saved automatically as you type. No need to remember to save—we've got you covered.",
        '',
        '### Offline-First',
        "Write anywhere, anytime. Your work is stored locally and syncs when you're back online.",
        '',
        '### Recovery System',
        'If something goes wrong, our 3-tier recovery system protects your work with cloud backups, local copies, and manual restore options.',
        '',
        '---',
        '',
        '**Ready to continue?** Open the next chapter to learn about writing your first scene.',
      ].join('\n'),
    },
    {
      title: 'Writing Your First Scene',
      order: 2,
      summary: 'Tips for drafting and organizing your writing',
      content: [
        '# Writing Your First Scene',
        '',
        'Start drafting your story. Inkwell tracks your changes automatically in the background, so you can focus on what matters—your words.',
        '',
        '## Writing Tips',
        '',
        '### Structure with Headings',
        'Use markdown headings to organize scenes within chapters:',
        '',
        '```markdown',
        '# Chapter Title',
        '## Scene 1: Morning',
        '### Location: Coffee Shop',
        '```',
        '',
        '### Split Long Chapters',
        'If a chapter gets too long, split it into multiple chapters. Each chapter in Inkwell is independent and easy to reorganize.',
        '',
        '### Quick Navigation',
        'Reopen any chapter quickly from the sidebar. Your last position is remembered.',
        '',
        '## Autosave Performance',
        '',
        'Inkwell monitors autosave performance to ensure your writing experience stays smooth:',
        '',
        '- **Target latency:** p95 under 250ms',
        "- **Render drift:** Less than 10ms (you won't notice any lag)",
        '- **Status indicator:** Check the autosave status in the top bar',
        '',
        '## Working Offline',
        '',
        "Lost your connection? No problem. Inkwell queues your changes and syncs them automatically when you're back online.",
        '',
        'The status bar shows your sync state:',
        '- 🟢 Green: Online and synced',
        '- 🟡 Yellow: Offline (saving locally)',
        '- 🔄 Syncing: Uploading queued changes',
        '',
        '---',
        '',
        '**Next:** Learn how to export your work in the final chapter.',
      ].join('\n'),
    },
    {
      title: 'Exporting Your Work',
      order: 3,
      summary: 'Export options and workflow',
      content: [
        '# Exporting Your Work',
        '',
        "When you're ready to share your manuscript, Inkwell offers flexible export options.",
        '',
        '## Export Dashboard',
        '',
        'Access the Export Dashboard from the main menu to:',
        '',
        '- Export selected chapters or your full manuscript',
        '- Choose from multiple formats (PDF, DOCX, EPUB)',
        '- Apply professional formatting templates',
        '- Track export job progress',
        '',
        '## Offline Export',
        '',
        'Exports work offline and sync when you reconnect. Your export jobs are queued and processed in order.',
        '',
        '## Format Options',
        '',
        '### PDF',
        'Professional-quality PDFs with customizable styling, perfect for submissions or printing.',
        '',
        '### DOCX',
        'Microsoft Word format with proper formatting for editing and collaboration.',
        '',
        '### EPUB',
        'Digital book format for e-readers and publishing platforms.',
        '',
        '## Pro Tips',
        '',
        '- **Preview before exporting:** Use the preview pane to check formatting',
        '- **Save templates:** Create custom export templates for different publishers',
        '- **Batch exports:** Export multiple versions at once',
        '',
        '---',
        '',
        "## What's Next?",
        '',
        "You've completed the welcome tour! Here's what to do now:",
        '',
        '1. **Create your first project** — Click "New Project" in the dashboard',
        '2. **Explore the dashboard** — Discover analytics, backups, and settings',
        '3. **Check the Help menu** — Find keyboard shortcuts and advanced features',
        '',
        '**Ready to skip the tutorial?** Click "Skip Tutorial" in the status bar to remove this welcome project and start writing.',
        '',
        '---',
        '',
        '### Need Help?',
        '',
        'Visit the Help menu for:',
        '- Keyboard shortcuts',
        '- Feature guides',
        '- Troubleshooting tips',
        '- Community support links',
        '',
        '**Happy writing! 📝**',
      ].join('\n'),
    },
  ];
}

/**
 * Validate chapter data structure
 */
export function validateChapterData(chapter: WelcomeChapterData): boolean {
  return !!(
    chapter.title &&
    typeof chapter.order === 'number' &&
    chapter.content &&
    chapter.content.length > 0
  );
}
