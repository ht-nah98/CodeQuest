// js-interpreter only reaches `require('vm')` for REGEXP_MODE 2 without a Worker; the engine
// uses REGEXP_MODE 1, so the browser bundle gets an empty module instead of Vite's warning stub.
export default {};
