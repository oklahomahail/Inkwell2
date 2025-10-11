// Base error classes for export system
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing',
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ExportValidationError extends ExportError {
  constructor(
    message: string,
    public readonly errors: string[],
  ) {
    super(message, 'VALIDATION_ERROR', 'assembling');
    this.name = 'ExportValidationError';
  }
}
