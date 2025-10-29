type Args = unknown[];

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export const devLog = {
  debug: (...args: Args): void => {
    if (isDev) console.debug(...args);
  },
  warn: (...args: Args): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: Args): void => {
    console.error(...args); // errors always surface
  },
};

export default devLog;
