import { resolve } from 'node:path';

type Track = 'canonical-shared' | 'consumer-driven';
type Maturity = 'stable' | 'consumer-validation' | 'partial';
type LayerStatus = 'stable' | 'partial' | 'none';
type VisualStatus = 'release' | 'playground' | 'none';
type ConsumerStatus = 'validated' | 'pending' | 'none';
type RuntimeStatus = 'validated' | 'pending' | 'not-applicable';

interface ComponentContract {
  name: string;
  track: Track;
  maturity: Maturity;
  tokens: LayerStatus;
  css: LayerStatus;
  vue: LayerStatus;
  react: LayerStatus;
  unit: LayerStatus;
  runtime: RuntimeStatus;
  visual: VisualStatus;
  consumer: ConsumerStatus;
}

interface ComponentMatrix {
  schemaVersion: number;
  components: ComponentContract[];
}

const root = resolve(import.meta.dir, '..');
const matrixPath = resolve(root, 'contracts/component-matrix.json');
const docsPath = resolve(root, 'docs/component-contract-matrix.md');
const vueIndexPath = resolve(root, 'packages/vue/src/index.ts');
const reactIndexPath = resolve(root, 'packages/react/src/index.tsx');
const reactFixturePath = resolve(root, 'apps/playground/src/react-fixture.tsx');

const matrix = (await Bun.file(matrixPath).json()) as ComponentMatrix;
const vueIndex = await Bun.file(vueIndexPath).text();
const reactIndex = await Bun.file(reactIndexPath).text();
const reactFixture = await Bun.file(reactFixturePath).text();
const docs = await Bun.file(docsPath).text();

const errors: string[] = [];

const layerStatuses = new Set<LayerStatus>(['stable', 'partial', 'none']);
const visualStatuses = new Set<VisualStatus>(['release', 'playground', 'none']);
const consumerStatuses = new Set<ConsumerStatus>(['validated', 'pending', 'none']);
const runtimeStatuses = new Set<RuntimeStatus>(['validated', 'pending', 'not-applicable']);
const tracks = new Set<Track>(['canonical-shared', 'consumer-driven']);
const maturities = new Set<Maturity>(['stable', 'consumer-validation', 'partial']);

const addMatches = (source: string, pattern: RegExp, target: Set<string>): void => {
  for (const match of source.matchAll(pattern)) {
    const name = match[1];
    if (name !== undefined) target.add(name);
  }
};

const vuePublic = new Set<string>();
addMatches(vueIndex, /export\s+\{\s*default\s+as\s+(Ui[A-Za-z0-9]+)\s*\}\s+from/g, vuePublic);

const reactPublic = new Set<string>();
addMatches(reactIndex, /export\s+function\s+(Ui[A-Za-z0-9]+)/g, reactPublic);
if (/export\s+\{\s*UiPresence\s*,/.test(reactIndex)) {
  reactPublic.add('UiPresence');
}

const reactRuntime = new Set<string>();
addMatches(reactFixture, /data-react-adapter=["'](Ui[A-Za-z0-9]+)["']/g, reactRuntime);

const assertSameSet = (label: string, declared: Set<string>, observed: Set<string>): void => {
  const missing = [...declared].filter((name) => !observed.has(name)).sort();
  const unexpected = [...observed].filter((name) => !declared.has(name)).sort();

  if (missing.length > 0) {
    errors.push(`${label} is declared but missing from source/runtime: ${missing.join(', ')}`);
  }
  if (unexpected.length > 0) {
    errors.push(`${label} exists in source/runtime but is not declared: ${unexpected.join(', ')}`);
  }
};

if (matrix.schemaVersion !== 1) {
  errors.push(`Unsupported component matrix schemaVersion: ${matrix.schemaVersion}`);
}

const seen = new Set<string>();
for (const component of matrix.components) {
  if (seen.has(component.name)) {
    errors.push(`Duplicate component matrix entry: ${component.name}`);
  }
  seen.add(component.name);

  if (!tracks.has(component.track)) {
    errors.push(`${component.name}: invalid track ${component.track}`);
  }
  if (!maturities.has(component.maturity)) {
    errors.push(`${component.name}: invalid maturity ${component.maturity}`);
  }

  for (const [layer, status] of [
    ['tokens', component.tokens],
    ['css', component.css],
    ['vue', component.vue],
    ['react', component.react],
    ['unit', component.unit],
  ] as const) {
    if (!layerStatuses.has(status)) {
      errors.push(`${component.name}: invalid ${layer} status ${status}`);
    }
  }

  if (!visualStatuses.has(component.visual)) {
    errors.push(`${component.name}: invalid visual status ${component.visual}`);
  }
  if (!consumerStatuses.has(component.consumer)) {
    errors.push(`${component.name}: invalid consumer status ${component.consumer}`);
  }
  if (!runtimeStatuses.has(component.runtime)) {
    errors.push(`${component.name}: invalid runtime status ${component.runtime}`);
  }

  if (component.track === 'canonical-shared') {
    if (component.vue !== 'stable' || component.react !== 'stable') {
      errors.push(`${component.name}: canonical-shared requires stable Vue and React adapters`);
    }
    if (component.runtime !== 'validated') {
      errors.push(`${component.name}: canonical-shared requires validated React runtime coverage`);
    }
  }

  if (component.vue === 'none' && component.react === 'none') {
    errors.push(`${component.name}: at least one framework adapter must exist`);
  }

  if (component.react === 'none' && component.runtime !== 'not-applicable') {
    errors.push(
      `${component.name}: components without a React adapter must use not-applicable runtime`,
    );
  }

  if (component.react !== 'none' && component.runtime === 'not-applicable') {
    errors.push(`${component.name}: React adapters cannot use not-applicable runtime`);
  }

  if (component.runtime === 'validated' && !reactRuntime.has(component.name)) {
    errors.push(
      `${component.name}: runtime is validated but the React runtime fixture has no marker`,
    );
  }

  if (component.maturity === 'stable') {
    if (
      component.tokens !== 'stable' ||
      component.css !== 'stable' ||
      component.unit !== 'stable' ||
      component.visual !== 'release' ||
      component.consumer !== 'validated'
    ) {
      errors.push(
        `${component.name}: stable maturity requires stable tokens/css/unit, release visual coverage, and validated consumer usage`,
      );
    }
  }

  if (!docs.includes(`| \`${component.name}\` |`)) {
    errors.push(`${component.name}: missing row in docs/component-contract-matrix.md`);
  }
}

const matrixVue = new Set(
  matrix.components
    .filter((component) => component.vue !== 'none')
    .map((component) => component.name),
);
const matrixReact = new Set(
  matrix.components
    .filter((component) => component.react !== 'none')
    .map((component) => component.name),
);
const matrixRuntime = new Set(
  matrix.components
    .filter((component) => component.runtime === 'validated')
    .map((component) => component.name),
);

assertSameSet('Vue public component', matrixVue, vuePublic);
assertSameSet('React public component', matrixReact, reactPublic);
assertSameSet('React runtime adapter', matrixRuntime, reactRuntime);

if (errors.length > 0) {
  console.error('Component contract matrix check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const stableCount = matrix.components.filter((component) => component.maturity === 'stable').length;
const canonicalCount = matrix.components.filter(
  (component) => component.track === 'canonical-shared',
).length;

console.log(
  `Component contract matrix passed for ${matrix.components.length} components (${canonicalCount} canonical, ${stableCount} stable).`,
);
