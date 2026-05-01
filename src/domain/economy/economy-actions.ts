import { LOAN_DEFINITIONS } from '../../game-data/economy';
import type { GameSave } from '../saves/types';
import type {
  ActiveLoan,
  EconomyCategory,
  EconomyLedgerEntry,
  EconomyState,
  LoanId,
  WeeklyProjection,
} from './types';

export type LoanActionFailureReason =
  | 'loanNotFound'
  | 'loanAlreadyActive'
  | 'missingDomusLevel'
  | 'insufficientTreasury';

export interface LoanActionValidation {
  isAllowed: boolean;
  cost: number;
  reason?: LoanActionFailureReason;
  requiredDomusLevel?: number;
}

export interface LoanActionResult {
  save: GameSave;
  validation: LoanActionValidation;
}

export function createEmptyProjection(): WeeklyProjection {
  return {
    incomeByCategory: {},
    expenseByCategory: {},
    net: 0,
  };
}

export function createInitialEconomyState(): EconomyState {
  return {
    ledgerEntries: [],
    activeLoans: [],
    currentWeekSummary: createEmptyProjection(),
    weeklyProjection: createEmptyProjection(),
  };
}

export function createLedgerEntry(
  save: Pick<GameSave, 'time'> & Partial<Pick<GameSave, 'economy'>>,
  input: Omit<EconomyLedgerEntry, 'id' | 'year' | 'week' | 'dayOfWeek'>,
): EconomyLedgerEntry {
  const sequence = save.economy?.ledgerEntries.length ?? 0;

  return {
    id: [
      'ledger',
      save.time.year,
      save.time.week,
      save.time.dayOfWeek,
      sequence,
      input.kind,
      input.category,
      input.buildingId ?? 'ludus',
      input.relatedId ?? input.labelKey,
      Math.abs(input.amount),
    ].join('-'),
    year: save.time.year,
    week: save.time.week,
    dayOfWeek: save.time.dayOfWeek,
    ...input,
  };
}

export function addLedgerEntry(save: GameSave, entry: EconomyLedgerEntry): GameSave {
  const signedAmount = entry.kind === 'income' ? entry.amount : -entry.amount;

  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: save.ludus.treasury + signedAmount,
    },
    economy: {
      ...save.economy,
      ledgerEntries: [entry, ...save.economy.ledgerEntries].slice(0, 120),
    },
  };
}

export function sumEntriesByCategory(
  entries: EconomyLedgerEntry[],
  kind: EconomyLedgerEntry['kind'],
) {
  return entries
    .filter((entry) => entry.kind === kind)
    .reduce<Partial<Record<EconomyCategory, number>>>((totals, entry) => {
      totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount;
      return totals;
    }, {});
}

export function createProjectionFromEntries(entries: EconomyLedgerEntry[]): WeeklyProjection {
  const incomeByCategory = sumEntriesByCategory(entries, 'income');
  const expenseByCategory = sumEntriesByCategory(entries, 'expense');
  const income = Object.values(incomeByCategory).reduce((total, amount) => total + amount, 0);
  const expenses = Object.values(expenseByCategory).reduce((total, amount) => total + amount, 0);

  return {
    incomeByCategory,
    expenseByCategory,
    net: income - expenses,
  };
}

export function createCurrentWeekSummary(save: GameSave): WeeklyProjection {
  const currentWeekEntries = save.economy.ledgerEntries.filter(
    (entry) => entry.year === save.time.year && entry.week === save.time.week,
  );

  return createProjectionFromEntries(currentWeekEntries);
}

export function updateCurrentWeekSummary(save: GameSave): GameSave {
  const currentWeekSummary = createCurrentWeekSummary(save);

  return {
    ...save,
    economy: {
      ...save.economy,
      currentWeekSummary,
    },
  };
}

export function takeLoan(save: GameSave, loanId: LoanId): LoanActionResult {
  const definition = LOAN_DEFINITIONS.find((loan) => loan.id === loanId);

  if (!definition) {
    return { save, validation: { isAllowed: false, cost: 0, reason: 'loanNotFound' } };
  }

  if (save.buildings.domus.level < definition.requiredDomusLevel) {
    return {
      save,
      validation: {
        isAllowed: false,
        cost: 0,
        reason: 'missingDomusLevel',
        requiredDomusLevel: definition.requiredDomusLevel,
      },
    };
  }

  if (save.economy.activeLoans.some((loan) => loan.definitionId === definition.id)) {
    return {
      save,
      validation: {
        isAllowed: false,
        cost: 0,
        reason: 'loanAlreadyActive',
      },
    };
  }

  const activeLoan: ActiveLoan = {
    id: `loan-${definition.id}-${save.time.year}-${save.time.week}-${save.economy.ledgerEntries.length + save.economy.activeLoans.length + 1}`,
    definitionId: definition.id,
    principal: definition.amount,
    remainingBalance: definition.weeklyPayment * definition.durationWeeks,
    weeklyPayment: definition.weeklyPayment,
    remainingWeeks: definition.durationWeeks,
    startedYear: save.time.year,
    startedWeek: save.time.week,
  };
  const nextSave = addLedgerEntry(
    {
      ...save,
      economy: {
        ...save.economy,
        activeLoans: [...save.economy.activeLoans, activeLoan],
      },
    },
    createLedgerEntry(save, {
      kind: 'income',
      category: 'loan',
      amount: definition.amount,
      labelKey: definition.labelKey,
      relatedId: activeLoan.id,
    }),
  );

  return { save: updateCurrentWeekSummary(nextSave), validation: { isAllowed: true, cost: 0 } };
}

export function buyoutLoan(save: GameSave, loanInstanceId: string): LoanActionResult {
  const loan = save.economy.activeLoans.find((candidate) => candidate.id === loanInstanceId);

  if (!loan) {
    return { save, validation: { isAllowed: false, cost: 0, reason: 'loanNotFound' } };
  }

  if (save.ludus.treasury < loan.remainingBalance) {
    return {
      save,
      validation: {
        isAllowed: false,
        cost: loan.remainingBalance,
        reason: 'insufficientTreasury',
      },
    };
  }

  const nextSave = addLedgerEntry(
    {
      ...save,
      economy: {
        ...save.economy,
        activeLoans: save.economy.activeLoans.filter((candidate) => candidate.id !== loan.id),
      },
    },
    createLedgerEntry(save, {
      kind: 'expense',
      category: 'loan',
      amount: loan.remainingBalance,
      labelKey: 'finance.loanBuyout',
      relatedId: loan.id,
    }),
  );

  return {
    save: updateCurrentWeekSummary(nextSave),
    validation: { isAllowed: true, cost: loan.remainingBalance },
  };
}
