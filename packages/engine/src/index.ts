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
export type { MapOutcome, RunOutcome, RunStats } from './sdk/outcome';

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

// Tier-0 hints and the tier-2 next step (hint-engine.md, blockly-integration.md §8).
export type { HintContext } from './hints/context';
export { compare, matches } from './hints/matches';
export { GLOBAL_HINT_IDS, globalRules } from './hints/globalRules';
export type { GlobalHintId, GlobalHintRule, HintLevel } from './hints/globalRules';
export { selectHint } from './hints/selectHint';
export type { HintSelection } from './hints/selectHint';
export { NEXT_STEP_BLOCK_ID, nextStep, structuralDistance } from './hints/nextStep';
export type { NextStep, NextStepOptions, StepAnchor } from './hints/nextStep';
