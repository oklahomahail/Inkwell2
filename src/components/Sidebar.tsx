// src/components/Sidebar.tsx
import React from "react";
import { useAppContext, View } from "@/context/AppContext";

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const menuItems = [
    { view: View.Dashboard, label: "Dashboard" },
    { view: View.Writing, label: "Writing" },
    { view: View.Timeline, label: "Timeline" },
    { view: View.Settings, label: "Settings" },
  ];

  return (
<<<<<<< HEAD
    <aside className="w-56 bg-gray-100 dark:bg-gray-800 p-4 border-r border-gray-300 dark:border-gray-700">
      <h1 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Inkwell
      </h1>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => dispatch({ type: "SET_VIEW", payload: item.view })}
            className={`block w-full text-left px-3 py-2 rounded-md transition ${
              state.view === item.view
                ? "bg-blue-600 text-white"
                : "text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
=======
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        'md:w-64', // Always full width on md+
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
          IW
        </div>
        {!isCollapsed && <h1 className="text-lg font-semibold text-gray-800">Inkwell</h1>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-2">
        <SidebarItem icon={<Home size={20} />} label="Dashboard" collapsed={isCollapsed} />
        <SidebarItem icon={<Book size={20} />} label="Chapters" collapsed={isCollapsed} />
        <SidebarItem icon={<Settings size={20} />} label="Settings" collapsed={isCollapsed} />
>>>>>>> 50e9b09 (🔧 Final cleanup: Husky hooks, linting, Tailwind, and config updates)
      </nav>
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, collapsed }) => (
  <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
    <span className="text-gray-500">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

export default Sidebar;
