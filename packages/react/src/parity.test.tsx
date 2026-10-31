import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  UiBadge,
  UiControlSurface,
  UiNavigationItem,
  UiScrollbar,
  UiSegmentedControl,
  UiSkeleton,
  UiStatCard,
  UiStatusIndicator,
  UiStepFlow,
  UiTerminalEcho,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
  UiTimeline,
  UiTooltipSurface,
} from './index';

test('navigation retains native link semantics, accessible compact labels and a decorative marker', () => {
  const html = renderToStaticMarkup(
    <UiNavigationItem label="Documentation" href="/docs" active compact icon={<svg />} />,
  );
  expect(html).toContain('href="/docs"');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('ui-navigation-item__label sr-only');
  expect(html).toContain('ui-navigation-item__indicator');
  const disabled = renderToStaticMarkup(
    <UiNavigationItem label="Locked" href="/locked" disabled />,
  );
  expect(disabled).not.toContain('href=');
  expect(disabled).toContain('aria-disabled="true"');
  expect(disabled).toContain('tabindex="-1"');
  const routed = renderToStaticMarkup(
    <UiNavigationItem asChild label="Routed docs" active>
      <a href="/routed">Router content</a>
    </UiNavigationItem>,
  );
  expect(routed).toContain('href="/routed"');
  expect(routed).toContain('Routed docs');
  expect(routed).not.toContain('Router content');
});

test('control surface forwards semantics and renders trailing content only when supplied', () => {
  const html = renderToStaticMarkup(
    <UiControlSurface
      as="nav"
      aria-label="Navigation"
      navigationIndicator
      trailing={<button type="button">Theme</button>}
    >
      <UiNavigationItem as="button" label="Home" active />
    </UiControlSurface>,
  );
  expect(html).toContain('<nav');
  expect(html).toContain('aria-label="Navigation"');
  expect(html).toContain('ui-control-surface--shared-indicator');
  expect(html).toContain('ui-control-surface__group--trailing');
  expect(renderToStaticMarkup(<UiControlSurface>Home</UiControlSurface>)).not.toContain(
    'ui-control-surface__divider',
  );
});

test('segmented selection has one tab stop, skips disabled defaults and respects controlled invalid values', () => {
  const options = [
    { value: 'blocked', label: 'Blocked', disabled: true },
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文', ariaLabel: 'Chinese' },
  ];
  const html = renderToStaticMarkup(
    <UiSegmentedControl options={options} defaultValue="blocked" ariaLabel="Language" />,
  );
  expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  expect(html).toContain('aria-label="Chinese"');
  expect(html).toContain('role="radiogroup"');
  // Before the browser measures every option, the slider keeps the selected
  // content-sized grid column rather than an estimated offset and width.
  expect(html).toContain('--segment-index');
  expect(html).not.toContain('--segment-active-offset');
  expect(html).not.toContain('--segment-active-width');
  expect(html).not.toContain('--segment-active-column');
  const invalid = renderToStaticMarkup(<UiSegmentedControl options={options} value="missing" />);
  expect(invalid).not.toContain('aria-checked="true"');
  expect(invalid).not.toContain('ui-segmented-control__slider');
  expect(renderToStaticMarkup(<UiSegmentedControl options={[]} loading />)).toContain(
    'aria-busy="true"',
  );
});

test('badge and status keep labels accessible while hiding decorative elements', () => {
  expect(
    renderToStaticMarkup(
      <UiBadge variant="danger" size="lg">
        Failure
      </UiBadge>,
    ),
  ).toContain('ui-badge__label">Failure');
  const html = renderToStaticMarkup(
    <UiStatusIndicator loading pulse status="warning">
      Waiting
    </UiStatusIndicator>,
  );
  expect(html).toContain('ui-status-indicator--loading');
  expect(html).not.toContain('ui-status-indicator--pulse');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('ui-status-indicator__label">Waiting');
});

test('skeleton dimensions preserve caller styles and tooltips use shared entrance attributes', () => {
  const html = renderToStaticMarkup(
    <UiSkeleton
      variant="rect"
      effect="none"
      width={120}
      height="2rem"
      radius="8px"
      style={{ display: 'block' }}
    />,
  );
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('width:120px');
  expect(html).toContain('height:2rem');
  expect(html).toContain('--ui-skeleton-radius:8px');
  expect(html).toContain('display:block');
  expect(html).toContain('ui-skeleton--static');
  const tooltip = renderToStaticMarkup(
    <UiTooltipSurface as="aside" role="tooltip">
      Hint
    </UiTooltipSurface>,
  );
  expect(tooltip).toContain('<aside');
  expect(tooltip).toContain('role="tooltip"');
  expect(tooltip).toContain('data-neoverse-motion="veil"');
  expect(tooltip).toContain('data-neoverse-surface-overflow="visible"');
});

test('metric, timeline and steps retain semantic values, dates, ordering and custom renderers', () => {
  const metric = renderToStaticMarkup(<UiStatCard label="Latency" value={0} unit="ms" />);
  expect(metric).toContain('<dt');
  expect(metric).toContain('>0<span');
  expect(metric).not.toContain('ui-stat-card__trend');
  const timeline = renderToStaticMarkup(
    <UiTimeline
      items={[{ id: 'release', title: 'Release', time: 'October', dateTime: '2026-10' }]}
    />,
  );
  expect(timeline).toContain('<ol');
  expect(timeline).toMatch(/datetime="2026-10"/i);
  const steps = renderToStaticMarkup(
    <UiStepFlow
      items={[
        { id: 'build', title: 'Build', status: 'complete' },
        { id: 'test', title: 'Test', status: 'current', statusLabel: 'Running' },
      ]}
    />,
  );
  expect(steps.match(/aria-current="step"/g)).toHaveLength(1);
  expect(steps).toContain('ui-step-flow__status-icon');
  expect(steps).toContain('Running');
  expect(
    renderToStaticMarkup(
      <UiTimeline
        items={[{ id: 'a', title: 'Hidden' }]}
        renderItem={({ index }) => <b>{index}</b>}
      />,
    ),
  ).toContain('<b>0</b>');
  expect(
    renderToStaticMarkup(
      <UiStepFlow
        items={[{ id: 'a', title: 'Hidden' }]}
        renderItem={() => <b>Custom</b>}
        renderStatus={() => 'Status'}
      />,
    ),
  ).toContain('<b>Custom</b>');
});

test('terminal composition forwards native input constraints without leaking suggestions or rendering HTML', () => {
  const html = renderToStaticMarkup(
    <UiTerminalSurface title="Console" actions={<button type="button">Clear</button>}>
      <UiTerminalTranscript live="off">
        <UiTerminalLine kind="command" preformatted text="<script>no</script>" />
        <UiTerminalPrompt
          label="Command"
          value="he"
          suggestion="help"
          readOnly
          required
          name="command"
          segments={[{ id: 'host', label: 'local', tone: 'host' }]}
        />
      </UiTerminalTranscript>
    </UiTerminalSurface>,
  );
  expect(html).toContain('aria-label="Console"');
  expect(html).toContain('role="toolbar"');
  expect(html).toContain('role="log" aria-live="off"');
  expect(html).toContain('&lt;script&gt;no&lt;/script&gt;');
  expect(html).toMatch(/readonly=""/i);
  expect(html).toContain('required=""');
  expect(html).toContain('name="command"');
  expect(html).toMatch(/autocomplete="off"/i);
  expect(html).not.toContain('ui-terminal-prompt__ghost');
  expect(html).not.toContain('suggestion=');
  const ids = [...html.matchAll(/(?:for|id)="([^"]+)"/g)].map((match) => match[1]);
  expect(ids[0]).toBe(ids[1]);
});

test('terminal echo renders recorded commands with prompt chrome and no editor', () => {
  const html = renderToStaticMarkup(
    <UiTerminalEcho
      text="<img src=x onerror=alert(1)>"
      segments={[
        { id: 'host', label: 'visitor@xca', tone: 'host' },
        { id: 'path', label: '~', tone: 'path' },
      ]}
    />,
  );
  expect(html).not.toContain('<input');
  expect(html).toContain('data-readonly="true"');
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  expect(html).toContain('data-tone="host"');
  expect(html).toContain('data-tone="path"');
  expect(html).toContain('ui-terminal-prompt__lead');
  expect(html).toContain('ui-terminal-echo__text');
  const plain = renderToStaticMarkup(<UiTerminalEcho text={'echo 你好\n  next'} />);
  expect(plain).not.toContain('ui-terminal-prompt__context');
  expect(plain).toContain('echo 你好\n  next');
  expect(plain).not.toMatch(/<(input|button|label)|tabindex=/i);
});

test('scrollbar is safe during server rendering and hides decorative controls from accessibility', () => {
  const html = renderToStaticMarkup(<UiScrollbar hideNative autoHideMs={0} refreshKey="route" />);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('data-visible="false"');
  expect(html).toContain('data-hide-native="true"');
  expect(html).not.toContain('refreshKey');
  // Consumers can opt out of native hiding while keeping the rail decorative.
  expect(renderToStaticMarkup(<UiScrollbar hideNative={false} />)).toContain(
    'data-hide-native="false"',
  );
});
