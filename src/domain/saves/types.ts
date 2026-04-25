import type { LanguageCode } from '../common/types';
import type { ContractState } from '../contracts/types';
import type { ArenaState } from '../combat/types';
import type { BuildingId, BuildingState } from '../buildings/types';
import type { EventState } from '../events/types';
import type { Gladiator } from '../gladiators/types';
import type { LudusState } from '../ludus/types';
import type { MarketState } from '../market/types';
import type { WeeklyPlanningState } from '../planning/types';
import type { GameTimeState } from '../time/types';

export type DemoSaveId = 'demo-early-ludus' | 'demo-mid-ludus' | 'demo-advanced-ludus';

export interface SaveMetadata {
  isDemo?: boolean;
  demoSaveId?: DemoSaveId;
}

export interface GameSave {
  schemaVersion: number;
  saveId: string;
  createdAt: string;
  updatedAt: string;
  player: PlayerProfile;
  settings: GameSettings;
  ludus: LudusState;
  time: GameTimeState;
  buildings: Record<BuildingId, BuildingState>;
  gladiators: Gladiator[];
  market: MarketState;
  arena: ArenaState;
  planning: WeeklyPlanningState;
  contracts: ContractState;
  events: EventState;
  metadata?: SaveMetadata;
}

export interface GameSaveMetadata {
  saveId: string;
  ownerName: string;
  ludusName: string;
  createdAt?: string;
  updatedAt: string;
  schemaVersion: number;
  isDemo?: boolean;
  demoSaveId?: DemoSaveId;
}

export interface PlayerProfile {
  ownerName: string;
  ludusName: string;
  isCloudUser: boolean;
}

export interface GameSettings {
  language: LanguageCode;
}
