// src/types/tour.ts
export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  order: number;
  category: 'feature-discovery' | 'onboarding' | 'tips';
}

export type TourId = 'profile-tour' | 'feature-tour' | 'welcome-tour';
