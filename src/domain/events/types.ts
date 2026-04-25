import type { BuildingId } from '../buildings/types';
import type { DayOfWeek } from '../time/types';

export type GameEventStatus = 'pending' | 'resolved' | 'expired';

export interface GameEventChoice {
  id: string;
  labelKey: string;
  consequenceKey: string;
  effects: GameEventEffect[];
}

export interface GameEvent {
  id: string;
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
}

export interface EventState {
  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];
}

export type GameEventEffect =
  | { type: 'changeTreasury'; amount: number }
  | { type: 'changeLudusReputation'; amount: number }
  | { type: 'changeGladiatorHealth'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorEnergy'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorMorale'; gladiatorId: string; amount: number }
  | { type: 'changeGladiatorSatiety'; gladiatorId: string; amount: number }
  | {
      type: 'changeGladiatorStat';
      gladiatorId: string;
      stat: 'strength' | 'agility' | 'defense';
      amount: number;
    };
