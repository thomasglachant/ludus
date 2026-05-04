import type { GameIconName } from '../icons/GameIcon';
import { GameIcon } from '../icons/GameIcon';
import { useUiStore } from '../../state/ui-store-context';
import { GamePanel } from '../game/GamePanel';

type UserAlertLevel = 'info' | 'warning' | 'error';

interface UserAlertProps {
  className?: string;
  iconName?: GameIconName;
  level?: UserAlertLevel;
  messageKey: string;
  testId?: string;
}

export function UserAlert({
  className,
  iconName = 'alert',
  level = 'info',
  messageKey,
  testId,
}: UserAlertProps) {
  const { t } = useUiStore();
  const role = level === 'info' ? 'status' : 'alert';

  return (
    <GamePanel
      as="div"
      className={['user-alert', `user-alert--${level}`, className].filter(Boolean).join(' ')}
      density="compact"
      data-testid={testId}
      role={role}
    >
      <GameIcon className="user-alert__icon" color="currentColor" name={iconName} size={22} />
      <span>{t(messageKey)}</span>
    </GamePanel>
  );
}
