import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store';

interface PanelShellProps {
  children: ReactNode;
  descriptionKey?: string;
  eyebrowKey: string;
  onClose(): void;
  testId?: string;
  title?: string;
  titleKey?: string;
  titleTestId?: string;
  wide?: boolean;
}

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  testId?: string;
  titleKey?: string;
}

interface TabItem<T extends string> {
  id: T;
  labelKey: string;
}

interface TabsProps<T extends string> {
  ariaLabelKey: string;
  items: TabItem<T>[];
  selectedId: T;
  onSelect(id: T): void;
}

interface EmptyStateProps {
  messageKey: string;
  testId?: string;
}

interface NoticeBoxProps {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'danger';
  testId?: string;
}

interface MetricItem {
  labelKey: string;
  value: ReactNode;
}

interface MetricListProps {
  items: MetricItem[];
  columns?: 2 | 3;
}

interface EffectListProps {
  emptyMessageKey?: string;
  effects: string[];
}

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

interface CostSummaryProps {
  labelKey: string;
  value: ReactNode;
}

export function PanelShell({
  children,
  descriptionKey,
  eyebrowKey,
  onClose,
  testId,
  title,
  titleKey,
  titleTestId,
  wide = false,
}: PanelShellProps) {
  const { t } = useUiStore();
  const fallbackTitleId = useId();
  const headingId = titleTestId ?? fallbackTitleId;

  return (
    <section
      aria-labelledby={headingId}
      className={wide ? 'context-panel context-panel--wide' : 'context-panel'}
      data-testid={testId}
    >
      <div className="context-panel__header">
        <div>
          <p className="eyebrow">{t(eyebrowKey)}</p>
          <h2 id={headingId} data-testid={titleTestId}>
            {titleKey ? t(titleKey) : title}
          </h2>
        </div>
        <button aria-label={t('common.close')} type="button" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      {descriptionKey ? <p className="context-panel__description">{t(descriptionKey)}</p> : null}
      {children}
    </section>
  );
}

export function SectionCard({ children, className, testId, titleKey }: SectionCardProps) {
  const { t } = useUiStore();

  return (
    <section className={['section-card', className].filter(Boolean).join(' ')} data-testid={testId}>
      {titleKey ? <strong>{t(titleKey)}</strong> : null}
      {children}
    </section>
  );
}

export function Tabs<T extends string>({
  ariaLabelKey,
  items,
  onSelect,
  selectedId,
}: TabsProps<T>) {
  const { t } = useUiStore();

  return (
    <div className="context-panel__tabs" role="tablist" aria-label={t(ariaLabelKey)}>
      {items.map((item) => (
        <button
          aria-selected={selectedId === item.id}
          className={selectedId === item.id ? 'is-selected' : ''}
          key={item.id}
          role="tab"
          type="button"
          onClick={() => onSelect(item.id)}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ messageKey, testId }: EmptyStateProps) {
  const { t } = useUiStore();

  return (
    <p className="empty-state" data-testid={testId}>
      {t(messageKey)}
    </p>
  );
}

export function NoticeBox({ children, testId, tone = 'info' }: NoticeBoxProps) {
  return (
    <div className={`notice-box notice-box--${tone}`} data-testid={testId}>
      {children}
    </div>
  );
}

export function MetricList({ columns = 3, items }: MetricListProps) {
  const { t } = useUiStore();

  return (
    <dl className={`context-panel__stats context-panel__stats--${columns}`}>
      {items.map((item) => (
        <div key={item.labelKey}>
          <dt>{t(item.labelKey)}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EffectList({ effects, emptyMessageKey = 'common.empty' }: EffectListProps) {
  if (effects.length === 0) {
    return <EmptyState messageKey={emptyMessageKey} />;
  }

  return (
    <ul className="effect-list">
      {effects.map((effect) => (
        <li key={effect}>{effect}</li>
      ))}
    </ul>
  );
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>;
}

export function CostSummary({ labelKey, value }: CostSummaryProps) {
  return <MetricList columns={2} items={[{ labelKey, value }]} />;
}
