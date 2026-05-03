import type { BuildingId, GameSave, StaffMember } from '../../domain/types';
import { calculateStaffSaleValue } from '../../domain/staff/staff-actions';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { EntityList, EntityListRow } from '../components/EntityList';
import { PanelShell } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import { StaffPortrait } from '../staff/StaffPortrait';

interface StaffListPanelProps {
  save: GameSave;
  onClose(): void;
  onOpenStaff(staffId: string): void;
  onSellStaff(staffId: string): void;
}

function getAssignmentLabel(
  save: GameSave,
  staffMember: StaffMember,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const assignedBuildingId = staffMember.assignedBuildingId as BuildingId | undefined;

  if (!assignedBuildingId || !save.buildings[assignedBuildingId]) {
    return t('staff.unassigned');
  }

  return t(BUILDING_DEFINITIONS[assignedBuildingId].nameKey);
}

export function StaffListPanel({ onClose, onOpenStaff, onSellStaff, save }: StaffListPanelProps) {
  const { t } = useUiStore();

  return (
    <PanelShell
      eyebrowKey="staff.listEyebrow"
      titleKey="staff.listTitle"
      testId="staff-list-panel"
      wide
      onClose={onClose}
    >
      <EntityList emptyMessageKey="staff.empty">
        {save.staff.members.map((staffMember) => (
          <EntityListRow
            actions={[
              {
                iconName: 'userMinus',
                id: 'sell',
                label: `${t('market.sell')} (${formatMoneyAmount(calculateStaffSaleValue(staffMember))})`,
                onClick: () => onSellStaff(staffMember.id),
                testId: `market-sell-staff-${staffMember.id}`,
              },
            ]}
            avatar={<StaffPortrait staffMember={staffMember} />}
            info={[
              {
                iconName: 'assignment',
                id: 'assignment',
                label: t('staff.assignment'),
                tone: staffMember.assignedBuildingId ? 'positive' : 'warning',
                value: getAssignmentLabel(save, staffMember, t),
              },
              {
                iconName: 'treasury',
                id: 'weekly-wage',
                label: t('staff.weeklyWage'),
                value: formatMoneyAmount(staffMember.weeklyWage),
              },
            ]}
            key={staffMember.id}
            openLabel={t('staff.openDetailsFor', { name: staffMember.name })}
            subtitle={t(`staff.types.${staffMember.type}`)}
            title={staffMember.name}
            onOpen={() => onOpenStaff(staffMember.id)}
          />
        ))}
      </EntityList>
    </PanelShell>
  );
}
