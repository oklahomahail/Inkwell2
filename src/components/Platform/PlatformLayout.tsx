// src/components/Platform/PlatformLayout.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelConfig } from "./panelRegistry";
import { ChevronDown, ChevronRight } from "lucide-react";

interface LayoutProps {
  panels: PanelConfig[];
  activePanelId: string;
  onSwitchPanel: (id: string) => void;
  children: React.ReactNode;
}

/** Group panels into sections for better organization */
const groupPanels = (panels: PanelConfig[]) => ({
  core: panels.filter((p) =>
    ["dashboard", "writing", "timeline", "analysis"].includes(p.id)
  ),
  tools: panels.filter(
    (p) => !["dashboard", "writing", "timeline", "analysis"].includes(p.id)
  ),
});

const PlatformLayout: React.FC<LayoutProps> = ({
  panels,
  activePanelId,
  onSwitchPanel,
  children,
}) => {
  const [sectionsOpen, setSectionsOpen] = useState({ core: true, tools: true });
  const groups = groupPanels(panels);

  const toggleSection = (key: "core" | "tools") => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r p-4 space-y-4">
        {/* Core Section */}
        <div>
          <button
            onClick={() => toggleSection("core")}
            className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 font-semibold mb-2"
          >
            Core
            {sectionsOpen.core ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {sectionsOpen.core && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                {groups.core.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => onSwitchPanel(panel.id)}
                    className={`flex items-center w-full text-left px-3 py-2 rounded transition ${
                      activePanelId === panel.id
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {panel.icon}
                    {panel.title}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tools Section */}
        {groups.tools.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("tools")}
              className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Tools
              {sectionsOpen.tools ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {sectionsOpen.tools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {groups.tools.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => onSwitchPanel(panel.id)}
                      className={`flex items-center w-full text-left px-3 py-2 rounded transition ${
                        activePanelId === panel.id
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {panel.icon}
                      {panel.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </aside>

      {/* Main Panel with smooth transitions */}
      <main className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanelId}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PlatformLayout;
