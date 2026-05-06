import type { EconomyLedgerEntry } from '@/domain/types';
import { BUILDING_ACTIVITY_DEFINITIONS } from '@/game-data/building-activities';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '@/game-data/building-improvements';
import { BUILDING_SKILLS } from '@/game-data/building-skills';
import { BUILDING_DEFINITIONS } from '@/game-data/buildings';
import { formatMoneyAmount } from './money';

type TranslationParams = Record<string, string | number>;
type Translate = (key: string, params?: TranslationParams) => string;

function getRelatedLedgerLabel(entry: EconomyLedgerEntry, t: Translate) {
  if (!entry.relatedId) {
    return undefined;
  }

  const activity = BUILDING_ACTIVITY_DEFINITIONS.find(
    (definition) => definition.id === entry.relatedId,
  );

  if (activity) {
    return t(activity.nameKey);
  }

  const skill = BUILDING_SKILLS.find((definition) => definition.id === entry.relatedId);

  if (skill) {
    return t(skill.nameKey, { name: skill.name });
  }

  const improvement = BUILDING_IMPROVEMENTS.find((definition) => definition.id === entry.relatedId);

  if (improvement) {
    return t(improvement.nameKey);
  }

  const policy = BUILDING_POLICIES.find((definition) => definition.id === entry.relatedId);

  return policy ? t(policy.nameKey) : undefined;
}

function getLedgerContext(entry: EconomyLedgerEntry, t: Translate) {
  const building = entry.buildingId ? t(BUILDING_DEFINITIONS[entry.buildingId].nameKey) : undefined;
  const related = getRelatedLedgerLabel(entry, t);

  if (building && related) {
    return t('finance.ledgerContext', { building, related });
  }

  return building ?? related;
}

export function getLedgerEntryAmount(entry: EconomyLedgerEntry) {
  return entry.kind === 'income' ? entry.amount : -entry.amount;
}

export function formatLedgerEntryAmount(entry: EconomyLedgerEntry) {
  const amount = getLedgerEntryAmount(entry);

  return amount > 0 ? `+${formatMoneyAmount(amount)}` : formatMoneyAmount(amount);
}

export function getLedgerEntryCategoryLabel(entry: EconomyLedgerEntry, t: Translate) {
  return t(`finance.categories.${entry.category}`);
}

export function getLedgerEntryContextLabel(entry: EconomyLedgerEntry, t: Translate) {
  return getLedgerContext(entry, t);
}

export function getLedgerEntryDateLabel(entry: EconomyLedgerEntry, t: Translate) {
  return t('finance.ledgerDate', {
    day: t(`days.${entry.dayOfWeek}`),
    week: entry.week,
    year: entry.year,
  });
}

export function getLedgerEntryMeta(entry: EconomyLedgerEntry, t: Translate) {
  const params = {
    category: getLedgerEntryCategoryLabel(entry, t),
    day: t(`days.${entry.dayOfWeek}`),
    week: entry.week,
    year: entry.year,
  };
  const context = getLedgerContext(entry, t);

  return context
    ? t('finance.ledgerMetaWithContext', { ...params, context })
    : t('finance.ledgerMeta', params);
}
