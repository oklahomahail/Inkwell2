// src/components/Platform/PanelContainer.tsx
import React from "react";
import { PanelConfig } from "./panelRegistry";

interface PanelContainerProps {
  panel: PanelConfig;
}

const PanelContainer: React.FC<PanelContainerProps> = ({ panel }) => {
  const PanelComponent = panel.component;
  return (
    <div className="h-full w-full">
      <PanelComponent />
    </div>
  );
};

export default PanelContainer;
