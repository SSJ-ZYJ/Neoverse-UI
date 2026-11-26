import type { Locale } from './playground-content';
import { readStageMaterial } from './stage-background';
import { applyThemeMode, resolveInitialThemeMode } from './theme-runtime';

const locale: Locale =
  new URLSearchParams(window.location.search).get('lang') === 'zh' ? 'zh' : 'en';
const contractMode = new URLSearchParams(window.location.search).has('contract-fixtures');
document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';

/* The fixture resolves its theme with the same engine as the Design Lab shell:
   query parameter, then the shared preference record, then the system default.
   The server already renders the matching `data-theme`, so this first
   application is a no-op for deep links and only matters for stored modes. */
const initialThemeMode = resolveInitialThemeMode();
applyThemeMode(initialThemeMode, false);

const root = document.getElementById('react-root');
if (root === null) {
  throw new Error('React fixture root is missing.');
}
const material = readStageMaterial(window.location.search);
if (material) root.dataset.neoverseMaterial = material;

void Promise.all([import('react-dom/client'), import('./react-fixture/ReactFixtureApp')]).then(
  ([{ createRoot }, { default: ReactFixtureApp }]) => {
    createRoot(root).render(
      <ReactFixtureApp
        locale={locale}
        contractMode={contractMode}
        initialThemeMode={initialThemeMode}
        rootElement={root}
      />,
    );
  },
);
