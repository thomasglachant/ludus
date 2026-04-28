import type { Gladiator } from '../../domain/types';
import { getGladiatorClassDefinition } from '../../game-data/gladiator-classes';
import { useUiStore } from '../../state/ui-store-context';

interface GladiatorClassLineProps {
  className?: string;
  compact?: boolean;
  gladiator: Pick<Gladiator, 'classId'>;
  showDescription?: boolean;
  showEffect?: boolean;
}

export function GladiatorClassLine({
  className,
  compact = false,
  gladiator,
  showDescription = false,
  showEffect = false,
}: GladiatorClassLineProps) {
  const { t } = useUiStore();
  const classDefinition = getGladiatorClassDefinition(gladiator);
  const description = t(classDefinition.descriptionKey);

  return (
    <span
      className={[
        'gladiator-class-line',
        compact ? 'gladiator-class-line--compact' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={showDescription ? undefined : description}
    >
      <span className="gladiator-class-line__name">{t(classDefinition.nameKey)}</span>
      {showDescription ? (
        <span className="gladiator-class-line__description">{description}</span>
      ) : null}
      {showEffect ? (
        <span className="gladiator-class-line__effect">{t(classDefinition.effectSummaryKey)}</span>
      ) : null}
    </span>
  );
}
