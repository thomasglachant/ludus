import type { StaffMember, StaffVisualId } from '../../domain/types';
import { getStaffVisualAssetPath } from '../../game-data/staff-visuals';

interface StaffPortraitProps {
  staffMember: Pick<StaffMember, 'name' | 'type' | 'visualId'>;
  size?: 'small' | 'medium';
}

export function StaffPortrait({ staffMember, size = 'medium' }: StaffPortraitProps) {
  const assetPath = getStaffVisualAssetPath(staffMember.visualId as StaffVisualId);

  return (
    <span
      aria-label={staffMember.name}
      className={['staff-portrait', `staff-portrait--${size}`].join(' ')}
      data-staff-type={staffMember.type}
      data-staff-visual={staffMember.visualId}
      role="img"
    >
      <img className="staff-portrait__asset" src={assetPath} alt="" />
    </span>
  );
}
