const isProd = import.meta.env.PROD;

export const log = {
  info: (...a: unknown[]) => {
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.log(...a);
    }
  },
  warn: (...a: unknown[]) => {
    if (!isProd) {
      console.warn(...a);
    }
  },
  error: (...a: unknown[]) => {
    // Keep visible in prod

    console.error(...a);
  },
};

export type Logger = typeof log;
