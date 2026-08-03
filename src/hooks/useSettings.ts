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
  backdrop: string; // '' = aurora; otherwise an image URL / data URL for glass mode
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
  backdrop: '',
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

/** Sets the glass backdrop image (or clears it, falling back to the aurora). */
export function applyBackdrop(backdrop: string): void {
  const root = document.documentElement;
  if (backdrop) {
    root.style.setProperty('--backdrop-image', `url("${backdrop}")`);
    root.setAttribute('data-backdrop', 'image');
  } else {
    root.style.removeProperty('--backdrop-image');
    root.setAttribute('data-backdrop', 'aurora');
  }
}

/**
 * Keeps the iOS PWA status-bar tint in step with the surface. On iOS the area
 * behind the status bar is painted from the `theme-color` meta, so a fixed
 * near-white value shows as a white strip up top in dark / photo-glass modes.
 * A photo backdrop reads dark; otherwise follow the light/dark theme.
 */
export function applyThemeColor(theme: Theme, backdrop: string): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const color = backdrop ? '#0b0d16' : theme === 'dark' ? '#101018' : '#f7f7fb';
  meta.setAttribute('content', color);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(read);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    applySurface(settings.surface);
  }, [settings.surface]);

  useEffect(() => {
    applyBackdrop(settings.backdrop);
  }, [settings.backdrop]);

  useEffect(() => {
    applyThemeColor(settings.theme, settings.backdrop);
  }, [settings.theme, settings.backdrop]);

  const save = useCallback((next: Partial<Settings>) => {
    setSettings(current => {
      const merged = { ...current, ...next };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return { settings, save };
}
