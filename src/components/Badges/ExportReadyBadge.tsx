// ExportReadyBadge.tsx - Badge that appears when manuscript is ready for export

import { CheckCircle, AlertCircle, FileText, Clock, Users, BookOpen } from 'lucide-react';
import React, { useMemo } from 'react';

import { ExportReadinessCheck } from '@/exports/exportTypes';
import { cn } from '@/utils/cn';

interface ExportReadyBadgeProps {
  projectId: string;
  className?: string;
  variant?: 'badge' | 'card' | 'banner';
  showDetails?: boolean;
  onExportClick?: () => void;
}

// Mock function to check export readiness - would integrate with actual project data
function checkExportReadiness(projectId: string): ExportReadinessCheck {
  // This would integrate with your actual project state management
  // For now, returning mock data
  const mockProject = {
    title: 'Sample Project',
    wordCount: 25000,
    chapterCount: 12,
    hasContent: true,
    chaptersWithTitles: 10,
    totalChapters: 12
  };

  const criteria = {
    hasTitle: !!mockProject.title,
    hasContent: mockProject.hasContent && mockProject.wordCount > 0,
    hasChapters: mockProject.chapterCount > 0,
    minWordCount: mockProject.wordCount >= 1000, // Minimum for export
    chaptersHaveTitles: mockProject.chaptersWithTitles >= mockProject.totalChapters * 0.8, // 80% of chapters
    noBlockingIssues: true // Would check for validation errors
  };

  const criteriaCount = Object.values(criteria).filter(Boolean).length;
  const totalCriteria = Object.keys(criteria).length;
  const score = Math.round((criteriaCount / totalCriteria) * 100);
  const isReady = score >= 80; // 80% threshold for "ready"

  const recommendations: string[] = [];
  
  if (!criteria.hasTitle) {
    recommendations.push('Add a title to your project');
  }
  if (!criteria.minWordCount) {
    recommendations.push('Write at least 1,000 words');
  }
  if (!criteria.chaptersHaveTitles) {
    recommendations.push('Add titles to your chapters');
  }
  if (!criteria.hasChapters) {
    recommendations.push('Create at least one chapter');
  }

  return {
    isReady,
    score,
    criteria,
    recommendations
  };
}

const ExportReadyBadge: React.FC<ExportReadyBadgeProps> = ({
  projectId,
  className = '',
  variant = 'badge',
  showDetails = false,
  onExportClick
}) => {
  const readiness = useMemo(() => checkExportReadiness(projectId), [projectId]);

  if (variant === 'badge') {
    // Simple badge variant
    if (!readiness.isReady) return null;

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5',
          'bg-green-100 text-green-800 text-sm font-medium',
          'border border-green-200 rounded-full',
          'cursor-pointer hover:bg-green-200 transition-colors',
          className
        )}
        onClick={onExportClick}
      >
        <CheckCircle className="w-4 h-4" />
        <span>Export Ready</span>
      </div>
    );
  }

  if (variant === 'banner') {
    // Banner variant for prominent display
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4',
          'rounded-lg border',
          readiness.isReady
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {readiness.isReady ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600" />
          )}
          <div>
            <h3
              className={cn(
                'font-semibold',
                readiness.isReady ? 'text-green-900' : 'text-amber-900'
              )}
            >
              {readiness.isReady
                ? 'Your manuscript is ready for export!'
                : 'Almost ready for export'}
            </h3>
            <p
              className={cn(
                'text-sm',
                readiness.isReady ? 'text-green-700' : 'text-amber-700'
              )}
            >
              Export readiness: {readiness.score}%
              {!readiness.isReady &&
                ` • ${readiness.recommendations.length} items to complete`}
            </p>
          </div>
        </div>

        {readiness.isReady && onExportClick && (
          <button
            onClick={onExportClick}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Export Now
          </button>
        )}
      </div>
    );
  }

  // Card variant with full details
  return (
    <div
      className={cn(
        'bg-white rounded-lg border shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {readiness.isReady ? (
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">Export Readiness</h3>
            <p className="text-sm text-gray-600">
              {readiness.isReady
                ? 'Your manuscript meets all export requirements'
                : `${readiness.score}% complete`}
            </p>
          </div>
        </div>

        {/* Score indicator */}
        <div className="text-right">
          <div
            className={cn(
              'text-2xl font-bold',
              readiness.isReady ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {readiness.score}%
          </div>
          <div className="text-xs text-gray-500">Ready Score</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              readiness.score >= 80 ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${readiness.score}%` }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      {showDetails && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            <CriteriaItem
              icon={<FileText className="w-4 h-4" />}
              label="Has project title"
              completed={readiness.criteria.hasTitle}
            />
            <CriteriaItem
              icon={<BookOpen className="w-4 h-4" />}
              label="Has chapters with content"
              completed={readiness.criteria.hasChapters && readiness.criteria.hasContent}
            />
            <CriteriaItem
              icon={<Users className="w-4 h-4" />}
              label="Minimum word count (1,000+)"
              completed={readiness.criteria.minWordCount}
            />
            <CriteriaItem
              icon={<Clock className="w-4 h-4" />}
              label="Chapter titles added"
              completed={readiness.criteria.chaptersHaveTitles}
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {readiness.recommendations.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            To improve export readiness:
          </h4>
          <ul className="space-y-1">
            {readiness.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export button */}
      {readiness.isReady && onExportClick && (
        <div className="px-4 pb-4">
          <button
            onClick={onExportClick}
            className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Export Manuscript
          </button>
        </div>
      )}
    </div>
  );
};

// Helper component for criteria items
const CriteriaItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  completed: boolean;
}> = ({ icon, label, completed }) => (
  <div className="flex items-center gap-3">
    <div
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center',
        completed ? 'bg-green-100' : 'bg-gray-100'
      )}
    >
      {completed ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
      )}
    </div>
    <div className="flex-1 flex items-center gap-2">
      <div className={cn('text-gray-400', completed && 'text-green-600')}>
        {icon}
      </div>
      <span
        className={cn(
          'text-sm',
          completed ? 'text-gray-900' : 'text-gray-600'
        )}
      >
        {label}
      </span>
    </div>
  </div>
);

export default ExportReadyBadge;