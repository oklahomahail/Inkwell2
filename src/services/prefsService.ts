type PrefsKey = `${string}.${string}`;

export function usePrefs() {
  const get = (key: PrefsKey): boolean | undefined => {
    const value = localStorage.getItem(`pref.${key}`);
    return value ? JSON.parse(value) : undefined;
  };

  const set = (key: PrefsKey, value: boolean): void => {
    localStorage.setItem(`pref.${key}`, JSON.stringify(value));
  };

  return { get, set };
}
