import { expect, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// Coach bug 16/10/2026 (coach question G13): a program that loops for ever round a ring of
// w05-boss "Đón Gà con" used to replay only its first 3 s, so Măng got dizzy half way along the
// ring, which looked like a bug. The replay of a timed-out run now shows one full lap first
// (stages/replay.ts, timeoutReplayEvents).

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  moves: string[];
  reasonCode?: string | null;
}
type HookWindow = Window & { __cqPlay: PlayHook };

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/timeout-lap';

/** lặp đến khi đã tới đích { nếu có đường phía trước thì tiến, nếu không thì rẽ phải } */
const RING = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        x: 40,
        y: 40,
        next: {
          block: {
            type: 'cq_repeat_until',
            id: 'until',
            inputs: {
              COND: { block: { type: 'maze_at_goal', id: 'goal' } },
              DO: {
                block: {
                  type: 'cq_if_else',
                  id: 'if',
                  inputs: {
                    COND: { block: { type: 'maze_is_path', id: 'ask', fields: { DIR: 'AHEAD' } } },
                    DO: { block: { type: 'maze_forward', id: 'fwd' } },
                    ELSE: { block: { type: 'maze_turn_right', id: 'right' } },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

test('w05-boss: a program going round the ring replays one full lap before Măng gets dizzy', async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  await signInTestProfile(page);
  await page.goto('/play/w05-boss');
  const stage = page.getByTestId('play-stage');
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
  await page.evaluate((json) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(json, workspace);
  }, RING);
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await page.getByTestId('play-run').click();
  await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 120_000 });
  const { moves, reasonCode } = await page.evaluate(() => {
    const hook = (window as unknown as HookWindow).__cqPlay;
    return { moves: hook.moves, reasonCode: hook.reasonCode };
  });
  expect(reasonCode).toBe('TIMEOUT');
  // Along row 1 to the corner of column 7, down to row 3, back along row 3 to column 4, and up
  // column 4 to row 1 again: one full lap, all before the run ends (dizzy).
  const corner = moves.indexOf('1,7');
  expect(corner).toBeGreaterThan(-1);
  const down = moves.indexOf('3,7', corner);
  expect(down).toBeGreaterThan(corner);
  const back = moves.indexOf('3,4', down);
  expect(back).toBeGreaterThan(down);
  expect(moves.indexOf('1,4', back)).toBeGreaterThan(back);
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-dizzy.png` });
});
