import type { AiRequest } from '@/types/ai';

export async function anthropicComplete(
  apiKey: string,
  model: string,
  req: AiRequest,
): Promise<string> {
  const body = {
    model,
    system: req.system || undefined,
    max_tokens: req.maxTokens ?? 512,
    temperature: req.temperature ?? 0.7,
    messages: [{ role: 'user', content: req.prompt }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${error}`);
  }

  const json = await res.json();
  const text = (json.content?.[0]?.text as string) ?? '';
  return text;
}
