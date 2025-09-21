const flags = new Map<string, boolean>([
  ['legacy-navigation', true], // start true, flip off after migration
]);

export default {
  get: (k: string) => flags.get(k),
  set: (k: string, v: boolean) => flags.set(k, v),
};
