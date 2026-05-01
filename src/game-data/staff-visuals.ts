import type { StaffType, StaffVisualId } from '../domain/staff/types';

type StaffVisualSet = readonly [
  StaffVisualId,
  StaffVisualId,
  StaffVisualId,
  StaffVisualId,
  StaffVisualId,
];

export const STAFF_VISUAL_IDS_BY_TYPE = {
  slave: ['slave-01', 'slave-02', 'slave-03', 'slave-04', 'slave-05'],
  guard: ['guard-01', 'guard-02', 'guard-03', 'guard-04', 'guard-05'],
  trainer: ['trainer-01', 'trainer-02', 'trainer-03', 'trainer-04', 'trainer-05'],
} as const satisfies Record<StaffType, StaffVisualSet>;

export const STAFF_VISUAL_ASSET_PATHS = Object.fromEntries(
  Object.values(STAFF_VISUAL_IDS_BY_TYPE)
    .flat()
    .map((visualId) => [visualId, `/assets/generated/staff/${visualId}.png`]),
) as Record<StaffVisualId, string>;

export const STAFF_AVATAR_ASSET_PATHS = Object.fromEntries(
  Object.values(STAFF_VISUAL_IDS_BY_TYPE)
    .flat()
    .map((visualId) => [visualId, `/assets/generated/staff/avatars/${visualId}.png`]),
) as Record<StaffVisualId, string>;

export function getStaffVisualIdsForType(type: StaffType) {
  return STAFF_VISUAL_IDS_BY_TYPE[type];
}

export function isStaffVisualIdForType(type: StaffType, visualId: string) {
  return (getStaffVisualIdsForType(type) as readonly string[]).includes(visualId);
}

export function getStaffVisualAssetPath(visualId: StaffVisualId) {
  return STAFF_VISUAL_ASSET_PATHS[visualId];
}

export function getStaffAvatarAssetPath(visualId: StaffVisualId) {
  return STAFF_AVATAR_ASSET_PATHS[visualId] ?? getStaffVisualAssetPath(visualId);
}
