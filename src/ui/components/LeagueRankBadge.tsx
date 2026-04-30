import type { ArenaRank } from '../../domain/types';
import { Tooltip } from './Tooltip';

interface LeagueRankBadgeProps {
  label: string;
  rank: ArenaRank;
}

const LEAGUE_TONES = {
  bronze: '#b56f3c',
  silver: '#b9c2c7',
  gold: '#d6a34a',
} as const;

function getLeagueTone(rank: ArenaRank) {
  if (rank.startsWith('silver')) {
    return LEAGUE_TONES.silver;
  }

  if (rank.startsWith('gold')) {
    return LEAGUE_TONES.gold;
  }

  return LEAGUE_TONES.bronze;
}

function getChevronCount(rank: ArenaRank) {
  const tier = Number(rank[rank.length - 1]);
  return Number.isFinite(tier) ? tier : 1;
}

export function LeagueRankBadge({ label, rank }: LeagueRankBadgeProps) {
  const chevrons = Array.from({ length: getChevronCount(rank) }, (_, index) => index);
  const color = getLeagueTone(rank);

  return (
    <Tooltip content={label}>
      <span className="league-rank-badge">
        <svg aria-hidden="true" className="league-rank-badge__icon" viewBox="0 0 42 42">
          <path
            d="M21 4 34 9v12c0 8-5.4 14.1-13 17-7.6-2.9-13-9-13-17V9l13-5Z"
            fill="none"
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {chevrons.map((chevron) => (
            <path
              d={`M13 ${27 - chevron * 6} 21 ${20 - chevron * 6} 29 ${27 - chevron * 6}`}
              fill="none"
              key={chevron}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          ))}
        </svg>
      </span>
    </Tooltip>
  );
}
