// Tests for AI Plot Analysis Service
import { describe, it, expect, beforeEach } from 'vitest';

import { aiPlotAnalysisService, type PlotAnalysisOptions } from './aiPlotAnalysisService';

describe('AI Plot Analysis Service', () => {
  const mockProjectId = 'test-project-123';

  beforeEach(() => {
    // Reset any state if needed
  });

  describe('Service Status', () => {
    it('should report service status correctly', async () => {
      const status = await aiPlotAnalysisService.checkServiceStatus();

      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('mockMode');
      expect(status).toHaveProperty('message');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.mockMode).toBe('boolean');
      expect(typeof status.message).toBe('string');
    });

    it('should indicate mock mode in development', async () => {
      const status = await aiPlotAnalysisService.checkServiceStatus();

      // In test environment, should use mock mode
      expect(status.mockMode).toBe(true);
      expect(status.message).toContain('mock mode');
    });
  });

  describe('Project Analysis', () => {
    it('should analyze a project with default options', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('projectId', mockProjectId);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('suggestions');

      // Check score is valid
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      // Check timestamp is recent
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(Date.now() - result.timestamp.getTime()).toBeLessThan(1000);
    });

    it('should analyze with custom options', async () => {
      const options: PlotAnalysisOptions = {
        includeChapters: ['chapter1', 'chapter2'],
        focusAreas: ['pacing', 'conflicts'],
        detailLevel: 'detailed',
        mockMode: true,
      };

      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId, options);

      expect(result.projectId).toBe(mockProjectId);
      expect(result.analysis).toHaveProperty('pacing');
      expect(result.analysis).toHaveProperty('conflicts');
    });

    it('should generate unique analysis IDs', async () => {
      const result1 = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const result2 = await aiPlotAnalysisService.analyzeProject(mockProjectId);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should force mock mode when requested', async () => {
      const options: PlotAnalysisOptions = { mockMode: true };
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId, options);

      // Should succeed even if AI service is not available
      expect(result).toBeDefined();
      expect(result.projectId).toBe(mockProjectId);
    });
  });

  describe('Analysis Structure', () => {
    let analysisResult: any;

    beforeEach(async () => {
      analysisResult = await aiPlotAnalysisService.analyzeProject(mockProjectId);
    });

    it('should have valid pacing analysis', () => {
      const pacing = analysisResult.analysis.pacing;

      expect(pacing).toHaveProperty('score');
      expect(pacing).toHaveProperty('issues');
      expect(pacing).toHaveProperty('recommendations');

      expect(pacing.score).toBeGreaterThanOrEqual(0);
      expect(pacing.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(pacing.issues)).toBe(true);
      expect(Array.isArray(pacing.recommendations)).toBe(true);
    });

    it('should have valid conflict analysis', () => {
      const conflicts = analysisResult.analysis.conflicts;

      expect(conflicts).toHaveProperty('score');
      expect(conflicts).toHaveProperty('conflicts');
      expect(conflicts).toHaveProperty('missingConflicts');

      expect(conflicts.score).toBeGreaterThanOrEqual(0);
      expect(conflicts.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(conflicts.conflicts)).toBe(true);
      expect(Array.isArray(conflicts.missingConflicts)).toBe(true);
    });

    it('should have valid character analysis', () => {
      const characters = analysisResult.analysis.characters;

      expect(characters).toHaveProperty('score');
      expect(characters).toHaveProperty('characters');
      expect(characters).toHaveProperty('relationships');

      expect(characters.score).toBeGreaterThanOrEqual(0);
      expect(characters.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(characters.characters)).toBe(true);
      expect(Array.isArray(characters.relationships)).toBe(true);
    });

    it('should have valid theme analysis', () => {
      const themes = analysisResult.analysis.themes;

      expect(themes).toHaveProperty('score');
      expect(themes).toHaveProperty('themes');
      expect(themes).toHaveProperty('suggestions');

      expect(themes.score).toBeGreaterThanOrEqual(0);
      expect(themes.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(themes.themes)).toBe(true);
      expect(Array.isArray(themes.suggestions)).toBe(true);
    });

    it('should have valid suggestions', () => {
      const suggestions = analysisResult.suggestions;

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('implementation');
        expect(suggestion).toHaveProperty('impact');

        expect(['pacing', 'conflict', 'character', 'theme', 'structure']).toContain(
          suggestion.type,
        );
        expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      });
    });
  });

  describe('Pacing Issues', () => {
    it('should validate pacing issue structure', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const issues = result.analysis.pacing.issues;

      issues.forEach((issue: any) => {
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('chapterId');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('severity');

        expect(['too_slow', 'too_fast', 'inconsistent']).toContain(issue.type);
        expect(['low', 'medium', 'high']).toContain(issue.severity);
        expect(typeof issue.chapterId).toBe('string');
        expect(typeof issue.description).toBe('string');
      });
    });
  });

  describe('Conflict Analysis', () => {
    it('should validate conflict structure', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const conflicts = result.analysis.conflicts.conflicts;

      conflicts.forEach((conflict: any) => {
        expect(conflict).toHaveProperty('type');
        expect(conflict).toHaveProperty('intensity');
        expect(conflict).toHaveProperty('resolution');
        expect(conflict).toHaveProperty('description');

        expect(['internal', 'external', 'interpersonal']).toContain(conflict.type);
        expect(['resolved', 'unresolved', 'partial']).toContain(conflict.resolution);
        expect(conflict.intensity).toBeGreaterThanOrEqual(0);
        expect(conflict.intensity).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Character Analysis', () => {
    it('should validate character data structure', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const characters = result.analysis.characters.characters;

      characters.forEach((character: any) => {
        expect(character).toHaveProperty('id');
        expect(character).toHaveProperty('name');
        expect(character).toHaveProperty('developmentScore');
        expect(character).toHaveProperty('arcCompleteness');
        expect(character).toHaveProperty('consistency');
        expect(character).toHaveProperty('issues');

        expect(character.developmentScore).toBeGreaterThanOrEqual(0);
        expect(character.developmentScore).toBeLessThanOrEqual(100);
        expect(character.arcCompleteness).toBeGreaterThanOrEqual(0);
        expect(character.arcCompleteness).toBeLessThanOrEqual(100);
        expect(character.consistency).toBeGreaterThanOrEqual(0);
        expect(character.consistency).toBeLessThanOrEqual(100);
        expect(Array.isArray(character.issues)).toBe(true);
      });
    });

    it('should validate relationship structure', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const relationships = result.analysis.characters.relationships;

      relationships.forEach((rel: any) => {
        expect(rel).toHaveProperty('character1');
        expect(rel).toHaveProperty('character2');
        expect(rel).toHaveProperty('type');
        expect(rel).toHaveProperty('strength');
        expect(rel).toHaveProperty('development');

        expect(rel.strength).toBeGreaterThanOrEqual(0);
        expect(rel.strength).toBeLessThanOrEqual(10);
        expect(['growing', 'stable', 'declining']).toContain(rel.development);
      });
    });
  });

  describe('Theme Analysis', () => {
    it('should validate theme structure', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const themes = result.analysis.themes.themes;

      themes.forEach((theme: any) => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('strength');
        expect(theme).toHaveProperty('consistency');
        expect(theme).toHaveProperty('examples');

        expect(theme.strength).toBeGreaterThanOrEqual(0);
        expect(theme.strength).toBeLessThanOrEqual(10);
        expect(theme.consistency).toBeGreaterThanOrEqual(0);
        expect(theme.consistency).toBeLessThanOrEqual(100);
        expect(Array.isArray(theme.examples)).toBe(true);
      });
    });
  });

  describe('Analysis History', () => {
    it('should return empty history for new project', async () => {
      const history = await aiPlotAnalysisService.getAnalysisHistory(mockProjectId);

      expect(Array.isArray(history)).toBe(true);
      // For now, history is not implemented, so should be empty
      expect(history.length).toBe(0);
    });
  });

  describe('Save Analysis', () => {
    it('should save analysis without error', async () => {
      const result = await aiPlotAnalysisService.analyzeProject(mockProjectId);

      // Should not throw
      await expect(aiPlotAnalysisService.saveAnalysis(result)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID gracefully', async () => {
      const result = await aiPlotAnalysisService.analyzeProject('');

      // Should still return a result (mock mode)
      expect(result).toBeDefined();
      expect(result.projectId).toBe('');
    });
  });

  describe('Performance', () => {
    it('should complete analysis in reasonable time', async () => {
      const startTime = Date.now();
      await aiPlotAnalysisService.analyzeProject(mockProjectId);
      const endTime = Date.now();

      // Mock analysis should be very fast
      expect(endTime - startTime).toBeLessThan(100); // 100ms
    });

    it('should handle multiple concurrent analyses', async () => {
      const promises = Array.from({ length: 5 }, (_, _i) =>
        aiPlotAnalysisService.analyzeProject(`project-${i}`),
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      results.forEach((result, _index) => {
        expect(result.projectId).toBe(`project-${index}`);
      });
    });
  });
});
