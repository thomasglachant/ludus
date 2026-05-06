import './gladiators.css';
import { useMemo } from 'react';
import { canGladiatorPerformActivities } from '@/domain/gladiator-traits/gladiator-trait-actions';
import { getAvailableSkillPoints } from '@/domain/gladiators/progression';
import { calculateGladiatorSaleValue } from '@/domain/market/market-actions';
import type { GameSave, Gladiator } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore, type RosterFilter } from '@/state/ui-store-context';
import { GameSurface, SurfaceHeader, SurfaceTabs } from '@/ui/features/ludus/surfaces/SurfaceFrame';
import { EntityList } from '@/ui/shared/components/EntityList';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { GladiatorDetailPanel } from './GladiatorDetailPanel';
import { GladiatorListRow } from './GladiatorListRow';

const rosterFilters: RosterFilter[] = ['all', 'ready', 'injured', 'levelUp'];

function canPerformActivities(save: GameSave, gladiatorId: string) {
  return canGladiatorPerformActivities(save, gladiatorId);
}

function getFilteredGladiators(save: GameSave, filter: RosterFilter) {
  if (filter === 'ready') {
    return save.gladiators.filter((gladiator) => canPerformActivities(save, gladiator.id));
  }

  if (filter === 'injured') {
    return save.gladiators.filter((gladiator) => !canPerformActivities(save, gladiator.id));
  }

  if (filter === 'levelUp') {
    return save.gladiators.filter((gladiator) => getAvailableSkillPoints(gladiator) > 0);
  }

  return save.gladiators;
}

function requestSellGladiator(
  gladiator: Gladiator,
  onSellGladiator: (gladiatorId: string) => void,
  openConfirmModal: ReturnType<typeof useUiStore>['openConfirmModal'],
) {
  openConfirmModal({
    kind: 'confirm',
    confirmLabelKey: 'market.sell',
    messageKey: 'market.sellConfirmation',
    messageParams: { name: gladiator.name },
    onConfirm: () => onSellGladiator(gladiator.id),
    testId: 'market-sell-confirm-dialog',
    titleKey: 'market.sellConfirmationTitle',
  });
}

export function RosterSurface({ save }: { save: GameSave }) {
  const { activeSurface, openConfirmModal, openSurface, t } = useUiStore();
  const { allocateGladiatorSkillPoint, sellGladiator } = useGameStore();
  const filter = activeSurface.rosterFilter ?? 'all';
  const gladiators = useMemo(() => getFilteredGladiators(save, filter), [filter, save]);
  const selectedGladiator = save.gladiators.find(
    (gladiator) => gladiator.id === activeSurface.selectedGladiatorId,
  );

  if (selectedGladiator) {
    return (
      <GameSurface className="game-surface--roster" testId="roster-surface">
        <SurfaceHeader
          backLabelKey="navigation.gladiators"
          eyebrowKey="roster.eyebrow"
          title={selectedGladiator.name}
          onBack={() => openSurface({ kind: 'gladiators', rosterFilter: filter })}
        />
        <div className="game-surface__body game-surface__body--detail roster-surface__body">
          <div className="roster-surface__detail">
            <GladiatorDetailPanel
              gladiator={selectedGladiator}
              save={save}
              onAllocateSkillPoint={allocateGladiatorSkillPoint}
              onClose={() => openSurface({ kind: 'gladiators', rosterFilter: filter })}
              onOpenPlanning={() => openSurface({ kind: 'planning' })}
            />
          </div>
        </div>
      </GameSurface>
    );
  }

  return (
    <GameSurface className="game-surface--roster" testId="roster-surface">
      <SurfaceHeader eyebrowKey="roster.eyebrow" titleKey="roster.title">
        <SurfaceTabs<RosterFilter>
          ariaLabelKey="surface.rosterFilters"
          items={rosterFilters.map((id) => ({
            count: getFilteredGladiators(save, id).length,
            id,
            labelKey: `surface.rosterFilter.${id}`,
          }))}
          selectedId={filter}
          onSelect={(rosterFilter) => openSurface({ kind: 'gladiators', rosterFilter })}
        />
      </SurfaceHeader>
      <div className="game-surface__body game-surface__body--list roster-surface__body">
        <div className="roster-surface__list">
          <EntityList emptyMessageKey="ludus.noGladiators">
            {gladiators.map((gladiator) => (
              <GladiatorListRow
                action={{
                  iconName: 'userMinus',
                  id: 'sell',
                  label: `${t('market.sell')} (${formatMoneyAmount(
                    calculateGladiatorSaleValue(gladiator),
                  )})`,
                  onClick: () => requestSellGladiator(gladiator, sellGladiator, openConfirmModal),
                  testId: `market-sell-${gladiator.id}`,
                }}
                gladiator={gladiator}
                key={gladiator.id}
                openLabel={t('roster.openGladiator', { name: gladiator.name })}
                save={save}
                testId={`roster-surface-row-${gladiator.id}`}
                onOpen={() =>
                  openSurface({
                    kind: 'gladiators',
                    rosterFilter: filter,
                    selectedGladiatorId: gladiator.id,
                  })
                }
              />
            ))}
          </EntityList>
        </div>
      </div>
    </GameSurface>
  );
}
