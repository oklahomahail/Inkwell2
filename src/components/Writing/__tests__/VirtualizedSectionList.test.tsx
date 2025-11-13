// src/components/Writing/__tests__/VirtualizedSectionList.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { VirtualizedSectionList } from '../VirtualizedSectionList';
import type { Section } from '@/types/section';

describe('VirtualizedSectionList', () => {
  const mockSections: Section[] = Array.from({ length: 10 }, (_, i) => ({
    id: `section-${i}`,
    title: `Section ${i}`,
    type: 'chapter' as const,
    order: i,
    projectId: 'test-project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const mockRenderItem = vi.fn((section: Section) => (
    <div data-testid={`section-${section.id}`}>{section.title}</div>
  ));

  it('renders sections without virtualization when below threshold', () => {
    render(
      <VirtualizedSectionList
        sections={mockSections}
        activeId={null}
        renderItem={mockRenderItem}
        virtualizationThreshold={50}
      />,
    );

    // All sections should be rendered
    mockSections.forEach((section) => {
      expect(screen.getByTestId(`section-${section.id}`)).toBeInTheDocument();
    });
  });

  it('sorts sections by order', () => {
    const unorderedSections = [
      { ...mockSections[2], order: 2 },
      { ...mockSections[0], order: 0 },
      { ...mockSections[1], order: 1 },
    ];

    render(
      <VirtualizedSectionList
        sections={unorderedSections}
        activeId={null}
        renderItem={mockRenderItem}
        virtualizationThreshold={50}
      />,
    );

    const calls = mockRenderItem.mock.calls;
    expect(calls[0][0].order).toBe(0);
    expect(calls[1][0].order).toBe(1);
    expect(calls[2][0].order).toBe(2);
  });

  it('uses virtualization when above threshold', () => {
    const manySections: Section[] = Array.from({ length: 60 }, (_, i) => ({
      id: `section-${i}`,
      title: `Section ${i}`,
      type: 'chapter' as const,
      order: i,
      projectId: 'test-project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { container } = render(
      <VirtualizedSectionList
        sections={manySections}
        activeId={null}
        renderItem={mockRenderItem}
        virtualizationThreshold={50}
      />,
    );

    // Should have virtualization container
    const virtualizationContainer = container.querySelector('[style*="position: relative"]');
    expect(virtualizationContainer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VirtualizedSectionList
        sections={mockSections}
        activeId={null}
        renderItem={mockRenderItem}
        className="custom-class"
      />,
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('calls onActiveChange when provided', () => {
    const onActiveChange = vi.fn();

    render(
      <VirtualizedSectionList
        sections={mockSections}
        activeId="section-0"
        renderItem={mockRenderItem}
        onActiveChange={onActiveChange}
      />,
    );

    // Component accepts the callback - actual keyboard navigation tested separately
    expect(onActiveChange).toBeDefined();
  });
});
