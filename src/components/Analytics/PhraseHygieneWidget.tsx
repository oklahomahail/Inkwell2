type PhraseOffender = {
  phrase: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  frequency: number; // per 1000 words
};

export type PhraseHygieneWidgetProps = {
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
};

import { AlertTriangle, Ban, TrendingUp, RefreshCw } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useChapters } from '@/context/ChaptersContext';
import { useToast } from '@/context/toast';
import { Chapters } from '@/services/chaptersService';
import { phraseAnalysisService } from '@/utils/textAnalysis';

export const PhraseHygieneWidget: React.FC<PhraseHygieneWidgetProps> = ({
  className = '',
  showTitle = true,
  maxItems = 10,
}) => {
  const { currentProject } = useAppContext();
  const { state: chaptersState } = useChapters();
  const { showToast } = useToast();
  const [offenders, setOffenders] = useState<PhraseOffender[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [totalWords, setTotalWords] = useState(0);

  // Auto-analyze when project changes or chapters update
  useEffect(() => {
    if (currentProject) {
      analyzeProject();
    } else {
      setOffenders([]);
      setLastAnalyzed(null);
      setTotalWords(0);
    }
  }, [currentProject, chaptersState.byId, chaptersState.byProject]); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeProject = useCallback(async () => {
    if (!currentProject) return;
    setIsAnalyzing(true);

    try {
      // Get all chapter content from ChaptersContext (live data)
      const projectId = currentProject.id;
      const chapterIds = chaptersState.byProject[projectId] || [];

      // Load full chapter content from IndexedDB
      const chapters = await Promise.all(chapterIds.map((id) => Chapters.get(id)));

      const allContent = chapters
        .filter((ch) => ch !== null)
        .map((ch) => ch!.content || '')
        .join(' ');

      if (!allContent.trim()) {
        setOffenders([]);
        setTotalWords(0);
        // Don't show toast on auto-analysis, only on manual refresh
        return;
      }

      const results = await phraseAnalysisService.analyzeText(allContent, currentProject.id);

      // Convert results to our format
      const phraseOffenders: PhraseOffender[] = results.phrases
        .map((phrase: any) => ({
          phrase: phrase.phrase,
          count: phrase.count,
          severity: phrase.severity as 'low' | 'medium' | 'high',
          frequency: (phrase.count / results.totalWords) * 1000,
        }))
        .sort((a: PhraseOffender, b: PhraseOffender) => {
          // Sort by severity first, then by count
          const severityOrder = { high: 3, medium: 2, low: 1 };
          if (a.severity !== b.severity) {
            return severityOrder[b.severity] - severityOrder[a.severity];
          }
          return b.count - a.count;
        })
        .slice(0, maxItems);

      setOffenders(phraseOffenders);
      setTotalWords(results.totalWords);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Failed to analyze phrases:', error);
      showToast('Failed to analyze phrases', 'error');
      setOffenders([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentProject, chaptersState.byProject, showToast, maxItems]);

  const addToStoplist = (targetPhrase: string) => {
    if (!currentProject) return;
    phraseAnalysisService.addToCustomStoplist(currentProject.id, targetPhrase);
    showToast(`Added "${targetPhrase}" to stoplist`, 'success');
    // Remove from current offenders list
    setOffenders((prev) => prev.filter((o) => o.phrase !== targetPhrase));
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-orange-500 bg-orange-50';
      case 'low':
        return 'text-yellow-500 bg-yellow-50';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <TrendingUp className="w-3 h-3" />;
      case 'low':
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  if (!currentProject) {
    return (
      <div className={`${className} p-4 bg-white rounded-lg border`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            <h3 className="font-medium text-gray-500">Phrase Hygiene</h3>
          </div>
        )}
        <p className="text-sm text-gray-500 text-center py-4">
          Select a project to analyze phrase usage
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} p-4 bg-white rounded-lg border`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-medium text-gray-900">Phrase Hygiene</h3>
          </div>
          <button
            onClick={analyzeProject}
            disabled={isAnalyzing}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Re-analyze project"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {isAnalyzing ? (
        <div className="text-center py-6">
          <RefreshCw className="w-6 h-6 mx-auto text-gray-400 animate-spin mb-2" />
          <p className="text-sm text-gray-500">Analyzing phrase usage...</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Total words analyzed:</span>
              <span className="font-medium text-gray-900">{totalWords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Issues found:</span>
              <span className="font-medium text-gray-900">{offenders.length}</span>
            </div>
            {lastAnalyzed && (
              <div className="text-xs text-gray-500 mt-1">
                Last analyzed: {lastAnalyzed.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Offenders List */}
          {offenders.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-700 mb-1">Great phrase hygiene!</p>
              <p className="text-xs text-gray-500">No overused phrases detected</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {offenders.map((offender, _index) => (
                <div
                  key={`${offender.phrase}-${offender.severity}`}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                          offender.severity,
                        )}`}
                      >
                        {getSeverityIcon(offender.severity)}
                        {offender.severity}
                      </span>
                      <span className="font-medium text-gray-900 truncate">
                        "{offender.phrase}"
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {offender.count} uses • {offender.frequency.toFixed(1)} per 1000 words
                    </div>
                  </div>
                  <button
                    onClick={() => addToStoplist(offender.phrase)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title={`Add "${offender.phrase}" to stoplist`}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {offenders.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <button
                onClick={() => {
                  if (currentProject) {
                    // Add all high severity phrases to stoplist
                    const highSeverityPhrases = offenders.filter((o) => o.severity === 'high');
                    highSeverityPhrases.forEach((phrase) => {
                      phraseAnalysisService.addToCustomStoplist(currentProject.id, phrase.phrase);
                    });
                    if (highSeverityPhrases.length > 0) {
                      showToast(
                        `Added ${highSeverityPhrases.length} high-severity phrases to stoplist`,
                        'success',
                      );
                      setOffenders((prev) => prev.filter((o) => o.severity !== 'high'));
                    }
                  }
                }}
                className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                disabled={!offenders.some((o) => o.severity === 'high')}
              >
                Ignore all high-severity phrases
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhraseHygieneWidget;

// src/components/Analytics/PhraseHygieneWidget.tsx import { AlertTriangle, Ban, TrendingUp, RefreshCw } from 'lucide-react'; import React, { useState, useEffect } from 'react'; import { useAppContext } from '@/context/AppContext'; import { useToast } from '@/context/toast'; import { phraseAnalysisService } from '@/utils/textAnalysis'; interface PhraseOffender { phrase: string; count: number; severity: 'low' | 'medium' | 'high'; frequency: number; // per 1000 words } interface PhraseHygieneWidgetProps { className?: string; showTitle?: boolean; maxItems?: number; } export const PhraseHygieneWidget: React.FC<PhraseHygieneWidgetProps> = ({ className = '', _showTitle = true, _maxItems = 10,  }) => { const { currentProject } = useAppContext(); const { showToast } = useToast(); const [offenders, setOffenders] = useState<PhraseOffender[]>([]); const [isAnalyzing, setIsAnalyzing] = useState(false); const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null); const [totalWords, setTotalWords] = useState(0); // Auto-analyze when project changes useEffect(() => { if (currentProject) { analyzeProject(); } else { setOffenders([]); setLastAnalyzed(null); setTotalWords(0); } }, [currentProject, analyzeProject]); const analyzeProject = async () => { if (!currentProject) return; setIsAnalyzing(true); try { // Get all chapter content const allContent = currentProject.chapters?.map((chapter: any) => chapter.content || '').join(' ') || ''; if (!allContent.trim()) { setOffenders([]); setTotalWords(0); showToast('No content found to analyze', 'warning'); return; } const results = await phraseAnalysisService.analyzeText(allContent, currentProject.id); // Convert results to our format const phraseOffenders: PhraseOffender[] = results.phrases .map((phrase) => ({ phrase: phrase.phrase, count: phrase.count, severity: phrase.severity, frequency: (phrase.count / results.totalWords) * 1000, })) .sort((a, _b) => { // Sort by severity first, then by count const severityOrder = { high: 3, medium: 2, low: 1 }; if (a.severity !== b.severity) { return severityOrder[b.severity] - severityOrder[a.severity]; } return b.count - a.count; }) .slice(0, maxItems); setOffenders(phraseOffenders); setTotalWords(results.totalWords); setLastAnalyzed(new Date()); } catch (error) { console.error('Failed to analyze phrases:', error); showToast('Failed to analyze phrases', 'error'); setOffenders([]); } finally { setIsAnalyzing(false); } }; const addToStoplist = (_phrase: string) => { if (!currentProject) return; phraseAnalysisService.addToCustomStoplist(currentProject.id, phrase); showToast(`Added "${phrase}" to stoplist`, 'success'); // Remove from current offenders list setOffenders((prev) => prev.filter((o) => o.phrase !== phrase)); }; const getSeverityColor = (_severity: 'low' | 'medium' | 'high') => { switch (severity) { case 'high': return 'text-red-500 bg-red-50'; case 'medium': return 'text-orange-500 bg-orange-50'; case 'low': return 'text-yellow-500 bg-yellow-50'; } }; const getSeverityIcon = (_severity: 'low' | 'medium' | 'high') => { switch (severity) { case 'high': return <AlertTriangle className="w-3 h-3" />; case 'medium': return <TrendingUp className="w-3 h-3" />; case 'low': return <TrendingUp className="w-3 h-3" />; } }; if (!currentProject) { return ( <div className={`${className} p-4 bg-white rounded-lg border`}> {showTitle && ( <div className="flex items-center gap-2 mb-3"> <AlertTriangle className="w-4 h-4 text-gray-400" /> <h3 className="font-medium text-gray-500">Phrase Hygiene</h3> </div> )} <p className="text-sm text-gray-500 text-center py-4"> Select a project to analyze phrase usage </p> </div> ); } return ( <div className={`${className} p-4 bg-white rounded-lg border`}> {showTitle && ( <div className="flex items-center justify-between mb-3"> <div className="flex items-center gap-2"> <AlertTriangle className="w-4 h-4 text-orange-500" /> <h3 className="font-medium text-gray-900">Phrase Hygiene</h3> </div> <button onClick={analyzeProject} disabled={isAnalyzing} className="p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50" title="Re-analyze project" > <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} /> </button> </div> )} {isAnalyzing ? ( <div className="text-center py-6"> <RefreshCw className="w-6 h-6 mx-auto text-gray-400 animate-spin mb-2" /> <p className="text-sm text-gray-500">Analyzing phrase usage...</p> </div> ) : ( <> {/* Summary */} <div className="mb-4 p-3 bg-gray-50 rounded text-sm"> <div className="flex justify-between items-center mb-1"> <span className="text-gray-600">Total words analyzed:</span> <span className="font-medium text-gray-900"> {totalWords.toLocaleString()} </span> </div> <div className="flex justify-between items-center"> <span className="text-gray-600">Issues found:</span> <span className="font-medium text-gray-900">{offenders.length}</span> </div> {lastAnalyzed && ( <div className="text-xs text-gray-500 mt-1"> Last analyzed: {lastAnalyzed.toLocaleTimeString()} </div> )} </div> {/* Offenders List */} {offenders.length === 0 ? ( <div className="text-center py-4"> <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center"> <AlertTriangle className="w-6 h-6 text-green-500" /> </div> <p className="text-sm font-medium text-green-700 mb-1"> Great phrase hygiene! </p> <p className="text-xs text-gray-500">No overused phrases detected</p> </div> ) : ( <div className="space-y-2 max-h-80 overflow-y-auto"> {offenders.map((offender, _index) => ( <div key={index} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors" > <div className="flex-1 min-w-0"> <div className="flex items-center gap-2"> <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(offender.severity)}`} > {getSeverityIcon(offender.severity)} {offender.severity} </span> <span className="font-medium text-gray-900 truncate"> "{offender.phrase}" </span> </div> <div className="text-xs text-gray-500 mt-0.5"> {offender.count} uses • {offender.frequency.toFixed(1)} per 1000 words </div> </div> <button onClick={() => addToStoplist(offender.phrase)} className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title={`Add "${offender.phrase}" to stoplist`} > <Ban className="w-4 h-4" /> </button> </div> ))} </div> )} {/* Quick Actions */} {offenders.length > 0 && ( <div className="mt-4 pt-3 border-t text-center"> <button onClick={() => { if (currentProject) { // Add all high severity phrases to stoplist const highSeverityPhrases = offenders.filter((o) => o.severity === 'high'); highSeverityPhrases.forEach((phrase) => { phraseAnalysisService.addToCustomStoplist(currentProject.id, phrase.phrase); }); if (highSeverityPhrases.length > 0) { showToast( `Added ${highSeverityPhrases.length} high-severity phrases to stoplist`, 'success', ); setOffenders((prev) => prev.filter((o) => o.severity !== 'high')); } } }} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors" disabled={!offenders.some((o) => o.severity === 'high')} > Ignore all high-severity phrases </button> </div> )} </> )} </div> ); }; export default PhraseHygieneWidget;
