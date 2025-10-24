// src/components/Planning/WorldBuilding/WorldBuildingPanel.tsx

import { Map, Plus, Filter, MapPin, Users, BookOpen } from 'lucide-react';
import React, { useReducer, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/toast';

import CultureCard from './CultureCard';
import LocationCard from './LocationCard';
import RuleCard from './RuleCard';
import { WorldItem, Location, Culture, Rule } from './types';
import { worldBuildingReducer } from './worldBuildingReducer';
import WorldFormModal from './WorldFormModal';

type FilterType = 'all' | 'location' | 'culture' | 'rule';

export default function WorldBuildingPanel() {
  const [state, dispatch] = useReducer(worldBuildingReducer, { items: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorldItem | undefined>(undefined);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { showToast } = useToast();

  const handleCreate = (item: WorldItem) => {
    if (editingItem) {
      dispatch({ type: 'UPDATE_ITEM', payload: item });
      showToast(`Updated ${item.type}: ${item.name}`, 'success');
    } else {
      dispatch({ type: 'ADD_ITEM', payload: item });
      showToast(`Created ${item.type}: ${item.name}`, 'success');
    }
    setModalOpen(false);
    setEditingItem(undefined);
  };

  const handleEdit = (item: WorldItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const item = state.items.find((i) => i.id === id);
    if (item && confirm(`Delete ${item.name}?`)) {
      dispatch({ type: 'DELETE_ITEM', payload: id });
      showToast(`Deleted ${item.type}: ${item.name}`, 'success');
    }
  };

  const handleOpenModal = () => {
    setEditingItem(undefined);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(undefined);
  };

  // Filter items
  const filteredItems =
    filterType === 'all' ? state.items : state.items.filter((item) => item.type === filterType);

  // Group items by type
  const locations = filteredItems.filter((item): item is Location => item.type === 'location');
  const cultures = filteredItems.filter((item): item is Culture => item.type === 'culture');
  const rules = filteredItems.filter((item): item is Rule => item.type === 'rule');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">World Building</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create and manage locations, cultures, and rules for your story world
            </p>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Element
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            All ({state.items.length})
          </button>
          <button
            onClick={() => setFilterType('location')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'location'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Locations ({locations.length})
          </button>
          <button
            onClick={() => setFilterType('culture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'culture'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Cultures ({cultures.length})
          </button>
          <button
            onClick={() => setFilterType('rule')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'rule'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Rules ({rules.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Map className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filterType === 'all' ? 'No world elements yet' : `No ${filterType}s created yet`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {filterType === 'all'
                  ? 'Start building your story world by adding locations, cultures, and rules that make your world unique.'
                  : `Create ${filterType}s to bring depth and richness to your story world.`}
              </p>
              <Button onClick={handleOpenModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add{' '}
                {filterType === 'all'
                  ? 'Element'
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              if (item.type === 'location') {
                return (
                  <LocationCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              }
              if (item.type === 'culture') {
                return (
                  <CultureCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              }
              if (item.type === 'rule') {
                return (
                  <RuleCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <WorldFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreate}
        editingItem={editingItem}
      />
    </div>
  );
}
