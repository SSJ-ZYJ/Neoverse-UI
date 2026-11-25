import {
  type TerminalSegmentIcon,
  type TerminalTitlebar,
  UiBadge,
  UiButton,
  UiControlSurface,
  UiDock,
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
} from '@neoverse-ui/react';
import { Fragment, useState } from 'react';
import { appCopy, type Locale, localize } from '../playground-content';
import {
  type FixtureCopy,
  fixtureLanguageSegments,
  pickNext,
  type TerminalHistoryLine,
  terminalSegmentsFor,
} from './fixture-copy';

export default function ParityFixturesSection({
  locale,
  contractMode,
  copy,
}: {
  locale: Locale;
  contractMode: boolean;
  copy: FixtureCopy;
}) {
  const [active, setActive] = useState(0);
  const [segment, setSegment] = useState('en');
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reject, setReject] = useState(false);
  const [options, setOptions] = useState(true);
  const [command, setCommand] = useState('');
  const [terminalTitlebar, setTerminalTitlebar] = useState<TerminalTitlebar>('auto');
  const [terminalHostIcon, setTerminalHostIcon] = useState<TerminalSegmentIcon>('auto');
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const terminalSegments = terminalSegmentsFor(terminalHostIcon);
  const cycleTitlebar = () =>
    setTerminalTitlebar((value) =>
      pickNext(['auto', 'macos', 'windows', 'linux', 'default'], value),
    );
  const cycleHostIcon = () =>
    setTerminalHostIcon((value) =>
      pickNext(['auto', 'windows-terminal', 'powershell', 'macos'], value),
    );
  const [lines, setLines] = useState<TerminalHistoryLine[]>([
    { text: 'help --all', segments: terminalSegmentsFor('auto').map((entry) => ({ ...entry })) },
  ]);
  const [follow, setFollow] = useState(true);
  const [scrollbar, setScrollbar] = useState(true);
  const [hideNative, setHideNative] = useState(false);
  const [password, setPassword] = useState(false);
  const [mounted, setMounted] = useState(true);
  const text = (en: string, zh: string) => (locale === 'zh' ? zh : en);

  return (
    <section data-react-parity-fixture className="grid min-w-0 gap-4">
      <h2 className="text-subtitle font-heading">
        {text('Shared framework components', '跨框架共享组件')}
      </h2>
      <div className="flex flex-wrap gap-3">
        <UiBadge data-react-adapter="UiBadge" variant="success">
          {copy.ready}
        </UiBadge>
        <UiStatusIndicator data-react-adapter="UiStatusIndicator" loading={loading}>
          {copy.runtime}
        </UiStatusIndicator>
        <UiSkeleton
          data-react-adapter="UiSkeleton"
          variant="rect"
          width={120}
          height={24}
          radius="8px"
        />
        <UiTooltipSurface data-react-adapter="UiTooltipSurface">{copy.notice}</UiTooltipSurface>
      </div>
      <UiStatCard
        data-react-adapter="UiStatCard"
        label={copy.count}
        value={lines.length}
        unit={text('lines', '行')}
        trend={copy.ready}
      />
      <UiTimeline
        data-react-adapter="UiTimeline"
        items={[{ id: 'ready', title: copy.ready, time: '2026', dateTime: '2026' }]}
      />
      <UiStepFlow
        data-react-adapter="UiStepFlow"
        items={[
          { id: 'build', title: copy.button, status: 'complete' },
          { id: 'runtime', title: copy.runtime, status: 'current', statusLabel: copy.ready },
        ]}
      />
      <UiControlSurface
        data-react-adapter="UiControlSurface"
        navigationIndicator
        data-parity-navigation
      >
        <UiNavigationItem
          data-react-adapter="UiNavigationItem"
          as="button"
          label={copy.home}
          active={active === 0}
          suffix={
            <small aria-hidden="true" data-contract-navigation-suffix>
              {' · 01'}
            </small>
          }
          decoration={
            <span aria-hidden="true" data-contract-navigation-decoration>
              •
            </span>
          }
          onClick={() => setActive(0)}
        />
        <UiNavigationItem
          as="button"
          label={copy.docs}
          active={active === 1}
          onClick={() => setActive(1)}
        />
      </UiControlSurface>
      <UiDock data-parity-dock>
        <UiNavigationItem
          as="button"
          label={copy.home}
          active={active === 0}
          onClick={() => setActive(0)}
        />
        <UiNavigationItem
          as="button"
          label={copy.docs}
          active={active === 1}
          onClick={() => setActive(1)}
        />
      </UiDock>
      <UiSegmentedControl
        data-react-adapter="UiSegmentedControl"
        ariaLabel={text('Language', '语言')}
        options={[
          { value: 'en', label: 'EN' },
          { value: 'blocked', label: text('Unavailable', '不可用'), disabled: true },
          { value: 'zh', label: '中文' },
        ]}
        value={segment}
        onValueChange={(value) => {
          if (!reject) setSegment(value);
        }}
        disabled={blocked}
      />
      <UiSegmentedControl
        data-parity-uncontrolled
        shape="rounded"
        ariaLabel={text('Uncontrolled language', '非受控语言')}
        options={
          options
            ? [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
              ]
            : [{ value: 'c', label: 'C' }]
        }
        defaultValue="b"
      />
      <UiSegmentedControl
        data-segmented-example="language"
        variant="language"
        ariaLabel={localize(appCopy.language.label, locale)}
        options={fixtureLanguageSegments(locale)}
        className="justify-self-start"
      />
      <div className="flex flex-wrap gap-2">
        <UiButton data-parity-disabled onClick={() => setBlocked((value) => !value)}>
          {text('Toggle disabled', '切换禁用')}
        </UiButton>
        <UiButton data-parity-loading onClick={() => setLoading((value) => !value)}>
          {text('Toggle loading', '切换加载')}
        </UiButton>
        <UiButton data-parity-reject onClick={() => setReject((value) => !value)}>
          {text('Reject selection', '拒绝选择更新')}
        </UiButton>
        <UiButton data-parity-options onClick={() => setOptions((value) => !value)}>
          {text('Replace options', '替换选项')}
        </UiButton>
        <UiButton data-parity-follow onClick={() => setFollow((value) => !value)}>
          {text('Toggle tail following', '切换末尾跟随')}
        </UiButton>
        <UiButton data-parity-scrollbar onClick={() => setScrollbar((value) => !value)}>
          {text('Toggle scrollbar', '切换滚动条')}
        </UiButton>
        <UiButton data-parity-native onClick={() => setHideNative((value) => !value)}>
          {text('Toggle native scrollbar', '切换原生滚动条')}
        </UiButton>
        <UiButton data-parity-password onClick={() => setPassword((value) => !value)}>
          {text('Toggle password input', '切换密码输入')}
        </UiButton>
        <UiButton data-parity-mount onClick={() => setMounted((value) => !value)}>
          {text('Toggle terminal', '切换终端')}
        </UiButton>
        <UiButton data-react-titlebar-cycle onClick={cycleTitlebar}>
          {terminalTitlebar}
        </UiButton>
        <UiButton data-react-icon-cycle onClick={cycleHostIcon}>
          {terminalHostIcon}
        </UiButton>
      </div>
      {mounted ? (
        <UiTerminalSurface
          data-react-adapter="UiTerminalSurface"
          title={text('React terminal', 'React 终端')}
          titlebar={terminalTitlebar}
          maximized={terminalMaximized}
          onWindowAction={(action) => action === 'maximize' && setTerminalMaximized((v) => !v)}
          status={<UiStatusIndicator status="success">{copy.ready}</UiStatusIndicator>}
          actions={
            <>
              <UiButton
                data-parity-append
                onClick={() => setLines((previous) => [...previous, { text: 'Appended output' }])}
              >
                {text('Append output', '追加输出')}
              </UiButton>
              <UiButton onClick={() => setLines([])}>{text('Clear', '清空')}</UiButton>
            </>
          }
        >
          <UiTerminalTranscript
            data-react-adapter="UiTerminalTranscript"
            followTail={follow}
            style={{ height: 240 }}
          >
            <UiTerminalLine data-react-adapter="UiTerminalLine" tone="success" text={copy.ready} />
            {lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This transcript only appends lines or clears the whole list.
              <Fragment key={`${index}-${line.text}`}>
                {line.segments ? (
                  <UiTerminalEcho
                    data-react-adapter="UiTerminalEcho"
                    text={line.text}
                    segments={line.segments}
                  />
                ) : (
                  <UiTerminalLine text={line.text} />
                )}
              </Fragment>
            ))}
            <UiTerminalPrompt
              data-react-adapter="UiTerminalPrompt"
              label={text('Command', '命令')}
              value={command}
              onValueChange={setCommand}
              suggestion="help --all"
              disabled={blocked}
              readOnly={loading}
              type={password ? 'password' : 'text'}
              segments={terminalSegments}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing &&
                  !event.repeat &&
                  command.trim()
                ) {
                  event.preventDefault();
                  setLines((previous) => [
                    ...previous,
                    {
                      text: command,
                      segments: terminalSegments.map((segmentItem) => ({ ...segmentItem })),
                    },
                  ]);
                  setCommand('');
                }
              }}
            />
          </UiTerminalTranscript>
        </UiTerminalSurface>
      ) : null}
      {contractMode && scrollbar ? (
        <UiScrollbar
          data-react-adapter="UiScrollbar"
          hideNative={hideNative}
          // Keep the fixture at the product default. A 250ms window can elapse
          // before a slow WebKit compositor commits the revealed state, letting
          // show and auto-hide collapse into one render that never exposes the rail.
          autoHideMs={1200}
          refreshKey={lines.length}
        />
      ) : null}
    </section>
  );
}
