import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bubble } from './Bubble';

// A real AudioManager over a fake backend, with one voiced line.
vi.mock('../audio/audio', async () => {
  const { AudioManager } = await import('../audio/AudioManager');
  const { createVoiceLookup } = await import('../audio/voiceManifest');
  let id = 0;
  const sound = {
    play: () => ++id,
    unload: () => undefined,
    stop: () => undefined,
    volume: () => undefined,
    rate: () => undefined,
    fade: () => undefined,
  };
  const lookup = createVoiceLookup({
    version: 1,
    provider: 'test',
    lines: { 'ui.play.ready': { hash: 'h' }, 'ui.play.win': { hash: 'h' } },
  });
  return {
    audio: new AudioManager(
      () => ({ createSound: () => sound, setMuted: () => undefined }),
      lookup,
    ),
  };
});
const { audio } = await import('../audio/audio');

afterEach(() => {
  cleanup();
  audio.stopVoice();
});

describe('Bubble voice', () => {
  it('shows no 🔊 for a line without a voice file', () => {
    render(<Bubble text="Chào con" voiceId="ui.nope" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('plays and stops a voiced line, pressed while speaking', () => {
    render(<Bubble text="Ghép khối rồi bấm Chạy nhé!" voiceId="ui.play.ready" />);
    const button = screen.getByRole('button', { name: 'Đọc to' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(audio.speaking).toBe('ui.play.ready');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(audio.speaking).toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('stops its line when it unmounts', () => {
    const { unmount } = render(<Bubble text="x" voiceId="ui.play.ready" />);
    fireEvent.click(screen.getByRole('button'));
    act(() => {
      unmount();
    });
    expect(audio.speaking).toBeNull();
  });

  it('a custom onSpeak still wins', () => {
    const onSpeak = vi.fn();
    render(<Bubble text="x" voiceId="ui.play.ready" onSpeak={onSpeak} speaking />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onSpeak).toHaveBeenCalledOnce();
    expect(audio.speaking).toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('unmounting one bubble does not stop a line another bubble started', () => {
    const first = render(<Bubble text="a" voiceId="ui.play.ready" />);
    fireEvent.click(screen.getByRole('button'));
    render(<Bubble text="b" voiceId="ui.play.win" />);
    const [, second] = screen.getAllByRole('button');
    if (!second) throw new Error('second 🔊 missing');
    fireEvent.click(second);
    act(() => {
      first.unmount();
    });
    expect(audio.speaking).toBe('ui.play.win');
  });
});
