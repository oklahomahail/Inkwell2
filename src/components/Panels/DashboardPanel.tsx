import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useWritingPlatform } from "@/context/WritingPlatformProvider";

interface ProjectStats {
  wordCount: number;
  charCount: number;
  scenes: number;
  chapters: number;
  readingTime: number;
  lastUpdated: Date | null;
}

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
}

interface ProjectData {
  writingContent: { content: string; title: string } | null;
  timelineScenes: any[] | null;
  writingSessions: WritingSession[] | null;
  targetWordCount: number;
}

interface StatChipProps {
  icon: React.ReactNode;
  value: string;
  color?: string;
  bgColor?: string;
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  bgColor: string;
}

interface ActivityFeedProps {
  activities: Array<{
    type: string;
    description: string;
    timestamp: Date;
    icon: React.ReactNode;
    color: string;
  }>;
}

interface ProjectOverviewProps {
  stats: ProjectStats;
}

// Reusable streak calculation logic (same as AnalysisPanel)
const calculateWritingStreak = (sessions: WritingSession[]): number => {
  if (sessions.length === 0) return 0;
  
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (sortedSessions.length === 0) return 0;
  
  const mostRecentSession = new Date(sortedSessions[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(mostRecentSession);
  currentDate.setHours(0, 0, 0, 0);
  
  // Only count streak if the most recent session was within the last 2 days
  const daysSinceLastWrite = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastWrite > 1) return 0;
  
  // Count consecutive days backwards from most recent session
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
};

// Activity logger utility
const logActivity = (type: string, description: string) => {
  try {
    const stored = localStorage.getItem("recent_activities");
    const activities = stored ? JSON.parse(stored) : [];
    
    const newActivity = {
      type,
      description,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    };
    
    // Add to beginning and keep only last 20 activities
    activities.unshift(newActivity);
    const trimmedActivities = activities.slice(0, 20);
    
    localStorage.setItem("recent_activities", JSON.stringify(trimmedActivities));
  } catch (error) {
    console.warn("Failed to log activity", error);
  }
};

// StatChip Component
const StatChip: React.FC<StatChipProps> = ({ 
  icon, 
  value, 
  color = "text-gray-300", 
  bgColor = "bg-[#1A2233]" 
}) => (
  <div className={`flex items-center space-x-2 ${bgColor} px-3 py-2 rounded-lg border border-gray-700 transition-all hover:border-gray-600`}>
    <div className="text-[#0073E6]">{icon}</div>
    <span className={color}>{value}</span>
  </div>
);

// QuickActionCard Component
const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  color,
  bgColor
}) => (
  <button
    onClick={onClick}
    className={`p-6 ${bgColor} border border-gray-600 rounded-xl transition-all duration-200 hover:scale-105 hover:border-gray-500 text-left group`}
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className={`${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <p className="text-sm text-gray-300">{description}</p>
  </button>
);

// ActivityFeed Component
const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No recent activity</h3>
        <p className="text-gray-500">Start writing to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, 5).map((activity, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 bg-[#0F1419] rounded-lg hover:bg-[#151A21] transition-colors">
          <div className={`${activity.color} flex-shrink-0`}>
            {activity.icon}
          </div>
          <div className="flex-grow">
            <p className="text-gray-300">{activity.description}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ProjectOverview Component
const ProjectOverview: React.FC<ProjectOverviewProps> = ({ stats }) => (
  <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Scenes</span>
        <span className="text-white font-semibold">{stats.scenes}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Chapters</span>
        <span className="text-white font-semibold">{stats.chapters}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Reading Time</span>
        <span className="text-white font-semibold">{stats.readingTime}m</span>
      </div>
      {stats.lastUpdated && (
        <div className="pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            Last updated: {stats.lastUpdated.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  </div>
);

// Main DashboardPanel Component
const DashboardPanel: React.FC = () => {
  const { setActiveView } = useWritingPlatform();
  const [stats, setStats] = useState<ProjectStats>({
    wordCount: 0,
    charCount: 0,
    scenes: 0,
    chapters: 0,
    readingTime: 0,
    lastUpdated: null,
  });
  
  const [projectData, setProjectData] = useState<ProjectData>({
    writingContent: null,
    timelineScenes: null,
    writingSessions: null,
    targetWordCount: 80000,
  });
  
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("morning");

  // Determine time of day for personalized greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 17) setTimeOfDay("afternoon");
    else if (hour < 21) setTimeOfDay("evening");
    else setTimeOfDay("night");
  }, []);

  // Consolidated data loading function
  const loadAllData = useCallback(() => {
    try {
      // Load all localStorage data in one pass
      const writingData = localStorage.getItem("writing_content");
      const timelineData = localStorage.getItem("timeline_scenes");
      const sessionsData = localStorage.getItem("writing_sessions");
      const targetData = localStorage.getItem("target_word_count");
      const activitiesData = localStorage.getItem("recent_activities");

      const parsedWritingContent = writingData ? JSON.parse(writingData) : null;
      const parsedTimelineScenes = timelineData ? JSON.parse(timelineData) : [];
      const parsedSessions = sessionsData ? JSON.parse(sessionsData) : [];
      const parsedTarget = targetData ? parseInt(targetData) : 80000;
      const parsedActivities = activitiesData ? JSON.parse(activitiesData) : [];

      // Calculate stats from parsed data
      const content = parsedWritingContent?.content || "";
      const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
      const charCount = content.length;
      const scenes = parsedTimelineScenes.length;
      const chapters = Math.ceil(wordCount / 2500);
      const readingTime = Math.ceil(wordCount / 250);

      const newStats = {
        wordCount,
        charCount,
        scenes,
        chapters,
        readingTime,
        lastUpdated: wordCount > 0 ? new Date() : null,
      };

      setStats(newStats);
      setProjectData({
        writingContent: parsedWritingContent,
        timelineScenes: parsedTimelineScenes,
        writingSessions: parsedSessions,
        targetWordCount: parsedTarget,
      });

      // Load real activities with proper icons
      const formattedActivities = parsedActivities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
        icon: getActivityIcon(activity.type),
        color: getActivityColor(activity.type),
      }));

      setRecentActivities(formattedActivities);
    } catch (error) {
      console.warn("Failed to load dashboard data", error);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Activity icon helper
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "writing":
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>;
      case "timeline":
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>;
      case "analysis":
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>;
      default:
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "writing": return "text-blue-400";
      case "timeline": return "text-green-400";
      case "analysis": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  // Enhanced navigation with activity logging
  const navigateWithLogging = (view: string, activityDescription: string) => {
    setActiveView(view as any);
    logActivity(view, activityDescription);
  };

  // Quick actions with activity logging
  const quickActions = [
    {
      title: "Start Writing",
      description: "Continue your draft or start a new chapter",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>,
      action: () => navigateWithLogging("writing", "Opened writing panel"),
      color: "text-blue-400",
      bgColor: "bg-blue-500/20 hover:bg-blue-500/30",
    },
    {
      title: "Plan Timeline",
      description: "Organize scenes and story structure",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>,
      action: () => navigateWithLogging("timeline", "Opened timeline panel"),
      color: "text-green-400",
      bgColor: "bg-green-500/20 hover:bg-green-500/30",
    },
    {
      title: "View Analytics",
      description: "Track progress and writing insights",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      action: () => navigateWithLogging("analysis", "Viewed project analytics"),
      color: "text-purple-400",
      bgColor: "bg-purple-500/20 hover:bg-purple-500/30",
    },
  ];

  // Memoized calculations
  const writingStreak = useMemo(() => 
    calculateWritingStreak(projectData.writingSessions || []), 
    [projectData.writingSessions]
  );

  const todaysProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = projectData.writingSessions?.find(session => session.date === today);
    return todaySession ? todaySession.wordCount : 0;
  }, [projectData.writingSessions]);

  const dailyGoalProgress = useMemo(() => {
    const dailyGoal = Math.ceil(projectData.targetWordCount / 365); // Rough daily goal
    return todaysProgress > 0 ? Math.min((todaysProgress / dailyGoal) * 100, 100) : 0;
  }, [todaysProgress, projectData.targetWordCount]);

  const getGreeting = () => {
    const greetings = {
      morning: "Good morning! Ready to bring your story to life?",
      afternoon: "Good afternoon! Time to dive into your creative world.",
      evening: "Good evening! Perfect time for some focused writing.",
      night: "Burning the midnight oil? Your dedication inspires us!"
    };
    return greetings[timeOfDay];
  };

  // Show meaningful stats only if there's actual data
  const hasWritingData = stats.wordCount > 0;
  const hasWritingStreak = writingStreak > 0;
  const hasTodaysProgress = todaysProgress > 0;

  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 p-6 overflow-y-auto">
      {/* Header with Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back to Inkwell
        </h1>
        <p className="text-xl text-gray-300 mb-4">{getGreeting()}</p>
        
        {/* Conditional Quick Stats Bar */}
        {(hasWritingData || hasWritingStreak || hasTodaysProgress) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {hasWritingData && (
              <StatChip
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
                value={`${stats.wordCount.toLocaleString()} words`}
              />
            )}
            
            {hasWritingStreak && (
              <StatChip
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>}
                value={`${writingStreak} day streak`}
                color="text-orange-300"
              />
            )}
            
            {hasTodaysProgress && (
              <StatChip
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>}
                value={`${todaysProgress} words today`}
                color="text-green-300"
                bgColor="bg-green-900/30"
              />
            )}
          </div>
        )}

        {/* Daily Goal Progress Bar */}
        {hasTodaysProgress && dailyGoalProgress > 0 && (
          <div className="mt-4 p-3 bg-[#1A2233] rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">Today's Progress</span>
              <span className="text-sm text-gray-400">{Math.round(dailyGoalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                onClick={action.action}
                color={action.color}
                bgColor={action.bgColor}
              />
            ))}
          </div>
        </div>

        {/* Project Overview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
          <ProjectOverview stats={stats} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
          <ActivityFeed activities={recentActivities} />
        </div>
      </div>

      {/* Writing Tips */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Writing Inspiration</h2>
        <div className="bg-gradient-to-r from-[#1A2233] to-[#0F1829] rounded-xl p-6 border border-gray-700">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Daily Writing Tip</h3>
              <p className="text-gray-300 leading-relaxed">
                {timeOfDay === "morning" 
                  ? "Start your writing session by reviewing what you wrote yesterday. This helps maintain continuity and gets your creative mind back into the story flow."
                  : timeOfDay === "afternoon" 
                  ? "Afternoon writing sessions can be great for editing and refining. Use this time to polish scenes you drafted earlier."
                  : timeOfDay === "evening"
                  ? "Evening is perfect for planning tomorrow's writing. Review your timeline and decide which scenes to tackle next."
                  : "Late-night writing can be incredibly productive. The quiet hours often bring out your most creative thoughts."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the activity logger for use in other components
export { logActivity };
export default DashboardPanel;