import './modal-content.css';
import type { ReactNode } from 'react';
import { useUiStore } from '@/state/ui-store-context';
import { GameHero } from '@/ui/shared/ludus/GameHero';
import { GameSection } from '@/ui/shared/ludus/GameSection';
import { WaxTabletTabs } from '@/ui/shared/ludus/WaxTabletTabs';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';
import { TabsContent } from '@/ui/shared/primitives/Tabs';

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
  children?: ReactNode;
  items: ModalTabItem<T>[];
  selectedId: T;
  onSelect(id: T): void;
}

interface ModalTabPanelProps {
  children: ReactNode;
  className?: string;
  tabId?: string;
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
    <GameHero
      avatar={avatar}
      className="game-hero--modal"
      description={resolvedDescription}
      descriptionContent={descriptionContent}
      eyebrowKey={eyebrowKey}
      facts={metrics.map((metric) => ({
        iconName: metric.iconName,
        id: metric.id,
        labelKey: metric.labelKey,
        tone: metric.tone,
        value: metric.value,
      }))}
      headingContent={headingContent}
      level={level}
      levelLabelKey={levelLabelKey}
      title={titleKey ? t(titleKey, titleParams) : title}
    />
  );
}

export function ModalTabs<T extends string>({
  ariaLabelKey,
  children,
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
    >
      {children}
    </WaxTabletTabs>
  );
}

export function ModalTabPanel({ children, className, tabId }: ModalTabPanelProps) {
  const resolvedClassName = ['modal-tab-panel', className].filter(Boolean).join(' ');

  if (tabId) {
    return (
      <TabsContent className={resolvedClassName} value={tabId}>
        {children}
      </TabsContent>
    );
  }

  return (
    <div className={resolvedClassName} role="tabpanel">
      {children}
    </div>
  );
}

export function ModalSection({ children, className, titleKey }: ModalSectionProps) {
  return (
    <GameSection className={className} surface="plain" titleKey={titleKey}>
      {children}
    </GameSection>
  );
}

export function ModalActionDock({ children }: ModalActionDockProps) {
  return <div className="modal-action-dock">{children}</div>;
}
