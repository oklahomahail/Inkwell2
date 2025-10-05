// Simplified tests for VirtualizedColumn component focusing on core virtualization behavior
// Tests the key virtualization features without complex mocking

import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  PlotColumn,
  PlotCard,
  PlotColumnType,
  PlotCardStatus,
  PlotCardPriority,
} from '../../types';
import { VirtualizedColumn } from '../VirtualizedColumn';

// Mock react-window with simpler implementation
vi.mock('react-window', () => {
  const MockList = ({ children, itemData, itemCount }: any) => (
    <div data-testid="virtualized-list" data-item-count={itemCount}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
        React.createElement('div', { key: index }, children({ index, style: {}, data: itemData })),
      )}
    </div>
  );

  // Add ref forwarding support
  const MockListWithRef = React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollToItem: vi.fn(),
    }));
    return <MockList {...props} />;
  });

  return {
    List: MockListWithRef,
    FixedSizeList: MockListWithRef,
  };
});

// Mock store with minimal implementation
vi.mock('../../store', () => ({
  usePlotBoardStore: () => ({
    deleteCard: vi.fn().mockResolvedValue(undefined),
    createCard: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock chapters store
vi.mock('../../../stores/useChaptersStore', () => ({
  useChaptersStore: () => ({
    chapters: {},
  }),
}));

describe('VirtualizedColumn', () => {
  const mockColumn: PlotColumn = {
    id: 'col1',
    boardId: 'board1',
    title: 'Test Column',
    description: 'Test description',
    type: PlotColumnType.ACT,
    color: '#3B82F6',
    order: 0,
    cards: [],
    settings: {
      autoColor: true,
      showCardCount: true,
      collapsible: false,
      sortBy: 'order' as const,
      showProgress: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Generate test cards with all required fields
  const createMockCards = (count: number): PlotCard[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `card${i + 1}`,
      columnId: 'col1',
      title: `Test Card ${i + 1}`,
      description: `Description ${i + 1}`,
      status: PlotCardStatus.IDEA,
      priority: PlotCardPriority.MEDIUM,
      tags: [`tag${i + 1}`, 'test'],
      order: i,
      wordCount: 100 + i,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  const renderVirtualizedColumn = (
    column: PlotColumn,
    cards: PlotCard[] = [],
    props: Partial<Parameters<typeof VirtualizedColumn>[0]> = {},
  ) => {
    const cardIds = cards.map((card) => card.id);

    return render(
      <DndContext>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <VirtualizedColumn column={{ ...column, cards }} cards={cards} {...props} />
        </SortableContext>
      </DndContext>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Virtualization', () => {
    it('renders without virtualization for small card lists', () => {
      const cards = createMockCards(30);
      renderVirtualizedColumn(mockColumn, cards);

      // Should not show virtualization indicator
      expect(screen.queryByText('⚡')).not.toBeInTheDocument();
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    });

    it('enables virtualization for large card lists', () => {
      const cards = createMockCards(60);
      renderVirtualizedColumn(mockColumn, cards);

      // Should show virtualization indicator
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByTitle('Virtualized for performance')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByText('⚡ Performance mode: 60 cards virtualized')).toBeInTheDocument();
    });

    it('displays correct virtualization threshold', () => {
      // Test right at the threshold
      const cards = createMockCards(50);
      renderVirtualizedColumn(mockColumn, cards);
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();

      // Test just above threshold
      const cardsAboveThreshold = createMockCards(51);
      const { rerender } = render(
        <DndContext>
          <SortableContext
            items={cardsAboveThreshold.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <VirtualizedColumn
              column={{ ...mockColumn, cards: cardsAboveThreshold }}
              cards={cardsAboveThreshold}
            />
          </SortableContext>
        </DndContext>,
      );

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('passes correct item count to virtualized list', () => {
      const cards = createMockCards(100);
      renderVirtualizedColumn(mockColumn, cards);

      const list = screen.getByTestId('virtualized-list');
      expect(list).toHaveAttribute('data-item-count', '100');
    });
  });

  describe('Basic UI Elements', () => {
    it('renders column header with title and count', () => {
      const cards = createMockCards(5);
      renderVirtualizedColumn(mockColumn, cards);

      expect(screen.getByText('Test Column')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Card count badge
      expect(screen.getByText('🎭')).toBeInTheDocument(); // Act type icon
    });

    it('displays description when provided', () => {
      renderVirtualizedColumn(mockColumn, []);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('shows empty state when no cards', () => {
      renderVirtualizedColumn(mockColumn, []);
      expect(screen.getByText('Drop cards here or click + to add')).toBeInTheDocument();
    });

    it('displays word count in footer', () => {
      const cards = createMockCards(3);
      renderVirtualizedColumn(mockColumn, cards);

      // Total word count: 100 + 101 + 102 = 303
      expect(screen.getByText('303 words')).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('toggles column collapse state', () => {
      const cards = createMockCards(60); // Use virtualized version
      renderVirtualizedColumn(mockColumn, cards);

      // Initially expanded - should show virtualized list
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

      // Click collapse
      const collapseBtn = screen.getByTitle('Collapse column');
      fireEvent.click(collapseBtn);

      // Should show collapsed state
      expect(screen.getByText('cards')).toBeInTheDocument();
      expect(screen.getAllByText('60')).toHaveLength(2); // Card count appears in header and collapsed view
      expect(screen.getByText('⚡ virtualized')).toBeInTheDocument();
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();

      // Click expand
      const expandBtn = screen.getByTitle('Expand column');
      fireEvent.click(expandBtn);

      // Should be expanded again with virtualized list
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.queryByText('cards')).not.toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('respects compact view setting', () => {
      renderVirtualizedColumn(mockColumn, [], { isCompact: true });

      // In compact view, description should be hidden
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Props', () => {
    it('accepts and uses keyboard navigation props', () => {
      const cards = createMockCards(60);
      const mockOnCardFocus = vi.fn();

      renderVirtualizedColumn(mockColumn, cards, {
        focusedCardId: 'card1',
        onCardFocus: mockOnCardFocus,
      });

      // Virtualized list should be present with navigation props
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Performance Settings', () => {
    it('accepts custom virtualization settings', () => {
      const cards = createMockCards(60);

      renderVirtualizedColumn(mockColumn, cards, {
        itemHeight: 200,
        maxHeight: 800,
        overscanCount: 10,
      });

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Column Actions', () => {
    it('renders action buttons', () => {
      renderVirtualizedColumn(mockColumn, []);

      expect(screen.getByTitle('Add card')).toBeInTheDocument();
      expect(screen.getByTitle('Edit column')).toBeInTheDocument();
      expect(screen.getByTitle('Delete column')).toBeInTheDocument();
    });

    it('calls edit column handler when provided', () => {
      const mockOnEditColumn = vi.fn();
      renderVirtualizedColumn(mockColumn, [], {
        onEditColumn: mockOnEditColumn,
      });

      const editBtn = screen.getByTitle('Edit column');
      fireEvent.click(editBtn);

      expect(mockOnEditColumn).toHaveBeenCalledWith(mockColumn);
    });
  });

  describe('Integration with DnD', () => {
    it('provides sortable context for cards', () => {
      const cards = createMockCards(10);
      renderVirtualizedColumn(mockColumn, cards);

      // Cards should render within the sortable context
      expect(screen.getByText('Test Card 1')).toBeInTheDocument();
      expect(screen.getByText('Test Card 2')).toBeInTheDocument();
    });

    it('maintains DnD context for virtualized cards', () => {
      const cards = createMockCards(60);
      renderVirtualizedColumn(mockColumn, cards);

      // Virtualized list should contain cards
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

      // Should render some cards (mocked to show first 10)
      expect(screen.getByText('Test Card 1')).toBeInTheDocument();
    });
  });
});
