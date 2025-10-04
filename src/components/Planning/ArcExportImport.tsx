// src/components/Planning/ArcExportImport.tsx - Export and import character arcs with smart merging
import {
  Download,
  Upload,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Settings,
  Merge,
} from 'lucide-react';
import React, { useState, useRef } from 'react';

import type { GeneratedCharacter } from '../../services/storyArchitectService';

interface ExportFormat {
  version: string;
  exportDate: string;
  projectName?: string;
  characters: GeneratedCharacter[];
  metadata: {
    totalCharacters: number;
    avgDevelopmentScore: number;
    totalArcStages: number;
    totalRelationships: number;
  };
}

interface ImportConflict {
  type: 'character_exists' | 'arc_mismatch' | 'relationship_conflict';
  characterName: string;
  description: string;
  resolution: 'merge' | 'replace' | 'skip' | 'rename';
  existingData?: any;
  importingData?: any;
}

interface ArcExportImportProps {
  characters: GeneratedCharacter[];
  projectName?: string;
  onImport?: (characters: GeneratedCharacter[], conflicts?: ImportConflict[]) => void;
  onExport?: (format: ExportFormat) => void;
  className?: string;
}

export default function ArcExportImport({
  characters = [],
  projectName = 'Untitled Project',
  onImport,
  onExport,
  className = '',
}: ArcExportImportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportOptions, setExportOptions] = useState({
    includeVoiceProfiles: true,
    includeRelationships: true,
    includeGrowthMoments: true,
    includeArcStages: true,
    format: 'json' as 'json' | 'csv' | 'yaml',
  });
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [importData, setImportData] = useState<ExportFormat | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate metadata for export
  const exportMetadata = {
    totalCharacters: characters.length,
    avgDevelopmentScore:
      characters.reduce((sum, char) => {
        const score = calculateDevelopmentScore(char);
        return sum + score;
      }, 0) / characters.length || 0,
    totalArcStages: characters.reduce((sum, char) => sum + (char.arcStages?.length || 0), 0),
    totalRelationships: characters.reduce(
      (sum, char) => sum + (char.relationships?.length || 0),
      0,
    ),
  };

  function calculateDevelopmentScore(character: GeneratedCharacter): number {
    let score = 0;
    if (character.arcStages?.length) score += character.arcStages.length * 10;
    if (character.relationships?.length) score += character.relationships.length * 5;
    if (character.growthMoments?.length) score += character.growthMoments.length * 8;
    if (character.voiceProfile) score += 20;
    if (character.internalConflict && character.externalConflict) score += 15;
    return Math.min(score, 100);
  }

  const handleExport = (format: 'json' | 'csv' | 'yaml' | 'share' = 'json') => {
    // Filter characters based on export options
    const filteredCharacters = characters.map((character) => {
      const filtered = { ...character };
      if (!exportOptions.includeVoiceProfiles) delete filtered.voiceProfile;
      if (!exportOptions.includeRelationships) delete filtered.relationships;
      if (!exportOptions.includeGrowthMoments) delete filtered.growthMoments;
      if (!exportOptions.includeArcStages) delete filtered.arcStages;
      return filtered;
    });

    const exportFormat: ExportFormat = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      projectName,
      characters: filteredCharacters,
      metadata: exportMetadata,
    };

    if (format === 'share') {
      // Copy to clipboard for sharing
      navigator.clipboard.writeText(JSON.stringify(exportFormat, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    onExport?.(exportFormat);

    // Create and download file
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(exportFormat, null, 2);
        filename = `${projectName.replace(/\s+/g, '_')}_character_arcs.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(filteredCharacters);
        filename = `${projectName.replace(/\s+/g, '_')}_character_arcs.csv`;
        mimeType = 'text/csv';
        break;
      case 'yaml':
        content = convertToYAML(exportFormat);
        filename = `${projectName.replace(/\s+/g, '_')}_character_arcs.yaml`;
        mimeType = 'text/yaml';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData: ExportFormat;

        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          parsedData = convertFromCSV(content);
        } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          parsedData = convertFromYAML(content);
        } else {
          throw new Error('Unsupported file format');
        }

        processImport(parsedData);
      } catch (error) {
        console.error('Failed to parse import file:', error);
        alert('Failed to parse the import file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const processImport = (data: ExportFormat) => {
    const conflicts: ImportConflict[] = [];

    // Check for conflicts with existing characters
    data.characters.forEach((importChar) => {
      const existingChar = characters.find((char) => char.name === importChar.name);

      if (existingChar) {
        // Character name conflict
        conflicts.push({
          type: 'character_exists',
          characterName: importChar.name,
          description: `Character "${importChar.name}" already exists in the current project.`,
          resolution: 'merge',
          existingData: existingChar,
          importingData: importChar,
        });

        // Check for arc mismatches
        if (existingChar.arc !== importChar.arc) {
          conflicts.push({
            type: 'arc_mismatch',
            characterName: importChar.name,
            description: `Character arc differs: "${existingChar.arc}" vs "${importChar.arc}"`,
            resolution: 'merge',
            existingData: existingChar.arc,
            importingData: importChar.arc,
          });
        }

        // Check for relationship conflicts
        const existingRelNames = new Set(
          existingChar.relationships?.map((rel) => rel.withCharacter) || [],
        );
        const importingRelNames = new Set(
          importChar.relationships?.map((rel) => rel.withCharacter) || [],
        );
        const conflictingRels = [...importingRelNames].filter((name) => existingRelNames.has(name));

        if (conflictingRels.length > 0) {
          conflicts.push({
            type: 'relationship_conflict',
            characterName: importChar.name,
            description: `Relationship conflicts with: ${conflictingRels.join(', ')}`,
            resolution: 'merge',
            existingData: existingChar.relationships,
            importingData: importChar.relationships,
          });
        }
      }
    });

    setImportData(data);
    setImportConflicts(conflicts);

    if (conflicts.length > 0) {
      setShowConflictResolution(true);
    } else {
      // No conflicts, proceed with import
      onImport?.(data.characters, []);
    }
  };

  const resolveConflicts = () => {
    if (!importData) return;

    const resolvedCharacters = importData.characters.map((importChar) => {
      const existingChar = characters.find((char) => char.name === importChar.name);
      const characterConflicts = importConflicts.filter(
        (conflict) => conflict.characterName === importChar.name,
      );

      if (!existingChar || characterConflicts.length === 0) {
        return importChar;
      }

      let resolvedChar = { ...importChar };

      characterConflicts.forEach((conflict) => {
        switch (conflict.resolution) {
          case 'replace':
            // Use imported data as-is
            break;
          case 'skip':
            // Use existing data
            resolvedChar = existingChar;
            break;
          case 'merge':
            // Intelligent merge
            resolvedChar = mergeCharacterData(existingChar, importChar);
            break;
          case 'rename':
            // Rename imported character
            resolvedChar.name = `${importChar.name} (Imported)`;
            break;
        }
      });

      return resolvedChar;
    });

    onImport?.(resolvedCharacters, importConflicts);
    setShowConflictResolution(false);
    setImportConflicts([]);
    setImportData(null);
  };

  const mergeCharacterData = (
    existing: GeneratedCharacter,
    importing: GeneratedCharacter,
  ): GeneratedCharacter => {
    return {
      ...existing,
      // Merge arc stages by chapter, preferring newer/more detailed ones
      arcStages: mergeArraysByKey(existing.arcStages || [], importing.arcStages || [], 'chapter'),
      // Merge relationships, avoiding duplicates
      relationships: mergeArraysByKey(
        existing.relationships || [],
        importing.relationships || [],
        'withCharacter',
      ),
      // Merge growth moments, avoiding duplicates
      growthMoments: [
        ...new Set([...(existing.growthMoments || []), ...(importing.growthMoments || [])]),
      ],
      // Use more complete voice profile
      voiceProfile:
        importing.voiceProfile && Object.keys(importing.voiceProfile).length > 0
          ? importing.voiceProfile
          : existing.voiceProfile,
      // Merge POV chapters
      povChapters: [
        ...new Set([...(existing.povChapters || []), ...(importing.povChapters || [])]),
      ].sort((a, b) => a - b),
    };
  };

  const mergeArraysByKey = <T extends Record<string, any>>(
    existing: T[],
    importing: T[],
    keyField: keyof T,
  ): T[] => {
    const merged = [...existing];

    importing.forEach((importItem) => {
      const existingIndex = merged.findIndex((item) => item[keyField] === importItem[keyField]);
      if (existingIndex >= 0) {
        // Merge or replace existing item
        merged[existingIndex] = { ...merged[existingIndex], ...importItem };
      } else {
        // Add new item
        merged.push(importItem);
      }
    });

    return merged;
  };

  const updateConflictResolution = (
    conflictIndex: number,
    resolution: ImportConflict['resolution'],
  ) => {
    const updated = [...importConflicts];
    if (updated[conflictIndex]) {
      updated[conflictIndex].resolution = resolution;
      setImportConflicts(updated);
    }
  };

  // Utility functions for format conversion
  function convertToCSV(characters: GeneratedCharacter[]): string {
    const headers = [
      'Name',
      'Role',
      'Arc',
      'Internal Conflict',
      'External Conflict',
      'Arc Stages',
      'Relationships',
      'Growth Moments',
      'POV Chapters',
    ];

    const rows = characters.map((char) => [
      char.name,
      char.role,
      char.arc || '',
      char.internalConflict || char.conflict || '',
      char.externalConflict || '',
      (char.arcStages?.length || 0).toString(),
      (char.relationships?.length || 0).toString(),
      (char.growthMoments?.length || 0).toString(),
      (char.povChapters?.length || 0).toString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  function convertFromCSV(content: string): ExportFormat {
    // Simplified CSV parsing for demo purposes
    // In a real implementation, you'd want more robust CSV parsing
    const lines = content.split('\n');
    const _headers = lines[0]?.split(',').map((h) => h.replace(/"/g, ''));
    const characters: GeneratedCharacter[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine?.trim()) {
        const values = currentLine.split(',').map((v) => v.replace(/"/g, ''));
        characters.push({
          name: values[0] || `Character ${i}`,
          role: (values[1] as any) || 'supporting',
          arc: values[2] || '',
          internalConflict: values[3] || '',
          externalConflict: values[4] || '',
          description: `Imported character from CSV`,
          motivation: '',
          conflict: values[3] || '',
        });
      }
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      characters,
      metadata: {
        totalCharacters: characters.length,
        avgDevelopmentScore: 0,
        totalArcStages: 0,
        totalRelationships: 0,
      },
    };
  }

  function convertToYAML(data: ExportFormat): string {
    // Simplified YAML conversion for demo purposes
    // In a real implementation, you'd want a proper YAML library
    return `# Character Arc Export
version: "${data.version}"
exportDate: "${data.exportDate}"
projectName: "${data.projectName}"

metadata:
  totalCharacters: ${data.metadata.totalCharacters}
  avgDevelopmentScore: ${data.metadata.avgDevelopmentScore.toFixed(1)}
  totalArcStages: ${data.metadata.totalArcStages}
  totalRelationships: ${data.metadata.totalRelationships}

characters:
${data.characters
  .map(
    (char) => `  - name: "${char.name}"
    role: "${char.role}"
    arc: "${char.arc || ''}"
    internalConflict: "${char.internalConflict || char.conflict || ''}"
    externalConflict: "${char.externalConflict || ''}"
    arcStages: ${char.arcStages?.length || 0}
    relationships: ${char.relationships?.length || 0}
    growthMoments: ${char.growthMoments?.length || 0}`,
  )
  .join('\n')}`;
  }

  function convertFromYAML(content: string): ExportFormat {
    // Simplified YAML parsing for demo purposes
    // In a real implementation, you'd want a proper YAML library
    const characters: GeneratedCharacter[] = [];
    const lines = content.split('\n');

    let currentChar: any = {};
    let inCharacters = false;

    lines.forEach((line) => {
      if (line.trim().startsWith('characters:')) {
        inCharacters = true;
        return;
      }

      if (inCharacters && line.trim().startsWith('- name:')) {
        if (currentChar.name) {
          characters.push(currentChar);
        }
        currentChar = {
          name: line.split('"')[1] || 'Unnamed Character',
          role: 'supporting',
          description: 'Imported character from YAML',
          motivation: '',
          conflict: '',
        };
      } else if (inCharacters && line.trim().includes(':')) {
        const [key, value] = line
          .trim()
          .split(':')
          .map((s) => s.trim());
        const cleanValue = value?.replace(/"/g, '') || '';

        switch (key) {
          case 'role':
            currentChar.role = cleanValue;
            break;
          case 'arc':
            currentChar.arc = cleanValue;
            break;
          case 'internalConflict':
            currentChar.internalConflict = cleanValue;
            currentChar.conflict = cleanValue;
            break;
          case 'externalConflict':
            currentChar.externalConflict = cleanValue;
            break;
        }
      }
    });

    if (currentChar.name) {
      characters.push(currentChar);
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      characters,
      metadata: {
        totalCharacters: characters.length,
        avgDevelopmentScore: 0,
        totalArcStages: 0,
        totalRelationships: 0,
      },
    };
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arc Export & Import</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share character arcs between projects or with other writers
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <div className="flex">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
            }`}
          >
            Export Arcs
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
            }`}
          >
            Import Arcs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'export' ? (
          <div className="space-y-6">
            {/* Export Options */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Export Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeArcStages}
                    onChange={(e) =>
                      setExportOptions((prev) => ({ ...prev, includeArcStages: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Arc Stages</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeRelationships}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeRelationships: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Relationships
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeVoiceProfiles}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeVoiceProfiles: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Voice Profiles
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeGrowthMoments}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeGrowthMoments: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Growth Moments
                  </span>
                </label>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {exportMetadata.totalCharacters}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Characters</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {exportMetadata.totalArcStages}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Arc Stages</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {exportMetadata.totalRelationships}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Relationships</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {exportMetadata.avgDevelopmentScore.toFixed(1)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Avg Development</div>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('yaml')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export YAML
              </button>
              <button
                onClick={() => handleExport('share')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Import Area */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Import Character Arcs
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Choose a file or drag and drop it here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supports JSON, CSV, and YAML formats
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.yaml,.yml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Import Preview */}
            {importData && !showConflictResolution && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Ready to Import
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  {importData.characters.length} characters from "{importData.projectName}"
                </p>
                <button
                  onClick={() => onImport?.(importData.characters, [])}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Import Characters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictResolution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resolve Import Conflicts
                </h3>
                <button
                  onClick={() => setShowConflictResolution(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                {importConflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {conflict.characterName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {conflict.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {['merge', 'replace', 'skip', 'rename'].map((resolution) => (
                        <button
                          key={resolution}
                          onClick={() => updateConflictResolution(index, resolution as any)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            conflict.resolution === resolution
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {resolution === 'merge' && <Merge className="w-3 h-3 inline mr-1" />}
                          {resolution.charAt(0).toUpperCase() + resolution.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowConflictResolution(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={resolveConflicts}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Apply Resolutions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
