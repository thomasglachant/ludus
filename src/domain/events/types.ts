import type { BuildingId } from '../buildings/types';
import type { DayOfWeek } from '../time/types';

export type GameEventStatus = 'pending' | 'resolved' | 'expired';

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
      traitId: string;
      durationDays: number;
      bypassActivityEligibility?: boolean;
    }
  | {
      type: 'changeGladiatorStat';
      gladiatorId: string;
      stat: 'strength' | 'agility' | 'defense' | 'life';
      amount: number;
      bypassActivityEligibility?: boolean;
    };
