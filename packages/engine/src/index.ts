// SDK: the contract every game kind implements (game-kind-sdk.md).
export type { BlockCategory, BlocklyBlockJson, BlockSpec } from './sdk/blockSpec';
export type { SimContext } from './sdk/context';
export type {
  DistributiveOmit,
  GameEvent,
  HighlightEvent,
  SenseEvent,
  VarEvent,
} from './sdk/events';
export type {
  AnyGameKindDefinition,
  GameKindApi,
  GameKindDefinition,
  Primitive,
} from './sdk/gameKind';
export type { MapOutcome, RunOutcome, RunStats } from './sdk/outcome';

// Common blocks and registration (blockly-integration.md §1).
export {
  COMMON_BLOCKS,
  COND_INPUT,
  CONDITION_BLOCK_TYPES,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT,
  CQ_REPEAT_MAX_TIMES,
  CQ_REPEAT_UNTIL,
  CQ_START,
  LOOP_BLOCK_TYPES,
} from './blocks/common';
export { registerBlockSpecs } from './blocks/registerBlockSpecs';

// Variables ("hộp", ADR-0022): blocks, the box dropdown and the pure box rules.
export {
  CQ_REPEAT_VAR,
  CQ_VAR_ADD,
  CQ_VAR_ADD_MAX,
  CQ_VAR_COMPARE,
  CQ_VAR_SET,
  VARIABLE_BLOCKS,
} from './blocks/variables';
export {
  FIELD_CQ_VAR,
  FieldCqVar,
  NO_VARIABLE,
  registerVariableField,
  setWorkspaceVariables,
  workspaceVariablesOf,
} from './blocks/variableField';
export {
  applyVarCall,
  initialVars,
  isVarCall,
  splitVarSuffix,
  VAR_ADD_FN,
  VAR_API_NAMES,
  VAR_CMP_FN,
  VAR_GET_FN,
  VAR_OPS,
  VAR_SET_FN,
  varSuffix,
} from './run/variables';
export type { VarCallResult, VarOp, VarValues } from './run/variables';

// Running a program (runtime-engine.md).
export { analyzeWorkspace } from './run/analyzeWorkspace';
export { withHeadlessWorkspace } from './run/headlessWorkspace';
export type { WorkspaceAnalysis } from './run/analyzeWorkspace';
export { compileProgram } from './run/compileProgram';
export { editDistance } from './run/editDistance';
export { blockTypeCounts, loopDepth } from './run/loopDepth';
export { normalizeIds } from './run/normalizeIds';
export { DEFAULT_MAX_ACTIONS, DEFAULT_MAX_STEPS, ENGINE_REASONS } from './run/limits';
export type { EngineReason } from './run/limits';
export { runLevel } from './run/runLevel';
export type { EngineCalls, RunLevelInput } from './run/runLevel';
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
