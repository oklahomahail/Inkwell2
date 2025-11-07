// src/components/Onboarding/OnboardingPreferencesModal.tsx
import { ArrowRight, ArrowLeft, Cloud, HardDrive, BookOpen, Zap, Check } from 'lucide-react';
import React, { useState } from 'react';

import { InkwellFeather } from '@/components/icons';
import { useUserPreferences, StorageMode, WritingStyle } from '@/hooks/useUserPreferences';
import analyticsService from '@/services/analyticsService';

interface OnboardingPreferencesModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

type Step = 'storage' | 'writing-style' | 'complete';

export const OnboardingPreferencesModal: React.FC<OnboardingPreferencesModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('storage');
  const { storageMode, writingStyle, setStorageMode, setWritingStyle } = useUserPreferences();

  // Set defaults on mount if not already set
  React.useEffect(() => {
    if (isOpen && !storageMode) {
      setStorageMode('hybrid'); // Default to recommended option
    }
    if (isOpen && !writingStyle) {
      setWritingStyle('writer-first'); // Default to writer-first
    }
  }, [isOpen, storageMode, writingStyle, setStorageMode, setWritingStyle]);

  if (!isOpen) return null;

  const handleStorageSelect = (mode: StorageMode) => {
    setStorageMode(mode);
    try {
      analyticsService.trackEvent('onboarding_storage_selected', { mode });
    } catch {
      // ignore analytics errors
    }
  };

  const handleWritingStyleSelect = (style: WritingStyle) => {
    setWritingStyle(style);
    try {
      analyticsService.trackEvent('onboarding_writing_style_selected', { style });
    } catch {
      // ignore analytics errors
    }
  };

  const handleNextFromStorage = () => {
    if (!storageMode) return;
    setCurrentStep('writing-style');
  };

  const handleNextFromWritingStyle = () => {
    if (!writingStyle) return;
    setCurrentStep('complete');
    // Small delay for visual feedback, then complete
    setTimeout(() => {
      try {
        analyticsService.trackEvent('onboarding_preferences_completed', {
          storageMode,
          writingStyle,
        });
      } catch {
        // ignore analytics errors
      }
      onComplete();
    }, 800);
  };

  const handleBack = () => {
    if (currentStep === 'writing-style') {
      setCurrentStep('storage');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  currentStep === 'storage' ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
                }`}
              >
                {currentStep !== 'storage' ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-white text-sm font-medium">Storage</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/30 mx-3" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  currentStep === 'writing-style' || currentStep === 'complete'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/30 text-white'
                }`}
              >
                {currentStep === 'complete' ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-white text-sm font-medium">Style</span>
            </div>
          </div>
        </div>

        {/* Step: Storage Mode */}
        {currentStep === 'storage' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Choose Your Storage Mode
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Decide how and where your stories are saved
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              {/* Local-Only Option */}
              <button
                onClick={() => handleStorageSelect('local')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  storageMode === 'local'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Local-Only
                      </h3>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                        Privacy First
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      All your work stays on this device. Perfect for privacy-conscious writers who
                      don't need cloud sync.
                    </p>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>No account required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Works completely offline</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Maximum privacy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Hybrid Sync Option */}
              <button
                onClick={() => handleStorageSelect('hybrid')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  storageMode === 'hybrid'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Hybrid Sync
                      </h3>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Best of both worlds: local-first with optional cloud backup. Access your work
                      across devices.
                    </p>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span>Works offline, syncs when online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span>Access from multiple devices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span>Automatic cloud backup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNextFromStorage}
                disabled={!storageMode}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Writing Style */}
        {currentStep === 'writing-style' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                How Do You Like to Write?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                We'll customize your experience based on your workflow
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              {/* World-Builder Option */}
              <button
                onClick={() => handleWritingStyleSelect('world-builder')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  writingStyle === 'world-builder'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      World-Builder
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      I like to plan first. Characters, settings, and world details help me craft
                      better stories.
                    </p>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>Emphasis on planning tools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>Character and location tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>Timeline and world-building features</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Writer-First Option */}
              <button
                onClick={() => handleWritingStyleSelect('writer-first')}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  writingStyle === 'writer-first'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Writer-First
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      I like to dive right in. Give me a clean page and let me discover the story as
                      I write.
                    </p>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-amber-600" />
                        <span>Quick access to writing panel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-amber-600" />
                        <span>Minimal setup, maximum writing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-amber-600" />
                        <span>Focus mode and distraction-free tools</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNextFromWritingStyle}
                disabled={!writingStyle}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Complete Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Complete (Loading state) */}
        {currentStep === 'complete' && (
          <div className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <InkwellFeather name="check" size="xl" className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">All Set!</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Preparing your personalized experience...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPreferencesModal;
