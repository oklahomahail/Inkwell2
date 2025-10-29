import React, { createContext, useCallback, useContext } from 'react';

import { tourConfig } from './tourConfig';

interface SpotlightContextValue {
  start: () => void;
  stop: () => void;
}

const SpotlightContext = createContext<SpotlightContextValue>({
  start: () => {},
  stop: () => {},
});

export const useSpotlightTour = () => useContext(SpotlightContext);

export const SpotlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stop = useCallback(() => {
    document.getElementById('spotlight-overlay')?.remove();
    document.getElementById('spotlight-tooltip')?.remove();
  }, []);

  const showStep = useCallback(
    (index: number) => {
      const step = tourConfig[index];
      if (!step) return stop();

      // Clean up prior overlays/tooltips
      document.getElementById('spotlight-overlay')?.remove();
      document.getElementById('spotlight-tooltip')?.remove();

      const target = document.querySelector(step.target) as HTMLElement | null;
      if (!target) {
        console.warn(`Missing anchor for step ${index}: ${step.target}`);
        stop();
        return;
      }

      const rect = target.getBoundingClientRect();
      const total = tourConfig.length;

      // --- Overlay highlight ---
      const overlay = document.createElement('div');
      overlay.id = 'spotlight-overlay';
      overlay.style.top = `${rect.top - 8}px`;
      overlay.style.left = `${rect.left - 8}px`;
      overlay.style.width = `${rect.width + 16}px`;
      overlay.style.height = `${rect.height + 16}px`;
      document.body.appendChild(overlay);

      // --- Tooltip content ---
      const tooltip = document.createElement('div');
      tooltip.id = 'spotlight-tooltip';
      tooltip.innerHTML = `
      <div class="spotlight-header">
        <p class="spotlight-text">${step.content}</p>
        <div class="spotlight-progress">Step ${index + 1} of ${total}</div>
      </div>
      <div class="spotlight-buttons">
        <button id="spotlight-next" class="spotlight-btn-next">
          ${index + 1 < total ? 'Next' : 'Finish'}
        </button>
        <button id="spotlight-skip" class="spotlight-btn-skip">Skip Tour</button>
      </div>
    `;
      document.body.appendChild(tooltip);

      // --- Position tooltip relative to target ---
      const spacing = 12;
      const tooltipRect = tooltip.getBoundingClientRect();
      let top = rect.bottom + spacing;
      let left = rect.left;

      if (top + tooltipRect.height > window.innerHeight) {
        top = rect.top - tooltipRect.height - spacing;
      }
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 20;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      // --- Button handlers ---
      const next = () => {
        document.getElementById('spotlight-overlay')?.remove();
        document.getElementById('spotlight-tooltip')?.remove();
        if (index + 1 < total) showStep(index + 1);
        else stop();
      };
      const skip = () => stop();

      tooltip.querySelector('#spotlight-next')?.addEventListener('click', next);
      tooltip.querySelector('#spotlight-skip')?.addEventListener('click', skip);

      // Optional keyboard shortcuts
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') next();
        if (e.key === 'Escape') skip();
      };
      document.addEventListener('keydown', handleKey, { once: true });
    },
    [stop],
  );

  const start = useCallback(() => {
    let tries = 0;
    const attempt = () => {
      const anchors = document.querySelectorAll('[data-spotlight-id]');
      if (anchors.length > 0) {
        showStep(0);
      } else if (tries++ < 10) setTimeout(attempt, 250);
      else console.warn('Spotlight: no anchors found after retries');
    };
    attempt();
  }, [showStep]);

  React.useEffect(() => {
    // Clean up overlays on unmount
    return () => {
      document.getElementById('spotlight-overlay')?.remove();
      document.getElementById('spotlight-tooltip')?.remove();
    };
  }, []);

  const value = { start, stop };
  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
};
