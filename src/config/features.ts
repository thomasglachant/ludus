export function isDemoModeEnabled(value: string | undefined) {
  return value === 'true';
}

export const featureFlags = {
  enableDemoMode: isDemoModeEnabled(import.meta.env.VITE_ENABLE_DEMO_MODE),
  enableDebugUi: isDemoModeEnabled(import.meta.env.VITE_ENABLE_DEBUG_UI),
  usePlaceholderArt: isDemoModeEnabled(import.meta.env.VITE_USE_PLACEHOLDER_ART),
};
