import { Tooltip } from './Tooltip';
import { GameIcon, type GameIconName } from '../icons/GameIcon';

export type ImpactIndicatorKind = Extract<
  GameIconName,
  | 'treasury'
  | 'reputation'
  | 'health'
  | 'energy'
  | 'morale'
  | 'satiety'
  | 'strength'
  | 'agility'
  | 'defense'
>;

type ImpactIndicatorProps =
  | {
      amount: number;
      chancePercent?: number;
      kind: ImpactIndicatorKind;
      label: string;
    }
  | {
      chancePercent?: number;
      text: string;
    };

function formatSignedImpact(amount: number) {
  return amount > 0 ? `+${amount}` : String(amount);
}

export function ImpactIndicator(props: ImpactIndicatorProps) {
  if ('text' in props) {
    return (
      <span className="impact-indicator impact-indicator--text">
        {props.chancePercent === undefined ? null : (
          <span className="impact-indicator__chance">{props.chancePercent}%</span>
        )}
        {props.text}
      </span>
    );
  }

  const tone = props.amount >= 0 ? 'positive' : 'negative';

  return (
    <span className={`impact-indicator impact-indicator--${tone}`}>
      {props.chancePercent === undefined ? null : (
        <span className="impact-indicator__chance">{props.chancePercent}%</span>
      )}
      <Tooltip className="impact-indicator__tooltip" content={props.label}>
        <GameIcon className="impact-indicator__icon" name={props.kind} size={20} />
      </Tooltip>
      <strong className="impact-indicator__amount">{formatSignedImpact(props.amount)}</strong>
    </span>
  );
}
