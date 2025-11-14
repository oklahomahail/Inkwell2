// src/components/Planning/TemplatePickerModal.tsx
import React, { useMemo, useState } from 'react';

import { STORY_TEMPLATES, StoryTemplate } from '@/types/storyTemplates';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: StoryTemplate) => void;
  selectedTemplateId?: string;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedTemplateId,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const coreTemplates = useMemo(() => STORY_TEMPLATES.filter((t) => t.category === 'core'), []);
  const advancedTemplates = useMemo(
    () => STORY_TEMPLATES.filter((t) => t.category === 'advanced'),
    [],
  );

  if (!isOpen) return null;

  const handleSelect = (template: StoryTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div
        className="relative w-full max-w-4xl rounded-xl bg-slate-900/95 p-6 shadow-xl ring-1 ring-slate-700"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Choose a story structure</h2>
            <p className="mt-1 text-sm text-slate-300">
              Start with a simple template. You can always adjust beats and chapters as you write.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {/* core / advanced toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Core templates
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Advanced templates
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            <span className="text-slate-200">
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </span>
          </button>
        </div>

        {/* core templates grid */}
        <SectionLabel label="Core templates" />
        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {coreTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              onClick={() => handleSelect(template)}
            />
          ))}
        </div>

        {/* advanced templates grid */}
        {showAdvanced && (
          <>
            <SectionLabel label="Advanced templates" />
            <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {advancedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={template.id === selectedTemplateId}
                  onClick={() => handleSelect(template)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface SectionLabelProps {
  label: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => (
  <div className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
    {label}
  </div>
);

interface TemplateCardProps {
  template: StoryTemplate;
  isSelected: boolean;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onClick }) => {
  const difficultyLabel =
    template.difficulty === 'beginner'
      ? 'Beginner friendly'
      : template.difficulty === 'intermediate'
        ? 'Intermediate'
        : 'Advanced';

  return (
    <button
      type="button"
      onClick={onClick}
      title={template.tooltip}
      className={[
        'group flex h-full flex-col rounded-lg border p-3 text-left transition',
        isSelected
          ? 'border-emerald-400 bg-slate-800/80'
          : 'border-slate-700 bg-slate-900/80 hover:border-emerald-300 hover:bg-slate-800',
      ].join(' ')}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">{template.name}</h3>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
          {template.structureType}
        </span>
      </div>

      <p className="mb-2 line-clamp-3 text-xs text-slate-300">{template.shortDescription}</p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-slate-300">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-slate-800 px-2 py-0.5">{template.beatCount} beats</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5">{difficultyLabel}</span>
        </div>
        <span className="text-emerald-300 group-hover:underline">
          {isSelected ? 'Selected' : 'Use template'}
        </span>
      </div>
    </button>
  );
};
