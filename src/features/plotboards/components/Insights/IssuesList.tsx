import React from 'react';

import { analyticsService } from '../../../../services/analyticsService';

import type { AnalysisIssue } from '../../../../types/plotAnalysis';

interface IssuesListProps {
  issues: AnalysisIssue[];
}

export function _IssuesList({ issues }: IssuesListProps) {
  const getSeverityColor = (_severity: AnalysisIssue['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIssueIcon = (_type: AnalysisIssue['type']) => {
    switch (type) {
      case 'plot_hole':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'pacing_spike':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'continuity_gap':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'character_inconsistency':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 'timeline_conflict':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'tone_shift':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 11V9a1 1 0 011-1h8a1 1 0 011 1v6M7 19H4a1 1 0 01-1-1v-1a1 1 0 011-1h3M17 19h3a1 1 0 001-1v-1a1 1 0 00-1-1h-3"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const handleResolveIssue = (_issue: AnalysisIssue) => {
    // Track that the user has acknowledged/resolved this issue
    analyticsService.trackPlotIssueResolved(issue.id, issue.type);

    // In a real implementation, you might update the store or mark the issue as resolved
    console.log('Issue marked as resolved:', issue.id);
  };

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border p-3">
        <h4 className="mb-3 font-medium text-[#0C5C3D]">Issues & Suggestions</h4>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">
            Great work! No major issues detected in your plot structure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-3">
      <h4 className="mb-3 font-medium text-[#0C5C3D]">Issues & Suggestions</h4>
      <ul className="space-y-4">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className={`rounded-lg border p-4 ${getSeverityColor(issue.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">{getIssueIcon(issue.type)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{issue.title}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full uppercase tracking-wide border ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm opacity-90">{issue.description}</p>

                  {issue.sceneIds.length > 0 && (
                    <p className="mt-2 text-xs opacity-75">
                      Affects {issue.sceneIds.length} scene{issue.sceneIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleResolveIssue(issue)}
                className="flex-shrink-0 ml-4 text-xs px-2 py-1 rounded border border-current opacity-60 hover:opacity-100 transition-opacity"
                title="Mark as resolved"
              >
                ✓ Resolve
              </button>
            </div>

            {issue.suggestions.length > 0 && (
              <div className="mt-3 pl-8">
                <div className="text-xs font-medium mb-2 opacity-75">Suggestions:</div>
                <ul className="text-sm space-y-1 opacity-90">
                  {issue.suggestions.map((suggestion, _idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-xs opacity-50 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
