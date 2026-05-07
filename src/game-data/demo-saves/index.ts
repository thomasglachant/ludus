import { demoAdvancedLudus } from './demo-advanced-ludus';
import { demoEarlyLudus } from './demo-early-ludus';
import { demoMidLudus } from './demo-mid-ludus';

export type { DemoSaveDefinition } from './types';

export const DEMO_SAVE_DEFINITIONS = [demoEarlyLudus, demoMidLudus, demoAdvancedLudus] as const;

export type DemoSaveId = (typeof DEMO_SAVE_DEFINITIONS)[number]['id'];

export function isDemoSaveId(value: string): value is DemoSaveId {
  return DEMO_SAVE_DEFINITIONS.some((definition) => definition.id === value);
}

export function getDemoSaveDefinition(demoSaveId: DemoSaveId) {
  return DEMO_SAVE_DEFINITIONS.find((definition) => definition.id === demoSaveId);
}
