import { computed, shallowReactive, shallowRef, type VNode } from 'vue';
import type { Locale, LocalizedText } from './playground-content';

type Choice = { readonly value: string; readonly label: LocalizedText };
type BooleanControl = { readonly kind: 'boolean' };
type TextControl = { readonly kind: 'text' };
type NumberControl = { readonly kind: 'number'; readonly min: number; readonly max: number };
type SelectControl = { readonly kind: 'select'; readonly options: readonly Choice[] };
type ControlLabel = {
  readonly label: LocalizedText;
  readonly group?: 'layout' | 'appearance' | 'content' | 'interaction';
};
type Control = (BooleanControl | TextControl | NumberControl | SelectControl) & ControlLabel;
type ControlFor<Value> = ControlLabel &
  (boolean extends Value
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
  readonly source: Source | 'preset';
  readonly key: string;
  readonly value: unknown;
  readonly edited: boolean;
  readonly inherits: boolean;
  readonly disabled: boolean;
  readonly visible: boolean;
};

/** One disposable preview instance and its Inspector bindings */
export interface SpecimenSession {
  readonly fields: readonly SpecimenField[];
  readonly note: LocalizedText | undefined;
  render(locale: Locale): VNode;
  edit(source: SpecimenField['source'], key: string, value: unknown): boolean;
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
  readonly stateVisible?: (props: Readonly<Partial<Props>>, key: keyof State) => boolean;
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
  readInitial: () => Readonly<Partial<Values>>,
  readValues: () => Partial<Values>,
  disabled?: (key: keyof Values) => boolean,
  visible?: (key: keyof Values) => boolean,
): BoundField[] {
  const fields: BoundField[] = [];
  for (const key in controls) {
    const control: Control | undefined = controls[key];
    if (control === undefined || !Object.hasOwn(controls, key)) continue;
    const inherits = () => source === 'props' && readInitial()[key] === undefined;
    fields.push({
      ...control,
      source,
      key,
      get inherits() {
        return inherits();
      },
      get value() {
        const value = readValues()[key];
        return source === 'props' ? (value ?? readInitial()[key]) : value;
      },
      get edited() {
        const value = readValues()[key];
        return source === 'props' ? value !== undefined : !Object.is(value, readInitial()[key]);
      },
      get disabled() {
        return disabled?.(key) ?? false;
      },
      get visible() {
        return visible?.(key) ?? true;
      },
      write(value) {
        if (disabled?.(key)) return false;
        if (value === undefined ? !inherits() : !accepts(control, value)) return false;
        const initial = readInitial();
        const values = readValues();
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
        ...bindFields(
          'props',
          controls.props,
          () => initialProps,
          () => overrides,
        ),
        ...bindFields(
          'state',
          controls.state,
          () => initialState,
          () => state,
          (key) => configuration.stateDisabled?.(props.value, key) ?? false,
          (key) => configuration.stateVisible?.(props.value, key) ?? true,
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

/** A named, complete baseline for one scene's configuration and controlled state */
export interface CompositionPreset<Id extends string, Props, State> {
  readonly id: Id;
  readonly label: LocalizedText;
  readonly props: Readonly<Props>;
  readonly state: Readonly<State>;
}

interface CompositionConfiguration<Id extends string, Props, State> {
  readonly presets: readonly [
    CompositionPreset<Id, Props, State>,
    ...CompositionPreset<Id, Props, State>[],
  ];
  readonly controls: {
    readonly props: Required<ControlMap<Props>>;
    readonly state: Required<ControlMap<State>>;
  };
  render(context: RenderContext<Props, State> & { readonly props: Readonly<Props> }): VNode;
}

function validatePresetValues<Values extends object>(
  id: string,
  controls: Required<ControlMap<Values>>,
  values: Readonly<Values>,
): void {
  for (const key in controls) {
    const control: Control | undefined = controls[key];
    if (!control || !Object.hasOwn(values, key) || !accepts(control, values[key])) {
      throw new Error(`Invalid preset ${id}: ${key}`);
    }
  }
  for (const key of Object.keys(values)) {
    if (!Object.hasOwn(controls, key)) throw new Error(`Undeclared preset field ${id}: ${key}`);
  }
}

/** Open a specimen session whose complete baseline can change without remounting the scene */
export function defineComposition<
  Props extends object,
  State extends object = Record<never, never>,
>() {
  return <const Id extends string>({
    presets,
    controls,
    render,
  }: CompositionConfiguration<Id, Props, State>): SpecimenDefinition => {
    type Preset = CompositionPreset<Id, Props, State>;
    const byId = new Map<string, Preset>();
    function register({ id, label, props, state }: Preset): Preset {
      if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid preset ID: ${id}`);
      if (byId.has(id)) throw new Error(`Duplicate preset ID: ${id}`);
      validatePresetValues(id, controls.props, props);
      validatePresetValues(id, controls.state, state);
      const preset = Object.freeze({
        id,
        label: Object.freeze({ ...label }),
        props: Object.freeze({ ...props }),
        state: Object.freeze({ ...state }),
      });
      byId.set(id, preset);
      return preset;
    }
    const [first, ...others] = presets;
    const initialPreset = register(first);
    for (const preset of others) register(preset);
    const options = Object.freeze(
      Array.from(byId.values(), ({ id, label }) => Object.freeze({ value: id, label })),
    );

    function open(preset: Preset) {
      return {
        preset,
        overrides: shallowReactive<Partial<Props>>({}),
        state: shallowReactive({ ...preset.state }) as State,
      };
    }

    return {
      createSession() {
        // A preset and both editable layers always change together.
        const current = shallowRef(open(initialPreset));
        const props = computed(() => ({
          ...current.value.preset.props,
          ...current.value.overrides,
        }));
        const fields: BoundField[] = [
          {
            source: 'preset',
            key: 'preset',
            kind: 'select',
            label: { en: 'Preset', zh: '场景预设' },
            options,
            get value() {
              return current.value.preset.id;
            },
            edited: false,
            inherits: false,
            disabled: false,
            visible: true,
            write(value) {
              const preset = typeof value === 'string' ? byId.get(value) : undefined;
              if (!preset) return false;
              current.value = open(preset);
              return true;
            },
          },
          ...bindFields(
            'props',
            controls.props,
            () => current.value.preset.props,
            () => current.value.overrides,
          ),
          ...bindFields(
            'state',
            controls.state,
            () => current.value.preset.state,
            () => current.value.state,
          ),
        ];
        function edit(source: SpecimenField['source'], key: string, value: unknown): boolean {
          return (
            fields.find((field) => field.source === source && field.key === key)?.write(value) ??
            false
          );
        }
        function setState<Key extends keyof State>(key: Key, value: State[Key]): void {
          if (typeof key === 'string') edit('state', key, value);
        }
        return {
          fields,
          note: undefined,
          render: (locale) =>
            render({ locale, props: props.value, state: current.value.state, setState }),
          edit,
          reset() {
            current.value = open(current.value.preset);
          },
        };
      },
    };
  };
}
