import { useState } from 'react';
import type { BuildingId, GameSave, StaffMember } from '../../domain/types';
import { BUILDING_DEFINITIONS } from '../../game-data/buildings';
import { useUiStore } from '../../state/ui-store-context';
import { BuildingAvatar } from '../buildings/BuildingAvatar';
import { EntityList, EntityListRow } from '../components/EntityList';
import { EmptyState, MetricList, SectionCard } from '../components/shared';
import { formatMoneyAmount } from '../formatters/money';
import {
  ModalContentFrame,
  ModalHeroCard,
  ModalSection,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '../modals/ModalContentFrame';
import { StaffPortrait } from '../staff/StaffPortrait';

interface StaffDetailPanelProps {
  save: GameSave;
  staffMember: StaffMember;
}

type StaffDetailTab = 'assignment' | 'finance' | 'overview';

const staffDetailTabs: ModalTabItem<StaffDetailTab>[] = [
  { id: 'overview', labelKey: 'staff.tabs.overview' },
  { id: 'assignment', labelKey: 'staff.tabs.assignment' },
  { id: 'finance', labelKey: 'staff.tabs.finance' },
];

function getTotalExperience(staffMember: StaffMember) {
  return Object.values(staffMember.buildingExperience).reduce(
    (total, experience) => total + (experience ?? 0),
    0,
  );
}

export function StaffDetailPanel({ save, staffMember }: StaffDetailPanelProps) {
  const { pushModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<StaffDetailTab>('overview');
  const assignedBuilding = staffMember.assignedBuildingId
    ? save.buildings[staffMember.assignedBuildingId]
    : null;
  const assignedBuildingDefinition = staffMember.assignedBuildingId
    ? BUILDING_DEFINITIONS[staffMember.assignedBuildingId]
    : null;
  const assignedBuildingName = assignedBuildingDefinition
    ? t(assignedBuildingDefinition.nameKey)
    : t('staff.unassigned');
  const experienceEntries = (
    Object.entries(staffMember.buildingExperience) as [BuildingId, number][]
  )
    .filter(([, experience]) => experience > 0)
    .sort(([, leftExperience], [, rightExperience]) => rightExperience - leftExperience);

  return (
    <ModalContentFrame>
      <ModalHeroCard
        avatar={<StaffPortrait staffMember={staffMember} />}
        description={t('staff.detailDescription', { type: t(`staff.types.${staffMember.type}`) })}
        metrics={[
          {
            iconName: 'workforce',
            id: 'type',
            labelKey: 'staff.type',
            value: t(`staff.types.${staffMember.type}`),
          },
          {
            iconName: 'treasury',
            id: 'weekly-wage',
            labelKey: 'staff.weeklyWage',
            value: formatMoneyAmount(staffMember.weeklyWage),
          },
          {
            iconName: 'assignment',
            id: 'assignment',
            labelKey: 'staff.assignment',
            tone: assignedBuilding ? 'positive' : 'warning',
            value: assignedBuildingName,
          },
        ]}
        title={staffMember.name}
      />

      <ModalTabs<StaffDetailTab>
        ariaLabelKey="staff.tabsLabel"
        items={staffDetailTabs}
        selectedId={activeTab}
        onSelect={setActiveTab}
      />

      {activeTab === 'overview' ? (
        <ModalTabPanel>
          <MetricList
            columns={3}
            items={[
              { labelKey: 'staff.type', value: t(`staff.types.${staffMember.type}`) },
              { labelKey: 'staff.totalExperience', value: getTotalExperience(staffMember) },
              { labelKey: 'staff.assignment', value: assignedBuildingName },
            ]}
          />
          <ModalSection titleKey="staff.experienceByBuilding">
            <EntityList emptyMessageKey="staff.noBuildingExperience">
              {experienceEntries.map(([experienceBuildingId, experience]) => (
                <EntityListRow
                  avatar={
                    <BuildingAvatar
                      buildingId={experienceBuildingId}
                      level={save.buildings[experienceBuildingId].level}
                      size="small"
                    />
                  }
                  info={[
                    {
                      iconName: 'workforce',
                      id: 'experience',
                      label: t('staff.experience'),
                      value: experience,
                    },
                  ]}
                  key={experienceBuildingId}
                  subtitle={t(BUILDING_DEFINITIONS[experienceBuildingId].descriptionKey)}
                  title={t(BUILDING_DEFINITIONS[experienceBuildingId].nameKey)}
                />
              ))}
            </EntityList>
          </ModalSection>
        </ModalTabPanel>
      ) : null}

      {activeTab === 'assignment' ? (
        <ModalTabPanel>
          {assignedBuilding && assignedBuildingDefinition ? (
            <EntityList>
              <EntityListRow
                avatar={
                  <BuildingAvatar
                    buildingId={assignedBuilding.id}
                    level={assignedBuilding.level}
                    size="small"
                  />
                }
                info={[
                  {
                    iconName: 'landmark',
                    id: 'level',
                    label: t('buildingPanel.level'),
                    value: assignedBuilding.level,
                  },
                  {
                    iconName: 'workforce',
                    id: 'efficiency',
                    label: t('buildingPanel.efficiency'),
                    value: `${assignedBuilding.efficiency}%`,
                  },
                ]}
                openLabel={t('location.open', { name: assignedBuildingName })}
                subtitle={t(assignedBuildingDefinition.descriptionKey)}
                title={assignedBuildingName}
                onOpen={() => pushModal({ buildingId: assignedBuilding.id, kind: 'building' })}
              />
            </EntityList>
          ) : (
            <EmptyState messageKey="staff.noAssignment" />
          )}
        </ModalTabPanel>
      ) : null}

      {activeTab === 'finance' ? (
        <ModalTabPanel>
          <SectionCard titleKey="staff.weeklyWage">
            <MetricList
              columns={2}
              items={[
                { labelKey: 'staff.weeklyWage', value: formatMoneyAmount(staffMember.weeklyWage) },
                { labelKey: 'staff.assignment', value: assignedBuildingName },
              ]}
            />
          </SectionCard>
        </ModalTabPanel>
      ) : null}
    </ModalContentFrame>
  );
}
