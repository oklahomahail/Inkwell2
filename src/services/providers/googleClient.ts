import type { AiRequest } from '@/types/ai';

export async function googleComplete(
  apiKey: string,
  model: string,
  req: AiRequest,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig: {
      temperature: req.temperature ?? 0.7,
      maxOutputTokens: req.maxTokens ?? 512,
    },
    systemInstruction: req.system ? { parts: [{ text: req.system }] } : undefined,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google error ${res.status}: ${error}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  return text;
}
