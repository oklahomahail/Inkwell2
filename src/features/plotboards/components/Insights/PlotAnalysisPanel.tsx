import React from 'react';

import { usePlotAnalysis } from '../../hooks/usePlotAnalysis';

import { ConflictHeatmap } from './ConflictHeatmap';
import { IssuesList } from './IssuesList';
import { PacingGraph } from './PacingGraph';
interface PlotAnalysisPanelProps {
  profileId: string;
  projectId: string;
}
export function _PlotAnalysisPanel({ profileId, projectId }: PlotAnalysisPanelProps) {
  const { analysis, run, hasScenes, sceneCount, isEnabled } = usePlotAnalysis(profileId, projectId);
  if (!isEnabled) {
    return (
      <div className="p-6 text-center">
        {' '}
        <div className="text-gray-400 mb-4">
          {' '}
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />{' '}
          </svg>{' '}
        </div>{' '}
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI Plot Analysis</h3>{' '}
        <p className="text-gray-600 mb-4">
          {' '}
          This feature is currently disabled. Enable it in settings to get AI-powered insights about
          your story structure.{' '}
        </p>{' '}
      </div>
    );
  }
  if (!hasScenes) {
    return (
      <div className="p-6 text-center">
        {' '}
        <div className="text-gray-400 mb-4">
          {' '}
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
            />{' '}
          </svg>{' '}
        </div>{' '}
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Scenes to Analyze</h3>{' '}
        <p className="text-gray-600 mb-4">
          {' '}
          Add cards to your plot board to enable analysis. Each card represents a scene or plot
          point that can be analyzed for structure and flow.{' '}
        </p>{' '}
      </div>
    );
  }
  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {' '}
      {/* Header */}{' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h3 className="text-xl font-semibold text-[#0C5C3D]">Plot Insights</h3>{' '}
          <p className="text-sm text-gray-600">
            {' '}
            AI-powered analysis of your story structure • {sceneCount} scene{' '}
            {sceneCount !== 1 ? 's' : ''} analyzed{' '}
          </p>{' '}
        </div>{' '}
        <button
          onClick={run}
          disabled={!hasScenes}
          className="rounded-lg border border-[#D4A537] px-4 py-2 text-sm text-[#D4A537] hover:bg-[#D4A537]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {' '}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />{' '}
          </svg>{' '}
          <span>Analyze Project</span>{' '}
        </button>{' '}
      </div>{' '}
      {analysis ? (
        <>
          {' '}
          {/* Summary and Quality Score */}{' '}
          <div className="bg-gradient-to-r from-[#0C5C3D]/5 to-[#D4A537]/5 rounded-xl p-6">
            {' '}
            <div className="flex items-start justify-between">
              {' '}
              <div className="flex-1">
                {' '}
                <h4 className="font-medium text-[#0C5C3D] mb-2">Analysis Summary</h4>{' '}
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>{' '}
                <div className="mt-3 text-xs text-gray-500">
                  {' '}
                  Analyzed by {analysis.model === 'claude' ? 'Claude AI' : 'Mock Analysis'} •{' '}
                  {new Date(analysis.updatedAt).toLocaleDateString()}{' '}
                </div>{' '}
              </div>{' '}
              <div className="ml-6 text-center">
                {' '}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-[#D4A537]">
                  {' '}
                  <span className="text-xl font-bold text-[#0C5C3D]">
                    {' '}
                    {Math.round(analysis.qualityScore)}{' '}
                  </span>{' '}
                </div>{' '}
                <div className="mt-2 text-sm font-medium text-[#D4A537]">Quality Score</div>{' '}
                <div className="text-xs text-gray-500">out of 100</div>{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
          {/* Charts Grid */}{' '}
          <div className="grid gap-6 md:grid-cols-2">
            {' '}
            <PacingGraph data={analysis.pacing} />{' '}
            <ConflictHeatmap data={analysis.conflictHeatmap} />{' '}
          </div>{' '}
          {/* Issues List */} <IssuesList issues={analysis.issues} /> {/* Footer Info */}{' '}
          <div className="text-center pt-4 border-t border-gray-200">
            {' '}
            <p className="text-xs text-gray-500">
              {' '}
              Plot analysis helps identify structural issues and suggests improvements. This is an
              AI-powered tool and should be used as a guide alongside your creative judgment.{' '}
            </p>{' '}
          </div>{' '}
        </>
      ) : (
        <div className="text-center py-12">
          {' '}
          <div className="text-gray-400 mb-4">
            {' '}
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {' '}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />{' '}
            </svg>{' '}
          </div>{' '}
          <h4 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h4>{' '}
          <p className="text-gray-600 mb-4">
            {' '}
            Click "Analyze Project" above to get AI-powered insights about your plot structure,
            pacing, and story flow.{' '}
          </p>{' '}
        </div>
      )}{' '}
    </div>
  );
}
