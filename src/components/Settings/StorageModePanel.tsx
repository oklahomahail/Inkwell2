// src/components/Settings/StorageModePanel.tsx
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

import { FEATURES } from '@/config/features';
import { localGateway } from '@/services/localGatewayImpl';
import { SyncService, type StorageMode } from '@/services/syncService';
import devLog from '@/utils/devLog';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
);

const sync = new SyncService(supabase, localGateway);

export interface StorageModePanelProps {
  projectId: string;
}

export default function StorageModePanel({ projectId }: StorageModePanelProps) {
  const [mode, setMode] = useState<StorageMode>('local');
  const [e2ee, setE2ee] = useState(false);
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [status, setStatus] = useState(sync.getContext());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll status every 2s when syncing
    const interval = setInterval(() => {
      setStatus(sync.getContext());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const apply = async () => {
    setError(null);
    setLoading(true);

    try {
      sync.setMode(mode);
      sync.setE2EE(e2ee);

      if (FEATURES.e2eeSync && e2ee && projectId && pass) {
        if (pass !== passConfirm) {
          throw new Error('Passphrases do not match');
        }
        if (pass.length < 12) {
          throw new Error('Passphrase must be at least 12 characters');
        }
        if (!understood) {
          throw new Error('You must acknowledge the risk');
        }

        await sync.ensureKeys(projectId, pass);
        const kit = sync.getRecoveryKit();
        if (kit) {
          // Download recovery kit
          const blob = new Blob([JSON.stringify(kit, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inkwell_recovery_kit_${projectId}.json`;
          a.click();
          URL.revokeObjectURL(url);

          devLog.log('[StorageModePanel] Recovery kit downloaded');
        }
      }

      setStatus(sync.getContext());
      devLog.log('[StorageModePanel] Settings applied:', { mode, e2ee });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      devLog.error('[StorageModePanel] Apply failed:', msg);
    } finally {
      setLoading(false);
    }
  };

  const backupNow = async () => {
    setError(null);
    setLoading(true);
    try {
      await sync.pushNow(projectId);
      setStatus(sync.getContext());
      devLog.log('[StorageModePanel] Backup complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      devLog.error('[StorageModePanel] Backup failed:', msg);
    } finally {
      setLoading(false);
    }
  };

  const restoreNow = async () => {
    setError(null);
    setLoading(true);
    try {
      await sync.pullNow(projectId);
      setStatus(sync.getContext());
      devLog.log('[StorageModePanel] Restore complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      devLog.error('[StorageModePanel] Restore failed:', msg);
    } finally {
      setLoading(false);
    }
  };

  const passStrength = calculatePasswordStrength(pass);

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="text-lg font-semibold mb-2">Storage Mode</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how your project data is stored and synced.
        </p>

        <div className="space-y-2">
          {(['local', 'hybrid', 'cloud'] as StorageMode[]).map((m) => (
            <label
              key={m}
              className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                checked={mode === m}
                onChange={() => setMode(m)}
                className="mt-1"
              />
              <div>
                <div className="font-medium capitalize">{m}</div>
                <div className="text-sm text-gray-500">
                  {m === 'local' && 'Device only (no cloud backup)'}
                  {m === 'hybrid' && 'Device + manual cloud backup'}
                  {m === 'cloud' && 'Automatic cloud sync (Beta)'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {FEATURES.e2eeSync && mode !== 'local' && (
        <div className="space-y-4 p-4 border border-amber-200 bg-amber-50 rounded">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={e2ee} onChange={(e) => setE2ee(e.target.checked)} />
            <span className="font-medium">Enable encrypted cloud backups</span>
          </label>

          {e2ee && (
            <div className="space-y-3 pl-6">
              <div>
                <label className="block text-sm font-medium mb-1">Set Passphrase</label>
                <input
                  type="password"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="At least 12 characters"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                {pass && (
                  <div className="mt-1 text-xs">
                    Strength: <PasswordStrengthBar strength={passStrength} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Passphrase</label>
                <input
                  type="password"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Re-enter passphrase"
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm space-y-2">
                <p className="font-semibold text-red-800">⚠️ Important</p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Keep your passphrase safe and secure</li>
                  <li>Losing your passphrase means losing access to encrypted data</li>
                  <li>Download and store the recovery kit when prompted</li>
                </ul>
                <label className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                  />
                  <span className="font-medium">I understand the risks</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 font-medium disabled:opacity-50"
          onClick={apply}
          disabled={loading}
        >
          {loading ? 'Applying...' : 'Apply Settings'}
        </button>

        {mode !== 'local' && (
          <>
            <button
              className="px-4 py-2 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium disabled:opacity-50"
              onClick={backupNow}
              disabled={loading || status.status === 'pending'}
            >
              Back up now
            </button>
            <button
              className="px-4 py-2 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-medium disabled:opacity-50"
              onClick={restoreNow}
              disabled={loading || status.status === 'pending'}
            >
              Restore
            </button>
          </>
        )}

        <StatusChip status={status.status} error={status.lastError} />
      </div>
    </div>
  );
}

function StatusChip({ status, error }: { status: string; error?: string }) {
  const styles = {
    synced: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
    idle: 'bg-slate-100 text-slate-800',
  };

  const color = styles[status as keyof typeof styles] || styles.idle;

  return (
    <span className={`px-3 py-1 rounded text-sm font-medium ${color}`} title={error || ''}>
      {status}
    </span>
  );
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const widthPct = ((strength + 1) / 4) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className={`h-full ${colors[strength]} transition-all`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className="text-xs font-medium">{labels[strength]}</span>
    </div>
  );
}

function calculatePasswordStrength(pass: string): number {
  if (pass.length < 8) return 0;
  if (pass.length < 12) return 1;

  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  const checks = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (checks >= 3 && pass.length >= 16) return 3;
  if (checks >= 2 && pass.length >= 12) return 2;
  return 1;
}
