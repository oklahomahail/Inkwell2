// src/components/Planning/WorldBuilding/worldBuildingReducer.ts

import { WorldItem } from './types';

export interface WorldBuildingState {
  items: WorldItem[];
  selectedItem?: WorldItem;
}

export type WorldBuildingAction =
  | { type: 'ADD_ITEM'; payload: WorldItem }
  | { type: 'UPDATE_ITEM'; payload: WorldItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SELECT_ITEM'; payload?: WorldItem }
  | { type: 'LOAD_ITEMS'; payload: WorldItem[] };

export function worldBuildingReducer(
  state: WorldBuildingState,
  action: WorldBuildingAction,
): WorldBuildingState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.payload.id ? action.payload : i)),
        selectedItem:
          state.selectedItem?.id === action.payload.id ? action.payload : state.selectedItem,
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
        selectedItem: state.selectedItem?.id === action.payload ? undefined : state.selectedItem,
      };
    case 'SELECT_ITEM':
      return { ...state, selectedItem: action.payload };
    case 'LOAD_ITEMS':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}
