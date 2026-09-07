import { useEffect, useState } from 'react';

export function useAgentSocketConnected() {
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    hot.on('vite:ws:connect', onConnect);
    hot.on('vite:ws:disconnect', onDisconnect);
    return () => {
      hot.off('vite:ws:connect', onConnect);
      hot.off('vite:ws:disconnect', onDisconnect);
    };
  }, []);
  return connected;
}
