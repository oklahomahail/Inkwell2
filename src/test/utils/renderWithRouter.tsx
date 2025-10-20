import React, { PropsWithChildren } from 'react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { render } from '@testing-library/react';

export function renderWithRouter(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    history = createMemoryHistory({ initialEntries }),
  }: { initialEntries?: string[]; history?: ReturnType<typeof createMemoryHistory> } = {},
) {
  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <Router location={history.location} navigator={history}>
      {children}
    </Router>
  );

  return { ...render(ui, { wrapper: Wrapper }), history };
}
