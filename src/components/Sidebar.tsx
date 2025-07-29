// src/components/Sidebar.tsx
import React from "react";
import { useAppContext, View } from "@/context/AppContext";

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleChangeView = (view: View) => {
    dispatch({ type: "SET_VIEW", payload: view });
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col min-h-screen p-4 space-y-4">
      <h1 className="text-xl font-bold">Inkwell</h1>

      <nav className="flex flex-col space-y-2">
        <button
          onClick={() => handleChangeView(View.Dashboard)}
          className={`px-3 py-2 rounded ${
            state.view === View.Dashboard ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleChangeView(View.Writing)}
          className={`px-3 py-2 rounded ${
            state.view === View.Writing ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          Writing
        </button>
        <button
          onClick={() => handleChangeView(View.Timeline)}
          className={`px-3 py-2 rounded ${
            state.view === View.Timeline ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => handleChangeView(View.Analysis)}
          className={`px-3 py-2 rounded ${
            state.view === View.Analysis ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => handleChangeView(View.Settings)}
          className={`px-3 py-2 rounded ${
            state.view === View.Settings ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          Settings
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
