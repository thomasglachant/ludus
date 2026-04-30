const SPACED_INTEGER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function formatNumber(value: number) {
  return SPACED_INTEGER_FORMATTER.format(Math.round(value)).replace(/\u202f|\u00a0/g, ' ');
}

export function formatSignedNumber(value: number) {
  const roundedValue = Math.round(value);

  return roundedValue > 0 ? `+${formatNumber(roundedValue)}` : formatNumber(roundedValue);
}
