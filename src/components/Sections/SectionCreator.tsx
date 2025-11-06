// src/components/Sections/SectionCreator.tsx
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { getSectionIcon, getSectionIconColor } from '@/lib/sectionIcons';
import { SectionType, SECTION_TYPE_META } from '@/types/section';

interface SectionCreatorProps {
  onCreateSection: (title: string, type: SectionType) => void;
  onCancel?: () => void;
  defaultType?: SectionType;
  inline?: boolean;
}

/**
 * Section Creator Component
 *
 * Allows users to create new sections with custom titles and types
 * Supports inline mode for sidebar integration
 */
export default function SectionCreator({
  onCreateSection,
  onCancel,
  defaultType = 'chapter',
  inline = false,
}: SectionCreatorProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SectionType>(defaultType);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    onCreateSection(title.trim(), type);
    setTitle('');
    setType(defaultType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="p-2 space-y-2 bg-slate-800/50 rounded-md">
        <input
          type="text"
          placeholder="Section title..."
          className="w-full bg-slate-900 text-slate-100 text-sm px-2 py-1.5 rounded border border-slate-700 focus:border-amber-400 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <select
          className="w-full bg-slate-900 text-slate-100 text-sm px-2 py-1.5 rounded border border-slate-700 focus:border-amber-400 focus:outline-none"
          value={type}
          onChange={(e) => setType(e.target.value as SectionType)}
        >
          {Object.entries(SECTION_TYPE_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm font-medium px-3 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </form>
    );
  }

  // Modal/Card mode
  const Icon = getSectionIcon(type);
  const iconColor = getSectionIconColor(type);
  const meta = SECTION_TYPE_META[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section Type Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Section Type</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SECTION_TYPE_META).map(([key, typeMeta]) => {
            const TypeIcon = getSectionIcon(key as SectionType);
            const typeColor = getSectionIconColor(key as SectionType);
            const isSelected = type === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setType(key as SectionType)}
                className={`
                  flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }
                `}
              >
                <TypeIcon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : typeColor}`} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}
                  >
                    {typeMeta.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Type Info */}
      <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200 mb-1">{meta.label}</div>
          <div className="text-xs text-slate-400">{meta.description}</div>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
        <input
          type="text"
          placeholder={`Enter ${meta.label.toLowerCase()} title...`}
          className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:border-amber-400 focus:outline-none transition-colors"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Section
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
