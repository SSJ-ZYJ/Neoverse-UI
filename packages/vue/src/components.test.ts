import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import UiAction from './UiAction.vue';
import UiBadge from './UiBadge.vue';
import UiButton from './UiButton.vue';
import UiCard from './UiCard.vue';
import UiControlSurface from './UiControlSurface.vue';
import UiGlassSurface from './UiGlassSurface.vue';
import UiIconButton from './UiIconButton.vue';
import UiNavigationItem from './UiNavigationItem.vue';
import UiScrollbar from './UiScrollbar.vue';
import UiSegmentedControl from './UiSegmentedControl.vue';
import UiSkeleton from './UiSkeleton.vue';
import UiStatusIndicator from './UiStatusIndicator.vue';
import UiSurface from './UiSurface.vue';

const options = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details', disabled: true },
  { value: 'activity', label: 'Activity' },
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('UiButton', () => {
  it('opts the shared button surface into the project Glass material', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['ui-button', 'material-glass-subtle', 'rounded-control-inner']),
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
      expect.arrayContaining(['self-stretch', 'px-3', 'text-label']),
    );
    expect(stretched.classes()).not.toContain('h-8');

    const sized = mount(UiButton, { slots: { default: 'Sized' } });
    expect(sized.classes()).toContain('h-8');
    expect(sized.classes()).not.toContain('self-stretch');
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
      expect.arrayContaining([
        'ui-button--secondary',
        'focus-visible:ring-focus',
        'duration-fast',
        'ease-standard',
        'font-medium',
        'h-9',
        'px-4',
      ]),
    );

    await button.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('[aria-hidden="true"]').exists()).toBe(true);

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('motion-safe:animate-spin');
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

    expect(button.classes()).toContain('disabled:cursor-not-allowed');
    expect(button.classes()).not.toContain('disabled:pointer-events-none');
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
        'rounded-control-inner',
      ]),
    );
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
    expect(action.classes().some((className) => className.startsWith('material-glass-'))).toBe(false);
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
    expect(solid.classes()).toEqual(
      expect.arrayContaining(['bg-surface-raised', 'border-default', 'shadow-raised']),
    );
    expect(solid.classes()).not.toContain('material-glass-subtle');
    expect(solid.attributes('data-surface')).toBe('elevated');
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
      expect.arrayContaining(['ui-button--ghost', 'size-7', 'focus-visible:ring-2']),
    );

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('motion-safe:animate-spin');
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

    expect(stretched.classes()).toEqual(expect.arrayContaining(['w-8', 'self-stretch']));
    expect(stretched.classes()).not.toContain('size-8');

    const sized = mount(UiIconButton, { props: { label: 'Add' }, slots: { default: 'icon' } });
    expect(sized.classes()).toContain('size-8');
    expect(sized.classes()).not.toContain('self-stretch');
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

    const glass = mount(UiGlassSurface, { props: { variant: 'immersive' } });
    expect(glass.classes()).toEqual(
      expect.arrayContaining(['material-glass-immersive', 'rounded-card', 'p-4']),
    );

    const glassCard = mount(UiGlassSurface, { props: { variant: 'card' } });
    expect(glassCard.classes()).toEqual(
      expect.arrayContaining(['material-glass-card', 'rounded-card', 'p-4']),
    );
    const semanticGlassCard = mount(UiGlassSurface, {
      attrs: { 'aria-label': 'Project card' },
      props: { as: 'article', variant: 'card' },
    });
    expect(semanticGlassCard.element.tagName).toBe('ARTICLE');
    expect(semanticGlassCard.attributes('aria-label')).toBe('Project card');
    expect(semanticGlassCard.classes()).toContain('material-glass-card');

    const card = mount(UiCard, { attrs: { class: 'max-w-container-sm' } });
    expect(card.classes()).toEqual(
      expect.arrayContaining(['ui-card', 'rounded-card', 'p-4', 'max-w-container-sm']),
    );
    expect(card.classes()).not.toContain('material-glass-elevated');
    expect(card.classes().some((className) => className.startsWith('material-glass-'))).toBe(false);

    const standardSurfaceCard = mount(UiCard, {
      props: { surface: 'elevated' },
    });
    expect(standardSurfaceCard.classes()).toEqual(
      expect.arrayContaining(['border-default', 'bg-surface-raised', 'shadow-raised']),
    );
    expect(standardSurfaceCard.classes()).not.toContain('material-glass-elevated');

    const surface = mount(UiSurface, {
      props: { as: 'section', surface: 'glass-card' },
      attrs: { 'aria-label': 'Shared surface' },
    });
    expect(surface.element.tagName).toBe('SECTION');
    expect(surface.attributes('aria-label')).toBe('Shared surface');
    expect(surface.attributes('data-surface')).toBe('glass-card');
    expect(surface.classes()).toContain('material-glass-card');

    const skeleton = mount(UiSkeleton, { props: { variant: 'circle' } });
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(skeleton.classes()).toEqual(
      expect.arrayContaining([
        'ui-skeleton',
        'skeleton-surface',
        'ui-skeleton--circle',
        'ui-skeleton--shimmer',
        'rounded-pill',
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
describe('UiSegmentedControl', () => {
  it('uses the shared Glass surface by default and can opt out of outer chrome', () => {
    const glass = mount(UiSegmentedControl, { props: { options } });
    expect(glass.classes()).toContain('material-glass-subtle');
    expect(glass.attributes('data-surface')).toBe('glass-subtle');

    const bare = mount(UiSegmentedControl, { props: { options, surface: 'none' } });
    expect(bare.classes()).not.toContain('material-glass-subtle');
    expect(bare.attributes('data-surface')).toBe('none');
    expect(bare.find('.ui-segmented-control__slider').exists()).toBe(true);
  });

  it('falls back to the compact size for unsupported values', () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, size: 'md' as never },
    });
    const firstButton = wrapper.find('button');

    expect(firstButton.classes()).toEqual(expect.arrayContaining(['h-7', 'px-2', 'text-caption']));
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
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['gap-1', 'rounded-control']));
    expect(wrapper.classes()).not.toEqual(expect.arrayContaining(['border-subtle']));
    expect(buttons[0]?.classes()).toEqual(
      expect.arrayContaining([
        'ui-segmented-control__option',
        'ui-segmented-control__option--active',
        'duration-standard',
        'ease-emphasized',
      ]),
    );
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
    expect(loadingIndicator.classes()).toContain('motion-safe:animate-spin');
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
