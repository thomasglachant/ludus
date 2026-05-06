import './arena.css';
import type { GameSave } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { GameEmptyState } from '@/ui/shared/ludus/GameFeedback';
import { GameBadge, GameSection } from '@/ui/shared/ludus/GameSection';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { getArenaDayViewModel } from './arena-view-model';

interface ArenaPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenArenaRoute(): void;
}

export function ArenaPanel({ save, onOpenArenaRoute }: ArenaPanelProps) {
  const { t } = useUiStore();
  const viewModel = getArenaDayViewModel(save);

  if (save.arena.arenaDay) {
    return (
      <section className="panel-shell panel-shell--wide" data-testid="arena-panel">
        <GameSection titleKey="arenaRoute.redirectTitle" testId="arena-route-link">
          <p>{t('arenaRoute.redirectBody')}</p>
          <ActionBar className="context-panel__action-bar">
            <PrimaryActionButton type="button" onClick={onOpenArenaRoute}>
              <GameIcon name="landmark" size={17} />
              <span>{t('arenaRoute.enterArena')}</span>
            </PrimaryActionButton>
          </ActionBar>
        </GameSection>
      </section>
    );
  }

  return (
    <section className="panel-shell panel-shell--wide" data-testid="arena-panel">
      <GameBadge
        label={t(viewModel.statusKey)}
        tone={viewModel.isArenaDayActive ? 'success' : 'neutral'}
      />
      <GameSection titleKey="arena.closedTitle" testId="arena-closed-message">
        <p>{t('arena.closedBody')}</p>
        <div className="arena-closed-panel__facts">
          <span>{t('arena.closedSchedule')}</span>
        </div>
        <GameEmptyState messageKey={viewModel.emptyMessageKey ?? 'arena.nextSunday'} />
      </GameSection>
    </section>
  );
}
