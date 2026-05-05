import type { BuildingId } from '../buildings/types';
import type { GameDate } from '../time/types';

export type GameNotificationParams = Record<string, string | number>;

export type GameNotificationTarget =
  | { kind: 'building'; buildingId: BuildingId }
  | { kind: 'gladiator'; gladiatorId: string };

export interface GameNotification {
  id: string;
  occurredAt: GameDate;
  titleKey: string;
  descriptionKey: string;
  params?: GameNotificationParams;
  target?: GameNotificationTarget;
  archivedAt?: GameDate;
}
