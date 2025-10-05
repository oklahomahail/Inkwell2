// Enhanced Plot Boards Import System
// Supports validation, conflict resolution, schema migration, and merge capabilities

import { trace } from '../../../utils/trace';
import { ExportBundle, ExportFormat } from '../export/exportSystem';
import { SchemaVersionManager } from '../schema/versioning';
import { PlotBoard, PlotColumn, PlotBoardTemplate } from '../types';
import { SavedViewData } from '../views/savedViews';

/* ========= Import Types ========= */

export interface ImportOptions {
  mergeStrategy?: MergeStrategy;
  conflictResolution?: ConflictResolution;
  validateSchema?: boolean;
  autoMigrate?: boolean;
  createBackup?: boolean;
  allowOverwrite?: boolean;
  preserveIds?: boolean;
  importViews?: boolean;
  importTemplates?: boolean;
  importSettings?: boolean;
}

export enum MergeStrategy {
  REPLACE = 'replace', // Replace entire board
  MERGE = 'merge', // Merge data intelligently
  APPEND = 'append', // Add as new columns/cards
}

export enum ConflictResolution {
  SKIP = 'skip', // Skip conflicting items
  OVERWRITE = 'overwrite', // Overwrite existing items
  RENAME = 'rename', // Rename conflicting items
  MANUAL = 'manual', // Require manual resolution
}

export interface ImportResult {
  success: boolean;
  board?: PlotBoard;
  views?: SavedViewData[];
  templates?: PlotBoardTemplate[];
  metadata?: ImportMetadata;
  conflicts?: ImportConflict[];
  errors?: string[];
  warnings?: string[];
  migration?: MigrationInfo;
}

export interface ImportMetadata {
  importedAt: string;
  originalSchema: string;
  targetSchema: string;
  sourceFormat: ExportFormat;
  itemsImported: {
    boards: number;
    columns: number;
    cards: number;
    views: number;
    templates: number;
  };
  conflicts: number;
  warnings: number;
}

export interface ImportConflict {
  type: ConflictType;
  item: string;
  existing: any;
  incoming: any;
  resolution?: ConflictResolution;
  resolved?: boolean;
}

export enum ConflictType {
  BOARD_EXISTS = 'board_exists',
  COLUMN_EXISTS = 'column_exists',
  CARD_EXISTS = 'card_exists',
  VIEW_EXISTS = 'view_exists',
  TEMPLATE_EXISTS = 'template_exists',
  SCHEMA_MISMATCH = 'schema_mismatch',
  ID_COLLISION = 'id_collision',
}

export interface MigrationInfo {
  required: boolean;
  fromVersion: string;
  toVersion: string;
  changes: string[];
  warnings: string[];
}

/* ========= Import System Class ========= */

export class PlotBoardImportSystem {
  private schemaManager = new SchemaVersionManager();

  /**
   * Import plot board data from various formats
   */
  async importData(
    data: string | ExportBundle,
    existingBoard?: PlotBoard,
    options: Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    const opts: ImportOptions = {
      mergeStrategy: MergeStrategy.REPLACE,
      conflictResolution: ConflictResolution.SKIP,
      validateSchema: true,
      autoMigrate: true,
      createBackup: true,
      allowOverwrite: false,
      preserveIds: true,
      importViews: true,
      importTemplates: false,
      importSettings: true,
      ...options,
    };

    try {
      trace.log('Starting import', 'user_action', 'info', { options: opts });

      // Parse data
      const bundle = typeof data === 'string' ? this.parseImportData(data) : data;
      if (!bundle) {
        throw new Error('Invalid import data format');
      }

      // Validate and migrate schema if needed
      const migrationResult = await this.handleSchemaMigration(bundle, opts);
      if (migrationResult.errors && migrationResult.errors.length > 0 && opts.validateSchema) {
        throw new Error(`Schema migration failed: ${migrationResult.errors.join(', ')}`);
      }

      // Detect conflicts
      const conflicts = existingBoard
        ? await this.detectConflicts(bundle, existingBoard, opts)
        : [];

      // Resolve conflicts
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts, opts.conflictResolution!);
      }

      // Perform import based on merge strategy
      const importResult = await this.performImport(bundle, existingBoard, conflicts, opts);

      return {
        success: true,
        ...importResult,
        conflicts,
        migration: migrationResult.migration,
        metadata: {
          importedAt: new Date().toISOString(),
          originalSchema: bundle.metadata?.schemaVersion || 'unknown',
          targetSchema: this.schemaManager.getCurrentVersion(),
          sourceFormat: bundle.metadata?.format || ExportFormat.JSON,
          itemsImported: {
            boards: importResult.board ? 1 : 0,
            columns: importResult.board?.columns.length || 0,
            cards: importResult.board?.columns.reduce((sum, col) => sum + col.cards.length, 0) || 0,
            views: importResult.views?.length || 0,
            templates: importResult.templates?.length || 0,
          },
          conflicts: conflicts.length,
          warnings: importResult.warnings?.length || 0,
        },
      };
    } catch (error) {
      trace.log('Import failed', 'user_action', 'error', { error });
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }

  /**
   * Import from file
   */
  async importFromFile(
    file: File,
    existingBoard?: PlotBoard,
    options: Partial<ImportOptions> = {},
  ): Promise<ImportResult> {
    try {
      const text = await this.readFileAsText(file);
      return await this.importData(text, existingBoard, options);
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Parse import data from string
   */
  private parseImportData(data: string): ExportBundle | null {
    try {
      const parsed = JSON.parse(data);

      // Check if it's a full export bundle
      if (parsed.metadata && parsed.board) {
        return parsed as ExportBundle;
      }

      // Check if it's just a board
      if (parsed.id && parsed.projectId && parsed.columns) {
        return {
          metadata: {
            exportedAt: new Date().toISOString(),
            schemaVersion: 'unknown',
            format: ExportFormat.JSON,
            boardId: parsed.id,
            boardTitle: parsed.title || 'Imported Board',
            cardsCount:
              parsed.columns?.reduce(
                (sum: number, col: any) => sum + (col.cards?.length || 0),
                0,
              ) || 0,
            columnsCount: parsed.columns?.length || 0,
            totalSize: new Blob([data]).size,
            checksum: '',
          },
          board: parsed,
        };
      }

      // Check if it's a template
      if (parsed.name && parsed.columns && parsed.category) {
        const board: PlotBoard = {
          id: `board_${Date.now()}`,
          projectId: 'imported',
          title: parsed.name,
          description: parsed.description,
          columns: parsed.columns.map((colTemplate: any, index: number) => ({
            id: `col_${Date.now()}_${index}`,
            boardId: `board_${Date.now()}`,
            title: colTemplate.title,
            description: colTemplate.description,
            color: colTemplate.color,
            order: colTemplate.order || index,
            cards: (colTemplate.defaultCards || []).map((cardTemplate: any, cardIndex: number) => ({
              id: `card_${Date.now()}_${index}_${cardIndex}`,
              columnId: `col_${Date.now()}_${index}`,
              title: cardTemplate.title,
              description: cardTemplate.description,
              order: cardIndex,
              status: cardTemplate.status,
              priority: cardTemplate.priority,
              tags: cardTemplate.tags || [],
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            type: colTemplate.type,
            settings: {
              autoColor: true,
              showCardCount: true,
              collapsible: false,
              sortBy: 'order',
              showProgress: true,
            },
          })),
          settings: {
            showWordCounts: true,
            showTimeline: true,
            showCharacters: true,
            colorScheme: 'auto',
            compactView: false,
            enableQuickActions: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          metadata: {
            exportedAt: new Date().toISOString(),
            schemaVersion: 'template',
            format: ExportFormat.TEMPLATE,
            boardId: board.id,
            boardTitle: board.title,
            cardsCount: board.columns.reduce((sum, col) => sum + col.cards.length, 0),
            columnsCount: board.columns.length,
            totalSize: new Blob([data]).size,
            checksum: '',
          },
          board,
        };
      }

      return null;
    } catch (error) {
      trace.log('Failed to parse import data', 'user_action', 'error', { error });
      return null;
    }
  }

  /**
   * Handle schema migration
   */
  private async handleSchemaMigration(
    bundle: ExportBundle,
    options: ImportOptions,
  ): Promise<{ migration?: MigrationInfo; errors?: string[] }> {
    if (!options.validateSchema) {
      return {};
    }

    const sourceVersion = bundle.metadata?.schemaVersion || 'unknown';
    const currentVersion = this.schemaManager.getCurrentVersion();

    if (sourceVersion === 'unknown') {
      return {
        migration: {
          required: false,
          fromVersion: sourceVersion,
          toVersion: currentVersion,
          changes: [],
          warnings: ['Source schema version is unknown - skipping migration'],
        },
      };
    }

    if (this.schemaManager.compareVersions(sourceVersion, currentVersion) === 0) {
      return {}; // No migration needed
    }

    if (options.autoMigrate) {
      try {
        const migrationResult = await this.schemaManager.migrate(bundle, currentVersion);
        return {
          migration: {
            required: true,
            fromVersion: sourceVersion,
            toVersion: currentVersion,
            changes: migrationResult.changes || [],
            warnings: migrationResult.warnings || [],
          },
        };
      } catch (error) {
        return {
          errors: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        };
      }
    }

    return {
      migration: {
        required: true,
        fromVersion: sourceVersion,
        toVersion: currentVersion,
        changes: ['Manual migration required'],
        warnings: ['Auto-migration is disabled'],
      },
    };
  }

  /**
   * Detect conflicts between imported data and existing data
   */
  private async detectConflicts(
    bundle: ExportBundle,
    existingBoard: PlotBoard,
    options: ImportOptions,
  ): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = [];

    // Board-level conflicts
    if (bundle.board.id === existingBoard.id && !options.allowOverwrite) {
      conflicts.push({
        type: ConflictType.BOARD_EXISTS,
        item: `Board: ${bundle.board.title}`,
        existing: existingBoard,
        incoming: bundle.board,
      });
    }

    // Column conflicts
    for (const incomingColumn of bundle.board.columns) {
      const existingColumn = existingBoard.columns.find(
        (col) => col.id === incomingColumn.id || col.title === incomingColumn.title,
      );

      if (existingColumn) {
        conflicts.push({
          type: ConflictType.COLUMN_EXISTS,
          item: `Column: ${incomingColumn.title}`,
          existing: existingColumn,
          incoming: incomingColumn,
        });

        // Card conflicts within columns
        for (const incomingCard of incomingColumn.cards) {
          const existingCard = existingColumn.cards.find(
            (card) =>
              card.id === incomingCard.id ||
              (card.title === incomingCard.title && card.sceneId === incomingCard.sceneId),
          );

          if (existingCard) {
            conflicts.push({
              type: ConflictType.CARD_EXISTS,
              item: `Card: ${incomingCard.title}`,
              existing: existingCard,
              incoming: incomingCard,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts based on resolution strategy
   */
  private async resolveConflicts(
    conflicts: ImportConflict[],
    resolution: ConflictResolution,
  ): Promise<void> {
    for (const conflict of conflicts) {
      switch (resolution) {
        case ConflictResolution.SKIP:
          conflict.resolution = ConflictResolution.SKIP;
          conflict.resolved = true;
          break;

        case ConflictResolution.OVERWRITE:
          conflict.resolution = ConflictResolution.OVERWRITE;
          conflict.resolved = true;
          break;

        case ConflictResolution.RENAME:
          conflict.resolution = ConflictResolution.RENAME;
          conflict.resolved = true;
          // Rename the incoming item
          if (conflict.type === ConflictType.COLUMN_EXISTS) {
            conflict.incoming.title = `${conflict.incoming.title} (Imported)`;
            conflict.incoming.id = `${conflict.incoming.id}_imported_${Date.now()}`;
          } else if (conflict.type === ConflictType.CARD_EXISTS) {
            conflict.incoming.title = `${conflict.incoming.title} (Imported)`;
            conflict.incoming.id = `${conflict.incoming.id}_imported_${Date.now()}`;
          }
          break;

        case ConflictResolution.MANUAL:
          conflict.resolution = ConflictResolution.MANUAL;
          conflict.resolved = false;
          break;

        default:
          conflict.resolution = ConflictResolution.SKIP;
          conflict.resolved = true;
      }
    }
  }

  /**
   * Perform the actual import based on strategy
   */
  private async performImport(
    bundle: ExportBundle,
    existingBoard: PlotBoard | undefined,
    conflicts: ImportConflict[],
    options: ImportOptions,
  ): Promise<{
    board?: PlotBoard;
    views?: SavedViewData[];
    templates?: PlotBoardTemplate[];
    warnings?: string[];
  }> {
    const warnings: string[] = [];
    let resultBoard: PlotBoard;
    let resultViews: SavedViewData[] = [];
    let resultTemplates: PlotBoardTemplate[] = [];

    // Handle board import based on merge strategy
    switch (options.mergeStrategy) {
      case MergeStrategy.REPLACE:
        resultBoard = bundle.board;
        break;

      case MergeStrategy.MERGE:
        if (existingBoard) {
          resultBoard = await this.mergeBoards(existingBoard, bundle.board, conflicts, options);
        } else {
          resultBoard = bundle.board;
        }
        break;

      case MergeStrategy.APPEND:
        if (existingBoard) {
          resultBoard = await this.appendToBoard(existingBoard, bundle.board, conflicts, options);
        } else {
          resultBoard = bundle.board;
        }
        break;

      default:
        resultBoard = bundle.board;
    }

    // Import views if requested
    if (options.importViews && bundle.views) {
      resultViews = bundle.views.map((view) => ({
        ...view,
        view: {
          ...view.view,
          boardId: resultBoard.id,
          id: options.preserveIds
            ? view.view.id
            : `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      }));
    }

    // Import templates if requested
    if (options.importTemplates && bundle.templates) {
      resultTemplates = bundle.templates.map((template) => ({
        ...template,
        id: options.preserveIds
          ? template.id
          : `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isBuiltIn: false, // Imported templates are never built-in
      }));
    }

    // Add warnings for unresolved conflicts
    const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
    if (unresolvedConflicts.length > 0) {
      warnings.push(`${unresolvedConflicts.length} conflicts require manual resolution`);
    }

    return {
      board: resultBoard,
      views: resultViews,
      templates: resultTemplates,
      warnings,
    };
  }

  /**
   * Merge two boards intelligently
   */
  private async mergeBoards(
    existingBoard: PlotBoard,
    incomingBoard: PlotBoard,
    conflicts: ImportConflict[],
    options: ImportOptions,
  ): Promise<PlotBoard> {
    const mergedBoard: PlotBoard = {
      ...existingBoard,
      title: incomingBoard.title || existingBoard.title,
      description: incomingBoard.description || existingBoard.description,
      updatedAt: new Date(),
    };

    // Merge columns
    const existingColumnMap = new Map(existingBoard.columns.map((col) => [col.id, col]));
    const mergedColumns: PlotColumn[] = [...existingBoard.columns];

    for (const incomingColumn of incomingBoard.columns) {
      const conflict = conflicts.find(
        (c) => c.type === ConflictType.COLUMN_EXISTS && c.incoming === incomingColumn,
      );

      if (conflict && conflict.resolution === ConflictResolution.SKIP) {
        continue;
      }

      if (conflict && conflict.resolution === ConflictResolution.OVERWRITE) {
        const index = mergedColumns.findIndex((col) => col.id === incomingColumn.id);
        if (index !== -1) {
          mergedColumns[index] = incomingColumn;
        }
      } else if (!existingColumnMap.has(incomingColumn.id)) {
        mergedColumns.push({
          ...incomingColumn,
          boardId: mergedBoard.id,
          order: mergedColumns.length,
        });
      }
    }

    mergedBoard.columns = mergedColumns;
    return mergedBoard;
  }

  /**
   * Append incoming data to existing board as new columns
   */
  private async appendToBoard(
    existingBoard: PlotBoard,
    incomingBoard: PlotBoard,
    conflicts: ImportConflict[],
    options: ImportOptions,
  ): Promise<PlotBoard> {
    const appendedBoard: PlotBoard = {
      ...existingBoard,
      updatedAt: new Date(),
    };

    const newColumns = incomingBoard.columns.map((column, index) => ({
      ...column,
      id: `${column.id}_appended_${Date.now()}`,
      boardId: appendedBoard.id,
      order: existingBoard.columns.length + index,
      cards: column.cards.map((card) => ({
        ...card,
        id: `${card.id}_appended_${Date.now()}`,
        columnId: `${column.id}_appended_${Date.now()}`,
      })),
    }));

    appendedBoard.columns = [...existingBoard.columns, ...newColumns];
    return appendedBoard;
  }

  /**
   * Utility: Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Preview import without actually importing
   */
  async previewImport(
    data: string | ExportBundle,
    existingBoard?: PlotBoard,
    options: Partial<ImportOptions> = {},
  ): Promise<{
    preview: {
      boardTitle: string;
      columnsCount: number;
      cardsCount: number;
      viewsCount: number;
      templatesCount: number;
    };
    conflicts: ImportConflict[];
    migration?: MigrationInfo;
    errors?: string[];
  }> {
    try {
      const bundle = typeof data === 'string' ? this.parseImportData(data) : data;
      if (!bundle) {
        throw new Error('Invalid import data format');
      }

      const conflicts = existingBoard
        ? await this.detectConflicts(bundle, existingBoard, options as ImportOptions)
        : [];

      const migrationResult = await this.handleSchemaMigration(bundle, options as ImportOptions);

      return {
        preview: {
          boardTitle: bundle.board.title,
          columnsCount: bundle.board.columns.length,
          cardsCount: bundle.board.columns.reduce((sum, col) => sum + col.cards.length, 0),
          viewsCount: bundle.views?.length || 0,
          templatesCount: bundle.templates?.length || 0,
        },
        conflicts,
        migration: migrationResult.migration,
        errors: migrationResult.errors,
      };
    } catch (error) {
      return {
        preview: {
          boardTitle: '',
          columnsCount: 0,
          cardsCount: 0,
          viewsCount: 0,
          templatesCount: 0,
        },
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Preview failed'],
      };
    }
  }
}

// Export singleton instance
export const plotBoardImportSystem = new PlotBoardImportSystem();
