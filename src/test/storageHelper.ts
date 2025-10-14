/**
 * A simple helper to manage test mode behavior in QuotaAwareStorage
 */
export class StorageHelper {
  private static errorMode = false;
  private static quotaExceeded = false;
  // For test mode only
  private static TEST_QUOTA = 5 * 1024 * 1024; // 5MB default
  private static TEST_USAGE = Math.floor(0.99 * (5 * 1024 * 1024)); // 99% used

  // Mock storage state
  private static mockStore = new Map<string, string>();

  static reset() {
    this.mockStore.clear();
    this.errorMode = false;
    this.quotaExceeded = false;
  }

  static enableErrors() {
    this.errorMode = true;
  }

  static disableErrors() {
    this.errorMode = false;
  }

  static setQuotaExceeded(exceeded: boolean) {
    this.quotaExceeded = exceeded;
  }

  static isErrorMode() {
    return this.errorMode;
  }

  static isQuotaExceeded() {
    return this.quotaExceeded;
  }

  static setItem(key: string, value: string) {
    this.mockStore.set(key, value);
  }

  static getItem(key: string): string | undefined {
    return this.mockStore.get(key);
  }

  static removeItem(key: string) {
    this.mockStore.delete(key);
  }

  static clear() {
    this.mockStore.clear();
  }

  static getQuota() {
    return {
      quota: this.TEST_QUOTA,
      usage: this.TEST_USAGE,
      available: this.TEST_QUOTA - this.TEST_USAGE,
      percentUsed: this.TEST_USAGE / this.TEST_QUOTA,
    };
  }
}
