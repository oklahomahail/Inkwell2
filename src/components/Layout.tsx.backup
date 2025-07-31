import React from "react";
import { Link, useLocation } from "react-router-dom";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const tabs = [
    { label: "Writing", path: "/writing" },
    { label: "Timeline", path: "/timeline" },
    { label: "Analysis", path: "/analysis" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="flex gap-4 p-4 border-b bg-gray-100 dark:bg-gray-800">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${location.pathname === tab.path
              ? "bg-blue-600 text-white shadow-lg scale-105"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"}\`}
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
