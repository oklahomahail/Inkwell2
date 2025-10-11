import React from 'react';
const AnalysisPanel: React.FC<{
  characterName: string;
  setCharacterName: (_name: string) => void;
  brainstormTopic: string;
  setBrainstormTopic: (_topic: string) => void;
  onQuickAction: (_action: string) => void;
  isLoading: boolean;
}> = ({
  characterName,
  _setCharacterName,
  _brainstormTopic,
  _setBrainstormTopic,
  _onQuickAction,
  _isLoading,
}) => {
  return (
    <div className="p-4 space-y-4">
      {' '}
      <div>
        {' '}
        <label className="block text-xs text-gray-500 font-medium text-gray-300 mb-2">
          {' '}
          Character Analysis{' '}
        </label>{' '}
        <div className="flex gap-2">
          {' '}
          <input
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Character name..."
            className="flex-1 px-2 py-1 text-xs text-gray-500 rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
          />{' '}
          <button
            onClick={() => onQuickAction('character-analysis')}
            disabled={isLoading || !characterName.trim()}
            className="px-3 py-1 text-xs text-gray-500 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {' '}
            Analyze{' '}
          </button>{' '}
        </div>{' '}
      </div>{' '}
      <div>
        {' '}
        <label className="block text-xs text-gray-500 font-medium text-gray-300 mb-2">
          {' '}
          Brainstorm Ideas{' '}
        </label>{' '}
        <div className="flex gap-2">
          {' '}
          <input
            value={brainstormTopic}
            onChange={(_e) => setBrainstormTopic(e.target.value)}
            placeholder="Topic to explore..."
            className="flex-1 px-2 py-1 text-xs text-gray-500 rounded bg-[#1A2233] border border-gray-700 text-gray-200 focus:outline-none focus:border-[#0073E6]"
          />{' '}
          <button
            onClick={() => onQuickAction('brainstorm')}
            disabled={isLoading || !brainstormTopic.trim()}
            className="px-3 py-1 text-xs text-gray-500 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
          >
            {' '}
            💭 Ideas{' '}
          </button>{' '}
        </div>{' '}
      </div>{' '}
      <div className="text-xs text-gray-500 text-gray-400 bg-gray-800 p-2 rounded">
        {' '}
        🔍 Advanced analysis tools that understand your full project context <br /> 💡 Tip: Use
        Ctrl+← → to switch tabs, or Ctrl+1/2/3{' '}
      </div>{' '}
    </div>
  );
};
export default AnalysisPanel;
