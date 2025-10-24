// src/components/Planning/WorldBuilding/CultureCard.tsx

import { Users, Edit3, Trash2 } from 'lucide-react';
import React from 'react';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { Culture } from './types';

interface CultureCardProps {
  item: Culture;
  onEdit: (_item: Culture) => void;
  onDelete: (_id: string) => void;
}

export default function CultureCard({ item, onEdit, onDelete }: CultureCardProps) {
  return (
    <Card hover className="relative group">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit culture"
          >
            <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete culture"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
        {item.language && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Language: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.language}</span>
          </div>
        )}
        {item.traditions && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Traditions: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.traditions}</span>
          </div>
        )}
        {item.socialStructure && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Social Structure: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.socialStructure}</span>
          </div>
        )}
        {item.values && item.values.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Values: </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {item.values.map((value, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}
        {item.customs && item.customs.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Customs: </span>
            <div className="mt-1 space-y-1">
              {item.customs.map((custom, idx) => (
                <div key={idx} className="text-gray-700 dark:text-gray-300 pl-2">
                  • {custom}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
