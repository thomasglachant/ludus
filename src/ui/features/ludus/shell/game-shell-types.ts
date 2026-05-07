import type { LudusSurfaceKind } from '@/state/ui-store-context';

export const PRIMARY_NAVIGATION_KINDS = [
  'buildings',
  'finance',
  'gladiators',
  'market',
  'planning',
] as const satisfies readonly LudusSurfaceKind[];

export type PrimaryNavigationKind = (typeof PRIMARY_NAVIGATION_KINDS)[number];
