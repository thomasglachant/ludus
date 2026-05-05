import type { HTMLAttributes } from 'react';
import {
  ImpactIndicator,
  type ImpactIndicatorKind,
  type ImpactIndicatorSize,
} from './ImpactIndicator';

export interface ImpactListItem {
  amount: number;
  amountSuffix?: string;
  chancePercent?: number;
  id: string;
  kind: ImpactIndicatorKind;
  label: string;
  size?: ImpactIndicatorSize;
}

interface ImpactListProps extends HTMLAttributes<HTMLDivElement> {
  impacts: ImpactListItem[];
  size?: ImpactIndicatorSize;
}

function sortImpactsByTone(impacts: ImpactListItem[]) {
  return impacts
    .map((impact, index) => ({ impact, index }))
    .sort((left, right) => {
      const leftRank = left.impact.amount >= 0 ? 0 : 1;
      const rightRank = right.impact.amount >= 0 ? 0 : 1;

      return leftRank - rightRank || left.index - right.index;
    })
    .map(({ impact }) => impact);
}

export function ImpactList({ className, impacts, size, ...props }: ImpactListProps) {
  return (
    <div className={['impact-list', className].filter(Boolean).join(' ')} {...props}>
      {sortImpactsByTone(impacts).map((impact) => (
        <ImpactIndicator
          amount={impact.amount}
          amountSuffix={impact.amountSuffix}
          chancePercent={impact.chancePercent}
          key={impact.id}
          kind={impact.kind}
          label={impact.label}
          size={impact.size ?? size}
        />
      ))}
    </div>
  );
}
