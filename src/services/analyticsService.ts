// src/services/analyticsService.ts - Simplified version
export interface AnalyticsData {
  timestamp: number;
  eventType: string;
  data: any;
}

export function trackEvent(event: string, data?: any) {
  console.log('Analytics event:', event, data);
}

export function initializeAnalytics() {
  console.log('Analytics initialized');
}

export function getAnalyticsData(): AnalyticsData[] {
  return [];
}

export default {
  trackEvent,
  initializeAnalytics,
  getAnalyticsData,
};
