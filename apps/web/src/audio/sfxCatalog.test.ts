import { describe, expect, it } from 'vitest';
import rawManifest from './voiceManifest.json';
import { MUSIC_TRACKS, musicUrl, SFX_NAMES, sfxUrl } from './sfxCatalog';

// Every MP3 under public/audio, as data URLs keyed by their URL path ("/audio/sfx/click.mp3").
const files = new Map(
  Object.entries(
    import.meta.glob<string>('../../public/audio/**/*.mp3', {
      query: '?inline',
      import: 'default',
      eager: true,
    }),
  ).map(([path, dataUrl]) => [path.replace('../../public', ''), dataUrl]),
);

const bytesOf = (dataUrl: string) => atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
const appUrls = [...SFX_NAMES.map(sfxUrl), ...MUSIC_TRACKS.map(musicUrl)];

describe('audio files', () => {
  it('every effect and music track has an MP3 in public/audio', () => {
    for (const url of appUrls) {
      const dataUrl = files.get(url);
      expect(dataUrl, url).toBeDefined();
      const head = bytesOf(dataUrl ?? '');
      // MPEG frame sync or an ID3 tag.
      expect(head.charCodeAt(0) === 0xff || head.startsWith('ID3'), url).toBe(true);
    }
  });

  it('stays small (< 300 KB for effects and music)', () => {
    const total = appUrls.reduce((sum, url) => sum + bytesOf(files.get(url) ?? '').length, 0);
    expect(total).toBeLessThan(300 * 1024);
  });

  it('every voice line in the manifest has its file, and no voice file is unlisted', () => {
    const voiceFiles = [...files.keys()].filter((url) => url.startsWith('/audio/voice/'));
    const listed = Object.keys(rawManifest.lines).map((id) => `/audio/voice/${id}.mp3`);
    expect(voiceFiles.sort()).toEqual(listed.sort());
  });
});
