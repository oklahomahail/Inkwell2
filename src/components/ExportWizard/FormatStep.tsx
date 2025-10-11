import { ExportFormat } from '@/exports/exportTypes';

interface FormatStepProps {
  value: ExportFormat;
  onChange: (_format: ExportFormat) => void;
  onNext: () => void;
  canProceed: boolean;
}

const formatOptions = [
  {
    value: 'PDF' as ExportFormat,
    label: 'PDF Document',
    description: 'Professional document format, perfect for sharing and printing',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
    recommended: true,
  },
  {
    value: 'DOCX' as ExportFormat,
    label: 'Microsoft Word',
    description: 'Editable document format, compatible with Word and Google Docs',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
        <path d="M8 8l2 4 2-4M8 12l2-4 2 4" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    ),
    recommended: false,
  },
  {
    value: 'EPUB' as ExportFormat,
    label: 'EPUB E-book',
    description: 'E-book format for reading on tablets, e-readers, and mobile devices',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    recommended: false,
    experimental: true,
  },
];

export function _FormatStep({ value, onChange, onNext, canProceed }: FormatStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Export Format</h3>
        <p className="text-gray-600">Select the format for your exported manuscript.</p>
      </div>

      <div className="space-y-3">
        {formatOptions.map((option) => (
          <div
            key={option.value}
            className={`relative cursor-pointer rounded-lg p-4 border transition-all ${
              value === option.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onChange(option.value)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div
                  className={`p-2 rounded-lg ${
                    value === option.value
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {option.icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900">{option.label}</h4>
                  {option.recommended && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  )}
                  {option.experimental && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Experimental
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{option.description}</p>
              </div>

              <div className="flex-shrink-0">
                <div
                  className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                    value === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}
                >
                  {value === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Format Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>PDF</strong>: Best for final manuscripts and submissions
              </li>
              <li>
                • <strong>DOCX</strong>: Choose when you need to continue editing
              </li>
              <li>
                • <strong>EPUB</strong>: Perfect for e-book publishing platforms
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Choose Style
        </button>
      </div>
    </div>
  );
}
