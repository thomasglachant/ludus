import './finance.css';
import { useState, type CSSProperties } from 'react';
import { LOAN_DEFINITIONS } from '@/game-data/economy';
import type {
  ActiveLoan,
  EconomyCategory,
  GameSave,
  LoanId,
  WeeklyProjection,
} from '@/domain/types';
import { useUiStore } from '@/state/ui-store-context';
import { ActionBar } from '@/ui/shared/ludus/ActionBar';
import { PrimaryActionButton } from '@/ui/shared/ludus/PrimaryActionButton';
import { LedgerEntryList } from '@/ui/shared/components/LedgerEntryList';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { GameEmptyState, GameNotice } from '@/ui/shared/ludus/GameFeedback';
import { GameSection, GameStats } from '@/ui/shared/ludus/GameSection';
import { LightPanel } from '@/ui/shared/ludus/GamePanel';
import { GameIcon } from '@/ui/shared/icons/GameIcon';
import {
  ModalContentFrame,
  ModalHeroCard,
  ModalSection,
  ModalTabPanel,
  ModalTabs,
  type ModalTabItem,
} from '@/ui/app-shell/modals/ModalContentFrame';

const LEDGER_ENTRY_LIMIT = 14;

interface FinancePanelProps {
  save: GameSave;
  onBuyoutLoan(loanInstanceId: string): void;
  onTakeLoan(loanId: LoanId): void;
}

type FinancePanelTab = 'expenses' | 'ledger' | 'loans' | 'overview';

function FinanceAvatar() {
  return (
    <div className="modal-icon-avatar" aria-hidden="true">
      <GameIcon name="treasury" size={58} />
    </div>
  );
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

export function FinancePanel({ onBuyoutLoan, onTakeLoan, save }: FinancePanelProps) {
  const { openConfirmModal, t } = useUiStore();
  const [activeTab, setActiveTab] = useState<FinancePanelTab>('overview');
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
  const recentExpenseEntries = save.economy.ledgerEntries
    .filter((entry) => entry.kind === 'expense')
    .slice(0, LEDGER_ENTRY_LIMIT);
  const maxProjectionAmount = Math.max(1, projectedWeekTotals.income, projectedWeekTotals.expenses);
  const incomeRows = createProjectionRows(projection.incomeByCategory, maxProjectionAmount);
  const expenseRows = createProjectionRows(projection.expenseByCategory, maxProjectionAmount);
  const tabItems: ModalTabItem<FinancePanelTab>[] = [
    { id: 'overview', labelKey: 'finance.tabs.overview' },
    { count: recentLedgerEntries.length, id: 'ledger', labelKey: 'finance.tabs.ledger' },
    { count: recentExpenseEntries.length, id: 'expenses', labelKey: 'finance.tabs.expenses' },
    { count: save.economy.activeLoans.length, id: 'loans', labelKey: 'finance.tabs.loans' },
  ];

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
    <ModalContentFrame className="finance-modal-frame">
      <ModalHeroCard
        avatar={<FinanceAvatar />}
        descriptionKey="finance.description"
        eyebrowKey="finance.eyebrow"
        metrics={[
          {
            iconName: 'treasury',
            id: 'treasury',
            labelKey: 'common.treasury',
            value: formatMoneyAmount(save.ludus.treasury),
          },
          {
            iconName: 'weeklyPlanning',
            id: 'projected-treasury',
            labelKey: 'finance.projectedTreasuryAfterWeek',
            tone: projectedTreasury >= save.ludus.treasury ? 'positive' : 'warning',
            value: formatMoneyAmount(projectedTreasury),
          },
          {
            iconName: 'treasury',
            id: 'projected-net',
            labelKey: 'finance.projectedNet',
            tone: projectedWeekTotals.net >= 0 ? 'positive' : 'danger',
            value: formatMoneyAmount(projectedWeekTotals.net),
          },
          {
            iconName: 'warning',
            id: 'active-loans',
            labelKey: 'finance.activeLoans',
            tone: save.economy.activeLoans.length > 0 ? 'warning' : 'neutral',
            value: save.economy.activeLoans.length,
          },
        ]}
        titleKey="finance.title"
      />
      <ModalTabs<FinancePanelTab>
        ariaLabelKey="finance.tabsLabel"
        items={tabItems}
        selectedId={activeTab}
        onSelect={setActiveTab}
      >
        <ModalTabPanel tabId="overview">
          <GameStats
            columns={3}
            items={[
              { labelKey: 'common.treasury', value: formatMoneyAmount(save.ludus.treasury) },
              {
                labelKey: 'finance.projectedTreasuryAfterWeek',
                value: formatMoneyAmount(projectedTreasury),
              },
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
            <GameSection titleKey="finance.currentWeekReportTitle">
              <GameStats
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
                  {
                    labelKey: 'finance.reportNet',
                    value: formatMoneyAmount(currentWeekTotals.net),
                  },
                ]}
              />
            </GameSection>
            <GameSection titleKey="finance.weeklyProjectionTitle">
              <GameStats
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
            </GameSection>
          </div>
          <div className="finance-chart-grid">
            <GameSection titleKey="finance.incomeChartTitle">
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
                <GameEmptyState messageKey="finance.noProjection" />
              )}
            </GameSection>
            <GameSection titleKey="finance.expenseChartTitle">
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
                <GameEmptyState messageKey="finance.noProjection" />
              )}
            </GameSection>
          </div>
        </ModalTabPanel>

        <ModalTabPanel tabId="ledger">
          <ModalSection titleKey="finance.ledgerTitle">
            <div className="finance-ledger">
              <p className="context-panel__muted">
                {t('finance.ledgerShowing', { count: recentLedgerEntries.length })}
              </p>
              <LedgerEntryList entries={recentLedgerEntries} emptyMessageKey="finance.noLedger" />
            </div>
          </ModalSection>
        </ModalTabPanel>

        <ModalTabPanel tabId="expenses">
          <ModalSection titleKey="finance.expensesTitle">
            <div className="finance-ledger">
              <p className="context-panel__muted">
                {t('finance.expensesShowing', { count: recentExpenseEntries.length })}
              </p>
              <LedgerEntryList
                entries={recentExpenseEntries}
                emptyMessageKey="finance.noExpenses"
              />
            </div>
          </ModalSection>
        </ModalTabPanel>

        <ModalTabPanel tabId="loans">
          <GameSection titleKey="finance.activeLoansTitle">
            {save.economy.activeLoans.length > 0 ? (
              <>
                <GameStats
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
                      <LightPanel
                        as="article"
                        className="finance-loan-card"
                        density="compact"
                        key={loan.id}
                      >
                        <strong>{t(`finance.loans.${loan.definitionId}.name`)}</strong>
                        <GameStats
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
                          <GameNotice tone="warning">
                            {t('finance.insufficientTreasuryForBuyout')}
                          </GameNotice>
                        ) : null}
                        <ActionBar className="context-panel__action-bar">
                          <PrimaryActionButton
                            amountMoney={formatMoneyAmount(loan.remainingBalance)}
                            disabled={!canBuyout}
                            type="button"
                            onClick={() => requestBuyout(loan)}
                          >
                            <GameIcon name="check" size={16} />
                            <span>{t('finance.buyoutLoan')}</span>
                          </PrimaryActionButton>
                        </ActionBar>
                      </LightPanel>
                    );
                  })}
                </div>
              </>
            ) : (
              <GameEmptyState messageKey="finance.noActiveLoans" />
            )}
          </GameSection>
          <GameSection titleKey="finance.loansTitle">
            <div className="finance-card-grid finance-card-grid--loans">
              {LOAN_DEFINITIONS.map((loan) => {
                const isAlreadyActive = activeLoanDefinitionIds.has(loan.id);
                const hasRequiredDomusLevel = save.buildings.domus.level >= loan.requiredDomusLevel;
                const canTake = hasRequiredDomusLevel && !isAlreadyActive;

                return (
                  <LightPanel
                    as="article"
                    className="finance-card finance-loan-offer"
                    density="normal"
                    key={loan.id}
                  >
                    <strong>{t(loan.labelKey)}</strong>
                    <span>{t(loan.descriptionKey)}</span>
                    <GameStats
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
                      <GameNotice tone="warning">
                        {t('finance.loanLocked', { level: loan.requiredDomusLevel })}
                      </GameNotice>
                    ) : null}
                    {isAlreadyActive ? (
                      <GameNotice tone="info">{t('finance.loanAlreadyActive')}</GameNotice>
                    ) : null}
                    <ActionBar className="context-panel__action-bar">
                      <PrimaryActionButton
                        amountMoney={formatMoneyAmount(loan.amount)}
                        disabled={!canTake}
                        type="button"
                        onClick={() => requestLoan(loan)}
                      >
                        <GameIcon name="treasury" size={17} />
                        <span>{t('finance.takeLoan')}</span>
                      </PrimaryActionButton>
                    </ActionBar>
                  </LightPanel>
                );
              })}
            </div>
          </GameSection>
        </ModalTabPanel>
      </ModalTabs>
    </ModalContentFrame>
  );
}
