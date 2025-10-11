// Specialized error fallback components for different panels and features
import {
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Clock,
  FileText,
  Image,
  Layers,
  Settings,
  PlusCircle,
} from 'lucide-react';
import React from 'react';

export interface PanelErrorProps {
  onRetry: () => void;
  onReportIssue?: () => void;
  errorId?: string;
}

export const PlotBoardErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[300px] flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <Layers className="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plot Board Unavailable</h3>
        <p className="text-gray-600 text-sm mb-4">
          The plot board couldn't load. This might be due to corrupted data or a temporary issue.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Plot Board
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

export const TimelineErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[300px] flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <Clock className="w-12 h-12 text-purple-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Unavailable</h3>
        <p className="text-gray-600 text-sm mb-4">
          The timeline view encountered an error. Your timeline data is safe.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Timeline
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

export const AnalyticsErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[300px] flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Unavailable</h3>
        <p className="text-gray-600 text-sm mb-4">
          Analytics couldn't load. Your data is still being tracked in the background.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Analytics
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

export const EditorErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[200px] flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <FileText className="w-12 h-12 text-orange-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Editor Error</h3>
        <p className="text-gray-600 text-sm mb-4">
          The text editor encountered an issue. Your content is automatically saved.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Editor
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

export const ImageErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[200px] flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Load Error</h3>
        <p className="text-gray-600 text-sm mb-4">
          This image couldn't be displayed. It may be corrupted or temporarily unavailable.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Load
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

export const SettingsErrorFallback: React.FC<PanelErrorProps> = ({
  onRetry,
  _onReportIssue,
  _errorId,
}) => (
  <div className="h-full min-h-[300px] flex items-center justify-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <Settings className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings Error</h3>
        <p className="text-gray-600 text-sm mb-4">
          Settings panel couldn't load. Your preferences are still saved.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Settings
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

// Generic panel error fallback for unknown panel types
export const GenericPanelErrorFallback: React.FC<
  PanelErrorProps & {
    panelName?: string;
  }
> = ({ onRetry, _onReportIssue, _errorId, _panelName = 'Panel' }) => (
  <div className="h-full min-h-[200px] flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <div className="relative">
          <PlusCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <AlertTriangle className="w-6 h-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{panelName} Error</h3>
        <p className="text-gray-600 text-sm mb-4">
          This panel encountered an error and couldn't load properly.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        {onReportIssue && (
          <button
            onClick={onReportIssue}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report Issue
          </button>
        )}
      </div>

      {errorId && <div className="mt-3 text-xs text-gray-400">Error ID: {errorId}</div>}
    </div>
  </div>
);

// Utility function to get the appropriate error fallback for a panel type
export function _getPanelErrorFallback(
  panelType: string,
  props: PanelErrorProps,
): React.ReactElement {
  switch (panelType.toLowerCase()) {
    case 'plotboard':
    case 'plot-board':
    case 'plots':
      return <PlotBoardErrorFallback {...props} />;

    case 'timeline':
      return <TimelineErrorFallback {...props} />;

    case 'analytics':
    case 'stats':
    case 'metrics':
      return <AnalyticsErrorFallback {...props} />;

    case 'editor':
    case 'text':
    case 'writing':
      return <EditorErrorFallback {...props} />;

    case 'image':
    case 'media':
    case 'picture':
      return <ImageErrorFallback {...props} />;

    case 'settings':
    case 'preferences':
    case 'config':
      return <SettingsErrorFallback {...props} />;

    default:
      return <GenericPanelErrorFallback {...props} panelName={panelType} />;
  }
}
