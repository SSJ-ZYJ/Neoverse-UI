import { UiAction } from '@neoverse-ui/react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Locale } from '../playground-content';
import { mountPlaygroundEffects } from '../playground-effects';
import type { ThemeMode } from '../playground-types';
import {
  applyThemeMode,
  isThemeMode,
  observeSystemTheme,
  persistThemeMode,
} from '../theme-runtime';
import { getFixtureCopy } from './fixture-copy';

const SurfaceAndOverlaySection = lazy(() => import('./SurfaceAndOverlaySection'));
const FormContractSection = lazy(() => import('./FormContractSection'));
const DataAndNavigationSection = lazy(() => import('./DataAndNavigationSection'));
const ParityFixturesSection = lazy(() => import('./ParityFixturesSection'));
const ContractOnlySection = lazy(() => import('./ContractOnlySection'));

export default function ReactFixtureApp({
  locale,
  contractMode,
  initialThemeMode,
  rootElement,
}: {
  locale: Locale;
  contractMode: boolean;
  initialThemeMode: ThemeMode;
  rootElement: HTMLElement;
}) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const [dropdownDisabled, setDropdownDisabled] = useState(false);
  const [count, setCount] = useState(0);
  const copy = getFixtureCopy(locale);

  const selectedThemeMode = useCallback((value: string | number) => {
    if (!isThemeMode(value)) return;
    setThemeMode(value);
    applyThemeMode(value);
    persistThemeMode(value);
  }, []);

  const incrementCount = useCallback(() => setCount((value) => value + 1), []);
  const toggleDropdownDisabled = useCallback(() => setDropdownDisabled((value) => !value), []);

  useEffect(() => observeSystemTheme(), []);
  useEffect(() => mountPlaygroundEffects(rootElement), [rootElement]);

  return (
    <main
      id="react-runtime-fixture"
      data-react-runtime-fixture
      className="mx-auto grid min-h-screen w-full max-w-container-xl gap-grid px-gutter-inline py-gutter-block"
    >
      <header className="grid max-w-container-lg gap-2">
        <UiAction
          className="justify-self-start"
          href={`/?lang=${locale}#consumer-parity`}
          size="sm"
          variant="ghost"
          data-react-runtime-return
        >
          {copy.back}
        </UiAction>
        <p className="text-label font-label text-accent-primary">{copy.eyebrow}</p>
        <h1 className="text-heading font-heading tracking-heading text-primary">{copy.title}</h1>
        <p className="text-body text-secondary">{copy.description}</p>
      </header>

      <Suspense fallback={null}>
        <SurfaceAndOverlaySection
          copy={copy}
          contractMode={contractMode}
          dropdownDisabled={dropdownDisabled}
          count={count}
          onIncrement={incrementCount}
        />
        <FormContractSection copy={copy} contractMode={contractMode} />
        <DataAndNavigationSection
          locale={locale}
          copy={copy}
          themeMode={themeMode}
          onThemeChange={selectedThemeMode}
          count={count}
          onIncrement={incrementCount}
        />
        <ParityFixturesSection locale={locale} contractMode={contractMode} copy={copy} />
        {contractMode ? (
          <ContractOnlySection
            onIncrement={incrementCount}
            onToggleDropdownDisabled={toggleDropdownDisabled}
          />
        ) : null}
      </Suspense>
    </main>
  );
}
