import { useEffect, useMemo, useRef } from 'react';

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

/**
 * BroadcastChannel wrapper used by both the projection window (Player) and
 * the Presenter View. The channel is keyed by slideId so multiple decks
 * open in different tabs do not cross-talk. Falls back to no-op when the
 * API is missing (older browsers, SSR).
 */
export function usePresenterChannel(slideId: string, onMessage?: Handler) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const channel = useMemo(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
    return new BroadcastChannel(`open-slide:presenter:${slideId}`);
  }, [slideId]);

  useEffect(() => {
    if (!channel) return;
    const handler = (e: MessageEvent<PresenterCommand>) => {
      onMessageRef.current?.(e.data);
    };
    channel.addEventListener('message', handler);
    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
    };
  }, [channel]);

  return useMemo(
    () => ({
      send(msg: PresenterCommand) {
        channel?.postMessage(msg);
      },
      available: channel !== null,
    }),
    [channel],
  );
}
