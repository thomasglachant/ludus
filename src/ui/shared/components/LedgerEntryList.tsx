import './ledger-entry-list.css';
import type { EconomyLedgerEntry } from '@/domain/types';
import {
  formatLedgerEntryAmount,
  getLedgerEntryAmount,
  getLedgerEntryCategoryLabel,
  getLedgerEntryContextLabel,
  getLedgerEntryDateLabel,
  getLedgerEntryMeta,
} from '@/ui/shared/formatters/ledger';
import { formatMoneyAmount } from '@/ui/shared/formatters/money';
import { GameEmptyState } from '@/ui/shared/ludus/GameFeedback';
import { LightPanel } from '@/ui/shared/ludus/GamePanel';
import { EntityList, EntityListRow } from './EntityList';
import { useUiStore } from '@/state/ui-store-context';

interface LedgerEntryListProps {
  entries: EconomyLedgerEntry[];
  emptyMessageKey: string;
  variant?: 'compact' | 'detailed';
}

function getCompactTone(entry: EconomyLedgerEntry) {
  return entry.kind === 'income' ? 'positive' : 'danger';
}

function DetailedLedgerEntry({ entry }: { entry: EconomyLedgerEntry }) {
  const { t } = useUiStore();
  const context = getLedgerEntryContextLabel(entry, t);

  return (
    <LightPanel
      as="article"
      className={`ledger-entry ledger-entry--${entry.kind}`}
      density="compact"
    >
      <span className={`ledger-entry__kind ledger-entry__kind--${entry.kind}`}>
        {t(`finance.ledgerKind.${entry.kind}`)}
      </span>
      <div className="ledger-entry__main">
        <strong>{t(entry.labelKey)}</strong>
        {context ? <span>{context}</span> : null}
      </div>
      <div className="ledger-entry__meta">
        <span>{getLedgerEntryCategoryLabel(entry, t)}</span>
        <span>{getLedgerEntryDateLabel(entry, t)}</span>
      </div>
      <strong className={`ledger-entry__amount ledger-entry__amount--${entry.kind}`}>
        {formatLedgerEntryAmount(entry)}
      </strong>
    </LightPanel>
  );
}

function CompactLedgerEntry({ entry }: { entry: EconomyLedgerEntry }) {
  const { t } = useUiStore();

  return (
    <EntityListRow
      info={[
        {
          iconName: 'treasury',
          id: 'amount',
          label: t(`finance.ledgerKind.${entry.kind}`),
          tone: getCompactTone(entry),
          value: formatMoneyAmount(getLedgerEntryAmount(entry)),
        },
      ]}
      subtitle={getLedgerEntryMeta(entry, t)}
      title={t(entry.labelKey)}
    />
  );
}

export function LedgerEntryList({
  emptyMessageKey,
  entries,
  variant = 'detailed',
}: LedgerEntryListProps) {
  if (variant === 'compact') {
    return (
      <EntityList emptyMessageKey={emptyMessageKey}>
        {entries.map((entry) => (
          <CompactLedgerEntry entry={entry} key={entry.id} />
        ))}
      </EntityList>
    );
  }

  if (entries.length === 0) {
    return <GameEmptyState messageKey={emptyMessageKey} />;
  }

  return (
    <div className="ledger-entry-list">
      {entries.map((entry) => (
        <DetailedLedgerEntry entry={entry} key={entry.id} />
      ))}
    </div>
  );
}
