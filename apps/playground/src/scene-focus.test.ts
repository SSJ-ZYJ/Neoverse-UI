import { expect, test } from 'bun:test';
import { focusAfterRemoval } from './previews/scene-focus';

function bench(activeInside: boolean) {
  const active = { name: 'removed control' };
  let moved = 0;
  const removing = {
    contains: (node: { name: string } | null) => activeInside && node === active,
  };
  const fallback = {
    focus: () => {
      moved += 1;
    },
  };
  return { active, removing, fallback, moved: () => moved };
}

test('removing the focused control moves focus to the scene fallback once', () => {
  const { active, removing, fallback, moved } = bench(true);
  expect(focusAfterRemoval(removing, fallback, active)).toBe(true);
  expect(moved()).toBe(1);
});

test('a configuration change keeps focus when the removed control does not own it', () => {
  const { active, removing, fallback, moved } = bench(false);
  expect(focusAfterRemoval(removing, fallback, active)).toBe(false);
  expect(moved()).toBe(0);
});

test('a missing active element, removed scope, or fallback leaves focus untouched', () => {
  const { active, removing, fallback, moved } = bench(true);
  expect(focusAfterRemoval(removing, fallback, null)).toBe(false);
  expect(focusAfterRemoval(null, fallback, active)).toBe(false);
  expect(focusAfterRemoval(undefined, fallback, active)).toBe(false);
  expect(focusAfterRemoval(removing, null, active)).toBe(false);
  expect(focusAfterRemoval(removing, undefined, active)).toBe(false);
  expect(moved()).toBe(0);
});
