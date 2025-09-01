// src/components/Views/TimelineView.tsx
import { Clock, MapPin, User, Tag, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
// Remove unused import - we're using useEnhancedTimeline instead

// Enhanced Timeline Event type that integrates with your project structure
export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  // Flexible time handling - can be date or order index
  when: {
    type: 'date' | 'order';
    value: number; // Unix timestamp for date, or order index
    displayText?: string; // "Chapter 3" or "Day 2 of journey"
  };
  // Story context
  sceneId?: string; // Links to actual scene
  chapterId?: string; // Links to chapter
  characterIds: string[]; // Characters involved
  pov?: string; // Point of view character
  location?: string;
  tags: string[];
  // Event importance and type
  importance: 'major' | 'minor' | 'background';
  eventType: 'plot' | 'character' | 'world' | 'relationship';
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineFilters {
  pov: string | 'all';
  location: string | 'all';
  tags: string[];
  importance: string | 'all';
  eventType: string | 'all';
  dateRange?: { start: number; end: number };
}

interface TimelineViewProps {
  className?: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ className = '' }) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  // Timeline state
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>({
    pov: 'all',
    location: 'all',
    tags: [],
    importance: 'all',
    eventType: 'all',
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [timelineType, setTimelineType] = useState<'date' | 'order'>('order');

  // Get unique filter options from current project and events
  const filterOptions = useMemo(() => {
    const characters = (currentProject?.characters || []) as Array<{ id?: string; name?: string }>;
    const locations = new Set<string>();
    const tags = new Set<string>();
    const povs = new Set<string>();

    events.forEach((event) => {
      if (event.location) locations.add(event.location);
      event.tags.forEach((tag) => tags.add(tag));
      if (event.pov) povs.add(event.pov);
    });

    return {
      characters: characters.map((char) => ({
        id: char.id || `char-${char.name || 'unnamed'}`,
        name: char.name || 'Unnamed Character',
      })),
      locations: Array.from(locations),
      tags: Array.from(tags),
      povs: Array.from(povs),
    };
  }, [currentProject, events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      if (filters.pov !== 'all' && event.pov !== filters.pov) return false;
      if (filters.location !== 'all' && event.location !== filters.location) return false;
      if (filters.importance !== 'all' && event.importance !== filters.importance) return false;
      if (filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
      if (filters.tags.length > 0 && !filters.tags.some((tag) => event.tags.includes(tag)))
        return false;

      return true;
    });

    // Sort by timeline type
    return filtered.sort((a, b) => a.when.value - b.when.value);
  }, [events, filters]);

  // Create new event
  const createNewEvent = useCallback(() => {
    const newEvent: TimelineEvent = {
      id: `event-${Date.now()}`,
      title: '',
      description: '',
      when: {
        type: timelineType,
        value: timelineType === 'date' ? Date.now() : events.length + 1,
      },
      characterIds: [],
      tags: [],
      importance: 'minor',
      eventType: 'plot',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSelectedEvent(newEvent);
    setIsEditing(true);
    setShowNewEventForm(true);
  }, [timelineType, events.length]);

  // Save event
  const saveEvent = useCallback(() => {
    if (!selectedEvent) return;

    if (showNewEventForm) {
      setEvents((prev) => [...prev, selectedEvent]);
      setShowNewEventForm(false);
    } else {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedEvent.id ? { ...selectedEvent, updatedAt: new Date() } : event,
        ),
      );
    }

    setIsEditing(false);
    showToast(`Event "${selectedEvent.title || 'Untitled'}" saved`, 'success');
  }, [selectedEvent, showNewEventForm, showToast]);

  // Delete event
  const deleteEvent = useCallback(
    (eventId: string) => {
      if (confirm('Delete this event? This cannot be undone.')) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }
        showToast('Event deleted', 'success');
      }
    },
    [selectedEvent, showToast],
  );

  // Update selected event
  const updateSelectedEvent = useCallback(
    (updates: Partial<TimelineEvent>) => {
      if (!selectedEvent) return;
      setSelectedEvent((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [selectedEvent],
  );

  // Get event color based on type and importance
  const getEventColor = (event: TimelineEvent) => {
    const baseColors = {
      plot: 'blue',
      character: 'purple',
      world: 'green',
      relationship: 'pink',
    };

    const intensity =
      event.importance === 'major' ? '600' : event.importance === 'minor' ? '500' : '400';

    const color = baseColors[event.eventType];
    return `bg-${color}-${intensity} border-${color}-${parseInt(intensity) + 100}`;
  };

  // Generate POV lanes for timeline view
  const povLanes = useMemo(() => {
    const lanes = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((event) => {
      const pov = event.pov || 'General';
      if (!lanes.has(pov)) {
        lanes.set(pov, []);
      }
      lanes.get(pov)!.push(event);
    });

    return Array.from(lanes.entries()).map(([pov, events]) => ({ pov, events }));
  }, [filteredEvents]);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-sm">Select a project to create your story timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Story Timeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Map events across your story's chronology
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                List
              </button>
            </div>

            {/* Timeline Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTimelineType('order')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timelineType === 'order'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Story Order
              </button>
              <button
                onClick={() => setTimelineType('date')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timelineType === 'date'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Chronological
              </button>
            </div>

            <button
              onClick={createNewEvent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          {/* POV Filter */}
          <select
            value={filters.pov}
            onChange={(e) => setFilters((prev) => ({ ...prev, pov: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="all">All POVs</option>
            {filterOptions.povs.map((pov) => (
              <option key={pov} value={pov}>
                {pov}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={filters.location}
            onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="all">All Locations</option>
            {filterOptions.locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            value={filters.eventType}
            onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="plot">Plot Events</option>
            <option value="character">Character Moments</option>
            <option value="world">World Building</option>
            <option value="relationship">Relationships</option>
          </select>

          {/* Importance Filter */}
          <select
            value={filters.importance}
            onChange={(e) => setFilters((prev) => ({ ...prev, importance: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="all">All Importance</option>
            <option value="major">Major Events</option>
            <option value="minor">Minor Events</option>
            <option value="background">Background</option>
          </select>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Timeline/List View */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'timeline' ? (
            <TimelineChart
              povLanes={povLanes}
              onSelectEvent={setSelectedEvent}
              selectedEvent={selectedEvent}
              getEventColor={getEventColor}
              onDeleteEvent={deleteEvent}
            />
          ) : (
            <EventList
              events={filteredEvents}
              onSelectEvent={setSelectedEvent}
              selectedEvent={selectedEvent}
              getEventColor={getEventColor}
              onDeleteEvent={deleteEvent}
            />
          )}
        </div>

        {/* Event Details Panel */}
        {selectedEvent && (
          <EventDetailsPanel
            event={selectedEvent}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onSave={saveEvent}
            onCancel={() => {
              setIsEditing(false);
              if (showNewEventForm) {
                setSelectedEvent(null);
                setShowNewEventForm(false);
              }
            }}
            onUpdate={updateSelectedEvent}
            onDelete={() => deleteEvent(selectedEvent.id)}
            filterOptions={filterOptions}
            timelineType={timelineType}
          />
        )}
      </div>
    </div>
  );
};

// Timeline Chart Component (POV Lanes)
const TimelineChart: React.FC<{
  povLanes: Array<{ pov: string; events: TimelineEvent[] }>;
  onSelectEvent: (event: TimelineEvent) => void;
  selectedEvent: TimelineEvent | null;
  getEventColor: (event: TimelineEvent) => string;
  onDeleteEvent: (eventId: string) => void;
}> = ({ povLanes, onSelectEvent, selectedEvent, getEventColor, onDeleteEvent }) => {
  if (povLanes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
          <p className="text-sm">Add your first timeline event to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {povLanes.map(({ pov, events }) => (
          <div key={pov} className="relative">
            {/* POV Lane Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <h3 className="font-medium text-gray-900 dark:text-white">{pov}</h3>
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
            </div>

            {/* Events in this lane */}
            <div className="ml-8 space-y-3">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onSelectEvent(event)}
                >
                  {/* Timeline connector */}
                  {index < events.length - 1 && (
                    <div className="absolute left-6 top-8 w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                  )}

                  {/* Event card */}
                  <div
                    className={`relative flex items-start gap-4 p-4 rounded-lg border-2 ${getEventColor(event)} bg-opacity-10`}
                  >
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event)} mt-2`}></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title || 'Untitled Event'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.when.displayText || `Position ${event.when.value}`}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(event.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event metadata */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        {event.characterIds.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.characterIds.length} character
                            {event.characterIds.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {event.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {event.tags.slice(0, 2).join(', ')}
                            {event.tags.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Event List Component
const EventList: React.FC<{
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
  selectedEvent: TimelineEvent | null;
  getEventColor: (event: TimelineEvent) => string;
  onDeleteEvent: (eventId: string) => void;
}> = ({ events, onSelectEvent, selectedEvent, getEventColor, onDeleteEvent }) => {
  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Events Match Filters</h3>
          <p className="text-sm">Adjust your filters or add new timeline events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedEvent?.id === event.id
                ? 'ring-2 ring-blue-500 border-blue-300'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-800`}
            onClick={() => onSelectEvent(event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-4 h-4 rounded-full ${getEventColor(event)} mt-1`}></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {event.title || 'Untitled Event'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {event.when.displayText || `Position ${event.when.value}`}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {event.pov && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.pov}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {event.eventType}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        event.importance === 'major'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : event.importance === 'minor'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {event.importance}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEvent(event.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Event Details Panel
const EventDetailsPanel: React.FC<{
  event: TimelineEvent;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (updates: Partial<TimelineEvent>) => void;
  onDelete: () => void;
  filterOptions: {
    characters: Array<{ id: string; name: string }>;
    locations: string[];
    tags: string[];
    povs: string[];
  };
  timelineType: 'date' | 'order';
}> = ({
  event,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onUpdate,
  onDelete,
  filterOptions,
  timelineType,
}) => {
  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Event Details</h2>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  title="Save Event"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={onCancel}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onStartEdit}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  title="Edit Event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Title
          </label>
          <input
            type="text"
            value={event.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            disabled={!isEditing}
            placeholder="What happens in this event?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          />
        </div>

        {/* When */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            When
          </label>
          {timelineType === 'order' ? (
            <input
              type="number"
              value={event.when.value || 1}
              onChange={(e) =>
                onUpdate({
                  when: {
                    ...event.when,
                    value: Math.max(1, parseInt(e.target.value) || 1),
                  },
                })
              }
              disabled={!isEditing}
              placeholder="Story order (1, 2, 3...)"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          ) : (
            <input
              type="datetime-local"
              value={event.when.value ? new Date(event.when.value).toISOString().slice(0, 16) : ''}
              onChange={(e) =>
                onUpdate({
                  when: {
                    ...event.when,
                    value: e.target.value ? new Date(e.target.value).getTime() : Date.now(),
                  },
                })
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          )}
        </div>

        {/* Display Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Text (Optional)
          </label>
          <input
            type="text"
            value={event.when.displayText || ''}
            onChange={(e) =>
              onUpdate({
                when: {
                  ...event.when,
                  displayText: e.target.value,
                },
              })
            }
            disabled={!isEditing}
            placeholder="e.g., 'Chapter 3', 'Day 2 of journey'"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={event.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            disabled={!isEditing}
            placeholder="Describe what happens in this event..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 resize-none"
          />
        </div>

        {/* Event Type and Importance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={event.eventType}
              onChange={(e) =>
                onUpdate({ eventType: e.target.value as TimelineEvent['eventType'] })
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="plot">Plot Event</option>
              <option value="character">Character Moment</option>
              <option value="world">World Building</option>
              <option value="relationship">Relationship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Importance
            </label>
            <select
              value={event.importance}
              onChange={(e) =>
                onUpdate({ importance: e.target.value as TimelineEvent['importance'] })
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="background">Background</option>
            </select>
          </div>
        </div>

        {/* POV Character */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Point of View
          </label>
          <select
            value={event.pov || ''}
            onChange={(e) => onUpdate({ pov: e.target.value || undefined })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          >
            <option value="">Select POV character...</option>
            {filterOptions.characters.map((char) => (
              <option key={char.id} value={char.name}>
                {char.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={event.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value || undefined })}
            disabled={!isEditing}
            placeholder="Where does this event take place?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          />
        </div>

        {/* Characters Involved */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Characters Involved
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
            {filterOptions.characters.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No characters available</p>
            ) : (
              filterOptions.characters.map((char) => (
                <label key={char.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={event.characterIds.includes(char.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdate({ characterIds: [...event.characterIds, char.id] });
                      } else {
                        onUpdate({
                          characterIds: event.characterIds.filter((id) => id !== char.id),
                        });
                      }
                    }}
                    disabled={!isEditing}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                  />
                  <span className="text-gray-900 dark:text-white text-sm">{char.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={event.tags.join(', ')}
            onChange={(e) =>
              onUpdate({
                tags: e.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            disabled={!isEditing}
            placeholder="battle, revelation, turning-point (separate with commas)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          />
        </div>

        {/* Scene Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Linked Scene (Optional)
          </label>
          <input
            type="text"
            value={event.sceneId || ''}
            onChange={(e) => onUpdate({ sceneId: e.target.value || undefined })}
            disabled={!isEditing}
            placeholder="Scene ID to link this event"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
          />
          {event.sceneId && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              This event will be linked to scene {event.sceneId}
            </p>
          )}
        </div>

        {/* Metadata */}
        {!isEditing && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadata</h3>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div>Created: {new Date(event.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(event.updatedAt).toLocaleDateString()}</div>
              <div>ID: {event.id}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
