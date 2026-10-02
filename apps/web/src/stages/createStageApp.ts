// Must come before any renderer is created so PixiJS runs without 'unsafe-eval' (security-privacy.md).
import 'pixi.js/unsafe-eval';
import { Application, type ApplicationOptions } from 'pixi.js';

/**
 * Creates a PixiJS application and appends its canvas to `container`.
 *
 * Renders at the device pixel ratio (`autoDensity` keeps the CSS size logical) and
 * rounds sprite positions to whole device pixels (stage-rendering.md §3).
 *
 * `app.init()` is async, so React may unmount (StrictMode does this on purpose)
 * before it resolves. When `signal` is aborted by then, the half-made app is
 * destroyed here and `null` is returned, so callers never leak a second canvas.
 */
export async function createStageApp(
  container: HTMLElement,
  signal: AbortSignal,
  options: Partial<ApplicationOptions>,
): Promise<Application | null> {
  const app = new Application();
  await app.init({
    preference: 'webgl',
    antialias: false,
    resolution: window.devicePixelRatio,
    autoDensity: true,
    roundPixels: true,
    ...options,
  });
  if (signal.aborted) {
    destroyStageApp(app);
    return null;
  }
  app.canvas.style.display = 'block';
  container.appendChild(app.canvas);
  return app;
}

/** Removes the canvas and destroys the scene graph; shared textures stay cached in `PIXI.Assets`. */
export function destroyStageApp(app: Application): void {
  app.destroy({ removeView: true }, { children: true });
}
