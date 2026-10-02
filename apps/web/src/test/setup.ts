import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when Vitest globals are on, and they are off here.
// Without this, hooks with live queries keep rendering after jsdom is torn down.
afterEach(() => {
  cleanup();
});
