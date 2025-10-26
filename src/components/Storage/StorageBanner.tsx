import { AlertTriangle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { getOriginInfo, shouldShowOriginWarning } from '@/utils/storage/originGuard';
import { isStoragePersisted } from '@/utils/storage/persistence';
import { isLikelyPrivateMode } from '@/utils/storage/privateMode';

interface StorageWarningState {
  privateMode: boolean;
  notPersisted: boolean;
  unexpectedOrigin: boolean;
  loading: boolean;
}

const DISMISS_KEY = 'inkwell:dismissStorageBanner';
const DISMISS_EXPIRY_DAYS = 7; // Show again after 7 days

/**
 * Banner that warns users about storage issues that could lead to data loss
 */
export function StorageBanner() {
  const [state, setState] = useState<StorageWarningState>({
    privateMode: false,
    notPersisted: false,
    unexpectedOrigin: false,
    loading: true,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was recently dismissed
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil) {
      const expiryTime = parseInt(dismissedUntil, 10);
      if (Date.now() < expiryTime) {
        setDismissed(true);
        setState((s) => ({ ...s, loading: false }));
        return;
      }
    }

    // Check storage health
    Promise.all([
      isLikelyPrivateMode(),
      isStoragePersisted(),
      Promise.resolve(shouldShowOriginWarning()),
    ])
      .then(([privateMode, persisted, unexpectedOrigin]) => {
        setState({
          privateMode,
          notPersisted: !persisted && !privateMode, // Don't double-warn
          unexpectedOrigin,
          loading: false,
        });
      })
      .catch((error) => {
        console.error('[StorageBanner] Failed to check storage health:', error);
        setState((s) => ({ ...s, loading: false }));
      });
  }, []);

  const handleDismiss = () => {
    const expiryTime = Date.now() + DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, expiryTime.toString());
    setDismissed(true);
  };

  if (state.loading || dismissed) {
    return null;
  }

  // Don't show if no warnings
  if (!state.privateMode && !state.notPersisted && !state.unexpectedOrigin) {
    return null;
  }

  // Determine severity and message
  let severity: 'critical' | 'warning' = 'warning';
  let messages: string[] = [];

  if (state.privateMode) {
    severity = 'critical';
    messages.push(
      "You're in a private/incognito window. Your work will be permanently deleted when you close all private windows.",
    );
  }

  if (state.notPersisted) {
    messages.push(
      'Browser storage is not persistent. Your data may be cleared if your device runs low on storage.',
    );
  }

  if (state.unexpectedOrigin) {
    const originInfo = getOriginInfo();
    messages.push(
      `You're on ${originInfo.current}. Data saved here is separate from ${originInfo.expected}.`,
    );
  }

  const bgColor =
    severity === 'critical' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30';
  const borderColor =
    severity === 'critical'
      ? 'border-red-200 dark:border-red-800'
      : 'border-amber-200 dark:border-amber-800';
  const textColor =
    severity === 'critical'
      ? 'text-red-900 dark:text-red-100'
      : 'text-amber-900 dark:text-amber-100';
  const iconColor = severity === 'critical' ? 'text-red-600' : 'text-amber-600';

  return (
    <div
      data-tour-id="storage-banner"
      className={`mb-4 rounded-lg border ${borderColor} ${bgColor} p-4 shadow-sm`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>
            {severity === 'critical' ? 'Data Loss Risk' : 'Storage Warning'}
          </h3>
          <div className={`mt-1 space-y-1 text-sm ${textColor}`}>
            {messages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
          {state.privateMode && (
            <div className="mt-3">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 ${severity === 'critical' ? 'text-red-700' : 'text-amber-700'}`}
              >
                Open in Normal Window
              </a>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/5 ${textColor}`}
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
