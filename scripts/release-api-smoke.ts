/** API checks shared by local tarballs and registry releases from 0.3.1 onward. */
export function releaseApiSmoke(versions: ReadonlyMap<string, string>, published: boolean): string {
  const includesReleaseApi = (name: string): boolean => {
    if (!published) return true;
    const version = versions.get(name);
    if (!version) throw new Error(`Missing release version for ${name}`);
    return Bun.semver.satisfies(version, '>=0.3.1');
  };
  const checks: string[] = [];

  if (includesReleaseApi('@neoverse-ui/react')) {
    checks.push(
      `import * as ReactAdapters from '@neoverse-ui/react';\n` +
        `for (const name of ['UiControlSurface', 'UiNavigationItem', 'UiSegmentedControl', 'UiBadge', 'UiStatusIndicator', 'UiTooltipSurface', 'UiSkeleton', 'UiScrollbar', 'UiTerminalSurface', 'UiTerminalTranscript', 'UiTerminalLine', 'UiTerminalPrompt', 'UiTerminalEcho', 'UiStatCard', 'UiTimeline', 'UiStepFlow'] as const) if (typeof ReactAdapters[name] !== 'function') throw new Error('missing React adapter: ' + name);\n` +
        `const reactSegments: ReactAdapters.UiSegmentedControlProps = { options: [{ value: 'en', label: 'English' }], value: 'en', onValueChange: value => { void value; } };\n` +
        `const reactPrompt: ReactAdapters.UiTerminalPromptProps = { label: 'Command', value: 'he', suggestion: 'help', segments: [{ id: 'host', label: 'local', tone: 'host' }] };\n` +
        `const reactEcho: ReactAdapters.UiTerminalEchoProps = { text: 'echo hello', segments: reactPrompt.segments };\n` +
        `const reactMetric: ReactAdapters.UiStatCardProps = { label: 'Latency', value: 0, unit: 'ms' };\n` +
        `const reactHeader: ReactAdapters.UiTerminalSurfaceProps = { title: 'Smoke terminal', header: 'Custom header' };\n` +
        `void [reactSegments, reactPrompt, reactEcho, reactMetric, reactHeader];\n`,
    );
  }

  if (includesReleaseApi('@neoverse-ui/vue')) {
    checks.push(
      `import { UiTerminalEcho, type TerminalEchoProps } from '@neoverse-ui/vue';\n` +
        `const terminalEchoProps: TerminalEchoProps = { text: 'echo hello', segments: [{ id: 'host', label: 'local', tone: 'host' }] };\n` +
        `if (!UiTerminalEcho) throw new Error('missing Vue terminal echo');\n` +
        `void terminalEchoProps;\n`,
    );
  }

  if (includesReleaseApi('@neoverse-ui/tokens')) {
    checks.push(
      `import { cssVariables as releaseCssVariables, glassMaterial } from '@neoverse-ui/tokens';\n` +
        `if (glassMaterial.name.en !== 'Aurora Glass' || glassMaterial.name.zh !== '极光玻璃' || glassMaterial.tiers.subtle.en !== 'Light' || glassMaterial.tiers.elevated.en !== 'Standard' || glassMaterial.tiers.immersive.en !== 'Immersive') throw new Error('public Glass material names are incomplete');\n` +
        `if (releaseCssVariables.components.controlSurface.trailingPadding !== '--neoverse-control-surface-trailing-padding' || releaseCssVariables.components.scrollbar.immersive.railInset !== '--neoverse-scrollbar-immersive-rail-inset' || releaseCssVariables.components.scrollbar.immersive.thumbHoverBorderWidth !== '--neoverse-scrollbar-immersive-thumb-hover-border-width') throw new Error('public 0.3.1 token map is incomplete');\n`,
    );
  }

  return checks.join('');
}
