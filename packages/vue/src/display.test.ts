import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import UiBadge from './components/display/UiBadge.vue';
import UiDisclosure from './components/display/UiDisclosure.vue';
import UiNotice from './components/display/UiNotice.vue';
import UiSkeleton from './components/display/UiSkeleton.vue';
import UiStatCard from './components/display/UiStatCard.vue';
import UiStatusIndicator from './components/display/UiStatusIndicator.vue';
import UiTable from './components/display/UiTable.vue';
import UiTimeline from './components/display/UiTimeline.vue';
import UiStepFlow from './components/navigation/UiStepFlow.vue';
import UiTooltipSurface from './components/overlays/UiTooltipSurface.vue';
import UiCard from './components/surfaces/UiCard.vue';
import UiSurface from './components/surfaces/UiSurface.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
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

describe('display components', () => {
  it('keeps Card grouping separate from Glass material', () => {
    const badge = mount(UiBadge, {
      props: { variant: 'danger', size: 'md' },
      slots: { default: 'Error' },
    });
    expect(badge.classes()).toEqual(
      expect.arrayContaining(['ui-badge', 'ui-badge--danger', 'ui-badge--md']),
    );

    const card = mount(UiCard, { attrs: { class: 'max-w-container-sm' } });
    expect(card.classes()).toEqual(
      expect.arrayContaining(['ui-card', 'material-role-panel', 'max-w-container-sm']),
    );
    expect(card.attributes('data-surface')).toBe('auto');

    const bareCard = mount(UiCard, { props: { surface: 'none' } });
    expect(bareCard.attributes('data-surface')).toBe('none');
    expect(bareCard.classes().some((className) => className.startsWith('material-role-'))).toBe(
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
        'material-role-compact-overlay',
        'ui-tooltip-surface--accent',
      ]),
    );
    expect(tooltip.attributes('data-neoverse-surface-hover')).toBe('static');
    expect(tooltip.attributes()).toHaveProperty('data-neoverse-tooltip-surface');
    expect(tooltip.get('.ui-tooltip-surface__content').text()).toBe('12 contributions');
    expect(tooltip.get('.ui-tooltip-surface__content').classes()).toContain('nv-appear');

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
    expect(table.classes()).not.toContain('ui-table--striped');
    expect(table.classes()).not.toContain('ui-table--hoverable');
    expect(table.get('tbody').text()).toBe('Static');
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

describe('Presentation data', () => {
  it('keeps a zero metric and renders untrusted metric text without HTML', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const wrapper = mount(UiStatCard, {
      props: { label: payload, value: 0, unit: 'ms', footnote: payload },
    });
    expect(wrapper.get('dt').text()).toBe(payload);
    expect(wrapper.get('dd').text()).toBe('0ms');
    expect(wrapper.find('img').exists()).toBe(false);
    await wrapper.setProps({ value: payload });
    expect(wrapper.get('dd').text()).toBe(`${payload}ms`);
    expect(wrapper.find('img').exists()).toBe(false);
    wrapper.unmount();
  });

  it('updates timeline order and optional dates without interpreting titles as HTML', async () => {
    const payload = '<script>alert(1)</script>';
    const first = { id: 'first', title: payload, time: 'October', dateTime: '2026-10' };
    const second = { id: 'second', title: 'Release', description: 'Ready' };
    const wrapper = mount(UiTimeline, { props: { items: [first, second] } });
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-10');
    expect(wrapper.get('.ui-timeline__content').element.firstElementChild?.tagName).toBe('TIME');
    expect(wrapper.get('.ui-timeline__node').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('script').exists()).toBe(false);
    await wrapper.setProps({
      items: [second, { id: first.id, title: first.title }],
    });
    expect(wrapper.findAll('li').map((item) => item.get('p').text())).toEqual(['Release', payload]);
    expect(wrapper.find('time').exists()).toBe(false);
    wrapper.unmount();
  });

  it('moves current-step semantics when consumer state advances or resets', async () => {
    const wrapper = mount(UiStepFlow, {
      props: {
        items: [
          { id: 'plan', title: 'Plan', status: 'current' },
          { id: 'ship', title: '<img src=x>', status: 'pending' },
        ],
      },
    });
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Plan');
    expect(wrapper.find('img').exists()).toBe(false);
    await wrapper.setProps({
      items: [
        { id: 'plan', title: 'Plan', status: 'complete', statusLabel: '已完成' },
        { id: 'ship', title: 'Ship', status: 'current', statusLabel: '当前步骤' },
      ],
    });
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Ship');
    expect(wrapper.findAll('[aria-current="step"]')).toHaveLength(1);
    expect(wrapper.get('[aria-current="step"] .ui-badge--info').text()).toBe('当前步骤');
    const completed = wrapper.get('.ui-step-flow__item--complete');
    expect(completed.find('.ui-step-flow__marker svg').exists()).toBe(true);
    expect(completed.get('.ui-step-flow__status').text()).toBe('已完成');
    await wrapper.setProps({
      items: [
        { id: 'plan', title: 'Plan' },
        { id: 'ship', title: 'Ship' },
      ],
    });
    expect(wrapper.find('[aria-current]').exists()).toBe(false);
    expect(wrapper.findAll('.ui-step-flow__marker').map((marker) => marker.text())).toEqual([
      '1',
      '2',
    ]);
    expect(wrapper.find('.ui-step-flow__status').exists()).toBe(false);
    wrapper.unmount();
  });
});
