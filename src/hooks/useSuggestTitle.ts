import { useAi } from '@/services/aiService';

/**
 * Example hook demonstrating the two-tier AI integration.
 * Suggests creative titles for middle-grade fiction based on a synopsis.
 */
export function useSuggestTitle() {
  const { complete } = useAi();

  return async function suggestTitle(synopsis: string): Promise<string> {
    if (!synopsis || synopsis.trim().length === 0) {
      throw new Error('Synopsis cannot be empty');
    }

    const text = await complete({
      system:
        'You help authors craft concise, evocative working titles for middle grade fiction. Provide 5 creative title options that capture the essence of the story.',
      prompt: `Synopsis:\n${synopsis}\n\nGive 5 title options, each on a new line with a number.`,
      temperature: 0.8,
      maxTokens: 300,
    });

    return text;
  };
}
