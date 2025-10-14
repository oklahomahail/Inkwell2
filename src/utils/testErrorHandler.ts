// testErrorHandler.ts
export class TestErrorHandler {
  private static enabled = false;
  private static quotaExceeded = false;

  static enable() {
    this.enabled = true;
  }

  static disable() {
    this.enabled = false;
  }

  static setQuotaExceeded(exceeded: boolean) {
    this.quotaExceeded = exceeded;
  }

  static isEnabled() {
    return this.enabled;
  }

  static isQuotaExceeded() {
    return this.quotaExceeded;
  }
}
