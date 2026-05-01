'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  attribute?: 'class' | `data-${string}`;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

// next-themes@0.4.6 bundles @types/react@18 types; cast the provider so the
// workspace's React 19 ReactNode is accepted for children.
const Provider = NextThemesProvider as unknown as (p: Props) => ReactNode;

export function ThemeProvider(props: Props) {
  return <Provider {...props} />;
}
