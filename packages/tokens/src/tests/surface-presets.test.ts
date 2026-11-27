import { expect, test } from 'bun:test';
import { getSurfaceClass, isGlassSurface, isMaterial } from '../index.js';

test('a consumer can select any material but unknown values leave the scope unresolved', () => {
  for (const material of ['solid', 'frosted', 'glass']) expect(isMaterial(material)).toBe(true);
  for (const value of ['unknown', 'Glass', null, undefined]) expect(isMaterial(value)).toBe(false);
});

test('automatic surfaces emit only their role while explicit surfaces override paint', () => {
  expect(getSurfaceClass('auto', 'panel')).toBe('material-role-panel');
  expect(getSurfaceClass('auto', 'field')).toBe('material-role-field');
  expect(getSurfaceClass('auto', 'compactOverlay')).toBe('material-role-compact-overlay');
  expect(getSurfaceClass('frosted', 'control')).toBe('material-role-control material-frosted');
  expect(getSurfaceClass('glass-immersive', 'control')).toBe('material-glass-immersive');
  expect(getSurfaceClass('none', 'panel')).toBe('');
  expect(isGlassSurface('frosted')).toBe(false);
  expect(isGlassSurface('glass-immersive')).toBe(true);
});
