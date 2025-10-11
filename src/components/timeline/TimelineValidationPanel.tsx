// src/components/timeline/TimelineValidationPanel.tsx - Timeline Validation UI
import { AlertTriangle, CheckCircle, Clock, Users, MapPin, Eye, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import {
  enhancedTimelineService,
  type TimelineConflict,
  type TimelineValidationResult,
  type TimelineOptimization,
} from '@/services/enhancedTimelineService';
import type { EnhancedProject } from '@/types/project';

interface TimelineValidationPanelProps {
  projectId: string;
  project?: EnhancedProject;
  onNavigateToEvent?: (_eventId: string) => void;
  onNavigateToScene?: (_sceneId: string, _chapterId: string) => void;
  onAutoFix?: (_conflictId: string) => void;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';
type RuleKey =
  | 'time_overlap'
  | 'character_presence'
  | 'location_mismatch'
  | 'pov_inconsistency'
  | 'chronological_error';

const severityColors: Record<Severity, string> = {
  low: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  medium: 'text-orange-600 bg-orange-50 border-orange-200',
  high: 'text-red-600 bg-red-50 border-red-200',
  critical: 'text-red-800 bg-red-100 border-red-300',
};

const severityIcons: Record<Severity, React.ReactNode> = {
  low: <AlertTriangle size={16} />,
  medium: <AlertTriangle size={16} />,
  high: <AlertTriangle size={16} />,
  critical: <AlertTriangle size={16} />,
};

const conflictTypeIcons: Record<RuleKey, React.ReactNode> = {
  time_overlap: <Clock size={16} />,
  character_presence: <Users size={16} />,
  location_mismatch: <MapPin size={16} />,
  pov_inconsistency: <Eye size={16} />,
  chronological_error: <AlertTriangle size={16} />,
};

const TimelineValidationPanel: React.FC<TimelineValidationPanelProps> = ({
  projectId,
  project,
  onNavigateToEvent,
  onNavigateToScene,
  onAutoFix,
}) => {
  const [validationResult, setValidationResult] = useState<TimelineValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (projectId) {
      validateTimeline();
    }
  }, [projectId, project]);

  const validateTimeline = async () => {
    setIsValidating(true);
    try {
      const result = await enhancedTimelineService.validateTimeline(projectId, project);
      setValidationResult(result);
    } catch (error) {
      console.error('Failed to validate timeline:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoFix = async (conflict: TimelineConflict) => {
    if (onAutoFix) {
      onAutoFix(conflict.id);
      // Re-validate after auto-fix
      await validateTimeline();
    }
  };

  const renderConflictCard = (conflict: TimelineConflict, _isWarning: boolean = false) => {
    const isExpanded = expandedConflict === conflict.id;
    const colorClass = severityColors[conflict.severity];

    return (
      <div
        key={conflict.id}
        className={`border rounded-lg p-4 transition-all ${colorClass} ${
          isExpanded ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
        }`}
      >
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpandedConflict(isExpanded ? null : conflict.id)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">{conflictTypeIcons[conflict.type]}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{conflict.title}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {conflict.severity}
                </span>
                {conflict.autoFixable && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Zap size={12} className="mr-1" />
                    Auto-fixable
                  </span>
                )}
              </div>
              <p className="text-sm mt-1">{conflict.description}</p>
              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">Suggestion:</p>
                    <p className="text-sm text-gray-600">{conflict.suggestion}</p>
                  </div>

                  {conflict.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Evidence:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {conflict.evidence.map((evidence: string, index: number) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {conflict.affectedEvents.map((eventId: string) => (
                      <button
                        key={eventId}
                        className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEvent?.(eventId);
                        }}
                      >
                        Event: {eventId.slice(0, 8)}...
                      </button>
                    ))}
                    {conflict.affectedScenes?.map((sceneId: string) => (
                      <button
                        key={sceneId}
                        className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Would need chapter ID lookup for proper navigation
                          onNavigateToScene?.(sceneId, 'unknown');
                        }}
                      >
                        Scene: {sceneId.slice(0, 8)}...
                      </button>
                    ))}
                  </div>

                  {conflict.autoFixable && (
                    <button
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoFix(conflict);
                      }}
                    >
                      <Zap size={14} className="inline mr-1" />
                      Auto-fix
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{severityIcons[conflict.severity]}</div>
        </div>
      </div>
    );
  };

  const renderOptimizationCard = (optimization: TimelineOptimization) => {
    const impactColors: Record<TimelineOptimization['impact'], string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-green-100 text-green-800',
    };

    const effortColors: Record<TimelineOptimization['effort'], string> = {
      easy: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      complex: 'bg-red-100 text-red-800',
    };

    return (
      <div
        key={`${optimization.type}_${optimization.eventIds.join('_')}`}
        className="border border-blue-200 rounded-lg p-4 bg-blue-50"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-blue-900">{optimization.title}</h4>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${impactColors[optimization.impact]}`}
              >
                {optimization.impact} impact
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${effortColors[optimization.effort]}`}
              >
                {optimization.effort}
              </span>
            </div>
            <p className="text-sm text-blue-800 mt-1">{optimization.description}</p>

            {optimization.eventIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {optimization.eventIds.map((eventId: string) => (
                  <button
                    key={eventId}
                    className="px-2 py-1 text-xs rounded bg-blue-200 text-blue-900 hover:bg-blue-300 transition-colors"
                    onClick={() => onNavigateToEvent?.(eventId)}
                  >
                    Event: {eventId.slice(0, 8)}...
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Validating timeline...</span>
      </div>
    );
  }

  if (!validationResult) {
    return (
      <div className="p-8 text-center text-gray-500">
        <button
          onClick={validateTimeline}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Validate Timeline
        </button>
      </div>
    );
  }

  const criticalCount = validationResult.conflicts.filter(
    (c: TimelineConflict) => c.severity === 'critical',
  ).length;
  const highCount = validationResult.conflicts.filter(
    (c: TimelineConflict) => c.severity === 'high',
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Timeline Validation</h3>
          <button
            onClick={validateTimeline}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Re-validate
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
              {validationResult.overallScore}/100
            </div>
            <p className="text-sm text-gray-600">Overall Score</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center">
              {validationResult.isValid ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <AlertTriangle className="text-red-500" size={24} />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {validationResult.isValid ? 'Valid' : 'Issues Found'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {validationResult.conflicts.length}
            </div>
            <p className="text-sm text-gray-600">Total Issues</p>
          </div>
        </div>

        {(criticalCount > 0 || highCount > 0) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Action Required:</strong> {criticalCount} critical and {highCount}{' '}
              high-severity issues need attention.
            </p>
          </div>
        )}
      </div>

      {/* Conflicts Section */}
      {validationResult.conflicts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-lg font-semibold mb-4">
            Conflicts ({validationResult.conflicts.length})
          </h4>
          <div className="space-y-3">
            {validationResult.conflicts.map((conflict: TimelineConflict) =>
              renderConflictCard(conflict),
            )}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {showWarnings && validationResult.warnings.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Warnings ({validationResult.warnings.length})</h4>
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="space-y-3">
            {validationResult.warnings.map((warning: TimelineConflict) =>
              renderConflictCard(warning, true),
            )}
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {showSuggestions && validationResult.suggestions.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              Optimization Suggestions ({validationResult.suggestions.length})
            </h4>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="space-y-3">
            {validationResult.suggestions.map((suggestion: TimelineOptimization) =>
              renderOptimizationCard(suggestion),
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {validationResult.conflicts.length === 0 && validationResult.warnings.length === 0 && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
          <h4 className="text-lg font-semibold text-green-800">Timeline is Valid!</h4>
          <p className="text-green-700">No conflicts or issues detected in your timeline.</p>
        </div>
      )}
    </div>
  );
};

export default TimelineValidationPanel;
