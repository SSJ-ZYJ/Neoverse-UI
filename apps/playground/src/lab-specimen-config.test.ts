import { expect, test } from 'bun:test';
import type { ButtonProps } from '@neoverse-ui/vue';
import { h, type VNode, watchSyncEffect } from 'vue';
import { specimenById } from './lab-modules';
import { defineComposition, defineSpecimen } from './lab-specimen-config';

const specimen = defineSpecimen<ButtonProps, { presses: number }>()({
  initialProps: { size: 'sm', disabled: false },
  initialState: () => ({ presses: 0 }),
  controls: {
    props: {
      size: {
        kind: 'select',
        label: { en: 'Size', zh: '尺寸' },
        options: [{ value: 'lg', label: { en: 'Large', zh: '大' } }],
      },
      disabled: { kind: 'boolean', label: { en: 'Disabled', zh: '禁用' } },
      surface: {
        kind: 'select',
        label: { en: 'Surface', zh: '表面' },
        options: [{ value: 'none', label: { en: 'None', zh: '无' } }],
      },
    },
    state: {
      presses: { kind: 'number', label: { en: 'Presses', zh: '按下次数' }, min: 0, max: 10 },
    },
  },
  render: ({ props, state, setState }) =>
    h('button', { ...props, onClick: () => setState('presses', state.presses + 1) }, state.presses),
});

test('a preview omits inherited props and restores explicit specimen values on reset', () => {
  const session = specimen.createSession();
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.render('en').props).not.toHaveProperty('surface');

  expect(session.edit('props', 'size', 'lg')).toBe(true);
  expect(session.edit('props', 'surface', 'none')).toBe(true);
  expect(session.render('en').props).toMatchObject({ size: 'lg', surface: 'none' });
  expect(session.fields.find(({ key }) => key === 'size')?.edited).toBe(true);
  expect(session.edit('props', 'surface', undefined)).toBe(true);
  expect(session.render('en').props).not.toHaveProperty('surface');

  session.reset();
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);
});

test('a session rejects undeclared and invalid edits without changing the preview', () => {
  const session = specimen.createSession();
  expect(session.edit('props', 'size', 'xl')).toBe(false);
  expect(session.edit('props', 'disabled', 'true')).toBe(false);
  expect(session.edit('props', 'size', undefined)).toBe(false);
  expect(session.edit('props', 'variant', 'ghost')).toBe(false);
  expect(session.edit('props', 'constructor', 'ghost')).toBe(false);
  for (const value of [-1, 11, Number.NaN, Infinity, '', '3']) {
    expect(session.edit('state', 'presses', value)).toBe(false);
  }
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.render('en').props).not.toHaveProperty('variant');
  expect(session.render('en').children).toBe('0');
});

test('a live preview and its Inspector share state without affecting another session', () => {
  const session = specimen.createSession();
  const other = specimen.createSession();
  const press = session.render('en').props?.onClick;
  if (typeof press !== 'function') throw new Error('Missing preview action');
  press();
  expect(session.fields.find(({ key }) => key === 'presses')?.value).toBe(1);
  expect(session.edit('state', 'presses', 7)).toBe(true);
  expect(session.render('en').children).toBe('7');
  expect(other.render('en').children).toBe('0');
  session.reset();
  expect(session.render('en').children).toBe('0');
});

const compositionPresets = [
  {
    id: 'overview',
    label: { en: 'Overview', zh: '总览' },
    props: { compact: false, progress: 30 },
    state: { mode: 'read' },
  },
  {
    id: 'detail',
    label: { en: 'Detail', zh: '详情' },
    props: { compact: true, progress: 75 },
    state: { mode: 'edit' },
  },
] as const;

type TestPreset = (typeof compositionPresets)[number];

function defineTestComposition(presets: [TestPreset, ...TestPreset[]]) {
  return defineComposition<{ compact: boolean; progress: number }, { mode: 'read' | 'edit' }>()({
    presets,
    controls: {
      props: {
        compact: { kind: 'boolean', label: { en: 'Compact', zh: '紧凑' } },
        progress: { kind: 'number', label: { en: 'Progress', zh: '进度' }, min: 0, max: 100 },
      },
      state: {
        mode: {
          kind: 'select',
          label: { en: 'Mode', zh: '模式' },
          options: compositionPresets.map(({ label, state }) => ({ label, value: state.mode })),
        },
      },
    },
    render: ({ props, state, setState }) =>
      h('button', { ...props, ...state, onClick: () => setState('mode', 'read') }),
  });
}

test('a composition applies the full preset and resets temporary edits to that preset', () => {
  const definition = defineTestComposition([...compositionPresets]);
  const session = definition.createSession();
  const preset = session.fields.find(({ source }) => source === 'preset');
  expect(preset?.value).toBe('overview');
  expect(session.render('en').props).toMatchObject({ compact: false, progress: 30, mode: 'read' });
  expect(session.edit('props', 'progress', 100)).toBe(true);
  expect(session.edit('preset', 'preset', 'detail')).toBe(true);
  expect(preset?.value).toBe('detail');
  expect(session.render('en').props).toMatchObject({ compact: true, progress: 75, mode: 'edit' });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);

  const onClick = session.render('en').props?.onClick;
  if (typeof onClick !== 'function') throw new Error('Missing preview action');
  onClick();
  expect(session.fields.find(({ key }) => key === 'mode')?.value).toBe('read');
  expect(session.edit('props', 'compact', false)).toBe(true);
  expect(session.edit('props', 'progress', 0)).toBe(true);
  expect(session.edit('preset', 'preset', 'missing')).toBe(false);
  expect(session.edit('props', 'progress', 101)).toBe(false);
  expect(session.edit('state', 'mode', 'missing')).toBe(false);
  expect(session.render('zh').props).toMatchObject({ compact: false, progress: 0, mode: 'read' });
  const reopened = definition.createSession();
  expect(reopened.render('en').props).toMatchObject({ compact: false, progress: 30, mode: 'read' });
  expect(reopened.edit('preset', 'preset', 'detail')).toBe(true);
  expect(reopened.render('en').props).toMatchObject({ compact: true, progress: 75, mode: 'edit' });

  session.reset();
  expect(preset?.value).toBe('detail');
  expect(session.render('en').props).toMatchObject({ compact: true, progress: 75, mode: 'edit' });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);
  expect(session.edit('preset', 'preset', 'overview')).toBe(true);
  expect(session.render('en').props).toMatchObject({ compact: false, progress: 30, mode: 'read' });
});

test('a composition rejects duplicate IDs, invalid IDs and invalid built-in configurations', () => {
  const [overview] = compositionPresets;
  expect(() => defineTestComposition([overview, overview])).toThrow(
    'Duplicate preset ID: overview',
  );
  // Deliberately bypass the authored literal types to exercise runtime validation.
  const invalid = (preset: object) => ({ ...overview, ...preset }) as typeof overview;
  expect(() => defineTestComposition([invalid({ id: 'Not stable' })])).toThrow('Invalid preset ID');
  expect(() => defineTestComposition([invalid({ props: { compact: false } })])).toThrow('progress');
  expect(() =>
    defineTestComposition([invalid({ props: { compact: false, progress: -1 } })]),
  ).toThrow('progress');
  expect(() => defineTestComposition([invalid({ state: { mode: 'other' } })])).toThrow('mode');
});

test('an Inspector observer sees preset selection and all fields change together', () => {
  const session = defineTestComposition([...compositionPresets]).createSession();
  expect(session.edit('props', 'progress', 50)).toBe(true);
  const snapshots: unknown[][] = [];
  const stop = watchSyncEffect(() => {
    snapshots.push(session.fields.map(({ value }) => value));
  });
  try {
    expect(session.edit('preset', 'preset', 'detail')).toBe(true);
    expect(snapshots).toEqual([
      ['overview', false, 50, 'read'],
      ['detail', true, 75, 'edit'],
    ]);
  } finally {
    stop();
  }
});

function openSession(id: string) {
  const preview = specimenById(id)?.preview;
  if (preview === undefined || typeof preview === 'function') {
    throw new Error(`No editable preview for ${id}`);
  }
  return preview.createSession();
}

test('the Select session validates options and preserves its value while blocked', () => {
  const session = openSession('forms-select');
  const selected = session.fields.find(({ key }) => key === 'modelValue');
  const values = () => Object.fromEntries(session.fields.map(({ key, value }) => [key, value]));
  expect(values()).toMatchObject({
    modelValue: 'native',
    disabled: false,
    readonly: false,
  });
  for (const value of ['missing', 1, undefined]) {
    expect(session.edit('state', 'modelValue', value)).toBe(false);
  }
  expect(session.edit('props', 'readonly', 'true')).toBe(false);
  expect(session.edit('state', 'modelValue', 'remote')).toBe(true);
  expect(selected?.edited).toBe(true);

  for (const key of ['disabled', 'readonly']) {
    expect(session.edit('props', key, true)).toBe(true);
    expect(selected?.disabled).toBe(true);
    expect(session.edit('state', 'modelValue', 'native')).toBe(false);
    expect(values()).toMatchObject({ modelValue: 'remote', [key]: true });
    expect(session.edit('props', key, false)).toBe(true);
    expect(selected?.disabled).toBe(false);
  }
  expect(openSession('forms-select').fields.find(({ key }) => key === 'modelValue')?.value).toBe(
    'native',
  );
  expect(session.edit('props', 'readonly', true)).toBe(true);
  session.reset();
  expect(values()).toMatchObject({
    modelValue: 'native',
    disabled: false,
    readonly: false,
  });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);
});

test('the Checkbox session locks edits without discarding an unchecked value', () => {
  const session = openSession('forms-checkbox');
  const checked = session.fields.find(({ key }) => key === 'modelValue');
  expect(session.render('en').props).toMatchObject({ modelValue: true, disabled: false });
  expect(session.edit('state', 'modelValue', 'false')).toBe(false);
  expect(session.edit('props', 'disabled', 1)).toBe(false);
  expect(session.edit('state', 'modelValue', false)).toBe(true);
  expect(checked?.edited).toBe(true);
  expect(session.edit('props', 'disabled', true)).toBe(true);
  expect(checked?.disabled).toBe(true);
  expect(session.edit('state', 'modelValue', true)).toBe(false);
  expect(session.render('en').props).toMatchObject({ modelValue: false, disabled: true });
  expect(openSession('forms-checkbox').render('en').props?.modelValue).toBe(true);
  session.reset();
  expect(session.render('en').props).toMatchObject({ modelValue: true, disabled: false });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);
});

test('the Tabs session accepts only enabled tabs and resets the selected tab', () => {
  const session = openSession('data-display-tabs');
  const selected = session.fields.find(({ key }) => key === 'modelValue');
  expect(session.render('en').props?.modelValue).toBe('overview');
  for (const value of ['disabled', 'missing', false, undefined]) {
    expect(session.edit('state', 'modelValue', value)).toBe(false);
  }
  expect(session.edit('props', 'modelValue', 'activity')).toBe(false);
  expect(selected?.edited).toBe(false);
  expect(session.edit('state', 'modelValue', 'activity')).toBe(true);
  expect(selected?.edited).toBe(true);
  expect(session.render('zh').props?.modelValue).toBe('activity');
  expect(openSession('data-display-tabs').render('en').props?.modelValue).toBe('overview');
  session.reset();
  expect(session.render('en').props?.modelValue).toBe('overview');
  expect(selected?.edited).toBe(false);
});

/** Each entry is one appearance variant the Inspector must be able to switch. */
const variantEdits = [
  ['controls-action', 'variant', 'ghost'],
  ['controls-segmented-control', 'shape', 'rounded'],
  ['controls-navigation-item', 'active', false],
  ['controls-surface', 'surface', 'glass-immersive'],
  ['status-feedback-badge', 'variant', 'danger'],
  ['status-feedback-indicator', 'status', 'danger'],
  ['status-feedback-skeleton', 'variant', 'circle'],
  ['status-feedback-notice', 'variant', 'warning'],
  ['status-feedback-toast', 'variant', 'danger'],
  ['status-feedback-toast', 'presentation', 'action'],
  ['status-feedback-tooltip', 'variant', 'accent'],
  ['data-display-avatar', 'size', 'lg'],
  ['data-display-table', 'striped', false],
  ['data-display-stat-card', 'surface', 'solid'],
  ['materials-surface', 'surface', 'elevated'],
  ['card-card', 'surface', 'solid'],
] as const;

/** Wrapper nodes own layout, so read the props of every rendered node. */
function renderedProps(vnode: VNode): Array<Record<string, unknown>> {
  const queue: VNode[] = [vnode];
  const found: Array<Record<string, unknown>> = [];
  while (queue.length > 0) {
    const node = queue.pop();
    if (node === undefined) continue;
    if (node.props) found.push(node.props as Record<string, unknown>);
    if (Array.isArray(node.children)) queue.push(...(node.children as VNode[]));
  }
  return found;
}

test('every appearance variant is editable and returns to its specimen default', () => {
  for (const [id, key, value] of variantEdits) {
    const session = openSession(id);
    expect(session.fields.some(({ key: fieldKey }) => fieldKey === key)).toBe(true);
    expect(renderedProps(session.render('en')).every((props) => props[key] !== value)).toBe(true);
    expect(session.edit('props', key, value)).toBe(true);
    expect(renderedProps(session.render('en')).some((props) => props[key] === value)).toBe(true);
    session.reset();
    expect(renderedProps(session.render('en')).every((props) => props[key] !== value)).toBe(true);
  }
});

test('switching a variant is rejected when the value is not a declared option', () => {
  const session = openSession('status-feedback-badge');
  for (const value of ['brand', 'Neutral', '', undefined, 1]) {
    expect(session.edit('props', 'variant', value)).toBe(false);
  }
  expect(session.render('en').props?.variant).toBe('neutral');
});

test('the IconButton session switches the variant on its rendered control', () => {
  const session = openSession('controls-icon-button');
  const control = (vnode: ReturnType<typeof session.render>) =>
    Array.isArray(vnode.children) ? (vnode.children[0] as VNode) : undefined;
  expect(control(session.render('en'))?.props?.variant).toBe('primary');
  expect(session.edit('props', 'variant', 'ghost')).toBe(true);
  expect(control(session.render('en'))?.props?.variant).toBe('ghost');
  session.reset();
  expect(control(session.render('en'))?.props?.variant).toBe('primary');
});

test('the Disclosure session owns its expanded state and toggles from the stage', () => {
  const session = openSession('data-display-disclosure');
  const expanded = session.fields.find(({ key }) => key === 'open');
  expect(session.render('en').props?.open).toBe(false);
  const toggle = session.render('en').props?.['onUpdate:open'];
  if (typeof toggle !== 'function') throw new Error('Missing disclosure toggle');
  toggle(true);
  expect(session.render('en').props?.open).toBe(true);
  expect(expanded?.value).toBe(true);
  expect(session.edit('state', 'open', false)).toBe(true);
  expect(session.render('en').props?.open).toBe(false);
  session.reset();
  expect(session.render('en').props?.open).toBe(false);
});

test('the Toast session keeps its variant while the visibility control opens it', () => {
  const session = openSession('status-feedback-toast');
  const toast = (vnode: ReturnType<typeof session.render>) =>
    Array.isArray(vnode.children) ? (vnode.children[1] as VNode) : undefined;
  expect(toast(session.render('en'))?.props).toMatchObject({ open: false, variant: 'success' });
  expect(session.edit('props', 'variant', 'warning')).toBe(true);
  expect(session.edit('state', 'open', true)).toBe(true);
  expect(toast(session.render('en'))?.props).toMatchObject({ open: true, variant: 'warning' });
  const dismiss = toast(session.render('en'))?.props?.['onUpdate:open'];
  if (typeof dismiss !== 'function') throw new Error('Missing toast dismissal');
  dismiss(false);
  expect(toast(session.render('en'))?.props?.open).toBe(false);
  session.reset();
  expect(toast(session.render('en'))?.props).toMatchObject({ open: false, variant: 'success' });
});

test('the form-state sessions share validation and lock their value while blocked', () => {
  const textarea = openSession('forms-textarea');
  expect(textarea.render('en').props).toMatchObject({ disabled: false, readonly: false });
  expect(textarea.edit('state', 'modelValue', 'Draft notes')).toBe(true);
  expect(textarea.edit('props', 'validation', 'error')).toBe(true);
  expect(textarea.render('en').props).toMatchObject({
    modelValue: 'Draft notes',
    validation: 'error',
  });
  expect(textarea.edit('props', 'readonly', true)).toBe(true);
  expect(textarea.fields.find(({ key }) => key === 'modelValue')?.disabled).toBe(true);
  expect(textarea.edit('state', 'modelValue', 'Blocked')).toBe(false);
  expect(textarea.render('en').props?.modelValue).toBe('Draft notes');

  const radio = openSession('forms-radio-group');
  expect(radio.render('en').props?.modelValue).toBe('stable');
  expect(radio.edit('props', 'disabled', true)).toBe(true);
  expect(radio.edit('state', 'modelValue', 'preview')).toBe(false);
  expect(radio.render('en').props?.modelValue).toBe('stable');

  const toggle = openSession('forms-switch');
  expect(toggle.edit('state', 'modelValue', false)).toBe(true);
  expect(toggle.edit('props', 'validation', 'warning')).toBe(true);
  expect(toggle.render('en').props).toMatchObject({ modelValue: false, validation: 'warning' });
  expect(toggle.edit('props', 'readonly', true)).toBe(true);
  expect(toggle.edit('state', 'modelValue', true)).toBe(false);

  const field = openSession('forms-field-states');
  expect(field.render('en').props?.message).toBe('Enter a valid release email.');
  expect(field.edit('props', 'validation', 'none')).toBe(true);
  expect(field.render('en').props?.message).toBeUndefined();
  expect(field.edit('props', 'required', false)).toBe(true);
  expect(field.render('en').props?.required).toBe(false);
});
