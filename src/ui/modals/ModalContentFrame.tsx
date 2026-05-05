import type { ReactNode } from 'react';
import { useUiStore } from '../../state/ui-store-context';
import { WaxTabletTabs } from '../game/WaxTabletTabs';
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
  descriptionContent?: ReactNode;
  descriptionKey?: string;
  descriptionParams?: TranslationParams;
  eyebrowKey?: string;
  headingContent?: ReactNode;
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

export function ModalContentFrame({ children, className }: ModalContentFrameProps) {
  return (
    <section className={['modal-frame', className].filter(Boolean).join(' ')}>{children}</section>
  );
}

export function ModalHeroCard({
  avatar,
  description,
  descriptionContent,
  descriptionKey,
  descriptionParams,
  eyebrowKey,
  headingContent,
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
        {headingContent ? (
          <div className="modal-hero-card__heading-content">{headingContent}</div>
        ) : null}
        {resolvedDescription ? <p>{resolvedDescription}</p> : null}
        {descriptionContent ? (
          <div className="modal-hero-card__description-content">{descriptionContent}</div>
        ) : null}
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
    <WaxTabletTabs
      ariaLabel={t(ariaLabelKey)}
      items={items.map((item) => ({ ...item, label: t(item.labelKey) }))}
      listClassName="modal-tabs"
      selectedId={selectedId}
      onSelect={onSelect}
    />
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
