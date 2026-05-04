function isFeatureFlagEnabled(value: string | undefined) {
  return value === 'true';
}

export const featureFlags = {
  enableDemoMode: isFeatureFlagEnabled(import.meta.env.VITE_ENABLE_DEMO_MODE),
  enableDebugUi: isFeatureFlagEnabled(import.meta.env.VITE_ENABLE_DEBUG_UI),
};
