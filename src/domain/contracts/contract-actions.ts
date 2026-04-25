import { CONTRACT_CONFIG, WEEKLY_CONTRACT_DEFINITIONS } from '../../game-data/contracts';
import type { GameSave } from '../saves/types';
import type { ContractProgress, WeeklyContract } from './types';

export type ContractActionFailureReason = 'contractNotFound' | 'contractUnavailable';

export interface ContractActionValidation {
  isAllowed: boolean;
  reason?: ContractActionFailureReason;
}

export interface ContractActionResult {
  save: GameSave;
  validation: ContractActionValidation;
}

function getAbsoluteWeek(year: number, week: number) {
  return (year - 1) * 8 + week;
}

function isCurrentWeek(save: GameSave, contract: WeeklyContract) {
  return contract.issuedAtYear === save.time.year && contract.issuedAtWeek === save.time.week;
}

function isExpired(save: GameSave, contract: WeeklyContract) {
  return (
    getAbsoluteWeek(save.time.year, save.time.week) >
    getAbsoluteWeek(contract.expiresAtYear, contract.expiresAtWeek)
  );
}

function getCurrentWeekCombats(save: GameSave) {
  const prefix = `combat-${save.time.year}-${save.time.week}-`;

  return save.arena.resolvedCombats.filter((combat) => combat.id.startsWith(prefix));
}

function getProgressFromObjective(save: GameSave, contract: WeeklyContract): ContractProgress {
  const combats = getCurrentWeekCombats(save);

  switch (contract.objective.type) {
    case 'winFightCount': {
      const current = combats.filter((combat) => combat.consequence.didPlayerWin).length;

      return {
        current,
        target: contract.objective.count,
        isComplete: current >= contract.objective.count,
      };
    }
    case 'winWithRank': {
      const objective = contract.objective;
      const current = combats.some(
        (combat) => combat.rank === objective.rank && combat.consequence.didPlayerWin,
      )
        ? 1
        : 0;

      return {
        current,
        target: 1,
        isComplete: current >= 1,
      };
    }
    case 'winWithLowHealth': {
      const objective = contract.objective;
      const current = combats.some(
        (combat) =>
          combat.gladiator.health <= objective.maxHealth && combat.consequence.didPlayerWin,
      )
        ? 1
        : 0;

      return {
        current,
        target: 1,
        isComplete: current >= 1,
      };
    }
    case 'earnTreasuryFromArena': {
      const current = combats.reduce((total, combat) => total + combat.consequence.playerReward, 0);

      return {
        current,
        target: contract.objective.amount,
        isComplete: current >= contract.objective.amount,
      };
    }
    case 'sellGladiatorForAtLeast':
      return {
        current: 0,
        target: contract.objective.amount,
        isComplete: false,
      };
  }
}

function completeContract(save: GameSave, contract: WeeklyContract): GameSave {
  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: save.ludus.treasury + contract.rewardTreasury,
      reputation: save.ludus.reputation + (contract.rewardReputation ?? 0),
    },
  };
}

export function createWeeklyContracts(year: number, week: number): WeeklyContract[] {
  const startIndex = (year * 7 + week * 3) % WEEKLY_CONTRACT_DEFINITIONS.length;
  const definitions = Array.from(
    { length: CONTRACT_CONFIG.availableContractsPerWeek },
    (_, index) =>
      WEEKLY_CONTRACT_DEFINITIONS[(startIndex + index) % WEEKLY_CONTRACT_DEFINITIONS.length],
  );

  return definitions.map((definition) => ({
    id: `contract-${year}-${week}-${definition.id}`,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    status: 'available',
    rewardTreasury: definition.rewardTreasury,
    rewardReputation: definition.rewardReputation,
    issuedAtYear: year,
    issuedAtWeek: week,
    expiresAtYear: year,
    expiresAtWeek: week,
    objective: definition.objective,
  }));
}

export function getContractProgress(save: GameSave, contract: WeeklyContract): ContractProgress {
  if (contract.status === 'completed') {
    const progress = getProgressFromObjective(save, contract);

    return {
      ...progress,
      current: progress.target,
      isComplete: true,
    };
  }

  return getProgressFromObjective(save, contract);
}

export function validateContractAcceptance(
  save: GameSave,
  contractId: string,
): ContractActionValidation {
  const contract = save.contracts.availableContracts.find(
    (candidate) => candidate.id === contractId,
  );

  if (!contract) {
    return {
      isAllowed: false,
      reason: 'contractNotFound',
    };
  }

  if (contract.status !== 'available' || !isCurrentWeek(save, contract)) {
    return {
      isAllowed: false,
      reason: 'contractUnavailable',
    };
  }

  return {
    isAllowed: true,
  };
}

export function acceptWeeklyContract(save: GameSave, contractId: string): ContractActionResult {
  const validation = validateContractAcceptance(save, contractId);

  if (!validation.isAllowed) {
    return { save, validation };
  }

  const contract = save.contracts.availableContracts.find(
    (candidate) => candidate.id === contractId,
  );

  if (!contract) {
    return {
      save,
      validation: {
        isAllowed: false,
        reason: 'contractNotFound',
      },
    };
  }

  return {
    validation,
    save: {
      ...save,
      contracts: {
        availableContracts: save.contracts.availableContracts.filter(
          (candidate) => candidate.id !== contractId,
        ),
        acceptedContracts: [
          ...save.contracts.acceptedContracts,
          {
            ...contract,
            status: 'accepted',
          },
        ],
      },
    },
  };
}

export function completeSaleContracts(save: GameSave, saleValue: number): GameSave {
  let nextSave = save;
  const acceptedContracts = save.contracts.acceptedContracts.map((contract) => {
    if (
      contract.status !== 'accepted' ||
      contract.objective.type !== 'sellGladiatorForAtLeast' ||
      saleValue < contract.objective.amount
    ) {
      return contract;
    }

    nextSave = completeContract(nextSave, contract);

    return {
      ...contract,
      status: 'completed' as const,
    };
  });

  return {
    ...nextSave,
    contracts: {
      ...nextSave.contracts,
      acceptedContracts,
    },
  };
}

export function synchronizeContracts(save: GameSave): GameSave {
  const acceptedContracts = save.contracts.acceptedContracts.map((contract) => {
    if (contract.status !== 'accepted') {
      return contract;
    }

    if (isExpired(save, contract)) {
      return {
        ...contract,
        status: 'failed' as const,
      };
    }

    return contract;
  });
  const saveWithExpiredContracts = {
    ...save,
    contracts: {
      ...save.contracts,
      acceptedContracts,
    },
  };
  let nextSave = saveWithExpiredContracts;
  const resolvedAcceptedContracts = saveWithExpiredContracts.contracts.acceptedContracts.map(
    (contract) => {
      if (contract.status !== 'accepted' || contract.objective.type === 'sellGladiatorForAtLeast') {
        return contract;
      }

      if (
        !saveWithExpiredContracts.arena.isArenaDayActive ||
        !isCurrentWeek(saveWithExpiredContracts, contract)
      ) {
        return contract;
      }

      if (!getContractProgress(saveWithExpiredContracts, contract).isComplete) {
        return {
          ...contract,
          status: 'failed' as const,
        };
      }

      nextSave = completeContract(nextSave, contract);

      return {
        ...contract,
        status: 'completed' as const,
      };
    },
  );
  const currentWeekAvailableContracts = nextSave.contracts.availableContracts.filter((contract) =>
    isCurrentWeek(nextSave, contract),
  );
  const hasCurrentWeekAcceptedContracts = nextSave.contracts.acceptedContracts.some((contract) =>
    isCurrentWeek(nextSave, contract),
  );
  const availableContracts =
    currentWeekAvailableContracts.length > 0 || hasCurrentWeekAcceptedContracts
      ? currentWeekAvailableContracts
      : createWeeklyContracts(nextSave.time.year, nextSave.time.week);

  return {
    ...nextSave,
    contracts: {
      availableContracts,
      acceptedContracts: resolvedAcceptedContracts,
    },
  };
}
