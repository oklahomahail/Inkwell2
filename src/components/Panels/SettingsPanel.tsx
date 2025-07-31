// src/components/Settings/SettingsPanel.tsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const SettingsPanel: React.FC = () => {
  const { theme, toggleTheme } = useAppContext(); // resetApp and setTheme not available

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div>
        <label className="block font-medium mb-1">Theme</label>
        <select
          value={theme}
          onChange={(e) => toggleTheme()}
          className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <button
        onClick={() => console.log("Reset functionality not available")}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Reset App
      </button>
    </div>
  );
};

export default SettingsPanel;
