/**
 * NewChapterDialog
 *
 * Modal dialog for creating new chapters with optional configuration.
 */

import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { Chapter } from '@/types/project';

export interface NewChapterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (options: {
    title: string;
    summary?: string;
    targetWordCount?: number;
    status: Chapter['status'];
  }) => Promise<void>;
  nextChapterNumber?: number;
}

export default function NewChapterDialog({
  isOpen,
  onClose,
  onCreate,
  nextChapterNumber = 1,
}: NewChapterDialogProps) {
  const [title, setTitle] = useState(`Chapter ${nextChapterNumber}`);
  const [summary, setSummary] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('');
  const [status, setStatus] = useState<Chapter['status']>('in-progress');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(`Chapter ${nextChapterNumber}`);
      setSummary('');
      setTargetWordCount('');
      setStatus('in-progress');
    }
  }, [isOpen, nextChapterNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        title: title.trim(),
        summary: summary.trim() || undefined,
        targetWordCount: targetWordCount ? parseInt(targetWordCount, 10) : undefined,
        status,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create chapter:', error);
      alert('Failed to create chapter. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Chapter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="chapter-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="chapter-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., The Beginning"
              required
              autoFocus
            />
          </div>

          {/* Summary */}
          <div>
            <label
              htmlFor="chapter-summary"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Summary (optional)
            </label>
            <textarea
              id="chapter-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of what happens in this chapter..."
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="chapter-status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="chapter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Chapter['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="first-draft">First Draft</option>
              <option value="revised">Revised</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Target Word Count */}
          <div>
            <label
              htmlFor="chapter-target"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Word Count (optional)
            </label>
            <input
              id="chapter-target"
              type="number"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(e.target.value)}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3000"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
