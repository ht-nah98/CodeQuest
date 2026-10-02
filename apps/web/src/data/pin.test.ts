// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { hashPin, isValidPin, isWellFormedPinHash, verifyPinHash } from './pin';

describe('PIN hashing', () => {
  it('uses WebCrypto from the runtime', () => {
    expect(typeof globalThis.crypto.subtle.deriveBits).toBe('function');
  });

  it('accepts exactly 4 digits', () => {
    expect(isValidPin('0420')).toBe(true);
    for (const pin of ['123', '12345', '12a4', ' 1234', '']) expect(isValidPin(pin)).toBe(false);
  });

  it('stores a salted PBKDF2 hash, never the PIN', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a).toMatch(/^pbkdf2-sha256\$100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toContain('1234');
    expect(a).not.toBe(b);
  });

  it('verifies the right PIN and rejects a wrong one', async () => {
    const stored = await hashPin('2580');
    expect(await verifyPinHash('2580', stored)).toBe(true);
    expect(await verifyPinHash('2581', stored)).toBe(false);
    expect(await verifyPinHash('258', stored)).toBe(false);
  });

  it('rejects malformed stored hashes', async () => {
    expect(await verifyPinHash('1234', '')).toBe(false);
    expect(await verifyPinHash('1234', 'sha1$1$AA==$AA==')).toBe(false);
    expect(await verifyPinHash('1234', 'pbkdf2-sha256$abc$AA==$AA==')).toBe(false);
  });

  it('only accepts well-formed hashes with 1 000–1 000 000 iterations', async () => {
    const stored = await hashPin('1234');
    const [, , salt = '', hash = ''] = stored.split('$');
    const withIterations = (n: number) => `pbkdf2-sha256$${String(n)}$${salt}$${hash}`;
    expect(isWellFormedPinHash(stored)).toBe(true);
    expect(isWellFormedPinHash(withIterations(1_000))).toBe(true);
    expect(isWellFormedPinHash(withIterations(1_000_000))).toBe(true);
    expect(isWellFormedPinHash(withIterations(999))).toBe(false);
    expect(isWellFormedPinHash(withIterations(1_000_001))).toBe(false);
    expect(isWellFormedPinHash(`${stored}x`)).toBe(false);
    expect(isWellFormedPinHash(stored.replace(salt, salt.slice(2)))).toBe(false);
    expect(await verifyPinHash('1234', withIterations(999))).toBe(false);
  });

  it('returns false instead of throwing when WebCrypto fails', async () => {
    const stored = await hashPin('1234');
    const spy = vi.spyOn(crypto.subtle, 'deriveBits').mockRejectedValueOnce(new Error('boom'));
    try {
      expect(await verifyPinHash('1234', stored)).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it('refuses to hash an invalid PIN', async () => {
    await expect(hashPin('12')).rejects.toThrow();
  });
});
