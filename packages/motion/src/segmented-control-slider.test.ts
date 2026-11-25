import { afterEach, describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { attachSegmentedControlSlider } from './layout/segmented-control-slider.js';

const originalMutationObserver = globalThis.MutationObserver;
const windows: Window[] = [];

afterEach(() => {
  globalThis.MutationObserver = originalMutationObserver;
  while (windows.length > 0) {
    windows.pop()?.close();
  }
});

function createTrack(optionSizes: Array<{ width: number; left: number; height: number }>) {
  const win = new Window();
  windows.push(win);
  globalThis.MutationObserver = win.MutationObserver as unknown as typeof MutationObserver;
  (win as unknown as { matchMedia: () => unknown }).matchMedia = () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  const doc = win.document;
  const track = doc.createElement('span');
  track.className = 'ui-segmented-control__options';

  const sliderTrack = doc.createElement('span');
  sliderTrack.className = 'ui-segmented-control__slider-track';
  const slider = doc.createElement('span');
  slider.className = 'ui-segmented-control__slider';
  Object.defineProperty(slider, 'offsetHeight', {
    configurable: true,
    get: () => optionSizes[0]?.height ?? 32,
  });
  sliderTrack.append(slider);
  track.append(sliderTrack);

  const buttons = optionSizes.map((size, index) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
    Object.defineProperty(button, 'offsetWidth', { configurable: true, get: () => size.width });
    Object.defineProperty(button, 'offsetLeft', { configurable: true, get: () => size.left });
    track.append(button);
    return button;
  });

  doc.body.append(track);
  return {
    win,
    track: track as unknown as HTMLElement,
    slider: slider as unknown as HTMLElement,
    buttons,
  };
}

describe('attachSegmentedControlSlider', () => {
  test('marks circular options on initial measurement and cleans up on detach', async () => {
    const { win, track, slider, buttons } = createTrack([
      { width: 32, left: 0, height: 32 },
      { width: 32, left: 35, height: 32 },
    ]);

    const detach = attachSegmentedControlSlider(track);
    expect(slider.dataset.circular).toBe('true');

    buttons[0]?.dispatchEvent(
      new win.PointerEvent('pointerdown', {
        isPrimary: true,
        button: 0,
        pointerId: 1,
        bubbles: true,
      }) as unknown as Parameters<NonNullable<(typeof buttons)[0]>['dispatchEvent']>[0],
    );
    await new Promise<void>((resolve) => {
      win.requestAnimationFrame(() => resolve());
    });
    expect(slider.hasAttribute('data-pressed')).toBe(true);
    expect(slider.dataset.circular).toBe('true');

    detach();
    expect(slider.hasAttribute('data-circular')).toBe(false);
    expect(slider.hasAttribute('data-pressed')).toBe(false);
  });

  test('marks elongated capsule options as non-circular', () => {
    const { track, slider } = createTrack([
      { width: 88, left: 0, height: 32 },
      { width: 72, left: 91, height: 32 },
    ]);

    const detach = attachSegmentedControlSlider(track);
    expect(slider.dataset.circular).toBe('false');
    detach();
  });

  test('commits the destination immediately while an appearance snapshot is active', async () => {
    const { win, track, slider, buttons } = createTrack([
      { width: 32, left: 0, height: 32 },
      { width: 32, left: 35, height: 32 },
    ]);
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        win.requestAnimationFrame(() => resolve());
      });

    const detach = attachSegmentedControlSlider(track);
    expect(slider.hasAttribute('data-instant')).toBe(false);

    win.document.documentElement.setAttribute('data-neoverse-appearance-motion', 'theme-reveal');
    buttons[0]?.setAttribute('aria-checked', 'false');
    buttons[1]?.setAttribute('aria-checked', 'true');
    await nextFrame();
    await nextFrame();

    expect(slider.hasAttribute('data-instant')).toBe(true);
    expect(slider.style.getPropertyValue('--segment-active-offset')).toBe('35px');

    win.document.documentElement.removeAttribute('data-neoverse-appearance-motion');
    await nextFrame();
    await nextFrame();

    expect(slider.hasAttribute('data-instant')).toBe(false);
    detach();
  });
});
