// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, type LedgerRow } from '../db';
import { addLedgerEntries, getBalance, listLedger, spend } from './ledger';
import { countOutbox, listOutbox } from './outbox';

const NOW = new Date('2026-10-02T02:00:00.000Z');
const entry = (id: string, delta: number, profileId = 'p1'): LedgerRow => ({
  id,
  profileId,
  delta,
  reason: 'level-clear',
  refId: 'w01-l01',
  at: NOW.toISOString(),
  localDay: '2026-10-02',
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('ledger repository', () => {
  it('adds entries and queues each one in the outbox', async () => {
    const added = await addLedgerEntries(
      [entry('level-clear:w01-l01', 10), entry('star-2:w01-l01', 5)],
      NOW,
    );
    expect(added).toHaveLength(2);
    expect(await getBalance('p1')).toBe(15);
    const outbox = await listOutbox();
    expect(outbox.map((row) => [row.table, row.tries, row.createdAt])).toEqual([
      ['ledger', 0, NOW.toISOString()],
      ['ledger', 0, NOW.toISOString()],
    ]);
  });

  it('is idempotent per (profile, id), also within one batch', async () => {
    await addLedgerEntries([entry('level-clear:w01-l01', 10)], NOW);
    const again = await addLedgerEntries(
      [
        entry('level-clear:w01-l01', 10),
        entry('daily:2026-10-02', 10),
        entry('daily:2026-10-02', 10),
      ],
      NOW,
    );
    expect(again.map((e) => e.id)).toEqual(['daily:2026-10-02']);
    expect(await getBalance('p1')).toBe(20);
    expect(await countOutbox()).toBe(2);
  });

  it('keeps profiles apart', async () => {
    await addLedgerEntries(
      [entry('level-clear:w01-l01', 10, 'p1'), entry('level-clear:w01-l01', 10, 'p2')],
      NOW,
    );
    expect(await listLedger('p1')).toHaveLength(1);
    expect(await getBalance('p2')).toBe(10);
  });

  it('spends only when the balance covers the price, atomically', async () => {
    await addLedgerEntries([entry('starter', 30)], NOW);
    const hint = (id: string, price: number): LedgerRow => ({
      ...entry(id, -price),
      reason: 'hint-2',
    });
    expect(await spend(hint('hint-2:w01-l01:a', 15), NOW)).toEqual({
      ok: true,
      entry: hint('hint-2:w01-l01:a', 15),
    });
    // Two quick taps: the second purchase sees the first one inside its own transaction.
    const [first, second] = await Promise.all([
      spend(hint('hint-2:w01-l01:b', 10), NOW),
      spend(hint('hint-2:w01-l01:c', 10), NOW),
    ]);
    expect(first).toMatchObject({ ok: true });
    expect(second).toEqual({ ok: false, missing: 5 });
    expect(await getBalance('p1')).toBe(5);
    expect(await spend(hint('hint-2:w01-l01:a', 15), NOW)).toEqual({ ok: true, entry: null });
    await expect(spend(entry('level-clear:x', 10), NOW)).rejects.toThrow();
  });
});
