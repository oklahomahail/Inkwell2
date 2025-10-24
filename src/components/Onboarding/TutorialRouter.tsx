// src/components/Onboarding/TutorialRouter.tsx
import React from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';

import { useProfile } from '../../context/ProfileContext';

import { useTour } from './ProfileTourProvider';
import TourOverlay from './TourOverlay';
import { TOUR_MAP } from './tourRegistry';

/**
 * Tutorial page component that handles displaying tutorials with deep links
 */
function TutorialPage() {
  const { slug, step } = useParams<{ slug: string; step?: string }>();
  const { active: activeProfile } = useProfile();
  const { startTour, setTourSteps, goToStep, tourState } = useTour() as any;

  React.useEffect(() => {
    if (!slug || !activeProfile?.id) return;

    // Find the tutorial steps by slug
    const tourSteps = TOUR_MAP[slug as keyof typeof TOUR_MAP];
    if (!tourSteps) {
      console.warn(`Unknown tutorial slug: ${slug}`);
      return;
    }

    // Set up the tutorial
    setTourSteps(tourSteps, { goTo: 0 });

    // Determine tour type based on slug
    let tourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
    switch (slug) {
      case 'core-onboarding':
        tourType = 'full-onboarding';
        break;
      case 'writing-panel':
      case 'timeline-panel':
      case 'analytics-panel':
      case 'dashboard-panel':
        tourType = 'feature-tour';
        break;
      default:
        tourType = 'contextual-help';
    }

    // Start the tutorial if not already active
    if (!tourState?.isActive) {
      void startTour(tourType, tourSteps);
    }

    // Navigate to specific step if provided
    if (step && !isNaN(parseInt(step))) {
      const stepNumber = parseInt(step);
      if (stepNumber >= 0 && stepNumber < tourSteps.length) {
        goToStep(stepNumber);
      }
    }
  }, [slug, step, activeProfile?.id, startTour, setTourSteps, goToStep, tourState.isActive]);

  if (!activeProfile?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Profile Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting to dashboard...</p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  if (!slug) {
    return <TutorialIndex />;
  }

  const tourSteps = TOUR_MAP[slug as keyof typeof TOUR_MAP];
  if (!tourSteps) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Tutorial Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The tutorial "{slug}" could not be found.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tutorial overlay will be displayed by the TourProvider */}
      {tourState?.isActive && <TourOverlay />}

      {/* Tutorial content/preview could go here if needed */}
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              {tourSteps[0]?.title || 'Tutorial'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {tourSteps[0]?.description || 'Interactive tutorial is now active.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Steps in this tutorial:</h2>
                <ol className="list-decimal list-inside space-y-2">
                  {tourSteps.map((tStep, index) => (
                    <li
                      key={tStep.id}
                      className={`text-sm ${
                        tourState?.currentStep === index
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {tStep.title}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Tutorial Status:</h2>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Step: </span>
                    <span className="font-medium">
                      {(tourState?.currentStep ?? 0) + 1} of {tourSteps.length}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active: </span>
                    <span
                      className={`font-medium ${tourState?.isActive ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {tourState?.isActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completed Steps: </span>
                    <span className="font-medium">
                      {tourState?.completedSteps?.length ?? 0} / {tourSteps.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> The tutorial overlay will guide you through the steps. You
                can bookmark this URL to return to this specific tutorial and step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tutorial index page showing available tutorials
 */
function TutorialIndexComponent() {
  const { active: activeProfile } = useProfile();
  const { startTour, setTourSteps, preferences } = useTour() as any;

  const handleStartTutorial = async (slug: string) => {
    const tourSteps = TOUR_MAP[slug as keyof typeof TOUR_MAP];
    if (!tourSteps) return;

    setTourSteps(tourSteps);

    let tourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
    switch (slug) {
      case 'core-onboarding':
        tourType = 'full-onboarding';
        break;
      case 'writing-panel':
      case 'timeline-panel':
      case 'analytics-panel':
      case 'dashboard-panel':
        tourType = 'feature-tour';
        break;
      default:
        tourType = 'contextual-help';
    }

    await (startTour as any)(tourType, tourSteps);

    // Navigate to the dashboard (tutorials are now integrated)
    window.location.href = '/dashboard';
  };

  const tutorials = [
    {
      slug: 'core-onboarding',
      title: '🌟 Getting Started',
      description: 'Complete introduction to Inkwell - perfect for first-time users',
      duration: '90 seconds',
      steps: 8,
      category: 'Essential',
    },
    {
      slug: 'writing-panel',
      title: '✍️ Writing Tools',
      description: 'Discover the writing editor, AI assistant, and focus mode',
      duration: '60 seconds',
      steps: 4,
      category: 'Writing',
    },
    {
      slug: 'timeline-panel',
      title: '📚 Story Planning',
      description: 'Learn to organize chapters, characters, and plot structure',
      duration: '90 seconds',
      steps: 4,
      category: 'Planning',
    },
    {
      slug: 'analytics-panel',
      title: '📊 Progress Tracking',
      description: 'Track your writing habits and build productive routines',
      duration: '60 seconds',
      steps: 3,
      category: 'Analytics',
    },
    {
      slug: 'dashboard-panel',
      title: '🏠 Project Management',
      description: 'Manage multiple projects and see your recent activity',
      duration: '45 seconds',
      steps: 3,
      category: 'Organization',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Inkwell Tutorials
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              Interactive guides to help you master your writing workspace
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Profile: <span className="font-medium">{activeProfile?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => {
              const isCompleted =
                preferences?.completedTours.includes(tutorial.slug.replace('-panel', '')) ?? false;

              return (
                <div
                  key={tutorial.slug}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {tutorial.title}
                    </h3>
                    {isCompleted && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">{tutorial.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <span>{tutorial.duration}</span>
                    <span>•</span>
                    <span>{tutorial.steps} steps</span>
                    <span>•</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tutorial.category}
                    </span>
                  </div>

                  <button
                    onClick={() => handleStartTutorial(tutorial.slug)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
                  >
                    {isCompleted ? 'Review Tutorial' : 'Start Tutorial'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-2">
                💡 Pro Tip
              </h2>
              <p className="text-blue-700 dark:text-blue-300">
                Each tutorial is saved per profile, so your progress won't affect other workspaces.
                You can bookmark tutorial URLs to return to specific steps later!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main tutorial router component
 */
function TutorialRouterComponent() {
  return (
    <Routes>
      {/* Tutorial index */}
      <Route path="/" element={<TutorialIndex />} />

      {/* Specific tutorial */}
      <Route path=":slug" element={<TutorialPage />} />

      {/* Specific tutorial step */}
      <Route path=":slug/:step" element={<TutorialPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

// Local identifiers for internal components used in JSX
const TutorialIndex = TutorialIndexComponent;

// Named export
export const TutorialRouter = TutorialRouterComponent;
