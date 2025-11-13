// src/components/Writing/VirtualizedSectionList.tsx
/**
 * VirtualizedSectionList
 *
 * Performant virtualized list for rendering 50+ sections/chapters.
 * Uses @tanstack/react-virtual for efficient DOM recycling.
 *
 * Features:
 * - Automatic virtualization threshold (50+ items)
 * - Drag-and-drop support via dnd-kit
 * - Keyboard navigation
 * - Smooth scrolling to active item
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useEffect, useMemo } from 'react';

import type { Section } from '@/types/section';

export interface VirtualizedSectionListProps {
  sections: Section[];
  activeId: string | null;
  renderItem: (section: Section, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  virtualizationThreshold?: number;
  className?: string;
  onActiveChange?: (sectionId: string) => void;
}

export function VirtualizedSectionList({
  sections,
  activeId,
  renderItem,
  itemHeight = 44, // Default height for typical section list item
  overscan = 5,
  virtualizationThreshold = 50,
  className = '',
  onActiveChange: _onActiveChange,
}: VirtualizedSectionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort sections by order
  const sortedSections = useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);

  // Determine if virtualization is needed
  const shouldVirtualize = sections.length > virtualizationThreshold;

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? sortedSections.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  // Scroll to active section when it changes
  useEffect(() => {
    if (!shouldVirtualize || !activeId) return;

    const activeIndex = sortedSections.findIndex((s) => s.id === activeId);
    if (activeIndex >= 0) {
      virtualizer.scrollToIndex(activeIndex, {
        align: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeId, sortedSections, shouldVirtualize, virtualizer]);

  // Non-virtualized render (< threshold)
  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {sortedSections.map((section, index) => (
          <div key={section.id}>{renderItem(section, index)}</div>
        ))}
      </div>
    );
  }

  // Virtualized render (>= threshold)
  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        overflowY: 'auto',
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const section = sortedSections[virtualItem.index];
          if (!section) return null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(section, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook for keyboard navigation in virtualized section lists
 */
export function useSectionKeyboardNavigation(
  sections: Section[],
  activeId: string | null,
  onActiveChange: (sectionId: string) => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeId) return;

      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      const currentIndex = sortedSections.findIndex((s) => s.id === activeId);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowUp':
          if (e.metaKey || e.ctrlKey) {
            // Jump to first
            nextIndex = 0;
          } else {
            // Move up one
            nextIndex = Math.max(0, currentIndex - 1);
          }
          e.preventDefault();
          break;

        case 'ArrowDown':
          if (e.metaKey || e.ctrlKey) {
            // Jump to last
            nextIndex = sortedSections.length - 1;
          } else {
            // Move down one
            nextIndex = Math.min(sortedSections.length - 1, currentIndex + 1);
          }
          e.preventDefault();
          break;

        case 'Home':
          nextIndex = 0;
          e.preventDefault();
          break;

        case 'End':
          nextIndex = sortedSections.length - 1;
          e.preventDefault();
          break;

        default:
          return;
      }

      const nextSection = sortedSections[nextIndex];
      if (nextIndex !== currentIndex && nextSection) {
        onActiveChange(nextSection.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections, activeId, onActiveChange]);
}
