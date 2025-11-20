/**
 * IndexedDB DevTools Panel
 *
 * Development-only panel for inspecting IndexedDB schema and data.
 * Provides visual feedback on database health and allows exporting data.
 */

import React, { useEffect, useState } from 'react';

import { exportDatabasesToFile } from '@/qa/dbExport';
import type { FullIntrospectionReport } from '@/qa/dbIntrospection';
import { inspectAllDatabases } from '@/qa/dbIntrospection';
import { resetLocalDataForProject, resetAllLocalData } from '@/qa/dbReset';

interface Props {
  onClose?: () => void;
}

export const IndexedDbDevToolsPanel: React.FC<Props> = ({ onClose }) => {
  const [report, setReport] = useState<FullIntrospectionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Project reset state
  const [projectIdToReset, setProjectIdToReset] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await inspectAllDatabases();
      setReport(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleExportClick = async () => {
    try {
      setExporting(true);
      setError(null);
      await exportDatabasesToFile();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleResetProject = async () => {
    if (!projectIdToReset.trim()) return;

    try {
      setResetting(true);
      setResetStatus(null);
      setError(null);
      const { summary } = await resetLocalDataForProject(projectIdToReset.trim());
      setResetStatus(summary);
      // Refresh introspection after reset
      await refresh();
    } catch (err) {
      setResetStatus(`Error: ${(err as Error).message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleResetAll = async () => {
    if (
      !confirm(
        'DANGER: This will delete ALL local IndexedDB data and reload the page. This cannot be undone. Are you sure?',
      )
    ) {
      return;
    }

    try {
      setResetting(true);
      setError(null);
      await resetAllLocalData();
      // Reload the page after nuclear reset
      window.location.reload();
    } catch (err) {
      setError(`Reset all failed: ${(err as Error).message}`);
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="max-h-[90vh] w-[900px] overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">IndexedDB DevTools (Inkwell)</h2>
              <p className="text-xs text-slate-400">
                Schema introspection, record counts, export snapshot
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={loading}
                className="rounded-md border border-slate-500 px-3 py-1 text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                onClick={handleExportClick}
                disabled={exporting}
                className="rounded-md border border-emerald-500 px-3 py-1 text-xs hover:bg-emerald-600/20 disabled:opacity-50 transition-colors"
              >
                {exporting ? 'Exporting…' : 'Export DB JSON'}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-md border border-slate-500 px-3 py-1 text-xs hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Reset Controls */}
          <div className="mt-3 flex items-start gap-2 border-t border-slate-700 pt-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  className="w-64 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
                  placeholder="Project ID to reset local data"
                  value={projectIdToReset}
                  onChange={(e) => setProjectIdToReset(e.target.value)}
                  disabled={resetting}
                />
                <button
                  onClick={handleResetProject}
                  disabled={resetting || !projectIdToReset.trim()}
                  className="rounded-md border border-amber-500 px-3 py-1 text-xs text-amber-100 hover:bg-amber-900/40 disabled:opacity-50 transition-colors"
                >
                  {resetting ? 'Resetting…' : 'Reset Project'}
                </button>
              </div>
              {resetStatus && (
                <div className="mt-1 text-[11px] text-emerald-300">{resetStatus}</div>
              )}
            </div>
            <button
              onClick={handleResetAll}
              disabled={resetting}
              className="rounded-md border border-red-500 px-3 py-1 text-xs text-red-100 hover:bg-red-900/40 disabled:opacity-50 transition-colors"
            >
              Reset All DBs
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="border-b border-red-500/40 bg-red-950/40 px-4 py-2 text-xs text-red-200">
            Error: {error}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3 text-xs">
          {!report && !loading && <div className="text-slate-400">No data yet.</div>}

          {report &&
            report.databases.map((db) => (
              <div
                key={db.name}
                className="mb-4 rounded-md border border-slate-700 bg-slate-900/80"
              >
                {/* Database Header */}
                <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
                  <div>
                    <div className="font-semibold">
                      {db.name}{' '}
                      <span className="text-xs text-slate-400">
                        (expected v{db.expectedVersion}, actual {db.version ?? 'N/A'})
                      </span>
                    </div>
                    {db.error && (
                      <div className="text-[11px] text-red-300">DB error: {db.error}</div>
                    )}
                  </div>
                  <div
                    className={`rounded-full px-2 py-[2px] text-[10px] ${
                      db.ok
                        ? 'bg-emerald-900/60 text-emerald-200'
                        : 'bg-amber-900/60 text-amber-200'
                    }`}
                  >
                    {db.ok ? 'OK' : 'Issues detected'}
                  </div>
                </div>

                {/* Stores Table */}
                <div className="px-3 py-2">
                  {db.stores.length === 0 ? (
                    <div className="text-slate-400">No stores introspected for this DB.</div>
                  ) : (
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-300">
                          <th className="py-1 text-left">Store</th>
                          <th className="py-1 text-right">Count</th>
                          <th className="py-1 text-left">Status</th>
                          <th className="py-1 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {db.stores.map((store) => (
                          <tr key={store.name} className="border-t border-slate-800">
                            <td className="py-1 align-top font-mono">{store.name}</td>
                            <td className="py-1 align-top text-right">
                              {store.exists ? (store.count ?? 'N/A') : '—'}
                            </td>
                            <td className="py-1 align-top">
                              {store.exists ? (
                                <span className="rounded-full bg-emerald-900/40 px-2 py-[1px] text-[10px] text-emerald-200">
                                  exists
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-900/40 px-2 py-[1px] text-[10px] text-red-200">
                                  missing
                                </span>
                              )}
                            </td>
                            <td className="py-1 align-top text-slate-300">{store.error ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Unexpected Stores Warning */}
                  {db.unexpectedStores.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-700/60 bg-amber-900/30 px-3 py-2">
                      <div className="text-[11px] font-semibold text-amber-200">
                        ⚠️ Unexpected stores detected (not in schema):
                      </div>
                      <ul className="mt-1 list-disc pl-5 text-[11px] text-amber-100">
                        {db.unexpectedStores.map((name) => (
                          <li key={name} className="font-mono">
                            {name}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-[10px] text-amber-200/80">
                        These stores exist in the database but are not defined in the schema
                        registry. They may be leftovers from old migrations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Footer with Summary Stats */}
        {report && (
          <div className="border-t border-slate-700 px-4 py-2 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <div>
                Total: {report.databases.length} database
                {report.databases.length !== 1 ? 's' : ''},{' '}
                {report.databases.reduce((sum, db) => sum + db.stores.length, 0)} store
                {report.databases.reduce((sum, db) => sum + db.stores.length, 0) !== 1 ? 's' : ''}
              </div>
              <div>
                {report.databases.filter((db) => db.ok).length} / {report.databases.length}{' '}
                databases healthy
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
