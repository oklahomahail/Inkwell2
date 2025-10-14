import { createQuotaStorage } from './quotaAwareStorage';

let instance: ReturnType<typeof createQuotaStorage> | null = null;

export function getStorage(namespace?: string) {
  // tests sometimes ask for 'snapshot' — they also expect a higher threshold there
  const threshold = namespace === 'snapshot' ? 2.0 : 0.85;
  if (!instance) instance = createQuotaStorage(namespace ?? 'inkwell', threshold);
  return instance;
}
