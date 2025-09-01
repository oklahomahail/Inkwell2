// src/components/Platform/panelRegistry.ts
import { LayoutDashboard, Edit3, Clock, BarChart3 } from 'lucide-react';
import React, { lazy } from 'react';

export interface PanelConfig {
  id: string;
  title: string;
  group: string; // Group name for collapsible sections
  icon: React.ReactNode; // ReactNode is safer than JSX.Element
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  // Optional props that the component needs
  requiresProps?: boolean;
}

// Lazy-loaded existing panels - Fixed import paths
const DashboardPanel = lazy(() => import('../Panels/DashboardPanel'));
const WritingPanel = lazy(() => import('../Panels/WritingPanel'));
const TimelinePanel = lazy(() => import('../Panels/TimelinePanel'));
const AnalysisPanel = lazy(() => import('../Panels/AnalysisPanel'));

export const panels: PanelConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    group: 'General',
    icon: React.createElement(LayoutDashboard, { className: 'w-4 h-4 mr-2' }),
    component: DashboardPanel,
    requiresProps: false,
  },
  {
    id: 'writing',
    title: 'Writing',
    group: 'Writing Tools',
    icon: React.createElement(Edit3, { className: 'w-4 h-4 mr-2' }),
    component: WritingPanel,
    requiresProps: true, // WritingPanel needs props
  },
  {
    id: 'timeline',
    title: 'Timeline',
    group: 'Writing Tools',
    icon: React.createElement(Clock, { className: 'w-4 h-4 mr-2' }),
    component: TimelinePanel,
    requiresProps: false,
  },
  {
    id: 'analysis',
    title: 'Analysis',
    group: 'General',
    icon: React.createElement(BarChart3, { className: 'w-4 h-4 mr-2' }),
    component: AnalysisPanel,
    requiresProps: false,
  },
];

// Helper function to get panel by id
export const getPanelById = (id: string): PanelConfig | undefined => {
  return panels.find((panel) => panel.id === id);
};

// Helper function to get panels by group
export const getPanelsByGroup = (group: string): PanelConfig[] => {
  return panels.filter((panel) => panel.group === group);
};

// Get all unique groups
export const getPanelGroups = (): string[] => {
  return Array.from(new Set(panels.map((panel) => panel.group)));
};

// Render helper function for components that need props
export const renderPanel = (
  panelId: string,
  props?: Record<string, any>,
): React.ReactElement | null => {
  const panel = getPanelById(panelId);
  if (!panel) return null;

  const Component = panel.component;

  if (panel.requiresProps && props) {
    return React.createElement(Component, props);
  } else if (!panel.requiresProps) {
    return React.createElement(Component);
  }

  console.warn(`Panel ${panelId} requires props but none were provided`);
  return null;
};
