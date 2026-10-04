// Where Măng is in a maze replay, for the "Xem cả đường" view (P2-22), Pixi- and React-free so it
// is unit tested. Fed by the stage controller's hooks like the runner's strip (feed.ts).
import type { GameEvent } from '@codequest/engine';
import { type MazeCell, type MazeConfig, type MazeDir, type MazeEvent } from '@codequest/games';
import { createEventFeed, type EventFeed } from '../feed';

export interface MazePlanState {
  /** Măng's cell `[row, column]`. */
  at: MazeCell;
  dir: MazeDir;
  /** Shoots not picked up yet. */
  bamboo: readonly MazeCell[];
}

export function initialMazePlan(config: MazeConfig): MazePlanState {
  let at: MazeCell = [0, 0];
  const bamboo: MazeCell[] = [];
  config.map.forEach((row, r) => {
    Array.from(row).forEach((tile, c) => {
      if (tile === 'S') at = [r, c];
      if (tile === 'b') bamboo.push([r, c]);
    });
  });
  return { at, dir: config.startDir, bamboo };
}

/** The state after one action event; a move counts at its start, like the runner's strip. */
export function mazePlanStep(state: MazePlanState, gameEvent: GameEvent): MazePlanState {
  // The controller feeds a maze level only maze events (see the typing note in registry.ts).
  const event = gameEvent as MazeEvent;
  switch (event.type) {
    case 'move':
      return { ...state, at: event.to, dir: event.dir };
    case 'turn':
      return { ...state, dir: event.to };
    case 'collect':
      return {
        ...state,
        bamboo: state.bamboo.filter(([r, c]) => r !== event.at[0] || c !== event.at[1]),
      };
    default:
      // bump bounces back to the cell it started from; win stands on the cell already reached.
      return state;
  }
}

export type MazeFeed = EventFeed<MazePlanState>;

export function createMazeFeed(config: MazeConfig): MazeFeed {
  return createEventFeed(initialMazePlan(config), mazePlanStep);
}
