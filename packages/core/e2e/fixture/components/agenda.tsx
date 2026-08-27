import { Children, isValidElement, type ReactNode } from 'react';

export function Agenda({ children }: { children: ReactNode }) {
  return (
    <ul>
      {Children.toArray(children).map((child) => (
        <li key={isValidElement(child) ? child.key : undefined}>{child}</li>
      ))}
    </ul>
  );
}
