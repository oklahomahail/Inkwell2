import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppContext, View } from '@/context/AppContext';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const { addProject, setCurrentProjectId, dispatch } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  async function handleCreate() {
    const projectName = name.trim() || 'Untitled Project';
    const project = {
      id: `project-${Date.now()}`,
      name: projectName,
      description: description.trim(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [],
      characters: [],
      beatSheet: [],
    };

    addProject(project);
    setCurrentProjectId(project.id);
    onOpenChange(false);

    // Navigate to Writing view
    dispatch({ type: 'SET_VIEW', payload: View.Writing });
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Create New Project
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Project name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Henry Hail — Roosevelt Code"
              autoFocus
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Short note about this project"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
