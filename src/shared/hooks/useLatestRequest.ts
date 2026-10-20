import { useEffect, useMemo, useRef } from 'react';

export interface RequestTicket {
  id: number;
  signal: AbortSignal;
}

/** One active read request per scope; cancellation also invalidates late responses. */
export default function useLatestRequest() {
  const state = useRef({ sequence: 0, controller: null as AbortController | null });
  const scope = useMemo(() => ({
    cancel() {
      state.current.sequence += 1;
      state.current.controller?.abort();
      state.current.controller = null;
    },
    start(): RequestTicket {
      state.current.controller?.abort();
      const controller = new AbortController();
      state.current.controller = controller;
      return { id: ++state.current.sequence, signal: controller.signal };
    },
    isCurrent(ticket: RequestTicket): boolean {
      return ticket.id === state.current.sequence && !ticket.signal.aborted;
    },
  }), []);
  useEffect(() => () => scope.cancel(), [scope]);
  return scope;
}
