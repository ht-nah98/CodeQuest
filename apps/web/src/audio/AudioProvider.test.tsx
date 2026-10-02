import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioProvider } from './AudioProvider';
import { DEFAULT_VOLUMES } from './volume';

const fake = vi.hoisted(() => ({
  profile: null as null | { settings: Record<string, number | boolean> },
  audio: {
    unlock: vi.fn(),
    setVolumes: vi.fn(),
    setHidden: vi.fn(),
    playSfx: vi.fn(),
  },
}));

vi.mock('./audio', () => ({ audio: fake.audio }));
vi.mock('../features/profiles', () => ({
  useCurrentProfile: () => ({ profile: fake.profile }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  fake.profile = null;
});
afterEach(cleanup);

function renderButtons() {
  return render(
    <AudioProvider>
      <button type="button" data-variant="plain">
        plain
      </button>
      <button type="button" data-variant="go" data-sfx="run">
        run
      </button>
      <button type="button" data-variant="plain" data-sfx="none">
        quiet
      </button>
      <button type="button" data-variant="plain" aria-disabled="true">
        off
      </button>
      <button type="button">not a ui/Button</button>
    </AudioProvider>,
  );
}

describe('AudioProvider', () => {
  it('unlocks on the first gesture only, then removes its listeners', () => {
    renderButtons();
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.pointerDown(window);
    fireEvent.keyDown(window, { key: 'b' });
    expect(fake.audio.unlock).toHaveBeenCalledTimes(1);
  });

  it('follows tab visibility', () => {
    renderButtons();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fake.audio.setHidden).toHaveBeenLastCalledWith(true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fake.audio.setHidden).toHaveBeenLastCalledWith(false);
  });

  it('clicks ui/Buttons: data-sfx picks the effect, none / aria-disabled stay silent', () => {
    const { getByText } = renderButtons();
    for (const label of ['plain', 'run', 'quiet', 'off', 'not a ui/Button']) {
      fireEvent.click(getByText(label));
    }
    expect(fake.audio.playSfx.mock.calls).toEqual([['click'], ['run']]);
  });

  it('applies the profile volumes, and the defaults when nobody is signed in', () => {
    fake.profile = {
      settings: { musicVolume: 0.1, sfxVolume: 0.2, voiceVolume: 0.3, reducedMotion: false },
    };
    const { rerender } = renderButtons();
    expect(fake.audio.setVolumes).toHaveBeenLastCalledWith({ music: 0.1, sfx: 0.2, voice: 0.3 });
    fake.profile = null;
    rerender(<AudioProvider>{null}</AudioProvider>);
    expect(fake.audio.setVolumes).toHaveBeenLastCalledWith(DEFAULT_VOLUMES);
  });

  it('removes every listener on unmount', () => {
    const { unmount } = renderButtons();
    unmount();
    fireEvent.pointerDown(window);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fake.audio.unlock).not.toHaveBeenCalled();
    expect(fake.audio.setHidden).not.toHaveBeenCalled();
  });
});
