import React, { useEffect, useMemo } from 'react';

import { shouldShowTourPrompt, setPromptedThisSession } from './tourGating';

type Props = { onShow?: () => void };

export const TourPromptGate: React.FC<Props> = ({ onShow }) => {
  const show = useMemo(() => shouldShowTourPrompt(), []);

  useEffect(() => {
    if (show) {
      // mark right away so duplicate checks pass during the same render cycle
      setPromptedThisSession();
      onShow?.();
    }
  }, [show, onShow]);

  // This <div> is what the test queries:
  return <div data-testid="should-show-prompt">{String(show)}</div>;
};
