import { describe, expect, it, vi } from 'vitest';
import { createStepRegistry } from './steps.ts';

describe('createStepRegistry', () => {
  it('reveals in registration order and retreats in reverse order', () => {
    const first = vi.fn();
    const second = vi.fn();
    const registry = createStepRegistry();
    registry.register({ initialRevealed: false, setRevealed: first });
    registry.register({ initialRevealed: false, setRevealed: second });

    expect(registry.controller.advance()).toBe(true);
    expect(first).toHaveBeenLastCalledWith(true);
    expect(registry.controller.advance()).toBe(true);
    expect(second).toHaveBeenLastCalledWith(true);
    expect(registry.controller.advance()).toBe(false);

    expect(registry.controller.retreat()).toBe(true);
    expect(second).toHaveBeenLastCalledWith(false);
    expect(registry.controller.retreat()).toBe(true);
    expect(first).toHaveBeenLastCalledWith(false);
    expect(registry.controller.retreat()).toBe(false);
  });

  it('reports aggregate state as registrations change', () => {
    const states: Array<{ revealed: number; stepCount: number }> = [];
    const registry = createStepRegistry((state) => states.push(state));
    const unregister = registry.register({ initialRevealed: true, setRevealed: vi.fn() });
    registry.register({ initialRevealed: false, setRevealed: vi.fn() });
    registry.controller.advance();
    unregister();

    expect(states).toEqual([
      { revealed: 1, stepCount: 1 },
      { revealed: 1, stepCount: 2 },
      { revealed: 2, stepCount: 2 },
      { revealed: 1, stepCount: 1 },
    ]);
  });
});
