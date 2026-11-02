import { expect, test } from 'bun:test';
import { measureColourRetention, measureDominantHighlight } from './glass-colour-metrics';

test('does not confuse an added blue tint with a brighter orange backdrop', () => {
  const result = measureDominantHighlight([200, 100, 40], [200, 100, 80]);
  expect(Math.max(...result.lift)).toBe(40);
  expect(result.dominantChannel).toBe('red');
  expect(result.dominantLift).toBe(0);
  expect(result.normalizedLift).toBe(0);
});

test('reports brightness in the background colour with available headroom', () => {
  const orange = measureDominantHighlight([200, 100, 40], [211, 105, 42]);
  const blue = measureDominantHighlight([30, 70, 180], [32, 75, 195]);
  expect(orange.dominantChannel).toBe('red');
  expect(orange.normalizedLift).toBeCloseTo(0.2);
  expect(blue.dominantChannel).toBe('blue');
  expect(blue.normalizedLift).toBeCloseTo(0.2);
});

test('uses the actual source hue when the glass body changes the dominant channel', () => {
  const orange = measureDominantHighlight([205, 210, 220], [210, 216, 235], [176, 96, 32]);
  expect(orange.dominantChannel).toBe('red');
  expect(orange.dominantLift).toBe(5);
  expect(orange.normalizedLift).toBeCloseTo(0.1);
});

test('does not assign a normalized hue response to black or a clipped peak', () => {
  expect(measureDominantHighlight([0, 0, 0], [20, 30, 40]).normalizedLift).toBeNull();
  expect(measureDominantHighlight([255, 80, 20], [255, 90, 30]).normalizedLift).toBeNull();
});

test('detects a pale blue edge that has been washed toward white', () => {
  const washed = measureColourRetention([221, 236, 250], [237, 245, 252]);
  const coloured = measureColourRetention([221, 236, 250], [227, 243, 255]);
  expect(washed.saturationRetention).toBeLessThan(0.6);
  expect(coloured.saturationRetention).toBeGreaterThan(0.8);
});

test('detects a hue shift even when both colours remain saturated', () => {
  const result = measureColourRetention([206, 90, 0], [235, 144, 0]);
  expect(result.saturationRetention).toBe(1);
  expect(result.hueDifference).toBeGreaterThan(10);
  expect(measureColourRetention([128, 128, 128], [150, 150, 150]).hueDifference).toBeNull();
});
