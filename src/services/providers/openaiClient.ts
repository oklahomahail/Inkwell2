import type { AiRequest } from '@/types/ai';

export async function openaiComplete(
  apiKey: string,
  model: string,
  req: AiRequest,
): Promise<string> {
  const body = {
    model,
    messages: [
      req.system ? { role: 'system', content: req.system } : null,
      { role: 'user', content: req.prompt },
    ].filter(Boolean),
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 512,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${error}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}
