// Runs before the app bundle (classic script in index.html). Zod 4 probes `new Function('')` when
// its first object schema is built; under the production CSP (no 'unsafe-eval') that probe is
// caught but still reported as a securitypolicyviolation. `jitless` skips the probe and the JIT.
// Set on the global config object Zod reads, because bundle chunk order decides when schemas are
// built (security-privacy.md §3).
globalThis.__zod_globalConfig = Object.assign(globalThis.__zod_globalConfig || {}, {
  jitless: true,
});
