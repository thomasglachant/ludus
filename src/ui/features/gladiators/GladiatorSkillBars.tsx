import './gladiators.css';
import { GLADIATOR_SKILL_NAMES, type GladiatorSkillName } from '@/domain/gladiators/skills';
import { getAvailableSkillPoints } from '@/domain/gladiators/progression';
import type { Gladiator } from '@/domain/types';
import { GLADIATOR_SKILL_CONFIG } from '@/game-data/gladiators/skills';
import { useUiStore } from '@/state/ui-store-context';
import { IconButton } from '@/ui/shared/ludus/IconButton';
import { GameIcon } from '@/ui/shared/icons/GameIcon';

interface GladiatorSkillBarsProps {
  gladiator: Gladiator;
  mode?: 'allocation' | 'readonly';
  onAllocateSkillPoint?(skill: GladiatorSkillName): void;
}

const skillIconNames = {
  agility: 'agility',
  defense: 'defense',
  life: 'health',
  strength: 'strength',
} as const;

export function GladiatorSkillBars({
  gladiator,
  mode = 'readonly',
  onAllocateSkillPoint,
}: GladiatorSkillBarsProps) {
  const { t } = useUiStore();
  const availableSkillPoints = getAvailableSkillPoints(gladiator);
  const canAllocate = mode === 'allocation' && availableSkillPoints > 0;

  return (
    <div className="gladiator-skill-bars">
      {GLADIATOR_SKILL_NAMES.map((skill) => {
        const value = gladiator[skill];
        const isSkillCapped = value >= GLADIATOR_SKILL_CONFIG.maximum;
        const allocationLabel = t('gladiatorPanel.allocateSkillPoint', {
          skill: t(`market.stats.${skill}`),
        });

        return (
          <div className="gladiator-skill-bars__row" key={skill}>
            <div className="gladiator-skill-bars__label">
              <GameIcon name={skillIconNames[skill]} size={17} />
              <span>{t(`market.stats.${skill}`)}</span>
              <strong>{value}</strong>
            </div>
            <div className="gladiator-skill-bars__segments" aria-hidden="true">
              {Array.from({ length: GLADIATOR_SKILL_CONFIG.maximum }, (_, index) => (
                <span
                  className={[
                    'gladiator-skill-bars__segment',
                    index < value ? 'gladiator-skill-bars__segment--filled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={index}
                />
              ))}
            </div>
            {canAllocate ? (
              <IconButton
                aria-label={allocationLabel}
                className="gladiator-skill-bars__allocate"
                disabled={isSkillCapped}
                type="button"
                onClick={() => onAllocateSkillPoint?.(skill)}
              >
                <GameIcon name="skillPoint" size={18} />
              </IconButton>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
