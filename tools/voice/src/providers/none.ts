import type { TtsProvider } from './types';

/** The default until the coach picks a voice: produces nothing, so no line shows 🔊. */
export function createNoneProvider(): TtsProvider {
  return {
    id: 'none',
    synthesize: () => Promise.resolve(null),
  };
}
