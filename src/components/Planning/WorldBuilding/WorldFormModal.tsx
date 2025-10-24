// src/components/Planning/WorldBuilding/WorldFormModal.tsx

import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';

import { WorldItem, Location, Culture, Rule } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (_item: WorldItem) => void;
  editingItem?: WorldItem;
}

export default function WorldFormModal({ open, onClose, onSubmit, editingItem }: Props) {
  const [type, setType] = useState<'location' | 'culture' | 'rule'>('location');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Location-specific fields
  const [geography, setGeography] = useState('');
  const [climate, setClimate] = useState('');
  const [population, setPopulation] = useState('');
  const [significance, setSignificance] = useState('');
  const [keyEvents, setKeyEvents] = useState('');

  // Culture-specific fields
  const [language, setLanguage] = useState('');
  const [traditions, setTraditions] = useState('');
  const [socialStructure, setSocialStructure] = useState('');
  const [values, setValues] = useState('');
  const [customs, setCustoms] = useState('');

  // Rule-specific fields
  const [category, setCategory] = useState<
    'magic' | 'political' | 'societal' | 'scientific' | 'economic'
  >('magic');
  const [enforcement, setEnforcement] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [consequences, setConsequences] = useState('');

  // Load editing data when modal opens
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setName(editingItem.name);
      setDescription(editingItem.description);

      if (editingItem.type === 'location') {
        setGeography(editingItem.geography || '');
        setClimate(editingItem.climate || '');
        setPopulation(editingItem.population || '');
        setSignificance(editingItem.significance || '');
        setKeyEvents(editingItem.keyEvents?.join('\n') || '');
      } else if (editingItem.type === 'culture') {
        setLanguage(editingItem.language || '');
        setTraditions(editingItem.traditions || '');
        setSocialStructure(editingItem.socialStructure || '');
        setValues(editingItem.values?.join(', ') || '');
        setCustoms(editingItem.customs?.join('\n') || '');
      } else if (editingItem.type === 'rule') {
        setCategory(editingItem.category);
        setEnforcement(editingItem.enforcement || '');
        setExceptions(editingItem.exceptions || '');
        setConsequences(editingItem.consequences || '');
      }
    } else {
      // Reset form when creating new
      resetForm();
    }
  }, [editingItem, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setGeography('');
    setClimate('');
    setPopulation('');
    setSignificance('');
    setKeyEvents('');
    setLanguage('');
    setTraditions('');
    setSocialStructure('');
    setValues('');
    setCustoms('');
    setEnforcement('');
    setExceptions('');
    setConsequences('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseItem = {
      id: editingItem?.id || `world_${Date.now()}`,
      name,
      description,
      createdAt: editingItem?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    let item: WorldItem;

    if (type === 'location') {
      item = {
        ...baseItem,
        type: 'location',
        geography: geography.trim() || undefined,
        climate: climate.trim() || undefined,
        population: population.trim() || undefined,
        significance: significance.trim() || undefined,
        keyEvents: keyEvents
          .split('\n')
          .map((e) => e.trim())
          .filter(Boolean),
      } as Location;
    } else if (type === 'culture') {
      item = {
        ...baseItem,
        type: 'culture',
        language: language.trim() || undefined,
        traditions: traditions.trim() || undefined,
        socialStructure: socialStructure.trim() || undefined,
        values: values
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        customs: customs
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean),
      } as Culture;
    } else {
      item = {
        ...baseItem,
        type: 'rule',
        category,
        enforcement: enforcement.trim() || undefined,
        exceptions: exceptions.trim() || undefined,
        consequences: consequences.trim() || undefined,
      } as Rule;
    }

    onSubmit(item);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingItem ? 'Edit' : 'Add'} World Element
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            <div className="px-6 py-4 space-y-4">
              {/* Type Selection */}
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Element Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'location' | 'culture' | 'rule')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="location">Location</option>
                    <option value="culture">Culture</option>
                    <option value="rule">Rule/System</option>
                  </select>
                </div>
              )}

              {/* Common Fields */}
              <div>
                <Input
                  label="Name"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe this element"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              {/* Location-specific fields */}
              {type === 'location' && (
                <>
                  <div>
                    <Input
                      label="Geography"
                      placeholder="Mountains, valleys, coastlines..."
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Climate"
                      placeholder="Tropical, temperate, arctic..."
                      value={climate}
                      onChange={(e) => setClimate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Population"
                      placeholder="~10,000 residents"
                      value={population}
                      onChange={(e) => setPopulation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Significance"
                      placeholder="Why is this location important?"
                      value={significance}
                      onChange={(e) => setSignificance(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key Events (one per line)
                    </label>
                    <textarea
                      placeholder="Major events that happened here..."
                      value={keyEvents}
                      onChange={(e) => setKeyEvents(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </>
              )}

              {/* Culture-specific fields */}
              {type === 'culture' && (
                <>
                  <div>
                    <Input
                      label="Language"
                      placeholder="Primary language spoken"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Traditions"
                      placeholder="Important cultural traditions"
                      value={traditions}
                      onChange={(e) => setTraditions(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Social Structure"
                      placeholder="How is society organized?"
                      value={socialStructure}
                      onChange={(e) => setSocialStructure(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Core Values (comma-separated)"
                      placeholder="Honor, loyalty, freedom..."
                      value={values}
                      onChange={(e) => setValues(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customs (one per line)
                    </label>
                    <textarea
                      placeholder="Cultural practices and customs..."
                      value={customs}
                      onChange={(e) => setCustoms(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </>
              )}

              {/* Rule-specific fields */}
              {type === 'rule' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Rule['category'])}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="magic">Magic System</option>
                      <option value="political">Political System</option>
                      <option value="societal">Societal Rules</option>
                      <option value="scientific">Scientific Laws</option>
                      <option value="economic">Economic System</option>
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Enforcement"
                      placeholder="How is this rule enforced?"
                      value={enforcement}
                      onChange={(e) => setEnforcement(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Exceptions"
                      placeholder="Are there any exceptions to this rule?"
                      value={exceptions}
                      onChange={(e) => setExceptions(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Consequences"
                      placeholder="What happens if this rule is broken?"
                      value={consequences}
                      onChange={(e) => setConsequences(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900">
              <Button variant="ghost" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
