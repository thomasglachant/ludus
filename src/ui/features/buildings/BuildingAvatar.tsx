import './buildings.css';
import type { BuildingId } from '@/domain/types';
import { getBuildingAssetSet } from '@/game-data/visual-assets';
import { GameIcon, type GameIconName } from '@/ui/shared/icons/GameIcon';

interface BuildingAvatarProps {
  buildingId: BuildingId;
  level?: number;
  size?: 'large' | 'small';
}

const fallbackBuildingIcons: Partial<Record<BuildingId, GameIconName>> = {
  domus: 'landmark',
  dormitory: 'capacity',
  trainingGround: 'training',
};

export function BuildingAvatar({ buildingId, level = 1, size = 'large' }: BuildingAvatarProps) {
  const assetSet = getBuildingAssetSet(buildingId, level);

  return (
    <span
      className={`building-modal-avatar building-modal-avatar--${size} building-modal-avatar--${buildingId}`}
      aria-hidden="true"
    >
      {assetSet?.exterior ? (
        <img className="building-modal-avatar__asset" alt="" src={assetSet.exterior} />
      ) : (
        <GameIcon
          name={fallbackBuildingIcons[buildingId] ?? 'landmark'}
          size={size === 'small' ? 26 : 42}
        />
      )}
    </span>
  );
}
