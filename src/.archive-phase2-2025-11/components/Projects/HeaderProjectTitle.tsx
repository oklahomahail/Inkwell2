import { useState } from 'react';

import { Input } from '@/components/ui/Input';
import { useAppContext } from '@/context/AppContext';

export function HeaderProjectTitle({ projectId }: { projectId: string }) {
  const { state, updateProject } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const project = state.projects.find((p) => p.id === projectId);

  if (!project) return null;

  // Initialize name when entering edit mode
  const startEditing = () => {
    setName(project.name);
    setEditing(true);
  };

  const saveRename = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== project.name) {
      updateProject({
        ...project,
        name: trimmedName,
        updatedAt: Date.now(),
      });
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveRename();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveRename}
            className="h-8 w-80"
            autoFocus
          />
        </form>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{project.name}</h2>
          <button
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline"
            onClick={startEditing}
          >
            Rename
          </button>
        </>
      )}
    </div>
  );
}
