import type { Gladiator } from '../../domain/types';
import {
  getGladiatorPortraitAssetPath,
  getGladiatorVisualIdentity,
} from '../../game-data/gladiator-visuals';

interface GladiatorPortraitProps {
  gladiator: Pick<Gladiator, 'id' | 'name' | 'classId' | 'visualIdentity'>;
  size?: 'small' | 'medium' | 'large';
}

export function GladiatorPortrait({ gladiator, size = 'medium' }: GladiatorPortraitProps) {
  const visualIdentity = getGladiatorVisualIdentity(
    gladiator.id,
    gladiator.visualIdentity,
    gladiator.classId,
  );
  const portraitAssetPath = getGladiatorPortraitAssetPath(visualIdentity);

  return (
    <span
      aria-label={gladiator.name}
      className={[
        'gladiator-portrait',
        `gladiator-portrait--${size}`,
        `gladiator-portrait--${visualIdentity.paletteId ?? 'terracotta'}`,
      ].join(' ')}
      data-armor={visualIdentity.armorStyle}
      data-body={visualIdentity.bodyType}
      data-body-build={visualIdentity.bodyBuildStyle}
      data-clothing={visualIdentity.clothingStyle}
      data-clothing-color={visualIdentity.clothingColor}
      data-hair={visualIdentity.hairStyle}
      data-hair-beard={visualIdentity.hairAndBeardStyle}
      data-headwear={visualIdentity.headwearStyle}
      data-accessory={visualIdentity.accessoryStyle}
      data-marking={visualIdentity.markingStyle}
      data-portrait-asset={visualIdentity.portraitAssetId}
      data-skin-tone={visualIdentity.skinTone}
      role="img"
    >
      {portraitAssetPath ? (
        <img className="gladiator-portrait__asset" src={portraitAssetPath} alt="" />
      ) : null}
      <span className="gladiator-portrait__head" />
      <span className="gladiator-portrait__hair" />
      <span className="gladiator-portrait__body" />
      <span className="gladiator-portrait__shine" />
    </span>
  );
}
