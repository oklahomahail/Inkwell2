// src/hooks/useEnhancedTimeline.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { TimelineEvent, TimelineFilters } from '@/components/Views/TimelineView';
import { useAppContext } from '@/context/AppContext';
import { timelineService } from '@/services/timelineService';

interface UseEnhancedTimelineResult {
  // Event management
  events: TimelineEvent[];
  filteredEvents: TimelineEvent[];
  addEvent: (
    event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<TimelineEvent>;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Bulk operations
  importFromStoryArchitect: (outline: any) => Promise<void>;
  reorderEvents: (eventIds: string[], newPositions: number[]) => Promise<void>;

  // Filtering and searching
  filters: TimelineFilters;
  setFilters: (filters: Partial<TimelineFilters>) => void;
  searchEvents: (query: string) => TimelineEvent[];

  // POV lanes for timeline view
  povLanes: Array<{ pov: string; events: TimelineEvent[] }>;

  // Statistics and insights
  timelineStats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByImportance: Record<string, number>;
    charactersInvolved: string[];
    timeSpan: { earliest: number; latest: number } | null;
  };

  // Consistency checking
  checkConsistency: () => Array<{
    eventId: string;
    issue: string;
    severity: 'warning' | 'error';
    suggestion: string;
  }>;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useEnhancedTimeline(): UseEnhancedTimelineResult {
  const { currentProject } = useAppContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filters, setFiltersState] = useState<TimelineFilters>({
    pov: 'all',
    location: 'all',
    tags: [],
    importance: 'all',
    eventType: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events when project changes
  useEffect(() => {
    if (!currentProject?.id) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedEvents = await timelineService.getProjectTimeline(currentProject.id);
        setEvents(loadedEvents);
      } catch (err) {
        setError('Failed to load timeline events');
        console.error('Timeline load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [currentProject?.id]);

  // Add new event
  const addEvent = useCallback(
    async (eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const newEvent: TimelineEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newEvents = [...events, newEvent];
      setEvents(newEvents);
      await timelineService.saveProjectTimeline(currentProject.id, newEvents);

      return newEvent;
    },
    [events, currentProject?.id],
  );

  // Update existing event
  const updateEvent = useCallback(
    async (id: string, updates: Partial<TimelineEvent>) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const newEvents = events.map((event) =>
        event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event,
      );

      setEvents(newEvents);
      await timelineService.saveProjectTimeline(currentProject.id, newEvents);
    },
    [events, currentProject?.id],
  );

  // Delete event
  const deleteEvent = useCallback(
    async (id: string) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const newEvents = events.filter((event) => event.id !== id);
      setEvents(newEvents);
      await timelineService.saveProjectTimeline(currentProject.id, newEvents);
    },
    [events, currentProject?.id],
  );

  // Import events from Story Architect outline
  const importFromStoryArchitect = useCallback(
    async (outline: any) => {
      if (!currentProject?.id || !outline.chapters) return;

      const newEvents = timelineService.generateTimelineFromOutline(outline, currentProject.id);
      const allEvents = [...events, ...newEvents];

      setEvents(allEvents);
      await timelineService.saveProjectTimeline(currentProject.id, allEvents);
    },
    [events, currentProject?.id],
  );

  // Reorder events (for drag-and-drop)
  const reorderEvents = useCallback(
    async (eventIds: string[], newPositions: number[]) => {
      if (!currentProject?.id) throw new Error('No project selected');

      const newEvents = [...events];

      eventIds.forEach((eventId, index) => {
        const ei = newEvents.findIndex((e) => e.id === eventId);
        if (ei === -1) return;

        const prev = newEvents[ei];
        if (!prev) return; // extra safety

        // Previous "when" or a sane default
        const prevWhen = prev.when ?? { type: 'order' as const, value: 0, displayText: undefined };

        // Coalesce the new position safely
        const raw = newPositions?.[index];
        const nextValue =
          typeof raw === 'number' && Number.isFinite(raw) ? raw : (prevWhen.value ?? 0);

        // Preserve the previous when.type
        const nextWhen =
          prevWhen.type === 'date'
            ? { type: 'date' as const, value: nextValue, displayText: prevWhen.displayText }
            : { type: 'order' as const, value: nextValue, displayText: prevWhen.displayText };

        // Final merged event (no duplicate keys; required strings guaranteed)
        newEvents[ei] = {
          ...prev,
          id: prev.id ?? `evt_${ei}`,
          title: prev.title ?? '(untitled)',
          description: prev.description ?? '',
          when: nextWhen,
          updatedAt: new Date(),
        };
      });

      // Re-sort events
      newEvents.sort((a, b) => a.when.value - b.when.value);

      setEvents(newEvents);
      await timelineService.saveProjectTimeline(currentProject.id, newEvents);
    },
    [events, currentProject?.id],
  );

  // Update filters with validation
  const setFilters = useCallback((newFilters: Partial<TimelineFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (filters.pov !== 'all' && event.pov !== filters.pov) return false;
        if (filters.location !== 'all' && event.location !== filters.location) return false;
        if (filters.importance !== 'all' && event.importance !== filters.importance) return false;
        if (filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
        if (filters.tags.length > 0 && !filters.tags.some((tag) => event.tags.includes(tag)))
          return false;

        // Date range filter
        if (filters.dateRange) {
          const eventTime = event.when.value;
          if (eventTime < filters.dateRange.start || eventTime > filters.dateRange.end)
            return false;
        }

        return true;
      })
      .sort((a, b) => a.when.value - b.when.value);
  }, [events, filters]);

  // Search events by text
  const searchEvents = useCallback(
    (query: string): TimelineEvent[] => {
      if (!query.trim()) return filteredEvents;

      const searchTerm = query.toLowerCase();
      return filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          (event.location && event.location.toLowerCase().includes(searchTerm)) ||
          (event.pov && event.pov.toLowerCase().includes(searchTerm)),
      );
    },
    [filteredEvents],
  );

  // Generate POV lanes for timeline visualization
  const povLanes = useMemo(() => {
    const lanes = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((event) => {
      const pov = event.pov || 'General Timeline';
      if (!lanes.has(pov)) {
        lanes.set(pov, []);
      }
      lanes.get(pov)!.push(event);
    });

    return Array.from(lanes.entries())
      .map(([pov, events]) => ({ pov, events }))
      .sort((a, b) => {
        // Sort lanes: protagonist first, then by event count
        if (a.pov.toLowerCase().includes('protagonist')) return -1;
        if (b.pov.toLowerCase().includes('protagonist')) return 1;
        return b.events.length - a.events.length;
      });
  }, [filteredEvents]);

  // Calculate timeline statistics
  const timelineStats = useMemo(() => {
    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByImportance: {} as Record<string, number>,
      charactersInvolved: [] as string[],
      timeSpan: null as { earliest: number; latest: number } | null,
    };

    if (events.length === 0) return stats;

    // Count by type and importance
    events.forEach((event) => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsByImportance[event.importance] =
        (stats.eventsByImportance[event.importance] || 0) + 1;
    });

    // Get unique characters
    const characterSet = new Set<string>();
    events.forEach((event) => {
      event.characterIds.forEach((id) => characterSet.add(id));
      if (event.pov) characterSet.add(event.pov);
    });
    stats.charactersInvolved = Array.from(characterSet);

    // Calculate time span - filter out undefined values
    const validTimes = events
      .map((e) => e.when.value)
      .filter((time): time is number => typeof time === 'number')
      .sort((a, b) => a - b);

    if (validTimes.length > 0) {
      stats.timeSpan = {
        earliest: validTimes[0] || 0,
        latest: validTimes[validTimes.length - 1] || 0,
      };
    }

    return stats;
  }, [events]);

  // Check timeline consistency
  const checkConsistency = useCallback(() => {
    const issues: Array<{
      eventId: string;
      issue: string;
      severity: 'warning' | 'error';
      suggestion: string;
    }> = [];

    events.forEach((event) => {
      // Check for missing required fields
      if (!event.title.trim()) {
        issues.push({
          eventId: event.id,
          issue: 'Event has no title',
          severity: 'warning',
          suggestion: 'Add a descriptive title for this event',
        });
      }

      if (!event.description.trim()) {
        issues.push({
          eventId: event.id,
          issue: 'Event has no description',
          severity: 'warning',
          suggestion: 'Add details about what happens in this event',
        });
      }

      // Check for character consistency
      if (event.characterIds.length === 0 && event.eventType === 'character') {
        issues.push({
          eventId: event.id,
          issue: 'Character event has no characters involved',
          severity: 'warning',
          suggestion: 'Add the characters involved in this event',
        });
      }

      // Check POV consistency
      if (event.pov && !event.characterIds.includes(event.pov)) {
        issues.push({
          eventId: event.id,
          issue: 'POV character not listed in event characters',
          severity: 'warning',
          suggestion: 'Ensure POV character is included in character list',
        });
      }

      // Check for potential timeline conflicts
      const sameTimeEvents = events.filter(
        (e) => e.id !== event.id && e.when.value === event.when.value && e.pov === event.pov,
      );

      if (sameTimeEvents.length > 0) {
        issues.push({
          eventId: event.id,
          issue: `Multiple events at the same time for ${event.pov || 'same POV'}`,
          severity: 'warning',
          suggestion: 'Review timeline ordering for consistency',
        });
      }

      // Check scene/chapter links
      if (
        event.sceneId &&
        !currentProject?.chapters?.some((ch: { scenes: any[] }) =>
          ch.scenes?.some((scene: any) => scene.id === event.sceneId),
        )
      ) {
        issues.push({
          eventId: event.id,
          issue: 'Linked scene no longer exists',
          severity: 'error',
          suggestion: 'Update or remove the scene link',
        });
      }
    });

    return issues;
  }, [events, currentProject]);

  return {
    // Event management
    events,
    filteredEvents,
    addEvent,
    updateEvent,
    deleteEvent,

    // Bulk operations
    importFromStoryArchitect,
    reorderEvents,

    // Filtering and searching
    filters,
    setFilters,
    searchEvents,

    // Visualization data
    povLanes,

    // Statistics and insights
    timelineStats,

    // Consistency checking
    checkConsistency,

    // Loading and error states
    isLoading,
    error,
  };
}
