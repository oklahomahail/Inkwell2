// src/utils/analyticsUtils.ts
export function trackEvent(event: string, data?: any) {
  console.log("Analytics event:", event, data);
}

export function initializeAnalytics() {
  console.log("Analytics initialized");
}
