export interface LoanDefinition {
  id: string;
  amount: number;
  weeklyPayment: number;
  durationWeeks: number;
  requiredDomusLevel: number;
  labelKey: string;
  descriptionKey: string;
}

export const LOAN_DEFINITIONS = [
  {
    id: 'smallLoan',
    amount: 500,
    weeklyPayment: 65,
    durationWeeks: 10,
    requiredDomusLevel: 1,
    labelKey: 'finance.loans.smallLoan.name',
    descriptionKey: 'finance.loans.smallLoan.description',
  },
  {
    id: 'businessLoan',
    amount: 1400,
    weeklyPayment: 145,
    durationWeeks: 12,
    requiredDomusLevel: 2,
    labelKey: 'finance.loans.businessLoan.name',
    descriptionKey: 'finance.loans.businessLoan.description',
  },
  {
    id: 'patronLoan',
    amount: 3500,
    weeklyPayment: 260,
    durationWeeks: 18,
    requiredDomusLevel: 4,
    labelKey: 'finance.loans.patronLoan.name',
    descriptionKey: 'finance.loans.patronLoan.description',
  },
] as const satisfies readonly LoanDefinition[];

export type LoanId = (typeof LOAN_DEFINITIONS)[number]['id'];
