import { lazy, type ReactNode, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AudioProvider } from '../audio/AudioProvider';
import { CurrentProfileProvider, RequireProfile } from '../features/profiles';
import '../screens/shared/screens.css';
import { BreakReminder } from './BreakReminder';
import { ErrorBoundary } from './ErrorBoundary';
import { SmallScreenGate } from './SmallScreenGate';

// Routes: docs/design/screens-and-flows.md §2 (phase 1: no shop, badges, group or coach corner; phase 2 adds the level editor).
const ProfilePickScreen = lazy(() => import('../screens/profile/ProfilePickScreen'));
const NewProfileScreen = lazy(() => import('../screens/profile/NewProfileScreen'));
const RestoreScreen = lazy(() => import('../screens/settings/RestoreScreen'));
const MapScreen = lazy(() => import('../screens/map/MapScreen'));
const WorldScreen = lazy(() => import('../screens/world/WorldScreen'));
const LessonScreen = lazy(() => import('../screens/lesson/LessonScreen'));
const PlayScreen = lazy(() => import('../screens/play/PlayScreen'));
const SettingsScreen = lazy(() => import('../screens/settings/SettingsScreen'));
// Level editor (P2-07): dev builds only until the coach sign-in of P2-16 (the multiplication
// lock alone is solvable by the children, and the editor shows solutions). The coach authors
// content with `npm run dev` anyway. No child profile needed.
const EditorScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/coach/EditorScreen'))
  : null;

// Dev-only showcase pages. The DEV ternary lets Rollup drop the chunks from production builds.
const DevUiScreen = import.meta.env.DEV ? lazy(() => import('../screens/dev/DevUiScreen')) : null;
const DevBlocklyScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/dev/DevBlocklyScreen'))
  : null;
const DevStageScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/dev/DevStageScreen'))
  : null;

const signedIn = (screen: ReactNode) => <RequireProfile>{screen}</RequireProfile>;

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SmallScreenGate>
          <CurrentProfileProvider>
            <AudioProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<ProfilePickScreen />} />
                  <Route path="/profile/new" element={<NewProfileScreen />} />
                  <Route path="/restore" element={<RestoreScreen />} />
                  <Route path="/map" element={signedIn(<MapScreen />)} />
                  <Route path="/w/:worldId" element={signedIn(<WorldScreen />)} />
                  <Route path="/w/:worldId/lesson/:lessonId" element={signedIn(<LessonScreen />)} />
                  <Route path="/play/:levelId" element={signedIn(<PlayScreen />)} />
                  <Route path="/settings" element={signedIn(<SettingsScreen />)} />
                  {EditorScreen && <Route path="/coach/editor" element={<EditorScreen />} />}
                  {DevUiScreen && <Route path="/dev/ui" element={<DevUiScreen />} />}
                  {DevBlocklyScreen && <Route path="/dev/blockly" element={<DevBlocklyScreen />} />}
                  {DevStageScreen && <Route path="/dev/stage" element={<DevStageScreen />} />}
                </Routes>
              </Suspense>
              <BreakReminder />
            </AudioProvider>
          </CurrentProfileProvider>
        </SmallScreenGate>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
