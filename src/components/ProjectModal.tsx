// src/components/ProjectModal.tsx
import React, { useEffect, useRef, useState } from 'react';

interface ProjectModalProps {
  isOpen: boolean;
  initialName?: string;
  initialDescription?: string;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  initialName = '',
  initialDescription = '',
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    onCreate(name.trim(), description.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold leading-snug font-semibold mb-4 text-gray-900 dark:text-white">
          Start New Project
        </h2>

        <label className="block mb-4 text-gray-700 dark:text-gray-300">
          Project Name <span className="text-red-500">*</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter project name"
            className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="block mb-4 text-gray-700 dark:text-gray-300">
          Project Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add a description"
            className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            type="button"
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
