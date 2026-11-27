import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  collectComponentCssIssues,
  collectMissingAdapterSelectors,
} from './contract-checks/adapter-selectors.ts';
import {
  expectedButtonFragments,
  expectedFragments,
  expectedNavigationMotionFragments,
  expectedProseFragments,
  expectedTooltipFragments,
  forbiddenButtonFragments,
  forbiddenNestedGlassFragments,
  forbiddenWebglFragments,
} from './contract-checks/expected-fragments.ts';
import { expectedSelectors, forbiddenSelectors } from './contract-checks/expected-selectors.ts';
import { expectedValues } from './contract-checks/expected-values.ts';

const output = new URL('../dist/contract.css', import.meta.url);
const buttonSource = new URL('../src/components/controls/button.css', import.meta.url);
const navigationItemSource = new URL(
  '../src/components/navigation/navigation-item.css',
  import.meta.url,
);
const tooltipSource = new URL('../src/components/overlays/tooltip.css', import.meta.url);
const componentsOutput = new URL('../dist/components.css', import.meta.url);
const proseOutput = new URL('../dist/prose.css', import.meta.url);

try {
  const [css, buttonCss, navigationItemCss, tooltipCss, flattenedComponentsCss, proseCss] =
    await Promise.all([
      Bun.file(output).text(),
      Bun.file(buttonSource).text(),
      Bun.file(navigationItemSource).text(),
      Bun.file(tooltipSource).text(),
      Bun.file(componentsOutput).text(),
      Bun.file(proseOutput).text(),
    ]);

  const missingAdapterSelectors = await collectMissingAdapterSelectors(
    flattenedComponentsCss,
    css,
    import.meta.url,
  );
  const componentSourceDirectory = fileURLToPath(new URL('../src/components/', import.meta.url));
  const { malformedComponentSelectors, hardcodedGeometryLiterals } =
    await collectComponentCssIssues(componentSourceDirectory);

  const missingSelectors = expectedSelectors.filter((selector) => !css.includes(selector));
  const emittedForbiddenSelectors = forbiddenSelectors.filter((selector) => css.includes(selector));
  const missingValues = expectedValues.filter((value) => !css.includes(value));
  const missingFragments = expectedFragments.filter((fragment) => !css.includes(fragment));
  const emittedForbiddenNestedGlassFragments = forbiddenNestedGlassFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const emittedForbiddenWebglFragments = forbiddenWebglFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const missingButtonFragments = expectedButtonFragments.filter(
    (fragment) => !buttonCss.includes(fragment),
  );
  const emittedForbiddenButtonFragments = forbiddenButtonFragments.filter((fragment) =>
    buttonCss.includes(fragment),
  );
  const missingProseFragments = expectedProseFragments.filter(
    (fragment) => !proseCss.includes(fragment),
  );
  const missingNavigationMotionFragments = expectedNavigationMotionFragments.filter(
    (fragment) => !navigationItemCss.includes(fragment),
  );
  const missingTooltipFragments = expectedTooltipFragments.filter(
    (fragment) => !tooltipCss.includes(fragment),
  );

  const details = [
    missingSelectors.length > 0 ? `Missing selectors: ${missingSelectors.join(', ')}` : '',
    emittedForbiddenSelectors.length > 0
      ? `Forbidden selectors emitted: ${emittedForbiddenSelectors.join(', ')}`
      : '',
    missingValues.length > 0 ? `Missing token references: ${missingValues.join(', ')}` : '',
    missingFragments.length > 0 ? `Missing CSS fragments: ${missingFragments.join(', ')}` : '',
    emittedForbiddenNestedGlassFragments.length > 0
      ? `Forbidden nested Glass material fragments: ${emittedForbiddenNestedGlassFragments.join(', ')}`
      : '',
    emittedForbiddenWebglFragments.length > 0
      ? `Forbidden WebGL material fragments: ${emittedForbiddenWebglFragments.join(', ')}`
      : '',
    missingButtonFragments.length > 0
      ? `Missing button edge fragments: ${missingButtonFragments.join(', ')}`
      : '',
    emittedForbiddenButtonFragments.length > 0
      ? `Forbidden button edge fragments: ${emittedForbiddenButtonFragments.join(', ')}`
      : '',
    missingProseFragments.length > 0
      ? `Missing prose semantic fragments: ${missingProseFragments.join(', ')}`
      : '',
    missingNavigationMotionFragments.length > 0
      ? `Missing navigation motion fragments: ${missingNavigationMotionFragments.join(', ')}`
      : '',
    missingTooltipFragments.length > 0
      ? `Missing tooltip Glass fragments: ${missingTooltipFragments.join(', ')}`
      : '',
    missingAdapterSelectors.length > 0
      ? `Adapter classes without component CSS selectors: ${missingAdapterSelectors.join(', ')}`
      : '',
    malformedComponentSelectors.length > 0
      ? `Malformed duplicated component selectors: ${malformedComponentSelectors.join(', ')}`
      : '',
    hardcodedGeometryLiterals.length > 0
      ? `Hard-coded rem/px geometry in component CSS: ${hardcodedGeometryLiterals.join(', ')}`
      : '',
    flattenedComponentsCss.includes('@import')
      ? 'Compiled component CSS still contains source imports'
      : '',
    !proseCss.includes('.neoverse-prose')
      ? 'Public prose CSS entry is missing .neoverse-prose'
      : '',
    proseCss.includes('@import') ? 'Public prose CSS entry still contains source imports' : '',
  ].filter(Boolean);

  if (details.length > 0) {
    throw new Error(['Tailwind semantic contract failed:', ...details].join('\n'));
  }

  console.log(`Tailwind semantic contract passed with ${expectedSelectors.length} selectors.`);
} finally {
  await rm(output, { force: true });
}
