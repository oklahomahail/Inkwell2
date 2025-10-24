// src/components/Planning/WorldBuilding/LocationCard.tsx

import { MapPin, Edit3, Trash2 } from 'lucide-react';
import React from 'react';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { Location } from './types';

interface LocationCardProps {
  item: Location;
  onEdit: (_item: Location) => void;
  onDelete: (_id: string) => void;
}

export default function LocationCard({ item, onEdit, onDelete }: LocationCardProps) {
  return (
    <Card hover className="relative group">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit location"
          >
            <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete location"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
        {item.geography && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Geography: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.geography}</span>
          </div>
        )}
        {item.climate && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Climate: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.climate}</span>
          </div>
        )}
        {item.population && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Population: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.population}</span>
          </div>
        )}
        {item.significance && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Significance: </span>
            <span className="text-gray-700 dark:text-gray-300">{item.significance}</span>
          </div>
        )}
        {item.keyEvents && item.keyEvents.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400">Key Events: </span>
            <div className="mt-1 space-y-1">
              {item.keyEvents.map((event, idx) => (
                <div key={idx} className="text-gray-700 dark:text-gray-300 pl-2">
                  • {event}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
