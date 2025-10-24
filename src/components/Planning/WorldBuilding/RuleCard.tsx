// src/components/Planning/WorldBuilding/RuleCard.tsx

import { Edit3, Trash2, Sparkles, Scale, Building2, FlaskConical, Coins } from 'lucide-react';
import React from 'react';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { Rule } from './types';

interface RuleCardProps {
  item: Rule;
  onEdit: (_item: Rule) => void;
  onDelete: (_id: string) => void;
}

const categoryConfig = {
  magic: {
    icon: Sparkles,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-300',
  },
  political: {
    icon: Scale,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
  },
  societal: {
    icon: Building2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
  },
  scientific: {
    icon: FlaskConical,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
  },
  economic: {
    icon: Coins,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
};

export default function RuleCard({ item, onEdit, onDelete }: RuleCardProps) {
  const config = categoryConfig[item.category];
  const IconComponent = config.icon;

  return (
    <Card hover className="relative group">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <IconComponent className={`w-5 h-5 ${config.color}`} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit rule"
          >
            <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete rule"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span
            className={`px-2 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium`}
          >
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
        {item.enforcement && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Enforcement: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.enforcement}</span>
          </div>
        )}
        {item.exceptions && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Exceptions: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.exceptions}</span>
          </div>
        )}
        {item.consequences && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Consequences: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.consequences}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
