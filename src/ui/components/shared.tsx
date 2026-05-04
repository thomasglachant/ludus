import type { ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { WaxTabletTabs } from '../game/WaxTabletTabs';

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

interface LogRowProps {
  children: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
}

export function PanelShell({ children, descriptionKey, wide = false }: PanelShellProps) {
  const { t } = useUiStore();

  return (
    <section className={wide ? 'modal-panel modal-panel--wide' : 'modal-panel'}>
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
    <WaxTabletTabs
      ariaLabel={t(ariaLabelKey)}
      items={items.map((item) => ({ ...item, label: t(item.labelKey) }))}
      listClassName="context-panel__tabs"
      selectedId={selectedId}
      onSelect={onSelect}
    />
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

export function LogRow({ children, label, meta }: LogRowProps) {
  return (
    <li className="log-row">
      <span>{label}</span>
      <p>{children}</p>
      {meta ? <small>{meta}</small> : null}
    </li>
  );
}
