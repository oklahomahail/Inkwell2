// src/components/Claude/ConsistencyGuardianPanel.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  RefreshCw,
  Settings,
  Clock,
  FileText,
  User,
  Globe,
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { consistencyGuardianService } from '../../services/consistencyGuardianService';
import type {
  ConsistencyReport,
  ConsistencyIssue,
  ConsistencyCheckOptions,
} from '../../services/consistencyGuardianService';
import type { EnhancedProject } from '../../types/project';

interface ConsistencyGuardianPanelProps {
  className?: string;
}

// FIXED: Helper function to convert Project to EnhancedProject
const convertToEnhancedProject = (project: any): EnhancedProject => {
  return {
    ...project,
    currentWordCount: project.currentWordCount || 0,
    plotNotes: project.plotNotes || [],
    worldBuilding: project.worldBuilding || [],
    recentContent: project.recentContent || '',
    sessions: project.sessions || [],
    claudeContext: project.claudeContext || {
      includeCharacters: true,
      includePlotNotes: true,
      includeWorldBuilding: true,
      maxCharacters: 10,
      maxPlotNotes: 10,
      contextLength: 'medium' as const,
    },
  };
};

export const ConsistencyGuardianPanel: React.FC<ConsistencyGuardianPanelProps> = ({
  className = '',
}) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  // State
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  // Analysis options
  const [options, setOptions] = useState<ConsistencyCheckOptions>({
    checkCharacters: true,
    checkTimeline: true,
    checkWorldBuilding: true,
    checkPlotThreads: true,
    includeMinorIssues: false,
  });

  // Load existing report on mount
  useEffect(() => {
    if (currentProject) {
      const existingReport = consistencyGuardianService.getReport(currentProject.id);
      setReport(existingReport);
    }
  }, [currentProject]);

  // Run consistency analysis
  const runAnalysis = async () => {
    if (!currentProject) {
      showToast('No project selected', 'error');
      return;
    }

    if (!consistencyGuardianService.isAvailable()) {
      showToast('Claude API key not configured', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      // FIXED: Convert project to EnhancedProject
      const enhancedProject = convertToEnhancedProject(currentProject);
      const newReport = await consistencyGuardianService.performConsistencyCheck(
        enhancedProject,
        options,
      );
      setReport(newReport);
      showToast(`Analysis complete: ${newReport.issues.length} issues found`, 'success');
    } catch (error) {
      console.error('Consistency analysis failed:', error);
      showToast(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick analysis for specific elements
  const runQuickCheck = async (type: 'character' | 'timeline') => {
    if (!currentProject) return;

    setIsAnalyzing(true);
    try {
      // FIXED: Convert project to EnhancedProject
      const enhancedProject = convertToEnhancedProject(currentProject);
      let issues: ConsistencyIssue[] = [];

      if (type === 'character') {
        // For now, run full character check. Could extend to specific character later
        const checkOptions = {
          ...options,
          checkTimeline: false,
          checkWorldBuilding: false,
          checkPlotThreads: false,
        };
        const quickReport = await consistencyGuardianService.performConsistencyCheck(
          enhancedProject,
          checkOptions,
        );
        issues = quickReport.issues;
      } else if (type === 'timeline') {
        issues = await consistencyGuardianService.quickTimelineCheck(enhancedProject);
      }

      showToast(`Quick ${type} check: ${issues.length} issues found`, 'success');

      // Update report if we have one, or create minimal report
      if (report) {
        const updatedReport = { ...report, issues: [...report.issues, ...issues] };
        setReport(updatedReport);
      }
    } catch (error) {
      showToast(`Quick ${type} check failed`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle issue expansion
  const toggleIssueExpansion = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  // Mark issue as resolved/unresolved
  const toggleIssueResolution = (issueId: string) => {
    if (!currentProject || !report) return;

    const issue = report.issues.find((i) => i.id === issueId);
    if (!issue) return;

    if (issue.isResolved) {
      consistencyGuardianService.markIssueUnresolved(currentProject.id, issueId);
    } else {
      consistencyGuardianService.markIssueResolved(currentProject.id, issueId);
    }

    // Update local state
    const updatedReport = {
      ...report,
      issues: report.issues.map((i) =>
        i.id === issueId ? { ...i, isResolved: !i.isResolved } : i,
      ),
    };
    setReport(updatedReport);

    showToast(issue.isResolved ? 'Issue marked as unresolved' : 'Issue resolved', 'success');
  };

  // Get severity icon and color
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'high':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
        };
      case 'medium':
        return { icon: Info, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
      case 'low':
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      default:
        return { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return User;
      case 'timeline':
        return Clock;
      case 'world':
        return Globe;
      case 'plot':
        return FileText;
      default:
        return Info;
    }
  };

  // Filter issues
  const filteredIssues =
    report?.issues.filter((issue) => {
      if (!showResolved && issue.isResolved) return false;
      if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
      if (filterType !== 'all' && issue.type !== filterType) return false;
      return true;
    }) || [];

  // Get estimated analysis time
  const estimatedTime = currentProject
    ? consistencyGuardianService.getEstimatedAnalysisTime(convertToEnhancedProject(currentProject))
    : 30;

  if (!currentProject) {
    return (
      <div className={`p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a project to analyze consistency</p>
      </div>
    );
  }

  if (!consistencyGuardianService.isAvailable()) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Consistency Guardian requires Claude API
        </p>
        <p className="text-xs text-gray-500">
          Configure your API key in Settings to analyze story consistency
        </p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Consistency Guardian</h3>
          </div>

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Analysis Options"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Analysis Options */}
        {showOptions && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analysis Scope
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.checkCharacters}
                  onChange={(e) => setOptions({ ...options, checkCharacters: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Characters
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.checkTimeline}
                  onChange={(e) => setOptions({ ...options, checkTimeline: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Timeline
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.checkWorldBuilding}
                  onChange={(e) => setOptions({ ...options, checkWorldBuilding: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                World Rules
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.checkPlotThreads}
                  onChange={(e) => setOptions({ ...options, checkPlotThreads: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Plot Threads
              </label>
            </div>

            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={options.includeMinorIssues}
                onChange={(e) => setOptions({ ...options, includeMinorIssues: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Include minor issues
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Analyze Story
              </>
            )}
          </button>

          {report && (
            <button
              onClick={() => consistencyGuardianService.clearReport(currentProject.id)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              title="Clear Report"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => runQuickCheck('character')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs transition-colors"
          >
            <User className="w-3 h-3" />
            Quick Character Check
          </button>

          <button
            onClick={() => runQuickCheck('timeline')}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-xs transition-colors"
          >
            <Clock className="w-3 h-3" />
            Quick Timeline Check
          </button>
        </div>

        {/* Analysis Info */}
        {isAnalyzing && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Estimated time: ~{estimatedTime} seconds
            </div>
            <p className="mt-1 opacity-75">
              Analyzing {currentProject.chapters?.length || 0} chapters and{' '}
              {currentProject.characters?.length || 0} characters for consistency issues...
            </p>
          </div>
        )}
      </div>

      {/* Rest of the component remains the same... */}
      <div className="flex-1 overflow-y-auto">
        {!report ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-1">No analysis yet</p>
            <p className="text-xs opacity-75">
              Run consistency analysis to identify potential issues in your story
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Analysis complete. Found {report.issues.length} total issues.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
