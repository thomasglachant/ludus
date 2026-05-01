import type { CSSProperties } from 'react';
import { LOAN_DEFINITIONS } from '../../game-data/economy';
import type {
  ActiveLoan,
  EconomyCategory,
  GameSave,
  LoanId,
  WeeklyProjection,
} from '../../domain/types';
import { useUiStore } from '../../state/ui-store-context';
import { CTAButton } from '../components/CTAButton';
import {
  formatLedgerEntryAmount,
  getLedgerEntryCategoryLabel,
  getLedgerEntryContextLabel,
  getLedgerEntryDateLabel,
} from '../formatters/ledger';
import { formatMoneyAmount } from '../formatters/money';
import { EmptyState, MetricList, NoticeBox, PanelShell, SectionCard } from '../components/shared';
import { GameIcon } from '../icons/GameIcon';

const LEDGER_ENTRY_LIMIT = 14;

interface FinancePanelProps {
  save: GameSave;
  onBuyoutLoan(loanInstanceId: string): void;
  onClose(): void;
  onTakeLoan(loanId: LoanId): void;
}

interface FinanceTotals {
  expenses: number;
  income: number;
  net: number;
}

interface ActiveLoanTotals {
  remainingBalance: number;
  weeklyPayment: number;
}

interface ProjectionRow {
  amount: number;
  category: EconomyCategory;
  percent: number;
}

function sumProjectionValues(values: Partial<Record<EconomyCategory, number>>) {
  return Object.values(values).reduce((total, amount) => total + (amount ?? 0), 0);
}

function getProjectionTotals(projection: WeeklyProjection): FinanceTotals {
  return {
    expenses: sumProjectionValues(projection.expenseByCategory),
    income: sumProjectionValues(projection.incomeByCategory),
    net: projection.net,
  };
}

function getActiveLoanTotals(activeLoans: ActiveLoan[]): ActiveLoanTotals {
  return activeLoans.reduce<ActiveLoanTotals>(
    (totals, loan) => ({
      remainingBalance: totals.remainingBalance + loan.remainingBalance,
      weeklyPayment: totals.weeklyPayment + loan.weeklyPayment,
    }),
    { remainingBalance: 0, weeklyPayment: 0 },
  );
}

function createProjectionRows(
  values: Partial<Record<EconomyCategory, number>>,
  maxAmount: number,
): ProjectionRow[] {
  return (Object.entries(values) as [EconomyCategory, number][])
    .filter(([, amount]) => amount > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([category, amount]) => ({
      amount,
      category,
      percent: Math.max(4, Math.round((amount / maxAmount) * 100)),
    }));
}

function getBarStyle(percent: number): CSSProperties {
  return { width: `${percent}%` };
}

export function FinancePanel({ onBuyoutLoan, onClose, onTakeLoan, save }: FinancePanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const projection = save.economy.weeklyProjection;
  const currentWeekSummary = save.economy.currentWeekSummary;
  const activeLoanDefinitionIds = new Set(
    save.economy.activeLoans.map((loan) => loan.definitionId),
  );
  const currentWeekTotals = getProjectionTotals(currentWeekSummary);
  const projectedWeekTotals = getProjectionTotals(projection);
  const activeLoanTotals = getActiveLoanTotals(save.economy.activeLoans);
  const projectedTreasury = save.ludus.treasury + projectedWeekTotals.net;
  const recentLedgerEntries = save.economy.ledgerEntries.slice(0, LEDGER_ENTRY_LIMIT);
  const maxProjectionAmount = Math.max(1, projectedWeekTotals.income, projectedWeekTotals.expenses);
  const incomeRows = createProjectionRows(projection.incomeByCategory, maxProjectionAmount);
  const expenseRows = createProjectionRows(projection.expenseByCategory, maxProjectionAmount);

  const requestLoan = (loan: (typeof LOAN_DEFINITIONS)[number]) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'finance.takeLoan',
      messageKey: 'finance.confirmLoan.message',
      messageParams: {
        amount: formatMoneyAmount(loan.amount),
        loan: t(loan.labelKey),
        payment: formatMoneyAmount(loan.weeklyPayment),
        weeks: loan.durationWeeks,
      },
      onConfirm: () => onTakeLoan(loan.id),
      testId: 'finance-take-loan-confirm-dialog',
      titleKey: 'finance.confirmLoan.title',
    });
  };

  const requestBuyout = (loan: GameSave['economy']['activeLoans'][number]) => {
    openConfirmModal({
      kind: 'confirm',
      confirmLabelKey: 'finance.buyoutLoan',
      messageKey: 'finance.confirmBuyout.message',
      messageParams: {
        amount: formatMoneyAmount(loan.remainingBalance),
        loan: t(`finance.loans.${loan.definitionId}.name`),
      },
      onConfirm: () => onBuyoutLoan(loan.id),
      testId: 'finance-buyout-loan-confirm-dialog',
      titleKey: 'finance.confirmBuyout.title',
    });
  };

  return (
    <PanelShell
      eyebrowKey="finance.eyebrow"
      titleKey="finance.title"
      testId="finance-panel"
      wide
      onClose={onClose}
    >
      <MetricList
        columns={3}
        items={[
          { labelKey: 'common.treasury', value: formatMoneyAmount(save.ludus.treasury) },
          {
            labelKey: 'finance.projectedTreasuryAfterWeek',
            value: formatMoneyAmount(projectedTreasury),
          },
          { labelKey: 'finance.activeLoans', value: save.economy.activeLoans.length },
          {
            labelKey: 'finance.activeLoanBalance',
            value: formatMoneyAmount(activeLoanTotals.remainingBalance),
          },
          {
            labelKey: 'finance.weeklyDebtService',
            value: formatMoneyAmount(activeLoanTotals.weeklyPayment),
          },
        ]}
      />
      <div className="finance-report-grid">
        <SectionCard titleKey="finance.currentWeekReportTitle">
          <MetricList
            columns={3}
            items={[
              {
                labelKey: 'finance.reportIncome',
                value: formatMoneyAmount(currentWeekTotals.income),
              },
              {
                labelKey: 'finance.reportExpenses',
                value: formatMoneyAmount(currentWeekTotals.expenses),
              },
              { labelKey: 'finance.reportNet', value: formatMoneyAmount(currentWeekTotals.net) },
            ]}
          />
        </SectionCard>
        <SectionCard titleKey="finance.weeklyProjectionTitle">
          <MetricList
            columns={3}
            items={[
              {
                labelKey: 'finance.projectedIncome',
                value: formatMoneyAmount(projectedWeekTotals.income),
              },
              {
                labelKey: 'finance.projectedExpenses',
                value: formatMoneyAmount(projectedWeekTotals.expenses),
              },
              {
                labelKey: 'finance.projectedNet',
                value: formatMoneyAmount(projectedWeekTotals.net),
              },
            ]}
          />
        </SectionCard>
      </div>
      <div className="finance-chart-grid">
        <SectionCard titleKey="finance.incomeChartTitle">
          {incomeRows.length > 0 ? (
            <div className="finance-chart-list">
              {incomeRows.map((row) => (
                <article className="finance-chart-row" key={row.category}>
                  <span>{t(`finance.categories.${row.category}`)}</span>
                  <strong>{formatMoneyAmount(row.amount)}</strong>
                  <div className="finance-chart-row__track">
                    <span
                      className="finance-chart-row__bar finance-chart-row__bar--income"
                      style={getBarStyle(row.percent)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState messageKey="finance.noProjection" />
          )}
        </SectionCard>
        <SectionCard titleKey="finance.expenseChartTitle">
          {expenseRows.length > 0 ? (
            <div className="finance-chart-list">
              {expenseRows.map((row) => (
                <article className="finance-chart-row" key={row.category}>
                  <span>{t(`finance.categories.${row.category}`)}</span>
                  <strong>{formatMoneyAmount(row.amount)}</strong>
                  <div className="finance-chart-row__track">
                    <span
                      className="finance-chart-row__bar finance-chart-row__bar--expense"
                      style={getBarStyle(row.percent)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState messageKey="finance.noProjection" />
          )}
        </SectionCard>
      </div>
      <SectionCard titleKey="finance.ledgerTitle">
        {recentLedgerEntries.length > 0 ? (
          <div className="finance-ledger">
            <p className="context-panel__muted">
              {t('finance.ledgerShowing', { count: recentLedgerEntries.length })}
            </p>
            <div className="finance-ledger-list">
              {recentLedgerEntries.map((entry) => {
                const context = getLedgerEntryContextLabel(entry, t);

                return (
                  <article className={`finance-entry finance-entry--${entry.kind}`} key={entry.id}>
                    <span className={`finance-entry__kind finance-entry__kind--${entry.kind}`}>
                      {t(`finance.ledgerKind.${entry.kind}`)}
                    </span>
                    <div className="finance-entry__main">
                      <strong>{t(entry.labelKey)}</strong>
                      {context ? <span>{context}</span> : null}
                    </div>
                    <div className="finance-entry__meta">
                      <span>{getLedgerEntryCategoryLabel(entry, t)}</span>
                      <span>{getLedgerEntryDateLabel(entry, t)}</span>
                    </div>
                    <strong
                      className={`finance-entry__amount finance-entry__amount--${entry.kind}`}
                    >
                      {formatLedgerEntryAmount(entry)}
                    </strong>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState messageKey="finance.noLedger" />
        )}
      </SectionCard>
      <SectionCard titleKey="finance.activeLoansTitle">
        {save.economy.activeLoans.length > 0 ? (
          <>
            <MetricList
              columns={2}
              items={[
                {
                  labelKey: 'finance.activeLoanBalance',
                  value: formatMoneyAmount(activeLoanTotals.remainingBalance),
                },
                {
                  labelKey: 'finance.weeklyDebtService',
                  value: formatMoneyAmount(activeLoanTotals.weeklyPayment),
                },
              ]}
            />
            <div className="finance-active-loan-grid">
              {save.economy.activeLoans.map((loan) => {
                const canBuyout = save.ludus.treasury >= loan.remainingBalance;

                return (
                  <article className="finance-loan-card" key={loan.id}>
                    <strong>{t(`finance.loans.${loan.definitionId}.name`)}</strong>
                    <MetricList
                      columns={3}
                      items={[
                        {
                          labelKey: 'finance.remainingBalance',
                          value: formatMoneyAmount(loan.remainingBalance),
                        },
                        {
                          labelKey: 'finance.weeklyPayment',
                          value: formatMoneyAmount(loan.weeklyPayment),
                        },
                        { labelKey: 'finance.remainingWeeks', value: loan.remainingWeeks },
                        {
                          labelKey: 'finance.loanStarted',
                          value: t('finance.weekValue', {
                            week: loan.startedWeek,
                            year: loan.startedYear,
                          }),
                        },
                      ]}
                    />
                    {!canBuyout ? (
                      <NoticeBox tone="warning">
                        {t('finance.insufficientTreasuryForBuyout')}
                      </NoticeBox>
                    ) : null}
                    <div className="context-panel__actions">
                      <CTAButton
                        disabled={!canBuyout}
                        type="button"
                        onClick={() => requestBuyout(loan)}
                      >
                        <GameIcon name="check" size={16} />
                        <span>{t('finance.buyoutLoan')}</span>
                      </CTAButton>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState messageKey="finance.noActiveLoans" />
        )}
      </SectionCard>
      <SectionCard titleKey="finance.loansTitle">
        <div className="planning-card-grid planning-card-grid--finance-loans">
          {LOAN_DEFINITIONS.map((loan) => {
            const isAlreadyActive = activeLoanDefinitionIds.has(loan.id);
            const hasRequiredDomusLevel = save.buildings.domus.level >= loan.requiredDomusLevel;
            const canTake = hasRequiredDomusLevel && !isAlreadyActive;

            return (
              <article
                className="planning-card planning-card--shell finance-loan-offer"
                key={loan.id}
              >
                <strong>{t(loan.labelKey)}</strong>
                <span>{t(loan.descriptionKey)}</span>
                <MetricList
                  columns={2}
                  items={[
                    { labelKey: 'finance.loanAmount', value: formatMoneyAmount(loan.amount) },
                    {
                      labelKey: 'finance.totalRepayment',
                      value: formatMoneyAmount(loan.weeklyPayment * loan.durationWeeks),
                    },
                    {
                      labelKey: 'finance.weeklyPayment',
                      value: formatMoneyAmount(loan.weeklyPayment),
                    },
                    {
                      labelKey: 'buildings.requiredDomus',
                      value: t('common.level', { level: loan.requiredDomusLevel }),
                    },
                    { labelKey: 'finance.duration', value: loan.durationWeeks },
                  ]}
                />
                {!hasRequiredDomusLevel ? (
                  <NoticeBox tone="warning">
                    {t('finance.loanLocked', { level: loan.requiredDomusLevel })}
                  </NoticeBox>
                ) : null}
                {isAlreadyActive ? (
                  <NoticeBox tone="info">{t('finance.loanAlreadyActive')}</NoticeBox>
                ) : null}
                <div className="context-panel__actions">
                  <CTAButton disabled={!canTake} type="button" onClick={() => requestLoan(loan)}>
                    <GameIcon name="treasury" size={17} />
                    <span>{t('finance.takeLoan')}</span>
                  </CTAButton>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </PanelShell>
  );
}
