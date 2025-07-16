import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = React.useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onCreate(title);
      setTitle('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Create New Project</h3>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
          placeholder="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
