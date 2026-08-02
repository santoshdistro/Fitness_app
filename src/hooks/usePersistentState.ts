import { useEffect, useState } from 'react';

// A string state that survives remounts and app restarts by mirroring to
// localStorage. Used for tab selections so switching tabs (or the OS reloading
// the PWA) doesn't throw you back to the first tab.
export function usePersistentState<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value]);

  return [value, setValue];
}
