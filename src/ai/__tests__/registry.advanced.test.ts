/**
 * Tests for Advanced Mode - Model Registry
 *
 * Tests the model selection logic for baseline vs advanced mode
 */

import { describe, it, expect } from 'vitest';

import {
  getModels,
  getCuratedModels,
  CURATED_MODELS,
  EXTENDED_MODELS,
  getModel,
} from '../registry';

describe('AI Registry - Advanced Mode', () => {
  describe('getCuratedModels', () => {
    it('should return exactly 7 curated models', () => {
      const curated = getCuratedModels();

      expect(curated).toHaveLength(7);
    });

    it('should include all curated models from all providers', () => {
      const curated = getCuratedModels();
      const modelIds = curated.map((m) => m.model.id);

      // OpenAI (3 models)
      expect(modelIds).toContain('gpt-4o-mini');
      expect(modelIds).toContain('gpt-4o');
      expect(modelIds).toContain('gpt-4-turbo');

      // Anthropic (2 models)
      expect(modelIds).toContain('claude-3-haiku-20240307');
      expect(modelIds).toContain('claude-3-5-sonnet-20241022');

      // Google (2 models)
      expect(modelIds).toContain('gemini-1.5-flash');
      expect(modelIds).toContain('gemini-1.5-pro');
    });

    it('should include provider info for each model', () => {
      const curated = getCuratedModels();

      curated.forEach(({ provider, model }) => {
        expect(provider).toBeDefined();
        expect(provider.id).toBeTruthy();
        expect(provider.name).toBeTruthy();
        expect(model).toBeDefined();
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
      });
    });
  });

  describe('getModels - Baseline Mode', () => {
    it('should return 7 models when advanced mode is false', () => {
      const models = getModels(false);

      expect(models).toHaveLength(7);
    });

    it('should return same models as getCuratedModels in baseline', () => {
      const baseline = getModels(false);
      const curated = getCuratedModels();

      expect(baseline).toEqual(curated);
    });

    it('should default to baseline mode when parameter is omitted', () => {
      const defaultModels = getModels();
      const baselineModels = getModels(false);

      expect(defaultModels).toEqual(baselineModels);
    });
  });

  describe('getModels - Advanced Mode', () => {
    it('should return 9 models when advanced mode is true', () => {
      const models = getModels(true);

      expect(models).toHaveLength(9);
    });

    it('should include all curated models in advanced mode', () => {
      const advanced = getModels(true);
      const curated = getCuratedModels();

      const curatedIds = curated.map((m) => m.model.id);
      const advancedIds = advanced.map((m) => m.model.id);

      curatedIds.forEach((id) => {
        expect(advancedIds).toContain(id);
      });
    });

    it('should include extended models in advanced mode', () => {
      const advanced = getModels(true);
      const advancedIds = advanced.map((m) => m.model.id);

      // OpenAI extended
      expect(advancedIds).toContain('gpt-3.5-turbo');

      // Anthropic extended
      expect(advancedIds).toContain('claude-3-opus-20240229');
    });

    it('should have curated models + 2 extended models', () => {
      const curated = getModels(false);
      const advanced = getModels(true);

      expect(advanced.length).toBe(curated.length + 2);
    });

    it('should maintain provider grouping in advanced mode', () => {
      const advanced = getModels(true);

      const openaiCount = advanced.filter((m) => m.provider.id === 'openai').length;
      const anthropicCount = advanced.filter((m) => m.provider.id === 'anthropic').length;
      const googleCount = advanced.filter((m) => m.provider.id === 'google').length;

      // OpenAI: 3 curated + 1 extended = 4
      expect(openaiCount).toBe(4);

      // Anthropic: 2 curated + 1 extended = 3
      expect(anthropicCount).toBe(3);

      // Google: 2 curated + 0 extended = 2
      expect(googleCount).toBe(2);
    });
  });

  describe('Model Registry Constants', () => {
    it('should have CURATED_MODELS with correct counts', () => {
      expect(CURATED_MODELS.openai).toHaveLength(3);
      expect(CURATED_MODELS.anthropic).toHaveLength(2);
      expect(CURATED_MODELS.google).toHaveLength(2);
    });

    it('should have EXTENDED_MODELS with correct counts', () => {
      expect(EXTENDED_MODELS.openai).toHaveLength(1);
      expect(EXTENDED_MODELS.anthropic).toHaveLength(1);
      expect(EXTENDED_MODELS.google).toHaveLength(0);
    });

    it('should have no overlap between curated and extended', () => {
      const curatedSet = new Set([
        ...CURATED_MODELS.openai,
        ...CURATED_MODELS.anthropic,
        ...CURATED_MODELS.google,
      ]);

      const extendedSet = new Set([
        ...EXTENDED_MODELS.openai,
        ...EXTENDED_MODELS.anthropic,
        ...EXTENDED_MODELS.google,
      ]);

      curatedSet.forEach((modelId) => {
        expect(extendedSet.has(modelId)).toBe(false);
      });
    });
  });

  describe('getModel - Individual Model Lookup', () => {
    it('should find curated models', () => {
      const result = getModel('openai', 'gpt-4o');

      expect(result).toBeDefined();
      expect(result?.provider.id).toBe('openai');
      expect(result?.model.id).toBe('gpt-4o');
    });

    it('should find extended models', () => {
      const result = getModel('openai', 'gpt-3.5-turbo');

      expect(result).toBeDefined();
      expect(result?.provider.id).toBe('openai');
      expect(result?.model.id).toBe('gpt-3.5-turbo');
    });

    it('should return undefined for non-existent model', () => {
      const result = getModel('openai', 'non-existent-model');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent provider', () => {
      const result = getModel('non-existent-provider', 'gpt-4o');

      expect(result).toBeUndefined();
    });
  });

  describe('Model Selection Use Cases', () => {
    it('should support typical baseline user workflow', () => {
      // Baseline user sees 7 models only
      const availableModels = getModels(false);
      expect(availableModels).toHaveLength(7);

      // Select GPT-4o Mini (default)
      const selected = getModel('openai', 'gpt-4o-mini');
      expect(selected).toBeDefined();
      expect(selected?.model.isFree).toBe(true); // gpt-4o-mini is free
    });

    it('should support advanced user accessing experimental models', () => {
      // Advanced user sees all 9 models
      const availableModels = getModels(true);
      expect(availableModels).toHaveLength(9);

      // Select extended model (Claude 3 Opus)
      const selected = getModel('anthropic', 'claude-3-opus-20240229');
      expect(selected).toBeDefined();
      expect(selected?.provider.id).toBe('anthropic');
    });

    it('should provide enough models for each provider in baseline', () => {
      const baseline = getModels(false);

      // Each provider should have at least 2 models in baseline
      const openai = baseline.filter((m) => m.provider.id === 'openai');
      const anthropic = baseline.filter((m) => m.provider.id === 'anthropic');
      const google = baseline.filter((m) => m.provider.id === 'google');

      expect(openai.length).toBeGreaterThanOrEqual(2);
      expect(anthropic.length).toBeGreaterThanOrEqual(2);
      expect(google.length).toBeGreaterThanOrEqual(2);
    });

    it('should include both free and paid models', () => {
      const all = getModels(true);

      const freeModels = all.filter((m) => m.model.isFree);
      const paidModels = all.filter((m) => !m.model.isFree);

      expect(freeModels.length).toBeGreaterThan(0);
      expect(paidModels.length).toBeGreaterThan(0);
    });
  });

  describe('Model Metadata Validation', () => {
    it('should have complete metadata for all curated models', () => {
      const curated = getCuratedModels();

      curated.forEach(({ model }) => {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.description).toBeTruthy();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxOutputTokens).toBeGreaterThan(0);
        expect(model.isFree).toBeDefined();
      });
    });

    it('should have complete metadata for all extended models', () => {
      const advanced = getModels(true);
      const extended = advanced.slice(7); // Extended models are after curated

      extended.forEach(({ model }) => {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.description).toBeTruthy();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxOutputTokens).toBeGreaterThan(0);
      });
    });

    it('should have valid pricing info for paid models', () => {
      const all = getModels(true);
      const paidModels = all.filter((m) => !m.model.isFree);

      paidModels.forEach(({ model }) => {
        expect(model.inputCost).toBeGreaterThan(0);
        expect(model.outputCost).toBeGreaterThan(0);
      });
    });
  });

  describe('Advanced Mode Toggle Scenarios', () => {
    it('should show more models when toggling from baseline to advanced', () => {
      const baseline = getModels(false);
      const advanced = getModels(true);

      expect(advanced.length).toBeGreaterThan(baseline.length);
      expect(advanced.length - baseline.length).toBe(2);
    });

    it('should maintain consistent model ordering', () => {
      const first = getModels(true);
      const second = getModels(true);

      expect(first.map((m) => m.model.id)).toEqual(second.map((m) => m.model.id));
    });

    it('should keep curated models at start of list in advanced mode', () => {
      const advanced = getModels(true);
      const firstSeven = advanced.slice(0, 7);
      const curated = getCuratedModels();

      expect(firstSeven.map((m) => m.model.id)).toEqual(curated.map((m) => m.model.id));
    });
  });
});
