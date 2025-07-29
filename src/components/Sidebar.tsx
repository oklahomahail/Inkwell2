import React from "react";
import { useAppContext, View } from "@/context/AppContext";

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const menuItems = [
    { label: "Dashboard", view: View.Dashboard },
    { label: "Writing", view: View.Writing },
    { label: "Timeline", view: View.Timeline },
    { label: "Analysis", view: View.Analysis },
    { label: "Settings", view: View.Settings },
  ];

  return (
    <aside className="w-64 bg-gray-200 dark:bg-gray-800 p-4 space-y-4">
      <h2 className="text-lg font-bold">Navigation</h2>
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.view}>
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: item.view })}
              className={`block w-full text-left px-4 py-2 rounded ${
                state.view === item.view
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
