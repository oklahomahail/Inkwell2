/**
 * Chapter UI Components
 *
 * Unified exports for chapter management UI (v0.6.0+)
 */

export { default as ChapterListView } from './ChapterListView';
export type { ChapterListViewProps } from './ChapterListView';

export { default as ChapterListItem } from './ChapterListItem';
export type { ChapterListItemProps } from './ChapterListItem';

export { default as ChapterBreadcrumbs } from './ChapterBreadcrumbs';
export type { ChapterBreadcrumbsProps } from './ChapterBreadcrumbs';

export { default as NewChapterDialog } from './NewChapterDialog';
export type { NewChapterDialogProps } from './NewChapterDialog';

// Legacy components (maintain for backward compatibility)
export { default as ChapterSidebar } from './ChapterSidebar';
export { default as SortableChapterItem } from './SortableChapterItem';
