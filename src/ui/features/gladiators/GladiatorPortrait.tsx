import './gladiators.css';
import type { Gladiator, GladiatorSkillProfile } from '@/domain/types';
import {
  getGladiatorAvatarAssetPath,
  getGladiatorVisualIdentity,
} from '@/game-data/gladiators/visuals';

interface GladiatorPortraitProps {
  gladiator: Pick<Gladiator, 'id' | 'name' | 'visualIdentity'> & GladiatorSkillProfile;
  size?: 'small' | 'medium' | 'large';
}

export function GladiatorPortrait({ gladiator, size = 'medium' }: GladiatorPortraitProps) {
  const visualIdentity = getGladiatorVisualIdentity(gladiator.id, gladiator.visualIdentity, {
    skillProfile: gladiator,
  });
  const avatarAssetPath = getGladiatorAvatarAssetPath(visualIdentity);

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
      data-marking={visualIdentity.markingStyle}
      data-portrait-asset={visualIdentity.portraitAssetId}
      data-skin-variant={visualIdentity.skinTone}
      role="img"
    >
      {avatarAssetPath ? (
        <img className="gladiator-portrait__asset" src={avatarAssetPath} alt="" />
      ) : null}
      <span className="gladiator-portrait__head" />
      <span className="gladiator-portrait__hair" />
      <span className="gladiator-portrait__body" />
      <span className="gladiator-portrait__shine" />
    </span>
  );
}
