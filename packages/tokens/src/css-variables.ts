import { componentCssVariables } from './components/component-variables.js';
import { borderCssVariables } from './foundation/border.js';
import { fontCssVariables } from './foundation/font.js';
import { iconSizeCssVariables } from './foundation/icon-size.js';
import { motionCssVariables } from './foundation/motion.js';
import { radiusCssVariables } from './foundation/radius.js';
import { shadowCssVariables } from './foundation/shadow.js';
import { spaceCssVariables } from './foundation/space.js';
import { materialCssVariables } from './materials/material.js';
import { colorCssVariables } from './semantic/color.js';
import { effectsCssVariables } from './semantic/effects.js';
import { focusCssVariables } from './semantic/focus.js';
import { layoutCssVariables } from './semantic/layout.js';
import { typographyCssVariables } from './semantic/typography.js';

export const cssVariables = {
  color: colorCssVariables,
  components: componentCssVariables,
  iconSize: iconSizeCssVariables,
  space: spaceCssVariables,
  font: fontCssVariables,
  typography: typographyCssVariables,
  radius: radiusCssVariables,
  shadow: shadowCssVariables,
  border: borderCssVariables,
  focus: focusCssVariables,
  effects: effectsCssVariables,
  material: materialCssVariables,
  motion: motionCssVariables,
  layout: layoutCssVariables,
} as const;

export type CssVariables = typeof cssVariables;
