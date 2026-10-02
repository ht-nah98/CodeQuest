import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PROVIDERS } from './index';

const line = (id: string) => ({ id, text: 'Chào con', source: 'test' });
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('providers', () => {
  it('none makes no audio', async () => {
    expect(await PROVIDERS.none?.({}).synthesize(line('ui.play.ready'))).toBeNull();
  });

  it('files reads <dir>/<id>.mp3 and skips missing ones', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cq-voice-'));
    dirs.push(dir);
    writeFileSync(join(dir, 'ui.play.ready.mp3'), new Uint8Array([1, 2, 3]));
    const provider = PROVIDERS.files?.({ from: dir });
    expect(await provider?.synthesize(line('ui.play.ready'))).toEqual(new Uint8Array([1, 2, 3]));
    expect(await provider?.synthesize(line('ui.play.win'))).toBeNull();
  });

  it('files needs --from', () => {
    expect(() => PROVIDERS.files?.({})).toThrow(/--from/);
  });
});
