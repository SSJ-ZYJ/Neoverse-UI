import {
  UiAction,
  UiBreadcrumb,
  UiButton,
  UiDisclosure,
  UiDock,
  UiField,
  UiPresence,
  UiSegmentedControl,
  UiSurface,
  UiTable,
} from '@neoverse-ui/react';
import { useState } from 'react';
import { appCopy, type Locale, localize } from '../playground-content';
import type { ThemeMode } from '../playground-types';
import { createThemeOptions, type FixtureCopy } from './fixture-copy';

export default function DataAndNavigationSection({
  locale,
  copy,
  themeMode,
  onThemeChange,
  count,
  onIncrement,
}: {
  locale: Locale;
  copy: FixtureCopy;
  themeMode: ThemeMode;
  onThemeChange: (value: string | number) => void;
  count: number;
  onIncrement: () => void;
}) {
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [compactDock, setCompactDock] = useState(false);
  const [showTrailing, setShowTrailing] = useState(true);
  const [breadcrumbCurrent, setBreadcrumbCurrent] = useState(2);

  const breadcrumbItems = [
    {
      id: 'home',
      label: copy.home,
      href: '#react-navigation-home',
      current: breadcrumbCurrent === 0,
    },
    {
      id: 'docs',
      label: copy.docs,
      href: '#react-navigation-docs',
      current: breadcrumbCurrent === 1,
    },
    { id: 'chapter', label: copy.currentPage, current: breadcrumbCurrent === 2 },
  ];

  const themeOptions = createThemeOptions(locale).map((option) => ({
    value: option.value,
    label: option.label,
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={option.path} />
      </svg>
    ),
  }));

  return (
    <>
      <UiSurface surface="glass-subtle" className="grid gap-4 rounded-card p-4">
        <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.data}</h2>

        <UiTable caption={copy.table} data-react-adapter="UiTable">
          <thead>
            <tr>
              <th scope="col">{copy.component}</th>
              <th scope="col">{copy.state}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>React runtime</td>
              <td>{copy.ready}</td>
            </tr>
          </tbody>
        </UiTable>

        <UiDisclosure summary={copy.disclosure} data-react-adapter="UiDisclosure">
          <p className="text-body-sm text-secondary">{copy.disclosureBody}</p>
        </UiDisclosure>

        <div className="flex flex-wrap items-center gap-2">
          <UiButton
            size="sm"
            variant="secondary"
            data-react-presence-toggle
            onClick={() => setPresenceVisible((value) => !value)}
          >
            {presenceVisible ? copy.presenceHide : copy.presenceShow}
          </UiButton>

          <UiPresence
            show={presenceVisible}
            variant="pop"
            origin="start"
            className="rounded-control px-3 py-2 text-body-sm text-primary"
            data-react-adapter="UiPresence"
          >
            {copy.presence}
          </UiPresence>
        </div>
      </UiSurface>

      <UiSurface
        surface="glass-subtle"
        className="grid min-w-0 gap-4 rounded-card p-4"
        data-react-navigation-fixture
      >
        <h2 className="text-subtitle font-heading tracking-heading text-primary">
          {copy.navigation}
        </h2>
        <UiBreadcrumb
          items={breadcrumbItems}
          ariaLabel={copy.breadcrumb}
          data-react-adapter="UiBreadcrumb"
          data-navigation="default"
        />
        <UiBreadcrumb
          items={breadcrumbItems}
          ariaLabel={copy.breadcrumb}
          separator={<span>/</span>}
          data-navigation="custom"
          renderItem={({ item, index, current }) => (
            <a
              href={item.href ?? '#react-navigation-chapter'}
              aria-current={current ? 'page' : undefined}
              data-breadcrumb-index={index}
            >
              {item.label}
            </a>
          )}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-x-auto">
          <UiDock
            aria-label={copy.dock}
            scale="md"
            compact={compactDock}
            edgeMode="local"
            className="max-w-none flex-none"
            data-react-adapter="UiDock"
            trailing={
              showTrailing ? (
                <UiButton size="sm" surface="none" onClick={onIncrement}>
                  {copy.count} {count}
                </UiButton>
              ) : null
            }
          >
            <UiAction href="#react-navigation-home" size="sm" surface="none" variant="ghost">
              {copy.home}
            </UiAction>
            <UiAction href="#react-navigation-docs" size="sm" surface="none" variant="ghost">
              {copy.docs}
            </UiAction>
          </UiDock>
          <UiDock as="div" scale="md" surface="none" data-dock-div>
            <UiAction href="#react-navigation-home" size="sm" surface="none" variant="ghost">
              {copy.home}
            </UiAction>
          </UiDock>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UiButton
            size="sm"
            data-dock-compact-toggle
            onClick={() => setCompactDock((value) => !value)}
          >
            {copy.compact}
          </UiButton>
          <UiButton
            size="sm"
            data-dock-trailing-toggle
            onClick={() => setShowTrailing((value) => !value)}
          >
            {copy.trailing}
          </UiButton>
          <UiButton
            size="sm"
            data-breadcrumb-toggle
            onClick={() => setBreadcrumbCurrent((value) => (value + 1) % 3)}
          >
            {copy.nextPage}
          </UiButton>
        </div>
      </UiSurface>

      <UiSurface surface="glass-subtle" className="grid min-w-0 gap-3 rounded-card p-4">
        <UiField label={localize(appCopy.theme.label, locale)} className="w-fit">
          <UiSegmentedControl
            variant="icon"
            value={themeMode}
            options={themeOptions}
            ariaLabel={localize(appCopy.theme.label, locale)}
            onValueChange={onThemeChange}
            data-react-theme-control
          />
        </UiField>
      </UiSurface>
    </>
  );
}
