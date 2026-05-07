import {
  ARENA_ODDS_CONFIG,
  ARENA_PUBLIC_STAKE_MODIFIER_SPREAD,
  ARENA_RANK_THRESHOLDS,
  ARENA_REWARDS,
  ARENA_VICTORY_ODDS_REWARD_MULTIPLIER,
} from '../../game-data/arena/rules';
import {
  ARENA_OPPONENT_CONFIG,
  COMBAT_RULES,
  OPPONENT_GENERATION_CONFIG,
  PARTICIPANT_RATING_CONFIG,
  PROJECTED_WIN_CHANCE_CONFIG,
} from '../../game-data/combat/rules';
import {
  GLADIATOR_COMBAT_EXPERIENCE_CONFIG,
  GLADIATOR_GAUGE_CONFIG,
  GLADIATOR_OPPONENT_DEFAULTS,
  GLADIATOR_TRAINING_CONFIG,
} from '../../game-data/gladiators/combat';
import { GLADIATOR_PROGRESSION_CONFIG } from '../../game-data/gladiators/progression';
import { GLADIATOR_SKILL_CONFIG } from '../../game-data/gladiators/skills';
import { GLADIATOR_TEMPORARY_TRAITS } from '../../game-data/gladiators/traits';
import { TREASURY_CONFIG } from '../../game-data/economy/treasury';
import { createGladiatorVisualIdentity } from '../../game-data/gladiators/visuals';
import { GLADIATOR_NAMES } from '../../game-data/gladiators/names';
import { refreshGameAlerts } from '../alerts/alert-actions';
import {
  addLedgerEntry,
  createLedgerEntry,
  updateCurrentWeekSummary,
} from '../economy/economy-actions';
import { getGladiatorEffectiveSkill } from '../gladiators/skills';
import { addGladiatorExperience, getGladiatorLevel } from '../gladiators/progression';
import {
  canGladiatorFightInArena,
  getGladiatorArenaRewardMultiplier,
  getGladiatorCombatEnergyBonus,
  getGladiatorCombatExperienceMultiplier,
  getGladiatorCombatMoraleBonus,
} from '../gladiators/trait-actions';
import { synchronizePlanning } from '../planning/planning-actions';
import { addGladiatorLevelUpNotifications } from '../notifications/notification-actions';
import type { Gladiator } from '../gladiators/types';
import type { GameSave } from '../saves/types';
import type {
  ArenaRank,
  CombatGauges,
  CombatParticipantGauges,
  CombatReward,
  CombatState,
} from './types';

type RandomSource = () => number;

interface CombatParticipant {
  gladiator: Gladiator;
}

interface CombatHealth {
  player: number;
  opponent: number;
}

interface CombatEnergy {
  player: number;
  opponent: number;
}

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

export function getCombatInjuryChance(didPlayerWin: boolean) {
  return didPlayerWin
    ? GLADIATOR_TEMPORARY_TRAITS.injury.combat.winChance
    : GLADIATOR_TEMPORARY_TRAITS.injury.combat.lossChance;
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

function getArenaRankSortIndex(rank: ArenaRank) {
  const rankIndex = ARENA_RANK_THRESHOLDS.findIndex((threshold) => threshold.rank === rank);

  return rankIndex === -1 ? ARENA_RANK_THRESHOLDS.length : rankIndex;
}

function getParticipantMaxHealth(gladiator: Gladiator) {
  return clamp(
    roundStat(
      COMBAT_RULES.baseHealth +
        getGladiatorEffectiveSkill(gladiator, 'life') * COMBAT_RULES.lifeHealthMultiplier,
    ),
    GLADIATOR_GAUGE_CONFIG.minimumAliveHealth,
    GLADIATOR_GAUGE_CONFIG.maximum,
  );
}

function getParticipantMaxEnergy(gladiator: Gladiator) {
  return clamp(
    roundStat(
      COMBAT_RULES.baseEnergy +
        getGladiatorEffectiveSkill(gladiator, 'strength') * COMBAT_RULES.strengthEnergyMultiplier +
        getGladiatorEffectiveSkill(gladiator, 'agility') * COMBAT_RULES.agilityEnergyMultiplier +
        getGladiatorEffectiveSkill(gladiator, 'life') * COMBAT_RULES.lifeEnergyMultiplier,
    ),
    GLADIATOR_GAUGE_CONFIG.minimum,
    GLADIATOR_GAUGE_CONFIG.maximum,
  );
}

function createParticipantCombatGauges(gladiator: Gladiator): CombatParticipantGauges {
  const maxHealth = getParticipantMaxHealth(gladiator);
  const maxEnergy = clamp(
    getParticipantMaxEnergy(gladiator) + getGladiatorCombatEnergyBonus(gladiator),
    GLADIATOR_GAUGE_CONFIG.minimum,
    GLADIATOR_GAUGE_CONFIG.maximum,
  );
  const morale = clamp(
    COMBAT_RULES.baseMorale + getGladiatorCombatMoraleBonus(gladiator),
    GLADIATOR_GAUGE_CONFIG.minimum,
    GLADIATOR_GAUGE_CONFIG.maximum,
  );

  return {
    maxHealth,
    health: maxHealth,
    maxEnergy,
    energy: maxEnergy,
    morale,
  };
}

function getParticipantName(participant: CombatParticipant) {
  return participant.gladiator.name;
}

function getParticipantHealthKey(participant: CombatParticipant, player: CombatParticipant) {
  return participant.gladiator.id === player.gladiator.id ? 'player' : 'opponent';
}

function createPublicStakeModifier(random: RandomSource) {
  return Math.round((random() * 2 - 1) * ARENA_PUBLIC_STAKE_MODIFIER_SPREAD);
}

export function calculateArenaCombatReward(
  rank: ArenaRank,
  playerDecimalOdds: number,
  random: RandomSource = Math.random,
  opponentDecimalOdds?: number,
  rewardMultiplier = 1,
): CombatReward {
  const participationReward = 0;
  const publicStakeModifier = createPublicStakeModifier(random);
  const victoryReward = Math.max(
    0,
    Math.round(
      (ARENA_REWARDS[rank] * ARENA_VICTORY_ODDS_REWARD_MULTIPLIER * playerDecimalOdds +
        publicStakeModifier) *
        rewardMultiplier,
    ),
  );
  const winnerReward = victoryReward;

  return {
    totalReward: winnerReward,
    winnerReward,
    loserReward: 0,
    participationReward,
    victoryReward,
    publicStakeModifier,
    playerDecimalOdds,
    ...(opponentDecimalOdds === undefined ? {} : { opponentDecimalOdds }),
  };
}

function isCurrentWeekCombat(save: GameSave, combat: CombatState) {
  return combat.id.startsWith(getCurrentWeekCombatPrefix(save));
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

function getParticipantRating(gladiator: Gladiator) {
  const strength = getGladiatorEffectiveSkill(gladiator, 'strength');
  const agility = getGladiatorEffectiveSkill(gladiator, 'agility');
  const defense = getGladiatorEffectiveSkill(gladiator, 'defense');
  const gauges = createParticipantCombatGauges(gladiator);

  return (
    strength * PARTICIPANT_RATING_CONFIG.strengthWeight +
    agility +
    defense +
    gauges.maxHealth * PARTICIPANT_RATING_CONFIG.healthWeight +
    gauges.maxEnergy * PARTICIPANT_RATING_CONFIG.energyWeight +
    gauges.morale * PARTICIPANT_RATING_CONFIG.moraleWeight
  );
}

export function calculateProjectedWinChance(gladiator: Gladiator, opponent: Gladiator) {
  const playerRating = getParticipantRating(gladiator);
  const opponentRating = getParticipantRating(opponent);
  const chance = playerRating / (playerRating + opponentRating);

  return roundChance(
    clamp(chance, PROJECTED_WIN_CHANCE_CONFIG.minimum, PROJECTED_WIN_CHANCE_CONFIG.maximum),
  );
}

export function calculateDecimalOdds(chance: number) {
  return roundOdds(
    Math.max(
      ARENA_ODDS_CONFIG.minimumDecimalOdds,
      (1 / chance) * (1 - ARENA_ODDS_CONFIG.houseEdge),
    ),
  );
}

export function calculateHitChance(attacker: Gladiator, defender: Gladiator) {
  const attackerAgility = getGladiatorEffectiveSkill(attacker, 'agility');
  const defenderAgility = getGladiatorEffectiveSkill(defender, 'agility');

  return clamp(
    COMBAT_RULES.baseHitChance +
      attackerAgility * COMBAT_RULES.attackerAgilityHitMultiplier -
      defenderAgility * COMBAT_RULES.defenderAgilityDodgeMultiplier,
    COMBAT_RULES.minHitChance,
    COMBAT_RULES.maxHitChance,
  );
}

export function calculateDamage(attacker: Gladiator, defender: Gladiator) {
  const attackerStrength = getGladiatorEffectiveSkill(attacker, 'strength');
  const defenderDefense = getGladiatorEffectiveSkill(defender, 'defense');
  const rawDamage =
    COMBAT_RULES.baseDamage + attackerStrength * COMBAT_RULES.strengthDamageMultiplier;
  const reducedDamage = rawDamage - defenderDefense * COMBAT_RULES.defenseReductionMultiplier;

  return clamp(roundStat(reducedDamage), COMBAT_RULES.minDamage, COMBAT_RULES.maxDamage);
}

export function calculateCombatReputationChange(didWin: boolean) {
  return didWin ? COMBAT_RULES.winReputationValue : -COMBAT_RULES.lossReputationPenalty;
}

export function calculateGladiatorCombatReputation(currentReputation: number, didWin: boolean) {
  return Math.max(
    TREASURY_CONFIG.minimumReputation,
    currentReputation + calculateCombatReputationChange(didWin),
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

function compareArenaCombatOrder(left: CombatState, right: CombatState) {
  return (
    getArenaRankSortIndex(left.rank) - getArenaRankSortIndex(right.rank) ||
    left.gladiator.name.localeCompare(right.gladiator.name) ||
    left.gladiator.id.localeCompare(right.gladiator.id)
  );
}

function compareArenaGladiatorOrder(left: Gladiator, right: Gladiator) {
  return (
    getArenaRankSortIndex(getArenaRank(left.reputation)) -
      getArenaRankSortIndex(getArenaRank(right.reputation)) ||
    left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
  );
}

function createOpponentLevel(gladiator: Gladiator, random: RandomSource) {
  const playerLevel = getGladiatorLevel(gladiator);
  const levelOffset = pickIndex(3, random) - 1;

  return clamp(playerLevel + levelOffset, 1, GLADIATOR_PROGRESSION_CONFIG.maxLevel);
}

function createOpponentSkillProfile(level: number, random: RandomSource) {
  const skillNames = GLADIATOR_SKILL_CONFIG.names;
  const skills = Object.fromEntries(
    skillNames.map((skill) => [skill, GLADIATOR_SKILL_CONFIG.minimum]),
  ) as Pick<Gladiator, (typeof skillNames)[number]>;
  let remainingPoints =
    GLADIATOR_SKILL_CONFIG.initialTotalPoints +
    (level - 1) -
    skillNames.length * GLADIATOR_SKILL_CONFIG.minimum;

  while (remainingPoints > 0) {
    const eligibleSkills = skillNames.filter(
      (skill) => skills[skill] < GLADIATOR_SKILL_CONFIG.maximum,
    );

    if (eligibleSkills.length === 0) {
      break;
    }

    const selectedSkill = eligibleSkills[pickIndex(eligibleSkills.length, random)];

    skills[selectedSkill] += 1;
    remainingPoints -= 1;
  }

  return skills;
}

function getExperienceForLevel(level: number) {
  return (
    GLADIATOR_PROGRESSION_CONFIG.experienceByLevel[level - 1] ??
    GLADIATOR_PROGRESSION_CONFIG.experienceByLevel.at(-1) ??
    0
  );
}

export function generateOpponent(
  save: GameSave,
  gladiator: Gladiator,
  random: RandomSource = Math.random,
): Gladiator {
  const rank = getArenaRank(gladiator.reputation);
  const nameOffset = pickIndex(GLADIATOR_NAMES.length, random);
  const opponentId = getOpponentId(save, gladiator.id);
  const opponentLevel = createOpponentLevel(gladiator, random);
  const age =
    OPPONENT_GENERATION_CONFIG.minAge +
    pickIndex(OPPONENT_GENERATION_CONFIG.maxAge - OPPONENT_GENERATION_CONFIG.minAge + 1, random);
  const skillProfile = createOpponentSkillProfile(opponentLevel, random);

  return {
    id: opponentId,
    name: GLADIATOR_NAMES[nameOffset],
    age,
    strength: skillProfile.strength,
    agility: skillProfile.agility,
    defense: skillProfile.defense,
    life: skillProfile.life,
    experience: getExperienceForLevel(opponentLevel),
    reputation: ARENA_OPPONENT_CONFIG[rank].reputation,
    wins: GLADIATOR_OPPONENT_DEFAULTS.wins,
    losses: GLADIATOR_OPPONENT_DEFAULTS.losses,
    traits: [],
    visualIdentity: createGladiatorVisualIdentity(opponentId, { skillProfile }),
  };
}

export function calculateCombatExperienceChange(
  gladiator: Gladiator,
  opponent: Gladiator,
  didWin: boolean,
) {
  const levelDifference = getGladiatorLevel(opponent) - getGladiatorLevel(gladiator);
  const levelMultiplier = clamp(
    1 + levelDifference * GLADIATOR_COMBAT_EXPERIENCE_CONFIG.levelDifferenceMultiplier,
    GLADIATOR_COMBAT_EXPERIENCE_CONFIG.minimumLevelMultiplier,
    GLADIATOR_COMBAT_EXPERIENCE_CONFIG.maximumLevelMultiplier,
  );
  const outcomeMultiplier = didWin
    ? GLADIATOR_COMBAT_EXPERIENCE_CONFIG.winMultiplier
    : GLADIATOR_COMBAT_EXPERIENCE_CONFIG.lossMultiplier;

  return Math.round(
    GLADIATOR_TRAINING_CONFIG.experiencePerPoint *
      GLADIATOR_COMBAT_EXPERIENCE_CONFIG.dailyTrainingEquivalentPoints *
      outcomeMultiplier *
      levelMultiplier *
      getGladiatorCombatExperienceMultiplier(gladiator),
  );
}

export function resolveCombat(
  save: GameSave,
  gladiator: Gladiator,
  random: RandomSource = Math.random,
): CombatState {
  const opponent = generateOpponent(save, gladiator, random);
  const rank = getArenaRank(gladiator.reputation);
  const player: CombatParticipant = { gladiator };
  const rival: CombatParticipant = { gladiator: opponent };
  const playerWinChance = calculateProjectedWinChance(gladiator, opponent);
  const opponentWinChance = 1 - playerWinChance;
  const playerDecimalOdds = calculateDecimalOdds(playerWinChance);
  const opponentDecimalOdds = calculateDecimalOdds(opponentWinChance);
  const gauges: CombatGauges = {
    player: createParticipantCombatGauges(gladiator),
    opponent: createParticipantCombatGauges(opponent),
  };
  const health: CombatHealth = {
    player: gauges.player.health,
    opponent: gauges.opponent.health,
  };
  const energy: CombatEnergy = {
    player: gauges.player.energy,
    opponent: gauges.opponent.energy,
  };
  const turns: CombatState['turns'] = [];
  let attacker = getOpeningAttacker(player, rival, random);
  let defender = getNextParticipant(attacker, player, rival);

  while (
    health.player >= GLADIATOR_GAUGE_CONFIG.minimumAliveHealth &&
    health.opponent >= GLADIATOR_GAUGE_CONFIG.minimumAliveHealth &&
    turns.length < COMBAT_RULES.maxTurns
  ) {
    const attackerHealthKey = getParticipantHealthKey(attacker, player);
    const defenderHealthKey = getParticipantHealthKey(defender, player);
    const hitChance = calculateHitChance(attacker.gladiator, defender.gladiator);
    const didHit = random() <= hitChance;
    const damage = didHit ? calculateDamage(attacker.gladiator, defender.gladiator) : 0;

    energy[attackerHealthKey] = clamp(
      energy[attackerHealthKey] - 1,
      GLADIATOR_GAUGE_CONFIG.minimum,
      GLADIATOR_GAUGE_CONFIG.maximum,
    );
    health[defenderHealthKey] = clamp(
      health[defenderHealthKey] - damage,
      GLADIATOR_GAUGE_CONFIG.minimum,
      GLADIATOR_GAUGE_CONFIG.maximum,
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
    health.opponent < GLADIATOR_GAUGE_CONFIG.minimumAliveHealth ||
    (health.player >= GLADIATOR_GAUGE_CONFIG.minimumAliveHealth &&
      health.player >= health.opponent);
  const winnerId = didPlayerWin ? gladiator.id : opponent.id;
  const loserId = didPlayerWin ? opponent.id : gladiator.id;
  const finalReputation = calculateGladiatorCombatReputation(gladiator.reputation, didPlayerWin);
  const experienceChange = calculateCombatExperienceChange(gladiator, opponent, didPlayerWin);
  const reward = calculateArenaCombatReward(
    rank,
    playerDecimalOdds,
    random,
    opponentDecimalOdds,
    getGladiatorArenaRewardMultiplier(gladiator),
  );
  const playerReward = didPlayerWin ? reward.winnerReward : reward.loserReward;

  return {
    id: getCombatId(save, gladiator.id),
    gladiator,
    opponent,
    gauges: {
      player: { ...gauges.player, health: health.player, energy: energy.player },
      opponent: { ...gauges.opponent, health: health.opponent, energy: energy.opponent },
    },
    rank,
    turns,
    winnerId,
    loserId,
    reward,
    consequence: {
      didPlayerWin,
      experienceChange,
      playerReward,
      reputationChange: finalReputation - gladiator.reputation,
      finalReputation,
    },
  };
}

export function resolveArenaDay(save: GameSave, random: RandomSource = Math.random): GameSave {
  const currentWeekCombats = save.arena.resolvedCombats.filter((combat) =>
    isCurrentWeekCombat(save, combat),
  );
  const resolvedGladiatorIds = new Set(currentWeekCombats.map((combat) => combat.gladiator.id));
  const missingCombats = save.gladiators
    .filter((gladiator) => getGladiatorEffectiveSkill(gladiator, 'life') > 0)
    .filter((gladiator) => canGladiatorFightInArena(save, gladiator.id))
    .filter((gladiator) => !resolvedGladiatorIds.has(gladiator.id))
    .sort(compareArenaGladiatorOrder)
    .map((gladiator) => resolveCombat(save, gladiator, random));
  const resolvedCombats = [...currentWeekCombats, ...missingCombats].sort(compareArenaCombatOrder);
  const consequenceByGladiatorId = new Map(
    missingCombats.map((combat) => [combat.gladiator.id, combat.consequence]),
  );
  const gladiators = save.gladiators.map((gladiator) => {
    const consequence = consequenceByGladiatorId.get(gladiator.id);

    if (!consequence) {
      return gladiator;
    }

    return {
      ...addGladiatorExperience(gladiator, consequence.experienceChange),
      reputation: consequence.finalReputation,
      wins: gladiator.wins + (consequence.didPlayerWin ? 1 : 0),
      losses: gladiator.losses + (consequence.didPlayerWin ? 0 : 1),
    };
  });
  const rewardTotal = missingCombats.reduce(
    (total, combat) => total + combat.consequence.playerReward,
    0,
  );

  const resolvedSave: GameSave = {
    ...save,
    ludus: {
      ...save.ludus,
      reputation: calculateLudusReputation(gladiators),
    },
    gladiators,
    arena: {
      ...save.arena,
      resolvedCombats,
      isArenaDayActive: true,
    },
  };
  const notificationSave = addGladiatorLevelUpNotifications(resolvedSave, save.gladiators);

  if (rewardTotal <= 0) {
    return refreshGameAlerts(synchronizePlanning(updateCurrentWeekSummary(notificationSave)));
  }

  return refreshGameAlerts(
    synchronizePlanning(
      updateCurrentWeekSummary(
        addLedgerEntry(
          notificationSave,
          createLedgerEntry(notificationSave, {
            kind: 'income',
            category: 'arena',
            amount: rewardTotal,
            labelKey: 'finance.ledger.arenaReward',
          }),
        ),
      ),
    ),
  );
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
        phase: 'summary',
        presentedCombatIds: [],
      },
    },
  };
}
