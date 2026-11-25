import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import UiBreadcrumb from './UiBreadcrumb.vue';
import UiControlSurface from './UiControlSurface.vue';
import UiDock from './UiDock.vue';
import UiNavigationItem from './UiNavigationItem.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function mountIndicatorSurface() {
  const surface = mount(UiControlSurface, {
    props: { navigationIndicator: true },
    slots: {
      default:
        '<a class="ui-navigation-item ui-navigation-item--active" href="#first"><span class="ui-navigation-item__indicator"></span>First</a>' +
        '<a class="ui-navigation-item" href="#second"><span class="ui-navigation-item__indicator"></span>Second</a>',
    },
  });
  const group = surface.get<HTMLElement>('.ui-control-surface__group--primary');
  const indicator = surface.get<HTMLElement>('.ui-control-surface__indicator');
  const markers = surface.findAll<HTMLElement>('.ui-navigation-item__indicator');
  const items = surface.findAll<HTMLElement>('.ui-navigation-item');
  const [firstMarker, secondMarker] = markers;
  const [firstItem, secondItem] = items;
  if (!firstMarker || !secondMarker || !firstItem || !secondItem) {
    throw new Error('Indicator fixture elements are missing');
  }
  const rect = (left: number) => ({
    bottom: 32,
    height: 2,
    left,
    right: left + 20,
    top: 30,
    width: 20,
    x: left,
    y: 30,
    toJSON: () => ({}),
  });
  vi.spyOn(group.element, 'getBoundingClientRect').mockReturnValue(rect(0));
  vi.spyOn(firstMarker.element, 'getBoundingClientRect').mockReturnValue(rect(10));
  vi.spyOn(secondMarker.element, 'getBoundingClientRect').mockReturnValue(rect(60));
  return { indicator, firstItem, secondItem };
}

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

  it('renders a suffix inside the label and keeps the selection indicator', () => {
    const wrapper = mount(UiNavigationItem, {
      props: { label: 'Colors' },
      slots: {
        suffix: '<span class="catalogue-suffix" aria-hidden="true">色彩</span>',
        decoration: '<span class="catalogue-decoration" />',
      },
    });
    const label = wrapper.get('.ui-navigation-item__label');

    expect(label.get('.catalogue-suffix').text()).toBe('色彩');
    expect(label.text()).toBe('Colors色彩');
    expect(wrapper.find('.catalogue-decoration').exists()).toBe(true);
    expect(wrapper.find('.ui-navigation-item__indicator').exists()).toBe(true);
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

  it('keeps the shared navigation indicator opt-in and hidden without an active item', () => {
    const plain = mount(UiControlSurface);
    expect(plain.find('.ui-control-surface__indicator').exists()).toBe(false);

    const surface = mount(UiControlSurface, {
      props: { navigationIndicator: true },
      slots: { default: '<a href="/">Home</a>' },
    });

    expect(surface.classes()).toContain('ui-control-surface--shared-indicator');
    const indicator = surface.get<HTMLElement>('.ui-control-surface__indicator');
    expect(indicator.element.style.visibility).toBe('hidden');
    expect(indicator.element.style.left).toBe('');
  });

  it('flies the shared indicator on transform and commits the settled geometry', async () => {
    const { indicator, firstItem, secondItem } = mountIndicatorSurface();

    // Mount measured happy-dom's zero-sized layout; an observed attribute
    // change lets the observer commit the real first geometry before flight.
    firstItem.element.setAttribute('aria-current', 'page');
    await nextTick();

    // The first selection commits geometry directly; later selections keep the
    // committed base and fly on transform so the flight never writes layout.
    expect(indicator.element.style.left).toBe('10px');
    expect(indicator.element.style.visibility).toBe('visible');

    firstItem.element.classList.remove('ui-navigation-item--active');
    secondItem.element.classList.add('ui-navigation-item--active');
    // happy-dom delivers MutationObserver records on the microtask queue.
    await nextTick();

    expect(indicator.element.style.transform).toBe('translate(50px, 0px) scale(1, 1)');
    expect(indicator.element.style.left).toBe('10px');

    await indicator.trigger('transitionend', { propertyName: 'transform' });
    expect(indicator.element.style.left).toBe('60px');
    expect(indicator.element.style.width).toBe('20px');
    expect(indicator.element.style.transform).toBe('');

    secondItem.element.classList.remove('ui-navigation-item--active');
    firstItem.element.classList.add('ui-navigation-item--active');
    await nextTick();
    expect(indicator.element.style.transform).toBe('translate(-50px, 0px) scale(1, 1)');
    await indicator.trigger('transitionend', { propertyName: 'transform' });
    expect(indicator.element.style.left).toBe('10px');
    expect(indicator.element.style.transform).toBe('');
  });

  it('commits the shared indicator without a flight when motion is reduced', async () => {
    const { indicator, firstItem, secondItem } = mountIndicatorSurface();
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((element: Element) => {
      const style = computed(element);
      if (element !== indicator.element) return style;
      return { zoom: style.zoom, transitionDuration: '0s' } as CSSStyleDeclaration;
    }) as typeof window.getComputedStyle);

    firstItem.element.setAttribute('aria-current', 'page');
    await nextTick();

    firstItem.element.classList.remove('ui-navigation-item--active');
    secondItem.element.classList.add('ui-navigation-item--active');
    await nextTick();

    expect(indicator.element.style.left).toBe('60px');
    expect(indicator.element.style.transform).toBe('');
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
    expect(wrapper.attributes('data-surface')).toBe('glass-elevated');
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'ui-dock',
        'ui-dock--compact',
        'ui-control-surface',
        'ui-control-surface--scale-lg',
        'material-glass-elevated',
      ]),
    );
    expect(wrapper.classes()).toContain('ui-control-surface--shared-indicator');
    expect(wrapper.find('.ui-control-surface__divider').exists()).toBe(true);
  });
});
