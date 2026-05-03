import type {
  BuildingImprovementDefinition,
  BuildingPolicyDefinition,
} from '../domain/buildings/types';

export const BUILDING_IMPROVEMENTS: BuildingImprovementDefinition[] = [
  {
    id: 'strawBeds',
    buildingId: 'dormitory',
    nameKey: 'improvements.strawBeds.name',
    descriptionKey: 'improvements.strawBeds.description',
    cost: 70,
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseHappiness', value: 5, target: 'ludus' }],
  },
  {
    id: 'woodenBeds',
    buildingId: 'dormitory',
    nameKey: 'improvements.woodenBeds.name',
    descriptionKey: 'improvements.woodenBeds.description',
    cost: 130,
    requiredBuildingLevel: 1,
    requiredImprovementIds: ['strawBeds'],
    effects: [{ type: 'increaseHappiness', value: 8, target: 'ludus' }],
  },
  {
    id: 'quietQuarters',
    buildingId: 'dormitory',
    nameKey: 'improvements.quietQuarters.name',
    descriptionKey: 'improvements.quietQuarters.description',
    cost: 150,
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseHappiness', value: 5, target: 'ludus' }],
  },
  {
    id: 'sparringRing',
    buildingId: 'trainingGround',
    nameKey: 'improvements.sparringRing.name',
    descriptionKey: 'improvements.sparringRing.description',
    cost: 160,
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseAgility', value: 1, target: 'plannedGladiators' }],
  },
  {
    id: 'advancedDoctoreTools',
    buildingId: 'trainingGround',
    nameKey: 'improvements.advancedDoctoreTools.name',
    descriptionKey: 'improvements.advancedDoctoreTools.description',
    cost: 220,
    requiredBuildingLevel: 2,
    effects: [{ type: 'reduceInjuryRisk', value: 3, target: 'plannedGladiators' }],
  },
];

export const BUILDING_POLICIES: BuildingPolicyDefinition[] = [
  {
    id: 'balancedTraining',
    buildingId: 'trainingGround',
    nameKey: 'policies.balancedTraining.name',
    descriptionKey: 'policies.balancedTraining.description',
    requiredBuildingLevel: 1,
    effects: [
      { type: 'increaseStrength', value: 1, target: 'plannedGladiators' },
      { type: 'increaseAgility', value: 1, target: 'plannedGladiators' },
      { type: 'increaseDefense', value: 1, target: 'plannedGladiators' },
    ],
  },
  {
    id: 'strengthDoctrine',
    buildingId: 'trainingGround',
    nameKey: 'policies.strengthDoctrine.name',
    descriptionKey: 'policies.strengthDoctrine.description',
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseStrength', value: 1, target: 'plannedGladiators' }],
  },
  {
    id: 'agilityDoctrine',
    buildingId: 'trainingGround',
    nameKey: 'policies.agilityDoctrine.name',
    descriptionKey: 'policies.agilityDoctrine.description',
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseAgility', value: 1, target: 'plannedGladiators' }],
  },
  {
    id: 'defensiveDoctrine',
    buildingId: 'trainingGround',
    nameKey: 'policies.defensiveDoctrine.name',
    descriptionKey: 'policies.defensiveDoctrine.description',
    requiredBuildingLevel: 1,
    effects: [{ type: 'increaseDefense', value: 1, target: 'plannedGladiators' }],
  },
  {
    id: 'brutalDiscipline',
    buildingId: 'trainingGround',
    nameKey: 'policies.brutalDiscipline.name',
    descriptionKey: 'policies.brutalDiscipline.description',
    requiredBuildingLevel: 2,
    effects: [
      { type: 'increaseStrength', value: 2, target: 'plannedGladiators' },
      { type: 'reduceInjuryRisk', value: -2, target: 'allGladiators' },
    ],
  },
];
