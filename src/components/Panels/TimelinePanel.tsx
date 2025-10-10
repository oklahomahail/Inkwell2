// src/components/Panels/TimelinePanel.tsx - Enhanced with validation and linkage features
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  Eye,
  ExternalLink,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  Link2,
  Compass,
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';

import SceneLinkageSuggestions from '@/components/timeline/SceneLinkageSuggestions';
import TimelineNavigation from '@/components/timeline/TimelineNavigation';
import TimelineValidationPanel from '@/components/timeline/TimelineValidationPanel';
import { useAppContext } from '@/context/AppContext';
import { useNavigation } from '@/context/NavContext';
import { useToast } from '@/context/toast';
import { timelineService } from '@/services/timelineService';
import type { EnhancedProject } from '@/types/project';
import type { TimelineItem } from '@/types/timeline';
import { logActivity } from '@/utils/activityLogger';

type TimelineTab = 'events' | 'validation' | 'linkages' | 'navigation';

interface TimelineState {
  events: TimelineItem[];
  filteredEvents: TimelineItem[];
  selectedEvent: TimelineItem | null;
  loading: boolean;
  activeTab: TimelineTab;
  filters: {
    eventType: string;
    importance: string;
    pov: string;
    tags: string[];
  };
}

const TimelinePanel: React.FC = () => {
  const { currentProject } = useAppContext();
  const { navigateToScene, navigateToChapter } = useNavigation();
  const { showToast } = useToast();

  const [state, setState] = useState<TimelineState>({
    events: [],
    filteredEvents: [],
    selectedEvent: null,
    loading: false,
    activeTab: 'events',
    filters: {
      eventType: 'all',
      importance: 'all',
      pov: 'all',
      tags: [],
    },
  });
  const [selectedSceneId, setSelectedSceneId] = useState<string | undefined>();

  const [_showFilters, _setShowFilters] = useState(false);

  // Load timeline events for current project
  useEffect(() => {
    const loadTimeline = async () => {
      if (!currentProject) {
        setState((prev) => ({ ...prev, events: [], filteredEvents: [] }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));
      try {
        const events = await timelineService.getProjectTimeline(currentProject.id);
        setState((prev) => ({
          ...prev,
          events,
          filteredEvents: events,
          loading: false,
        }));

        logActivity(`Timeline loaded: ${events.length} events`, 'timeline');
      } catch (error) {
        console.error('Failed to load timeline:', error);
        showToast('Failed to load timeline events', 'error');
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadTimeline();
  }, [currentProject]);

  // Filter events based on current filter state
  const filteredEvents = useMemo(() => {
    const { filters, events } = state;
    return events.filter((event) => {
      if (filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
      if (filters.importance !== 'all' && event.importance !== filters.importance) return false;
      if (filters.pov !== 'all' && event.pov !== filters.pov) return false;
      if (filters.tags.length > 0 && !filters.tags.some((tag) => event.tags.includes(tag)))
        return false;
      return true;
    });
  }, [state.events, state.filters]);

  // Update filtered events when filters or events change
  useEffect(() => {
    setState((prev) => ({ ...prev, filteredEvents }));
  }, [filteredEvents]);

  // Navigate to scene from timeline event
  const handleGoToScene = useCallback(
    async (event: TimelineItem) => {
      if (!currentProject || !event.sceneId || !event.chapterId) {
        if (!event.sceneId) {
          showToast('This event is not linked to a specific scene', 'info');
          return;
        }
        showToast('Unable to navigate: missing project or scene information', 'error');
        return;
      }

      try {
        navigateToScene(currentProject.id, event.chapterId, event.sceneId);
        logActivity(`Navigated to scene: ${event.title}`, 'timeline');
        showToast(`Navigating to: ${event.title}`, 'success');
      } catch (error) {
        console.error('Failed to navigate to scene:', error);
        showToast('Failed to navigate to scene', 'error');
      }
    },
    [currentProject, navigateToScene],
  );

  // Navigate to chapter from timeline event
  const handleGoToChapter = useCallback(
    async (event: TimelineItem) => {
      if (!currentProject || !event.chapterId) {
        showToast('Unable to navigate: missing project or chapter information', 'error');
        return;
      }

      try {
        navigateToChapter(currentProject.id, event.chapterId);
        logActivity(`Navigated to chapter: ${event.title}`, 'timeline');
        showToast(`Navigating to chapter containing: ${event.title}`, 'success');
      } catch (error) {
        console.error('Failed to navigate to chapter:', error);
        showToast('Failed to navigate to chapter', 'error');
      }
    },
    [currentProject, navigateToChapter],
  );

  // Refresh timeline from project data
  const handleRefreshTimeline = useCallback(async () => {
    if (!currentProject) return;

    setState((prev) => ({ ...prev, loading: true }));
    try {
      // Sync timeline with current project chapters/scenes
      await timelineService.syncWithProjectChapters(currentProject.id, currentProject as any);

      // Reload timeline events
      const events = await timelineService.getProjectTimeline(currentProject.id);
      setState((prev) => ({
        ...prev,
        events,
        filteredEvents: events,
        loading: false,
      }));

      showToast('Timeline refreshed from project structure', 'success');
      logActivity('Timeline synchronized with project', 'timeline');
    } catch (error) {
      console.error('Failed to refresh timeline:', error);
      showToast('Failed to refresh timeline', 'error');
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [currentProject]);

  // Tab switching handler
  const handleTabChange = useCallback((tab: TimelineTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // Enhanced navigation handlers
  const handleNavigateToEvent = useCallback(
    (eventId: string) => {
      const event = state.events.find((e) => e.id === eventId);
      if (event) {
        setState((prev) => ({ ...prev, selectedEvent: event, activeTab: 'events' }));
      }
    },
    [state.events],
  );

  const handleNavigateToScene = useCallback(
    (sceneId: string, chapterId: string) => {
      if (currentProject) {
        navigateToScene(currentProject.id, chapterId, sceneId);
        setSelectedSceneId(sceneId);
        logActivity(`Navigated to scene: ${sceneId}`, 'timeline');
      }
    },
    [currentProject, navigateToScene],
  );

  const handleAutoFix = useCallback(
    async (_conflictId: string) => {
      showToast('Auto-fix functionality will be implemented soon', 'info');
      // Implementation would go here
    },
    [showToast],
  );

  const handleLinkAccepted = useCallback(
    (sceneId: string, chapterId: string, eventIds: string[]) => {
      showToast(`Successfully linked scene to ${eventIds.length} timeline event(s)`, 'success');
      // Reload timeline to reflect changes
      if (currentProject) {
        timelineService
          .getProjectTimeline(currentProject.id)
          .then((events) => {
            setState((prev) => ({ ...prev, events, filteredEvents: events }));
          })
          .catch((error) => {
            console.error('Failed to reload timeline after linking:', error);
          });
      }
    },
    [currentProject, showToast],
  );

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
          No Project Selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Select a project to view and manage its timeline events
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'events' as const, label: 'Events', icon: Calendar, count: state.filteredEvents.length },
    { id: 'validation' as const, label: 'Validation', icon: AlertTriangle },
    { id: 'linkages' as const, label: 'Linkages', icon: Link2 },
    { id: 'navigation' as const, label: 'Navigation', icon: Compass },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Timeline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentProject.name} • Enhanced timeline management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshTimeline}
            disabled={state.loading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh timeline from project"
          >
            <RefreshCw className={`w-5 h-5 ${state.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = state.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {state.activeTab === 'events' && (
          <div className="h-full">
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Loading timeline events...
                </span>
              </div>
            ) : state.filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                  {state.events.length === 0 ? 'No Timeline Events' : 'No Matching Events'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {state.events.length === 0
                    ? 'Timeline events will appear here when you sync your project'
                    : 'Try adjusting your filters to see more events'}
                </p>
                {state.events.length === 0 && (
                  <button
                    onClick={handleRefreshTimeline}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sync Timeline with Project
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {state.filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      state.selectedEvent?.id === event.id
                        ? 'ring-2 ring-blue-500 ring-opacity-20'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.importance === 'major'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}
                            >
                              {event.importance}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.eventType === 'plot'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : event.eventType === 'character'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}
                            >
                              {event.eventType}
                            </span>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                          {event.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {event.tags.slice(0, 2).join(', ')}
                              {event.tags.length > 2 && '...'}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Position {event.start}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {event.sceneId ? (
                          <button
                            onClick={() => handleGoToScene(event)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Go to linked scene"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : event.chapterId ? (
                          <button
                            onClick={() => handleGoToChapter(event)}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                            title="Go to chapter"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-gray-400" title="No linked content">
                            <Eye className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'validation' && (
          <div className="p-6">
            <TimelineValidationPanel
              projectId={currentProject.id}
              project={currentProject as unknown as EnhancedProject}
              onNavigateToEvent={handleNavigateToEvent}
              onNavigateToScene={handleNavigateToScene}
              onAutoFix={handleAutoFix}
            />
          </div>
        )}

        {state.activeTab === 'linkages' && (
          <div className="p-6">
            <SceneLinkageSuggestions
              projectId={currentProject.id}
              project={currentProject as unknown as EnhancedProject}
              onLinkAccepted={handleLinkAccepted}
              onNavigateToScene={handleNavigateToScene}
              onNavigateToEvent={handleNavigateToEvent}
            />
          </div>
        )}

        {state.activeTab === 'navigation' && (
          <div className="p-6">
            <TimelineNavigation
              projectId={currentProject.id}
              currentSceneId={selectedSceneId}
              onNavigateToScene={handleNavigateToScene}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePanel;
