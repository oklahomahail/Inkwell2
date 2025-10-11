import { useState } from 'react';

import { runExport } from '@/exports/exportController';
import { ExportFormat } from '@/exports/exportTypes';

import ExportReadyBadge from '../Badges/ExportReadyBadge';

import { DownloadCard } from './DownloadCard';
import { FormatStep } from './FormatStep';
import { ProgressBar } from './ProgressBar';
import { ProofreadStep } from './ProofreadStep';
import { ReviewStep } from './ReviewStep';
import { StyleStep } from './StyleStep';

interface ExportWizardProps {
  projectId: string;
  onClose?: () => void;
}

type WizardStep = 'format' | 'style' | 'proofread' | 'review' | 'processing' | 'download';

export default function ExportWizard({ projectId, onClose }: ExportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('format');
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [style, setStyle] = useState('classic-manuscript');
  const [includeProofread, setIncludeProofread] = useState(true);
  const [download, setDownload] = useState<{
    url: string;
    fileName: string;
    metadata?: any;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const steps: WizardStep[] = ['format', 'style', 'proofread', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'format':
        return format !== undefined;
      case 'style':
        return style !== undefined;
      case 'proofread':
        return true; // Always can proceed from proofread step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleExport = async () => {
    setProcessing(true);
    setCurrentStep('processing');
    setError(null);
    setProgress(0);

    try {
      // Create a job then run it
      const { createExportJob } = await import('@/exports/exportController');
      const job = createExportJob(projectId, format, style, includeProofread);
      const result = await runExport(job.id);

      setDownload({
        url: result.downloadUrl,
        fileName: result.fileName,
        metadata: result.metadata,
      });
      setCurrentStep('download');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setCurrentStep('review'); // Go back to review step on error
    } finally {
      setProcessing(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep('format');
    setDownload(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Project</h2>
            <p className="text-sm text-gray-600 mt-1">
              Professional export for publishing and sharing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportReadyBadge projectId={projectId} variant="badge" className="text-xs" />
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {currentStep !== 'download' && (
          <ProgressBar
            currentStep={currentStepIndex}
            totalSteps={steps.length}
            labels={['Format', 'Style', 'Proofread', 'Review']}
            processing={processing}
            progress={progress}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {currentStep === 'format' && (
          <FormatStep
            value={format}
            onChange={setFormat}
            onNext={nextStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'style' && (
          <StyleStep
            value={style}
            onChange={setStyle}
            selectedFormat={format}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'proofread' && (
          <ProofreadStep
            value={includeProofread}
            onChange={setIncludeProofread}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            format={format}
            style={style}
            includeProofread={includeProofread}
            onConfirm={handleExport}
            onBack={prevStep}
            error={error}
            busy={processing}
          />
        )}

        {currentStep === 'processing' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Exporting Your Project</h3>
            <p className="text-gray-600 mb-4">{progressMessage || 'Processing...'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{progress.toFixed(0)}% complete</p>
          </div>
        )}

        {currentStep === 'download' && download && (
          <DownloadCard
            url={download.url}
            fileName={download.fileName}
            metadata={download.metadata}
            onStartOver={resetWizard}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
