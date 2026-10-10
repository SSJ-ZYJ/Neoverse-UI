import componentMatrix from '../../../contracts/component-matrix.json' with { type: 'json' };
import frameworkParity from '../../../contracts/framework-parity.json' with { type: 'json' };

export const contractStateIds = [
  'default',
  'hover',
  'active',
  'focus',
  'disabled',
  'loading',
  'validation',
  'readonly',
  'open',
] as const;

export type ContractStateId = (typeof contractStateIds)[number];

export const contractCheckIds = [
  'open-close',
  'keyboard',
  'dismiss',
  'focus-restore',
  'viewport',
  'reduced-transparency',
] as const;

export type ContractCheckId = (typeof contractCheckIds)[number];

export interface InteractionContract {
  readonly specimenId: string;
  readonly apiNames: readonly string[];
  readonly states: readonly ContractStateId[];
  readonly checks: readonly ContractCheckId[];
}

export interface ComponentContract {
  readonly name: string;
  readonly track: 'canonical-shared' | 'consumer-driven';
  readonly maturity: 'stable' | 'consumer-validation' | 'partial';
  readonly visual: 'release' | 'playground' | 'none';
  readonly runtime: 'validated' | 'pending' | 'not-applicable';
  readonly consumer: 'validated' | 'pending';
}

export const componentContracts = componentMatrix.components as readonly ComponentContract[];

export const frameworkParityNames = new Set(
  frameworkParity.components.map((component) => component.name),
);

export const interactionContracts = [
  {
    specimenId: 'controls-button',
    apiNames: ['UiButton'],
    states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
    checks: ['reduced-transparency'],
  },
  {
    specimenId: 'controls-icon-button',
    apiNames: ['UiIconButton'],
    states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
    checks: [],
  },
  {
    specimenId: 'controls-action',
    apiNames: ['UiAction'],
    states: ['default', 'hover', 'active', 'focus', 'disabled'],
    checks: [],
  },
  {
    specimenId: 'controls-navigation-item',
    apiNames: ['UiNavigationItem'],
    states: ['default', 'hover', 'focus', 'disabled'],
    checks: [],
  },
  {
    specimenId: 'controls-segmented-control',
    apiNames: ['UiSegmentedControl'],
    states: ['default', 'focus', 'disabled', 'loading'],
    checks: ['keyboard', 'reduced-transparency'],
  },
  {
    specimenId: 'controls-overlays',
    apiNames: ['UiPopover', 'UiDropdownMenu'],
    states: ['default'],
    checks: ['open-close', 'keyboard', 'dismiss', 'focus-restore', 'viewport'],
  },
  {
    specimenId: 'forms-input',
    apiNames: ['UiInput'],
    states: ['default', 'disabled'],
    checks: [],
  },
  {
    specimenId: 'forms-textarea',
    apiNames: ['UiTextarea'],
    states: ['default', 'disabled'],
    checks: [],
  },
  {
    specimenId: 'forms-select',
    apiNames: ['UiSelect'],
    states: ['default', 'disabled'],
    checks: ['open-close', 'keyboard', 'focus-restore', 'viewport'],
  },
  {
    specimenId: 'forms-choice-controls',
    apiNames: ['UiCheckbox', 'UiRadioGroup', 'UiSwitch'],
    states: ['default'],
    checks: [],
  },
  {
    specimenId: 'forms-field-states',
    apiNames: ['UiField'],
    states: ['validation', 'readonly', 'disabled'],
    checks: [],
  },
  {
    specimenId: 'data-display-disclosure',
    apiNames: ['UiDisclosure'],
    states: ['default', 'open'],
    checks: ['keyboard'],
  },
] as const satisfies readonly InteractionContract[];

export const contractLabSummary = {
  totalComponents: componentContracts.length,
  canonicalShared: componentContracts.filter((component) => component.track === 'canonical-shared')
    .length,
  releaseVisual: componentContracts.filter((component) => component.visual === 'release').length,
  runtimeValidated: componentContracts.filter((component) => component.runtime === 'validated')
    .length,
  stable: componentContracts.filter((component) => component.maturity === 'stable').length,
  frameworkParity: frameworkParity.components.length,
} as const;

export function interactionContractForSpecimen(
  specimenId: string,
): InteractionContract | undefined {
  return interactionContracts.find((contract) => contract.specimenId === specimenId);
}

export function componentContractByName(name: string): ComponentContract | undefined {
  return componentContracts.find((component) => component.name === name);
}
