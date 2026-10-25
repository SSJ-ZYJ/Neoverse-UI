import {
  type TerminalPromptSegment,
  UiAction,
  UiBadge,
  UiBreadcrumb,
  UiButton,
  UiCard,
  UiCheckbox,
  UiControlSurface,
  UiDisclosure,
  UiDock,
  UiDropdownMenu,
  UiField,
  UiIconButton,
  UiInput,
  UiNavigationItem,
  UiNotice,
  UiPopover,
  UiPresence,
  UiRadioGroup,
  UiScrollbar,
  UiSegmentedControl,
  UiSelect,
  UiSkeleton,
  UiStatCard,
  UiStatusIndicator,
  UiStepFlow,
  UiSurface,
  UiSwitch,
  UiTable,
  UiTerminalEcho,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
  UiTextarea,
  UiTimeline,
  UiTooltipSurface,
} from '@neoverse-ui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { mountPlaygroundGlass } from './glass-runtime';
import { appCopy, localize } from './playground-content';
import type { ThemeMode } from './playground-types';
import { TextControlContractFixture } from './TextControlContractFixture';
import {
  applyThemeMode,
  isThemeMode,
  observeSystemTheme,
  persistThemeMode,
  resolveInitialThemeMode,
  syncThemeModeToQuery,
  themeModes,
} from './theme-runtime';

const locale = new URLSearchParams(window.location.search).get('lang') === 'zh' ? 'zh' : 'en';
const contractMode = new URLSearchParams(window.location.search).has('contract-fixtures');
document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';

/* The fixture resolves its theme with the same engine as the Design Lab shell:
   query parameter, then the shared preference record, then the system default.
   The server already renders the matching `data-theme`, so this first
   application is a no-op for deep links and only matters for stored modes. */
const initialThemeMode = resolveInitialThemeMode();
applyThemeMode(initialThemeMode, false);

const themeOptions = themeModes.map((mode) => ({
  value: mode,
  label: localize(appCopy.theme.options[mode], locale),
}));

const copy =
  locale === 'zh'
    ? {
        eyebrow: 'React Adapter Fixture',
        back: '返回设计实验室',
        title: 'React 运行态校验',
        description: '直接使用 React 组件，查看与 Vue 对应的组件能力、交互状态和共享样式。',
        actions: '动作与表面',
        forms: '表单契约',
        data: '数据、披露与 Presence',
        action: '打开文档',
        button: '交互按钮',
        icon: '增加计数',
        notice: 'React Notice 与 Vue 共用相同的语义样式契约。',
        noticeAction: '确认',
        card: 'React Card',
        surface: 'React Surface',
        count: '计数',
        email: '通知邮箱',
        emailDescription: '字段标签、错误状态和原生输入保持同一契约。',
        notes: '备注',
        runtime: '运行方式',
        native: '本地',
        remote: '远程',
        notifications: '版本发布通知',
        channel: '发布通道',
        stable: '稳定版',
        preview: '预览版',
        sync: '自动同步',
        table: '运行态组件状态',
        component: '组件',
        state: '状态',
        ready: 'Ready',
        disclosure: '查看运行态细节',
        disclosureBody: '原生 details/summary 语义由 React Adapter 保留。',
        presence: 'Presence 内容',
        presenceShow: '显示 Presence',
        presenceHide: '隐藏 Presence',
        popover: '打开 Popover',
        popoverBody: 'Popover 使用统一的 top-layer overlay runtime。',
        menu: '打开菜单',
        menuOpen: '打开',
        menuArchive: '归档',
        menuRemove: '移除',
        navigation: '导航组合',
        home: '首页',
        docs: '文档',
        currentPage: '当前章节',
        breadcrumb: '页面路径',
        dock: '快捷导航',
        compact: '切换紧凑布局',
        trailing: '切换尾部控件',
        nextPage: '切换当前页面',
      }
    : {
        eyebrow: 'React Adapter Fixture',
        back: 'Back to Design Lab',
        title: 'React runtime validation',
        description:
          'Explore the React components, their Vue counterparts, interactive states, and shared styles.',
        actions: 'Actions and surfaces',
        forms: 'Form contract',
        data: 'Data, disclosure, and presence',
        action: 'Open documentation',
        button: 'Interactive button',
        icon: 'Increase count',
        notice: 'React Notice shares the same semantic styling contract as Vue.',
        noticeAction: 'Acknowledge',
        card: 'React Card',
        surface: 'React Surface',
        count: 'Count',
        email: 'Notification email',
        emailDescription: 'Field labels, validation state, and native input share one contract.',
        notes: 'Notes',
        runtime: 'Runtime',
        native: 'Native',
        remote: 'Remote',
        notifications: 'Release notifications',
        channel: 'Release channel',
        stable: 'Stable',
        preview: 'Preview',
        sync: 'Automatic synchronization',
        table: 'Runtime component state',
        component: 'Component',
        state: 'State',
        ready: 'Ready',
        disclosure: 'Show runtime details',
        disclosureBody: 'Native details/summary semantics are preserved by the React adapter.',
        presence: 'Presence content',
        presenceShow: 'Show presence',
        presenceHide: 'Hide presence',
        popover: 'Open popover',
        popoverBody: 'Popover uses the shared top-layer overlay runtime.',
        menu: 'Open menu',
        menuOpen: 'Open',
        menuArchive: 'Archive',
        menuRemove: 'Remove',
        navigation: 'Navigation composition',
        home: 'Home',
        docs: 'Documentation',
        currentPage: 'Current chapter',
        breadcrumb: 'Page path',
        dock: 'Quick navigation',
        compact: 'Toggle compact layout',
        trailing: 'Toggle trailing control',
        nextPage: 'Change current page',
      };

const runtimeOptions = [
  { value: 'native', label: copy.native },
  { value: 'remote', label: copy.remote },
] as const;

const channelOptions = [
  { value: 'stable', label: copy.stable },
  { value: 'preview', label: copy.preview },
] as const;

const terminalSegments: readonly TerminalPromptSegment[] = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/playground', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch' },
];

function renderTerminalSegment(segment: TerminalPromptSegment) {
  return (
    <>
      {segment.tone === 'host' ? (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
          <path d="m4 6 2 2-2 2m4 0h3" />
        </svg>
      ) : null}
      <span className={segment.tone === 'host' ? 'sr-only' : undefined}>{segment.label}</span>
    </>
  );
}

type TerminalHistoryLine = {
  text: string;
  segments?: readonly TerminalPromptSegment[];
};

function ParityFixtures() {
  const [active, setActive] = useState(0);
  const [segment, setSegment] = useState('en');
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reject, setReject] = useState(false);
  const [options, setOptions] = useState(true);
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<TerminalHistoryLine[]>([
    { text: 'help --all', segments: terminalSegments.map((segment) => ({ ...segment })) },
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
        loading={loading}
      />
      <UiSegmentedControl
        data-parity-uncontrolled
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
      </div>
      {mounted ? (
        <UiTerminalSurface
          data-react-adapter="UiTerminalSurface"
          title={text('React terminal', 'React 终端')}
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
                    renderSegment={renderTerminalSegment}
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
              renderSegment={renderTerminalSegment}
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
                      segments: terminalSegments.map((segment) => ({ ...segment })),
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
          autoHideMs={250}
          refreshKey={lines.length}
        />
      ) : null}
    </section>
  );
}

function ReactFixture() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const selectedThemeMode = useCallback((value: string | number) => {
    if (!isThemeMode(value)) {
      return;
    }

    setThemeMode(value);
    applyThemeMode(value);
    persistThemeMode(value);
    syncThemeModeToQuery(value);
  }, []);
  useEffect(() => observeSystemTheme(), []);
  const [controlledOpen, setControlledOpen] = useState(false);
  const [controlledMounted, setControlledMounted] = useState(true);
  const [controlledDisabled, setControlledDisabled] = useState(false);
  const [dropdownDisabled, setDropdownDisabled] = useState(false);
  const [dismissAttempts, setDismissAttempts] = useState(0);
  const requestControlledOpen = useCallback((value: boolean) => {
    if (value) setControlledOpen(true);
    else setDismissAttempts((count) => count + 1);
  }, []);
  const [formNotifications, setFormNotifications] = useState(true);
  const [formChannel, setFormChannel] = useState<string | number>(2);
  const [formSync, setFormSync] = useState(true);
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState('runtime@neoverse.dev');
  const [numberValue, setNumberValue] = useState('1.5');
  const [notes, setNotes] = useState('Shared React runtime fixture');
  const [runtime, setRuntime] = useState<string | number>('native');
  const [selectBlockedState, setSelectBlockedState] = useState<'none' | 'disabled' | 'readonly'>(
    'none',
  );
  const [selectMounted, setSelectMounted] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [channel, setChannel] = useState<string | number>('stable');
  const [autoSync, setAutoSync] = useState(true);
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [menuSelection, setMenuSelection] = useState('');
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

  return (
    <main
      id="react-runtime-fixture"
      data-react-runtime-fixture
      className="mx-auto grid min-h-screen w-full max-w-container-xl gap-grid px-gutter-inline py-gutter-block"
    >
      <header className="grid max-w-container-lg gap-2">
        <UiAction
          className="justify-self-start"
          href={`/?lang=${locale}#consumer-parity`}
          size="sm"
          variant="ghost"
          data-react-runtime-return
        >
          {copy.back}
        </UiAction>
        <p className="text-label font-label text-accent-primary">{copy.eyebrow}</p>
        <h1 className="text-heading font-heading tracking-heading text-primary">{copy.title}</h1>
        <p className="text-body text-secondary">{copy.description}</p>
      </header>

      <UiSurface
        surface="glass-subtle"
        className="grid gap-4 rounded-card p-4"
        data-react-adapter="UiSurface"
      >
        <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.actions}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <UiAction
            href="#react-runtime-fixture"
            onClick={(event) => event.preventDefault()}
            variant="secondary"
            data-react-adapter="UiAction"
          >
            {copy.action}
          </UiAction>
          <UiButton
            variant="primary"
            onClick={() => setCount((value) => value + 1)}
            data-react-adapter="UiButton"
          >
            {copy.button} · {copy.count} {count}
          </UiButton>
          <UiIconButton
            label={copy.icon}
            variant="ghost"
            onClick={() => setCount((value) => value + 1)}
            data-react-adapter="UiIconButton"
          >
            +
          </UiIconButton>

          <div data-react-adapter="UiPopover">
            <UiPopover trigger={copy.popover} ariaLabel={copy.popover}>
              <p className="max-w-container-xs p-2 text-body-sm text-secondary">
                {copy.popoverBody}
              </p>
            </UiPopover>
          </div>

          <div data-react-adapter="UiDropdownMenu">
            <UiDropdownMenu
              trigger={copy.menu}
              ariaLabel={copy.menu}
              disabled={dropdownDisabled}
              items={[
                { id: 'open', label: copy.menuOpen },
                { id: 'archive', label: copy.menuArchive },
                ...(contractMode
                  ? [{ id: 'disabled', label: 'Disabled action', disabled: true }]
                  : []),
                { id: 'remove', label: copy.menuRemove, tone: 'danger' },
              ]}
              onSelect={(item) => setMenuSelection(item.id)}
            />
          </div>
        </div>

        <output className="text-caption text-secondary" aria-live="polite" data-react-overlay-state>
          {menuSelection}
        </output>

        <UiNotice
          variant="info"
          data-react-adapter="UiNotice"
          action={
            <UiButton size="sm" variant="ghost" surface="none">
              {copy.noticeAction}
            </UiButton>
          }
        >
          {copy.notice}
        </UiNotice>

        <UiCard as="article" surface="elevated" className="grid gap-2" data-react-adapter="UiCard">
          <h3 className="text-subtitle font-heading tracking-heading text-primary">{copy.card}</h3>
          <p className="text-body text-secondary" data-react-count>
            {copy.surface} · {copy.count} {count}
          </p>
        </UiCard>
      </UiSurface>

      <UiSurface surface="glass-subtle" className="grid gap-4 rounded-card p-4">
        <h2 className="text-subtitle font-heading tracking-heading text-primary">{copy.forms}</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <UiField
            controlId="react-runtime-email"
            label={copy.email}
            description={copy.emailDescription}
            required
            validation="success"
            data-react-adapter="UiField"
          >
            {(controlAttrs) => (
              <UiInput
                {...controlAttrs}
                value={email}
                validation="success"
                onChange={(event) => setEmail(event.currentTarget.value)}
                data-react-adapter="UiInput"
              />
            )}
          </UiField>

          <UiField controlId="react-runtime-notes" label={copy.notes}>
            {(controlAttrs) => (
              <UiTextarea
                {...controlAttrs}
                value={notes}
                onChange={(event) => setNotes(event.currentTarget.value)}
                data-react-adapter="UiTextarea"
              />
            )}
          </UiField>

          {contractMode && (
            <div data-number-fixtures>
              <UiInput
                type="number"
                name="amount"
                aria-label="Amount"
                min="0"
                max="2"
                step="0.5"
                value={numberValue}
                onChange={(event) => setNumberValue(event.currentTarget.value)}
              />
              <output data-number-value>{numberValue}</output>
              <UiInput type="number" aria-label="Any step" step="any" defaultValue="1.25" />
              <UiInput type="number" aria-label="Disabled number" disabled defaultValue="4" />
              <UiInput type="number" aria-label="Readonly number" readOnly value="5" />
            </div>
          )}

          <UiField label={copy.runtime}>
            {selectMounted ? (
              <UiSelect
                value={runtime}
                options={runtimeOptions}
                name="runtime"
                onValueChange={setRuntime}
                data-react-adapter="UiSelect"
                disabled={selectBlockedState === 'disabled'}
                readOnly={selectBlockedState === 'readonly'}
              />
            ) : null}
            {contractMode ? (
              <div data-select-block-controls>
                <button
                  type="button"
                  data-select-block-disabled
                  onClick={() =>
                    setSelectBlockedState((value) => (value === 'disabled' ? 'none' : 'disabled'))
                  }
                >
                  Toggle disabled
                </button>
                <button
                  type="button"
                  data-select-block-readonly
                  onClick={() =>
                    setSelectBlockedState((value) => (value === 'readonly' ? 'none' : 'readonly'))
                  }
                >
                  Toggle readonly
                </button>
                <button type="button" data-select-unmount onClick={() => setSelectMounted(false)}>
                  Unmount select
                </button>
              </div>
            ) : null}
          </UiField>

          <UiField label={copy.channel}>
            <UiRadioGroup
              name="release-channel"
              value={channel}
              options={channelOptions}
              onValueChange={setChannel}
              aria-label={copy.channel}
              data-react-adapter="UiRadioGroup"
            />
          </UiField>

          {contractMode ? (
            <div data-unnamed-radio-fixture>
              <UiRadioGroup
                options={[
                  { value: 'first', label: 'Unnamed first' },
                  { value: 'second', label: 'Unnamed second' },
                ]}
                aria-label="Unnamed radio group"
              />
            </div>
          ) : null}

          <div data-react-adapter="UiCheckbox">
            <UiCheckbox
              checked={notifications}
              onCheckedChange={setNotifications}
              aria-label={copy.notifications}
            >
              {copy.notifications}
            </UiCheckbox>
          </div>

          <div data-react-adapter="UiSwitch">
            <UiSwitch checked={autoSync} onCheckedChange={setAutoSync} aria-label={copy.sync}>
              {copy.sync}
            </UiSwitch>
          </div>
        </div>

        <output className="text-caption text-secondary" data-react-form-state aria-live="polite">
          {email} · {notes} · {String(runtime)} · {String(channel)} · {String(notifications)} ·{' '}
          {String(autoSync)}
        </output>
      </UiSurface>

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
                <UiButton size="sm" surface="none" onClick={() => setCount((value) => value + 1)}>
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
          <UiRadioGroup
            name="theme"
            value={themeMode}
            options={themeOptions}
            aria-label={localize(appCopy.theme.label, locale)}
            onValueChange={selectedThemeMode}
            data-react-theme-control
          />
        </UiField>
      </UiSurface>
      {contractMode ? (
        <>
          <div data-overlay-controlled>
            {controlledMounted ? (
              <UiPopover
                open={controlledOpen}
                disabled={controlledDisabled}
                trigger="Controlled popover"
                ariaLabel="Controlled details"
                data-overlay-controlled-popover
                onOpenChange={requestControlledOpen}
              >
                <p>Parent retains open state after a dismiss request.</p>
              </UiPopover>
            ) : null}
            <button type="button" data-overlay-unmount onClick={() => setControlledMounted(false)}>
              Unmount overlay
            </button>
            <button
              type="button"
              data-overlay-toggle-disabled
              onClick={() => setControlledDisabled((value) => !value)}
            >
              Toggle controlled disabled
            </button>
            <button
              type="button"
              data-overlay-toggle-menu-disabled
              onClick={() => setDropdownDisabled((value) => !value)}
            >
              Toggle menu disabled
            </button>
            <output data-overlay-dismiss-attempts>{dismissAttempts}</output>
          </div>
          <TextControlContractFixture />
          <form
            data-contract-form
            className="grid gap-3"
            onReset={(event) => {
              event.preventDefault();
              setFormNotifications(true);
              setFormChannel(2);
              setFormSync(true);
            }}
          >
            <UiCheckbox
              checked={formNotifications}
              onCheckedChange={setFormNotifications}
              name="notifications"
              value="yes"
              data-contract-checkbox
            >
              Notifications
            </UiCheckbox>
            <UiRadioGroup
              value={formChannel}
              onValueChange={setFormChannel}
              options={[
                { value: 1, label: 'First channel' },
                { value: 2, label: 'Second channel' },
                { value: 3, label: 'Unavailable channel', disabled: true },
              ]}
              name="channel"
              aria-label="Channel"
              data-contract-radio
            />
            <UiSwitch
              checked={formSync}
              onCheckedChange={setFormSync}
              name="sync"
              value="yes"
              data-contract-switch
            >
              Synchronization
            </UiSwitch>
            <UiCheckbox checked readOnly name="locked" value="yes" data-contract-readonly-checkbox>
              Locked notifications
            </UiCheckbox>
            <UiRadioGroup
              value={2}
              readOnly
              options={[
                { value: 1, label: 'First channel' },
                { value: 2, label: 'Second channel' },
              ]}
              name="locked-channel"
              aria-label="Locked channel"
              data-contract-readonly-radio
            />
            <UiSwitch checked readOnly name="locked-sync" value="yes" data-contract-readonly-switch>
              Locked synchronization
            </UiSwitch>
            <UiCheckbox
              checked
              disabled
              name="disabled"
              value="yes"
              data-contract-disabled-checkbox
            >
              Disabled notifications
            </UiCheckbox>
            <button type="reset" data-contract-reset>
              Reset controlled form
            </button>
            <output data-contract-form-state>
              {String(formNotifications)} / {formChannel} / {String(formSync)} /{' '}
              {typeof formChannel}
            </output>
          </form>
          <form data-contract-uncontrolled-form className="grid gap-3">
            <UiCheckbox defaultChecked name="notifications" value="yes">
              Uncontrolled notifications
            </UiCheckbox>
            <UiRadioGroup
              defaultValue={2}
              options={[
                { value: 1, label: 'Uncontrolled first' },
                { value: 2, label: 'Uncontrolled second' },
              ]}
              name="channel"
              aria-label="Uncontrolled channel"
            />
            <UiSwitch defaultChecked name="sync" value="yes">
              Uncontrolled synchronization
            </UiSwitch>
            <button type="reset">Reset native form</button>
          </form>
        </>
      ) : null}
      <ParityFixtures />
      {contractMode && (
        <div data-material-tier-fixtures className="flex flex-wrap gap-3">
          {(['glass-subtle', 'glass-elevated', 'glass-immersive'] as const).map((surface) => (
            <div key={surface} className="grid gap-2">
              <p className="text-caption text-muted">{surface}</p>
              <UiButton
                surface={surface}
                onClick={() => setCount((value) => value + 1)}
                data-tier-button={surface}
              >
                {surface}
              </UiButton>
              <UiAction
                surface={surface}
                href="#react-runtime-fixture"
                onClick={(event) => event.preventDefault()}
                data-tier-action={surface}
              >
                Action
              </UiAction>
              <UiCard surface={surface} data-tier-card={surface}>
                Card
              </UiCard>
            </div>
          ))}
          <UiAction
            disabled
            href="#react-runtime-fixture"
            data-disabled-action
            onClick={() => setCount((value) => value + 1)}
          >
            Disabled action
          </UiAction>
        </div>
      )}
      {contractMode && (
        <UiInput readOnly value="readonly@neoverse.dev" aria-label="Readonly material specimen" />
      )}
    </main>
  );
}

const root = document.getElementById('react-root');
if (root === null) {
  throw new Error('React fixture root is missing.');
}

createRoot(root).render(<ReactFixture />);
mountPlaygroundGlass();
