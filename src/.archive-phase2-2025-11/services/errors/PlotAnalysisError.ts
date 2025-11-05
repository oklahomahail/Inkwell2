export class PlotAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PlotAnalysisError';
  }
}

export class AnalysisConfigurationError extends PlotAnalysisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'AnalysisConfigurationError';
  }
}

export class AnalysisRuntimeError extends PlotAnalysisError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RUNTIME_ERROR', details);
    this.name = 'AnalysisRuntimeError';
  }
}
