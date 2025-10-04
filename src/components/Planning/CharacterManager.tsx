// src/components/Planning/CharacterManager.tsx
import { Users, Plus, Edit3, Trash2, Save, User, Heart, Target, Zap, Eye } from 'lucide-react';
import React, { useState } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  motivation: string;
  conflict: string;
  arc: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterManager: React.FC = () => {
  const { currentProject } = useAppContext();
  const { showToast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false);

  // Create new character
  const createCharacter = () => {
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: '',
      role: 'supporting',
      description: '',
      motivation: '',
      conflict: '',
      arc: '',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSelectedCharacter(newCharacter);
    setIsEditing(true);
    setShowNewCharacterForm(true);
  };

  // Save character
  const saveCharacter = () => {
    if (!selectedCharacter) return;

    if (showNewCharacterForm) {
      setCharacters([...characters, selectedCharacter]);
      setShowNewCharacterForm(false);
    } else {
      setCharacters(characters.map((c) => (c.id === selectedCharacter.id ? selectedCharacter : c)));
    }

    setIsEditing(false);
    showToast(`${selectedCharacter.name || 'Character'} saved`, 'success');
  };

  // Delete character
  const deleteCharacter = (characterId: string) => {
    if (confirm('Delete this character? This cannot be undone.')) {
      setCharacters(characters.filter((c) => c.id !== characterId));
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
      showToast('Character deleted', 'success');
    }
  };

  // Update selected character
  const updateCharacter = (updates: Partial<Character>) => {
    if (!selectedCharacter) return;

    setSelectedCharacter({
      ...selectedCharacter,
      ...updates,
      updatedAt: new Date(),
    });
  };

  // Role colors and icons
  const getRoleStyle = (role: Character['role']) => {
    switch (role) {
      case 'protagonist':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' };
      case 'antagonist':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
      case 'supporting':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/20',
        };
      case 'minor':
        return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-sm">Select a project to manage characters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-900">
      {/* Character List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-600 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Characters</h2>
            <button
              onClick={createCharacter}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              title="Add Character"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {characters.length} character{characters.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto">
          {characters.length === 0 ? (
            <div className="p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No characters yet</p>
              <button
                onClick={createCharacter}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                Create First Character
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {characters.map((character) => {
                const roleStyle = getRoleStyle(character.role);
                const isSelected = selectedCharacter?.id === character.id;

                return (
                  <div
                    key={character.id}
                    onClick={() => {
                      setSelectedCharacter(character);
                      setIsEditing(false);
                      setShowNewCharacterForm(false);
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors
                      ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {character.name || 'Unnamed Character'}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${roleStyle.bg} ${roleStyle.color}`}
                        >
                          {character.role}
                        </span>
                        {character.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {character.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Character Details */}
      <div className="flex-1 flex flex-col">
        {!selectedCharacter ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Character</h3>
              <p className="text-sm">Choose a character from the list to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Character Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCharacter.name || 'Unnamed Character'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${getRoleStyle(selectedCharacter.role).bg} ${getRoleStyle(selectedCharacter.role).color}`}
                    >
                      {selectedCharacter.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <button
                      onClick={saveCharacter}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deleteCharacter(selectedCharacter.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Character Details Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Character Name
                    </label>
                    <input
                      type="text"
                      value={selectedCharacter.name}
                      onChange={(e) => updateCharacter({ name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700"
                      placeholder="Character name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={selectedCharacter.role}
                      onChange={(e) =>
                        updateCharacter({ role: e.target.value as Character['role'] })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700"
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                </div>

                {/* Character Development Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Eye className="w-4 h-4 mr-2" />
                      Description
                    </label>
                    <textarea
                      value={selectedCharacter.description}
                      onChange={(e) => updateCharacter({ description: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                      placeholder="Physical appearance, personality traits, background..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Target className="w-4 h-4 mr-2" />
                      Motivation
                    </label>
                    <textarea
                      value={selectedCharacter.motivation}
                      onChange={(e) => updateCharacter({ motivation: e.target.value })}
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                      placeholder="What does this character want? What drives them?"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Zap className="w-4 h-4 mr-2" />
                      Conflict
                    </label>
                    <textarea
                      value={selectedCharacter.conflict}
                      onChange={(e) => updateCharacter({ conflict: e.target.value })}
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                      placeholder="What's stopping them? Internal/external obstacles?"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Heart className="w-4 h-4 mr-2" />
                      Character Arc
                    </label>
                    <textarea
                      value={selectedCharacter.arc}
                      onChange={(e) => updateCharacter({ arc: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                      placeholder="How does this character change throughout the story?"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Additional Notes
                    </label>
                    <textarea
                      value={selectedCharacter.notes}
                      onChange={(e) => updateCharacter({ notes: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                      placeholder="Backstory, relationships, quirks, speech patterns, etc."
                    />
                  </div>
                </div>

                {/* Quick Tips */}
                {isEditing && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Character Development Tips
                    </h4>
                    <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                      <li>• Give each character a clear want (external) and need (internal)</li>
                      <li>• Create believable flaws that create conflict</li>
                      <li>• Show character through actions, not just description</li>
                      <li>• Consider how they speak, move, and react under pressure</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterManager;
