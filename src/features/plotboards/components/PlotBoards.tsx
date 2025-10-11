// Plot Boards main page component
// Manages multiple plot boards with templates and board switching

import React, { useState, useEffect } from 'react';

import { useChaptersStore } from '../../../stores/useChaptersStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useFeatureFlag, isEnabled } from '../../../utils/flags';
import { usePlotBoardIntegration } from '../hooks/usePlotBoardIntegration';
import { usePlotBoardStore, initializePlotBoardStore } from '../store';
import {
  PlotBoard as PlotBoardType,
  PlotColumn as PlotColumnType,
  PlotCard as PlotCardType,
  PlotTemplateCategory,
} from '../types';

import { PlotAnalysisPanel } from './Insights/PlotAnalysisPanel';
import { PlotBoard } from './PlotBoard';

interface PlotBoardsProps {
  projectId: string;
}

export const PlotBoards: React.FC<PlotBoardsProps> = ({ projectId }) => {
  const isPlotBoardsEnabled = useFeatureFlag('plotBoards');

  // Feature flag check
  if (!isPlotBoardsEnabled) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Plot Boards Feature</h3>
          <p className="text-gray-600 mb-6">
            Plot Boards is an experimental feature that provides Kanban-style
            <br />
            visualization for story structure and scene organization.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              To enable this feature, add{' '}
              <code className="px-2 py-1 bg-gray-100 rounded text-xs">?plotBoards=1</code> to your
              URL
              <br />
              or use the developer console:{' '}
              <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                __inkwellFlags.enable('plotBoards')
              </code>
            </p>
            <button
              onClick={() => {
                window.location.href =
                  window.location.href + (window.location.search ? '&' : '?') + 'plotBoards=1';
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable Plot Boards (Experimental)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    boards,
    activeBoard,
    templates: _templates,
    isLoading,
    lastError,
    createBoard,
    deleteBoard,
    duplicateBoard,
    setActiveBoard,
    getBoardsByProject,
    getTemplatesByCategory,
  } = usePlotBoardStore();

  const _settingsStore = useSettingsStore();
  const { chapters } = useChaptersStore();

  // Chapter integration
  const integration = usePlotBoardIntegration({
    boardId: activeBoard,
    projectId,
    autoSync: true,
  });

  // Local state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showChapterSync, setShowChapterSync] = useState(false);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [_selectedCard, setSelectedCard] = useState<PlotCardType | null>(null);
  const [_selectedColumn, setSelectedColumn] = useState<PlotColumnType | null>(null);
  const [_selectedBoard, setSelectedBoard] = useState<PlotBoardType | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'insights'>('board');

  // Initialize store
  useEffect(() => {
    initializePlotBoardStore();
  }, []);

  // Get current project's boards and chapters
  const projectBoards = getBoardsByProject(projectId);
  const currentBoard = activeBoard ? boards[activeBoard] : null;
  const projectChapters = chapters; // Use chapters directly from store

  // Create a new board
  const handleCreateBoard = async (_title: string, _templateId?: string) => {
    try {
      const newBoard = await createBoard(projectId, title, templateId);
      setShowTemplateModal(false);
      return newBoard;
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  // Board management
  const handleDeleteBoard = async (_boardId: string) => {
    if (
      window.confirm('Are you sure you want to delete this board? This action cannot be undone.')
    ) {
      await deleteBoard(boardId);
      if (activeBoard === boardId) {
        const remainingBoards = projectBoards.filter((b) => b.id !== boardId);
        setActiveBoard(remainingBoards.length > 0 ? remainingBoards[0]?.id || null : null);
      }
    }
  };

  const handleDuplicateBoard = async (_boardId: string) => {
    try {
      const board = boards[boardId];
      if (board) {
        await duplicateBoard(boardId, `${board.title} (Copy)`);
      }
    } catch (error) {
      console.error('Failed to duplicate board:', error);
    }
  };

  // Template Modal Component
  const TemplateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create New Plot Board</h3>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Quick Create */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-3">Quick Start</h4>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const title = prompt('Board title:');
                  if (title) {
                    handleCreateBoard(title);
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Blank Board
              </button>
            </div>
          </div>

          {/* Template Categories */}
          {Object.values(PlotTemplateCategory).map((category) => {
            const categoryTemplates = getTemplatesByCategory(category);
            if (categoryTemplates.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-3 capitalize">
                  {category.replace('_', ' ')} Templates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        const title = prompt('Board title:', template.name);
                        if (title) {
                          handleCreateBoard(title, template.id);
                        }
                      }}
                    >
                      <h5 className="font-medium text-gray-900 mb-2">{template.name}</h5>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {template.columns.length} columns
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Chapter Sync Modal Component
  const ChapterSyncModal = () => {
    const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
    const [syncInProgress, setSyncInProgress] = useState(false);

    const handleSyncSelected = async () => {
      if (selectedChapters.length === 0) return;

      setSyncInProgress(true);
      try {
        await integration.createCardsFromChapters(selectedChapters);
        setShowChapterSync(false);
        setSelectedChapters([]);
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setSyncInProgress(false);
      }
    };

    const handleSyncAll = async () => {
      setSyncInProgress(true);
      try {
        await integration.forcSync();
        setShowChapterSync(false);
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setSyncInProgress(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sync with Chapters</h3>
              <button
                onClick={() => setShowChapterSync(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={syncInProgress}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Sync Status */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-700 mb-2">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    integration.isAutoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium">
                  Auto-sync: {integration.isAutoSyncEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {integration.lastSyncTime && (
                <p className="text-sm text-blue-600">
                  Last synced: {integration.lastSyncTime.toLocaleString()}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleSyncAll}
                  disabled={syncInProgress}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {syncInProgress ? 'Syncing...' : 'Sync All Changes'}
                </button>

                <button
                  onClick={() => {
                    if (integration.isAutoSyncEnabled) {
                      integration.disableAutoSync();
                    } else {
                      integration.enableAutoSync();
                    }
                  }}
                  className={`px-4 py-2 border rounded transition-colors ${
                    integration.isAutoSyncEnabled
                      ? 'border-red-600 text-red-600 hover:bg-red-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {integration.isAutoSyncEnabled ? 'Disable Auto-sync' : 'Enable Auto-sync'}
                </button>
              </div>
            </div>

            {/* Chapter Selection */}
            {projectChapters.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Create Cards from Chapters
                </h4>
                <div className="max-h-60 overflow-y-auto border rounded">
                  {projectChapters.map((chapter: any) => (
                    <label
                      key={chapter.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChapters.includes(chapter.id)}
                        onChange={(_e) => {
                          if (e.target.checked) {
                            setSelectedChapters([...selectedChapters, chapter.id]);
                          } else {
                            setSelectedChapters(selectedChapters.filter((id) => id !== chapter.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{chapter.title}</div>
                        <div className="text-xs text-gray-500">
                          {chapter.scenes?.length || 0} scenes • {chapter.wordCount || 0} words
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedChapters.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSyncSelected}
                      disabled={syncInProgress}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {syncInProgress
                        ? 'Creating...'
                        : `Create Cards from ${selectedChapters.length} Chapter(s)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {projectChapters.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">No chapters found in this project.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create chapters first to sync with plot boards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Board Selector Component
  const BoardSelector = () => (
    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-64">
      <div className="p-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Your Boards
        </div>
        {projectBoards.map((board) => (
          <button
            key={board.id}
            onClick={() => {
              setActiveBoard(board.id);
              setShowBoardSelector(false);
            }}
            className={`w-full text-left p-2 rounded hover:bg-gray-50 transition-colors flex items-center justify-between ${
              activeBoard === board.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            <div>
              <div className="font-medium text-sm">{board.title}</div>
              <div className="text-xs text-gray-500">
                {board.columns.length} columns •{' '}
                {board.columns.reduce((sum, _col) => sum + col.cards.length, 0)} cards
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={(_e) => {
                  e.stopPropagation();
                  handleDuplicateBoard(board.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Duplicate board"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                onClick={(_e) => {
                  e.stopPropagation();
                  handleDeleteBoard(board.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete board"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </button>
        ))}

        <div className="border-t mt-2 pt-2">
          <button
            onClick={() => {
              setShowBoardSelector(false);
              setShowTemplateModal(true);
            }}
            className="w-full text-left p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Board
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading plot boards...</p>
        </div>
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Plot Boards</h3>
          <p className="text-gray-600 mb-4">{lastError}</p>
          <button
            onClick={() => initializePlotBoardStore()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (projectBoards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Plot Boards Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first plot board to start visualizing your story structure.
          </p>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Plot Board
          </button>
        </div>
        {showTemplateModal && <TemplateModal />}
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Board</h3>
          <p className="text-gray-600 mb-4">Select a board to start working.</p>
          <button
            onClick={() => setActiveBoard(projectBoards[0]?.id || null)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open {projectBoards[0]?.title || 'Board'}
          </button>
        </div>
      </div>
    );
  }

  // Create tabs configuration
  const tabs = [
    {
      id: 'board',
      label: 'Plot Board',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
      ),
      content: (
        <PlotBoard
          board={currentBoard}
          onEditCard={setSelectedCard}
          onEditColumn={setSelectedColumn}
          onEditBoard={setSelectedBoard}
        />
      ),
    },
  ];

  // Add Insights tab if feature is enabled
  if (isEnabled('aiPlotAnalysis')) {
    tabs.push({
      id: 'insights',
      label: 'Insights',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      content: <PlotAnalysisPanel profileId="default" projectId={projectId} />,
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          {/* Board Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBoardSelector(!showBoardSelector)}
              className="flex items-center space-x-2 px-3 py-2 border rounded hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">{currentBoard.title}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showBoardSelector && <BoardSelector />}
          </div>

          {/* Board Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChapterSync(true)}
              className="px-3 py-2 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors"
            >
              📚 Sync Chapters
            </button>

            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
            >
              + New Board
            </button>
          </div>
        </div>

        {/* Board Settings */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated {new Date(currentBoard.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Tab Header */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'board' | 'insights')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#0C5C3D] border-[#D4A537]'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>

      {/* Modals */}
      {showTemplateModal && <TemplateModal />}
      {showChapterSync && <ChapterSyncModal />}

      {/* Click outside to close board selector */}
      {showBoardSelector && (
        <div className="fixed inset-0 z-5" onClick={() => setShowBoardSelector(false)} />
      )}
    </div>
  );
};
