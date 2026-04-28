import { LUDUS_NAME_EPITHETS, LUDUS_NAME_PREFIXES } from '../../game-data/ludus-names';

type RandomSource = () => number;

function pickRandomValue<T>(values: readonly T[], random: RandomSource) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))] as T;
}

function normalizeName(name?: string) {
  return name?.trim().toLocaleLowerCase() ?? '';
}

function avoidCurrentName(generate: () => string, currentName?: string) {
  const normalizedCurrentName = normalizeName(currentName);
  let nextName = generate();

  for (
    let attempt = 0;
    attempt < 5 && normalizeName(nextName) === normalizedCurrentName;
    attempt += 1
  ) {
    nextName = generate();
  }

  return nextName;
}

export function generateLudusName(currentName?: string, random: RandomSource = Math.random) {
  return avoidCurrentName(
    () =>
      `${pickRandomValue(LUDUS_NAME_PREFIXES, random)} ${pickRandomValue(LUDUS_NAME_EPITHETS, random)}`,
    currentName,
  );
}
