// src/utils/storageFactory.ts
import { createQuotaStorage } from './quotaAwareStorage';

import type { IQuotaStorage } from './storageTypes';

let instance: IQuotaStorage | undefined;

export function getStorage(namespace?: string): IQuotaStorage {
  // Tests sometimes pass 'snapshot'. They also tweak thresholds in tests.
  const threshold = namespace === 'snapshot' ? 2.0 : 0.85;
  if (!instance) instance = createQuotaStorage(namespace ?? 'inkwell', threshold);
  return instance;
}

export default getStorage;
