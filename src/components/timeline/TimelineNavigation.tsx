// src/components/timeline/TimelineNavigation.tsx - Timeline Navigation
import { ArrowLeft, ArrowRight, Compass, Clock, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { enhancedTimelineService } from '@/services/enhancedTimelineService';

interface TimelineNavigationProps {
  projectId: string;
  currentSceneId?: string;
  onNavigateToScene?: (_sceneId: string, _chapterId: string) => void;
  className?: string;
}

interface NavigationInfo {
  previous?: { sceneId: string; chapterId: string; eventTitle: string; timePosition: number };
  next?: { sceneId: string; chapterId: string; eventTitle: string; timePosition: number };
  siblings: Array<{ sceneId: string; chapterId: string; eventTitle: string; timePosition: number }>;
}

const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
  projectId,
  _currentSceneId,
  _onNavigateToScene,
  _className = '',
}) => {
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projectId && currentSceneId) {
      loadNavigationInfo();
    }
  }, [projectId, currentSceneId]);

  const loadNavigationInfo = async () => {
    if (!currentSceneId) return;

    setIsLoading(true);
    try {
      const navInfo = await enhancedTimelineService.getTimelineNavigation(
        projectId,
        currentSceneId,
      );
      setNavigationInfo(navInfo);
    } catch (error) {
      console.error('Failed to load timeline navigation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimePosition = (_position: number) => {
    // You might want to format this based on your timeline's time format
    // For now, just return the number
    return position.toString();
  };

  if (!currentSceneId || isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading navigation...</span>
          </>
        ) : (
          <div className="text-sm text-gray-500">
            <Compass size={16} className="inline mr-1" />
            No scene selected
          </div>
        )}
      </div>
    );
  }

  if (!navigationInfo) {
    return (
      <div className={`p-4 text-center text-sm text-gray-500 ${className}`}>
        This scene is not linked to the timeline
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Previous/Next Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (navigationInfo.previous) {
              onNavigateToScene?.(
                navigationInfo.previous.sceneId,
                navigationInfo.previous.chapterId,
              );
            }
          }}
          disabled={!navigationInfo.previous}
          className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
            navigationInfo.previous
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ArrowLeft size={16} />
          <div className="text-left">
            <div className="font-medium">Previous</div>
            {navigationInfo.previous && (
              <div className="text-xs opacity-75">
                <Clock size={12} className="inline mr-1" />T
                {formatTimePosition(navigationInfo.previous.timePosition)}
              </div>
            )}
          </div>
        </button>

        <div className="text-center flex-1 mx-4">
          <div className="text-xs text-gray-500 mb-1">Timeline Order</div>
          <div className="flex items-center justify-center space-x-1 text-sm">
            <Compass size={16} className="text-blue-600" />
            <span className="font-medium">Current Scene</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (navigationInfo.next) {
              onNavigateToScene?.(navigationInfo.next.sceneId, navigationInfo.next.chapterId);
            }
          }}
          disabled={!navigationInfo.next}
          className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
            navigationInfo.next
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="text-right">
            <div className="font-medium">Next</div>
            {navigationInfo.next && (
              <div className="text-xs opacity-75">
                <Clock size={12} className="inline mr-1" />T
                {formatTimePosition(navigationInfo.next.timePosition)}
              </div>
            )}
          </div>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Previous Event */}
        <div
          className={`p-3 rounded ${navigationInfo.previous ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
        >
          <div className="text-center">
            <div className="font-medium mb-1">Previous Event</div>
            {navigationInfo.previous ? (
              <>
                <div className="text-gray-600 mb-1">{navigationInfo.previous.eventTitle}</div>
                <div className="text-gray-500">
                  <Clock size={12} className="inline mr-1" />T
                  {formatTimePosition(navigationInfo.previous.timePosition)}
                </div>
              </>
            ) : (
              <div className="text-gray-400">No previous scene</div>
            )}
          </div>
        </div>

        {/* Current Position */}
        <div className="p-3 rounded bg-green-50 border border-green-200">
          <div className="text-center">
            <div className="font-medium mb-1">Current</div>
            <div className="text-green-600 font-medium">
              <Eye size={12} className="inline mr-1" />
              Active Scene
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {navigationInfo.siblings.length > 0 && (
                <>+ {navigationInfo.siblings.length} concurrent</>
              )}
            </div>
          </div>
        </div>

        {/* Next Event */}
        <div
          className={`p-3 rounded ${navigationInfo.next ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}
        >
          <div className="text-center">
            <div className="font-medium mb-1">Next Event</div>
            {navigationInfo.next ? (
              <>
                <div className="text-gray-600 mb-1">{navigationInfo.next.eventTitle}</div>
                <div className="text-gray-500">
                  <Clock size={12} className="inline mr-1" />T
                  {formatTimePosition(navigationInfo.next.timePosition)}
                </div>
              </>
            ) : (
              <div className="text-gray-400">No next scene</div>
            )}
          </div>
        </div>
      </div>

      {/* Concurrent Scenes (Siblings) */}
      {navigationInfo.siblings.length > 0 && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">Concurrent Scenes</div>
          <div className="text-xs text-gray-600 mb-2">
            These scenes are linked to timeline events happening around the same time:
          </div>
          <div className="space-y-2">
            {navigationInfo.siblings.map((sibling, _index) => (
              <button
                key={`${sibling.sceneId}_${index}`}
                onClick={() => onNavigateToScene?.(sibling.sceneId, sibling.chapterId)}
                className="w-full flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{sibling.eventTitle}</div>
                  <div className="text-xs text-gray-600">
                    Scene ID: {sibling.sceneId.slice(0, 8)}...
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <Clock size={12} className="inline mr-1" />T
                  {formatTimePosition(sibling.timePosition)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={loadNavigationInfo}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
          >
            Refresh Navigation
          </button>
          <button
            onClick={() => {
              // This would navigate to a timeline overview/map view
              // Implementation depends on your timeline view component
              console.log('Navigate to timeline overview');
            }}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
          >
            View Timeline
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineNavigation;
