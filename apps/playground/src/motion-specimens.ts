import * as interactive from './lab-interactive-specimens';
import { lazyComponent } from './lazy-component';
import { localized, moduleCopy } from './playground-content';
import { motionPlaygroundCopy } from './previews/motion-playground-copy';

const MotionDisclosureModule = lazyComponent(() => import('./modules/MotionDisclosureModule.vue'));
const MotionPageModule = lazyComponent(() => import('./modules/MotionPageModule.vue'));
const MotionPlaygroundModule = lazyComponent(() => import('./modules/MotionPlaygroundModule.vue'));
const MotionPresenceModule = lazyComponent(() => import('./modules/MotionPresenceModule.vue'));
const MotionTokensModule = lazyComponent(() => import('./modules/MotionTokensModule.vue'));

export const motionModules = [
  {
    id: 'motion-tokens',
    label: localized('Motion tokens', '动效令牌'),
    description: moduleCopy.motion.primitive.description,
    component: MotionTokensModule,
  },
  {
    id: 'motion-presence',
    label: moduleCopy.motion.presence.label,
    description: moduleCopy.motion.presence.description,
    component: MotionPresenceModule,
  },
  {
    id: 'motion-playground',
    label: motionPlaygroundCopy.label,
    description: motionPlaygroundCopy.description,
    component: MotionPlaygroundModule,
  },
  {
    id: 'motion-disclosure',
    label: moduleCopy.motion.disclosure.label,
    description: moduleCopy.motion.disclosure.description,
    component: MotionDisclosureModule,
  },
  {
    id: 'motion-page',
    label: moduleCopy.motion.page.label,
    description: moduleCopy.motion.page.description,
    component: MotionPageModule,
  },
] as const;

export const motionSpecimens = [
  {
    id: 'foundation-motion',
    preview: interactive.motionTokens,
    moduleId: 'motion-tokens',
    label: localized('Motion tokens', '动效令牌'),
    apiNames: [],
    tags: ['foundation', 'motion', 'tokens'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-presence',
    preview: interactive.motionPresence,
    moduleId: 'motion-presence',
    label: moduleCopy.motion.presence.label,
    apiNames: ['UiPresence'],
    tags: ['foundation', 'motion', 'presence', 'transition', 'stagger', 'view-transition'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-playground',
    preview: interactive.motionPlayground,
    moduleId: 'motion-playground',
    label: motionPlaygroundCopy.label,
    apiNames: [],
    tags: [
      'foundation',
      'motion',
      'theme',
      'reveal',
      'crossfade',
      'locale',
      'size',
      'layout',
      'width',
      'resize',
    ],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-disclosure',
    preview: interactive.motionDisclosure,
    moduleId: 'motion-disclosure',
    label: moduleCopy.motion.disclosure.label,
    apiNames: [],
    tags: ['foundation', 'motion', 'disclosure', 'collapse', 'expand', 'height', 'inert'],
    kind: 'foundation',
  },
  {
    id: 'foundation-motion-page',
    preview: interactive.motionPage,
    moduleId: 'motion-page',
    label: moduleCopy.motion.page.label,
    apiNames: [],
    tags: [
      'foundation',
      'motion',
      'page',
      'transition',
      'glide',
      'slide',
      'push',
      'depth',
      'veil',
      'curtain',
      'iris',
      'morph',
      'dissolve',
      'particle',
      'webgl',
      'view-transition',
    ],
    kind: 'foundation',
  },
] as const;
