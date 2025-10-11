// src/components/timeline/SceneLinkageSuggestions.tsx - Scene Linkage Suggestions
import { Link2, CheckCircle, XCircle, Clock, MapPin, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { enhancedTimelineService } from '@/services/enhancedTimelineService';
import { timelineService } from '@/services/timelineService';
import type { EnhancedProject } from '@/types/project';
import type { TimelineItem } from '@/types/timeline';

interface SceneLinkageSuggestionsProps {
  projectId: string;
  project: EnhancedProject;
  onLinkAccepted?: (_sceneId: string, _chapterId: string, _eventIds: string[]) => void;
  onNavigateToScene?: (_sceneId: string, _chapterId: string) => void;
  onNavigateToEvent?: (_eventId: string) => void;
}

interface LinkageSuggestion {
  sceneId: string;
  chapterId: string;
  suggestedEvents: string[];
  confidence: number;
  reasoning: string;
}

const SceneLinkageSuggestions: React.FC<SceneLinkageSuggestionsProps> = ({
  projectId,
  _project,
  _onLinkAccepted,
  _onNavigateToScene,
  _onNavigateToEvent,
}) => {
  const [suggestions, setSuggestions] = useState<LinkageSuggestion[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [processingLinks, setProcessingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId && project) {
      loadSuggestions();
      loadTimelineItems();
    }
  }, [projectId, project]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const detectedSuggestions = await enhancedTimelineService.detectSceneLinkages(
        projectId,
        project,
      );
      setSuggestions(detectedSuggestions);
    } catch (error) {
      console.error('Failed to detect scene linkages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimelineItems = async () => {
    try {
      const items = await timelineService.getProjectTimeline(projectId);
      setTimelineItems(items);
    } catch (error) {
      console.error('Failed to load timeline items:', error);
    }
  };

  const handleAcceptLinkage = async (_suggestion: LinkageSuggestion) => {
    const linkageKey = `${suggestion.sceneId}_${suggestion.suggestedEvents.join('_')}`;
    setProcessingLinks((prev) => new Set([...prev, linkageKey]));

    try {
      const result = await enhancedTimelineService.linkSceneToTimeline(
        projectId,
        suggestion.sceneId,
        suggestion.chapterId,
        suggestion.suggestedEvents,
        'auto_detected',
      );

      if (result.success) {
        onLinkAccepted?.(suggestion.sceneId, suggestion.chapterId, suggestion.suggestedEvents);
        // Remove suggestion from list
        setSuggestions((prev) => prev.filter((s) => s.sceneId !== suggestion.sceneId));
      } else if (result.conflicts) {
        console.error('Linkage conflicts:', result.conflicts);
        // Could show conflicts in UI
      }
    } catch (error) {
      console.error('Failed to accept linkage:', error);
    } finally {
      setProcessingLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(linkageKey);
        return newSet;
      });
    }
  };

  const handleDismissSuggestion = (_suggestion: LinkageSuggestion) => {
    const suggestionId = `${suggestion.sceneId}_${suggestion.suggestedEvents.join('_')}`;
    setDismissedSuggestions((prev) => new Set([...prev, suggestionId]));
  };

  const getScene = (_sceneId: string, _chapterId: string) => {
    const chapter = project.chapters.find((c) => c.id === chapterId);
    return chapter?.scenes?.find((s: any) => s.id === sceneId);
  };

  const getChapter = (_chapterId: string) => {
    return project.chapters.find((c) => c.id === chapterId);
  };

  const getTimelineEvent = (_eventId: string) => {
    return timelineItems.find((item) => item.id === eventId);
  };

  const getConfidenceColor = (_confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getConfidenceLabel = (_confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    if (confidence >= 0.4) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  const visibleSuggestions = suggestions.filter((suggestion) => {
    const suggestionId = `${suggestion.sceneId}_${suggestion.suggestedEvents.join('_')}`;
    return !dismissedSuggestions.has(suggestionId);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Detecting scene linkages...</span>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Link2 className="mx-auto mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">No Linkage Suggestions</h3>
        <p className="text-sm">
          No potential scene-to-timeline connections were detected. You can manually link scenes to
          timeline events in the timeline panel.
        </p>
        <button
          onClick={loadSuggestions}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Re-scan for Suggestions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scene Linkage Suggestions</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{visibleSuggestions.length} suggestions</span>
          <button
            onClick={loadSuggestions}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visibleSuggestions.map((suggestion) => {
          const scene = getScene(suggestion.sceneId, suggestion.chapterId);
          const chapter = getChapter(suggestion.chapterId);
          const linkageKey = `${suggestion.sceneId}_${suggestion.suggestedEvents.join('_')}`;
          const isProcessing = processingLinks.has(linkageKey);

          if (!scene || !chapter) return null;

          return (
            <div
              key={linkageKey}
              className={`border rounded-lg p-4 transition-all ${getConfidenceColor(suggestion.confidence)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Scene Information */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{scene.title || 'Untitled Scene'}</h4>
                      <span className="text-xs text-gray-500">in {chapter.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-50">
                        {getConfidenceLabel(suggestion.confidence)} (
                        {Math.round(suggestion.confidence * 100)}%)
                      </span>
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={() =>
                          onNavigateToScene?.(suggestion.sceneId, suggestion.chapterId)
                        }
                      >
                        View Scene
                      </button>
                    </div>
                  </div>

                  {/* Suggested Events */}
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Suggested Timeline Events:</p>
                    <div className="space-y-2">
                      {suggestion.suggestedEvents.map((eventId) => {
                        const event = getTimelineEvent(eventId);
                        if (!event) return null;

                        return (
                          <div
                            key={eventId}
                            className="flex items-center justify-between p-2 bg-white bg-opacity-50 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Clock size={12} />
                                <span>{event.start}</span>
                                {event.end && <span>-{event.end}</span>}
                              </div>
                              <span className="font-medium text-sm">{event.title}</span>
                              {event.location && (
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <MapPin size={12} />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.characterIds.length > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <Users size={12} />
                                  <span>{event.characterIds.length}</span>
                                </div>
                              )}
                            </div>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => onNavigateToEvent?.(eventId)}
                            >
                              View Event
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-4">
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptLinkage(suggestion)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                          Linking...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} className="inline mr-1" />
                          Accept Link
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDismissSuggestion(suggestion)}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dismissedSuggestions.size > 0 && (
        <div className="pt-4 border-t">
          <button
            onClick={() => setDismissedSuggestions(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Show {dismissedSuggestions.size} dismissed suggestion
            {dismissedSuggestions.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default SceneLinkageSuggestions;
