/**
 * Helper class to manage test state and error injection
 */
export class TestHelper {
  private static instance: TestHelper;
  private errorMode = false;
  private quotaExceeded = false;
  private mockData: Record<string, string> = {};

  private constructor() {}

  static getInstance(): TestHelper {
    if (!TestHelper.instance) {
      TestHelper.instance = new TestHelper();
    }
    return TestHelper.instance;
  }

  enableErrorMode() {
    this.errorMode = true;
  }

  disableErrorMode() {
    this.errorMode = false;
  }

  setQuotaExceeded(exceeded: boolean) {
    this.quotaExceeded = exceeded;
  }

  isErrorModeEnabled() {
    return this.errorMode;
  }

  isQuotaExceeded() {
    return this.quotaExceeded;
  }

  reset() {
    this.errorMode = false;
    this.quotaExceeded = false;
    this.mockData = {};
  }

  setMockData(key: string, value: string) {
    this.mockData[key] = value;
  }

  getMockData(key: string) {
    return this.mockData[key];
  }

  removeMockData(key: string) {
    delete this.mockData[key];
  }
}

export const testHelper = TestHelper.getInstance();
