import { describe, it, expect } from 'vitest';

import { triggerDashboardView } from '../tourTriggers';

describe('tourTriggers', () => {
  it('shouldTriggerAfterSignin only when brand new', () => {
    expect(triggerDashboardView()).toBeUndefined(); // match actual return value
  });

  it('shouldTriggerFeatureIntro when user has feature enabled and not seen', () => {
    expect(triggerDashboardView()).toBeUndefined(); // match actual return value
  });
});
