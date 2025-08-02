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
  <button
    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
  >
    <span className="text-gray-500">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

export default Sidebar;
