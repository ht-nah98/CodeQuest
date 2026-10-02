// PIN hashing (security-privacy.md §3: "PIN 4 số chỉ là khóa cục bộ, lưu dạng hash").
// PBKDF2-SHA256 with a random per-profile salt via WebCrypto. A 4-digit PIN has only 10 000
// values, so no hash makes it secret against someone holding the database; the goal is that the
// PIN never sits in plaintext (in IndexedDB or in a backup file) and is not readable at a glance.
// PBKDF2 is the only password KDF in SubtleCrypto; the iteration count keeps one check ~tens of ms.

const ALGORITHM = 'pbkdf2-sha256';
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const PIN_PATTERN = /^\d{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Returns `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>`. */
export async function hashPin(pin: string): Promise<string> {
  if (!isValidPin(pin)) throw new Error('PIN must be exactly 4 digits');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(pin, salt, ITERATIONS);
  return [ALGORITHM, String(ITERATIONS), toBase64(salt), toBase64(hash)].join('$');
}

/** Iteration counts accepted from storage or a backup file (ours is ITERATIONS). */
export const MIN_ITERATIONS = 1_000;
export const MAX_ITERATIONS = 1_000_000;

/** Base64 of the 16-byte salt and the 32-byte hash. */
const PIN_HASH_PATTERN = /^pbkdf2-sha256\$(\d{1,7})\$[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/]{43}=$/;

/** Shape check, also used to validate backup files: a bad hash would lock the child out. */
export function isWellFormedPinHash(stored: string): boolean {
  const iterations = Number(PIN_HASH_PATTERN.exec(stored)?.[1]);
  return iterations >= MIN_ITERATIONS && iterations <= MAX_ITERATIONS;
}

/** False for a wrong PIN and for a malformed stored hash; never throws. */
export async function verifyPinHash(pin: string, stored: string): Promise<boolean> {
  if (!isValidPin(pin) || !isWellFormedPinHash(stored)) return false;
  const [, iterationsText = '', saltText = '', hashText = ''] = stored.split('$');
  try {
    const expected = fromBase64(hashText);
    const actual = await derive(pin, fromBase64(saltText), Number(iterationsText));
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
    return diff === 0;
  } catch {
    return false;
  }
}
