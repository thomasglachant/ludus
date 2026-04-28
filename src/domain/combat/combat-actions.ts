import {
  ARENA_OPPONENT_CONFIG,
  ARENA_RANK_THRESHOLDS,
  ARENA_REWARD_SPLIT,
  ARENA_REWARDS,
  BETTING_CONFIG,
  COMBAT_CONFIG,
  COMBAT_STRATEGY_MODIFIERS,
} from '../../game-data/combat';
import { GAME_BALANCE } from '../../game-data/balance';
import {
  createGladiatorClassId,
  getGladiatorClassCombatModifiers,
} from '../../game-data/gladiator-classes';
import { createGladiatorVisualIdentity } from '../../game-data/gladiator-visuals';
import { GLADIATOR_NAMES } from '../../game-data/gladiator-names';
import { DAYS_OF_WEEK } from '../../game-data/time';
import { assignGladiatorMapLocation } from '../gladiators/map-movement';
import { getEffectiveSkillValue, getGladiatorEffectiveSkill } from '../gladiators/skills';
import type { Gladiator } from '../gladiators/types';
import { getRoutineForGladiator } from '../planning/planning-actions';
import type { GameSave } from '../saves/types';
import type {
  ArenaRank,
  BettingOdds,
  BettingState,
  CombatReward,
  CombatState,
  CombatStrategy,
  ScoutingReport,
} from './types';

type RandomSource = () => number;

export type ScoutingFailureReason =
  | 'oddsUnavailable'
  | 'alreadyScouted'
  | 'betsLocked'
  | 'insufficientTreasury';

export interface ScoutingValidation {
  isAllowed: boolean;
  cost: number;
  reason?: ScoutingFailureReason;
}

export interface ScoutingResult {
  save: GameSave;
  validation: ScoutingValidation;
}

interface CombatParticipant {
  gladiator: Gladiator;
  strategy: CombatStrategy;
}

interface CombatHealth {
  player: number;
  opponent: number;
}

const DEFAULT_STRATEGY: CombatStrategy = 'balanced';
const SUNDAY_ARENA_START_HOUR = GAME_BALANCE.arena.startHour;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function roundStat(value: number) {
  return Math.round(value);
}

function roundChance(value: number) {
  return Math.round(value * 100) / 100;
}

function roundOdds(value: number) {
  return Math.round(value * 100) / 100;
}

function getDayIndex(dayOfWeek: string) {
  return DAYS_OF_WEEK.indexOf(dayOfWeek as (typeof DAYS_OF_WEEK)[number]);
}

function getCombatId(save: GameSave, gladiatorId: string) {
  return `combat-${save.time.year}-${save.time.week}-${gladiatorId}`;
}

function getOpponentId(save: GameSave, gladiatorId: string) {
  return `opponent-${save.time.year}-${save.time.week}-${gladiatorId}`;
}

function getCurrentWeekCombatPrefix(save: GameSave) {
  return `combat-${save.time.year}-${save.time.week}-`;
}

function isAtArena(gladiator: Gladiator) {
  return gladiator.currentLocationId === 'arena';
}

function isMovingToArena(gladiator: Gladiator) {
  return gladiator.mapMovement?.targetLocation === 'arena';
}

function sendGladiatorsToArena(save: GameSave): GameSave {
  return {
    ...save,
    gladiators: save.gladiators.map((gladiator) =>
      isAtArena(gladiator) || isMovingToArena(gladiator)
        ? gladiator
        : assignGladiatorMapLocation(gladiator, 'arena', save.time, 'arenaTravel'),
    ),
  };
}

function areAllGladiatorsAtArena(save: GameSave) {
  return save.gladiators.every((gladiator) => isAtArena(gladiator));
}

function getBettingWindowStartIndex() {
  return getDayIndex(BETTING_CONFIG.firstOddsDay);
}

function getBettingLockIndex() {
  return getDayIndex(BETTING_CONFIG.lockDay);
}

function isBettingWindowVisible(save: GameSave) {
  return getDayIndex(save.time.dayOfWeek) >= getBettingWindowStartIndex();
}

function areBetsLocked(save: GameSave) {
  return getDayIndex(save.time.dayOfWeek) >= getBettingLockIndex();
}

function getRandomOffset(random: RandomSource, spread: number) {
  return Math.round((random() * 2 - 1) * spread);
}

function getStrategy(gladiator: Gladiator, save: GameSave) {
  return getRoutineForGladiator(save, gladiator.id).combatStrategy ?? DEFAULT_STRATEGY;
}

function getParticipantHealth(gladiator: Gladiator) {
  return clamp(
    roundStat(gladiator.health),
    GAME_BALANCE.gladiators.gauges.minimumAliveHealth,
    GAME_BALANCE.gladiators.gauges.maximum,
  );
}

function getParticipantName(participant: CombatParticipant) {
  return participant.gladiator.name;
}

function getParticipantHealthKey(participant: CombatParticipant, player: CombatParticipant) {
  return participant.gladiator.id === player.gladiator.id ? 'player' : 'opponent';
}

function createReward(rank: ArenaRank): CombatReward {
  const totalReward = ARENA_REWARDS[rank];
  const winnerReward = Math.round(totalReward * ARENA_REWARD_SPLIT.winner);

  return {
    totalReward,
    winnerReward,
    loserReward: totalReward - winnerReward,
  };
}

function isCurrentWeekCombat(save: GameSave, combat: CombatState) {
  return combat.id.startsWith(getCurrentWeekCombatPrefix(save));
}

function createOpponentStat(baseValue: number, rank: ArenaRank, random: RandomSource) {
  const multiplier = ARENA_OPPONENT_CONFIG[rank].statMultiplier;

  return clamp(
    roundStat(
      getEffectiveSkillValue(baseValue) * multiplier +
        getRandomOffset(random, GAME_BALANCE.combat.opponentGeneration.statRandomOffsetSpread),
    ),
    GAME_BALANCE.combat.opponentGeneration.minGeneratedStat,
    GAME_BALANCE.combat.opponentGeneration.maxGeneratedStat,
  );
}

function getOpeningAttacker(
  player: CombatParticipant,
  opponent: CombatParticipant,
  random: RandomSource,
) {
  const playerAgility = getGladiatorEffectiveSkill(player.gladiator, 'agility');
  const opponentAgility = getGladiatorEffectiveSkill(opponent.gladiator, 'agility');

  if (playerAgility === opponentAgility) {
    return random() >= 0.5 ? player : opponent;
  }

  return playerAgility > opponentAgility ? player : opponent;
}

function getNextParticipant(
  current: CombatParticipant,
  player: CombatParticipant,
  opponent: CombatParticipant,
) {
  return current.gladiator.id === player.gladiator.id ? opponent : player;
}

function calculateEnergyChange(turnCount: number, strategy: CombatStrategy, gladiator: Gladiator) {
  const modifier = COMBAT_STRATEGY_MODIFIERS[strategy];
  const classModifier = getGladiatorClassCombatModifiers(gladiator);
  const energyCost = clamp(
    roundStat(
      (COMBAT_CONFIG.baseEnergyCost + turnCount * COMBAT_CONFIG.energyCostPerTurn) *
        modifier.energyCostMultiplier *
        classModifier.energyCostMultiplier,
    ),
    COMBAT_CONFIG.minEnergyCost,
    COMBAT_CONFIG.maxEnergyCost,
  );

  return -energyCost;
}

function getParticipantRating(gladiator: Gladiator, strategy: CombatStrategy) {
  const modifier = COMBAT_STRATEGY_MODIFIERS[strategy];
  const classModifier = getGladiatorClassCombatModifiers(gladiator);
  const strength = getGladiatorEffectiveSkill(gladiator, 'strength');
  const agility = getGladiatorEffectiveSkill(gladiator, 'agility');
  const defense = getGladiatorEffectiveSkill(gladiator, 'defense');

  return (
    strength *
      modifier.damageMultiplier *
      classModifier.damageMultiplier *
      GAME_BALANCE.combat.participantRating.strengthWeight +
    agility * (1 + modifier.hitChanceBonus + classModifier.hitChanceBonus) +
    defense * modifier.defenseMultiplier * classModifier.defenseMultiplier +
    gladiator.health * GAME_BALANCE.combat.participantRating.healthWeight +
    gladiator.energy * GAME_BALANCE.combat.participantRating.energyWeight +
    gladiator.morale * GAME_BALANCE.combat.participantRating.moraleWeight
  );
}

function calculateProjectedWinChance(
  gladiator: Gladiator,
  opponent: Gladiator,
  strategy: CombatStrategy,
) {
  const playerRating = getParticipantRating(gladiator, strategy);
  const opponentRating = getParticipantRating(opponent, DEFAULT_STRATEGY);
  const chance = playerRating / (playerRating + opponentRating);

  return roundChance(
    clamp(
      chance,
      GAME_BALANCE.combat.projectedWinChance.minimum,
      GAME_BALANCE.combat.projectedWinChance.maximum,
    ),
  );
}

function calculateDecimalOdds(chance: number) {
  return roundOdds(
    Math.max(BETTING_CONFIG.minimumDecimalOdds, (1 / chance) * (1 - BETTING_CONFIG.houseEdge)),
  );
}

function isCurrentWeekBetting(save: GameSave, betting?: BettingState) {
  return betting?.year === save.time.year && betting.week === save.time.week;
}

function getCurrentBettingState(save: GameSave): BettingState {
  if (isCurrentWeekBetting(save, save.arena.betting)) {
    return save.arena.betting as BettingState;
  }

  return {
    year: save.time.year,
    week: save.time.week,
    odds: [],
    scoutingReports: [],
    areBetsLocked: areBetsLocked(save),
  };
}

function createBettingOdds(
  save: GameSave,
  gladiator: Gladiator,
  existingReport: ScoutingReport | undefined,
  random: RandomSource,
): BettingOdds {
  const opponent = generateOpponent(save, gladiator, random);
  const rank = getArenaRank(gladiator.reputation);
  const strategy = getStrategy(gladiator, save);
  const playerWinChance = calculateProjectedWinChance(gladiator, opponent, strategy);

  return {
    id: `odds-${save.time.year}-${save.time.week}-${gladiator.id}`,
    gladiatorId: gladiator.id,
    opponent,
    rank,
    playerWinChance,
    playerDecimalOdds: calculateDecimalOdds(playerWinChance),
    opponentDecimalOdds: calculateDecimalOdds(1 - playerWinChance),
    isScouted: Boolean(existingReport),
    createdAtDay: save.time.dayOfWeek,
  };
}

function refreshBettingOdds(save: GameSave, odds: BettingOdds): BettingOdds {
  const gladiator = save.gladiators.find((candidate) => candidate.id === odds.gladiatorId);

  if (!gladiator) {
    return odds;
  }

  const strategy = getStrategy(gladiator, save);
  const playerWinChance = calculateProjectedWinChance(gladiator, odds.opponent, strategy);

  return {
    ...odds,
    rank: getArenaRank(gladiator.reputation),
    playerWinChance,
    playerDecimalOdds: calculateDecimalOdds(playerWinChance),
    opponentDecimalOdds: calculateDecimalOdds(1 - playerWinChance),
  };
}

function getPreparedOpponent(save: GameSave, gladiatorId: string) {
  const betting = getCurrentBettingState(save);

  return betting.odds.find((odds) => odds.gladiatorId === gladiatorId)?.opponent;
}

export function getArenaBettingState(save: GameSave): BettingState {
  return getCurrentBettingState(save);
}

export function calculateHitChance(
  attacker: Gladiator,
  defender: Gladiator,
  attackerStrategy: CombatStrategy = DEFAULT_STRATEGY,
) {
  const modifier = COMBAT_STRATEGY_MODIFIERS[attackerStrategy];
  const classModifier = getGladiatorClassCombatModifiers(attacker);
  const attackerAgility = getGladiatorEffectiveSkill(attacker, 'agility');
  const defenderAgility = getGladiatorEffectiveSkill(defender, 'agility');

  return clamp(
    COMBAT_CONFIG.baseHitChance +
      modifier.hitChanceBonus +
      classModifier.hitChanceBonus +
      attackerAgility * COMBAT_CONFIG.attackerAgilityHitMultiplier -
      defenderAgility * COMBAT_CONFIG.defenderAgilityDodgeMultiplier,
    COMBAT_CONFIG.minHitChance,
    COMBAT_CONFIG.maxHitChance,
  );
}

export function calculateDamage(
  attacker: Gladiator,
  defender: Gladiator,
  attackerStrategy: CombatStrategy = DEFAULT_STRATEGY,
  defenderStrategy: CombatStrategy = DEFAULT_STRATEGY,
) {
  const attackerModifier = COMBAT_STRATEGY_MODIFIERS[attackerStrategy];
  const defenderModifier = COMBAT_STRATEGY_MODIFIERS[defenderStrategy];
  const attackerClassModifier = getGladiatorClassCombatModifiers(attacker);
  const defenderClassModifier = getGladiatorClassCombatModifiers(defender);
  const attackerStrength = getGladiatorEffectiveSkill(attacker, 'strength');
  const defenderDefense = getGladiatorEffectiveSkill(defender, 'defense');
  const rawDamage =
    (COMBAT_CONFIG.baseDamage + attackerStrength * COMBAT_CONFIG.strengthDamageMultiplier) *
    attackerModifier.damageMultiplier *
    attackerClassModifier.damageMultiplier;
  const reducedDamage =
    rawDamage -
    defenderDefense *
      COMBAT_CONFIG.defenseReductionMultiplier *
      defenderModifier.defenseMultiplier *
      defenderClassModifier.defenseMultiplier;

  return clamp(roundStat(reducedDamage), COMBAT_CONFIG.minDamage, COMBAT_CONFIG.maxDamage);
}

export function calculateGladiatorReputation(wins: number, losses: number) {
  return Math.max(
    GAME_BALANCE.economy.minimumReputation,
    wins * COMBAT_CONFIG.winReputationValue - losses * COMBAT_CONFIG.lossReputationPenalty,
  );
}

export function calculateLudusReputation(gladiators: Gladiator[]) {
  return gladiators.reduce((total, gladiator) => total + gladiator.reputation, 0);
}

export function getArenaRank(reputation: number): ArenaRank {
  const matchingThreshold = [...ARENA_RANK_THRESHOLDS]
    .reverse()
    .find((threshold) => reputation >= threshold.minimumReputation);

  return matchingThreshold?.rank ?? 'bronze3';
}

export function generateOpponent(
  save: GameSave,
  gladiator: Gladiator,
  random: RandomSource = Math.random,
): Gladiator {
  const rank = getArenaRank(gladiator.reputation);
  const nameOffset = pickIndex(GLADIATOR_NAMES.length, random);
  const opponentId = getOpponentId(save, gladiator.id);
  const classId = createGladiatorClassId(opponentId);

  return {
    id: opponentId,
    name: GLADIATOR_NAMES[nameOffset],
    classId,
    age:
      GAME_BALANCE.combat.opponentGeneration.minAge +
      pickIndex(
        GAME_BALANCE.combat.opponentGeneration.maxAge -
          GAME_BALANCE.combat.opponentGeneration.minAge +
          1,
        random,
      ),
    strength: createOpponentStat(gladiator.strength, rank, random),
    agility: createOpponentStat(gladiator.agility, rank, random),
    defense: createOpponentStat(gladiator.defense, rank, random),
    energy: GAME_BALANCE.gladiators.opponentDefaults.energy,
    health: GAME_BALANCE.gladiators.opponentDefaults.health,
    morale: GAME_BALANCE.gladiators.opponentDefaults.morale,
    satiety: GAME_BALANCE.gladiators.opponentDefaults.satiety,
    reputation: ARENA_OPPONENT_CONFIG[rank].reputation,
    wins: GAME_BALANCE.gladiators.opponentDefaults.wins,
    losses: GAME_BALANCE.gladiators.opponentDefaults.losses,
    traits: [],
    visualIdentity: createGladiatorVisualIdentity(opponentId, classId),
  };
}

export function resolveCombat(
  save: GameSave,
  gladiator: Gladiator,
  random: RandomSource = Math.random,
): CombatState {
  const opponent =
    getPreparedOpponent(save, gladiator.id) ?? generateOpponent(save, gladiator, random);
  const rank = getArenaRank(gladiator.reputation);
  const strategy = getStrategy(gladiator, save);
  const player: CombatParticipant = { gladiator, strategy };
  const rival: CombatParticipant = { gladiator: opponent, strategy: DEFAULT_STRATEGY };
  const reward = createReward(rank);
  const health: CombatHealth = {
    player: getParticipantHealth(gladiator),
    opponent: getParticipantHealth(opponent),
  };
  const turns: CombatState['turns'] = [];
  let attacker = getOpeningAttacker(player, rival, random);
  let defender = getNextParticipant(attacker, player, rival);

  while (
    health.player >= GAME_BALANCE.gladiators.gauges.minimumAliveHealth &&
    health.opponent >= GAME_BALANCE.gladiators.gauges.minimumAliveHealth &&
    turns.length < COMBAT_CONFIG.maxTurns
  ) {
    const attackerHealthKey = getParticipantHealthKey(attacker, player);
    const defenderHealthKey = getParticipantHealthKey(defender, player);
    const hitChance = calculateHitChance(attacker.gladiator, defender.gladiator, attacker.strategy);
    const didHit = random() <= hitChance;
    const damage = didHit
      ? calculateDamage(
          attacker.gladiator,
          defender.gladiator,
          attacker.strategy,
          defender.strategy,
        )
      : 0;

    health[defenderHealthKey] = clamp(
      health[defenderHealthKey] - damage,
      GAME_BALANCE.gladiators.gauges.minimum,
      GAME_BALANCE.gladiators.gauges.maximum,
    );
    turns.push({
      turnNumber: turns.length + 1,
      attackerId: attacker.gladiator.id,
      defenderId: defender.gladiator.id,
      didHit,
      damage,
      attackerHealthAfterTurn: health[attackerHealthKey],
      defenderHealthAfterTurn: health[defenderHealthKey],
      logKey: didHit ? 'combat.log.hit' : 'combat.log.miss',
      logParams: {
        attacker: getParticipantName(attacker),
        defender: getParticipantName(defender),
        damage,
      },
    });

    attacker = defender;
    defender = getNextParticipant(attacker, player, rival);
  }

  const didPlayerWin =
    health.opponent < GAME_BALANCE.gladiators.gauges.minimumAliveHealth ||
    (health.player >= GAME_BALANCE.gladiators.gauges.minimumAliveHealth &&
      health.player >= health.opponent);
  const winnerId = didPlayerWin ? gladiator.id : opponent.id;
  const loserId = didPlayerWin ? opponent.id : gladiator.id;
  const finalCombatHealth = didPlayerWin
    ? clamp(
        roundStat(
          health.player +
            (gladiator.health - health.player) * COMBAT_CONFIG.winnerHealthRecoveryRatio,
        ),
        COMBAT_CONFIG.loserMinimumHealth,
        GAME_BALANCE.gladiators.gauges.maximum,
      )
    : clamp(
        health.player,
        COMBAT_CONFIG.loserMinimumHealth,
        GAME_BALANCE.gladiators.gauges.maximum,
      );
  const energyChange = calculateEnergyChange(turns.length, strategy, gladiator);
  const moraleChange = didPlayerWin
    ? COMBAT_CONFIG.winnerMoraleChange
    : COMBAT_CONFIG.loserMoraleChange;
  const finalWins = gladiator.wins + (didPlayerWin ? 1 : 0);
  const finalLosses = gladiator.losses + (didPlayerWin ? 0 : 1);
  const finalReputation = calculateGladiatorReputation(finalWins, finalLosses);
  const playerReward = didPlayerWin ? reward.winnerReward : reward.loserReward;

  return {
    id: getCombatId(save, gladiator.id),
    gladiator,
    opponent,
    rank,
    strategy,
    turns,
    winnerId,
    loserId,
    reward,
    consequence: {
      didPlayerWin,
      playerReward,
      healthChange: finalCombatHealth - gladiator.health,
      energyChange,
      moraleChange,
      reputationChange: finalReputation - gladiator.reputation,
      finalHealth: finalCombatHealth,
      finalEnergy: clamp(
        gladiator.energy + energyChange,
        GAME_BALANCE.gladiators.gauges.minimum,
        GAME_BALANCE.gladiators.gauges.maximum,
      ),
      finalMorale: clamp(
        gladiator.morale + moraleChange,
        GAME_BALANCE.gladiators.gauges.minimum,
        GAME_BALANCE.gladiators.gauges.maximum,
      ),
      finalReputation,
    },
  };
}

export function synchronizeBetting(save: GameSave, random: RandomSource = Math.random): GameSave {
  if (!isBettingWindowVisible(save) || save.gladiators.length === 0) {
    return {
      ...save,
      arena: {
        ...save.arena,
        betting: {
          year: save.time.year,
          week: save.time.week,
          odds: [],
          scoutingReports: [],
          areBetsLocked: false,
        },
      },
    };
  }

  const currentBetting = getCurrentBettingState(save);
  const currentGladiatorIds = new Set(save.gladiators.map((gladiator) => gladiator.id));
  const scoutingReports = currentBetting.scoutingReports.filter((report) =>
    currentGladiatorIds.has(report.gladiatorId),
  );
  const existingOddsByGladiatorId = new Map(
    currentBetting.odds
      .filter((odds) => currentGladiatorIds.has(odds.gladiatorId))
      .map((odds) => [odds.gladiatorId, odds]),
  );
  const odds = save.gladiators
    .filter((gladiator) => gladiator.health >= GAME_BALANCE.arena.minimumEligibleHealth)
    .map((gladiator) => {
      const existingOdds = existingOddsByGladiatorId.get(gladiator.id);
      const report = scoutingReports.find((candidate) => candidate.gladiatorId === gladiator.id);

      if (existingOdds) {
        return refreshBettingOdds(save, {
          ...existingOdds,
          isScouted: Boolean(report),
        });
      }

      return createBettingOdds(save, gladiator, report, random);
    });

  return {
    ...save,
    arena: {
      ...save.arena,
      betting: {
        year: save.time.year,
        week: save.time.week,
        odds,
        scoutingReports,
        areBetsLocked: areBetsLocked(save),
      },
    },
  };
}

export function validateScouting(save: GameSave, gladiatorId: string): ScoutingValidation {
  const betting = getCurrentBettingState(save);
  const odds = betting.odds.find((candidate) => candidate.gladiatorId === gladiatorId);

  if (!isBettingWindowVisible(save) || !odds) {
    return {
      isAllowed: false,
      cost: BETTING_CONFIG.scoutingCost,
      reason: 'oddsUnavailable',
    };
  }

  if (betting.areBetsLocked) {
    return {
      isAllowed: false,
      cost: BETTING_CONFIG.scoutingCost,
      reason: 'betsLocked',
    };
  }

  if (odds.isScouted) {
    return {
      isAllowed: false,
      cost: BETTING_CONFIG.scoutingCost,
      reason: 'alreadyScouted',
    };
  }

  if (save.ludus.treasury < BETTING_CONFIG.scoutingCost) {
    return {
      isAllowed: false,
      cost: BETTING_CONFIG.scoutingCost,
      reason: 'insufficientTreasury',
    };
  }

  return {
    isAllowed: true,
    cost: BETTING_CONFIG.scoutingCost,
  };
}

export function scoutOpponent(save: GameSave, gladiatorId: string): ScoutingResult {
  const synchronizedSave = synchronizeBetting(save);
  const validation = validateScouting(synchronizedSave, gladiatorId);

  if (!validation.isAllowed) {
    return { save: synchronizedSave, validation };
  }

  const betting = getCurrentBettingState(synchronizedSave);
  const odds = betting.odds.find((candidate) => candidate.gladiatorId === gladiatorId);

  if (!odds) {
    return {
      save: synchronizedSave,
      validation: {
        isAllowed: false,
        cost: BETTING_CONFIG.scoutingCost,
        reason: 'oddsUnavailable',
      },
    };
  }

  const report: ScoutingReport = {
    id: `scouting-${synchronizedSave.time.year}-${synchronizedSave.time.week}-${gladiatorId}`,
    gladiatorId,
    opponentId: odds.opponent.id,
    opponentStrength: getGladiatorEffectiveSkill(odds.opponent, 'strength'),
    opponentAgility: getGladiatorEffectiveSkill(odds.opponent, 'agility'),
    opponentDefense: getGladiatorEffectiveSkill(odds.opponent, 'defense'),
    summaryKey: 'betting.scoutingReport.standard',
    createdAtYear: synchronizedSave.time.year,
    createdAtWeek: synchronizedSave.time.week,
    createdAtDay: synchronizedSave.time.dayOfWeek,
  };

  return {
    validation,
    save: {
      ...synchronizedSave,
      ludus: {
        ...synchronizedSave.ludus,
        treasury: synchronizedSave.ludus.treasury - BETTING_CONFIG.scoutingCost,
      },
      arena: {
        ...synchronizedSave.arena,
        betting: {
          ...betting,
          odds: betting.odds.map((candidate) =>
            candidate.gladiatorId === gladiatorId
              ? {
                  ...candidate,
                  isScouted: true,
                }
              : candidate,
          ),
          scoutingReports: [
            ...betting.scoutingReports.filter((candidate) => candidate.gladiatorId !== gladiatorId),
            report,
          ],
        },
      },
    },
  };
}

export function resolveArenaDay(save: GameSave, random: RandomSource = Math.random): GameSave {
  const currentWeekCombats = save.arena.resolvedCombats.filter((combat) =>
    isCurrentWeekCombat(save, combat),
  );
  const resolvedGladiatorIds = new Set(currentWeekCombats.map((combat) => combat.gladiator.id));
  const missingCombats = save.gladiators
    .filter((gladiator) => gladiator.health >= GAME_BALANCE.arena.minimumEligibleHealth)
    .filter((gladiator) => !resolvedGladiatorIds.has(gladiator.id))
    .map((gladiator) => resolveCombat(save, gladiator, random));
  const resolvedCombats = [...currentWeekCombats, ...missingCombats];
  const consequenceByGladiatorId = new Map(
    missingCombats.map((combat) => [combat.gladiator.id, combat.consequence]),
  );
  const gladiators = save.gladiators.map((gladiator) => {
    const consequence = consequenceByGladiatorId.get(gladiator.id);

    if (!consequence) {
      return gladiator;
    }

    return {
      ...gladiator,
      health: consequence.finalHealth,
      energy: consequence.finalEnergy,
      morale: consequence.finalMorale,
      reputation: consequence.finalReputation,
      wins: gladiator.wins + (consequence.didPlayerWin ? 1 : 0),
      losses: gladiator.losses + (consequence.didPlayerWin ? 0 : 1),
    };
  });
  const rewardTotal = missingCombats.reduce(
    (total, combat) => total + combat.consequence.playerReward,
    0,
  );

  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: save.ludus.treasury + rewardTotal,
      reputation: calculateLudusReputation(gladiators),
    },
    gladiators,
    arena: {
      ...save.arena,
      currentCombatId: resolvedCombats[0]?.id,
      pendingCombats: [],
      resolvedCombats,
      isArenaDayActive: true,
    },
  };
}

export function startArenaDay(save: GameSave, random: RandomSource = Math.random): GameSave {
  if (save.arena.arenaDay) {
    return save;
  }

  const resolvedSave = resolveArenaDay(save, random);

  return {
    ...resolvedSave,
    arena: {
      ...resolvedSave.arena,
      arenaDay: {
        year: resolvedSave.time.year,
        week: resolvedSave.time.week,
        phase: 'intro',
        presentedCombatIds: [],
      },
    },
  };
}

export function startArenaDayCombats(save: GameSave): GameSave {
  if (!save.arena.arenaDay) {
    return save;
  }

  const phase = save.arena.resolvedCombats.length === 0 ? 'summary' : 'combats';

  return {
    ...save,
    arena: {
      ...save.arena,
      arenaDay: {
        ...save.arena.arenaDay,
        phase,
      },
    },
  };
}

export function markArenaCombatPresented(save: GameSave, combatId: string): GameSave {
  const arenaDay = save.arena.arenaDay;

  if (!arenaDay || arenaDay.presentedCombatIds.includes(combatId)) {
    return save;
  }

  const presentedCombatIds = [...arenaDay.presentedCombatIds, combatId];
  const allCombatsPresented = save.arena.resolvedCombats.every((combat) =>
    presentedCombatIds.includes(combat.id),
  );

  return {
    ...save,
    arena: {
      ...save.arena,
      arenaDay: {
        ...arenaDay,
        phase: allCombatsPresented ? 'summary' : 'combats',
        presentedCombatIds,
      },
    },
  };
}

export function showArenaDaySummary(save: GameSave): GameSave {
  if (!save.arena.arenaDay) {
    return save;
  }

  return {
    ...save,
    arena: {
      ...save.arena,
      arenaDay: {
        ...save.arena.arenaDay,
        phase: 'summary',
      },
    },
  };
}

export function synchronizeArena(save: GameSave, random: RandomSource = Math.random): GameSave {
  if (save.arena.arenaDay) {
    return save;
  }

  if (save.time.dayOfWeek !== GAME_BALANCE.arena.dayOfWeek) {
    return {
      ...save,
      arena: {
        ...save.arena,
        arenaDay: undefined,
        pendingCombats: [],
        isArenaDayActive: false,
      },
    };
  }

  if (save.time.hour < SUNDAY_ARENA_START_HOUR) {
    return {
      ...save,
      arena: {
        ...save.arena,
        isArenaDayActive: false,
      },
    };
  }

  if (save.arena.isArenaDayActive) {
    return save;
  }

  if (save.gladiators.length === 0 || areAllGladiatorsAtArena(save)) {
    return startArenaDay(save, random);
  }

  return sendGladiatorsToArena(save);
}
