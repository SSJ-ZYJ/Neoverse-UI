import { resolve } from 'node:path';
import ts from 'typescript';

interface PropContract {
  name: string;
  vueType: string;
  reactType: string;
  props: readonly string[];
  aliases?: Record<string, readonly [string, string]>;
}

interface UnionContract {
  name: string;
  vueType: string;
  reactType: string;
}

interface FrameworkParityContract {
  schemaVersion: number;
  components: readonly PropContract[];
  dataContracts: readonly PropContract[];
  literalUnions: readonly UnionContract[];
}

interface ComponentMatrix {
  components: readonly {
    name: string;
    track: 'canonical-shared' | 'consumer-driven';
  }[];
}

const root = resolve(import.meta.dir, '..');
const parity = (await Bun.file(
  resolve(root, 'contracts/framework-parity.json'),
).json()) as FrameworkParityContract;
const matrix = (await Bun.file(
  resolve(root, 'contracts/component-matrix.json'),
).json()) as ComponentMatrix;

const vueTypesPath = resolve(root, 'packages/vue/src/types.ts');
const reactIndexPath = resolve(root, 'packages/react/src/index.tsx');
const reactPresencePath = resolve(root, 'packages/react/src/presence.tsx');

const program = ts.createProgram({
  rootNames: [vueTypesPath, reactIndexPath, reactPresencePath],
  options: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    exactOptionalPropertyTypes: true,
  },
});
const checker = program.getTypeChecker();
const errors: string[] = [];

function requireSourceFile(path: string, label: string): ts.SourceFile {
  const source = program.getSourceFile(path);
  if (source === undefined) {
    throw new Error(`${label} source is missing from the TypeScript program.`);
  }
  return source;
}

const vueSources: readonly ts.SourceFile[] = [requireSourceFile(vueTypesPath, 'Vue type')];
const reactSources: readonly ts.SourceFile[] = [
  requireSourceFile(reactIndexPath, 'React index'),
  requireSourceFile(reactPresencePath, 'React presence'),
];

type NamedTypeDeclaration = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;

function findDeclaration(
  framework: 'vue' | 'react',
  name: string,
): NamedTypeDeclaration | undefined {
  const candidates: readonly ts.SourceFile[] = framework === 'vue' ? vueSources : reactSources;

  for (const source of candidates) {
    let found: NamedTypeDeclaration | undefined;
    source.forEachChild((node) => {
      if (
        found === undefined &&
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
        node.name.text === name
      ) {
        found = node;
      }
    });
    if (found !== undefined) return found;
  }

  return undefined;
}

function getType(framework: 'vue' | 'react', name: string): ts.Type | undefined {
  const declaration = findDeclaration(framework, name);
  if (declaration === undefined) {
    errors.push(`${framework}: missing type declaration ${name}`);
    return undefined;
  }

  const symbol = checker.getSymbolAtLocation(declaration.name);
  if (symbol === undefined) {
    errors.push(`${framework}: cannot resolve type symbol ${name}`);
    return undefined;
  }

  return checker.getDeclaredTypeOfSymbol(symbol);
}

function propertyNames(type: ts.Type | undefined): Set<string> {
  if (type === undefined) return new Set();
  return new Set(checker.getPropertiesOfType(type).map((property) => property.getName()));
}

function validateProps(contract: PropContract): void {
  const vueProps = propertyNames(getType('vue', contract.vueType));
  const reactProps = propertyNames(getType('react', contract.reactType));

  for (const property of contract.props) {
    if (!vueProps.has(property)) {
      errors.push(`${contract.name}: Vue ${contract.vueType} is missing semantic prop ${property}`);
    }
    if (!reactProps.has(property)) {
      errors.push(
        `${contract.name}: React ${contract.reactType} is missing semantic prop ${property}`,
      );
    }
  }

  for (const [semanticName, [vueName, reactName]] of Object.entries(contract.aliases ?? {})) {
    if (!vueProps.has(vueName)) {
      errors.push(
        contract.name +
          ': Vue ' +
          contract.vueType +
          ' is missing ' +
          semanticName +
          ' binding ' +
          vueName,
      );
    }
    if (!reactProps.has(reactName)) {
      errors.push(
        contract.name +
          ': React ' +
          contract.reactType +
          ' is missing ' +
          semanticName +
          ' binding ' +
          reactName,
      );
    }
  }
}

function literalValues(type: ts.Type | undefined): string[] {
  if (type === undefined) return [];
  const members = type.isUnion() ? type.types : [type];
  const values: string[] = [];

  for (const member of members) {
    if ((member.flags & ts.TypeFlags.StringLiteral) !== 0) {
      values.push((member as ts.StringLiteralType).value);
      continue;
    }
    if ((member.flags & ts.TypeFlags.NumberLiteral) !== 0) {
      values.push(String((member as ts.NumberLiteralType).value));
      continue;
    }

    return [];
  }

  return values.sort();
}

function validateLiteralUnion(contract: UnionContract): void {
  const vueValues = literalValues(getType('vue', contract.vueType));
  const reactValues = literalValues(getType('react', contract.reactType));

  if (vueValues.length === 0 || reactValues.length === 0) {
    errors.push(`${contract.name}: parity check expects literal union types on both frameworks`);
    return;
  }

  if (vueValues.join('\0') !== reactValues.join('\0')) {
    errors.push(
      contract.name +
        ': literal union mismatch (Vue: ' +
        vueValues.join(', ') +
        '; React: ' +
        reactValues.join(', ') +
        ')',
    );
  }
}

if (parity.schemaVersion !== 1) {
  errors.push(`Unsupported framework parity schemaVersion: ${parity.schemaVersion}`);
}

const canonicalComponents = new Set(
  matrix.components
    .filter((component) => component.track === 'canonical-shared')
    .map((component) => component.name),
);
const parityComponents = new Set(parity.components.map((component) => component.name));

const missingParity = [...canonicalComponents].filter((name) => !parityComponents.has(name)).sort();
const unexpectedParity = [...parityComponents]
  .filter((name) => !canonicalComponents.has(name))
  .sort();

if (missingParity.length > 0) {
  errors.push(`Canonical Shared components missing parity contracts: ${missingParity.join(', ')}`);
}
if (unexpectedParity.length > 0) {
  errors.push(
    `Parity contracts exist for non-canonical components: ${unexpectedParity.join(', ')}`,
  );
}

for (const contract of parity.components) validateProps(contract);
for (const contract of parity.dataContracts) validateProps(contract);
for (const contract of parity.literalUnions) validateLiteralUnion(contract);

if (errors.length > 0) {
  console.error('Framework parity check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  'Framework parity passed for ' +
    parity.components.length +
    ' Canonical Shared components, ' +
    parity.dataContracts.length +
    ' data contracts, and ' +
    parity.literalUnions.length +
    ' literal unions.',
);
