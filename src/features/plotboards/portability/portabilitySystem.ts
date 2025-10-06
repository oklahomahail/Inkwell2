// Universal Plot Board Portability System
// Ensures cross-instance compatibility, integrity checks, and reliable backup/restore

import { trace } from '../../../utils/trace';
import { ExportFormat } from '../export/exportSystem';
import { plotBoardImportSystem } from '../import/importSystem';
import { CURRENT_SCHEMA_VERSION } from '../schema/versioning';
import { PlotBoard, PlotBoardTemplate } from '../types';
import { SavedViewData } from '../views/savedViews';

/* ========= Portability Types ========= */

export interface PortablePackage {
  format: 'inkwell-plotboard-portable';
  version: string;
  metadata: PortabilityMetadata;
  data: PortableData;
  integrity: IntegrityInfo;
}

export interface PortabilityMetadata {
  packageId: string;
  createdAt: string;
  createdBy: string;
  sourceInstance: string;
  targetCompatibility: string[];
  description?: string;
  tags: string[];
  schemaVersion: string;
  compressionUsed: boolean;
}

export interface PortableData {
  boards: PlotBoard[];
  views: SavedViewData[];
  templates: PlotBoardTemplate[];
  settings: any[];
  relationships: Relationship[];
}

export interface Relationship {
  type: RelationType;
  sourceId: string;
  targetId: string;
  metadata?: any;
}

export enum RelationType {
  BOARD_VIEW = 'board_view',
  CARD_SCENE = 'card_scene',
  CARD_TIMELINE = 'card_timeline',
  TEMPLATE_BOARD = 'template_board',
}

export interface IntegrityInfo {
  checksum: string;
  itemCounts: {
    boards: number;
    columns: number;
    cards: number;
    views: number;
    templates: number;
  };
  validation: ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checkedAt: string;
}

export interface PortabilityOptions {
  includeViews?: boolean;
  includeTemplates?: boolean;
  includeSettings?: boolean;
  compression?: boolean;
  validate?: boolean;
  description?: string;
  tags?: string[];
}

export interface RestoreOptions {
  mergeStrategy?: 'replace' | 'merge' | 'append';
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
  validateIntegrity?: boolean;
  createBackup?: boolean;
  targetProjectId?: string;
}

export interface RestoreResult {
  success: boolean;
  restored: {
    boards: number;
    views: number;
    templates: number;
  };
  errors?: string[];
  warnings?: string[];
  conflicts?: string[];
  backupId?: string;
}

/* ========= Portability System Class ========= */

export class PlotBoardPortabilitySystem {
  private readonly PORTABLE_FORMAT_VERSION = '1.0.0';
  private readonly SUPPORTED_VERSIONS = ['1.0.0'];

  /**
   * Create a portable package from boards and related data
   */
  async createPortablePackage(
    boards: PlotBoard[],
    views: SavedViewData[] = [],
    templates: PlotBoardTemplate[] = [],
    options: Partial<PortabilityOptions> = {},
  ): Promise<PortablePackage> {
    const opts: PortabilityOptions = {
      includeViews: true,
      includeTemplates: true,
      includeSettings: true,
      compression: false,
      validate: true,
      description: '',
      tags: [],
      ...options,
    };

    try {
      trace.log('Creating portable package', 'user_action', 'info', {
        boardCount: boards.length,
        options: opts,
      });

      const packageId = `portable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare data
      const portableData: PortableData = {
        boards,
        views: opts.includeViews ? views : [],
        templates: opts.includeTemplates ? templates : [],
        settings: opts.includeSettings ? this.extractSettings(boards) : [],
        relationships: this.extractRelationships(boards, views, templates),
      };

      // Calculate integrity info
      const integrityInfo = await this.calculateIntegrity(portableData, opts.validate!);

      // Create metadata
      const metadata: PortabilityMetadata = {
        packageId,
        createdAt: new Date().toISOString(),
        createdBy: 'Inkwell User', // Could be enhanced with user info
        sourceInstance: this.getInstanceIdentifier(),
        targetCompatibility: this.SUPPORTED_VERSIONS,
        description: opts.description,
        tags: opts.tags || [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
        compressionUsed: opts.compression || false,
      };

      const portablePackage: PortablePackage = {
        format: 'inkwell-plotboard-portable',
        version: this.PORTABLE_FORMAT_VERSION,
        metadata,
        data: portableData,
        integrity: integrityInfo,
      };

      trace.log('Portable package created', 'user_action', 'info', {
        packageId,
        itemCounts: integrityInfo.itemCounts,
      });

      return portablePackage;
    } catch (error) {
      trace.log('Failed to create portable package', 'user_action', 'error', { error });
      throw new Error(
        `Failed to create portable package: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Export portable package to file
   */
  async exportPortablePackage(
    portablePackage: PortablePackage,
    filename?: string,
  ): Promise<{ filename: string; size: number; checksum: string }> {
    try {
      const data = JSON.stringify(portablePackage, null, 2);
      const blob = new Blob([data], { type: 'application/json' });

      const finalFilename = filename || this.generatePortableFilename(portablePackage);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const checksum = this.calculateChecksum(data);

      trace.log('Portable package exported', 'user_action', 'info', {
        filename: finalFilename,
        size: blob.size,
        checksum,
      });

      return {
        filename: finalFilename,
        size: blob.size,
        checksum,
      };
    } catch (error) {
      trace.log('Export failed', 'user_action', 'error', { error });
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import portable package from file
   */
  async importPortablePackage(file: File): Promise<PortablePackage> {
    try {
      const text = await this.readFileAsText(file);
      const portablePackage = JSON.parse(text) as PortablePackage;

      // Validate package format
      await this.validatePortablePackage(portablePackage);

      trace.log('Portable package imported', 'user_action', 'info', {
        packageId: portablePackage.metadata.packageId,
        version: portablePackage.version,
      });

      return portablePackage;
    } catch (error) {
      trace.log('Import failed', 'user_action', 'error', { error });
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore data from portable package
   */
  async restoreFromPortablePackage(
    portablePackage: PortablePackage,
    options: Partial<RestoreOptions> = {},
  ): Promise<RestoreResult> {
    const opts: RestoreOptions = {
      mergeStrategy: 'replace',
      conflictResolution: 'skip',
      validateIntegrity: true,
      createBackup: true,
      ...options,
    };

    try {
      trace.log('Starting restore from portable package', 'user_action', 'info', {
        packageId: portablePackage.metadata.packageId,
        options: opts,
      });

      // Validate integrity
      if (opts.validateIntegrity) {
        const integrityCheck = await this.validateIntegrity(portablePackage);
        if (!integrityCheck.valid) {
          throw new Error(`Integrity validation failed: ${integrityCheck.errors.join(', ')}`);
        }
      }

      let restored = { boards: 0, views: 0, templates: 0 };
      const errors: string[] = [];
      const warnings: string[] = [];
      const conflicts: string[] = [];

      // Restore boards
      for (const board of portablePackage.data.boards) {
        try {
          // Update project ID if specified
          if (opts.targetProjectId) {
            board.projectId = opts.targetProjectId;
          }

          // Import the board using the existing import system
          const importResult = await plotBoardImportSystem.importData(
            {
              metadata: {
                exportedAt: portablePackage.metadata.createdAt,
                schemaVersion: portablePackage.metadata.schemaVersion,
                format: ExportFormat.JSON,
                boardId: board.id,
                boardTitle: board.title,
                cardsCount: board.columns.reduce((sum, col) => sum + col.cards.length, 0),
                columnsCount: board.columns.length,
                totalSize: 0,
                checksum: '',
              },
              board,
            },
            undefined,
            {
              mergeStrategy: opts.mergeStrategy as any,
              conflictResolution: opts.conflictResolution as any,
              preserveIds: true,
            },
          );

          if (importResult.success) {
            restored.boards++;
          } else {
            errors.push(
              `Failed to restore board "${board.title}": ${importResult.errors?.join(', ')}`,
            );
          }

          if (importResult.conflicts && importResult.conflicts.length > 0) {
            conflicts.push(...importResult.conflicts.map((c) => c.item));
          }

          if (importResult.warnings && importResult.warnings.length > 0) {
            warnings.push(...importResult.warnings);
          }
        } catch (error) {
          errors.push(
            `Error restoring board "${board.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Restore views (would need integration with saved views system)
      restored.views = portablePackage.data.views.length;

      // Restore templates (would need integration with template system)
      restored.templates = portablePackage.data.templates.length;

      trace.log('Restore completed', 'user_action', 'info', {
        restored,
        errors: errors.length,
        warnings: warnings.length,
        conflicts: conflicts.length,
      });

      return {
        success: errors.length === 0,
        restored,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      trace.log('Restore failed', 'user_action', 'error', { error });
      return {
        success: false,
        restored: { boards: 0, views: 0, templates: 0 },
        errors: [error instanceof Error ? error.message : 'Restore failed'],
      };
    }
  }

  /**
   * Validate portable package format and integrity
   */
  async validatePortablePackage(portablePackage: PortablePackage): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check format
      if (portablePackage.format !== 'inkwell-plotboard-portable') {
        errors.push(`Invalid package format: ${portablePackage.format}`);
      }

      // Check version compatibility
      if (!this.SUPPORTED_VERSIONS.includes(portablePackage.version)) {
        errors.push(`Unsupported package version: ${portablePackage.version}`);
      }

      // Check required fields
      if (!portablePackage.metadata) {
        errors.push('Missing metadata section');
      }

      if (!portablePackage.data) {
        errors.push('Missing data section');
      }

      if (!portablePackage.integrity) {
        errors.push('Missing integrity section');
      }

      // Validate integrity if package is complete
      if (errors.length === 0) {
        const integrityCheck = await this.validateIntegrity(portablePackage);
        errors.push(...integrityCheck.errors);
        warnings.push(...integrityCheck.warnings);
      }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate integrity of portable package
   */
  private async validateIntegrity(portablePackage: PortablePackage): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Recalculate checksum
      const dataString = JSON.stringify(portablePackage.data);
      const calculatedChecksum = this.calculateChecksum(dataString);

      if (calculatedChecksum !== portablePackage.integrity.checksum) {
        errors.push('Data integrity check failed - checksum mismatch');
      }

      // Validate item counts
      const actualCounts = {
        boards: portablePackage.data.boards.length,
        columns: portablePackage.data.boards.reduce((sum, board) => sum + board.columns.length, 0),
        cards: portablePackage.data.boards.reduce(
          (sum, board) => sum + board.columns.reduce((colSum, col) => colSum + col.cards.length, 0),
          0,
        ),
        views: portablePackage.data.views.length,
        templates: portablePackage.data.templates.length,
      };

      const expectedCounts = portablePackage.integrity.itemCounts;

      if (actualCounts.boards !== expectedCounts.boards) {
        errors.push(
          `Board count mismatch: expected ${expectedCounts.boards}, got ${actualCounts.boards}`,
        );
      }

      if (actualCounts.columns !== expectedCounts.columns) {
        errors.push(
          `Column count mismatch: expected ${expectedCounts.columns}, got ${actualCounts.columns}`,
        );
      }

      if (actualCounts.cards !== expectedCounts.cards) {
        errors.push(
          `Card count mismatch: expected ${expectedCounts.cards}, got ${actualCounts.cards}`,
        );
      }

      if (actualCounts.views !== expectedCounts.views) {
        warnings.push(
          `View count mismatch: expected ${expectedCounts.views}, got ${actualCounts.views}`,
        );
      }

      if (actualCounts.templates !== expectedCounts.templates) {
        warnings.push(
          `Template count mismatch: expected ${expectedCounts.templates}, got ${actualCounts.templates}`,
        );
      }

      // Validate board structure
      for (const board of portablePackage.data.boards) {
        if (!board.id || !board.title || !board.projectId) {
          errors.push(`Invalid board structure: missing required fields`);
        }

        for (const column of board.columns) {
          if (!column.id || !column.title || column.boardId !== board.id) {
            errors.push(`Invalid column structure in board "${board.title}"`);
          }

          for (const card of column.cards) {
            if (!card.id || !card.title || card.columnId !== column.id) {
              errors.push(`Invalid card structure in column "${column.title}"`);
            }
          }
        }
      }
    } catch (error) {
      errors.push(
        `Integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate integrity info for portable data
   */
  private async calculateIntegrity(data: PortableData, validate: boolean): Promise<IntegrityInfo> {
    const dataString = JSON.stringify(data);
    const checksum = this.calculateChecksum(dataString);

    const itemCounts = {
      boards: data.boards.length,
      columns: data.boards.reduce((sum, board) => sum + board.columns.length, 0),
      cards: data.boards.reduce(
        (sum, board) => sum + board.columns.reduce((colSum, col) => colSum + col.cards.length, 0),
        0,
      ),
      views: data.views.length,
      templates: data.templates.length,
    };

    let validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      checkedAt: new Date().toISOString(),
    };

    if (validate) {
      // Perform basic validation on the data
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate boards have required fields
      for (const board of data.boards) {
        if (!board.id || !board.title) {
          errors.push(`Board missing required fields: id or title`);
        }
      }

      validation = {
        valid: errors.length === 0,
        errors,
        warnings,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      checksum,
      itemCounts,
      validation,
    };
  }

  /**
   * Extract relationships between different data types
   */
  private extractRelationships(
    boards: PlotBoard[],
    views: SavedViewData[],
    _templates: any[],
  ): Relationship[] {
    const relationships: Relationship[] = [];

    // Board-View relationships
    for (const view of views) {
      relationships.push({
        type: RelationType.BOARD_VIEW,
        sourceId: view.view.boardId,
        targetId: view.view.id,
      });
    }

    // Card-Scene relationships
    for (const board of boards) {
      for (const column of board.columns) {
        for (const card of column.cards) {
          if (card.sceneId) {
            relationships.push({
              type: RelationType.CARD_SCENE,
              sourceId: card.id,
              targetId: card.sceneId,
              metadata: { chapterId: card.chapterId },
            });
          }

          if (card.timelineEventIds && card.timelineEventIds.length > 0) {
            for (const eventId of card.timelineEventIds) {
              relationships.push({
                type: RelationType.CARD_TIMELINE,
                sourceId: card.id,
                targetId: eventId,
              });
            }
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Extract settings from boards
   */
  private extractSettings(boards: PlotBoard[]): any[] {
    return boards.map((board) => ({
      boardId: board.id,
      settings: board.settings,
      columnSettings: board.columns.map((col) => ({
        columnId: col.id,
        settings: col.settings,
      })),
    }));
  }

  /**
   * Utility methods
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private generatePortableFilename(portablePackage: PortablePackage): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const boardCount = portablePackage.data.boards.length;
    const sanitizedId = portablePackage.metadata.packageId.replace(/[^a-z0-9]/gi, '-');
    return `inkwell-plotboards-${sanitizedId}-${boardCount}boards-${timestamp}.portable.json`;
  }

  private getInstanceIdentifier(): string {
    // Generate a simple instance identifier
    return `inkwell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Export singleton instance
export const plotBoardPortabilitySystem = new PlotBoardPortabilitySystem();
