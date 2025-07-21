import React from "react";
import { useWritingPlatform, View } from "@/context/WritingPlatformProvider";

const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useWritingPlatform();

  const navItems: { id: View; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "writing", label: "Writing" },
    { id: "timeline", label: "Timeline" },
    { id: "analysis", label: "Analysis" },
  ];

  return (
    <nav className="flex flex-col h-full bg-[#0A0F1C] text-gray-300 p-4 space-y-2 shadow-md border-r border-gray-800">
      <h1 className="text-lg font-semibold text-white tracking-wide mb-4">Inkwell</h1>

      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`px-4 py-2 rounded-lg text-left transition-all duration-200 font-medium
            ${
              activeView === item.id
                ? "bg-[#0073E6] text-white shadow-lg"
                : "hover:bg-gray-800 hover:text-white"
            }`}
        >
          {item.label}
        </button>
      ))}

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-800 text-xs text-gray-500">
        Track15 Inspired • Dark Mode Ready
      </div>
    </nav>
  );
};

export default Sidebar;
