/**
 * AI Feature Badge Component
 *
 * Visual indicator showing whether a feature uses free AI or requires an API key
 */

import { Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import React from 'react';

import type { BadgeStatus } from '@/utils/aiFeatureClassification';

interface AiFeatureBadgeProps {
  status: BadgeStatus;
  className?: string;
  tooltip?: string;
}

export const AiFeatureBadge: React.FC<AiFeatureBadgeProps> = ({
  status,
  className = '',
  tooltip,
}) => {
  const config = {
    free: {
      icon: Sparkles,
      label: 'Free AI',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-600 dark:text-green-400',
      defaultTooltip: 'Uses built-in AI - no API key needed',
    },
    connected: {
      icon: CheckCircle2,
      label: 'Key Connected',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      defaultTooltip: 'Your API key is configured and ready',
    },
    locked: {
      icon: Lock,
      label: 'Requires Key',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      defaultTooltip: 'Requires your personal OpenAI or Anthropic key',
    },
    premium: {
      icon: Lock,
      label: 'Premium',
      bgColor:
        'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
      textColor: 'text-purple-700 dark:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
      defaultTooltip: 'Available with premium subscription',
    },
  }[status];

  const Icon = config.icon;
  const tooltipText = tooltip || config.defaultTooltip;

  return (
    <div
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-300 cursor-help ${config.bgColor} ${config.textColor} ${className}`}
      title={tooltipText}
    >
      <Icon size={12} className={`${config.iconColor} transition-colors duration-300`} />
      <span className="transition-opacity duration-300">{config.label}</span>
    </div>
  );
};

/**
 * Legend Component - Shows what the badge colors mean
 */
export const AiFeatureLegend: React.FC<{ hasKey: boolean }> = ({ hasKey }) => {
  return (
    <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 mb-6">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-green-600 dark:text-green-400" />
        <span>Free AI</span>
      </div>
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-blue-600 dark:text-blue-400" />
        <span>Requires API Key</span>
      </div>
      {hasKey && (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>API Key Connected</span>
        </div>
      )}
    </div>
  );
};
