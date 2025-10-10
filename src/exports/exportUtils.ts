// exportUtils.ts - Utility functions for export operations

import { ExportFormat } from './exportTypes';

/**
 * Sanitizes a string for use in filenames
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/_+/g, '_')      // Replace multiple underscores with single
    .trim()
    .substring(0, 100);       // Limit length
}

/**
 * Generates a professional filename for exports
 */
export function generateFileName(
  title: string, 
  format: ExportFormat, 
  author?: string
): string {
  const sanitizedTitle = sanitizeFileName(title) || 'Untitled';
  const sanitizedAuthor = author ? sanitizeFileName(author) : '';
  
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  let fileName = sanitizedTitle;
  
  // Add author if provided
  if (sanitizedAuthor) {
    fileName = `${sanitizedTitle}_by_${sanitizedAuthor}`;
  }
  
  // Add timestamp for uniqueness
  fileName = `${fileName}_${timestamp}`;
  
  // Add appropriate extension
  const extension = format.toLowerCase();
  fileName = `${fileName}.${extension}`;
  
  return fileName;
}

/**
 * Creates a download URL for a blob
 */
export async function createDownloadUrl(blob: Blob, fileName: string): Promise<string> {
  // In a real implementation, you might upload to a CDN or cloud storage
  // For now, we'll create a local blob URL
  const url = URL.createObjectURL(blob);
  
  // Store the mapping for cleanup later
  // In production, you'd want a proper cleanup mechanism
  if (typeof window !== 'undefined') {
    // Store in session storage for cleanup on page unload
    const downloadUrls = JSON.parse(sessionStorage.getItem('exportDownloadUrls') || '[]');
    downloadUrls.push({ url, fileName, createdAt: Date.now() });
    sessionStorage.setItem('exportDownloadUrls', JSON.stringify(downloadUrls));
  }
  
  return url;
}

/**
 * Cleans up old download URLs to prevent memory leaks
 */
export function cleanupDownloadUrls(): void {
  if (typeof window === 'undefined') return;
  
  const downloadUrls = JSON.parse(sessionStorage.getItem('exportDownloadUrls') || '[]');
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  const activeUrls = downloadUrls.filter((item: any) => {
    if (now - item.createdAt > maxAge) {
      // Revoke old URLs to free memory
      URL.revokeObjectURL(item.url);
      return false;
    }
    return true;
  });
  
  sessionStorage.setItem('exportDownloadUrls', JSON.stringify(activeUrls));
}

/**
 * Triggers a download for a blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Gets the MIME type for an export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'PDF':
      return 'application/pdf';
    case 'DOCX':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'EPUB':
      return 'application/epub+zip';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Estimates file size based on content and format
 */
export function estimateFileSize(wordCount: number, format: ExportFormat): number {
  // Rough estimates based on typical compression and formatting
  switch (format) {
    case 'PDF':
      return wordCount * 8; // ~8 bytes per word for PDF
    case 'DOCX':
      return wordCount * 12; // ~12 bytes per word for DOCX due to XML overhead
    case 'EPUB':
      return wordCount * 6; // ~6 bytes per word for EPUB due to compression
    default:
      return wordCount * 10;
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formats duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Validates export settings
 */
export function validateExportSettings(settings: {
  format: ExportFormat;
  style: string;
  includeProofread: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!settings.format) {
    errors.push('Export format is required');
  }
  
  if (!settings.style || settings.style.trim() === '') {
    errors.push('Style preset is required');
  }
  
  // Validate format-specific requirements
  switch (settings.format) {
    case 'EPUB':
      // EPUB has additional validation requirements
      break;
    default:
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Auto-cleanup setup for page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupDownloadUrls);
  
  // Also clean up on page load to handle any leftover URLs
  window.addEventListener('load', cleanupDownloadUrls);
}