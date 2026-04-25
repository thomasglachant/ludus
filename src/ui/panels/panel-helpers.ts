export function formatOdds(value: number) {
  return value.toFixed(2);
}

export function getWinChancePercent(value: number) {
  return Math.round(value * 100);
}
