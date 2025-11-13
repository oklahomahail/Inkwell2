// src/types/autosaveWorker.ts
/**
 * Type definitions for autosaveWorker
 * Worker is located at: public/workers/autosaveWorker.js
 */

export interface AutosaveRequest {
  type: 'prepare';
  id: string;
  content: string;
  version: number;
  currentScenes?: any[];
}

export interface AutosavePrepareResponse {
  type: 'prepare-complete';
  id: string;
  preparedDoc: {
    id: string;
    content: string;
    version: number;
    scenes: any[];
    contentSize: number;
    checksum: string;
  };
  metrics: {
    duration: number;
    contentLength: number;
    sceneCount: number;
  };
}

export interface ErrorResponse {
  type: 'error';
  id: string;
  error: string;
}

export type WorkerResponse = AutosavePrepareResponse | ErrorResponse;
