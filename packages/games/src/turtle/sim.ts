import type { GameKindApi, Primitive, SimContext } from '@codequest/engine';
import {
  targetOfLevelConfig,
  TURTLE_ANGLES,
  TURTLE_FORWARD_MAX,
  TURTLE_FORWARD_MIN,
} from './config';
import type { TurtleEvent } from './events';
import { HEADING_DEGREES, normalizeHeading, onPaper, segmentKey, step } from './lattice';
import type { TurtleState } from './state';

type TurtleContext = SimContext<TurtleState, TurtleEvent>;

function stepCount(value: Primitive): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < TURTLE_FORWARD_MIN || n > TURTLE_FORWARD_MAX) {
    throw new Error(
      `forward: steps must be ${String(TURTLE_FORWARD_MIN)}–${String(TURTLE_FORWARD_MAX)}, got ${String(value)}`,
    );
  }
  return n;
}

function angle(value: Primitive): number {
  const deg = TURTLE_ANGLES.find((candidate) => candidate === Number(value));
  if (deg === undefined) throw new Error(`turn: unknown angle ${String(value)}`);
  return deg;
}

/**
 * Sandbox API of the turtle (ADR-0024 §3–4). `forward` walks unit steps; before each one it
 * checks the paper (OFF_PAPER), then, with the pen down and a target, the segment
 * (EXTRA_LINE): a stray line stops the run at once, Măng staying where the line starts.
 */
export function createTurtleApi(ctx: TurtleContext): GameKindApi {
  return {
    forward: (n, blockId) => {
      const id = String(blockId);
      const steps = stepCount(n);
      const state = ctx.state;
      const target = targetOfLevelConfig(ctx.level.config);
      for (let index = 0; index < steps; index++) {
        const from = state.pos;
        const to = step(from, state.heading);
        if (!onPaper(to, state.size)) {
          state.crashAt = from;
          ctx.emit({ type: 'offPaper', from, to }, id);
          ctx.stop('crash', 'OFF_PAPER');
        }
        if (state.penDown) {
          const key = segmentKey(from, to);
          if (target !== null && !target.has(key)) {
            state.crashAt = from;
            ctx.emit({ type: 'extraLine', from, to }, id);
            ctx.stop('crash', 'EXTRA_LINE');
          }
          state.drawn.add(key);
          ctx.emit({ type: 'line', from, to }, id);
        } else {
          ctx.emit({ type: 'move', from, to }, id);
        }
        state.pos = to;
      }
    },
    turn: (side, deg, blockId) => {
      if (side !== 'LEFT' && side !== 'RIGHT') {
        throw new Error(`turn: unknown side ${String(side)}`);
      }
      const degrees = angle(deg);
      const from = ctx.state.heading;
      const to = normalizeHeading(from + (side === 'LEFT' ? 1 : -1) * (degrees / HEADING_DEGREES));
      ctx.state.heading = to;
      ctx.emit({ type: 'turn', from, to, side, deg: degrees }, String(blockId));
    },
    pen: (down, blockId) => {
      if (typeof down !== 'boolean')
        throw new Error(`pen: expected a boolean, got ${String(down)}`);
      ctx.state.penDown = down;
      ctx.emit({ type: 'pen', down }, String(blockId));
    },
  };
}
