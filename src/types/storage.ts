// src/types/storage.ts
export interface StorageKey {
  type: 'simple' | 'spotlight' | 'feature';
  key: string;
}

// Keys for each tour type
export type TourType = 'simple' | 'spotlight';

export interface TourStorageData {
  // Common fields
  completed?: boolean;
  dismissed?: boolean;
  lastAutostartAt?: string;
  lastStartedAt?: string;
}

export interface SimpleTourData extends TourStorageData {
  // Simple tour specific data
}
