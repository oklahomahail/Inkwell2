interface ProofreadStepProps {
  value: boolean;
  onChange: (include: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function ProofreadStep({ value, onChange, onNext, onBack, canProceed }: ProofreadStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Proofreading Options</h3>
        <p className="text-gray-600">
          Choose whether to include AI-powered proofreading suggestions with your export.
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={`cursor-pointer rounded-lg p-4 border transition-all ${
            value
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onChange(true)}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`w-4 h-4 border rounded-full flex items-center justify-center mt-1 ${
                value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}
            >
              {value && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Include Proofreading</h4>
              <p className="text-sm text-gray-600 mb-3">
                Generate a comprehensive proofreading report with suggestions for grammar, style,
                and readability improvements.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>✓ Grammar and spelling check</div>
                <div>✓ Style consistency analysis</div>
                <div>✓ Readability assessment</div>
                <div>✓ Tone and voice feedback</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`cursor-pointer rounded-lg p-4 border transition-all ${
            !value
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onChange(false)}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`w-4 h-4 border rounded-full flex items-center justify-center mt-1 ${
                !value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}
            >
              {!value && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Export Only</h4>
              <p className="text-sm text-gray-600">
                Export your manuscript without proofreading analysis for faster processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {value && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-1">AI Proofreading Note</h4>
              <p className="text-sm text-amber-700">
                Proofreading will add 1-2 minutes to your export time. The AI analysis provides
                suggestions, not automatic changes - you maintain full control over your content.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back: Style
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
          Next: Review
        </button>
      </div>
    </div>
  );
}
