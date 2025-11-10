// src/components/Panels/OnboardingPanel.tsx
import { ArrowRight, CheckCircle, Clock, BookOpen } from 'lucide-react';
import React from 'react';

import { useTourContext } from '@/components/Tour/TourProvider';
import { Button } from '@/components/ui/Button';
import { useAppContext, View } from '@/context/AppContext';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import devLog from '@/utils/devLog';

export default function OnboardingPanel() {
  const { setView, setCurrentProjectId } = useAppContext();
  const tour = useTourContext();
  const { setTourActive, completeOnboarding } = useOnboardingGate();

  const handleStartTour = async () => {
    try {
      devLog.log('[OnboardingPanel] Starting tour flow...');

      // Track onboarding start
      try {
        const { track } = await import('@/services/telemetry');
        track('onboarding.started', { method: 'tour_panel', sample: 1 });
      } catch {
        // Ignore telemetry errors
      }

      // Create welcome project if needed
      const { ensureWelcomeProject } = await import('@/onboarding/welcomeProject');
      const projectId = await ensureWelcomeProject(true);
      devLog.log('[OnboardingPanel] Welcome project created:', projectId);

      // Set the welcome project as current project
      if (projectId) {
        setCurrentProjectId(projectId);
        devLog.log('[OnboardingPanel] Welcome project set as current:', projectId);
      }

      // Mark that a tour is active
      setTourActive(true);
      devLog.log('[OnboardingPanel] Tour active flag set');

      // Navigate to writing view
      setView(View.Writing);
      devLog.log('[OnboardingPanel] Switched to Writing view');

      // Mark onboarding as complete
      completeOnboarding();
      devLog.log('[OnboardingPanel] Onboarding marked complete');

      // Start the actual tour after a brief delay
      if (tour && projectId) {
        devLog.log('[OnboardingPanel] Attempting to start tour after 500ms delay...');
        setTimeout(() => {
          devLog.log('[OnboardingPanel] Calling tour.start("gettingStarted", true)...');
          const started = tour.start('gettingStarted', true);
          if (started) {
            devLog.log('[OnboardingPanel] ✓ Getting Started tour launched successfully');
          } else {
            devLog.warn('[OnboardingPanel] ✗ Failed to start tour - DOM elements may not be ready');
          }
        }, 500);
      } else {
        devLog.error('[OnboardingPanel] Tour or projectId not available:', {
          tour: !!tour,
          projectId,
        });
      }

      // Track onboarding completion
      try {
        const { track } = await import('@/services/telemetry');
        track('onboarding.completed', { method: 'tour_panel', sample: 1 });
      } catch {
        // Ignore telemetry errors
      }

      devLog.log('[OnboardingPanel] Tour flow completed');
    } catch (error) {
      devLog.error('[OnboardingPanel] Failed to start tour:', error);

      // Track onboarding failure
      try {
        const { track } = await import('@/services/telemetry');
        track('onboarding.failed', { method: 'tour_panel', error: String(error), sample: 1 });
      } catch {
        // Ignore telemetry errors
      }
    }
  };

  const handleSkipTour = () => {
    devLog.log('[OnboardingPanel] User skipped tour, navigating to dashboard');
    setView(View.Dashboard);
    completeOnboarding();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-3xl mx-auto py-16 px-6 space-y-10">
        {/* Heading */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <img
            src="/inkwell-icon.svg"
            alt="Inkwell"
            className="w-16 h-16 mx-auto mb-2 opacity-90 drop-shadow-sm"
          />
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
            Welcome to Inkwell
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Your professional writing companion — designed to help you write, plan, and grow your
            stories with confidence.
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Quick Tour Card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/50 space-y-4 transition-transform hover:scale-[1.02]">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-inkwell-navy/10 dark:bg-inkwell-navy/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-inkwell-navy dark:text-inkwell-gold" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                  Start the Quick Tour
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4">
                  Take a short walkthrough of the essential features — perfect for getting started
                  right away.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Create your first project</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Learn the interface</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Start writing</span>
                  </li>
                </ul>
                <Button
                  onClick={handleStartTour}
                  className="bg-inkwell-navy hover:bg-inkwell-navy/90 text-white w-full sm:w-auto"
                >
                  Start Tour
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>

          {/* Explore at Your Own Pace Card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/50 space-y-4 transition-transform hover:scale-[1.02]">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-inkwell-gold/10 dark:bg-inkwell-gold/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-inkwell-gold dark:text-inkwell-gold" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                  Explore at Your Own Pace
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4">
                  Prefer to learn organically? Access mini-tours, checklists, and tips anytime from
                  the Help menu.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Self-guided learning</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Mini-tours available</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Track your progress</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  onClick={handleSkipTour}
                  className="border-slate-300 dark:border-slate-600 w-full sm:w-auto"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </section>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            You can always reopen this tour from the Help menu in the top bar.
          </p>
        </div>
      </div>
    </div>
  );
}
