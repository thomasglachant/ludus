import './ludus-components.css';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/state/ui-store-context';
import { GameFact, type GameFactTone } from './GameFact';
import type { GameIconName } from '@/ui/shared/icons/GameIcon';

type TranslationParams = Record<string, string | number>;

export interface GameHeroFact {
  iconName?: GameIconName;
  id: string;
  label?: ReactNode;
  labelKey?: string;
  tone?: GameFactTone;
  value: ReactNode;
}

interface GameHeroProps {
  avatar?: ReactNode;
  className?: string;
  description?: ReactNode;
  descriptionContent?: ReactNode;
  descriptionKey?: string;
  descriptionParams?: TranslationParams;
  eyebrowKey?: string;
  facts?: GameHeroFact[];
  headingContent?: ReactNode;
  level?: ReactNode;
  levelLabelKey?: string;
  title?: ReactNode;
  titleKey?: string;
  titleParams?: TranslationParams;
}

export function GameHero({
  avatar,
  className,
  description,
  descriptionContent,
  descriptionKey,
  descriptionParams,
  eyebrowKey,
  facts = [],
  headingContent,
  level,
  levelLabelKey,
  title,
  titleKey,
  titleParams,
}: GameHeroProps) {
  const { t } = useUiStore();
  const resolvedDescription = descriptionKey ? t(descriptionKey, descriptionParams) : description;

  return (
    <section className={cn('game-hero', className)} data-slot="game-hero">
      {avatar ? <div className="game-hero__avatar">{avatar}</div> : null}
      <div className="game-hero__body">
        <div className="game-hero__heading">
          <div className="game-hero__title-block">
            {eyebrowKey ? <span className="game-hero__eyebrow">{t(eyebrowKey)}</span> : null}
            <h2>{titleKey ? t(titleKey, titleParams) : title}</h2>
          </div>
          {level === undefined ? null : (
            <GameFact
              className="game-hero__level"
              iconName="level"
              label={levelLabelKey ? t(levelLabelKey) : ''}
              surface="dark"
              tone="warning"
              value={level}
            />
          )}
        </div>
        {headingContent ? <div className="game-hero__heading-content">{headingContent}</div> : null}
        {resolvedDescription ? (
          <p className="game-hero__description">{resolvedDescription}</p>
        ) : null}
        {descriptionContent ? (
          <div className="game-hero__description-content">{descriptionContent}</div>
        ) : null}
        {facts.length > 0 ? (
          <dl className="game-hero__facts">
            {facts.map((fact) => {
              const label = fact.labelKey ? t(fact.labelKey) : fact.label;

              return (
                <div key={fact.id}>
                  <dt>{label}</dt>
                  <dd>
                    <GameFact
                      iconName={fact.iconName}
                      label={label}
                      surface="light"
                      tone={fact.tone}
                      value={fact.value}
                    />
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
