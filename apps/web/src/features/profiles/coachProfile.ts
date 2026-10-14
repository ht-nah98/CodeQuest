import { isWellFormedPinHash } from '../../data/pin';
import { ensureCoachProfile, ensureCoachProfileWithHash } from '../../data/repos/profiles';

// Coach review profile "HLV" (role 'coach'): every world and level is open to it.
// - Dev builds: when VITE_COACH_PIN (gitignored apps/web/.env.local) holds a 4-digit PIN, the
//   profile has that PIN. The variable is read only inside the DEV branch, so production
//   bundles never contain it (coachProfile.test.ts guards the source).
// - Production (coach request 14/10/2026, until the real coach login of P2-16): when the
//   deploy sets VITE_COACH_PIN_HASH (a data/pin.ts PBKDF2 hash, made with
//   `npm run coach-pin-hash -- <PIN>`), the profile is seeded with that hash. Neither the PIN
//   nor its hash is in the repo. A 4-digit PIN is a light lock against children, not a secret.

/** Longest wait for the seed before the app renders anyway (blocked IndexedDB). */
export const SEED_TIMEOUT_MS = 1500;

/** Seeds the coach profile if configured; never throws (the app must start without it). */
export async function seedCoachProfile(pin?: unknown): Promise<void> {
  if (!import.meta.env.DEV) {
    const hash: unknown = import.meta.env.VITE_COACH_PIN_HASH;
    if (typeof hash !== 'string' || !isWellFormedPinHash(hash)) return;
    try {
      await ensureCoachProfileWithHash(() => hash);
    } catch {
      // IndexedDB blocked or failing: the child screens report their own errors.
    }
    return;
  }
  const value: unknown = pin ?? import.meta.env.VITE_COACH_PIN;
  if (typeof value !== 'string') return;
  try {
    await ensureCoachProfile(value);
  } catch {
    // IndexedDB blocked or failing: the child screens report their own errors.
  }
}

/** Seeds, but resolves after SEED_TIMEOUT_MS at the latest so the page is never left blank. */
export async function seedCoachProfileBounded(): Promise<void> {
  await Promise.race([
    seedCoachProfile(),
    new Promise<void>((resolve) => setTimeout(resolve, SEED_TIMEOUT_MS)),
  ]);
}
