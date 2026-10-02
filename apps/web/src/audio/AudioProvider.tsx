import { type ReactNode, useEffect } from 'react';
import { useCurrentProfile } from '../features/profiles';
import { audio } from './audio';
import { SFX, type SfxName } from './sfxCatalog';
import { DEFAULT_VOLUMES } from './volume';

const isSfxName = (name: string): name is SfxName => Object.hasOwn(SFX, name);

/**
 * Connects the AudioManager to the app: the signed-in profile's volumes (applied live), the
 * first user gesture (autoplay policy), tab visibility, and a click sound for every ui/Button
 * (`data-sfx="<name>"` picks another effect, e.g. `data-sfx="run"` on ▶ Chạy; `data-sfx="none"`
 * silences one button; disabled and `aria-disabled="true"` buttons stay silent).
 * Mount once, inside <CurrentProfileProvider>.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const { profile } = useCurrentProfile();
  const settings = profile?.settings;
  const signedOut = profile === null;
  const music = settings?.musicVolume;
  const sfx = settings?.sfxVolume;
  const voice = settings?.voiceVolume;

  useEffect(() => {
    if (music === undefined || sfx === undefined || voice === undefined) return;
    audio.setVolumes({ music, sfx, voice });
  }, [music, sfx, voice]);

  // Nobody signed in (profile pick, sign-out): back to the defaults, not the last child's.
  useEffect(() => {
    if (signedOut) audio.setVolumes(DEFAULT_VOLUMES);
  }, [signedOut]);

  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);

    const onVisibility = () => {
      audio.setHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ui/Button renders data-variant: one delegated listener instead of a prop on every button.
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>('button[data-variant]');
      if (!button || button.getAttribute('aria-disabled') === 'true') return;
      const name = button.dataset.sfx ?? 'click';
      if (name === 'none') return;
      if (isSfxName(name)) audio.playSfx(name);
      else if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console -- dev-only hint for a typo in data-sfx
        console.warn(`[audio] unknown data-sfx "${name}"`);
      }
    };
    document.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return children;
}
