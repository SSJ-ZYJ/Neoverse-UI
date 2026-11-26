import { expect, test } from 'bun:test';
import {
  type ControlSurfacePreset,
  getSurfaceClass,
  isGlassSurface,
  type MaterialMode,
  materialSurfacePresets,
  type SurfacePreset,
} from './index.js';

test('default roles retain their Glass tier and opt into an opaque Solid recipe', () => {
  const glass: MaterialMode = 'glass';
  const solid: MaterialMode = 'solid';
  const automatic: ControlSurfacePreset = 'auto';
  expect(materialSurfacePresets.control[glass]).toBe('glass-subtle');
  expect(materialSurfacePresets.panel[glass]).toBe('glass-elevated');
  expect(materialSurfacePresets.group[glass]).toBe('glass-subtle');
  expect(materialSurfacePresets.panel[solid]).toBe('solid');
  expect(getSurfaceClass(automatic, 'panel')).toContain('material-glass-elevated');
  expect(isGlassSurface(automatic)).toBe(false);
});

test('an explicit surface does not use the automatic role default', () => {
  const explicit: SurfacePreset = 'glass-immersive';
  expect(getSurfaceClass(explicit, 'control')).toBe('material-glass-immersive');
  expect(getSurfaceClass('none', 'panel')).toBe('');
  expect(isGlassSurface(explicit)).toBe(true);
});
