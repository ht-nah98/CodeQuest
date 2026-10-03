// @vitest-environment node
import { type Application, Container, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameEvent } from '@codequest/engine';
import type { StageFactory } from './registry';
import { StageController, type StageControllerOptions } from './StageController';
import type { StageRenderer } from './types';

// showMap (multi-map levels, P2-12) on a hand-made application: no WebGL, no assets.

/** A renderer that puts one container on the stage, like the real ones do. */
class FakeRenderer implements StageRenderer<GameEvent> {
  destroyed = false;
  resets = 0;
  readonly root = new Container();
  constructor(
    app: Application,
    readonly config: unknown,
  ) {
    app.stage.addChild(this.root);
  }
  reset(): void {
    this.resets++;
  }
  play(): Promise<void> {
    return Promise.resolve();
  }
  estimate(): number {
    return 0;
  }
  rest(): void {}
  hold(): void {}
  resize(): void {}
  destroy(): void {
    this.destroyed = true;
  }
}

/** Builds a renderer, or adds a container and then throws for config "bad" (a half-made scene). */
const factory: StageFactory = (app, config) => {
  if (config === 'bad') {
    app.stage.addChild(new Container());
    throw new Error('config does not fit');
  }
  return new FakeRenderer(app, config);
};

type ControllerConstructor = new (
  app: Application,
  create: StageFactory,
  renderer: StageRenderer<GameEvent>,
  options: StageControllerOptions,
  container: unknown,
) => StageController;

let ticker: Ticker;
let app: Application;
let first: FakeRenderer;
let controller: StageController;

beforeEach(() => {
  // The controller watches its container; nothing resizes here.
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  ticker = new Ticker();
  ticker.autoStart = false;
  app = {
    ticker,
    stage: new Container(),
    screen: { width: 640, height: 360 },
    renderer: { resize: () => undefined },
  } as unknown as Application;
  first = new FakeRenderer(app, 'map 1');
  // The constructor is private: mount() needs WebGL and assets.
  const Controller = StageController as unknown as ControllerConstructor;
  controller = new Controller(
    app,
    factory,
    first,
    { kind: 'runner', config: 'map 1', onHighlight: () => undefined },
    {},
  );
});

afterEach(() => {
  ticker.destroy();
});

describe('StageController.showMap', () => {
  it('swaps the scene for a fresh renderer of the new map and keeps the speed', () => {
    controller.setSpeed(2);
    controller.showMap('map 2');
    expect(first.destroyed).toBe(true);
    expect(app.stage.children).toHaveLength(1);
    expect(app.stage.children).not.toContain(first.root);
    expect(ticker.speed).toBe(2);
  });

  it('keeps the current map working when the new config does not fit', () => {
    expect(() => {
      controller.showMap('bad');
    }).toThrow('config does not fit');
    expect(first.destroyed).toBe(false);
    // The half-made scene is gone; the old one is still on the stage.
    expect(app.stage.children).toEqual([first.root]);
    const before = first.resets;
    controller.reset();
    expect(first.resets).toBe(before + 1);
    controller.showMap('map 3');
    expect(first.destroyed).toBe(true);
    expect(app.stage.children).toHaveLength(1);
  });
});
