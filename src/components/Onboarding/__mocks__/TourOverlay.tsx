// Mock TourOverlay for tests
import React from 'react';

export default function TourOverlay({ onClose, tourType }: any) {
  return (
    <div data-testid="tour-overlay-mock" data-tour-type={tourType}>
      Mock tour overlay
      <button onClick={onClose}>Close</button>
    </div>
  );
}
