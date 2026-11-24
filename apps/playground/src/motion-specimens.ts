import { localized, moduleCopy } from './playground-content';
import * as foundations from './previews/foundations';
import { motionPlaygroundCopy } from './previews/motion-playground-copy';

export const motionSpecimens = [
  {
    id: 'foundation-motion',
    preview: foundations.motion,
    moduleId: 'motion',
    label: localized('Motion tokens', '动效令牌'),
    apiNames: [],
    tags: ['foundation', 'motion', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-presence',
    preview: foundations.motionPresence,
    moduleId: 'motion',
    label: moduleCopy.motion.presence.label,
    apiNames: ['UiPresence'],
    tags: ['foundation', 'motion', 'presence', 'transition', 'stagger', 'view-transition'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-width',
    preview: foundations.motionWidth,
    moduleId: 'motion',
    label: moduleCopy.motion.width.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'layout', 'width', 'resize', 'language'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-playground',
    preview: foundations.motionPlayground,
    moduleId: 'motion',
    label: motionPlaygroundCopy.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'theme', 'reveal', 'crossfade', 'locale', 'size'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-page',
    preview: foundations.motionPage,
    moduleId: 'motion',
    label: moduleCopy.motion.page.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'dissolve', 'particle', 'webgl', 'view-transition'],
    kind: 'foundation',
  },
] as const;
