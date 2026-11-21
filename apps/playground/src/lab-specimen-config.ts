import { computed, shallowReactive, type VNode } from 'vue';
import type { Locale, LocalizedText } from './playground-content';

type Choice = { readonly value: string; readonly label: LocalizedText };
type BooleanControl = { readonly kind: 'boolean' };
type TextControl = { readonly kind: 'text' };
type NumberControl = { readonly kind: 'number'; readonly min: number; readonly max: number };
type SelectControl = { readonly kind: 'select'; readonly options: readonly Choice[] };
type Control = (BooleanControl | TextControl | NumberControl | SelectControl) & {
  readonly label: LocalizedText;
};
type ControlFor<Value> = {
  readonly label: LocalizedText;
} & (boolean extends Value
  ? BooleanControl
  : number extends Value
    ? NumberControl
    : string extends Value
      ? TextControl | SelectControl
      : [Value] extends [string]
        ? { readonly kind: 'select'; readonly options: readonly (Choice & { value: Value })[] }
        : never);
type ControlMap<Values> = {
  readonly [Key in keyof Values]?: ControlFor<Exclude<Values[Key], undefined>>;
};

type Source = 'props' | 'state';

/** A declared editor field bound to the current preview session */
export type SpecimenField = Control & {
  readonly source: Source;
  readonly key: string;
  readonly value: unknown;
  readonly edited: boolean;
  readonly inherits: boolean;
  readonly disabled: boolean;
};

/** One disposable preview instance and its Inspector bindings */
export interface SpecimenSession {
  readonly fields: readonly SpecimenField[];
  readonly note: LocalizedText | undefined;
  render(locale: Locale): VNode;
  edit(source: Source, key: string, value: unknown): boolean;
  reset(): void;
}

/** A registered specimen that can open an editable, resettable preview session */
export interface SpecimenDefinition {
  createSession(): SpecimenSession;
}

/** A focused renderer, or the existing definition that opens its editable session */
export type FocusedPreview = ((locale: Locale) => VNode) | SpecimenDefinition;

interface RenderContext<Props, State> {
  readonly locale: Locale;
  readonly props: Readonly<Partial<Props>>;
  readonly state: Readonly<State>;
  setState<Key extends keyof State>(key: Key, value: State[Key]): void;
}

interface Configuration<Props, State> {
  readonly initialProps: Readonly<Partial<Props>>;
  readonly initialState: () => State;
  readonly controls: { readonly props?: ControlMap<Props>; readonly state?: ControlMap<State> };
  readonly note?: LocalizedText;
  readonly stateDisabled?: (props: Readonly<Partial<Props>>, key: keyof State) => boolean;
  render(context: RenderContext<Props, State>): VNode;
}

type BoundField = SpecimenField & { write(value: unknown): boolean };

function accepts(control: Control, value: unknown): boolean {
  switch (control.kind) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'text':
      return typeof value === 'string';
    case 'number':
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= control.min &&
        value <= control.max
      );
    case 'select':
      return control.options.some((option) => option.value === value);
  }
}

function bindFields<Values extends object>(
  source: Source,
  controls: ControlMap<Values> | undefined,
  initial: Readonly<Partial<Values>>,
  values: Partial<Values>,
  disabled?: (key: keyof Values) => boolean,
): BoundField[] {
  const fields: BoundField[] = [];
  for (const key in controls) {
    const control: Control | undefined = controls[key];
    if (control === undefined || !Object.hasOwn(controls, key)) continue;
    const inherits = source === 'props' && initial[key] === undefined;
    fields.push({
      ...control,
      source,
      key,
      inherits,
      get value() {
        return source === 'props' ? (values[key] ?? initial[key]) : values[key];
      },
      get edited() {
        const value = values[key];
        return source === 'props' ? value !== undefined : !Object.is(value, initial[key]);
      },
      get disabled() {
        return disabled?.(key) ?? false;
      },
      write(value) {
        if (disabled?.(key)) return false;
        if (value === undefined ? !inherits : !accepts(control, value)) return false;
        if (source === 'props' && Object.is(initial[key], value)) {
          delete values[key];
        } else {
          // The mapped descriptor binds this key to the value domain checked above.
          values[key] = value as Values[typeof key];
        }
        return true;
      },
    });
  }
  return fields;
}

/** Bind editable keys and choices to the public props and specimen-owned state types */
export function defineSpecimen<
  Props extends object,
  State extends object = Record<never, never>,
>() {
  return (configuration: Configuration<Props, State>): SpecimenDefinition => ({
    createSession() {
      const { initialProps, controls } = configuration;
      const initialState = configuration.initialState();
      const overrides = shallowReactive<Partial<Props>>({});
      const props = computed(() => ({ ...initialProps, ...overrides }));
      const state = shallowReactive({ ...initialState });
      const fields = [
        ...bindFields('props', controls.props, initialProps, overrides),
        ...bindFields(
          'state',
          controls.state,
          initialState,
          state,
          (key) => configuration.stateDisabled?.(props.value, key) ?? false,
        ),
      ];
      function setState<Key extends keyof State>(key: Key, value: State[Key]): void {
        if (Object.hasOwn(initialState, key)) state[key] = value;
      }
      return {
        fields,
        note: configuration.note,
        render: (locale) => configuration.render({ locale, props: props.value, state, setState }),
        edit(source, key, value) {
          const field = fields.find((entry) => entry.source === source && entry.key === key);
          return field?.write(value) ?? false;
        },
        reset() {
          for (const key in overrides) delete overrides[key];
          Object.assign(state, initialState);
        },
      };
    },
  });
}
