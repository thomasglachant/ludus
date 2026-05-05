import { Tooltip } from './Tooltip';
import { formatSignedNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';
import { useUiStore } from '../../state/ui-store-context';

export type ImpactIndicatorKind = Extract<
  GameIconName,
  | 'treasury'
  | 'reputation'
  | 'health'
  | 'injuryRisk'
  | 'energy'
  | 'morale'
  | 'strength'
  | 'agility'
  | 'defense'
  | 'experience'
  | 'level'
  | 'skillPoint'
  | 'victory'
  | 'warning'
  | 'xp'
>;

export type ImpactIndicatorSize = 'md' | 'sm';
export type ImpactIndicatorTone = 'negative' | 'neutral' | 'positive';

interface ImpactIndicatorBaseProps {
  chancePercent?: number;
  size?: ImpactIndicatorSize;
}

type ImpactIndicatorProps =
  | (ImpactIndicatorBaseProps & {
      amount: number;
      amountSuffix?: string;
      kind: ImpactIndicatorKind;
      label: string;
      tone?: ImpactIndicatorTone;
    })
  | (ImpactIndicatorBaseProps & {
      text: string;
    });

function getImpactIndicatorClassName(props: { size?: ImpactIndicatorSize }, tone?: string) {
  return ['impact-indicator', `impact-indicator--${props.size ?? 'md'}`, tone]
    .filter(Boolean)
    .join(' ');
}

export function ImpactIndicator(props: ImpactIndicatorProps) {
  const { t } = useUiStore();

  if ('text' in props) {
    return (
      <span className={getImpactIndicatorClassName(props, 'impact-indicator--text')}>
        {props.chancePercent === undefined ? null : (
          <span className="impact-indicator__chance">{props.chancePercent}%</span>
        )}
        {props.text}
      </span>
    );
  }

  const tone = props.tone ?? (props.amount >= 0 ? 'positive' : 'negative');
  const isXpImpact = props.kind === 'xp';

  return (
    <span className={getImpactIndicatorClassName(props, `impact-indicator--${tone}`)}>
      {props.chancePercent === undefined ? null : (
        <span className="impact-indicator__chance">{props.chancePercent}%</span>
      )}
      <span className="impact-indicator__tooltip-target">
        <Tooltip content={props.label}>
          {isXpImpact ? (
            <strong className="impact-indicator__symbol">{t('common.xpSymbol')}</strong>
          ) : (
            <GameIcon
              className="impact-indicator__icon"
              name={props.kind}
              size={props.size === 'sm' ? 16 : 20}
            />
          )}
        </Tooltip>
      </span>
      <strong className="impact-indicator__amount">
        {formatSignedNumber(props.amount)}
        {props.amountSuffix}
      </strong>
    </span>
  );
}
