import { ensureCoachProfile } from '../../data/repos/profiles';

// Coach review profile (dev builds only, until the real coach login of P2-16): when
// VITE_COACH_PIN (gitignored apps/web/.env.local) holds a 4-digit PIN, an "HLV" profile with
// that PIN exists on this laptop. The variable is read only inside the DEV branch, so
// production bundles never contain it (coachProfile.test.ts guards the source).

/** Longest wait for the seed before the app renders anyway (blocked IndexedDB). */
export const SEED_TIMEOUT_MS = 1500;

/** Seeds the coach profile if configured; never throws (the app must start without it). */
export async function seedCoachProfile(pin?: unknown): Promise<void> {
  if (!import.meta.env.DEV) return;
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
