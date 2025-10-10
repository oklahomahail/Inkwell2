import { ExportFormat } from '@/exports/exportTypes';

interface StyleStepProps {
  value: string;
  onChange: (style: string) => void;
  selectedFormat: ExportFormat;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

const styleOptions = [
  {
    id: 'classic-manuscript',
    label: 'Classic Manuscript',
    description: 'Traditional manuscript format with Times New Roman, double-spacing',
    preview: {
      font: 'Times New Roman',
      spacing: '2.0',
      margins: 'Standard',
    },
    recommended: true,
  },
  {
    id: 'modern-book',
    label: 'Modern Book',
    description: 'Contemporary book layout with Georgia font and balanced spacing',
    preview: {
      font: 'Georgia',
      spacing: '1.5',
      margins: 'Compact',
    },
    recommended: false,
  },
  {
    id: 'screenplay',
    label: 'Screenplay',
    description: 'Industry-standard screenplay formatting',
    preview: {
      font: 'Courier',
      spacing: '1.0',
      margins: 'Screenplay',
    },
    recommended: false,
    limitedTo: ['PDF', 'DOCX'] as ExportFormat[],
  },
];

export function StyleStep({
  value,
  onChange,
  selectedFormat,
  onNext,
  onBack,
  canProceed,
}: StyleStepProps) {
  const availableStyles = styleOptions.filter(
    (style) => !style.limitedTo || style.limitedTo.includes(selectedFormat),
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Style</h3>
        <p className="text-gray-600">
          Select the formatting style for your {selectedFormat} export.
        </p>
      </div>

      <div className="space-y-3">
        {availableStyles.map((option) => (
          <div
            key={option.id}
            className={`relative cursor-pointer rounded-lg p-4 border transition-all ${
              value === option.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onChange(option.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{option.label}</h4>
                  {option.recommended && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{option.description}</p>

                {/* Preview */}
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Font:</span>
                    <div className="font-medium">{option.preview.font}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Line Spacing:</span>
                    <div className="font-medium">{option.preview.spacing}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Margins:</span>
                    <div className="font-medium">{option.preview.margins}</div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                <div
                  className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                    value === option.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}
                >
                  {value === option.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Style Preview */}
      {value && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Style Preview</h4>
          <div className="bg-white border rounded p-4 text-sm">
            <div className="text-center mb-4">
              <div className="text-lg font-bold mb-1">Chapter Title</div>
              <div className="text-gray-600">Sample Chapter</div>
            </div>
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                This is how your manuscript text will appear in the selected style. The formatting
                includes proper spacing, font selection, and margin settings.
              </p>
              <div className="text-center py-2">***</div>
              <p>
                Scene breaks will be formatted according to your chosen style, maintaining
                readability and professional appearance throughout your document.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back: Format
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Proofread
        </button>
      </div>
    </div>
  );
}
