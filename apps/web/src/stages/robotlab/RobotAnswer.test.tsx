import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveRobotlabRules, robotlabLevelConfigSchema } from '@codequest/games';
import { AnswerPicture } from '../AnswerPicture';
import { arrivalDir, bumpDir, parseRobotKey } from './answer';

afterEach(cleanup);

const SHARED = {
  timeLimit: 120,
  costs: { forward: 2, turn: 1, grab: 2, release: 2 },
  points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
};
const written = robotlabLevelConfigSchema.parse({
  map: ['#.Z.#', 'L....', '#r#y#'],
  startDir: 'E',
  blocks: [
    { kind: 'pollution', color: 'RED', at: [1, 3] },
    { kind: 'neutralizer', color: 'YELLOW', at: [0, 1] },
    { kind: 'fence', at: [0, 3] },
  ],
  goal: { type: 'missions', mustReturn: true },
});
const config = resolveRobotlabRules(written, SHARED);

const draw = (answerKey: string, cfg: unknown = config) =>
  render(<AnswerPicture kind="robotlab" config={cfg} answerKey={answerKey} />).container;

describe('parseRobotKey', () => {
  it('reads every robotlab predictAnswer form', () => {
    expect(parseRobotKey('win')).toMatchObject({ outcome: 'win', cell: null });
    expect(parseRobotKey('timeout')).toMatchObject({ outcome: 'timeout', cell: null });
    expect(parseRobotKey('stop@1,0')).toMatchObject({ outcome: 'stop', cell: [1, 0] });
    expect(parseRobotKey('outOfTime@1,3')).toMatchObject({ outcome: 'outOfTime', cell: [1, 3] });
    expect(parseRobotKey('crash:HIT_BLOCK@1,2')).toMatchObject({
      outcome: 'crash',
      reason: 'HIT_BLOCK',
      cell: [1, 2],
    });
    expect(parseRobotKey('score:160')).toMatchObject({ outcome: 'score', points: 160 });
  });

  it('rejects other strings', () => {
    for (const key of ['stop', 'score:', 'crash@1,2', 'missed@1,2', 'stop@4', 'score:-1']) {
      expect(parseRobotKey(key)).toBeNull();
    }
  });
});

describe('Bíp’s heading in a picture', () => {
  it('faces the way it came along the line, startDir on the start', () => {
    expect(arrivalDir(config, [1, 0])).toBe('E');
    expect(arrivalDir(config, [1, 3])).toBe('E');
    expect(arrivalDir(config, [0, 1])).toBe('N');
  });

  it('bumps towards a block (HIT_BLOCK) or off the line (OFF_LINE); grip errors have none', () => {
    expect(bumpDir(config, [1, 2], 'HIT_BLOCK')).toBe('E');
    expect(bumpDir(config, [1, 4], 'OFF_LINE')).toBe('E');
    expect(bumpDir(config, [1, 0], 'WRONG_PLACE')).toBeNull();
  });
});

describe('AnswerPicture robotlab', () => {
  it('draws the mat: buildings, zone, stations, lab and the three blocks', () => {
    const svg = draw('stop@1,0');
    expect(svg.querySelectorAll('[data-tile="zone"]')).toHaveLength(1);
    expect(svg.querySelectorAll('[data-tile="station"]')).toHaveLength(2);
    expect(svg.querySelectorAll('[data-tile="lab"]')).toHaveLength(1);
    expect(
      [...svg.querySelectorAll('[data-block]')].map((b) => b.getAttribute('data-block')),
    ).toEqual(['pollution', 'neutralizer', 'fence']);
  });

  it('stop: Bíp on the framed crossing', () => {
    const svg = draw('stop@1,0');
    expect(svg.querySelector('[data-answer-cell="1,0"] [data-bip="1,0"]')).not.toBeNull();
    expect(svg.querySelectorAll('[data-mark="spot"]')).toHaveLength(1);
  });

  it('crash: a burst on the side Bíp bumped into', () => {
    const svg = draw('crash:HIT_BLOCK@1,2');
    expect(
      svg.querySelector('[data-answer-cell="1,2"] [data-bump="E"] [data-mark="crash"]'),
    ).not.toBeNull();
    expect(svg.querySelector('[data-bip="1,2"]')?.getAttribute('data-dir')).toBe('E');
  });

  it('outOfTime: an alarm clock over Bíp', () => {
    const svg = draw('outOfTime@1,3');
    expect(svg.querySelector('[data-answer-cell="1,3"] [data-mark="out-of-time"]')).not.toBeNull();
  });

  it('win: Bíp home in the lab (mustReturn) with a star; timeout: dazed on the start', () => {
    expect(draw('win').querySelector('[data-answer-cell="1,0"] [data-mark="win"]')).not.toBeNull();
    expect(draw('timeout').querySelector('[data-mark="dizzy"]')).not.toBeNull();
  });

  it('score: a plate with the points, no Bíp (the key does not say where)', () => {
    const scoreConfig = resolveRobotlabRules(
      { ...written, goal: { type: 'score', target: 200 } },
      SHARED,
    );
    const svg = draw('score:160', scoreConfig);
    expect(svg.querySelector('[data-mark="score"]')?.textContent).toBe('160 điểm');
    expect(svg.querySelector('[data-bip]')).toBeNull();
  });

  it('draws nothing for an unresolved config (shared rules not merged) or a bad key', () => {
    expect(draw('win', written).innerHTML).toBe('');
    expect(draw('stop@4').innerHTML).toBe('');
    expect(draw('stop@0,0').querySelector('[data-answer-cell]')).toBeNull();
  });
});
