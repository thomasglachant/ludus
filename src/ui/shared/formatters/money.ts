import { formatNumber } from './number';

const COMPACT_MONEY_THRESHOLDS = [{ divisor: 1_000_000, minimum: 1_000_000, suffix: 'M' }] as const;

function formatCompactValue(value: number) {
  const hasDecimal = !Number.isInteger(value) && value < 10;

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: hasDecimal ? 1 : 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyAmount(amount: number) {
  const roundedAmount = Math.round(amount);
  const sign = roundedAmount < 0 ? '-' : '';
  const absoluteAmount = Math.abs(roundedAmount);
  const threshold = COMPACT_MONEY_THRESHOLDS.find(
    (candidate) => absoluteAmount >= candidate.minimum,
  );

  if (!threshold) {
    return `${sign}${formatNumber(absoluteAmount)}`;
  }

  return `${sign}${formatCompactValue(absoluteAmount / threshold.divisor)}${threshold.suffix}`;
}
