// src/components/Settings/SettingsPanel.tsx
import React from 'react';
import { useWritingPlatform } from '../../context/WritingPlatformProvider';

const SettingsPanel: React.FC = () => {
  const { resetApp, theme, setTheme } = useWritingPlatform();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div>
        <label className="block font-medium mb-1">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
          className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <button
        onClick={resetApp}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Reset App
      </button>
    </div>
  );
};

export default SettingsPanel;
