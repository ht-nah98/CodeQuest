import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVolumePreview } from './useVolumePreview';

const fake = vi.hoisted(() => {
  const music: { track: string | null } = { track: 'adventure' };
  return {
    music,
    audio: {
      setVolumes: vi.fn(),
      playSfx: vi.fn(),
      playVoice: vi.fn(),
      hasVoice: vi.fn(() => false),
      speaking: null,
      playMusic: vi.fn(),
      get currentTrack() {
        return music.track;
      },
    },
  };
});
vi.mock('../../audio/audio', () => ({ audio: fake.audio }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  fake.music.track = 'adventure';
  fake.audio.playMusic.mockImplementation((track: string | null) => {
    fake.music.track = track;
  });
});

describe('useVolumePreview', () => {
  it('applies the volume and previews effects', () => {
    const { result } = renderHook(() => useVolumePreview());
    result.current('sfx', 0.4);
    expect(fake.audio.setVolumes).toHaveBeenCalledWith({ sfx: 0.4 });
    expect(fake.audio.playSfx).toHaveBeenCalledWith('coin');
  });

  it('plays music for a moment, then restores the track that was playing', () => {
    fake.music.track = null;
    const { result } = renderHook(() => useVolumePreview());
    result.current('music', 0.5);
    expect(fake.audio.playMusic).toHaveBeenLastCalledWith('village');
    vi.advanceTimersByTime(3000);
    expect(fake.audio.playMusic).toHaveBeenLastCalledWith(null);
  });

  it('restores the music when the screen closes mid-preview', () => {
    fake.music.track = null;
    const { result, unmount } = renderHook(() => useVolumePreview());
    result.current('music', 0.5);
    unmount();
    expect(fake.audio.playMusic).toHaveBeenLastCalledWith(null);
  });
});
