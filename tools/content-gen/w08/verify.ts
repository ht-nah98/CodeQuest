// Heavy checks of World 8 (curriculum.md §6.3.1); run through ~/.cache/cq/heavy.sh:
// - R5: without spell blocks, nothing wins up to maxBlocks (build / bughunt from practice on);
// - loop check: with `lặp` and without spells, nothing wins up to par (intro levels, demos).
// Usage: npx tsx tools/content-gen/w08/verify.ts [r5|loop] [ids…]
import { DEMOS, LEVELS } from './designs';
import { r5, size, type Design } from './dsl';

const [what = 'r5', ...ids] = process.argv.slice(2);
const pick = (id: string): boolean => ids.length === 0 || ids.some((x) => id.endsWith(x));
const show = (id: string, label: string, r: ReturnType<typeof r5>): void => {
  const verdict =
    r.minBlocks === null
      ? r.complete
        ? '✔ none'
        : '⚠ budget'
      : `✘ wins at ${String(r.minBlocks)}`;
  console.log(
    `${id} ${label}: ${verdict} (searched ${String(r.searchedSize)}, ${String(r.states)} states, ${String(r.ms)} ms)`,
  );
};

{
  if (what === 'r5') {
    for (const d of LEVELS) {
      if (!pick(d.id) || d.stage === 'guided' || (d.mode !== 'build' && d.mode !== 'bughunt'))
        continue;
      if (d.maxBlocks === undefined) continue;
      show(d.id, `R5 ≤ ${String(d.maxBlocks)}`, r5(d, { maxSize: d.maxBlocks }));
    }
  } else {
    const loopTool = ['maze_forward', 'maze_turn_left', 'maze_turn_right', 'cq_repeat'];
    const intro: Design[] = LEVELS.filter((d) =>
      ['w08-l01', 'w08-l03', 'w08-l04', 'w08-l08', 'w08-l09'].includes(d.id),
    );
    const demos: Design[] = [DEMOS.cast, DEMOS.loop].map((demo) => ({
      id: `demo-${demo.id}`,
      kind: 'maze',
      mode: 'build',
      stage: 'practice',
      maps: [demo.map],
      toolbox: [],
      procedures: demo.procedures,
      solution: demo.prog,
    }));
    for (const d of [...intro, ...demos]) {
      if (!pick(d.id)) continue;
      const par = size(d.solution);
      show(
        d.id,
        `loop ≤ par ${String(par)}`,
        r5(
          { ...d, toolbox: [], maxInstances: {} },
          { maxSize: par, extraToolbox: loopTool, capped: false },
        ),
      );
    }
  }
}
