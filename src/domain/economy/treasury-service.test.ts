import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../saves/create-initial-save';
import type { GameSave } from '../saves/types';
import { recordExpense, recordForcedExpense, recordIncome } from './treasury-service';

function createTestSave(overrides: Partial<GameSave> = {}): GameSave {
  const save = createInitialSave({
    ludusName: 'Ludus Magnus',
    saveId: 'save-test',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  return {
    ...save,
    ...overrides,
  };
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return listSourceFiles(filePath);
    }

    return /\.(ts|tsx)$/.test(filePath) && !filePath.includes('.test.') ? [filePath] : [];
  });
}

describe('treasury service', () => {
  it('records income in the treasury and the ledger', () => {
    const save = createTestSave();
    const result = recordIncome(save, {
      amount: 75,
      category: 'event',
      labelKey: 'finance.ledger.event',
    });

    expect(result.ludus.treasury).toBe(save.ludus.treasury + 75);
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      kind: 'income',
      category: 'event',
      amount: 75,
    });
  });

  it('blocks voluntary expenses when the treasury cannot pay', () => {
    const save = createTestSave({
      ludus: {
        ...createTestSave().ludus,
        treasury: 50,
      },
    });
    const result = recordExpense(save, {
      amount: 80,
      category: 'event',
      labelKey: 'finance.ledger.event',
    });

    expect(result.validation).toMatchObject({
      isAllowed: false,
      cost: 80,
      reason: 'insufficientTreasury',
    });
    expect(result.save.ludus.treasury).toBe(50);
    expect(result.save.economy.ledgerEntries).toEqual(save.economy.ledgerEntries);
  });

  it('allows forced expenses to push the treasury below zero', () => {
    const save = createTestSave({
      ludus: {
        ...createTestSave().ludus,
        treasury: 50,
      },
    });
    const result = recordForcedExpense(save, {
      amount: 80,
      category: 'building',
      labelKey: 'finance.ledger.dailyExpenses',
    });

    expect(result.ludus.treasury).toBe(-30);
    expect(result.economy.ledgerEntries[0]).toMatchObject({
      kind: 'expense',
      category: 'building',
      amount: 80,
    });
  });

  it('keeps treasury mutations centralized in the treasury service', () => {
    const allowedFiles = new Set([
      'src/domain/economy/treasury-service.ts',
      'src/domain/saves/create-initial-save.ts',
      'src/domain/saves/save-validation.ts',
    ]);
    const sourceFiles = ['src/domain', 'src/state'].flatMap((directory) =>
      listSourceFiles(join(process.cwd(), directory)),
    );
    const directTreasuryMutationPattern = /ludus:\s*\{[\s\S]{0,420}?treasury\s*:/g;
    const offenders = sourceFiles
      .filter((filePath) => !allowedFiles.has(relative(process.cwd(), filePath)))
      .flatMap((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        const matches = [...source.matchAll(directTreasuryMutationPattern)];

        return matches.map(() => relative(process.cwd(), filePath));
      });

    expect(offenders).toEqual([]);
  });
});
