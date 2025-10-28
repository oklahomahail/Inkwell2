import devLog from "@/utils/devLog";
const isProd = import.meta.env.PROD;

export const log = {
  info: (...a: unknown[]) => {
    if (!isProd) {
       
      devLog.debug(...a);
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
