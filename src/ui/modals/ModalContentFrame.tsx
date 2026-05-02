import type { ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

type TranslationParams = Record<string, string | number>;

export type ModalTabItem<T extends string> = {
  count?: number;
  countMax?: number;
  id: T;
  labelKey: string;
};

export type ModalHeroMetricTone = 'danger' | 'neutral' | 'positive' | 'warning';

export interface ModalHeroMetric {
  iconName?: GameIconName;
  id: string;
  labelKey: string;
  tone?: ModalHeroMetricTone;
  value: ReactNode;
}

interface ModalContentFrameProps {
  children: ReactNode;
  className?: string;
}

interface ModalHeroCardProps {
  avatar: ReactNode;
  description?: ReactNode;
  descriptionKey?: string;
  descriptionParams?: TranslationParams;
  eyebrowKey?: string;
  level?: ReactNode;
  levelLabelKey?: string;
  metrics?: ModalHeroMetric[];
  title?: ReactNode;
  titleKey?: string;
  titleParams?: TranslationParams;
}

interface ModalTabsProps<T extends string> {
  ariaLabelKey: string;
  items: ModalTabItem<T>[];
  selectedId: T;
  onSelect(id: T): void;
}

interface ModalTabPanelProps {
  children: ReactNode;
  className?: string;
}

interface ModalSectionProps {
  children: ReactNode;
  className?: string;
  titleKey?: string;
}

interface ModalActionDockProps {
  children: ReactNode;
}

function formatTabCount(item: ModalTabItem<string>) {
  if (item.count === undefined) {
    return null;
  }

  return item.countMax === undefined ? item.count : `${item.count}/${item.countMax}`;
}

export function ModalContentFrame({ children, className }: ModalContentFrameProps) {
  return (
    <section className={['modal-frame', className].filter(Boolean).join(' ')}>{children}</section>
  );
}

export function ModalHeroCard({
  avatar,
  description,
  descriptionKey,
  descriptionParams,
  eyebrowKey,
  level,
  levelLabelKey,
  metrics = [],
  title,
  titleKey,
  titleParams,
}: ModalHeroCardProps) {
  const { t } = useUiStore();
  const resolvedDescription = descriptionKey ? t(descriptionKey, descriptionParams) : description;

  return (
    <section className="modal-hero-card">
      <div className="modal-hero-card__avatar">{avatar}</div>
      <div className="modal-hero-card__body">
        <div className="modal-hero-card__heading">
          <div>
            {eyebrowKey ? <span className="modal-hero-card__eyebrow">{t(eyebrowKey)}</span> : null}
            <h2>{titleKey ? t(titleKey, titleParams) : title}</h2>
          </div>
          {level === undefined ? null : (
            <div className="modal-hero-card__level">
              {levelLabelKey ? <span>{t(levelLabelKey)}</span> : null}
              <strong>{level}</strong>
            </div>
          )}
        </div>
        {resolvedDescription ? <p>{resolvedDescription}</p> : null}
        {metrics.length > 0 ? (
          <dl className="modal-hero-card__metrics">
            {metrics.map((metric) => (
              <div
                className={`modal-hero-card__metric modal-hero-card__metric--${metric.tone ?? 'neutral'}`}
                key={metric.id}
              >
                <dt>
                  {metric.iconName ? <GameIcon name={metric.iconName} size={16} /> : null}
                  <span>{t(metric.labelKey)}</span>
                </dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function ModalTabs<T extends string>({
  ariaLabelKey,
  items,
  onSelect,
  selectedId,
}: ModalTabsProps<T>) {
  const { t } = useUiStore();

  return (
    <div className="modal-tabs" role="tablist" aria-label={t(ariaLabelKey)}>
      {items.map((item) => {
        const count = formatTabCount(item);

        return (
          <button
            aria-selected={selectedId === item.id}
            className={selectedId === item.id ? 'is-selected' : ''}
            key={item.id}
            role="tab"
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <span>{t(item.labelKey)}</span>
            {count === null ? null : <strong>{count}</strong>}
          </button>
        );
      })}
    </div>
  );
}

export function ModalTabPanel({ children, className }: ModalTabPanelProps) {
  return (
    <div className={['modal-tab-panel', className].filter(Boolean).join(' ')} role="tabpanel">
      {children}
    </div>
  );
}

export function ModalSection({ children, className, titleKey }: ModalSectionProps) {
  const { t } = useUiStore();

  return (
    <section className={['modal-section', className].filter(Boolean).join(' ')}>
      {titleKey ? <h3>{t(titleKey)}</h3> : null}
      {children}
    </section>
  );
}

export function ModalActionDock({ children }: ModalActionDockProps) {
  return <div className="modal-action-dock">{children}</div>;
}
