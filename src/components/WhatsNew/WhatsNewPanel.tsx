// src/components/WhatsNew/WhatsNewPanel.tsx - Feature announcement panel

import { X, Users, Shield, Repeat, Zap } from 'lucide-react';
import React from 'react';

import { useWhatsNewDismissal } from './useWhatsNewDismissal';

interface WhatsNewPanelProps {
  className?: string;
}

export function WhatsNewPanel({ className = '' }: WhatsNewPanelProps) {
  const { isDismissed, dismissWhatsNew } = useWhatsNewDismissal();

  if (isDismissed) {
    return null;
  }

  const features = [
    {
      icon: Users,
      title: 'Multi-Profile Workspaces',
      description: 'Create separate profiles for different projects or writing contexts',
    },
    {
      icon: Shield,
      title: 'Complete Data Isolation',
      description: 'Each profile maintains completely separate data with zero leakage',
    },
    {
      icon: Repeat,
      title: 'Seamless Profile Switching',
      description: 'Switch between profiles instantly via the header dropdown',
    },
    {
      icon: Zap,
      title: 'Legacy Data Migration',
      description: 'Your existing projects are safely migrated to your first profile',
    },
  ];

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">What's New</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">v1.2.0</p>
            </div>
          </div>
          <button
            onClick={dismissWhatsNew}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              🎉 Introducing Multi-Profile System
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Organize your writing with completely isolated workspaces
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your data has been safely migrated
              </p>
              <button
                onClick={dismissWhatsNew}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
