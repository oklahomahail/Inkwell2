interface WaitForElementOptions {
  timeout?: number;
  pollEveryMs?: number;
  root?: Document | HTMLElement;
}

export async function waitForElement(
  selector: string,
  { timeout = 8000, pollEveryMs = 100, root = document }: WaitForElementOptions = {},
): Promise<Element | null> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      const element = root.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        resolve(null);
        return;
      }

      setTimeout(check, pollEveryMs);
    };

    check();
  });
}
