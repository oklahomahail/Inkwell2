import { useContext } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

export function useIsInRouter() {
  return !!useContext(NavigationContext);
}
