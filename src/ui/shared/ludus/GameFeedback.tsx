import './ludus-components.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/state/ui-store-context';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';
import { GameEmptyState, GameNotice } from './GameSection';

export { GameEmptyState, GameNotice };

type GameFeedbackTone = 'danger' | 'info' | 'warning';
type GameFeedbackSurface = 'dark' | 'light' | 'plain';

interface TranslatedMessageProps {
  message?: ReactNode;
  messageKey?: string;
}

interface GameFieldErrorProps extends TranslatedMessageProps {
  className?: string;
  testId?: string;
}

interface GameStatusMessageProps extends TranslatedMessageProps {
  className?: string;
  iconName?: GameIconName;
  surface?: GameFeedbackSurface;
  testId?: string;
  tone?: GameFeedbackTone;
}

interface GameInlineHintProps extends TranslatedMessageProps {
  className?: string;
  iconName?: GameIconName;
  surface?: GameFeedbackSurface;
  testId?: string;
}

function useTranslatedMessage({ message, messageKey }: TranslatedMessageProps) {
  const { t } = useUiStore();

  return messageKey ? t(messageKey) : message;
}

export function GameFieldError({ className, message, messageKey, testId }: GameFieldErrorProps) {
  const resolvedMessage = useTranslatedMessage({ message, messageKey });

  if (!resolvedMessage) {
    return null;
  }

  return (
    <p
      className={cn('game-field-error', className)}
      data-slot="game-field-error"
      data-testid={testId}
      role="alert"
    >
      <GameIcon name="warning" size={15} />
      <span>{resolvedMessage}</span>
    </p>
  );
}

export function GameStatusMessage({
  className,
  iconName,
  message,
  messageKey,
  surface = 'light',
  testId,
  tone = 'info',
}: GameStatusMessageProps) {
  const resolvedMessage = useTranslatedMessage({ message, messageKey });
  const resolvedIcon = iconName ?? (tone === 'info' ? 'notification' : 'warning');

  if (!resolvedMessage) {
    return null;
  }

  return (
    <div
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      className={cn(
        'game-status-message',
        `game-status-message--${surface}`,
        `game-status-message--${tone}`,
        className,
      )}
      data-slot="game-status-message"
      data-testid={testId}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <GameIcon name={resolvedIcon} size={22} />
      <p>{resolvedMessage}</p>
    </div>
  );
}

export function GameInlineHint({
  className,
  iconName = 'assignment',
  message,
  messageKey,
  surface = 'light',
  testId,
}: GameInlineHintProps) {
  const resolvedMessage = useTranslatedMessage({ message, messageKey });

  if (!resolvedMessage) {
    return null;
  }

  return (
    <span
      className={cn('game-inline-hint', `game-inline-hint--${surface}`, className)}
      data-slot="game-inline-hint"
      data-testid={testId}
    >
      <GameIcon name={iconName} size={15} />
      <span>{resolvedMessage}</span>
    </span>
  );
}
