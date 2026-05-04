import type {
  BuildingEffect,
  BuildingId,
  BuildingSkillDefinition,
} from '../domain/buildings/types';
import { getBuildingActivityIdsBySkill } from './building-activities';

const skillNamesByBuilding = {
  domus: [
    'Ledger Room',
    'Contract Shelf',
    'Staff Registry',
    'Treasury Lockbox',
    'Reception Atrium',
    'Steward Desk',
    'Tax Planning',
    'Loan Contacts',
    'Weekly Board',
    'Patron Letters',
    'Profit Forecasting',
    'Legal Favors',
    'Recruitment Files',
    'Public Seal',
    'Debt Refinancing',
    'Political Network',
    'Grand Strategy',
    'Championship Booking',
    'Provincial Charter',
    'Legacy House',
  ],
  trainingGround: [
    'Wooden Pali',
    'Footwork Lines',
    'Basic Drills',
    'Endurance Runs',
    'Pair Sparring',
    'Weapon Rotation',
    'Shield Discipline',
    'Injury Awareness',
    'Veteran Demonstrations',
    'Noble Training',
    'Tactical Scenarios',
    'Class Specialization',
    'Fatigue Control',
    'Arena Simulation',
    'Soldier Training',
    'Elite Conditioning',
    'Champion Method',
    'Brutal Efficiency',
    'Master Trainer Doctrine',
    'Public Drill',
  ],
  canteen: [
    'Grain Stores',
    'Clean Water',
    'Soup Rotation',
    'Basic Hygiene',
    'Cook Assignment',
    'Protein Meals',
    'Herbal Broths',
    'Waste Control',
    'Feast Day',
    'Ration Ledger',
    'Performance Diet',
    'Recovery Meals',
    'Morale Banquets',
    'Disease Prevention',
    'Supply Contracts',
    'Champion Diet',
    'Luxury Imports',
    'Emergency Reserves',
    'Festival Catering',
    'Nutritional Doctrine',
  ],
  dormitory: [
    'Straw Bedding',
    'Clean Mats',
    'Quiet Rules',
    'Safe Lamps',
    'Shared Quarters',
    'Wooden Beds',
    'Noise Screens',
    'Personal Chests',
    'Injury Rest Area',
    'Mood Rules',
    'Veteran Wing',
    'Champion Room',
    'Conflict Mediation',
    'Heat Management',
    'Loyalty Rituals',
    'Private Cells',
    'Brotherhood Oaths',
    'Rest Discipline',
    'Crisis Shelter',
    'Honor Hall',
  ],
} satisfies Record<BuildingId, readonly string[]>;

interface SkillEffectPattern {
  type: BuildingEffect['type'];
  target: NonNullable<BuildingEffect['target']>;
  values: readonly [number, number, number, number];
}

type SkillEffectPatternRow = readonly [
  SkillEffectPattern,
  SkillEffectPattern,
  SkillEffectPattern,
  SkillEffectPattern,
  SkillEffectPattern,
];

const skillEffectPatternsByBuilding = {
  domus: [
    { type: 'reduceExpense', target: 'ludus', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseIncome', target: 'ludus', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseStaffEfficiency', target: 'ludus', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseReputation', target: 'ludus', values: [0.25, 0.5, 0.75, 1] },
    { type: 'decreaseRebellion', target: 'ludus', values: [0.5, 1, 1.5, 2] },
  ],
  trainingGround: [
    { type: 'increaseStrength', target: 'plannedGladiators', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseAgility', target: 'plannedGladiators', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseDefense', target: 'plannedGladiators', values: [1, 1.5, 2, 2.5] },
    { type: 'reduceInjuryRisk', target: 'allGladiators', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseReputation', target: 'ludus', values: [0.5, 1, 1.5, 2] },
  ],
  canteen: [
    { type: 'increaseHappiness', target: 'ludus', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseLife', target: 'plannedGladiators', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseIncome', target: 'ludus', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseProduction', target: 'ludus', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseHappiness', target: 'ludus', values: [1, 1.5, 2, 2.5] },
  ],
  dormitory: [
    { type: 'increaseHappiness', target: 'ludus', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseReputation', target: 'ludus', values: [0.25, 0.5, 0.75, 1] },
    { type: 'decreaseRebellion', target: 'ludus', values: [1, 1.5, 2, 2.5] },
    { type: 'increaseLife', target: 'plannedGladiators', values: [0.5, 1, 1.5, 2] },
    { type: 'increaseHappiness', target: 'ludus', values: [0.5, 1, 1.5, 2] },
  ],
} satisfies Record<BuildingId, SkillEffectPatternRow>;

const legacySkillIdSegmentsByBuildingAndName: Partial<Record<BuildingId, Record<string, string>>> =
  {
    dormitory: {
      'Safe Lamps': 'night-lamps',
    },
  };

function createSkillEffect(
  buildingId: BuildingId,
  tier: number,
  tierPosition: number,
): BuildingEffect {
  const pattern = skillEffectPatternsByBuilding[buildingId][tierPosition];

  return {
    type: pattern.type,
    value: pattern.values[tier - 1],
    target: pattern.target,
  };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getSkillIdSegment(buildingId: BuildingId, name: string) {
  return legacySkillIdSegmentsByBuildingAndName[buildingId]?.[name] ?? slugify(name);
}

function createSkillTree(buildingId: BuildingId, names: readonly string[]) {
  const firstTierSkillIds = names
    .slice(0, 5)
    .map((name) => `${buildingId}.${getSkillIdSegment(buildingId, name)}`);
  const firstSecondTierSkillId = `${buildingId}.${getSkillIdSegment(buildingId, names[5])}`;
  const firstThirdTierSkillId = `${buildingId}.${getSkillIdSegment(buildingId, names[10])}`;

  return names.map((name, index): BuildingSkillDefinition => {
    const tier = Math.floor(index / 5) + 1;
    const id = `${buildingId}.${getSkillIdSegment(buildingId, name)}`;
    const requiredSkillIds =
      tier === 1
        ? undefined
        : tier === 2
          ? firstTierSkillIds.slice(0, 3)
          : tier === 3
            ? [firstSecondTierSkillId]
            : [firstThirdTierSkillId];

    return {
      id,
      buildingId,
      tier,
      name,
      nameKey: 'buildingSkills.skillName',
      descriptionKey: `buildingSkills.${id}.description`,
      cost: tier * 90,
      requiredBuildingLevel: tier <= 2 ? 1 : tier === 3 ? 3 : 5,
      requiredSkillIds,
      effects: [createSkillEffect(buildingId, tier, index % 5)],
      unlockedActivities: getBuildingActivityIdsBySkill(id),
    };
  });
}

export const BUILDING_SKILLS: BuildingSkillDefinition[] = Object.entries(skillNamesByBuilding)
  .flatMap(([buildingId, names]) => createSkillTree(buildingId as BuildingId, names))
  .sort((left, right) => left.buildingId.localeCompare(right.buildingId) || left.tier - right.tier);

export function getBuildingSkills(buildingId: BuildingId) {
  return BUILDING_SKILLS.filter((skill) => skill.buildingId === buildingId);
}
