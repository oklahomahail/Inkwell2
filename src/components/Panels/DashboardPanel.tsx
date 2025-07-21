import React from "react";

const DashboardPanel: React.FC = () => {
  return (
    <div className="p-6 bg-[#0A0F1C] text-gray-200 rounded-lg shadow-md border border-gray-800 space-y-6 transition-all duration-300">
      <h2 className="text-2xl font-semibold text-white">Dashboard</h2>

      {/* Welcome Section */}
      <div className="p-5 bg-gray-900 rounded-lg shadow-sm border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-2">Welcome</h3>
        <p className="text-sm text-gray-400">
          Start by selecting <span className="text-[#0073E6] font-medium">Writing</span> to draft,
          <span className="text-[#0073E6] font-medium"> Timeline</span> to organize scenes,
          or <span className="text-[#0073E6] font-medium">Analysis</span> for word counts and AI insights.
        </p>
      </div>

      {/* Quick Stats Section */}
      <div className="p-5 bg-gray-900 rounded-lg shadow-sm border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-2">Quick Stats (Coming Soon)</h3>
        <p className="text-sm text-gray-500">
          Future versions will show live project metrics, recent edits, and export shortcuts here.
        </p>
      </div>
    </div>
  );
};

export default DashboardPanel;
