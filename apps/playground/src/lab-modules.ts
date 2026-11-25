import type { Component } from 'vue';
import { compositionSpecimens } from './lab-modules/composition-specimens';
import { controlOverlaySpecimens } from './lab-modules/control-overlay-specimens';
import { foundationSpecimens } from './lab-modules/foundation-specimens';
import {
  dataDisplayTopSpecimens,
  formAndSurfaceBottomSpecimens,
} from './lab-modules/input-display-specimens';
import type { FocusedPreview } from './lab-specimen-config';
import { lazyComponent, preloadComponent, preloadPreview } from './lazy-component';
import { motionModules, motionSpecimens } from './motion-specimens';
import { type LocalizedText, localized, moduleCopy } from './playground-content';

const CardModule = lazyComponent(() => import('./modules/CardModule.vue'));
const ColorsModule = lazyComponent(() => import('./modules/ColorsModule.vue'));
const CompositionModule = lazyComponent(() => import('./modules/CompositionModule.vue'));
const ConsumerParityModule = lazyComponent(() => import('./modules/ConsumerParityModule.vue'));
const ControlsModule = lazyComponent(() => import('./modules/ControlsModule.vue'));
const DataDisplayModule = lazyComponent(() => import('./modules/DataDisplayModule.vue'));
const DockModule = lazyComponent(() => import('./modules/DockModule.vue'));
const FormsModule = lazyComponent(() => import('./modules/FormsModule.vue'));
const GiscusModule = lazyComponent(() => import('./modules/GiscusModule.vue'));
const LayoutShapeModule = lazyComponent(() => import('./modules/LayoutShapeModule.vue'));
const MaterialsModule = lazyComponent(() => import('./modules/MaterialsModule.vue'));
const OverlaysModule = lazyComponent(() => import('./modules/OverlaysModule.vue'));
const ScrollbarModule = lazyComponent(() => import('./modules/ScrollbarModule.vue'));
const ShadowModule = lazyComponent(() => import('./modules/ShadowModule.vue'));
const StatusFeedbackModule = lazyComponent(() => import('./modules/StatusFeedbackModule.vue'));
const TerminalModule = lazyComponent(() => import('./modules/TerminalModule.vue'));
const TypographyModule = lazyComponent(() => import('./modules/TypographyModule.vue'));

export const labModules = [
  {
    id: 'colors',
    label: moduleCopy.colors.label,
    description: moduleCopy.colors.description,
    component: ColorsModule,
  },
  {
    id: 'typography',
    label: moduleCopy.typography.label,
    description: moduleCopy.typography.description,
    component: TypographyModule,
  },
  {
    id: 'layout-shape',
    label: moduleCopy.layoutShape.label,
    description: moduleCopy.layoutShape.description,
    component: LayoutShapeModule,
  },
  ...motionModules,
  {
    id: 'materials',
    label: moduleCopy.materials.label,
    description: moduleCopy.materials.description,
    component: MaterialsModule,
  },
  {
    id: 'shadow',
    label: moduleCopy.shadow.label,
    description: moduleCopy.shadow.description,
    component: ShadowModule,
  },
  {
    id: 'controls',
    label: moduleCopy.controls.label,
    description: moduleCopy.controls.description,
    component: ControlsModule,
  },
  {
    id: 'overlays',
    label: moduleCopy.overlays.label,
    description: moduleCopy.overlays.description,
    component: OverlaysModule,
  },
  {
    id: 'dock',
    label: moduleCopy.dock.label,
    description: moduleCopy.dock.description,
    component: DockModule,
  },
  {
    id: 'status-feedback',
    label: moduleCopy.statusFeedback.label,
    description: moduleCopy.statusFeedback.description,
    component: StatusFeedbackModule,
  },
  {
    id: 'forms',
    label: moduleCopy.forms.label,
    description: moduleCopy.forms.description,
    component: FormsModule,
  },
  {
    id: 'data-display',
    label: moduleCopy.dataDisplay.label,
    description: moduleCopy.dataDisplay.description,
    component: DataDisplayModule,
  },
  {
    id: 'card',
    label: moduleCopy.card.label,
    description: moduleCopy.card.description,
    component: CardModule,
  },
  {
    id: 'scrollbar',
    label: moduleCopy.scrollbar.label,
    description: moduleCopy.scrollbar.description,
    component: ScrollbarModule,
  },
  {
    id: 'terminal',
    label: localized('Terminal', '终端'),
    description: localized(
      'Terminal presentation, input, and output composition.',
      '终端外观、输入与输出组合。',
    ),
    component: TerminalModule,
  },
  {
    id: 'composition',
    label: moduleCopy.composition.label,
    description: moduleCopy.composition.description,
    component: CompositionModule,
  },
  {
    id: 'consumer-parity',
    label: moduleCopy.consumerParity.label,
    description: moduleCopy.consumerParity.description,
    component: ConsumerParityModule,
  },
  {
    id: 'giscus',
    label: moduleCopy.giscus.label,
    description: moduleCopy.giscus.description,
    component: GiscusModule,
  },
] as const satisfies readonly {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  component: Component;
}[];

export type ModuleId = (typeof labModules)[number]['id'];
export type LabModule = (typeof labModules)[number];

/**
 * Explorer sections follow one rule: a section states design intent, a module is
 * a family that can be read on its own, and the utility section holds lab
 * tooling rather than design content. Modules therefore appear exactly once.
 */
export const moduleGroups = [
  {
    id: 'foundations',
    label: localized('Foundations', '设计基础'),
    kind: 'design',
    moduleIds: ['colors', 'typography', 'layout-shape'],
  },
  {
    id: 'materials',
    label: localized('Materials & elevation', '材质与层级'),
    kind: 'design',
    moduleIds: ['materials', 'shadow'],
  },
  {
    id: 'motion',
    label: localized('Motion', '动效'),
    kind: 'design',
    moduleIds: [
      'motion-tokens',
      'motion-presence',
      'motion-playground',
      'motion-disclosure',
      'motion-page',
    ],
  },
  {
    id: 'components',
    label: localized('Components', '组件'),
    kind: 'design',
    moduleIds: [
      'controls',
      'forms',
      'overlays',
      'status-feedback',
      'data-display',
      'card',
      'dock',
      'scrollbar',
      'terminal',
    ],
  },
  {
    id: 'compositions',
    label: localized('Compositions', '组合场景'),
    kind: 'design',
    moduleIds: ['composition'],
  },
  {
    id: 'tools',
    label: localized('Lab tools', '实验室工具'),
    kind: 'utility',
    moduleIds: ['consumer-parity', 'giscus'],
  },
] as const satisfies readonly {
  id: string;
  label: LocalizedText;
  kind: 'design' | 'utility';
  moduleIds: readonly ModuleId[];
}[];

export type ModuleGroup = (typeof moduleGroups)[number];

export const specimenKinds = ['foundation', 'component', 'composition'] as const;
export type SpecimenKind = (typeof specimenKinds)[number];

export interface LabSpecimen {
  readonly id: string;
  readonly moduleId: ModuleId;
  readonly label: LocalizedText;
  readonly apiNames: readonly string[];
  readonly tags: readonly string[];
  readonly kind: SpecimenKind;
  readonly preview: FocusedPreview;
  readonly browse?: boolean;
}

export const labSpecimens = [
  ...dataDisplayTopSpecimens,
  ...foundationSpecimens,
  ...motionSpecimens,
  ...controlOverlaySpecimens,
  ...formAndSurfaceBottomSpecimens,
  ...compositionSpecimens,
] as const satisfies readonly LabSpecimen[];

export type SpecimenId = (typeof labSpecimens)[number]['id'];

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && labModules.some((module) => module.id === value);
}

export function isSpecimenId(value: unknown): value is SpecimenId {
  return typeof value === 'string' && labSpecimens.some((specimen) => specimen.id === value);
}

export function specimenById(id: string): LabSpecimen | undefined {
  return labSpecimens.find((specimen) => specimen.id === id);
}

export function specimensForModule(moduleId: ModuleId): readonly LabSpecimen[] {
  return labSpecimens.filter((specimen) => specimen.moduleId === moduleId);
}

/** Specimens the Explorer may link to; aggregate comparisons stay out of the tree. */
export function browsableSpecimens(moduleId: ModuleId): readonly LabSpecimen[] {
  return specimensForModule(moduleId).filter((specimen) => specimen.browse !== false);
}

/** A family needs a disclosure only when it holds more than one browsable specimen. */
export function isExpandableModule(moduleId: ModuleId): boolean {
  return browsableSpecimens(moduleId).length > 1;
}

export function moduleGroupFor(moduleId: ModuleId): ModuleGroup | undefined {
  return moduleGroups.find((group) => group.moduleIds.some((id) => id === moduleId));
}

export interface ResolvedLabHash {
  readonly moduleId: ModuleId;
  readonly specimenId?: SpecimenId;
  readonly canonicalHash: string;
}

export function resolveLabHash(hash: string): ResolvedLabHash | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;

  if (normalized === 'motion') {
    return {
      moduleId: 'motion-presence',
      specimenId: 'foundation-motion-presence',
      canonicalHash: 'foundation-motion-presence',
    };
  }

  if (isModuleId(normalized)) {
    return { moduleId: normalized, canonicalHash: normalized };
  }

  if (isSpecimenId(normalized)) {
    const specimen = specimenById(normalized);
    if (specimen !== undefined) {
      return {
        moduleId: specimen.moduleId,
        specimenId: normalized,
        canonicalHash: normalized,
      };
    }
  }

  return null;
}

export async function preloadLabRoute(
  rawHash: string,
  options: { frame?: boolean } = {},
): Promise<void> {
  const stripped = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  let decoded = stripped;
  try {
    decoded = decodeURIComponent(stripped);
  } catch {
    decoded = stripped;
  }
  const resolved = resolveLabHash(decoded);
  if (options.frame) {
    const module = labModules.find(({ id }) => id === (resolved?.moduleId ?? labModules[0].id));
    await preloadComponent(module?.component);
    return;
  }
  if (resolved === null) return;
  if (resolved.specimenId !== undefined) {
    await preloadPreview(specimenById(resolved.specimenId)?.preview);
    return;
  }
  await preloadComponent(labModules.find(({ id }) => id === resolved.moduleId)?.component);
}
