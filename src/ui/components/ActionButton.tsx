import type { ReactNode } from 'react';
import { RomanButton, type RomanButtonTone } from '../game/RomanButton';

interface ActionButtonProps {
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  testId?: string;
  onClick?(): void;
}

export function ActionButton({
  label,
  icon,
  variant = 'secondary',
  type = 'button',
  disabled = false,
  testId,
  onClick,
}: ActionButtonProps) {
  const tone: RomanButtonTone =
    variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : 'secondary';

  return (
    <RomanButton
      className={`action-button action-button--${variant}`}
      data-testid={testId}
      disabled={disabled}
      icon={icon}
      tone={tone}
      type={type}
      onClick={onClick}
    >
      <span>{label}</span>
    </RomanButton>
  );
}
