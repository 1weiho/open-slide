/**
 * Unit tests for the shared capture-freeze helper. These pin the contract both
 * image exporters depend on: after freezing, no element carries an animation
 * that a capture clone could replay from its invisible first frame.
 *
 * @agents-index Vitest tests for capture-freeze.ts (animation removal, state pinning, scope).
 */

// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { freezeForCapture } from './capture-freeze.ts';

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('data-freeze-test', '');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-freeze-test]'))) el.remove();
});

describe('freezeForCapture', () => {
  it('strips animations that would replay from their 0% frame in a clone', () => {
    const host = mount('<p style="animation: fadeUp 1s ease both">text</p>');
    const el = host.querySelector('p') as HTMLElement;

    freezeForCapture(host);

    expect(el.style.getPropertyValue('animation')).toBe('none');
    expect(el.style.getPropertyPriority('animation')).toBe('important');
  });

  it('disables transitions so a re-entering clone does not animate', () => {
    const host = mount('<p style="transition: opacity 300ms">text</p>');
    const el = host.querySelector('p') as HTMLElement;

    freezeForCapture(host);

    expect(el.style.getPropertyValue('transition')).toBe('none');
    expect(el.style.getPropertyPriority('transition')).toBe('important');
  });

  it('pins the settled visual state with !important so the clone keeps it', () => {
    const host = mount('<p style="opacity: 1">text</p>');
    const el = host.querySelector('p') as HTMLElement;

    freezeForCapture(host);

    expect(el.style.getPropertyValue('opacity')).toBe('1');
    expect(el.style.getPropertyPriority('opacity')).toBe('important');
  });

  it('freezes the whole subtree, not just direct children', () => {
    const host = mount(
      '<div><section><span style="animation: fade 1s both">deep</span></section></div>',
    );
    const el = host.querySelector('span') as HTMLElement;

    freezeForCapture(host);

    expect(el.style.getPropertyValue('animation')).toBe('none');
  });

  it('leaves elements outside the frozen root untouched', () => {
    const host = mount('<p style="animation: fadeUp 1s both">inside</p>');
    const outside = mount('<p style="animation: fadeUp 1s both">outside</p>');

    freezeForCapture(host);

    expect(
      (outside.querySelector('p') as HTMLElement).style.getPropertyValue('animation'),
    ).not.toBe('none');
  });
});
