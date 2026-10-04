// Public API of @codequest/validator: per-level rules of content-model.md §5 and the
// exhaustive par / fix searches. Headless (ADR-0006): runs on Node and in the browser.

// Per-level rules 1–2, 5–6, 9–16, 19 (content:check, level editor).
export { validateLevel, ID_PATTERNS } from './validateLevel';
export type { LevelValidation, ValidateLevelOptions } from './validateLevel';
export { formatSchemaIssues } from './issue';
export type { GameKindLookup, RuleIssue } from './issue';

// Helpers the cross-file rules of content:check share.
export { toolboxTypes } from './levelRules';
export { blockTypesOf } from './workspace';
export { countWords } from './words';

// Exhaustive searches (npm run par, level editor).
export { findShortestPrograms } from './search/shortest';
export type { ShortestOptions, ShortestResult } from './search/shortest';
export { MAX_KEPT_FIXES, findFixes } from './search/fixes';
export type { FixOptions, FixResult } from './search/fixes';
export { DEFAULT_MAX_WORK, WORKER_MAX_WORK } from './search/budget';
export type { SearchOptions } from './search/budget';
export { UnsearchableLevel } from './search/sim';
export {
  formatProgram,
  programFromWorkspace,
  programSize,
  programToWorkspace,
} from './search/program';
export type { Program, Statement } from './search/program';
