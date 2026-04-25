import { describe, expect, it } from 'vitest';
import { resolveArenaDay } from '../combat/combat-actions';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave, Gladiator } from '../types';
import {
  acceptWeeklyContract,
  completeSaleContracts,
  getContractProgress,
  synchronizeContracts,
} from './contract-actions';

function createTestSave() {
  return createInitialSave({
    ownerName: 'Marcus',
    ludusName: 'Ludus Magnus',
    language: 'en',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });
}

function createGladiator(overrides: Partial<Gladiator> = {}): Gladiator {
  return {
    id: 'gladiator-test',
    name: 'Aulus',
    age: 24,
    strength: 35,
    agility: 35,
    defense: 30,
    energy: 90,
    health: 100,
    morale: 70,
    satiety: 80,
    reputation: 0,
    wins: 0,
    losses: 0,
    traits: [],
    ...overrides,
  };
}

function withSundayArena(save: GameSave, gladiators: Gladiator[]) {
  return {
    ...save,
    time: {
      ...save.time,
      dayOfWeek: 'sunday' as const,
    },
    gladiators,
  };
}

describe('contract actions', () => {
  it('creates weekly contract offers in the initial save', () => {
    const save = createTestSave();

    expect(save.contracts.availableContracts).toHaveLength(3);
    expect(save.contracts.availableContracts[0]).toMatchObject({
      status: 'available',
      issuedAtYear: 1,
      issuedAtWeek: 1,
    });
  });

  it('accepts and completes an arena win contract after Sunday combat', () => {
    const save = createTestSave();
    const contract = save.contracts.availableContracts.find(
      (candidate) => candidate.objective.type === 'winFightCount',
    );

    expect(contract).toBeDefined();

    const accepted = acceptWeeklyContract(save, contract?.id ?? '').save;
    const resolvedArena = resolveArenaDay(withSundayArena(accepted, [createGladiator()]), () => 0);
    const resolvedContracts = synchronizeContracts(resolvedArena);
    const completedContract = resolvedContracts.contracts.acceptedContracts[0];
    const progress = getContractProgress(resolvedContracts, completedContract);

    expect(completedContract.status).toBe('completed');
    expect(progress).toMatchObject({
      current: 1,
      target: 1,
      isComplete: true,
    });
    expect(resolvedContracts.ludus.treasury).toBe(
      resolvedArena.ludus.treasury + completedContract.rewardTreasury,
    );
  });

  it('does not regenerate more offers after all current week contracts are accepted', () => {
    const save = createTestSave();
    const acceptedAll = save.contracts.availableContracts.reduce(
      (updatedSave, contract) => acceptWeeklyContract(updatedSave, contract.id).save,
      save,
    );
    const synchronized = synchronizeContracts(acceptedAll);

    expect(synchronized.contracts.availableContracts).toEqual([]);
    expect(synchronized.contracts.acceptedContracts).toHaveLength(3);
  });

  it('completes sale contracts when the sale value reaches the target', () => {
    const save = createTestSave();
    const saleContract = {
      ...save.contracts.availableContracts[0],
      id: 'contract-sale-test',
      status: 'accepted' as const,
      objective: { type: 'sellGladiatorForAtLeast' as const, amount: 220 },
      rewardTreasury: 80,
    };
    const saveWithContract: GameSave = {
      ...save,
      contracts: {
        availableContracts: [],
        acceptedContracts: [saleContract],
      },
    };
    const resolved = completeSaleContracts(saveWithContract, 250);

    expect(resolved.contracts.acceptedContracts[0].status).toBe('completed');
    expect(resolved.ludus.treasury).toBe(save.ludus.treasury + saleContract.rewardTreasury);
  });
});
