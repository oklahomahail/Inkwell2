import { ExportFormat } from '@/exports/exportTypes';

interface ReviewStepProps {
  format: ExportFormat;
  style: string;
  includeProofread: boolean;
  onConfirm: () => void;
  onBack: () => void;
  error?: string | null;
  busy: boolean;
}

const styleLabels: Record<string, string> = {
  'classic-manuscript': 'Classic Manuscript',
  'modern-book': 'Modern Book',
  screenplay: 'Screenplay',
};

export function _ReviewStep({
  format,
  style,
  includeProofread,
  onConfirm,
  onBack,
  error,
  busy,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review Export Settings</h3>
        <p className="text-gray-600">
          Please review your export settings before generating your document.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900 mb-1">Export Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Export Summary</h4>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Format:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{format}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  format === 'PDF'
                    ? 'bg-blue-100 text-blue-800'
                    : format === 'DOCX'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                }`}
              >
                {format === 'PDF' ? 'Document' : format === 'DOCX' ? 'Editable' : 'E-book'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Style:</span>
            <span className="text-sm font-medium text-gray-900">{styleLabels[style] || style}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Proofreading:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {includeProofread ? 'Included' : 'Not included'}
              </span>
              {includeProofread && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  AI Analysis
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Export Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your export will include all chapters and scenes in your project</li>
              <li>• Formatting will be applied according to your selected style</li>
              <li>• The generated file will be ready for download in moments</li>
              {includeProofread && (
                <li>• Proofreading report will be generated alongside your document</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back: Proofread
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {busy ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Generate Export</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
