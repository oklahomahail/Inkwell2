import React from 'react';
import PlatformLayout from './components/Platform/PlatformLayout';
import DashboardPanel from './components/Panels/DashboardPanel';

const App: React.FC = () => {
  return (
    <PlatformLayout>
      <DashboardPanel />
    </PlatformLayout>
  );
};

export default App;
