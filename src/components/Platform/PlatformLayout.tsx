import React from "react";
import { PanelConfig } from "./panelRegistry";

interface LayoutProps {
  panels: PanelConfig[];
  activePanelId: string;
  onSwitchPanel: (id: string) => void;
  children: React.ReactNode;
}

const PlatformLayout: React.FC<LayoutProps> = ({
  panels,
  activePanelId,
  onSwitchPanel,
  children,
}) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-100 dark:bg-gray-900 border-r p-4 space-y-3">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => onSwitchPanel(panel.id)}
            className={`block w-full text-left px-3 py-2 rounded ${
              activePanelId === panel.id
                ? "bg-blue-500 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {panel.title}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
};

export default PlatformLayout;
