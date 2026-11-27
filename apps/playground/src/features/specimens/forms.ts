import {
  type CheckboxProps,
  type FieldControlAttrs,
  type FieldProps,
  type FormControlValue,
  type InputProps,
  type RadioGroupProps,
  type SelectProps,
  type SwitchProps,
  type TextareaProps,
  UiCheckbox,
  UiField,
  UiInput,
  UiRadioGroup,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@neoverse-ui/vue';
import { h } from 'vue';
import { type Locale, localize, localized } from '../../content/playground-content';
import { defineSpecimen } from './lab-specimen-config';
import { disabled, validationOptions } from './shared';

const readonly = { kind: 'boolean', label: localized('Read-only', '只读') } as const;
const validationLabel = localized('Validation', '校验');
const valueLabel = localized('Value', '输入值');
const checkedLabel = localized('Checked', '已勾选');

const inputLabel = localized('Preview text input', '预览文本输入框');
const inputPlaceholder = localized('Enter a project name', '输入项目名称');
/** The editable Input specimen */
export const input = defineSpecimen<
  Pick<InputProps, 'disabled' | 'readonly' | 'validation'>,
  { modelValue: Extract<InputProps['modelValue'], string> }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: 'Neoverse Studio' }),
  controls: {
    props: {
      disabled,
      readonly,
      validation: { kind: 'select', label: validationLabel, options: validationOptions },
    },
    state: { modelValue: { kind: 'text', label: valueLabel } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'w-full max-w-container-sm' }, [
      h(UiInput, {
        ...props,
        'aria-label': localize(inputLabel, locale),
        placeholder: localize(inputPlaceholder, locale),
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: string) => setState('modelValue', value),
      }),
    ]),
});

const notesLabel = localized('Project notes', '项目备注');
const notesPlaceholder = localized('Describe the next iteration…', '描述下一轮迭代…');
/** The editable Textarea specimen */
export const textarea = defineSpecimen<
  Pick<TextareaProps, 'disabled' | 'readonly' | 'validation'>,
  { modelValue: string }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: '' }),
  controls: {
    props: {
      disabled,
      readonly,
      validation: { kind: 'select', label: validationLabel, options: validationOptions },
    },
    state: { modelValue: { kind: 'text', label: localized('Notes', '备注内容') } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h(UiTextarea, {
      ...props,
      id: 'forms-notes',
      class: 'w-full max-w-container-sm',
      modelValue: state.modelValue,
      'onUpdate:modelValue': (value: string) => setState('modelValue', value),
      'aria-label': localize(notesLabel, locale),
      placeholder: localize(notesPlaceholder, locale),
      rows: 4,
      'data-form-textarea': '',
    }),
});

const runtimeLabel = localized('Runtime', '运行时');
const runtimes = [
  { value: 'native', label: localized('Native', '原生') },
  { value: 'remote', label: localized('Remote', '远程') },
] as const;
type Runtime = (typeof runtimes)[number]['value'];

function runtimeOptions(locale: Locale): SelectProps['options'] {
  return runtimes.map(({ value, label }) => ({ value, label: localize(label, locale) }));
}

const localizedRuntimes = { en: runtimeOptions('en'), zh: runtimeOptions('zh') };

/** The editable Select specimen */
export const select = defineSpecimen<
  Pick<SelectProps, 'disabled' | 'readonly'>,
  { modelValue: Runtime }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: 'native' }),
  controls: {
    props: { disabled, readonly },
    state: { modelValue: { kind: 'select', label: localized('Value', '值'), options: runtimes } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  // UiSelect forwards layout classes to the interactive summary, while its
  // details shell stays full width. Size the shell from a wrapper so the
  // centered stage centers the specimen; the Input preview uses the same box.
  render: ({ props, state, setState, locale }) =>
    h('div', { class: 'w-full max-w-container-sm' }, [
      h(UiSelect, {
        ...props,
        id: 'forms-runtime',
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: FormControlValue) => {
          const option = runtimes.find((entry) => entry.value === value);
          if (option !== undefined) setState('modelValue', option.value);
        },
        'aria-label': localize(runtimeLabel, locale),
        options: localizedRuntimes[locale],
        'data-form-select': '',
      }),
    ]),
});

const releaseNotifications = localized('Release notifications', '版本发布通知');

/** The editable Checkbox specimen */
export const checkbox = defineSpecimen<Pick<CheckboxProps, 'disabled'>, { modelValue: boolean }>()({
  initialProps: { disabled: false },
  initialState: () => ({ modelValue: true }),
  controls: {
    props: { disabled },
    state: { modelValue: { kind: 'boolean', label: checkedLabel } },
  },
  stateDisabled: (props) => props.disabled === true,
  render: ({ props, state, setState, locale }) =>
    h(
      UiCheckbox,
      {
        ...props,
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: boolean) => setState('modelValue', value),
        'data-form-checkbox': '',
        'data-contract-state': 'default',
      },
      () => localize(releaseNotifications, locale),
    ),
});

const releaseChannel = localized('Release channel', '发布通道');
const releaseModes = [
  { value: 'stable', label: localized('Stable', '稳定版') },
  { value: 'preview', label: localized('Preview', '预览版') },
] as const;

function releaseOptions(locale: Locale): RadioGroupProps['options'] {
  return releaseModes.map(({ value, label }) => ({ value, label: localize(label, locale) }));
}

const localizedReleaseModes = { en: releaseOptions('en'), zh: releaseOptions('zh') };
type ReleaseMode = (typeof releaseModes)[number]['value'];

/** The editable RadioGroup specimen */
export const radioGroup = defineSpecimen<
  Pick<RadioGroupProps, 'disabled' | 'readonly' | 'validation'>,
  { modelValue: ReleaseMode }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: 'stable' }),
  controls: {
    props: {
      disabled,
      readonly,
      validation: { kind: 'select', label: validationLabel, options: validationOptions },
    },
    state: { modelValue: { kind: 'select', label: valueLabel, options: releaseModes } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h(UiRadioGroup, {
      ...props,
      modelValue: state.modelValue,
      'onUpdate:modelValue': (value: FormControlValue) => {
        const option = releaseModes.find((entry) => entry.value === value);
        if (option !== undefined) setState('modelValue', option.value);
      },
      name: 'forms-release-channel',
      ariaLabel: localize(releaseChannel, locale),
      options: localizedReleaseModes[locale],
      'data-form-radio-group': '',
      'data-contract-state': 'default',
    }),
});

const autoSync = localized('Automatic synchronization', '自动同步');

/** The editable Switch specimen */
export const switchControl = defineSpecimen<
  Pick<SwitchProps, 'disabled' | 'readonly' | 'validation'>,
  { modelValue: boolean }
>()({
  initialProps: { disabled: false, readonly: false },
  initialState: () => ({ modelValue: true }),
  controls: {
    props: {
      disabled,
      readonly,
      validation: { kind: 'select', label: validationLabel, options: validationOptions },
    },
    state: { modelValue: { kind: 'boolean', label: checkedLabel } },
  },
  stateDisabled: (props) => props.disabled === true || props.readonly === true,
  render: ({ props, state, setState, locale }) =>
    h(
      UiSwitch,
      {
        ...props,
        modelValue: state.modelValue,
        'onUpdate:modelValue': (value: boolean) => setState('modelValue', value),
        'data-form-switch': '',
        'data-contract-state': 'default',
      },
      () => localize(autoSync, locale),
    ),
});

const fieldCopy = {
  email: localized('Email address', '邮箱地址'),
  messages: {
    error: localized('Enter a valid release email.', '请输入有效的版本通知邮箱。'),
    warning: localized(
      'This address only receives preview releases.',
      '此地址仅接收预览版本通知。',
    ),
    success: localized('Release notifications are enabled.', '版本发布通知已启用。'),
  },
};

/** The editable Field specimen */
export const field = defineSpecimen<
  Pick<FieldProps, 'disabled' | 'required' | 'validation'>,
  { value: string }
>()({
  initialProps: { disabled: false, required: true, validation: 'error' },
  initialState: () => ({ value: 'invalid-address' }),
  controls: {
    props: {
      disabled,
      required: { kind: 'boolean', label: localized('Required', '必填') },
      validation: { kind: 'select', label: validationLabel, options: validationOptions },
    },
    state: { value: { kind: 'text', label: valueLabel } },
  },
  stateDisabled: (props) => props.disabled === true,
  render: ({ props, state, setState, locale }) => {
    const validation = props.validation ?? 'none';
    const message =
      validation === 'none' ? undefined : localize(fieldCopy.messages[validation], locale);
    return h(
      UiField,
      {
        ...props,
        class: 'w-full max-w-container-sm',
        controlId: 'forms-validation-error',
        label: localize(fieldCopy.email, locale),
        ...(message === undefined ? {} : { message }),
      },
      {
        default: ({ controlAttrs }: { controlAttrs: FieldControlAttrs }) =>
          h(UiInput, {
            ...controlAttrs,
            modelValue: state.value,
            'onUpdate:modelValue': (value: string) => setState('value', value),
            validation,
            type: 'email',
          }),
      },
    );
  },
});
