import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ErrorBoundary } from './ErrorBoundary';

const PlayScreen = lazy(() => import('../screens/play/PlayScreen'));

// Dev-only showcase pages. The DEV ternary lets Rollup drop the chunks from production builds.
const DevUiScreen = import.meta.env.DEV ? lazy(() => import('../screens/dev/DevUiScreen')) : null;
const DevBlocklyScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/dev/DevBlocklyScreen'))
  : null;
const DevStageScreen = import.meta.env.DEV
  ? lazy(() => import('../screens/dev/DevStageScreen'))
  : null;

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/play/:levelId" element={<PlayScreen />} />
            {DevUiScreen && <Route path="/dev/ui" element={<DevUiScreen />} />}
            {DevBlocklyScreen && <Route path="/dev/blockly" element={<DevBlocklyScreen />} />}
            {DevStageScreen && <Route path="/dev/stage" element={<DevStageScreen />} />}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
