import type { EconomyLedgerEntry } from '../../domain/types';
import {
  formatLedgerEntryAmount,
  getLedgerEntryAmount,
  getLedgerEntryCategoryLabel,
  getLedgerEntryContextLabel,
  getLedgerEntryDateLabel,
  getLedgerEntryMeta,
} from '../formatters/ledger';
import { formatMoneyAmount } from '../formatters/money';
import { ParchmentPanel } from '../game/GamePanel';
import { EntityList, EntityListRow } from './EntityList';
import { EmptyState } from './shared';
import { useUiStore } from '../../state/ui-store-context';

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
    <ParchmentPanel
      as="article"
      className={`finance-entry finance-entry--${entry.kind}`}
      density="compact"
    >
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
      <strong className={`finance-entry__amount finance-entry__amount--${entry.kind}`}>
        {formatLedgerEntryAmount(entry)}
      </strong>
    </ParchmentPanel>
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
    return <EmptyState messageKey={emptyMessageKey} />;
  }

  return (
    <div className="finance-ledger-list">
      {entries.map((entry) => (
        <DetailedLedgerEntry entry={entry} key={entry.id} />
      ))}
    </div>
  );
}
