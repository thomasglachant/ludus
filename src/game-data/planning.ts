import type { DailyPlanActivity, DailyPlanBucket } from '../domain/planning/types';
import { GAME_BALANCE } from './balance';

export interface PlanningActivityDefinition {
  activity: DailyPlanActivity;
  bucket: DailyPlanBucket;
  color: string;
  defaultPoints: number;
}

export const PLANNING_ACTIVITY_DEFINITIONS = [
  {
    activity: 'strengthTraining',
    bucket: 'gladiatorTimePoints',
    color: '#b75f45',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.strengthTraining,
  },
  {
    activity: 'agilityTraining',
    bucket: 'gladiatorTimePoints',
    color: '#7fb85b',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.agilityTraining,
  },
  {
    activity: 'defenseTraining',
    bucket: 'gladiatorTimePoints',
    color: '#8d7458',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.defenseTraining,
  },
  {
    activity: 'lifeTraining',
    bucket: 'gladiatorTimePoints',
    color: '#c6934a',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.lifeTraining,
  },
  {
    activity: 'leisure',
    bucket: 'gladiatorTimePoints',
    color: '#c16f9b',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.leisure,
  },
  {
    activity: 'care',
    bucket: 'gladiatorTimePoints',
    color: '#4e9f76',
    defaultPoints: GAME_BALANCE.planning.taskDefaultPoints.care,
  },
  {
    activity: 'production',
    bucket: 'laborPoints',
    color: '#b9793f',
    defaultPoints: 2,
  },
  {
    activity: 'security',
    bucket: 'laborPoints',
    color: '#5d86a6',
    defaultPoints: 2,
  },
] as const satisfies readonly PlanningActivityDefinition[];
