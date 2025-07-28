// src/components/Platform/panelRegistry.ts
import React, { lazy } from "react";
import { LayoutDashboard, Edit3, Clock, BarChart3 } from "lucide-react";

export interface PanelConfig {
  id: string;
  title: string;
  group: string; // Group name for collapsible sections
  icon: React.ReactNode;  // ReactNode is safer than JSX.Element
  component: React.LazyExoticComponent<React.FC>;
}

// Lazy-loaded existing panels
const DashboardPanel = lazy(() => import("../Panels/DashboardPanel"));
const WritingPanel = lazy(() => import("../Panels/WritingPanel"));
const TimelinePanel = lazy(() => import("../Panels/TimelinePanel"));
const AnalysisPanel = lazy(() => import("../Panels/AnalysisPanel"));

export const panels: PanelConfig[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    group: "General",
    icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
    component: DashboardPanel,
  },
  {
    id: "writing",
    title: "Writing",
    group: "Writing Tools",
    icon: <Edit3 className="w-4 h-4 mr-2" />,
    component: WritingPanel,
  },
  {
    id: "timeline",
    title: "Timeline",
    group: "Writing Tools",
    icon: <Clock className="w-4 h-4 mr-2" />,
    component: TimelinePanel,
  },
  {
    id: "analysis",
    title: "Analysis",
    group: "General",
    icon: <BarChart3 className="w-4 h-4 mr-2" />,
    component: AnalysisPanel,
  },
];
