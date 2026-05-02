import type { BuildingId } from '../../domain/types';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

interface BuildingAvatarProps {
  buildingId: BuildingId;
  size?: 'large' | 'small';
}

const buildingAvatarIcons: Partial<Record<BuildingId, GameIconName>> = {
  armory: 'defense',
  banquetHall: 'morale',
  bookmakerOffice: 'treasury',
  domus: 'landmark',
  dormitory: 'capacity',
  exhibitionGrounds: 'victory',
  farm: 'workforce',
  forgeWorkshop: 'hammer',
  guardBarracks: 'defense',
  infirmary: 'health',
  pleasureHall: 'morale',
  trainingGround: 'training',
};

export function BuildingAvatar({ buildingId, size = 'large' }: BuildingAvatarProps) {
  return (
    <span
      className={`building-modal-avatar building-modal-avatar--${size} building-modal-avatar--${buildingId}`}
      aria-hidden="true"
    >
      <GameIcon
        name={buildingAvatarIcons[buildingId] ?? 'landmark'}
        size={size === 'small' ? 26 : 42}
      />
    </span>
  );
}
