// src/components/Publishing/PublishingToolsPanel.tsx
import {
  Copy,
  FileText,
  Mail,
  BookOpen,
  Wand2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { PanelHeader } from '@/components/Panels/PanelHeader';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import { useChapters } from '@/hooks/useChapters';
import {
  generatePublishingMaterial,
  generatePublishingPackage,
  type PublishingMaterialType,
} from '@/services/ai/publishingToolsService';
import type { PublishingMaterials } from '@/types/ai';

type PublishingMode = 'blurb' | 'query' | 'synopsis1' | 'synopsis3' | 'package';

const PUBLISHING_MODES = {
  blurb: {
    label: 'Blurb',
    description: 'Back cover copy (100-300 words)',
    icon: FileText,
  },
  query: {
    label: 'Query Letter',
    description: 'Agent submission paragraph (200-500 words)',
    icon: Mail,
  },
  synopsis1: {
    label: '1-Page Synopsis',
    description: 'Complete story arc (300-800 words)',
    icon: BookOpen,
  },
  synopsis3: {
    label: '3-Page Synopsis',
    description: 'Comprehensive plot summary (800-2400 words)',
    icon: BookOpen,
  },
  package: {
    label: 'Full Package',
    description: 'Generate all publishing materials',
    icon: Wand2,
  },
};

export const PublishingToolsPanel: React.FC = () => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();
  const { chapters } = useChapters(currentProject?.id || null);

  const [mode, setMode] = useState<PublishingMode>('blurb');
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageMaterials, setPackageMaterials] = useState<Partial<
    Record<PublishingMaterialType, PublishingMaterials>
  > | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }

    if (!chapters || chapters.length === 0) {
      setError('No chapters found in project');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setContent('');
    setPackageMaterials(null);

    try {
      // Convert mode to PublishingMaterialType
      const typeMap: Record<PublishingMode, PublishingMaterialType | null> = {
        blurb: 'blurb',
        query: 'query',
        synopsis1: 'synopsis-1',
        synopsis3: 'synopsis-3',
        package: null, // Special case - uses generatePublishingPackage
      };

      if (mode === 'package') {
        // Generate full package
        const result = await generatePublishingPackage(currentProject.id, chapters, {
          genre: currentProject.genre,
          description: currentProject.description,
        });

        if (result.success && Object.keys(result.materials).length > 0) {
          setPackageMaterials(result.materials);
          const materialNames = {
            blurb: 'Blurb',
            query: 'Query Letter',
            'synopsis-1': '1-Page Synopsis',
            'synopsis-3': '3-Page Synopsis',
          };
          const summary = Object.keys(result.materials)
            .map((key) => `✅ ${materialNames[key as PublishingMaterialType] || key}: Generated`)
            .join('\n');
          const errorSummary = Object.entries(result.errors)
            .map(
              ([key, error]) =>
                `❌ ${materialNames[key as PublishingMaterialType] || key}: ${error}`,
            )
            .join('\n');

          setContent(
            `# Publishing Package Generated\n\n${summary}${errorSummary ? `\n\n${errorSummary}` : ''}\n\nUse the tabs above to view each material.`,
          );

          showToast(
            `Publishing package generated! (${result.metadata.completed}/${result.metadata.total} materials)`,
            result.metadata.completed === result.metadata.total ? 'success' : 'warning',
            3000,
          );
        } else {
          setError('Failed to generate any publishing materials');
        }
      } else {
        // Generate single material
        const type = typeMap[mode];
        if (!type) {
          setError(`Unknown publishing mode: ${mode}`);
          return;
        }

        const result = await generatePublishingMaterial(currentProject.id, chapters, type, {
          genre: currentProject.genre,
          description: currentProject.description,
        });

        if (result.success && result.data) {
          // Extract the appropriate field from PublishingMaterials
          const fieldMap: Record<
            PublishingMaterialType,
            keyof Omit<PublishingMaterials, 'generatedAt'>
          > = {
            blurb: 'blurb',
            query: 'queryLetter',
            'synopsis-1': 'synopsisOnePage',
            'synopsis-3': 'synopsisThreePage',
          };
          const field = fieldMap[type];
          const materialText = result.data[field];
          if (materialText) {
            setContent(materialText);
          } else {
            setError(`No ${type} content in response`);
          }
        } else {
          setError(result.error?.message || `Failed to generate ${type}`);
        }
      }
    } catch (err: any) {
      console.error('Publishing tools error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate publishing material');
    } finally {
      setIsGenerating(false);
    }
  }, [mode, currentProject, chapters, showToast]);

  const handleCopy = useCallback(() => {
    if (!content) return;

    navigator.clipboard
      .writeText(content)
      .then(() => {
        showToast('Copied to clipboard!', 'success', 2000);
      })
      .catch(() => {
        showToast('Failed to copy to clipboard', 'error', 3000);
      });
  }, [content, showToast]);

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Project Selected
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please select a project to use publishing tools.
        </p>
      </div>
    );
  }

  const ModeIcon = PUBLISHING_MODES[mode].icon;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <PanelHeader
        title="Publishing Tools"
        subtitle="Generate marketing materials for your manuscript"
      />

      <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(PUBLISHING_MODES).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = mode === key;

            return (
              <button
                key={key}
                onClick={() => setMode(key as PublishingMode)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode Description */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <ModeIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              {PUBLISHING_MODES[mode].label}
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {PUBLISHING_MODES[mode].description}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error generating material
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {content && !error && !isGenerating && (
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                {PUBLISHING_MODES[mode].label} generated successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                You can edit the content below before copying or exporting.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!content || isGenerating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>

        {/* Content Editor */}
        <div className="flex-1 min-h-[400px]">
          <textarea
            className="w-full h-full p-4 text-sm font-serif leading-relaxed resize-none border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isGenerating
                ? 'Generating your publishing material...'
                : `Your ${PUBLISHING_MODES[mode].label.toLowerCase()} will appear here. You can edit it before copying or exporting.`
            }
            disabled={isGenerating}
          />
        </div>

        {/* Package Materials Quick View */}
        {packageMaterials && mode === 'package' && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            {packageMaterials.blurb?.blurb && (
              <button
                onClick={() => {
                  setMode('blurb');
                  setContent(packageMaterials.blurb!.blurb!);
                }}
                className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Blurb</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {packageMaterials.blurb.blurb}
                </p>
              </button>
            )}
            {packageMaterials.query?.queryLetter && (
              <button
                onClick={() => {
                  setMode('query');
                  setContent(packageMaterials.query!.queryLetter!);
                }}
                className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Query Letter
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {packageMaterials.query.queryLetter}
                </p>
              </button>
            )}
            {packageMaterials['synopsis-1']?.synopsisOnePage && (
              <button
                onClick={() => {
                  setMode('synopsis1');
                  setContent(packageMaterials['synopsis-1']!.synopsisOnePage!);
                }}
                className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    1-Page Synopsis
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {packageMaterials['synopsis-1'].synopsisOnePage.substring(0, 100)}...
                </p>
              </button>
            )}
            {packageMaterials['synopsis-3']?.synopsisThreePage && (
              <button
                onClick={() => {
                  setMode('synopsis3');
                  setContent(packageMaterials['synopsis-3']!.synopsisThreePage!);
                }}
                className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    3-Page Synopsis
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {packageMaterials['synopsis-3'].synopsisThreePage.substring(0, 100)}...
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
