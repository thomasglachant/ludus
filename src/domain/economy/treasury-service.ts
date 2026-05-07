import type { BuildingId } from '../buildings/types';
import type { GameSave } from '../saves/types';
import type { EconomyCategory, EconomyLedgerEntry } from './types';

const LEDGER_ENTRY_LIMIT = 120;

export const TREASURY_EXPENSE_FAILURE_REASONS = ['insufficientTreasury'] as const;

export type TreasuryExpenseFailureReason = (typeof TREASURY_EXPENSE_FAILURE_REASONS)[number];

export interface TreasuryExpenseValidation {
  isAllowed: boolean;
  cost: number;
  reason?: TreasuryExpenseFailureReason;
}

export interface TreasuryMutationInput {
  amount: number;
  category: EconomyCategory;
  labelKey: string;
  buildingId?: BuildingId;
  relatedId?: string;
}

export interface TreasuryMutationResult {
  save: GameSave;
  validation: TreasuryExpenseValidation;
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
      ledgerEntries: [entry, ...save.economy.ledgerEntries].slice(0, LEDGER_ENTRY_LIMIT),
    },
  };
}

function normalizeAmount(amount: number) {
  return Math.max(0, Math.round(amount));
}

export function canAfford(save: GameSave, amount: number) {
  const cost = normalizeAmount(amount);

  return cost <= 0 || save.ludus.treasury >= cost;
}

export function validateExpense(save: GameSave, amount: number): TreasuryExpenseValidation {
  const cost = normalizeAmount(amount);

  if (!canAfford(save, cost)) {
    return {
      isAllowed: false,
      cost,
      reason: 'insufficientTreasury',
    };
  }

  return {
    isAllowed: true,
    cost,
  };
}

export function recordIncome(save: GameSave, input: TreasuryMutationInput): GameSave {
  const amount = normalizeAmount(input.amount);

  if (amount <= 0) {
    return save;
  }

  return addLedgerEntry(
    save,
    createLedgerEntry(save, {
      kind: 'income',
      category: input.category,
      amount,
      labelKey: input.labelKey,
      buildingId: input.buildingId,
      relatedId: input.relatedId,
    }),
  );
}

export function recordExpense(
  save: GameSave,
  input: TreasuryMutationInput,
): TreasuryMutationResult {
  const validation = validateExpense(save, input.amount);

  if (!validation.isAllowed || validation.cost <= 0) {
    return { save, validation };
  }

  return {
    validation,
    save: addLedgerEntry(
      save,
      createLedgerEntry(save, {
        kind: 'expense',
        category: input.category,
        amount: validation.cost,
        labelKey: input.labelKey,
        buildingId: input.buildingId,
        relatedId: input.relatedId,
      }),
    ),
  };
}

export function recordForcedExpense(save: GameSave, input: TreasuryMutationInput): GameSave {
  const amount = normalizeAmount(input.amount);

  if (amount <= 0) {
    return save;
  }

  return addLedgerEntry(
    save,
    createLedgerEntry(save, {
      kind: 'expense',
      category: input.category,
      amount,
      labelKey: input.labelKey,
      buildingId: input.buildingId,
      relatedId: input.relatedId,
    }),
  );
}

export function applyProjectedTreasuryDelta(save: GameSave, amount: number): GameSave {
  if (amount === 0) {
    return save;
  }

  return {
    ...save,
    ludus: {
      ...save.ludus,
      treasury: save.ludus.treasury + amount,
    },
  };
}
