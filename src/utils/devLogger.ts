type Args = any[];

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export const devLog = {
  debug: (...args: Args) => {
    if (isDev) devLog.debug(...args);
  },
  warn: (...args: Args) => {
    if (isDev) devLog.warn(...args);
  },
  error: (...args: Args) => devLog.error(...args), // errors always surface
};

export default devLog;
