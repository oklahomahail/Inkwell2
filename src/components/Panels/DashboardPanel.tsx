import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h3 className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {title}
    </h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
      {value}
    </p>
    {description && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>
    )}
  </div>
);

const DashboardPanel: React.FC = () => {
  // Placeholder metrics — replace with real data hooks later
  const stats = [
    { title: "Total Words", value: 12500, description: "Across all chapters" },
    { title: "Chapters", value: 8, description: "Tracked in your project" },
    { title: "Scenes", value: 24, description: "Mapped in Timeline" },
    { title: "Daily Streak", value: 6, description: "Days writing in a row" },
  ];

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Project Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <MetricCard key={idx} {...stat} />
        ))}
      </div>
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-md font-semibold mb-2">Progress Overview</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Track your writing sessions, chapter word counts, and project milestones here.
          More analytics and visualizations coming soon.
        </p>
      </div>
    </div>
  );
};

export default DashboardPanel;
