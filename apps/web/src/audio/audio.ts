import { AudioManager } from './AudioManager';
import { createHowlerBackend } from './howlerBackend';

/** The app's single audio manager (Howler is only touched after the first user gesture). */
export const audio = new AudioManager(createHowlerBackend);
