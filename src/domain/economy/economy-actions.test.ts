import { describe, expect, it } from 'vitest';
import { LOAN_DEFINITIONS } from '../../game-data/economy';
import { createInitialSave } from '../saves/create-initial-save';
import { buyoutLoan, takeLoan } from './economy-actions';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

describe('economy actions', () => {
  it('opens a Domus-one loan and records it in the ledger', () => {
    const save = createTestSave();
    const loan = LOAN_DEFINITIONS.find((definition) => definition.id === 'smallLoan')!;
    const result = takeLoan(save, 'smallLoan');

    expect(result.validation).toMatchObject({ isAllowed: true });
    expect(result.save.ludus.treasury).toBe(save.ludus.treasury + loan.amount);
    expect(result.save.economy.activeLoans[0]).toMatchObject({
      definitionId: 'smallLoan',
      remainingBalance: loan.weeklyPayment * loan.durationWeeks,
    });
    expect(result.save.economy.ledgerEntries[0]).toMatchObject({
      kind: 'income',
      category: 'loan',
      amount: loan.amount,
    });
    expect(result.save.economy.currentWeekSummary.incomeByCategory.loan).toBe(loan.amount);
  });

  it('blocks advanced loans until the Domus requirement is met', () => {
    const result = takeLoan(createTestSave(), 'patronLoan');

    expect(result.validation).toMatchObject({
      isAllowed: false,
      reason: 'missingDomusLevel',
      requiredDomusLevel: 4,
    });
  });

  it('blocks duplicate active loans of the same type', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const result = takeLoan(loanedSave, 'smallLoan');

    expect(result.validation).toMatchObject({
      isAllowed: false,
      reason: 'loanAlreadyActive',
    });
    expect(result.save.economy.activeLoans).toHaveLength(1);
  });

  it('buys out a loan for the remaining balance', () => {
    const loanedSave = takeLoan(createTestSave(), 'smallLoan').save;
    const activeLoan = loanedSave.economy.activeLoans[0];
    const result = buyoutLoan(loanedSave, activeLoan.id);

    expect(result.validation).toMatchObject({
      isAllowed: true,
      cost: activeLoan.remainingBalance,
    });
    expect(result.save.economy.activeLoans).toEqual([]);
    expect(result.save.ludus.treasury).toBe(
      loanedSave.ludus.treasury - activeLoan.remainingBalance,
    );
  });
});
