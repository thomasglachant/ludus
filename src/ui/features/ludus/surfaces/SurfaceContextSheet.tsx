import type { GameSave, Gladiator } from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { GladiatorExperienceBar } from '@/ui/features/gladiators/GladiatorExperienceBar';
import { GladiatorPortrait } from '@/ui/features/gladiators/GladiatorPortrait';
import { GladiatorSkillBars } from '@/ui/features/gladiators/GladiatorSkillBars';
import { GladiatorSkills } from '@/ui/features/gladiators/GladiatorSkills';
import { GladiatorTraits } from '@/ui/features/gladiators/GladiatorTraits';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { Button } from '@/ui/shared/ludus/Button';
import { ContextSheet } from './SurfaceFrame';

function GladiatorContextSheet({ gladiator, save }: { gladiator: Gladiator; save: GameSave }) {
  const { closeContextSheet, openSurface, t } = useUiStore();

  return (
    <ContextSheet titleKey="surface.contextSheet.gladiatorTitle" onClose={closeContextSheet}>
      <div className="context-sheet__hero">
        <GladiatorPortrait gladiator={gladiator} size="large" />
        <div>
          <span>{t('gladiatorPanel.eyebrow')}</span>
          <h3>{gladiator.name}</h3>
          <GladiatorTraits gladiator={gladiator} save={save} variant="compact" />
          <GladiatorSkills gladiator={gladiator} />
        </div>
      </div>
      <GladiatorSkillBars gladiator={gladiator} />
      <GladiatorExperienceBar gladiator={gladiator} />
      <ActionBar className="context-sheet__actions">
        <Button
          type="button"
          onClick={() => {
            closeContextSheet();
            openSurface({ kind: 'gladiators', selectedGladiatorId: gladiator.id });
          }}
        >
          <GameIcon name="view" size={17} />
          <span>{t('surface.openFullGladiator')}</span>
        </Button>
      </ActionBar>
    </ContextSheet>
  );
}

export function SurfaceContextSheet({ save }: { save: GameSave }) {
  const { activeSurface } = useUiStore();

  if (!activeSurface.contextSheet) {
    return null;
  }

  if (activeSurface.contextSheet.kind === 'gladiator') {
    const gladiator = save.gladiators.find(
      (candidate) => candidate.id === activeSurface.contextSheet?.id,
    );

    return gladiator ? <GladiatorContextSheet gladiator={gladiator} save={save} /> : null;
  }

  return null;
}
