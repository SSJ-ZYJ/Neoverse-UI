import { expect, test } from 'bun:test';
import { Children, createElement, type ReactElement, type ReactNode } from 'react';

import {
  UiAction,
  UiBreadcrumb,
  UiButton,
  UiCard,
  UiDock,
  UiIconButton,
  UiNotice,
  UiSurface,
  uiActionClassName,
} from './index.js';

type TestElement = ReactElement<{ children?: ReactNode; [key: string]: unknown }>;

test('builds the canonical secondary action contract', () => {
  const classes = uiActionClassName({ variant: 'secondary', size: 'sm', surface: 'glass-subtle' });

  expect(classes).toContain('ui-button');
  expect(classes).toContain('ui-action');
  expect(classes).toContain('ui-button--secondary');
  expect(classes).toContain('ui-action--sm');
  expect(classes).toContain('material-glass-subtle');
  expect(classes).not.toContain('focus-visible:');
});

test('keeps consumer layout classes additive instead of replacing the contract', () => {
  const classes = uiActionClassName({ className: 'docs-specific-layout' });

  expect(classes).toContain('ui-button--primary');
  expect(classes).toContain('docs-specific-layout');
});

test('surface can explicitly own a nested Glass material plane', () => {
  const defaultSurface = UiSurface({ surface: 'glass-card' });
  expect(defaultSurface.props['data-neoverse-glass-nesting']).toBe('local');

  const surface = UiSurface({
    surface: 'glass-subtle',
    glassNesting: 'local',
    contentOverflow: 'visible',
  });

  expect(surface.props['data-surface']).toBe('glass-subtle');
  expect(surface.props['data-neoverse-glass-nesting']).toBe('local');
  expect(surface.props['data-neoverse-surface-overflow']).toBe('visible');
  expect(surface.props.className).toContain('material-glass-subtle');

  const inheritedSurface = UiSurface({ surface: 'glass-subtle', glassNesting: 'inherit' });
  expect(inheritedSurface.props['data-neoverse-glass-nesting']).toBe('inherit');
});

test('dock exposes the shared shell without owning product navigation data', () => {
  const dock = UiDock({
    'aria-label': 'Primary navigation',
    compact: true,
    children: 'Navigation',
    trailing: 'Language',
  });

  expect(dock.type).toBe('nav');
  expect(dock.props['aria-label']).toBe('Primary navigation');
  expect(dock.props['data-surface']).toBe('chrome');
  expect(dock.props['data-neoverse-surface-hover']).toBe('static');
  expect(dock.props.className).toContain('ui-dock');
  expect(dock.props.className).toContain('ui-dock--compact');
  expect(dock.props.className).toContain('ui-control-surface--scale-lg');
  const children = Children.toArray(
    (dock.props as unknown as { children: ReactNode }).children,
  ) as TestElement[];
  expect(children[0]?.props.className).toContain('ui-control-surface__group--primary');
  expect(children[1]?.props.className).toBe('ui-control-surface__divider');
  expect(children[2]?.props.className).toContain('ui-control-surface__group--trailing');
});

test('native button preserves refs, events, form attributes and explicit busy state', () => {
  const ref = { current: null };
  const onClick = () => undefined;
  const element = UiButton({ ref, onClick, name: 'copy', 'aria-busy': false, children: 'Copy' });
  expect(element.type).toBe('button');
  expect(element.props.ref).toBe(ref);
  expect(element.props.onClick).toBe(onClick);
  expect(element.props.name).toBe('copy');
  expect(element.props.type).toBe('button');
  expect(element.props['aria-busy']).toBe(false);
  expect(element.props.disabled).toBe(false);
});

test('loading disables native activation without losing the label or submit semantics', () => {
  const element = UiButton({ loading: true, type: 'submit', children: 'Save' });
  expect(element.props.disabled).toBe(true);
  expect(element.props['aria-busy']).toBe(true);
  expect(element.props.type).toBe('submit');
  const children = Children.toArray(element.props.children) as TestElement[];
  expect(children[2]?.props.children).toBe('Save');
  expect(UiButton({ disabled: true }).props.disabled).toBe(true);
});

test('notice preserves native attributes and composes variant, content, and action', () => {
  const onClick = () => undefined;
  const notice = UiNotice({
    as: 'aside',
    variant: 'warning',
    id: 'migration-note',
    className: 'docs-callout',
    onClick,
    children: 'Read before continuing',
    action: 'Review',
  });

  expect(notice.type).toBe('aside');
  expect(notice.props.id).toBe('migration-note');
  expect(notice.props.onClick).toBe(onClick);
  expect(notice.props.className).toBe('ui-notice ui-notice--warning docs-callout');
  const noticeChildren = (notice.props as unknown as { children: ReactElement[] }).children;
  expect(noticeChildren[0]?.props).toEqual({
    className: 'ui-notice__content',
    children: 'Read before continuing',
  });
  expect(noticeChildren[1]?.props).toEqual({
    className: 'ui-notice__action',
    children: 'Review',
  });
});

test('notice defaults to a neutral div and omits an empty action region', () => {
  const notice = UiNotice({ children: 'Details' });

  expect(notice.type).toBe('div');
  expect(notice.props.className).toBe('ui-notice ui-notice--neutral');
  expect((notice.props as unknown as { children: ReactElement[] }).children[1]).toBeNull();
});
test('icon button preserves its native attributes and requires an accessible label', () => {
  const onClick = () => undefined;
  const button = UiIconButton({
    label: 'Open settings',
    variant: 'ghost',
    size: 'sm',
    surface: 'none',
    name: 'settings',
    onClick,
    children: 'gear',
  });

  expect(button.type).toBe('button');
  expect(button.props.type).toBe('button');
  expect(button.props['aria-label']).toBe('Open settings');
  expect(button.props.onClick).toBe(onClick);
  expect(button.props.name).toBe('settings');
  expect(button.props.disabled).toBe(false);
  expect(button.props['data-surface']).toBe('none');
  expect(button.props.className).toContain('ui-icon-button--sm');
  expect(button.props.className).toContain('ui-icon-button');
  expect(button.props.className).toContain('ui-button--ghost');
  const buttonContent = (button.props as unknown as { children: ReactElement }).children;
  const children = (buttonContent.props as unknown as { children: ReactElement[] }).children;
  expect(children[1]?.props).toEqual({
    className: 'ui-icon-button__content',
    'aria-hidden': 'true',
    children: 'gear',
  });
});

test('icon button loading and disabled links retain correct native activation semantics', () => {
  const loadingButton = UiIconButton({ label: 'Refresh', loading: true, children: 'refresh' });
  expect(loadingButton.props.disabled).toBe(true);
  expect(loadingButton.props['aria-busy']).toBe(true);

  const link = UiIconButton({
    as: 'a',
    href: '/settings',
    label: 'Settings',
    target: '_blank',
    rel: 'noreferrer',
    children: 'gear',
  });
  expect(link.type).toBe('a');
  expect(link.props.href).toBe('/settings');
  expect(link.props.target).toBe('_blank');
  expect(link.props.rel).toBe('noreferrer');
  expect(link.props['aria-label']).toBe('Settings');

  let prevented = false;
  let stopped = false;
  const disabledLink = UiIconButton({
    as: 'a',
    href: '/settings',
    label: 'Settings',
    disabled: true,
    children: 'gear',
    onClick: () => {
      throw new Error('disabled link handlers must not run');
    },
  });
  disabledLink.props.onClick({
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {
      stopped = true;
    },
  } as unknown as MouseEvent);
  expect(disabledLink.props.href).toBeUndefined();
  expect(disabledLink.props['aria-disabled']).toBe(true);
  expect(disabledLink.props.tabIndex).toBe(-1);
  expect(prevented).toBe(true);
  expect(stopped).toBe(true);
});

test('action uses the shared semantic geometry and blocks disabled link activation', () => {
  const onClick = () => {
    throw new Error('disabled actions must not invoke handlers');
  };
  const action = UiAction({
    href: '/docs',
    size: 'lg',
    disabled: true,
    onClick,
    children: 'Read docs',
  });

  expect(action.type).toBe('a');
  expect(action.props.className).toContain('ui-action--lg');
  expect(action.props.className).not.toContain('px-4');
  expect(action.props.href).toBeUndefined();
  expect(action.props['aria-disabled']).toBe(true);

  let prevented = false;
  action.props.onClick({
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => undefined,
  } as unknown as MouseEvent);
  expect(prevented).toBe(true);
});
test('breadcrumb mirrors the native route hierarchy contract and resolves one current item', () => {
  const breadcrumb = UiBreadcrumb({
    ariaLabel: 'Documentation breadcrumb',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Docs', href: '/docs' },
      { label: 'Navigation' },
    ],
  });

  expect(breadcrumb.type).toBe('nav');
  expect(breadcrumb.props['aria-label']).toBe('Documentation breadcrumb');
  expect(breadcrumb.props.className).toBe('ui-breadcrumb');

  const list = breadcrumb.props.children as TestElement;
  expect(list.type).toBe('ol');
  const items = Children.toArray(list.props.children) as TestElement[];
  expect(items).toHaveLength(3);

  const homeContent = Children.toArray(items[0]?.props.children)[0] as TestElement;
  expect(homeContent.type).toBe('a');
  expect(homeContent.props.href).toBe('/');

  const currentContent = Children.toArray(items[2]?.props.children)[1] as TestElement;
  expect(currentContent.type).toBe('span');
  expect(currentContent.props['aria-current']).toBe('page');
  expect(currentContent.props.children).toBe('Navigation');
});

test('breadcrumb explicit current state wins and the custom renderer receives resolved state', () => {
  const states: Array<{ label: string; current: boolean }> = [];
  const breadcrumb = UiBreadcrumb({
    items: [
      { label: 'Home', current: true },
      { label: 'Docs', href: '/docs' },
    ],
    separator: '/',
    renderItem: ({ item, current }) => {
      states.push({ label: item.label, current });
      return createElement('span', { 'data-router-item': item.label }, item.label);
    },
  });

  expect(states).toEqual([
    { label: 'Home', current: true },
    { label: 'Docs', current: false },
  ]);

  const list = breadcrumb.props.children as TestElement;
  const items = Children.toArray(list.props.children) as TestElement[];
  const secondChildren = Children.toArray(items[1]?.props.children) as TestElement[];
  expect(secondChildren[0]?.props.children).toBe('/');
  expect(secondChildren[1]?.props['data-router-item']).toBe('Docs');
});

test('card keeps consumer root semantics and composes the shared surface', () => {
  const defaultCard = UiCard({
    children: 'Default card',
  });
  expect(defaultCard.props['data-surface']).toBe('glass-card');
  expect(defaultCard.props.className).toContain('material-glass-card');

  const article = UiCard<'article'>({
    as: 'article',
    id: 'reading-card',
    surface: 'glass-card',
    className: 'docs-card',
    children: 'Article content',
  });
  expect(article.type).toBe('article');
  expect(article.props.id).toBe('reading-card');
  expect(article.props['data-surface']).toBe('glass-card');
  expect(article.props.className).toBe('ui-card material-glass-card docs-card');

  const link = UiCard<'a'>({
    as: 'a',
    href: '/docs',
    surface: 'subtle',
    children: 'Open docs',
  });
  expect(link.type).toBe('a');
  expect(link.props.href).toBe('/docs');
  expect(link.props.className).toContain('ui-surface-subtle');
});
