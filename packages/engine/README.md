# @codequest/engine (headless)

SDK kiểu game + biên dịch + sandbox + event log + hint engine.

**Đọc trước:** `docs/architecture/runtime-engine.md`, `game-kind-sdk.md`, `hint-engine.md`.

```
src/
├─ sdk/        GameKindDefinition, BlockSpec, SimContext, GameEvent, HighlightEvent, RunOutcome
├─ blocks/     cq_start, cq_repeat (khối chung) + registerBlockSpecs()
├─ run/        analyzeWorkspace, compileProgram, runLevel, StopSignal, editDistance
├─ hints/      matches, selectHint, globalRules
├─ rng/        mulberry32, fnv1a
├─ types/      js-interpreter.d.ts
└─ index.ts    export công khai duy nhất
```
**Cấm:** DOM, React, PixiJS, import `@codequest/games`. **Bắt buộc:** tất định, coverage ≥ 90%.
