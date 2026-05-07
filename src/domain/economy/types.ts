import type { BuildingId } from '../buildings/types';
import type { DayOfWeek, GameDate } from '../time/types';

export type EconomyEntryKind = 'income' | 'expense';

export type EconomyCategory =
  | 'arena'
  | 'contracts'
  | 'production'
  | 'market'
  | 'maintenance'
  | 'food'
  | 'medicine'
  | 'loan'
  | 'event'
  | 'building'
  | 'other';

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

export type LoanId = 'smallLoan' | 'businessLoan' | 'patronLoan';

export interface LoanDefinition {
  id: LoanId;
  amount: number;
  weeklyPayment: number;
  durationWeeks: number;
  requiredDomusLevel: number;
  labelKey: string;
  descriptionKey: string;
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
