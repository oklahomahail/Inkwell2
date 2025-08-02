// src/components/Layout.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const tabs = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/writing", label: "Writing" },
    { path: "/timeline", label: "Timeline" },
    { path: "/analysis", label: "Analysis" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="flex gap-4 p-4 border-b bg-gray-100 dark:bg-gray-800">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === tab.path
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
};

export default Layout;