import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
