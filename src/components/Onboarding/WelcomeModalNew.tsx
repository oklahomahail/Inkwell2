/**
 * WelcomeModal - First-run experience modal
 *
 * Simplified version that works with the new tour system.
 * Removed dependencies on TourProvider context.
 */

import { Clock, X, ArrowRight, CheckCircle, Lightbulb } from 'lucide-react';
import React, { useState } from 'react';

import { InkwellFeather } from '@/components/icons';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import analyticsService from '@/services/analyticsService';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onOpenChecklist: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onOpenChecklist,
}) => {
  const { snoozeModal, dismissModal } = useOnboardingGate();
  const [selectedOption, setSelectedOption] = useState<'tour' | 'checklist' | 'later' | 'never'>(
    'tour',
  );

  // Track dismissal count from localStorage
  const [dismissalCount] = useState(() => {
    try {
      const prefs = localStorage.getItem('inkwell-tour-progress-preferences');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        return parsed?.tourDismissals || 0;
      }
    } catch {}
    return 0;
  });

  if (!isOpen) return null;

  const handleStartTour = () => {
    // Track analytics
    try {
      analyticsService.trackEvent('welcome_modal_start_tour');
    } catch {}

    // Store hide preference
    try {
      localStorage.setItem('hideWelcome', 'true');
    } catch {}

    // Snooze modal for 7 days (will be set to completed when tour finishes)
    snoozeModal(7 * 24);

    // Close and trigger tour
    onClose();

    // Delay tour start to ensure modal is fully closed
    requestAnimationFrame(() => {
      onStartTour();
    });
  };

  const handleOpenChecklist = () => {
    try {
      analyticsService.trackEvent('welcome_modal_open_checklist');
    } catch {}

    onClose();
    onOpenChecklist();
  };

  const handleRemindLater = () => {
    try {
      analyticsService.trackEvent('welcome_modal_remind_later');
    } catch {}

    snoozeModal(24);
    onClose();
  };

  const handleNeverShow = () => {
    try {
      analyticsService.trackEvent('welcome_modal_never_show');
    } catch {}

    dismissModal();
    onClose();
  };

  const tourDuration = 2; // Estimated ~2 minutes for spotlight tour

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close welcome modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <InkwellFeather name="writing" size="lg" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Inkwell!</h1>
              <p className="text-white/90 text-sm">Your professional writing companion</p>
            </div>
          </div>

          <p className="text-white/90 leading-relaxed">
            Ready to start writing your next great story? Let us show you around so you can jump in
            with confidence and focus on what matters most—your words.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tour Option */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedOption === 'tour'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
            onClick={() => setSelectedOption('tour')}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'tour'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOption === 'tour' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Start the Quick Tour
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />~{tourDuration} min
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Interactive walkthrough of the essential features. Perfect for getting started
                  right away.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>✓ Create your first project</span>
                  <span>✓ Learn the interface</span>
                  <span>✓ Start writing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Option */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedOption === 'checklist'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
            onClick={() => setSelectedOption('checklist')}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'checklist'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOption === 'checklist' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Explore at Your Own Pace
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get a checklist of key features to discover when you're ready. Learn as you go.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>✓ Self-guided learning</span>
                  <span>✓ Mini-tours available</span>
                  <span>✓ Track progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Later Option */}
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedOption === 'later'
                ? 'border-slate-400 bg-slate-50 dark:bg-slate-700/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => setSelectedOption('later')}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'later'
                      ? 'border-slate-400 bg-slate-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOption === 'later' && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Remind me tomorrow
                </h3>
              </div>
            </div>
          </div>

          {/* Never Option */}
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedOption === 'never'
                ? 'border-slate-400 bg-slate-50 dark:bg-slate-700/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => setSelectedOption('never')}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'never'
                      ? 'border-slate-400 bg-slate-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOption === 'never' && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Don't show this again
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              You can always access tours from the Help menu
            </div>
            <div className="flex items-center gap-3">
              {selectedOption === 'tour' && (
                <button
                  onClick={handleStartTour}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Start Tour
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {selectedOption === 'checklist' && (
                <button
                  onClick={handleOpenChecklist}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  View Checklist
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}

              {selectedOption === 'later' && (
                <button
                  onClick={handleRemindLater}
                  className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Remind Tomorrow
                  <Clock className="w-4 h-4" />
                </button>
              )}

              {selectedOption === 'never' && (
                <button
                  onClick={handleNeverShow}
                  className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Got It
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Prior dismissals note */}
        {dismissalCount > 0 && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              <Lightbulb className="w-3 h-3" />
              We notice you've skipped the tour before. Taking it now can save you time later!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeModal;
