import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type Surface = 'normal' | 'glass';
export type WeightUnit = 'kg' | 'lb';
export type VolumeUnit = 'ml' | 'l';
export type FoodUnit = 'g' | 'oz';
export type HeightUnit = 'cm' | 'ft';

export type Settings = {
  stepGoal: number;
  waterGoalMl: number;
  activeCalorieGoal: number;
  theme: Theme;
  surface: Surface;
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  foodUnit: FoodUnit;
  heightUnit: HeightUnit;
};

export const DEFAULT_SETTINGS: Settings = {
  stepGoal: 10000,
  waterGoalMl: 2500,
  activeCalorieGoal: 500,
  theme: 'light',
  surface: 'normal',
  weightUnit: 'kg',
  volumeUnit: 'l',
  foodUnit: 'g',
  heightUnit: 'cm',
};

const KEY = 'app_settings';

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Applies the theme to <html> so CSS variables switch instantly. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Applies the surface style (normal / liquid glass) to <html>. */
export function applySurface(surface: Surface): void {
  document.documentElement.setAttribute('data-surface', surface);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(read);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    applySurface(settings.surface);
  }, [settings.surface]);

  const save = useCallback((next: Partial<Settings>) => {
    setSettings(current => {
      const merged = { ...current, ...next };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return { settings, save };
}
