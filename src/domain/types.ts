export type { LanguageCode } from './common/types';
export { LANGUAGE_CODES } from './common/types';
export type {
  DayOfWeek,
  GameDate,
  GamePhase,
  GameTimeState,
  PendingActionTrigger,
} from './time/types';
export { DAYS_OF_WEEK, GAME_PHASES, PENDING_ACTION_TRIGGERS } from './time/types';
export type { GameStatus, LudusState } from './ludus/types';
export { GAME_STATUSES } from './ludus/types';
export type {
  BuildingId,
  BuildingState,
  BuildingConfiguration,
  DormitoryConfiguration,
  TrainingGroundConfiguration,
  BuildingDefinition,
  BuildingLevelDefinition,
  BuildingImprovementDefinition,
  BuildingPolicyDefinition,
  BuildingSkillDefinition,
  BuildingActivityId,
  BuildingEffectType,
  BuildingEffect,
} from './buildings/types';
export {
  BUILDING_ACTIVITY_IDS,
  BUILDING_EFFECT_TARGETS,
  BUILDING_EFFECT_TYPES,
  BUILDING_IDS,
} from './buildings/types';
export type {
  BuildingActionFailureReason,
  BuildingActionValidation,
  BuildingActionResult,
} from './buildings/building-actions';
export { BUILDING_ACTION_FAILURE_REASONS } from './buildings/building-actions';
export type { GladiatorSkillName } from './gladiators/skills';
export type {
  Gladiator,
  GladiatorClassId,
  GladiatorSkillProfile,
  GladiatorTrait,
  GladiatorVisualIdentity,
} from './gladiators/types';
export { GLADIATOR_CLASS_IDS } from './gladiators/types';
export type {
  GladiatorTraitId,
  PermanentGladiatorTraitId,
  TemporaryGladiatorTraitId,
} from './gladiators/traits';
export {
  addGladiatorExperience,
  allocateGladiatorSkillPoint,
  createInitialSkillProfile,
  createInitialGladiatorSkillProfile,
  getAvailableSkillPoints,
  getGladiatorExperienceProgress,
  getGladiatorLevel,
  getGladiatorLevelFromExperience,
  getGladiatorSkillPointBudget,
  normalizeGladiatorExperience,
  normalizeGladiatorProgression,
  normalizeGladiatorSkillProfile,
  resetGladiatorToInitialProgression,
} from './gladiators/progression';
export type {
  WeeklyPlanningState,
  DailyPlan,
  DailyPlanActivity,
  DailyPlanBucket,
  DailyPlanBuildingActivitySelections,
  DailyPlanPoints,
  DailySimulationSummary,
  WeeklyReport,
  AlertSeverity,
  GameAlert,
  GameAlertActionKind,
} from './planning/types';
export {
  ALERT_SEVERITIES,
  DAILY_PLAN_ACTIVITIES,
  DAILY_PLAN_BUCKETS,
  GAME_ALERT_ACTION_KINDS,
} from './planning/types';
export type {
  ActiveLoan,
  EconomyCategory,
  EconomyEntryKind,
  EconomyLedgerEntry,
  EconomyState,
  LoanDefinition,
  LoanId,
  WeeklyProjection,
} from './economy/types';
export { ECONOMY_CATEGORIES, ECONOMY_ENTRY_KINDS } from './economy/types';
export type {
  DailyPlanUpdate,
  DailyPlanBuildingActivitySelectionUpdate,
} from './planning/planning-actions';
export type { MarketState, MarketGladiator } from './market/types';
export type {
  MarketActionFailureReason,
  MarketActionValidation,
  MarketActionResult,
} from './market/market-actions';
export { MARKET_ACTION_FAILURE_REASONS } from './market/market-actions';
export type {
  ArenaRank,
  ArenaDayPhase,
  ArenaDayState,
  ArenaState,
  CombatState,
  CombatTurn,
  CombatReward,
  CombatConsequence,
} from './combat/types';
export { ARENA_DAY_PHASES, ARENA_RANKS } from './combat/types';
export type { GameInterruption } from './game-flow/interruption';
export type {
  GameEventStatus,
  GameEventChoice,
  GameEvent,
  EventState,
  GameEventEffect,
  GameEventEffectType,
  GameEventConsequence,
  GameEventConsequenceKind,
  GameEventOutcome,
  LaunchedGameEventRecord,
} from './events/types';
export {
  GAME_EVENT_CONSEQUENCE_KINDS,
  GAME_EVENT_EFFECT_TYPES,
  GAME_EVENT_STATUSES,
} from './events/types';
export type {
  GameNotification,
  GameNotificationParams,
  GameNotificationTarget,
} from './notifications/types';
export type {
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  PlayerProfile,
  SaveMetadata,
} from './saves/types';
export type {
  GladiatorTraitDefinition,
  GladiatorTraitDurationBreakdown,
  GladiatorTraitKind,
  GladiatorTraitMarketPolarity,
  GladiatorTraitModifier,
  GladiatorTraitVisual,
} from './gladiators/traits';
export { GLADIATOR_TRAIT_KINDS, GLADIATOR_TRAIT_MARKET_POLARITIES } from './gladiators/traits';
