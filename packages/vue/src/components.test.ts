import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { presence, staggerStyle } from './presence';
import UiAction from './UiAction.vue';
import UiBadge from './UiBadge.vue';
import UiBreadcrumb from './UiBreadcrumb.vue';
import UiButton from './UiButton.vue';
import UiCard from './UiCard.vue';
import UiControlSurface from './UiControlSurface.vue';
import UiDisclosure from './UiDisclosure.vue';
import UiDock from './UiDock.vue';
import UiIconButton from './UiIconButton.vue';
import UiInput from './UiInput.vue';
import UiNavigationItem from './UiNavigationItem.vue';
import UiNotice from './UiNotice.vue';
import UiPresence from './UiPresence.vue';
import UiScrollbar from './UiScrollbar.vue';
import UiSegmentedControl from './UiSegmentedControl.vue';
import UiSelect from './UiSelect.vue';
import UiSkeleton from './UiSkeleton.vue';
import UiStatusIndicator from './UiStatusIndicator.vue';
import UiSurface from './UiSurface.vue';
import UiTable from './UiTable.vue';
import UiTextarea from './UiTextarea.vue';
import UiTooltipSurface from './UiTooltipSurface.vue';

const options = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details', disabled: true },
  { value: 'activity', label: 'Activity' },
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Presence', () => {
  it('maps variants, origins, and stagger timing onto the shared Motion contract', () => {
    expect(presence('pop', 'top')).toEqual({
      'data-neoverse-motion': 'pop',
      'data-neoverse-motion-origin': 'top',
    });
    expect(presence('fade')).toEqual({ 'data-neoverse-motion': 'fade' });
    expect(staggerStyle(0)).toEqual({});
    expect(staggerStyle(3, { step: 50 })).toEqual({
      '--neoverse-motion-enter-delay': '150ms',
    });
  });

  it('keeps content mounted through exit and supports an interrupted departure', async () => {
    const wrapper = mount(UiPresence, {
      attachTo: document.body,
      props: { show: true, variant: 'pop', origin: 'top', as: 'span' },
      attrs: { 'data-test-presence': '' },
      slots: { default: 'Presence content' },
    });

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.attributes('data-neoverse-motion')).toBe('pop');
    expect(wrapper.attributes('data-neoverse-motion-origin')).toBe('top');
    expect(wrapper.classes()).toContain('nv-appear');
    expect(wrapper.classes()).not.toContain('nv-vanish');

    await wrapper.setProps({ show: false });
    expect(wrapper.find('[data-test-presence]').exists()).toBe(true);
    expect(wrapper.classes()).toContain('nv-vanish');

    await wrapper.setProps({ show: true });
    expect(wrapper.find('[data-test-presence]').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('nv-vanish');

    await wrapper.setProps({ show: false });
    const animationEnd = new Event('animationend', { bubbles: true }) as AnimationEvent;
    Object.defineProperty(animationEnd, 'animationName', { value: 'nv-vanish' });
    wrapper.element.dispatchEvent(animationEnd);
    await nextTick();

    expect(wrapper.find('[data-test-presence]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('interprets millisecond exit tokens without treating them as seconds', async () => {
    vi.useFakeTimers();
    const computedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '140ms',
    } as unknown as CSSStyleDeclaration);
    const wrapper = mount(UiPresence, {
      props: { show: true },
      attrs: { 'data-test-presence-timer': '' },
      slots: { default: 'Timed presence' },
    });

    await wrapper.setProps({ show: false });
    await vi.advanceTimersByTimeAsync(189);
    expect(wrapper.find('[data-test-presence-timer]').exists()).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await nextTick();
    expect(wrapper.find('[data-test-presence-timer]').exists()).toBe(false);

    computedStyle.mockRestore();
    vi.useRealTimers();
    wrapper.unmount();
  });
});

describe('UiButton', () => {
  it('opts the shared button surface into the project Glass material', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['ui-button', 'ui-button--md', 'material-glass-subtle']),
    );
    expect(wrapper.attributes('data-surface')).toBe('glass-subtle');
  });

  it('can remove its material surface without losing button semantics', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost', surface: 'none' },
      slots: { default: 'Bare action' },
    });

    expect(wrapper.classes()).toContain('ui-button--ghost');
    expect(wrapper.classes()).not.toContain('material-glass-subtle');
    expect(wrapper.attributes('data-surface')).toBe('none');
  });

  it('uses the shared material hierarchy for visual variants', () => {
    const primary = mount(UiButton, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });
    const secondary = mount(UiButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Secondary' },
    });
    const ghost = mount(UiButton, { props: { variant: 'ghost' }, slots: { default: 'Ghost' } });

    expect(primary.classes()).toContain('ui-button--primary');
    expect(secondary.classes()).toContain('ui-button--secondary');
    expect(secondary.classes()).not.toContain('bg-action-secondary');
    expect(secondary.classes()).not.toContain('text-action-secondary-foreground');
    expect(ghost.classes()).toContain('ui-button--ghost');
    expect(ghost.classes()).not.toContain('hover:bg-accent-soft');
  });

  it('fills a fixed-height flex container when stretch is set', () => {
    const stretched = mount(UiButton, {
      props: { stretch: true },
      slots: { default: 'Stretch' },
    });

    expect(stretched.classes()).toEqual(
      expect.arrayContaining(['ui-button--md', 'ui-button--stretch']),
    );
    expect(stretched.classes()).not.toContain('h-8');

    const sized = mount(UiButton, { slots: { default: 'Sized' } });
    expect(sized.classes()).toContain('ui-button--md');
    expect(sized.classes()).not.toContain('ui-button--stretch');
  });

  it('uses semantic classes and blocks native activation while loading', async () => {
    const onClick = vi.fn();
    const wrapper = mount(UiButton, {
      attrs: { onClick },
      props: { variant: 'secondary', size: 'lg' },
      slots: { default: 'Save' },
    });
    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toEqual(
      expect.arrayContaining(['ui-button--secondary', 'ui-button--lg']),
    );
    expect(button.classes().some((className) => className.includes(':'))).toBe(false);

    await button.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('[aria-hidden="true"]').exists()).toBe(true);

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('ui-loading-indicator');
    expect(loadingIndicator.get('circle').attributes('stroke-linecap')).toBe('round');

    onClick.mockClear();
    button.element.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps disabled buttons targetable for the not-allowed cursor', () => {
    const wrapper = mount(UiButton, {
      props: { disabled: true },
      slots: { default: 'Disabled' },
    });
    const button = wrapper.get('button');

    expect(button.classes()).toContain('ui-button--md');
    expect(button.classes().some((className) => className.startsWith('disabled:'))).toBe(false);
  });

  it('anchors the press glow to the pointer location', async () => {
    const onPointerdown = vi.fn();
    const wrapper = mount(UiButton, {
      attrs: { onPointerdown },
      slots: { default: 'Press' },
    });
    const button = wrapper.get('button');

    vi.spyOn(button.element, 'getBoundingClientRect').mockReturnValue({
      bottom: 60,
      height: 40,
      left: 10,
      right: 110,
      top: 20,
      width: 100,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    await button.trigger('pointerdown', { clientX: 85, clientY: 50 });

    expect(button.element.style.getPropertyValue('--neoverse-button-press-x')).toBe('75%');
    expect(button.element.style.getPropertyValue('--neoverse-button-press-y')).toBe('75%');
    expect(onPointerdown).toHaveBeenCalledTimes(1);
  });
});

describe('UiAction', () => {
  it('renders destination semantics with comfortable action geometry', () => {
    const wrapper = mount(UiAction, {
      props: { href: '/journal', size: 'lg' },
      slots: { default: 'Read the journal' },
    });
    const action = wrapper.get('a');

    expect(action.attributes('href')).toBe('/journal');
    expect(action.text()).toBe('Read the journal');
    expect(action.classes()).toEqual(
      expect.arrayContaining([
        'ui-action',
        'ui-action--lg',
        'ui-button--primary',
        'material-glass-subtle',
      ]),
    );
  });

  it('can scale a destination action as one visual unit', () => {
    const action = mount(UiAction, {
      props: { href: '/journal', size: 'lg', scale: 'lg' },
      slots: { default: 'Read the journal' },
    });

    const anchor = action.get('a');
    expect(anchor.classes()).toContain('ui-action--lg');
    expect(anchor.classes()).toContain('ui-action--scale-lg');
  });

  it('removes navigation and consumer activation while disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(UiAction, {
      attrs: { onClick },
      props: { href: '/journal', disabled: true },
      slots: { default: 'Unavailable' },
    });
    const action = wrapper.get('a');

    expect(action.attributes('href')).toBeUndefined();
    expect(action.attributes('aria-disabled')).toBe('true');
    expect(action.attributes('tabindex')).toBe('-1');

    await action.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps native button type and disabled semantics when rendered as a button', () => {
    const enabled = mount(UiAction, {
      props: { as: 'button', type: 'submit' },
      slots: { default: 'Submit' },
    });
    expect(enabled.get('button').attributes('type')).toBe('submit');
    expect(enabled.get('button').attributes('disabled')).toBeUndefined();
    expect(enabled.get('button').attributes('aria-disabled')).toBeUndefined();

    const disabled = mount(UiAction, {
      props: { as: 'button', disabled: true },
      slots: { default: 'Unavailable' },
    });
    expect(disabled.get('button').element.disabled).toBe(true);
  });
});

describe('UiNavigationItem', () => {
  it('exposes current-page semantics and keeps compact labels accessible', () => {
    const wrapper = mount(UiNavigationItem, {
      props: {
        href: '/projects',
        label: 'Projects',
        active: true,
        compact: true,
      },
      slots: { icon: '<svg data-icon="projects" />' },
    });
    const action = wrapper.get('a');

    expect(action.attributes('href')).toBe('/projects');
    expect(action.attributes('aria-current')).toBe('page');
    expect(action.text()).toContain('Projects');
    expect(action.get('.ui-navigation-item__label').classes()).toContain('sr-only');
    expect(action.get('.ui-navigation-item__indicator').attributes('aria-hidden')).toBe('true');
    expect(action.attributes('data-surface')).toBe('none');
    expect(action.classes().some((className) => className.startsWith('material-glass-'))).toBe(
      false,
    );
  });

  it('marks stretched compact items so grouped layouts can fill their track', () => {
    const wrapper = mount(UiNavigationItem, {
      props: { label: 'Projects', compact: true, stretch: true },
    });

    expect(wrapper.get('a').classes()).toEqual(
      expect.arrayContaining(['ui-navigation-item--compact', 'ui-navigation-item--stretch']),
    );
  });

  it('supports a start-edge indicator for vertical navigation', () => {
    const wrapper = mount(UiNavigationItem, {
      props: { label: 'Projects', active: true, indicatorPlacement: 'start' },
    });

    expect(wrapper.get('a').classes()).toEqual(
      expect.arrayContaining(['ui-navigation-item--active', 'ui-navigation-item--indicator-start']),
    );
  });

  it('can explicitly opt into a control Glass surface outside grouped navigation', () => {
    const wrapper = mount(UiNavigationItem, {
      props: { href: '/projects', label: 'Projects', surface: 'glass-subtle' },
    });
    const action = wrapper.get('a');

    expect(action.classes()).toContain('material-glass-subtle');
    expect(action.attributes('data-surface')).toBe('glass-subtle');
  });
});

describe('UiBreadcrumb', () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Navigation' },
  ] as const;

  it('renders native breadcrumb semantics and marks only the resolved current item', () => {
    const wrapper = mount(UiBreadcrumb, {
      props: {
        items: breadcrumbItems,
        ariaLabel: 'Documentation breadcrumb',
      },
    });

    const nav = wrapper.get('nav');
    expect(nav.attributes('aria-label')).toBe('Documentation breadcrumb');
    expect(wrapper.findAll('ol > li')).toHaveLength(3);
    expect(wrapper.findAll('.ui-breadcrumb__separator')).toHaveLength(2);
    expect(
      wrapper
        .findAll('.ui-breadcrumb__separator')
        .every((node) => node.attributes('aria-hidden') === 'true'),
    ).toBe(true);
    expect(wrapper.findAll('a').map((node) => node.attributes('href'))).toEqual(['/', '/docs']);

    const current = wrapper.get('[aria-current="page"]');
    expect(current.text()).toBe('Navigation');
    expect(current.classes()).toContain('ui-breadcrumb__current');
  });

  it('uses an explicit current item instead of creating a second current destination', () => {
    const wrapper = mount(UiBreadcrumb, {
      props: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Docs', current: true },
          { label: 'Navigation', href: '/docs/navigation' },
        ],
      },
    });

    const current = wrapper.findAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.text()).toBe('Docs');
    expect(wrapper.get('a[href="/docs/navigation"]').text()).toBe('Navigation');
  });

  it('exposes scoped item and separator slots for router-aware consumers', () => {
    const wrapper = mount(UiBreadcrumb, {
      props: { items: breadcrumbItems },
      slots: {
        item: ({ item, current }: { item: { label: string }; current: boolean }) =>
          h(
            'span',
            { 'data-custom-item': item.label, 'data-current': String(current) },
            item.label,
          ),
        separator: ({ index }: { index: number }) => h('span', { 'data-separator': index }, '/'),
      },
    });

    expect(wrapper.findAll('[data-custom-item]')).toHaveLength(3);
    expect(wrapper.find('[data-custom-item="Navigation"]').attributes('data-current')).toBe('true');
    expect(wrapper.findAll('[data-separator]')).toHaveLength(2);
  });
});

describe('UiControlSurface', () => {
  it('forwards container semantics and adds separation only for trailing controls', () => {
    const grouped = mount(UiControlSurface, {
      attrs: { 'aria-label': 'Primary navigation' },
      props: { as: 'nav' },
      slots: { default: '<a href="/">Home</a>', trailing: '<button>English</button>' },
    });

    expect(grouped.element.tagName).toBe('NAV');
    expect(grouped.attributes('aria-label')).toBe('Primary navigation');
    expect(grouped.attributes('data-surface')).toBe('glass-subtle');
    expect(grouped.find('.ui-control-surface__divider').exists()).toBe(true);

    const ungrouped = mount(UiControlSurface);
    expect(ungrouped.find('.ui-control-surface__divider').exists()).toBe(false);

    const solid = mount(UiControlSurface, { props: { surface: 'elevated' } });
    expect(solid.classes()).toContain('ui-surface-elevated');
    expect(solid.classes()).not.toContain('material-glass-subtle');
    expect(solid.attributes('data-surface')).toBe('elevated');
  });

  it('maps stable hover and local edge policies to internal material attributes', () => {
    const surface = mount(UiControlSurface, {
      props: {
        surface: 'glass-elevated',
        hoverMode: 'static',
        edgeMode: 'local',
      },
    });

    expect(surface.attributes('data-neoverse-surface-hover')).toBe('static');
    expect(surface.attributes('data-neoverse-glass-edge-pass')).toBe('css');

    const automatic = mount(UiControlSurface);
    expect(automatic.attributes('data-neoverse-surface-hover')).toBeUndefined();
    expect(automatic.attributes('data-neoverse-glass-edge-pass')).toBeUndefined();
  });

  it('exposes uniform whole-surface scaling without changing the default', () => {
    const defaultSurface = mount(UiControlSurface);
    const largeSurface = mount(UiControlSurface, { props: { scale: 'lg' } });

    expect(defaultSurface.classes()).toContain('ui-control-surface--scale-md');
    expect(largeSurface.classes()).toContain('ui-control-surface--scale-lg');
  });

  it('keeps the shared navigation indicator opt-in', () => {
    const surface = mount(UiControlSurface, {
      props: { navigationIndicator: true },
      slots: { default: '<a href="/">Home</a>' },
    });

    expect(surface.classes()).toContain('ui-control-surface--shared-indicator');
    expect(surface.find('.ui-control-surface__indicator').exists()).toBe(false);
  });
});

describe('UiDock', () => {
  it('owns reusable dock composition while keeping product content caller-owned', () => {
    const wrapper = mount(UiDock, {
      attrs: { 'aria-label': 'Primary navigation' },
      props: { compact: true },
      slots: {
        default: '<a class="ui-navigation-item" href="/">Home</a>',
        trailing: '<button>English</button>',
      },
    });

    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.attributes('aria-label')).toBe('Primary navigation');
    expect(wrapper.attributes('data-surface')).toBe('chrome');
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'ui-dock',
        'ui-dock--compact',
        'ui-control-surface',
        'ui-control-surface--scale-lg',
        'ui-surface-chrome',
      ]),
    );
    expect(wrapper.classes()).toContain('ui-control-surface--shared-indicator');
    expect(wrapper.find('.ui-control-surface__divider').exists()).toBe(true);
  });
});

describe('UiStatusIndicator', () => {
  it('keeps announcements caller-owned and hides its decorative status dot', () => {
    const passive = mount(UiStatusIndicator, {
      props: { status: 'success', pulse: true },
      slots: { default: 'Online' },
    });

    expect(passive.attributes('role')).toBeUndefined();
    expect(passive.text()).toBe('Online');
    expect(passive.get('.ui-status-indicator__dot').attributes('aria-hidden')).toBe('true');

    const live = mount(UiStatusIndicator, {
      attrs: { role: 'status' },
      slots: { default: 'Sync complete' },
    });
    expect(live.attributes('role')).toBe('status');
  });

  it('uses the shared skeleton material while loading and suppresses pulse', () => {
    const wrapper = mount(UiStatusIndicator, {
      props: { status: 'success', pulse: true, loading: true },
      slots: { default: 'Loading status' },
    });

    expect(wrapper.classes()).toContain('ui-status-indicator--loading');
    expect(wrapper.classes()).not.toContain('ui-status-indicator--pulse');
  });
});

describe('UiIconButton', () => {
  it('requires and forwards its accessible label', async () => {
    const wrapper = mount(UiIconButton, {
      props: { label: 'Open settings', variant: 'ghost', size: 'sm' },
      slots: { default: 'icon' },
    });
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('Open settings');
    expect(button.classes()).toEqual(
      expect.arrayContaining(['ui-button--ghost', 'ui-icon-button', 'ui-icon-button--sm']),
    );
    expect(button.classes().some((className) => className.includes(':'))).toBe(false);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('ui-loading-indicator');
    expect(loadingIndicator.get('circle').attributes('stroke-linecap')).toBe('round');
  });

  it('anchors its press glow to the pointer location', async () => {
    const wrapper = mount(UiIconButton, {
      props: { label: 'Add' },
      slots: { default: '+' },
    });
    const button = wrapper.get('button');

    vi.spyOn(button.element, 'getBoundingClientRect').mockReturnValue({
      bottom: 50,
      height: 40,
      left: 20,
      right: 60,
      top: 10,
      width: 40,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    });

    await button.trigger('pointerdown', { clientX: 30, clientY: 20 });

    expect(button.element.style.getPropertyValue('--neoverse-button-press-x')).toBe('25%');
    expect(button.element.style.getPropertyValue('--neoverse-button-press-y')).toBe('25%');
  });

  it('fills a fixed-height flex container when stretch is set', () => {
    const stretched = mount(UiIconButton, {
      props: { label: 'Add', stretch: true },
      slots: { default: 'icon' },
    });

    expect(stretched.get('button').classes()).toEqual(
      expect.arrayContaining(['ui-icon-button--md', 'ui-icon-button--stretch']),
    );
    expect(stretched.get('button').classes()).not.toContain('size-8');

    const sized = mount(UiIconButton, { props: { label: 'Add' }, slots: { default: 'icon' } });
    expect(sized.get('button').classes()).toContain('ui-icon-button--md');
    expect(sized.get('button').classes()).not.toContain('ui-icon-button--stretch');
  });

  it('supports icon-only navigation without consumer geometry overrides', async () => {
    const wrapper = mount(UiIconButton, {
      props: {
        as: 'a',
        href: 'https://example.com/source',
        label: 'View source',
        size: 'sm',
      },
      attrs: { target: '_blank' },
      slots: { default: 'icon' },
    });

    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('https://example.com/source');
    expect(link.attributes('aria-label')).toBe('View source');
    expect(link.classes()).toContain('ui-icon-button--sm');

    await wrapper.setProps({ disabled: true });
    expect(link.attributes('href')).toBeUndefined();
    expect(link.attributes('aria-disabled')).toBe('true');
    expect(link.attributes('tabindex')).toBe('-1');
  });
});

describe('display components', () => {
  it('keeps Card grouping separate from Glass material', () => {
    const badge = mount(UiBadge, {
      props: { variant: 'danger', size: 'md' },
      slots: { default: 'Error' },
    });
    expect(badge.classes()).toEqual(
      expect.arrayContaining(['ui-badge', 'ui-badge--danger', 'text-label']),
    );

    const card = mount(UiCard, { attrs: { class: 'max-w-container-sm' } });
    expect(card.classes()).toEqual(
      expect.arrayContaining(['ui-card', 'material-glass-elevated', 'max-w-container-sm']),
    );
    expect(card.attributes('data-surface')).toBe('glass-elevated');

    const bareCard = mount(UiCard, { props: { surface: 'none' } });
    expect(bareCard.attributes('data-surface')).toBe('none');
    expect(bareCard.classes().some((className) => className.startsWith('material-glass-'))).toBe(
      false,
    );

    const standardSurfaceCard = mount(UiCard, {
      props: { surface: 'elevated' },
    });
    expect(standardSurfaceCard.classes()).toContain('ui-surface-elevated');
    expect(standardSurfaceCard.classes()).not.toContain('material-glass-elevated');

    const surface = mount(UiSurface, {
      props: { as: 'section', surface: 'glass-elevated' },
      attrs: { 'aria-label': 'Shared surface' },
    });
    expect(surface.element.tagName).toBe('SECTION');
    expect(surface.attributes('aria-label')).toBe('Shared surface');
    expect(surface.attributes('data-surface')).toBe('glass-elevated');
    expect(surface.attributes('data-neoverse-glass-nesting')).toBe('local');
    expect(surface.attributes('data-neoverse-surface-overflow')).toBe('clip');
    expect(surface.classes()).toContain('material-glass-elevated');

    const localGlassSurface = mount(UiSurface, {
      props: { surface: 'glass-subtle', glassNesting: 'local', contentOverflow: 'visible' },
    });
    expect(localGlassSurface.attributes('data-neoverse-glass-nesting')).toBe('local');
    expect(localGlassSurface.attributes('data-neoverse-surface-overflow')).toBe('visible');

    const inheritedGlassSurface = mount(UiSurface, {
      props: { surface: 'glass-subtle', glassNesting: 'inherit' },
    });
    expect(inheritedGlassSurface.attributes('data-neoverse-glass-nesting')).toBe('inherit');

    const insetSurface = mount(UiSurface, { props: { surface: 'inset' } });
    expect(insetSurface.attributes('data-surface')).toBe('inset');
    expect(insetSurface.classes()).toContain('ui-surface-inset');

    const notice = mount(UiNotice, {
      props: { variant: 'warning' },
      slots: { default: 'Unavailable', action: '<button>Retry</button>' },
    });
    expect(notice.classes()).toEqual(expect.arrayContaining(['ui-notice', 'ui-notice--warning']));
    expect(notice.find('.ui-notice__action').exists()).toBe(true);

    const tooltip = mount(UiTooltipSurface, {
      props: { variant: 'accent' },
      slots: { default: '12 contributions' },
    });
    expect(tooltip.classes()).toEqual(
      expect.arrayContaining([
        'ui-tooltip-surface',
        'material-glass-subtle',
        'ui-tooltip-surface--accent',
      ]),
    );
    expect(tooltip.attributes('data-surface')).toBe('glass-subtle');
    expect(tooltip.attributes('data-neoverse-surface-hover')).toBe('static');
    expect(tooltip.attributes()).toHaveProperty('data-neoverse-tooltip-surface');

    const skeleton = mount(UiSkeleton, { props: { variant: 'circle' } });
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(skeleton.classes()).toEqual(
      expect.arrayContaining([
        'ui-skeleton',
        'skeleton-surface',
        'ui-skeleton--circle',
        'ui-skeleton--shimmer',
      ]),
    );
    expect(skeleton.attributes('data-effect')).toBe('shimmer');

    const sizedRect = mount(UiSkeleton, {
      props: {
        variant: 'rect',
        effect: 'none',
        width: '7rem',
        height: '2rem',
        radius: '1rem',
      },
    });
    expect(sizedRect.attributes('data-effect')).toBe('none');
    expect(sizedRect.classes()).toEqual(
      expect.arrayContaining(['ui-skeleton--rect', 'ui-skeleton--static']),
    );
    expect(sizedRect.attributes('style')).toContain('width: 7rem');
    expect(sizedRect.attributes('style')).toContain('height: 2rem');
    expect(sizedRect.attributes('style')).toContain('--ui-skeleton-radius: 1rem');
  });
});

describe('UiScrollbar', () => {
  it('reacts when native scrollbar ownership is toggled', async () => {
    const root = document.documentElement;
    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { hideNative: false },
    });

    expect(root.classList).not.toContain('ui-scrollbar-target');
    await wrapper.setProps({ hideNative: true });
    expect(root.classList).toContain('ui-scrollbar-target');
    await wrapper.setProps({ hideNative: false });
    expect(root.classList).not.toContain('ui-scrollbar-target');
    wrapper.unmount();
  });

  it('tracks document geometry and owns native scrollbar visibility', async () => {
    const root = document.documentElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { autoHideMs: 0 },
    });
    await nextTick();

    expect(wrapper.classes()).toContain('ui-scrollbar');
    expect(wrapper.attributes('data-visible')).toBe('true');
    expect(wrapper.get('.ui-scrollbar__thumb').attributes('style')).toContain('height: 50%');
    expect(root.classList).toContain('ui-scrollbar-target');

    wrapper.unmount();
    expect(root.classList).not.toContain('ui-scrollbar-target');
  });

  it('maps thumb dragging and track jumps to document scrolling', async () => {
    const root = document.documentElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { autoHideMs: 0 },
    });
    await nextTick();

    const track = wrapper.get('.ui-scrollbar');
    const thumb = wrapper.get('.ui-scrollbar__thumb');
    vi.spyOn(track.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 800,
    } as DOMRect);
    vi.spyOn(thumb.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 400,
    } as DOMRect);

    await thumb.trigger('pointerdown', { button: 0, clientY: 20, pointerId: 1 });
    expect(wrapper.classes()).toContain('ui-scrollbar--dragging');

    await thumb.trigger('pointermove', { clientY: 400, pointerId: 1 });
    await thumb.trigger('pointerup', { pointerId: 1 });
    expect(wrapper.classes()).not.toContain('ui-scrollbar--dragging');

    await track.trigger('pointerdown', { button: 0, clientY: 700, pointerId: 2 });
    expect(scrollTo).toHaveBeenCalled();
  });
});
describe('UiTable', () => {
  it('keeps native table semantics inside a local overflow region', () => {
    const wrapper = mount(UiTable, {
      attrs: { 'aria-label': 'Runtime support', class: 'consumer-table' },
      props: { caption: 'Supported runtimes' },
      slots: {
        default: () => [
          h('thead', [h('tr', [h('th', 'Runtime'), h('th', 'Status')])]),
          h('tbody', [h('tr', [h('td', 'Windows'), h('td', 'Ready')])]),
        ],
      },
    });

    expect(wrapper.get('[data-ui-table-region]').classes()).toContain('ui-table-region');
    const table = wrapper.get('table');
    expect(table.attributes('aria-label')).toBe('Runtime support');
    expect(table.classes()).toEqual(
      expect.arrayContaining([
        'ui-table',
        'ui-table--striped',
        'ui-table--hoverable',
        'consumer-table',
      ]),
    );
    expect(table.get('caption').text()).toBe('Supported runtimes');
    expect(table.get('thead').element.tagName).toBe('THEAD');
    expect(table.get('tbody').element.tagName).toBe('TBODY');
  });

  it('can disable optional row treatments without changing table semantics', () => {
    const wrapper = mount(UiTable, {
      props: { striped: false, hoverable: false },
      slots: { default: () => h('tbody', [h('tr', [h('td', 'Static')])]) },
    });

    const table = wrapper.get('table');
    expect(table.classes()).toEqual(['ui-table']);
    expect(table.element.tagName).toBe('TABLE');
  });
});

describe('UiDisclosure', () => {
  it('uses native details and summary semantics and reports toggle state', async () => {
    const wrapper = mount(UiDisclosure, {
      attrs: { id: 'implementation-notes', class: 'consumer-disclosure' },
      props: { summary: 'Implementation notes' },
      slots: { default: () => h('p', 'Use semantic tokens.') },
    });

    const details = wrapper.get('details');
    expect(details.attributes('id')).toBe('implementation-notes');
    expect(details.classes()).toEqual(
      expect.arrayContaining(['ui-disclosure', 'consumer-disclosure']),
    );
    expect(details.get('summary').classes()).toContain('ui-disclosure__summary');
    expect(details.get('summary').text()).toBe('Implementation notes');
    expect(details.get('.ui-disclosure__content').text()).toBe('Use semantic tokens.');

    details.element.open = true;
    await nextTick();
    expect(wrapper.emitted('toggle')?.at(-1)).toEqual([true]);
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true]);
  });
});

describe('form controls', () => {
  it('keeps input attributes and v-model updates native', async () => {
    const wrapper = mount(UiInput, {
      attrs: { type: 'email', name: 'email', 'aria-label': 'Email' },
      props: { modelValue: 'hello@example.com' },
    });

    expect(wrapper.attributes('type')).toBe('email');
    expect(wrapper.attributes('name')).toBe('email');
    expect(wrapper.classes()).toContain('ui-input');
    expect((wrapper.element as HTMLInputElement).value).toBe('hello@example.com');

    await wrapper.trigger('pointerdown');
    expect(wrapper.attributes('data-neoverse-focus-origin')).toBe('pointer');
    await wrapper.trigger('blur');
    expect(wrapper.attributes('data-neoverse-focus-origin')).toBeUndefined();

    await wrapper.setValue('next@example.com');
    expect(wrapper.emitted('update:modelValue')).toEqual([['next@example.com']]);
  });

  it('keeps textarea attributes and v-model updates native', async () => {
    const wrapper = mount(UiTextarea, {
      attrs: { name: 'notes', rows: '4', 'aria-label': 'Notes' },
      props: { modelValue: 'Initial' },
    });

    const textarea = wrapper.get('textarea');
    expect(textarea.attributes('rows')).toBe('4');
    expect(textarea.classes()).toContain('ui-textarea');
    expect(wrapper.classes()).toContain('ui-textarea-shell');
    await textarea.trigger('pointerdown');
    expect(textarea.attributes('data-neoverse-focus-origin')).toBe('pointer');
    await textarea.trigger('blur');
    expect(textarea.attributes('data-neoverse-focus-origin')).toBeUndefined();
    await textarea.setValue('Updated');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Updated']]);
  });

  it('renders the library select surface and emits option changes', async () => {
    const wrapper = mount(UiSelect, {
      attrs: { name: 'runtime', 'aria-label': 'Runtime' },
      props: {
        modelValue: 'native',
        options: [
          { value: 'native', label: 'Native' },
          { value: 'remote', label: 'Remote' },
        ],
      },
    });

    expect(wrapper.classes()).toContain('ui-select-shell');
    expect(wrapper.get('.ui-select').attributes('aria-label')).toBe('Runtime');
    expect(wrapper.get('.ui-select__indicator path').attributes('d')).toBe('m6 9 6 6 6-6');
    expect(wrapper.findAll('.ui-select__option')).toHaveLength(2);
    expect(wrapper.get('.ui-select__popover').attributes('popover')).toBe('auto');
    expect(wrapper.get('input[type="hidden"]').attributes('name')).toBe('runtime');
    await wrapper.get('.ui-select').trigger('pointerdown');
    expect(wrapper.get('.ui-select').attributes('data-neoverse-focus-origin')).toBe('pointer');
    await wrapper.get('.ui-select').trigger('blur');
    expect(wrapper.get('.ui-select').attributes('data-neoverse-focus-origin')).toBeUndefined();
    await wrapper.findAll('.ui-select__option')[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['remote']]);
  });
});

describe('UiSegmentedControl', () => {
  it('uses the shared Glass surface by default and can opt out of outer chrome', () => {
    const glass = mount(UiSegmentedControl, { props: { options } });
    expect(glass.classes()).toContain('material-glass-subtle');
    expect(glass.attributes('data-surface')).toBe('glass-subtle');
    expect(glass.attributes('data-neoverse-surface-hover')).toBe('static');
    expect(glass.attributes('data-neoverse-glass-edge-pass')).toBe('css');

    const bare = mount(UiSegmentedControl, { props: { options, surface: 'none' } });
    expect(bare.attributes('data-neoverse-glass-edge-pass')).toBeUndefined();
    expect(bare.classes()).not.toContain('material-glass-subtle');
    expect(bare.attributes('data-surface')).toBe('none');
    expect(bare.find('.ui-segmented-control__slider').exists()).toBe(true);
  });

  it('falls back to the compact size for unsupported values', () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, size: 'md' as never },
    });
    const firstButton = wrapper.find('button');

    expect(firstButton.classes()).toContain('ui-segmented-control__option');
    expect(firstButton.classes()).not.toContain('text-caption');
    expect(firstButton.classes()).not.toEqual(expect.arrayContaining(['h-9']));
  });

  it('supports roving keyboard selection and skips disabled options', async () => {
    const wrapper = mount(UiSegmentedControl, {
      attachTo: document.body,
      attrs: { 'aria-label': 'View' },
      props: { options, defaultValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');

    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-segmented-control']));
    expect(wrapper.classes()).not.toEqual(expect.arrayContaining(['border-subtle']));
    expect(buttons[0]?.classes()).toEqual(
      expect.arrayContaining([
        'ui-segmented-control__option',
        'ui-segmented-control__option--active',
      ]),
    );
    expect(buttons[0]?.classes().some((className) => className.includes(':'))).toBe(false);
    expect(wrapper.find('.ui-segmented-control__slider').exists()).toBe(true);
    expect(buttons[0]?.attributes('aria-checked')).toBe('true');
    expect(buttons[0]?.attributes('tabindex')).toBe('0');
    expect(buttons[1]?.attributes('disabled')).toBeDefined();
    expect(buttons[2]?.attributes('tabindex')).toBe('-1');

    await buttons[0]?.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(buttons[2]?.attributes('aria-checked')).toBe('true');
    expect(buttons[2]?.attributes('tabindex')).toBe('0');
    expect(document.activeElement).toBe(buttons[2]?.element);
    expect(wrapper.emitted('update:modelValue')).toEqual([['activity']]);
  });

  it('keeps controlled values authoritative until the parent updates them', async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, modelValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');

    await buttons[2]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['activity']]);
    expect(buttons[0]?.attributes('aria-checked')).toBe('true');
    expect(buttons[2]?.attributes('aria-checked')).toBe('false');

    await wrapper.setProps({ modelValue: 'activity' });
    expect(buttons[2]?.attributes('aria-checked')).toBe('true');
  });
  it('marks the group busy and blocks selection while loading', async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, defaultValue: 'overview', loading: true },
    });
    const buttons = wrapper.findAll('button');

    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(buttons.every((button) => button.element.disabled)).toBe(true);

    const loadingIndicator = wrapper.get('[aria-hidden="true"] > svg');
    expect(loadingIndicator.classes()).toContain('ui-loading-indicator');
    expect(loadingIndicator.get('circle').attributes('stroke-linecap')).toBe('round');

    await buttons[0]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('labels the group and individual options through ariaLabel props', () => {
    const labeled = mount(UiSegmentedControl, {
      attrs: { 'aria-label': 'Attrs label' },
      props: { options, ariaLabel: 'View' },
    });
    expect(labeled.attributes('aria-label')).toBe('View');

    const optionLabeled = mount(UiSegmentedControl, {
      props: {
        options: [
          { value: 'a', label: 'A', ariaLabel: 'Show A' },
          { value: 'b', label: 'B' },
        ],
      },
    });
    const optionButtons = optionLabeled.findAll('button');
    expect(optionButtons[0]?.attributes('aria-label')).toBe('Show A');
    expect(optionButtons[1]?.attributes('aria-label')).toBeUndefined();
  });

  it('preserves an aria-label supplied through fallthrough attributes', () => {
    const wrapper = mount(UiSegmentedControl, {
      attrs: { 'aria-label': 'Fallthrough view' },
      props: { options },
    });

    expect(wrapper.attributes('aria-label')).toBe('Fallthrough view');
  });

  it('falls back for an invalid uncontrolled default but not an invalid controlled value', () => {
    const uncontrolled = mount(UiSegmentedControl, {
      props: { options, defaultValue: 'missing' },
    });
    expect(uncontrolled.findAll('button')[0]?.attributes('aria-checked')).toBe('true');

    const controlled = mount(UiSegmentedControl, {
      props: { options, modelValue: 'missing' },
    });
    expect(
      controlled.findAll('button').every((button) => button.attributes('aria-checked') === 'false'),
    ).toBe(true);
    expect(controlled.findAll('button')[0]?.attributes('tabindex')).toBe('0');
  });

  it('warns about duplicate option values in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mount(UiSegmentedControl, {
      props: {
        options: [
          { value: 'one', label: 'One' },
          { value: 'one', label: 'Duplicate' },
        ],
      },
    });

    expect(warn).toHaveBeenCalledWith(
      '[UiSegmentedControl] Duplicate option value "one" makes selection ambiguous.',
    );
  });
});
