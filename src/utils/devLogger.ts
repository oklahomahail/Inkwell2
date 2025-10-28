type Args = any[];

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export const devLog = {
  debug: (...args: Args) => {
    if (isDev) console.debug(...args);
  },
  warn: (...args: Args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: Args) => console.error(...args), // errors always surface
};

export default devLog;
