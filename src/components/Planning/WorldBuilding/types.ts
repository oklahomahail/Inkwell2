// src/components/Planning/WorldBuilding/types.ts

export interface WorldElementBase {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location extends WorldElementBase {
  type: 'location';
  geography?: string;
  climate?: string;
  population?: string;
  keyEvents?: string[];
  charactersPresent?: string[];
  significance?: string;
}

export interface Culture extends WorldElementBase {
  type: 'culture';
  values?: string[];
  language?: string;
  customs?: string[];
  traditions?: string;
  socialStructure?: string;
}

export interface Rule extends WorldElementBase {
  type: 'rule';
  category: 'magic' | 'political' | 'societal' | 'scientific' | 'economic';
  enforcement?: string;
  exceptions?: string;
  consequences?: string;
}

export type WorldItem = Location | Culture | Rule;
