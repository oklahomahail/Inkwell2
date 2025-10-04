// src/components/Export/ExportQualityDashboard.tsx
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  FileText,
  BookOpen,
  Target,
  TrendingUp,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import epubValidationService from '@/services/epubValidationService';
import type {
  EPUBValidationReport,
  DOCXValidationReport,
  EPUBValidationIssue,
} from '@/services/epubValidationService';
import professionalExportService from '@/services/professionalExportService';
import type { Chapter } from '@/types/writing';
import { ChapterStatus } from '@/types/writing';

interface ExportQualityDashboardProps {
  className?: string;
}

const ExportQualityDashboard: React.FC<ExportQualityDashboardProps> = ({ className = '' }) => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'manuscript' | 'epub'>('manuscript');
  const [manuscriptReport, setManuscriptReport] = useState<DOCXValidationReport | null>(null);
  const [epubReport, setEpubReport] = useState<EPUBValidationReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (currentProject) {
      runQualityAnalysis();
    }
  }, [currentProject]);

  const runQualityAnalysis = async () => {
    if (!currentProject) return;

    setIsAnalyzing(true);
    try {
      // Convert project to EnhancedProject format for validation services
      const enhancedProject: import('@/types/project').EnhancedProject = {
        id: currentProject.id,
        name: currentProject.name,
        description: currentProject.description,
        currentWordCount: 0, // Will be calculated from chapters
        characters: [],
        plotNotes: [],
        worldBuilding: [],
        chapters: (currentProject.chapters || []).map((ch: any) => ({
          id: ch.id || `chapter-${Date.now()}`,
          title: ch.title || 'Untitled Chapter',
          summary: ch.summary || '',
          content: ch.content || '',
          wordCount: ch.wordCount || 0,
          targetWordCount: ch.targetWordCount,
          status: 'draft' as const,
          order: ch.order || 0,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: ch.notes || '',
          scenes: ch.scenes || [],
          createdAt: ch.createdAt || Date.now(),
          updatedAt: ch.updatedAt || Date.now(),
        })),
        recentContent: '',
        createdAt: currentProject.createdAt || Date.now(),
        updatedAt: currentProject.updatedAt || Date.now(),
        sessions: [],
        claudeContext: {
          includeCharacters: true,
          includePlotNotes: true,
          includeWorldBuilding: true,
          maxCharacters: 10,
          maxPlotNotes: 10,
          contextLength: 'medium' as const,
        },
      };

      // Calculate total word count
      enhancedProject.currentWordCount = enhancedProject.chapters.reduce(
        (total, ch) => total + (ch.wordCount || 0),
        0,
      );

      // Convert project chapters to the expected format for Chapter[] parameter
      const chapters: Chapter[] = enhancedProject.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        order: ch.order,
        scenes: ch.scenes || [],
        totalWordCount: ch.wordCount || 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(ch.createdAt),
        updatedAt: new Date(ch.updatedAt),
      }));

      // Run both validations
      const [manuscriptResult, epubResult] = await Promise.all([
        epubValidationService.validateManuscriptProject(enhancedProject, chapters),
        epubValidationService.validateEPUBProject(enhancedProject, chapters),
      ]);

      setManuscriptReport(manuscriptResult);
      setEpubReport(epubResult);
    } catch (error) {
      console.error('Quality analysis failed:', error);
      showToast('Quality analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const _getReadinessColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'needs-work':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'not-ready':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const _getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'major':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'minor':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleExport = async (
    format: 'docx' | 'epub',
    template: string = 'standard-manuscript',
  ) => {
    if (!currentProject) return;

    try {
      // Convert project to EnhancedProject format for export services
      const enhancedProject: import('@/types/project').EnhancedProject = {
        id: currentProject.id,
        name: currentProject.name,
        description: currentProject.description,
        currentWordCount: 0,
        characters: [],
        plotNotes: [],
        worldBuilding: [],
        chapters: (currentProject.chapters || []).map((ch: any) => ({
          id: ch.id || `chapter-${Date.now()}`,
          title: ch.title || 'Untitled Chapter',
          summary: ch.summary || '',
          content: ch.content || '',
          wordCount: ch.wordCount || 0,
          targetWordCount: ch.targetWordCount,
          status: 'draft' as const,
          order: ch.order || 0,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: ch.notes || '',
          scenes: ch.scenes || [],
          createdAt: ch.createdAt || Date.now(),
          updatedAt: ch.updatedAt || Date.now(),
        })),
        recentContent: '',
        createdAt: currentProject.createdAt || Date.now(),
        updatedAt: currentProject.updatedAt || Date.now(),
        sessions: [],
        claudeContext: {
          includeCharacters: true,
          includePlotNotes: true,
          includeWorldBuilding: true,
          maxCharacters: 10,
          maxPlotNotes: 10,
          contextLength: 'medium' as const,
        },
      };

      enhancedProject.currentWordCount = enhancedProject.chapters.reduce(
        (total, ch) => total + (ch.wordCount || 0),
        0,
      );

      const chapters: Chapter[] = enhancedProject.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        order: ch.order,
        scenes: ch.scenes || [],
        totalWordCount: ch.wordCount || 0,
        status: ChapterStatus.DRAFT,
        createdAt: new Date(ch.createdAt),
        updatedAt: new Date(ch.updatedAt),
      }));

      if (format === 'docx') {
        const result = await professionalExportService.exportDOCX(
          enhancedProject,
          chapters,
          template,
        );
        if (result.success) {
          showToast(`Exported as ${result.filename}`, 'success');
        } else {
          showToast(`Export failed: ${result.error}`, 'error');
        }
      } else {
        const result = await professionalExportService.exportEPUB(enhancedProject, chapters);
        if (result.success) {
          showToast(`Exported as ${result.filename}`, 'success');
        } else {
          showToast(`Export failed: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed', 'error');
    }
  };

  if (!currentProject) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
        <p className="text-sm">Select a project to view export quality analysis</p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Quality</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Validate your project before exporting for publication
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
              title="Advanced options"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={runQualityAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('manuscript')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manuscript'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Manuscript (DOCX)
          </button>

          <button
            onClick={() => setActiveTab('epub')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'epub'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            EPUB
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isAnalyzing ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Analyzing Project Quality
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Checking formatting, content, and export readiness...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'manuscript' && manuscriptReport && (
              <ManuscriptQualityPanel
                report={manuscriptReport}
                onExport={handleExport}
                showAdvanced={showAdvanced}
                currentProject={currentProject}
              />
            )}

            {activeTab === 'epub' && epubReport && (
              <EPUBQualityPanel
                report={epubReport}
                onExport={handleExport}
                showAdvanced={showAdvanced}
                currentProject={currentProject}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Manuscript Quality Panel Component
const ManuscriptQualityPanel: React.FC<{
  report: DOCXValidationReport;
  onExport: (format: 'docx' | 'epub', template?: string) => void;
  showAdvanced: boolean;
  currentProject: any;
}> = ({ report, onExport, showAdvanced, currentProject }) => {
  const checklist = epubValidationService.getManuscriptChecklist(currentProject);
  const completedItems = checklist.filter((item) => item.completed).length;
  const progressPercentage = (completedItems / checklist.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manuscript Readiness
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getReadinessColor(report.readinessLevel)}`}
          >
            {report.readinessLevel.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{report.manuscriptCompliance}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Compliance Score</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {report.formatting.pageEstimate}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Pages</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{report.issues.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Issues Found</div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onExport('docx', 'standard-manuscript')}
            disabled={report.readinessLevel === 'not-ready'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Standard Manuscript
          </button>

          {showAdvanced && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('docx', 'paperback-novel')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
              >
                Paperback Format
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Export Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pre-Export Checklist
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completedItems}/{checklist.length} completed ({Math.round(progressPercentage)}%)
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="space-y-3">
          {checklist.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle
                    className={`w-5 h-5 ${item.required ? 'text-red-500' : 'text-yellow-500'}`}
                  />
                )}
              </div>

              <div className="flex-1">
                <div
                  className={`font-medium ${item.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                >
                  {item.item}
                  {item.required && !item.completed && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      REQUIRED
                    </span>
                  )}
                </div>
                {item.suggestion && !item.completed && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {report.issues.length > 0 && <IssuesPanel issues={report.issues} />}
    </div>
  );
};

// EPUB Quality Panel Component
const EPUBQualityPanel: React.FC<{
  report: EPUBValidationReport;
  onExport: (format: 'docx' | 'epub', template?: string) => void;
  showAdvanced: boolean;
  currentProject: any;
}> = ({ report, onExport }) => {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EPUB Readiness</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getReadinessColor(report.readinessLevel)}`}
          >
            {report.readinessLevel.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{report.qualityScore}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{report.metadata.chaptersCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Chapters</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{report.issues.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Issues Found</div>
          </div>
        </div>

        <button
          onClick={() => onExport('epub')}
          disabled={report.readinessLevel === 'not-ready'}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          Export EPUB
        </button>
      </div>

      {/* Metadata Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Content Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${report.metadata.hasTitle ? 'text-green-500' : 'text-red-500'}`}
            />
            <span>Title</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle
              className={`w-4 h-4 ${report.metadata.hasTableOfContents ? 'text-green-500' : 'text-red-500'}`}
            />
            <span>Table of Contents</span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>{report.metadata.totalWordCount.toLocaleString()} words</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span>{report.metadata.chaptersCount} chapters</span>
          </div>
        </div>
      </div>

      {/* Issues */}
      {report.issues.length > 0 && <IssuesPanel issues={report.issues} />}
    </div>
  );
};

// Shared Issues Panel
const IssuesPanel: React.FC<{ issues: EPUBValidationIssue[] }> = ({ issues }) => {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const groupedIssues = issues.reduce(
    (groups, issue) => {
      const key = issue.severity;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
      return groups;
    },
    {} as Record<string, EPUBValidationIssue[]>,
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Issues Found ({issues.length})
      </h3>

      <div className="space-y-4">
        {(['critical', 'major', 'minor'] as const).map((severity) => {
          const severityIssues = groupedIssues[severity] || [];
          if (severityIssues.length === 0) return null;

          return (
            <div key={severity}>
              <div className="flex items-center gap-2 mb-2">
                {getSeverityIcon(severity)}
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {severity} ({severityIssues.length})
                </span>
              </div>

              <div className="space-y-2 ml-6">
                {severityIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() =>
                      setExpandedIssue(expandedIssue === issue.code ? null : issue.code)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {issue.message}
                        </div>
                        {issue.location && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {issue.location}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{issue.code}</div>
                    </div>

                    {expandedIssue === issue.code && issue.suggestion && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                        <strong>Suggestion:</strong> {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function (moved outside component)
const getReadinessColor = (level: string) => {
  switch (level) {
    case 'excellent':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'good':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    case 'needs-work':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'not-ready':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
};

// Helper function (moved outside component)
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'major':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'minor':
      return <Info className="w-4 h-4 text-yellow-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

export default ExportQualityDashboard;
