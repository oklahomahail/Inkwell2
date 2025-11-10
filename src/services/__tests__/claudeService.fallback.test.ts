import { describe, it, expect, beforeEach, vi } from 'vitest';

import claudeService from '../claudeService';

describe('Claude Service - Fallback Mode', () => {
  beforeEach(() => {
    // Clear any stored API key
    localStorage.clear();
  });

  describe('sendMessage with fallback', () => {
    it('should return fallback response when API key not configured', async () => {
      const response = await claudeService.sendMessage('Help me write a story', {
        useFallback: true,
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content).toContain('Basic Mode');
      expect(response.content).toContain('API key');
    });

    it('should include user request in fallback response', async () => {
      const userPrompt = 'Continue my story about dragons';
      const response = await claudeService.sendMessage(userPrompt, {
        useFallback: true,
      });

      expect(response.content).toContain('Your request');
    });

    it('should provide upgrade instructions in fallback response', async () => {
      const response = await claudeService.sendMessage('Any prompt', {
        useFallback: true,
      });

      expect(response.content).toContain('Settings');
      expect(response.content).toContain('API key');
      expect(response.content).toContain('https://console.anthropic.com');
    });

    it('should truncate long prompts in fallback response', async () => {
      const longPrompt = 'A'.repeat(300);
      const response = await claudeService.sendMessage(longPrompt, {
        useFallback: true,
      });

      // Should truncate to ~150 chars
      expect(response.content).not.toContain('A'.repeat(200));
      expect(response.content).toContain('...');
    });

    it('should throw error when fallback not enabled', async () => {
      await expect(async () => {
        await claudeService.sendMessage('Test prompt', {
          useFallback: false,
        });
      }).rejects.toThrow('API key not configured');
    });
  });

  describe('generateStream with fallback', () => {
    it('should yield fallback response when API key not configured', async () => {
      const chunks: string[] = [];

      for await (const chunk of claudeService.generateStream('Test prompt', {
        useFallback: true,
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('Basic Mode');
      expect(fullResponse).toContain('API key');
    });

    it('should throw error when streaming without fallback enabled', async () => {
      const generator = claudeService.generateStream('Test', {
        useFallback: false,
      });

      await expect(async () => {
        for await (const _chunk of generator) {
          // Should not reach here
        }
      }).rejects.toThrow('API key not configured');
    });
  });

  describe('isConfigured', () => {
    it('should return false when no API key stored', () => {
      expect(claudeService.isConfigured()).toBe(false);
    });

    it('should return true after initializing with valid key', () => {
      claudeService.initialize('sk-ant-test-key-123456789012345678901234567890');
      expect(claudeService.isConfigured()).toBe(true);
    });
  });
});
