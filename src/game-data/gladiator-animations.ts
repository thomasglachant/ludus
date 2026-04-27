import type { BuildingId } from '../domain/buildings/types';
import type { Gladiator } from '../domain/gladiators/types';
import type { CombatFrameKey, MapFrameKey } from './visual-assets';

export type GladiatorMapAnimationId =
  | 'idle'
  | 'walk'
  | 'train'
  | 'eat'
  | 'rest'
  | 'heal'
  | 'celebrate';

export type GladiatorCombatAnimationId = 'idle' | 'attack' | 'hit' | 'block' | 'defeat' | 'victory';

export type GladiatorAnimationState = GladiatorMapAnimationId;

export interface GladiatorAnimationPoint {
  x: number;
  y: number;
}

export interface GladiatorAnimationHitbox extends GladiatorAnimationPoint {
  width: number;
  height: number;
}

export interface GladiatorAnimationDefinition<
  TAnimationId extends string,
  TFrameKey extends string,
> {
  id: TAnimationId;
  frameKey: TFrameKey;
  fallbackFrameKey?: TFrameKey;
  fps: number;
  loop: boolean;
  anchor: GladiatorAnimationPoint;
  hitbox: GladiatorAnimationHitbox;
  ySortOffset: number;
}

export type GladiatorMapAnimationDefinition = GladiatorAnimationDefinition<
  GladiatorMapAnimationId,
  MapFrameKey
>;

export type GladiatorCombatAnimationDefinition = GladiatorAnimationDefinition<
  GladiatorCombatAnimationId,
  CombatFrameKey
>;

const MAP_ANIMATION_ANCHOR = { x: 0.5, y: 1 } as const;
const MAP_ANIMATION_HITBOX = { x: -18, y: -58, width: 36, height: 58 } as const;
const COMBAT_ANIMATION_ANCHOR = { x: 0.5, y: 1 } as const;
const COMBAT_ANIMATION_HITBOX = { x: -42, y: -148, width: 84, height: 148 } as const;

function createMapAnimationDefinition(
  id: GladiatorMapAnimationId,
  frameKey: MapFrameKey,
  fps: number,
  options: Partial<Pick<GladiatorMapAnimationDefinition, 'loop' | 'ySortOffset'>> = {},
): GladiatorMapAnimationDefinition {
  return {
    id,
    frameKey,
    fps,
    loop: options.loop ?? true,
    anchor: MAP_ANIMATION_ANCHOR,
    hitbox: MAP_ANIMATION_HITBOX,
    ySortOffset: options.ySortOffset ?? 0,
  };
}

function createCombatAnimationDefinition(
  id: GladiatorCombatAnimationId,
  frameKey: CombatFrameKey,
  fps: number,
  options: Partial<
    Pick<GladiatorCombatAnimationDefinition, 'fallbackFrameKey' | 'loop' | 'ySortOffset'>
  > = {},
): GladiatorCombatAnimationDefinition {
  return {
    id,
    frameKey,
    fallbackFrameKey: options.fallbackFrameKey,
    fps,
    loop: options.loop ?? false,
    anchor: COMBAT_ANIMATION_ANCHOR,
    hitbox: COMBAT_ANIMATION_HITBOX,
    ySortOffset: options.ySortOffset ?? 0,
  };
}

const animationStateByBuilding: Record<BuildingId, GladiatorMapAnimationId> = {
  domus: 'walk',
  canteen: 'eat',
  dormitory: 'rest',
  trainingGround: 'train',
  pleasureHall: 'celebrate',
  infirmary: 'heal',
};

export const GLADIATOR_MAP_ANIMATION_DEFINITIONS: Record<
  GladiatorMapAnimationId,
  GladiatorMapAnimationDefinition
> = {
  idle: createMapAnimationDefinition('idle', 'map-idle', 3),
  walk: createMapAnimationDefinition('walk', 'map-walk', 7),
  train: createMapAnimationDefinition('train', 'map-train', 8),
  eat: createMapAnimationDefinition('eat', 'map-eat', 4),
  rest: createMapAnimationDefinition('rest', 'map-rest', 2),
  heal: createMapAnimationDefinition('heal', 'map-healing', 3),
  celebrate: createMapAnimationDefinition('celebrate', 'map-celebrate', 6),
};

export const GLADIATOR_COMBAT_ANIMATION_DEFINITIONS: Record<
  GladiatorCombatAnimationId,
  GladiatorCombatAnimationDefinition
> = {
  idle: createCombatAnimationDefinition('idle', 'combat-idle', 4, { loop: true }),
  attack: createCombatAnimationDefinition('attack', 'combat-attack', 9),
  hit: createCombatAnimationDefinition('hit', 'combat-hit', 8, {
    fallbackFrameKey: 'combat-idle',
  }),
  block: createCombatAnimationDefinition('block', 'combat-block', 7, {
    fallbackFrameKey: 'combat-idle',
  }),
  defeat: createCombatAnimationDefinition('defeat', 'combat-defeat', 3, {
    fallbackFrameKey: 'combat-idle',
    ySortOffset: -8,
  }),
  victory: createCombatAnimationDefinition('victory', 'combat-victory', 5, {
    fallbackFrameKey: 'combat-idle',
  }),
};

export function getGladiatorMapAnimationDefinition(gladiator: Gladiator) {
  const state = gladiator.currentBuildingId
    ? animationStateByBuilding[gladiator.currentBuildingId]
    : 'idle';

  return GLADIATOR_MAP_ANIMATION_DEFINITIONS[state];
}

export function getGladiatorMapAnimationDefinitionById(animationId: GladiatorMapAnimationId) {
  return GLADIATOR_MAP_ANIMATION_DEFINITIONS[animationId];
}

export function getGladiatorCombatAnimationDefinitionById(animationId: GladiatorCombatAnimationId) {
  return GLADIATOR_COMBAT_ANIMATION_DEFINITIONS[animationId];
}
