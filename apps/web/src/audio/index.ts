// Sound effects, music and Măng's voice lines (docs/architecture/audio.md).
export { audio } from './audio';
export { AudioManager } from './AudioManager';
export type { AudioBackend, PlaySfxOptions, SoundLike, SoundOptions } from './AudioManager';
export { AudioProvider } from './AudioProvider';
export { MUSIC_TRACKS, SFX, SFX_NAMES } from './sfxCatalog';
export type { MusicTrack, SfxName } from './sfxCatalog';
export { blocklySfx, RUN_SFX, stageSfx } from './stageSfx';
export { useAudio, useMusic, useVoiceLine } from './useAudio';
export type { AudioApi } from './useAudio';
export {
  feedbackVoiceId,
  hintVoiceId,
  lessonCardVoiceId,
  levelVoiceId,
  uiVoiceId,
} from './voiceIds';
export { hasVoice } from './voiceManifest';
export type { Channel, ChannelVolumes } from './volume';
