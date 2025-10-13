import { useContext } from 'react';
import { NavigationContext } from 'react-router-dom';

export function useIsInRouter() {
  return !!useContext(NavigationContext);
}
