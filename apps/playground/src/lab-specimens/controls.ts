import {
  type ActionProps,
  type ButtonProps,
  type ControlSurfaceProps,
  type DockProps,
  type IconButtonProps,
  type NavigationItemProps,
  type SegmentedControlProps,
  UiAction,
  UiButton,
  UiControlSurface,
  UiDock,
  UiIconButton,
  UiNavigationItem,
  UiSegmentedControl,
} from '@neoverse-ui/vue';
import { h } from 'vue';
import LabIcon from '../LabIcon.vue';
import { defineSpecimen } from '../lab-specimen-config';
import {
  formatLocalized,
  type Locale,
  localize,
  localized,
  moduleCopy,
} from '../playground-content';
import {
  buttonVariantOptions,
  disabled,
  glassOptions,
  loading,
  sizeLabel,
  sizeOptions,
  surfaceLabel,
  variantLabel,
} from './shared';

const activeOption = localized('Selected option', '所选选项');
const buttonLabel = localized('Try action', '体验操作');
const buttonClicks = localized('Activations: {count}', '触发次数：{count}');

const cornerRadii = {
  square: 'var(--neoverse-radius-none)',
  standard: 'var(--neoverse-radius-control-inner)',
  pill: 'var(--neoverse-radius-pill)',
};
type PreviewCorners = { corner?: keyof typeof cornerRadii };

const cornerControl = {
  kind: 'select',
  label: localized('Corners', '圆角'),
  options: [
    { value: 'square', label: localized('Square', '直角') },
    { value: 'standard', label: localized('Standard', '标准') },
    { value: 'pill', label: localized('Pill', '胶囊形') },
  ],
} as const;

function cornerStyle(corner: PreviewCorners['corner']) {
  return corner === undefined ? undefined : { borderRadius: cornerRadii[corner] };
}

/** The editable Button specimen */
export const button = defineSpecimen<ButtonProps & PreviewCorners, { clicks: number }>()({
  initialProps: { variant: 'secondary', size: 'sm', disabled: false, loading: false },
  initialState: () => ({ clicks: 0 }),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: buttonVariantOptions },
      size: { kind: 'select', label: sizeLabel, options: sizeOptions },
      corner: cornerControl,
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
      disabled,
      loading,
    },
  },
  render: ({ props: { corner, ...props }, state, setState, locale }) =>
    h('div', { class: 'grid justify-items-center gap-3' }, [
      h(
        UiButton,
        {
          ...props,
          style: cornerStyle(corner),
          onClick: () => setState('clicks', state.clicks + 1),
        },
        () => localize(buttonLabel, locale),
      ),
      h(
        'output',
        { class: 'text-caption text-secondary' },
        formatLocalized(buttonClicks, locale, { count: state.clicks }),
      ),
    ]),
});

const segmentCopy = moduleCopy.segmentedControl;
const segments = [
  { value: 'overview', label: segmentCopy.options.overview, disabled: false },
  { value: 'details', label: segmentCopy.options.details, disabled: true },
  { value: 'activity', label: segmentCopy.options.activity, disabled: false },
] as const;
const enabledSegments = segments.filter((option) => option.disabled === false);
type SegmentValue = (typeof enabledSegments)[number]['value'];

function segmentOptions(locale: Locale): SegmentedControlProps['options'] {
  return segments.map(({ label, ...option }) => ({ ...option, label: localize(label, locale) }));
}

const localizedSegments = { en: segmentOptions('en'), zh: segmentOptions('zh') };
/** The editable SegmentedControl specimen */
export const segmented = defineSpecimen<
  Pick<SegmentedControlProps, 'disabled' | 'loading' | 'surface'>,
  { modelValue: SegmentValue }
>()({
  initialProps: { disabled: false, loading: false },
  initialState: () => ({ modelValue: 'overview' }),
  controls: {
    props: {
      disabled,
      loading,
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
    },
    state: { modelValue: { kind: 'select', label: activeOption, options: enabledSegments } },
  },
  note: localized(
    'Size is read-only: the component supports only sm.',
    '尺寸为只读：此组件仅支持 sm。',
  ),
  stateDisabled: (props) => props.disabled === true || props.loading === true,
  render: ({ props, state, setState, locale }) =>
    h(UiSegmentedControl, {
      ...props,
      ariaLabel: localize(segmentCopy.aria.view, locale),
      options: localizedSegments[locale],
      modelValue: state.modelValue,
      'onUpdate:modelValue': (value: string) => {
        const option = enabledSegments.find((entry) => entry.value === value);
        if (option !== undefined) setState('modelValue', option.value);
      },
    }),
});

const iconButtonCopy = moduleCopy.iconButton;
const iconButtonClicks = localized('Additions: {count}', '添加次数：{count}');
/** The editable IconButton specimen */
export const iconButton = defineSpecimen<IconButtonProps & PreviewCorners, { clicks: number }>()({
  initialProps: {
    variant: 'primary',
    size: 'md',
    surface: 'glass-subtle',
    disabled: false,
    loading: false,
  },
  initialState: () => ({ clicks: 0 }),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: buttonVariantOptions },
      size: { kind: 'select', label: sizeLabel, options: sizeOptions },
      corner: cornerControl,
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
      disabled,
      loading,
    },
  },
  render: ({ props: { corner, ...props }, state, setState, locale }) =>
    h('div', { class: 'grid justify-items-center gap-3' }, [
      h(
        UiIconButton,
        {
          ...props,
          style: cornerStyle(corner),
          label: localize(iconButtonCopy.controls.addItem, locale),
          onClick: () => setState('clicks', state.clicks + 1),
        },
        () => h(LabIcon, { name: 'plus' }),
      ),
      h(
        'output',
        { class: 'text-caption text-secondary' },
        formatLocalized(iconButtonClicks, locale, { count: state.clicks }),
      ),
    ]),
});

const actionCopy = moduleCopy.action;
const actionLabels = {
  primary: actionCopy.controls.primary,
  secondary: actionCopy.controls.secondary,
  ghost: actionCopy.controls.ghost,
} as const;
/** The editable Action specimen */
export const action = defineSpecimen<ActionProps & PreviewCorners>()({
  initialProps: { variant: 'primary', size: 'md', surface: 'glass-subtle' },
  initialState: () => ({}),
  controls: {
    props: {
      variant: { kind: 'select', label: variantLabel, options: buttonVariantOptions },
      size: { kind: 'select', label: sizeLabel, options: sizeOptions },
      corner: cornerControl,
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
    },
  },
  render: ({ props: { corner, ...props }, locale }) =>
    h(
      UiAction,
      { ...props, href: '#controls-action', style: cornerStyle(corner) },
      {
        default: () => localize(actionLabels[props.variant ?? 'primary'], locale),
        leading: () => h(LabIcon, { name: 'globe' }),
      },
    ),
});

const navigationCopy = moduleCopy.navigationItem;
const indicatorPlacementOptions = [
  { value: 'bottom', label: localized('Bottom', '底部') },
  { value: 'start', label: localized('Start', '起始') },
] as const;
/** The editable NavigationItem specimen */
export const navigationItem = defineSpecimen<NavigationItemProps>()({
  initialProps: {
    active: true,
    size: 'md',
    compact: false,
    disabled: false,
    surface: 'none',
    indicatorPlacement: 'bottom',
  },
  initialState: () => ({}),
  controls: {
    props: {
      active: { kind: 'boolean', label: localized('Active', '当前项') },
      compact: { kind: 'boolean', label: localized('Compact', '紧凑') },
      size: { kind: 'select', label: sizeLabel, options: sizeOptions },
      indicatorPlacement: {
        kind: 'select',
        label: localized('Indicator placement', '指示器位置'),
        options: indicatorPlacementOptions,
      },
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
      disabled,
    },
  },
  render: ({ props, locale }) =>
    h(
      UiNavigationItem,
      {
        ...props,
        href: '#controls-navigation-item',
        label: localize(navigationCopy.controls.home, locale),
      },
      { icon: () => h(LabIcon, { name: 'home' }) },
    ),
});

const controlSurfaceLabel = localized('Control surface navigation', '控件表面导航');
const controlSurfaceItems = [
  { value: 'overview', label: localized('Overview', '总览') },
  { value: 'components', label: localized('Components', '组件') },
  { value: 'patterns', label: localized('Patterns', '组合') },
] as const;
type ControlSurfaceDestination = (typeof controlSurfaceItems)[number]['value'];
const surfaceScaleOptions = [
  { value: 'md', label: localized('Medium', '中') },
  { value: 'lg', label: localized('Large', '大') },
] as const;
/** The editable ControlSurface specimen */
export const controlSurface = defineSpecimen<
  ControlSurfaceProps,
  { active: ControlSurfaceDestination }
>()({
  initialProps: { surface: 'glass-subtle', scale: 'md', navigationIndicator: true },
  initialState: () => ({ active: 'overview' }),
  controls: {
    props: {
      surface: { kind: 'select', label: surfaceLabel, options: glassOptions },
      scale: {
        kind: 'select',
        label: localized('Scale', '缩放档位'),
        options: surfaceScaleOptions,
      },
      navigationIndicator: {
        kind: 'boolean',
        label: localized('Navigation indicator', '导航指示器'),
      },
    },
    state: {
      active: {
        kind: 'select',
        label: localized('Active destination', '当前导航项'),
        options: controlSurfaceItems,
      },
    },
  },
  render: ({ props, state, setState, locale }) =>
    h(
      UiControlSurface,
      {
        ...props,
        as: 'nav',
        edgeMode: 'local',
        'aria-label': localize(controlSurfaceLabel, locale),
      },
      () =>
        controlSurfaceItems.map(({ value, label }) =>
          h(UiNavigationItem, {
            key: value,
            href: '#controls-surface',
            label: localize(label, locale),
            size: 'sm',
            active: state.active === value,
            surface: 'none',
            onClick: (event: MouseEvent) => {
              event.preventDefault();
              setState('active', value);
            },
          }),
        ),
    ),
});

const dockCopy = moduleCopy.dock;
const dockItems = [
  { value: 'home', label: dockCopy.items.home, icon: 'home' },
  { value: 'projects', label: dockCopy.items.projects, icon: 'folder' },
  { value: 'focus', label: dockCopy.items.focus, icon: 'target' },
  { value: 'activity', label: dockCopy.items.activity, icon: 'activity' },
] as const;
type DockDestination = (typeof dockItems)[number]['value'];

/** The editable Dock specimen */
export const dock = defineSpecimen<DockProps, { destination: DockDestination }>()({
  initialProps: { compact: false, scale: 'md', navigationIndicator: true },
  initialState: () => ({ destination: 'home' }),
  controls: {
    props: {
      compact: { kind: 'boolean', label: dockCopy.states.compact.label },
      scale: {
        kind: 'select',
        label: localized('Scale', '缩放档位'),
        options: surfaceScaleOptions,
      },
      navigationIndicator: {
        kind: 'boolean',
        label: localized('Navigation indicator', '导航指示器'),
      },
    },
    state: {
      destination: {
        kind: 'select',
        label: localized('Active destination', '当前导航项'),
        options: dockItems,
      },
    },
  },
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'playground-stage__dock scrollbar-immersive' }, [
      h('div', { class: 'playground-dock-preview__content' }, [
        h(UiDock, { ...props, 'aria-label': localize(dockCopy.ariaLabel, locale) }, () =>
          dockItems.map(({ value, label, icon }) => {
            const active = state.destination === value;
            return h(
              UiNavigationItem,
              {
                key: value,
                as: 'button',
                label: localize(label, locale),
                compact: props.compact === true,
                active,
                'aria-current': active ? 'location' : undefined,
                onClick: () => setState('destination', value),
              },
              { icon: () => h(LabIcon, { name: icon }) },
            );
          }),
        ),
      ]),
    ]),
});
