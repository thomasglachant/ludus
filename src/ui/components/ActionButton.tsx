import type { ReactNode } from 'react';

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
  return (
    <button
      className={`action-button action-button--${variant}`}
      data-testid={testId}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
