import type { BuildingId } from '../buildings/types';
import type { DayOfWeek, GameDate } from '../time/types';
import type { LoanId } from '../../game-data/economy/loans';

export type { LoanDefinition, LoanId } from '../../game-data/economy/loans';

export const ECONOMY_ENTRY_KINDS = ['income', 'expense'] as const;

export type EconomyEntryKind = (typeof ECONOMY_ENTRY_KINDS)[number];

export const ECONOMY_CATEGORIES = [
  'arena',
  'contracts',
  'production',
  'market',
  'maintenance',
  'food',
  'medicine',
  'loan',
  'event',
  'building',
  'other',
] as const;

export type EconomyCategory = (typeof ECONOMY_CATEGORIES)[number];

export interface EconomyLedgerEntry {
  id: string;
  year: number;
  week: number;
  dayOfWeek: DayOfWeek;
  kind: EconomyEntryKind;
  category: EconomyCategory;
  amount: number;
  labelKey: string;
  buildingId?: BuildingId;
  relatedId?: string;
}

export interface ActiveLoan {
  id: string;
  definitionId: LoanId;
  principal: number;
  remainingBalance: number;
  weeklyPayment: number;
  remainingWeeks: number;
  startedYear: number;
  startedWeek: number;
}

export interface DebtCrisisState {
  status: 'grace';
  startedAt: GameDate;
  deadlineAt: GameDate;
}

export interface WeeklyProjection {
  incomeByCategory: Partial<Record<EconomyCategory, number>>;
  expenseByCategory: Partial<Record<EconomyCategory, number>>;
  net: number;
}

export interface EconomyState {
  ledgerEntries: EconomyLedgerEntry[];
  activeLoans: ActiveLoan[];
  debtCrisis?: DebtCrisisState;
  currentWeekSummary: WeeklyProjection;
  weeklyProjection: WeeklyProjection;
}
