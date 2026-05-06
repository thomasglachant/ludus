import { GAME_ICON_DEFINITIONS, type GameIconName } from './game-icon-definitions';

export type { GameIconName } from './game-icon-definitions';

interface GameIconProps {
  'aria-hidden'?: boolean;
  className?: string;
  color?: string;
  name: GameIconName;
  size?: number;
  strokeWidth?: number;
}

export function GameIcon({
  'aria-hidden': ariaHidden = true,
  className,
  color,
  name,
  size = 20,
  strokeWidth = 2.25,
}: GameIconProps) {
  const definition = GAME_ICON_DEFINITIONS[name];
  const Icon = definition.Icon;

  return (
    <Icon
      aria-hidden={ariaHidden}
      className={className}
      color={color ?? definition.color}
      focusable="false"
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
