// Adult lock in front of the coach pages (screens-and-flows.md §2): a two-digit times a
// one-digit multiplication, e.g. 17 × 6. Not a security boundary (the PIN-less laptop is the
// children's), only a speed bump; the coach's Supabase sign-in comes with phase-2.md P2-16.
// Solved once per tab (sessionStorage).

export interface GateChallenge {
  a: number;
  b: number;
}

const KEY = 'cq.coachGate';

/** A new challenge from `random` (0 ≤ x < 1): a in 12–29, b in 3–9. */
export function makeChallenge(random: () => number): GateChallenge {
  const pick = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  return { a: pick(12, 29), b: pick(3, 9) };
}

/** Whether `answer` (what was typed) is the product; spaces around it are ignored. */
export function isGateAnswer(challenge: GateChallenge, answer: string): boolean {
  const text = answer.trim();
  return /^\d+$/.test(text) && Number(text) === challenge.a * challenge.b;
}

export function isGateOpen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberGateOpen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked (private window): the gate opens for this page only.
  }
}
