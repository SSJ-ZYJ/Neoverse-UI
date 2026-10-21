import { expect, test } from 'bun:test';
import { resolveAnchoredPosition } from './index';

const viewport = { width: 1200, height: 800 };

test('keeps a bottom-start overlay aligned to the trigger when space is available', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 100, right: 340, bottom: 140, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 180,
      viewport,
      gap: 8,
    }),
  ).toEqual({ left: 240, top: 148, opensAbove: false });
});

test('flips auto placement above when the lower viewport cannot fit the overlay', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 700, right: 340, bottom: 740, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 220,
      viewport,
      gap: 8,
    }),
  ).toEqual({ left: 240, top: 472, opensAbove: true });
});

test('bottom-end placement aligns to the trigger end edge and clamps to the viewport', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 120, right: 1180, bottom: 160, left: 1080, width: 100, height: 40 },
      overlayWidth: 260,
      overlayHeight: 160,
      viewport,
      gap: 12,
      placement: 'bottom-end',
    }),
  ).toEqual({ left: 920, top: 172, opensAbove: false });
});

test('clamps an oversized overlay to the viewport gap instead of producing negative coordinates', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 120, right: 180, bottom: 160, left: 80, width: 100, height: 40 },
      overlayWidth: 1400,
      overlayHeight: 900,
      viewport,
      gap: 12,
    }),
  ).toEqual({ left: 12, top: 12, opensAbove: false });
});

test('keeps explicit bottom placement below even when auto placement would flip', () => {
  expect(
    resolveAnchoredPosition({
      trigger: { top: 700, right: 340, bottom: 740, left: 240, width: 100, height: 40 },
      overlayWidth: 240,
      overlayHeight: 220,
      viewport,
      gap: 8,
      placement: 'bottom-start',
    }),
  ).toEqual({ left: 240, top: 572, opensAbove: false });
});
