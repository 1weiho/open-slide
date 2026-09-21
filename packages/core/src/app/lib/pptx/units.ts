import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../sdk';

export const EMU_PER_PX = 6350;
export const SLIDE_EMU_W = CANVAS_WIDTH * EMU_PER_PX;
export const SLIDE_EMU_H = CANVAS_HEIGHT * EMU_PER_PX;

export function px(value: number): number {
  return Math.round(value * EMU_PER_PX);
}

// The 1920px canvas spans 13.333in, so one canvas pixel is exactly half a point.
export function pxToHundredthsPt(value: number): number {
  return Math.round(value * 50);
}

export function degrees(value: number): number {
  return Math.round((((value % 360) + 360) % 360) * 60000);
}

export function percent(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100000);
}
