import { type ParSearchRequest, searchPar, WORKER_TIMEOUT_MS } from './parSearch';

// Web Worker of the level editor's par search (./parSearch.ts): one request, one reply. The
// search is synchronous, so a cancel cannot arrive as a message; the page terminates the worker
// instead, and `shouldStop` ends a search that runs past the wall-clock limit.

addEventListener('message', (event: MessageEvent<ParSearchRequest>) => {
  const deadline = performance.now() + WORKER_TIMEOUT_MS;
  const reply = searchPar(event.data.level, () => performance.now() > deadline);
  postMessage(reply);
});
