import { createFilesProvider } from './files';
import { createNoneProvider } from './none';
import type { ProviderOptions, TtsProvider } from './types';

export type { ProviderOptions, TtsProvider } from './types';

/**
 * Registered providers for `--provider <id>`. To add the coach's TTS service: write
 * `providers/<service>.ts` returning a TtsProvider, then add one line here.
 */
export const PROVIDERS: Record<string, (options: ProviderOptions) => TtsProvider> = {
  none: () => createNoneProvider(),
  files: (options) => {
    if (options.from === undefined) throw new Error('--provider files needs --from <dir>');
    return createFilesProvider(options.from);
  },
};
