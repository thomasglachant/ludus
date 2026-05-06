import { sortGameNotificationsByDateDesc } from '@/domain/notifications/notification-actions';
import type { GameSave } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { GameSurface, SurfaceHeader } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { NotificationList } from './NotificationList';

export function NotificationsSurface({ save }: { save: GameSave }) {
  const { openSurface } = useUiStore();
  const { archiveNotification } = useGameStore();
  const notifications = sortGameNotificationsByDateDesc(save.notifications);

  return (
    <GameSurface className="game-surface--notifications" testId="notifications-surface">
      <SurfaceHeader titleKey="notifications.title" />
      <div className="game-surface__body">
        <NotificationList
          emptyMessageKey="notifications.empty"
          notifications={notifications}
          save={save}
          variant="full"
          onArchive={archiveNotification}
          onOpenBuilding={(buildingId) =>
            openSurface({
              kind: 'buildings',
              selectedBuildingId: buildingId,
              selectedBuildingTab: 'overview',
            })
          }
          onOpenGladiator={(gladiatorId) =>
            openSurface({
              kind: 'gladiators',
              selectedGladiatorId: gladiatorId,
            })
          }
        />
      </div>
    </GameSurface>
  );
}
