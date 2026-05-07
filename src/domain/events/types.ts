import type { BuildingId } from '../buildings/types';
import type { GladiatorSkillName } from '../gladiators/skills';
import type { TemporaryGladiatorTraitId } from '../gladiators/traits';
import type { DayOfWeek } from '../time/types';

export const GAME_EVENT_STATUSES = ['pending', 'resolved', 'expired'] as const;

export type GameEventStatus = (typeof GAME_EVENT_STATUSES)[number];

export const GAME_EVENT_SOURCES = ['daily', 'reactive'] as const;

export type GameEventSource = (typeof GAME_EVENT_SOURCES)[number];

export const GAME_EVENT_CONSEQUENCE_KINDS = ['certain', 'chance', 'oneOf'] as const;

export type GameEventConsequenceKind = (typeof GAME_EVENT_CONSEQUENCE_KINDS)[number];

export const GAME_EVENT_EFFECT_TYPES = [
  'changeTreasury',
  'changeLudusReputation',
  'changeLudusHappiness',
  'changeLudusRebellion',
  'setGameLost',
  'startDebtGrace',
  'removeGladiator',
  'releaseAllGladiators',
  'changeGladiatorExperience',
  'applyGladiatorTrait',
  'changeGladiatorStat',
] as const;

export type GameEventEffectType = (typeof GAME_EVENT_EFFECT_TYPES)[number];

export interface GameEventChoice {
  id: string;
  labelKey: string;
  consequenceKey: string;
  consequences: GameEventConsequence[];
}

export interface GameEventOutcome {
  id: string;
  chancePercent: number;
  effects?: GameEventEffect[];
  textKey?: string;
}

export type GameEventConsequence =
  | { kind: 'certain'; effects: GameEventEffect[] }
  | {
      kind: 'chance';
      id: string;
      chancePercent: number;
      effects?: GameEventEffect[];
      textKey?: string;
    }
  | { kind: 'oneOf'; outcomes: GameEventOutcome[] };

export interface GameEvent {
  id: string;
  definitionId: string;
  source?: GameEventSource;
  titleKey: string;
  descriptionKey: string;
  status: GameEventStatus;
  createdAtYear: number;
  createdAtWeek: number;
  createdAtDay: DayOfWeek;
  gladiatorId?: string;
  buildingId?: BuildingId;
  choices: GameEventChoice[];
  selectedChoiceId?: string;
  resolvedOutcomeIds?: string[];
}

export interface EventState {
  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];
  launchedEvents: LaunchedGameEventRecord[];
}

export interface LaunchedGameEventRecord {
  eventId: string;
  definitionId: string;
  launchedAtYear: number;
  launchedAtWeek: number;
  launchedAtDay: DayOfWeek;
}

export type GameEventEffect =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeLudusHappiness'; amount: number }
  | { type: 'changeLudusRebellion'; amount: number }
  | { type: 'setGameLost' }
  | { type: 'startDebtGrace' }
  | { type: 'removeGladiator'; gladiatorId: string; bypassActivityEligibility?: boolean }
  | { type: 'releaseAllGladiators' }
  | {
      type: 'changeGladiatorExperience';
      gladiatorId: string;
      amount: number;
      bypassActivityEligibility?: boolean;
    }
  | {
      type: 'applyGladiatorTrait';
      gladiatorId: string;
      traitId: TemporaryGladiatorTraitId;
      durationDays: number;
      bypassActivityEligibility?: boolean;
    }
  | {
      type: 'changeGladiatorStat';
      gladiatorId: string;
      stat: GladiatorSkillName;
      amount: number;
      bypassActivityEligibility?: boolean;
    };
