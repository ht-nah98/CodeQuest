import { useCallback, useEffect, useRef, useState } from 'react';
import type { Level } from '@codequest/content-schema';
import { type ParSearchReply, type ParSearchRequest, searchKey } from './parSearch';

/** State of the par search: idle, running (cancellable), or the last reply (`searchKey`). */
export type ParSearchState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; reply: ParSearchReply; levelKey: string }
  | { status: 'failed' };

/**
 * Runs `searchPar` in a fresh Web Worker per search so the editor never freezes. `cancel`
 * terminates the worker (a synchronous search cannot read messages); unmounting does too.
 */
export function useParSearch(): {
  state: ParSearchState;
  start: (level: Level) => void;
  cancel: () => void;
} {
  const [state, setState] = useState<ParSearchState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const start = useCallback(
    (level: Level) => {
      stop();
      const worker = new Worker(new URL('./parSearch.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      const levelKey = searchKey(level);
      worker.addEventListener('message', (event: MessageEvent<ParSearchReply>) => {
        if (workerRef.current !== worker) return;
        stop();
        setState({ status: 'done', reply: event.data, levelKey });
      });
      worker.addEventListener('error', () => {
        if (workerRef.current !== worker) return;
        stop();
        setState({ status: 'failed' });
      });
      setState({ status: 'running' });
      const request: ParSearchRequest = { level };
      worker.postMessage(request);
    },
    [stop],
  );

  const cancel = useCallback(() => {
    stop();
    setState({ status: 'idle' });
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { state, start, cancel };
}
