import { describe, expect, it, vi } from 'vitest';
import { buildVoices, EMPTY_MANIFEST, planVoices, refuseBuild, type VoiceManifest } from './build';
import { textHash, type VoiceLine } from './lines';
import { createNoneProvider } from './providers/none';
import type { TtsProvider } from './providers';

const line = (id: string, text: string): VoiceLine => ({ id, text, source: 'test' });
const A = line('feedback.A', 'Một');
const B = line('feedback.B', 'Hai');
const C = line('ui.c', 'Một'); // same text as A

function fakeIo() {
  const files = new Map<string, Uint8Array>();
  return {
    files,
    io: {
      writeVoice: (id: string, bytes: Uint8Array) => files.set(id, bytes),
      removeVoice: (id: string) => files.delete(id),
      voiceExists: (id: string) => files.has(id),
    },
  };
}

describe('planVoices', () => {
  const manifest: VoiceManifest = {
    version: 1,
    provider: 'x',
    lines: {
      'feedback.A': { hash: textHash('Một') },
      'feedback.B': { hash: textHash('Hai cũ') },
      'old.line': { hash: 'abc' },
    },
  };

  it('splits lines into up to date, todo (missing or stale) and orphans', () => {
    const plan = planVoices([A, B, C], manifest, () => true);
    expect(plan.upToDate.map((l) => l.id)).toEqual(['feedback.A']);
    expect(plan.todo.map((l) => l.id)).toEqual(['feedback.B', 'ui.c']);
    expect(plan.orphans).toEqual(['old.line']);
  });

  it('redoes a line whose file is gone, or everything with force', () => {
    expect(planVoices([A], manifest, () => false).todo).toEqual([A]);
    expect(planVoices([A], manifest, () => true, true).todo).toEqual([A]);
  });
});

describe('buildVoices', () => {
  it('writes files, dedupes equal texts and records hashes', async () => {
    const synthesize = vi.fn((l: VoiceLine) => Promise.resolve(new TextEncoder().encode(l.text)));
    const provider: TtsProvider = { id: 'fake', synthesize };
    const { files, io } = fakeIo();
    const plan = planVoices([A, B, C], EMPTY_MANIFEST, () => false);
    const result = await buildVoices(plan, EMPTY_MANIFEST, provider, io);
    expect(synthesize).toHaveBeenCalledTimes(2);
    expect([...files.keys()].sort()).toEqual(['feedback.A', 'feedback.B', 'ui.c']);
    expect(result.manifest).toEqual({
      version: 1,
      provider: 'fake',
      lines: {
        'feedback.A': { hash: textHash('Một') },
        'feedback.B': { hash: textHash('Hai') },
        'ui.c': { hash: textHash('Một') },
      },
    });
  });

  it('with the none provider writes nothing and drops stale files', async () => {
    const manifest: VoiceManifest = {
      version: 1,
      provider: 'fake',
      lines: { 'feedback.B': { hash: textHash('Hai cũ') }, gone: { hash: 'x' } },
    };
    const { files, io } = fakeIo();
    files.set('feedback.B', new Uint8Array([1]));
    files.set('gone', new Uint8Array([1]));
    const plan = planVoices([B], manifest, (id) => files.has(id));
    const result = await buildVoices(plan, manifest, createNoneProvider(), io);
    expect(files.size).toBe(0);
    expect(result.skipped).toEqual(['feedback.B']);
    expect(result.removed).toEqual(['gone']);
    expect(result.manifest).toEqual({ version: 1, provider: 'fake', lines: {} });
  });

  it('keeps other worlds when prune is off', async () => {
    const manifest: VoiceManifest = { version: 1, provider: 'p', lines: { other: { hash: 'h' } } };
    const { files, io } = fakeIo();
    files.set('other', new Uint8Array([1]));
    const plan = planVoices([], manifest, () => true);
    const result = await buildVoices(plan, manifest, createNoneProvider(), io, false);
    expect(files.has('other')).toBe(true);
    expect(result.manifest.lines).toEqual({ other: { hash: 'h' } });
  });

  it('never deletes a file that still matches its text when the provider has no audio', async () => {
    const manifest: VoiceManifest = {
      version: 1,
      provider: 'files',
      lines: { 'feedback.A': { hash: textHash('Một') } },
    };
    const { files, io } = fakeIo();
    files.set('feedback.A', new Uint8Array([7]));
    const plan = planVoices([A], manifest, () => true, true); // --force
    const result = await buildVoices(plan, manifest, createNoneProvider(), io);
    expect(files.get('feedback.A')).toEqual(new Uint8Array([7]));
    expect(result.manifest.lines).toEqual(manifest.lines);
  });

  it('does not reuse "no audio" across ids with the same text', async () => {
    // Like the files provider: only feedback.A has a recording, ui.c (same text) has its own.
    const synthesize = vi.fn((l: VoiceLine) =>
      Promise.resolve(l.id === 'ui.c' ? new Uint8Array([3]) : null),
    );
    const { files, io } = fakeIo();
    const plan = planVoices([A, C], EMPTY_MANIFEST, () => false);
    const result = await buildVoices(plan, EMPTY_MANIFEST, { id: 'files', synthesize }, io);
    expect(synthesize).toHaveBeenCalledTimes(2);
    expect([...files.keys()]).toEqual(['ui.c']);
    expect(result.skipped).toEqual(['feedback.A']);
  });
});

describe('refuseBuild', () => {
  const full: VoiceManifest = { version: 1, provider: 'files', lines: { a: { hash: 'h' } } };
  it('refuses provider none with --force or over existing voices', () => {
    expect(refuseBuild('none', true, EMPTY_MANIFEST)).toMatch(/--force/);
    expect(refuseBuild('none', false, full)).toMatch(/already/);
    expect(refuseBuild('none', false, EMPTY_MANIFEST)).toBeNull();
    expect(refuseBuild('files', true, full)).toBeNull();
  });
});
