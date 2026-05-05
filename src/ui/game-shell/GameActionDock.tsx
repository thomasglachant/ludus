import { useUiStore } from '../../state/ui-store-context';
import { CTAButton } from '../components/CTAButton';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { ShellWidgetPanel } from './ShellWidgetPanel';

export interface GameActionDockAction {
  descriptionKey: string;
  iconName: GameIconName;
  id: string;
  labelKey: string;
  titleKey: string;
  onTrigger(): void;
}

interface GameActionDockProps {
  actions: GameActionDockAction[];
}

export function GameActionDock({ actions }: GameActionDockProps) {
  const { t } = useUiStore();

  if (actions.length === 0) {
    return null;
  }

  return (
    <ShellWidgetPanel
      aria-label={t('gameActionDock.title')}
      className="game-action-dock"
      data-testid="game-action-dock"
    >
      {actions.map((action) => (
        <article className="game-action-dock__item" key={action.id}>
          <div className="game-action-dock__copy">
            <h2>{t(action.titleKey)}</h2>
            <p>{t(action.descriptionKey)}</p>
          </div>
          <CTAButton
            className="game-action-dock__button"
            data-testid={`game-action-dock-${action.id}`}
            onClick={action.onTrigger}
          >
            <GameIcon name={action.iconName} size={18} />
            <span>{t(action.labelKey)}</span>
          </CTAButton>
        </article>
      ))}
    </ShellWidgetPanel>
  );
}
