import { ArrowRight, Eye, X } from 'lucide-react';
import { getArenaBettingState, validateScouting } from '../../domain/combat/combat-actions';
import { getContractProgress } from '../../domain/contracts/contract-actions';
import type { GameSave } from '../../domain/types';
import { useUiStore } from '../../state/ui-store';
import { GladiatorPortrait } from '../roster/GladiatorPortrait';
import { formatOdds, getWinChancePercent } from './panel-helpers';

interface PanelProps {
  save: GameSave;
  onClose(): void;
}

interface ContractsPanelProps extends PanelProps {
  onAcceptContract(contractId: string): void;
}

interface EventsPanelProps extends PanelProps {
  onResolveEventChoice(eventId: string, choiceId: string): void;
}

interface ArenaPanelProps extends PanelProps {
  onScoutOpponent(gladiatorId: string): void;
}

function PanelHeader({
  eyebrowKey,
  titleKey,
  onClose,
}: {
  eyebrowKey: string;
  titleKey: string;
  onClose(): void;
}) {
  const { t } = useUiStore();

  return (
    <div className="context-panel__header">
      <div>
        <p className="eyebrow">{t(eyebrowKey)}</p>
        <h2>{t(titleKey)}</h2>
      </div>
      <button aria-label={t('common.close')} type="button" onClick={onClose}>
        <X aria-hidden="true" size={18} />
      </button>
    </div>
  );
}

export function ContractsPanel({ save, onAcceptContract, onClose }: ContractsPanelProps) {
  const { t } = useUiStore();
  const availableContracts = save.contracts.availableContracts.filter(
    (contract) => contract.status === 'available',
  );
  const acceptedContracts = save.contracts.acceptedContracts.filter(
    (contract) => contract.status === 'accepted',
  );

  return (
    <section className="context-panel">
      <PanelHeader eyebrowKey="contracts.eyebrow" titleKey="contracts.title" onClose={onClose} />
      <div className="context-panel__list">
        {availableContracts.length > 0 ? (
          availableContracts.map((contract) => (
            <article key={contract.id}>
              <strong>{t(contract.titleKey)}</strong>
              <span>{t(contract.descriptionKey)}</span>
              <small>
                {t('contracts.reward', {
                  treasury: contract.rewardTreasury,
                  reputation: contract.rewardReputation ?? 0,
                })}
              </small>
              <button type="button" onClick={() => onAcceptContract(contract.id)}>
                <span>{t('contracts.accept')}</span>
              </button>
            </article>
          ))
        ) : (
          <p>{t('contracts.noAvailable')}</p>
        )}
      </div>
      {acceptedContracts.length > 0 ? (
        <div className="context-panel__list">
          <h3>{t('contracts.activeTitle')}</h3>
          {acceptedContracts.map((contract) => {
            const progress = getContractProgress(save, contract);

            return (
              <article key={contract.id}>
                <strong>{t(contract.titleKey)}</strong>
                <span>
                  {t('contracts.progress', {
                    current: progress.current,
                    target: progress.target,
                  })}
                </span>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function EventsPanel({ save, onClose, onResolveEventChoice }: EventsPanelProps) {
  const { t } = useUiStore();

  return (
    <section className="context-panel">
      <PanelHeader eyebrowKey="events.eyebrow" titleKey="events.title" onClose={onClose} />
      {save.events.pendingEvents.length > 0 ? (
        <div className="context-panel__list">
          {save.events.pendingEvents.map((event) => {
            const gladiator = save.gladiators.find(
              (candidate) => candidate.id === event.gladiatorId,
            );

            return (
              <article key={event.id}>
                <div className="context-panel__portrait-row">
                  {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                  <div>
                    <strong>{t(event.titleKey)}</strong>
                    <span>{t(event.descriptionKey)}</span>
                  </div>
                </div>
                <div className="event-choice-grid">
                  {event.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => onResolveEventChoice(event.id, choice.id)}
                    >
                      {t(choice.labelKey)}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="context-panel__muted">{t('events.noPending')}</p>
      )}
    </section>
  );
}

export function MarketPreviewPanel({ save, onClose }: PanelProps) {
  const { navigate, t } = useUiStore();

  return (
    <section className="context-panel">
      <PanelHeader eyebrowKey="market.eyebrow" titleKey="market.title" onClose={onClose} />
      <div className="context-panel__list">
        {save.market.availableGladiators.slice(0, 4).map((candidate) => (
          <article className="context-panel__portrait-row" key={candidate.id}>
            <GladiatorPortrait gladiator={candidate} size="small" />
            <div>
              <strong>{candidate.name}</strong>
              <span>{t('market.price', { price: candidate.price })}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="context-panel__actions">
        <button type="button" onClick={() => navigate('market')}>
          <span>{t('common.open')}</span>
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </section>
  );
}

export function ArenaPanel({ save, onClose, onScoutOpponent }: ArenaPanelProps) {
  const { t } = useUiStore();
  const betting = getArenaBettingState(save);

  return (
    <section className="context-panel context-panel--wide">
      <PanelHeader eyebrowKey="arena.eyebrow" titleKey="arena.title" onClose={onClose} />
      {betting.odds.length > 0 ? (
        <div className="context-panel__list">
          {betting.odds.map((odds) => {
            const gladiator = save.gladiators.find(
              (candidate) => candidate.id === odds.gladiatorId,
            );
            const validation = validateScouting(save, odds.gladiatorId);

            return (
              <article key={odds.id}>
                <div className="context-panel__portrait-row">
                  {gladiator ? <GladiatorPortrait gladiator={gladiator} size="small" /> : null}
                  <div>
                    <strong>
                      {gladiator
                        ? t('arena.combatTitle', {
                            gladiator: gladiator.name,
                            opponent: odds.opponent.name,
                          })
                        : odds.opponent.name}
                    </strong>
                    <span>
                      {t('betting.winChanceValue', {
                        chance: getWinChancePercent(odds.playerWinChance),
                      })}
                    </span>
                  </div>
                </div>
                <dl className="compact-stat-list">
                  <div>
                    <dt>{t('betting.playerOdds')}</dt>
                    <dd>{formatOdds(odds.playerDecimalOdds)}</dd>
                  </div>
                  <div>
                    <dt>{t('betting.opponentOdds')}</dt>
                    <dd>{formatOdds(odds.opponentDecimalOdds)}</dd>
                  </div>
                </dl>
                <button
                  disabled={!validation.isAllowed || odds.isScouted}
                  type="button"
                  onClick={() => onScoutOpponent(odds.gladiatorId)}
                >
                  <Eye aria-hidden="true" size={17} />
                  <span>
                    {odds.isScouted
                      ? t('betting.scouted')
                      : t('betting.scout', { cost: validation.cost })}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="context-panel__muted">
          {save.gladiators.length > 0 ? t('arena.nextSunday') : t('arena.noGladiators')}
        </p>
      )}
    </section>
  );
}
