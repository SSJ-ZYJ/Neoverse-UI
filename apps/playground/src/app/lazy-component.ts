import { type Component, defineAsyncComponent, defineComponent, h } from 'vue';

type Loader<T extends Component> = () => Promise<{ default: T }>;

const componentLoaders = new WeakMap<object, () => Promise<void>>();
const previewLoaders = new WeakMap<object, () => Promise<void>>();

/**
 * Defer loading a Playground view, module, or preview until needed, while
 * rendering synchronously once its chunk has been preloaded.
 */
export function lazyComponent<T extends Component>(loader: Loader<T>): T {
  let pending: Promise<Component> | undefined;
  let cached: Component | undefined;

  const load = (): Promise<Component> => {
    if (cached !== undefined) return Promise.resolve(cached);
    pending ??= loader().then((module) => {
      cached = module.default;
      return cached;
    });
    return pending;
  };

  const asyncComponent = defineAsyncComponent(load);
  const wrapper = defineComponent({
    name: 'LazyComponent',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const target = cached ?? asyncComponent;
      return () => h(target, { ...attrs }, slots);
    },
  });

  componentLoaders.set(wrapper, async () => {
    await load();
  });
  return wrapper as unknown as T;
}

/** Resolve a lazy component chunk ahead of mounting so initial views paint synchronously. */
export async function preloadComponent(component: Component | undefined): Promise<void> {
  if (component === undefined) return;
  await componentLoaders.get(component)?.();
}

/** Associate lazy components with a specimen preview so deep links preload ahead of mount. */
export function withPreload<T extends object>(
  preview: T,
  components: Component | readonly Component[],
): T {
  const targets: readonly Component[] = Array.isArray(components) ? components : [components];
  previewLoaders.set(preview, async () => {
    await Promise.all(targets.map((component) => preloadComponent(component)));
  });
  return preview;
}

/** Resolve any lazy chunks registered for a focused specimen preview. */
export async function preloadPreview(preview: object | undefined): Promise<void> {
  if (preview === undefined) return;
  await previewLoaders.get(preview)?.();
}
