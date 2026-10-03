import { beforeEach, describe, expect, it } from 'vitest';
import { isGateAnswer, isGateOpen, makeChallenge, rememberGateOpen } from './adultGate';

describe('adult gate', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('asks a two-digit times one-digit product within its bounds', () => {
    expect(makeChallenge(() => 0)).toEqual({ a: 12, b: 3 });
    expect(makeChallenge(() => 0.999)).toEqual({ a: 29, b: 9 });
  });

  it('accepts only the exact product, ignoring spaces around it', () => {
    const challenge = { a: 17, b: 6 };
    expect(isGateAnswer(challenge, '102')).toBe(true);
    expect(isGateAnswer(challenge, ' 102 ')).toBe(true);
    expect(isGateAnswer(challenge, '101')).toBe(false);
    expect(isGateAnswer(challenge, '102.0')).toBe(false);
    expect(isGateAnswer(challenge, '')).toBe(false);
  });

  it('stays open for the tab once solved', () => {
    expect(isGateOpen()).toBe(false);
    rememberGateOpen();
    expect(isGateOpen()).toBe(true);
  });
});
