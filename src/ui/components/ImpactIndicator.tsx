import { Tooltip } from './Tooltip';
import { formatSignedNumber } from '../formatters/number';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

export type ImpactIndicatorKind = Extract<
  GameIconName,
  'treasury' | 'reputation' | 'health' | 'energy' | 'morale' | 'strength' | 'agility' | 'defense'
>;

export type ImpactIndicatorSize = 'md' | 'sm';

interface ImpactIndicatorBaseProps {
  chancePercent?: number;
  size?: ImpactIndicatorSize;
}

type ImpactIndicatorProps =
  | (ImpactIndicatorBaseProps & {
      amount: number;
      kind: ImpactIndicatorKind;
      label: string;
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

  const tone = props.amount >= 0 ? 'positive' : 'negative';

  return (
    <span className={getImpactIndicatorClassName(props, `impact-indicator--${tone}`)}>
      {props.chancePercent === undefined ? null : (
        <span className="impact-indicator__chance">{props.chancePercent}%</span>
      )}
      <span className="impact-indicator__tooltip-target">
        <Tooltip content={props.label}>
          <GameIcon
            className="impact-indicator__icon"
            name={props.kind}
            size={props.size === 'sm' ? 16 : 20}
          />
        </Tooltip>
      </span>
      <strong className="impact-indicator__amount">{formatSignedNumber(props.amount)}</strong>
    </span>
  );
}
