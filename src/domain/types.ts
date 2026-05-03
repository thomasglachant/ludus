export type { LanguageCode } from './common/types';
export type { DayOfWeek, GamePhase, GameTimeState } from './time/types';
export type { GameStatus, LudusState } from './ludus/types';
export type {
  GridCoord,
  GridSize,
  LudusMapPlacement,
  LudusMapState,
  LudusMapTileOverride,
  MapGroundId,
  MapObjectFootprintDefinition,
  MapPlacementKind,
  MapRotation,
  MapTerrainId,
} from './map/types';
export type {
  BuildingId,
  BuildingState,
  BuildingConfiguration,
  DormitoryConfiguration,
  TrainingGroundConfiguration,
  PleasureHallConfiguration,
  InfirmaryConfiguration,
  BuildingDefinition,
  BuildingLevelDefinition,
  BuildingImprovementDefinition,
  BuildingPolicyDefinition,
  BuildingSkillDefinition,
  BuildingActivityId,
  BuildingEffectType,
  BuildingEffect,
} from './buildings/types';
export type {
  BuildingActionFailureReason,
  BuildingActionValidation,
  BuildingActionResult,
} from './buildings/building-actions';
export type {
  Gladiator,
  GladiatorClassId,
  GladiatorSkillProfile,
  GladiatorTrait,
  GladiatorTrainingPlan,
  GladiatorWeeklyInjury,
  GladiatorVisualIdentity,
} from './gladiators/types';
export { GLADIATOR_CLASS_IDS } from './gladiators/types';
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
export type {
  StaffAssignment,
  StaffMarketCandidate,
  StaffMember,
  StaffState,
  StaffType,
  StaffVisualId,
} from './staff/types';
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
export type { GameInterruption } from './game-flow/interruption';
export type {
  GameEventStatus,
  GameEventChoice,
  GameEvent,
  EventState,
  GameEventEffect,
  GameEventConsequence,
  GameEventOutcome,
  LaunchedGameEventRecord,
} from './events/types';
export type {
  DemoSaveId,
  GameSave,
  GameSaveMetadata,
  PlayerProfile,
  SaveMetadata,
} from './saves/types';
