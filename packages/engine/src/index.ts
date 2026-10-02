// SDK: the contract every game kind implements (game-kind-sdk.md).
export type { BlockCategory, BlocklyBlockJson, BlockSpec } from './sdk/blockSpec';
export type { SimContext } from './sdk/context';
export type { DistributiveOmit, GameEvent, HighlightEvent } from './sdk/events';
export type {
  AnyGameKindDefinition,
  GameKindApi,
  GameKindDefinition,
  Primitive,
} from './sdk/gameKind';
export type { RunOutcome, RunStats } from './sdk/outcome';

// Common blocks and registration (blockly-integration.md §1).
export { COMMON_BLOCKS, CQ_REPEAT, CQ_REPEAT_MAX_TIMES, CQ_START } from './blocks/common';
export { registerBlockSpecs } from './blocks/registerBlockSpecs';

// Running a program (runtime-engine.md).
export { analyzeWorkspace } from './run/analyzeWorkspace';
export type { WorkspaceAnalysis } from './run/analyzeWorkspace';
export { compileProgram } from './run/compileProgram';
export { editDistance } from './run/editDistance';
export { normalizeIds } from './run/normalizeIds';
export { DEFAULT_MAX_ACTIONS, DEFAULT_MAX_STEPS, ENGINE_REASONS } from './run/limits';
export type { EngineReason } from './run/limits';
export { runLevel } from './run/runLevel';
export type { RunLevelInput } from './run/runLevel';
export { StopSignal } from './run/stopSignal';

// Deterministic randomness (runtime-engine.md §6).
export { fnv1a } from './rng/fnv1a';
export { mulberry32 } from './rng/mulberry32';
