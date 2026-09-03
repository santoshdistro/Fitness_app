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
 * Keeps the iOS PWA status-bar tint in step with the surface. On iOS the band
 * above the web view is painted from the `theme-color` meta, so getting this
 * wrong shows as a stripe across the top of the app.
 *
 * The backdrop only darkens anything in GLASS mode. A backdrop picked once and
 * left behind stays in settings, inert on the normal surface — and testing it
 * alone painted a near-black bar over the light theme, in both themes, for as
 * long as that stale value sat there.
 *
 * The colour is read back from --bg rather than repeated as a hex, so it cannot
 * drift when the palette changes; the literals are only a pre-stylesheet fallback.
 */
export function applyThemeColor(theme: Theme, backdrop: string, surface: Surface): void {
  // ALL of them: index.html ships one per colour scheme so the band is right
  // before any script runs, and the browser uses whichever media matched. The
  // app's theme is a manual setting that need not agree with the phone's, so
  // both get the same value here and the matched one is correct either way.
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (!metas.length) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const color =
    surface === 'glass' && backdrop
      ? '#0b0d16'
      : bg || (theme === 'dark' ? '#0a0a0a' : '#f7f7fb');
  metas.forEach(meta => meta.setAttribute('content', color));
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
    applyThemeColor(settings.theme, settings.backdrop, settings.surface);
  }, [settings.theme, settings.backdrop, settings.surface]);

  const save = useCallback((next: Partial<Settings>) => {
    setSettings(current => {
      const merged = { ...current, ...next };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return { settings, save };
}
