// Multi-map levels (phase-2.md P2-12, ADR-0016): one program, every map must be won.
import { describe, expect, it } from 'vitest';
import { runLevel } from '../index';
import { lineKind, lineLevel, program, step } from '../testing/lineKind.test';

/** Goal at 2 on the first map; the variants move the goal and add holes. */
const threeMaps = lineLevel({
  config: { length: 10, goal: 2 },
  variants: [
    { length: 10, goal: 2, holes: [5] },
    { length: 10, goal: 3 },
  ],
});

describe('runLevel on a level with variants', () => {
  it('wins only when the program wins every map; the result is the last map', () => {
    const level = lineLevel({
      config: { length: 10, goal: 2 },
      variants: [{ length: 10, goal: 2, holes: [5] }],
    });
    const outcome = runLevel({ kind: lineKind, level, workspace: program([step('a'), step('b')]) });
    expect(outcome.result).toBe('success');
    expect(outcome.reasonCode).toBeNull();
    expect(outcome.mapIndex).toBe(1);
    expect(outcome.maps?.map((map) => map.result)).toEqual(['success', 'success']);
  });

  it('loses with the reason of the first map it does not win (2 of 3 won)', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: threeMaps,
      workspace: program([step('a'), step('b')]),
    });
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL', mapIndex: 2 });
    expect(outcome.maps?.map((map) => `${map.result}:${map.reasonCode ?? ''}`)).toEqual([
      'success:',
      'success:',
      'incomplete:NOT_AT_GOAL',
    ]);
    // The top level is the deciding map's own run.
    expect(outcome.events).toEqual(outcome.maps?.[2]?.events);
    expect(outcome.stats).toEqual(outcome.maps?.[2]?.stats);
  });

  it('decides on the first lost map even when a later one is lost too', () => {
    const level = lineLevel({
      config: { length: 10, goal: 3 },
      variants: [
        { length: 10, goal: 3, holes: [1] },
        { length: 10, goal: 9 },
      ],
    });
    const outcome = runLevel({
      kind: lineKind,
      level,
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE', mapIndex: 1 });
    expect(outcome.maps?.map((map) => map.result)).toEqual(['success', 'crash', 'incomplete']);
  });

  it('keeps a separate event log per map (snapshot), the same on every run', () => {
    const input = {
      kind: lineKind,
      level: threeMaps,
      workspace: program([step('a'), step('b'), step('c'), step('d'), step('e'), step('f')]),
    };
    const outcome = runLevel(input);
    expect(outcome.maps).toMatchSnapshot();
    expect(runLevel(input)).toEqual(outcome);
  });

  it('has no maps on a level with one map', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome.result).toBe('success');
    expect('maps' in outcome).toBe(false);
    expect('mapIndex' in outcome).toBe(false);
  });

  it('reports an invalid variant config as INTERNAL_ERROR without running', () => {
    const level = lineLevel({ variants: [{ length: 'long' }] });
    const outcome = runLevel({ kind: lineKind, level, workspace: program([step('a')]) });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
    expect(outcome.debug?.message).toMatch(/^variants\[0\]: /);
    expect(outcome.maps).toBeUndefined();
  });

  it('rejects an empty program once, not per map', () => {
    const outcome = runLevel({ kind: lineKind, level: threeMaps, workspace: program([]) });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'EMPTY_PROGRAM' });
    expect(outcome.maps).toBeUndefined();
  });

  it('computes bughunt edits once, next to the per-map runs', () => {
    const level = lineLevel({
      ...threeMaps,
      mode: 'bughunt',
      initialWorkspace: program([step('a')]),
    });
    const outcome = runLevel({
      kind: lineKind,
      level,
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome.edits).toBe(2);
    expect(outcome.maps).toHaveLength(3);
  });

  it('gives the answer key of the deciding map', () => {
    const level = lineLevel({
      ...threeMaps,
      mode: 'predict',
      initialWorkspace: program([step('a'), step('b')]),
    });
    const outcome = runLevel({ kind: lineKind, level, workspace: program([]) });
    expect(outcome.answerKey).toBe('NOT_AT_GOAL@2');
  });

  it('keeps maps and names the variant when the engine breaks on a later map', () => {
    // The API breaks on maps of length 7 only (the second map here).
    const fragile: typeof lineKind = {
      ...lineKind,
      createApi: (ctx) => {
        const api = lineKind.createApi(ctx);
        return {
          ...api,
          step: (blockId) => {
            if (ctx.state.config.length === 7) throw new Error('broken map');
            return api['step']?.(blockId);
          },
        };
      },
    };
    const level = lineLevel({
      config: { length: 10, goal: 1 },
      variants: [
        { length: 7, goal: 1 },
        { length: 10, goal: 1 },
      ],
    });
    const outcome = runLevel({ kind: fragile, level, workspace: program([step('a')]) });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR', mapIndex: 1 });
    expect(outcome.debug?.message).toBe('variants[0]: broken map');
    // The run stops at the broken map: the maps after it did not run.
    expect(outcome.maps?.map((map) => map.result)).toEqual(['success', 'error']);
  });
});
