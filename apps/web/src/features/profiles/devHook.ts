import { createProfile, listProfiles } from '../../data/repos/profiles';
import { CURRENT_PROFILE_KEY } from './CurrentProfile';

// Dev builds only: lets e2e tests that are not about profiles skip the sign-in screens.

declare global {
  interface Window {
    __cqDev?: {
      /** Creates the profile (avatar panda, PIN 0000) unless it exists, signs it in for this tab. */
      signInTestProfile: (nickname?: string) => Promise<string>;
    };
  }
}

export const TEST_PIN = '0000';

export function installDevHook(): void {
  if (!import.meta.env.DEV) return;
  window.__cqDev = {
    async signInTestProfile(nickname = 'Bé Thử') {
      const existing = (await listProfiles()).find((p) => p.nickname === nickname);
      const profile =
        existing ?? (await createProfile({ nickname, avatarId: 'panda', pin: TEST_PIN }));
      sessionStorage.setItem(CURRENT_PROFILE_KEY, profile.id);
      return profile.id;
    },
  };
}
