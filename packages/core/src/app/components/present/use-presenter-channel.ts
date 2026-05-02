import { useEffect, useMemo, useRef, useState } from 'react';

export type PresenterState = {
  index: number;
  pageCount: number;
  blackout: 'black' | 'white' | null;
  startedAt: number; // epoch ms when present mode began
};

export type PresenterCommand =
  | { type: 'state'; state: PresenterState }
  | { type: 'goto'; index: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'request-state' }
  | { type: 'restart-timer' }
  | { type: 'toggle-blackout'; mode: 'black' | 'white' };

type Handler = (msg: PresenterCommand) => void;

const SUPPORTED = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';

/**
 * BroadcastChannel wrapper used by both the projection window (Player) and
 * the Presenter View. The channel is keyed by slideId so multiple decks
 * open in different tabs do not cross-talk. Falls back to no-op when the
 * API is missing (older browsers, SSR).
 *
 * The channel is owned by the effect (not useMemo) so React 18 StrictMode's
 * double-invoke creates a fresh channel on the second mount instead of
 * leaving a closed one behind that throws on the next `send()`.
 */
export function usePresenterChannel(slideId: string, onMessage?: Handler) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!SUPPORTED) return;
    const channel = new BroadcastChannel(`open-slide:presenter:${slideId}`);
    channelRef.current = channel;
    setAvailable(true);
    const handler = (e: MessageEvent<PresenterCommand>) => {
      onMessageRef.current?.(e.data);
    };
    channel.addEventListener('message', handler);
    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
      setAvailable(false);
    };
  }, [slideId]);

  return useMemo(
    () => ({
      send(msg: PresenterCommand) {
        try {
          channelRef.current?.postMessage(msg);
        } catch {
          // Channel may have been closed between the availability check
          // and the send (e.g. StrictMode unmount mid-flush). Treat as no-op.
        }
      },
      available,
    }),
    [available],
  );
}
