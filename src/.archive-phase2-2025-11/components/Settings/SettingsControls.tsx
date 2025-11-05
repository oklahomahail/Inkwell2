import React from 'react';

import RelaunchTourButton from '../Onboarding/RelaunchTourButton';

export function _SettingsControls() {
  return (
    <div className="space-y-4">
      {/* Other settings controls would go here */}
      <div className="pt-4 border-t">
        <h3 className="text-sm font-semibold mb-2">Onboarding</h3>
        <RelaunchTourButton />
      </div>
    </div>
  );
}
