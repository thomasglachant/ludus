import type { ArenaState } from '../combat/types';
import type { BuildingId, BuildingState } from '../buildings/types';
import type { EconomyState } from '../economy/types';
import type { EventState } from '../events/types';
import type { Gladiator } from '../gladiators/types';
import type { LudusState } from '../ludus/types';
import type { MarketState } from '../market/types';
import type { WeeklyPlanningState } from '../planning/types';
import type { GameTimeState } from '../time/types';

export type DemoSaveId = 'demo-early-ludus' | 'demo-mid-ludus' | 'demo-advanced-ludus';

export interface SaveMetadata {
  demoSaveId?: DemoSaveId;
}

export interface GameSave {
  schemaVersion: number;
  gameId: string;
  saveId: string;
  createdAt: string;
  updatedAt: string;
  player: PlayerProfile;
  ludus: LudusState;
  time: GameTimeState;
  buildings: Record<BuildingId, BuildingState>;
  gladiators: Gladiator[];
  economy: EconomyState;
  market: MarketState;
  arena: ArenaState;
  planning: WeeklyPlanningState;
  events: EventState;
  metadata?: SaveMetadata;
}

export interface GameSaveMetadata {
  gameId: string;
  saveId: string;
  ludusName: string;
  createdAt?: string;
  updatedAt: string;
  schemaVersion: number;
  isDemo?: boolean;
  demoSaveId?: DemoSaveId;
}

export interface PlayerProfile {
  ludusName: string;
  isCloudUser: boolean;
}
