// src/components/Sections/BookBuilderModal.tsx
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { X, GripVertical, Plus, Trash, Copy, Sparkles, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useSections } from '@/hooks/useSections';
import { getSectionIcon, getSectionIconColor } from '@/lib/sectionIcons';
import claudeService from '@/services/claudeService';
import { Section, SectionType, SECTION_TYPE_META } from '@/types/section';

interface BookBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

/**
 * Book Builder Modal
 *
 * Comprehensive section management interface with:
 * - Drag-and-drop reordering
 * - Inline editing (title, type)
 * - Duplicate and delete actions
 * - AI-powered section ordering suggestions
 */
export default function BookBuilderModal({ isOpen, onClose, projectId }: BookBuilderModalProps) {
  const {
    sections,
    createSection,
    updateSection,
    deleteSection,
    duplicateSection,
    reorderSections,
    applySectionOrder,
  } = useSections(projectId);

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState<SectionType>('chapter');

  // AI Suggestion state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<Section[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Sort sections by order
  const sortedSections = useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newSectionTitle.trim()) return;
    createSection(newSectionTitle.trim(), newSectionType);
    setNewSectionTitle('');
    setNewSectionType('chapter');
  };

  const handleDuplicate = (sectionId: string) => {
    duplicateSection(sectionId);
  };

  const handleDelete = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      deleteSection(sectionId);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderSections(result.source.index, result.destination.index);
  };

  /**
   * AI Suggest Order Handler
   * Uses Claude to suggest logical section ordering
   */
  const handleSuggestOrder = async () => {
    setIsSuggesting(true);
    setSuggested([]);
    setSuggestionError(null);

    try {
      if (!claudeService.isConfigured()) {
        setSuggestionError('Claude API key not configured. Please set it up in Settings.');
        setIsSuggesting(false);
        return;
      }

      // Build outline for Claude
      const outline = sortedSections
        .map((s, i) => `${i + 1}. "${s.title}" (${SECTION_TYPE_META[s.type].label})`)
        .join('\n');

      const prompt = `You are helping an author organize a manuscript.

Here is the current section list:

${outline}

Analyze this structure and suggest a logical reading order from beginning to end.
Consider:
- Title pages and dedications come first
- Prologues before Chapter 1
- Chapters in narrative sequence
- Epilogues after the last chapter
- Acknowledgements and appendices at the end

Return ONLY a numbered list using the exact titles provided, in the suggested order.
Format:
1. [exact title]
2. [exact title]
...`;

      // Use non-streaming API for simple text generation
      const response = await fetch('/api/ai/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'anthropic',
          prompt,
          temperature: 0.3,
          maxTokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }

      const { text } = await response.json();

      // Parse suggested order
      const lines = text
        .split('\n')
        .map((l: string) =>
          l
            .replace(/^\d+\.\s*["']?/, '')
            .replace(/["']?\s*$/, '')
            .trim(),
        )
        .filter(Boolean);

      // Match suggested titles to actual sections
      const suggestedOrder: Section[] = [];
      for (const title of lines) {
        const section = sortedSections.find(
          (s) => s.title.toLowerCase().trim() === title.toLowerCase().trim(),
        );
        if (section) {
          suggestedOrder.push(section);
        }
      }

      // Add any sections that weren't matched (to avoid losing them)
      for (const section of sortedSections) {
        if (!suggestedOrder.find((s) => s.id === section.id)) {
          suggestedOrder.push(section);
        }
      }

      setSuggested(suggestedOrder);
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      setSuggestionError(error.message || 'Failed to generate suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestedOrder = () => {
    if (suggested.length === 0) return;
    applySectionOrder(suggested);
    setSuggested([]);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 text-slate-100 w-[800px] max-h-[85vh] overflow-hidden rounded-xl shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-800/50">
          <div>
            <h2 className="text-xl font-semibold">Book Builder</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage, reorder, and organize your manuscript sections
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* AI Suggestion Panel */}
          <div className="border-b border-slate-800 p-4 bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">AI Suggest Order</h3>
              </div>
              {!isSuggesting ? (
                <button
                  onClick={handleSuggestOrder}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Generate Suggestion
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing structure...</span>
                </div>
              )}
            </div>

            {suggestionError && (
              <div className="bg-red-900/20 border border-red-700 rounded-md p-2 text-xs text-red-400">
                {suggestionError}
              </div>
            )}

            {suggested.length > 0 && (
              <div className="space-y-2">
                <div className="bg-slate-900/80 rounded-md p-3 text-sm text-slate-300 space-y-1.5 max-h-40 overflow-y-auto border border-slate-700">
                  {suggested.map((section, i) => {
                    const Icon = getSectionIcon(section.type);
                    const iconColor = getSectionIconColor(section.type);
                    return (
                      <div key={section.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-6">{i + 1}.</span>
                        <Icon className={`w-3 h-3 ${iconColor}`} />
                        <span className="flex-1">{section.title}</span>
                        <span className="text-xs text-slate-500">
                          ({SECTION_TYPE_META[section.type].label})
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSuggested([])}
                    className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={applySuggestedOrder}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-medium px-3 py-1 rounded-md transition-colors"
                  >
                    Apply Suggested Order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sections List */}
          <div className="p-4">
            {sortedSections.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No sections yet. Add your first section below.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {sortedSections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(prov, snapshot) => {
                            const Icon = getSectionIcon(section.type);
                            const iconColor = getSectionIconColor(section.type);

                            return (
                              <li
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={`
                                  flex items-center justify-between bg-slate-800 rounded-lg p-3 border
                                  ${snapshot.isDragging ? 'border-amber-400 shadow-lg' : 'border-slate-700'}
                                  transition-all
                                `}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span
                                    {...prov.dragHandleProps}
                                    className="cursor-grab text-slate-500 hover:text-slate-400 active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </span>

                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />

                                    <input
                                      className="flex-1 min-w-0 bg-transparent text-sm border-b border-transparent hover:border-slate-600 focus:border-amber-400 focus:outline-none px-1 py-0.5"
                                      value={section.title}
                                      onChange={(e) =>
                                        updateSection(section.id, { title: e.target.value })
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />

                                    <select
                                      className="bg-slate-700 text-xs px-2 py-1 rounded border border-slate-600 focus:border-amber-400 focus:outline-none"
                                      value={section.type}
                                      onChange={(e) =>
                                        updateSection(section.id, {
                                          type: e.target.value as SectionType,
                                        })
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {Object.entries(SECTION_TYPE_META).map(([key, meta]) => (
                                        <option key={key} value={key}>
                                          {meta.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 ml-3">
                                  <button
                                    onClick={() => handleDuplicate(section.id)}
                                    className="text-slate-400 hover:text-slate-200 transition-colors"
                                    title="Duplicate section"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(section.id)}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                    title="Delete section"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </li>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        {/* Footer - Add New Section */}
        <div className="border-t border-slate-800 p-4 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-900 px-3 py-2 rounded-lg text-sm text-slate-100 border border-slate-700 focus:border-amber-400 focus:outline-none"
              placeholder="New section title..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <select
              className="bg-slate-900 px-2 py-2 rounded-lg text-sm text-slate-100 border border-slate-700 focus:border-amber-400 focus:outline-none"
              value={newSectionType}
              onChange={(e) => setNewSectionType(e.target.value as SectionType)}
            >
              {Object.entries(SECTION_TYPE_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!newSectionTitle.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
