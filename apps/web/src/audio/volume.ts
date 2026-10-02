// Volume math for the three channels (stage-rendering.md §5, docs/architecture/audio.md).

export type Channel = 'music' | 'sfx' | 'voice';

/** Slider values from the profile settings, each 0..1. */
export type ChannelVolumes = Record<Channel, number>;

export const DEFAULT_VOLUMES: ChannelVolumes = { music: 0.8, sfx: 0.8, voice: 0.8 };

/**
 * Mix level of each channel at full slider: music sits under everything ("mặc định nhỏ",
 * art-direction.md §6), Măng's voice is the loudest.
 */
export const CHANNEL_MIX: Readonly<ChannelVolumes> = { music: 0.35, sfx: 0.8, voice: 1 };

/** Music level while Măng speaks (ducking), relative to its normal level. */
export const DUCK_FACTOR = 0.3;

/** Slider (0..1, linear) → gain. Squared, so the slider feels even to the ear. */
export function sliderToGain(slider: number): number {
  if (!Number.isFinite(slider) || slider <= 0) return 0;
  const clamped = Math.min(slider, 1);
  return clamped * clamped;
}

export interface MixState {
  volumes: ChannelVolumes;
  /** Every channel silent (user mute or the tab is hidden). */
  muted: boolean;
  /** A voice line is playing: the music is ducked. */
  ducked: boolean;
}

/** Final gain (0..1) for a channel. `itemGain` is the per-sound level from the catalog. */
export function channelGain(channel: Channel, state: MixState, itemGain = 1): number {
  if (state.muted) return 0;
  const duck = channel === 'music' && state.ducked ? DUCK_FACTOR : 1;
  const gain = sliderToGain(state.volumes[channel]) * CHANNEL_MIX[channel] * duck * itemGain;
  return Math.min(1, Math.max(0, gain));
}
