import type { ReactNode } from 'react';

export function Heading({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 64, fontWeight: 700 }}>{children}</div>;
}

export function Card({ children }: { children: ReactNode }) {
  return <div style={{ padding: 24, border: '1px solid #444', borderRadius: 12 }}>{children}</div>;
}
