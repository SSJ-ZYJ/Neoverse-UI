import type { TerminalPromptSegment, TerminalSegmentIcon } from '@neoverse-ui/react';
import { appCopy, type Locale, localize } from '../../content/playground-content';
import { languageSegments, themeGlyphPaths } from '../../runtime/preference-segments';
import { themeModes } from '../../runtime/theme-runtime';

export type TerminalHistoryLine = { text: string; segments?: readonly TerminalPromptSegment[] };

export function getFixtureCopy(locale: Locale) {
  return locale === 'zh'
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
        contextMenu: '在此处右键打开上下文菜单',
        contextMenuCopy: '复制',
        contextMenuArchive: '归档',
        contextMenuRemove: '移除',
        contextMenuEdit: '编辑',
        contextMenuDetails: '显示详情',
        contextMenuTheme: '主题',
        contextMenuLanguage: '语言',
        contextMenuKeyboard: '以键盘焦点打开',
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
        contextMenu: 'Right-click here for a context menu',
        contextMenuCopy: 'Copy',
        contextMenuArchive: 'Archive',
        contextMenuRemove: 'Remove',
        contextMenuEdit: 'Edit',
        contextMenuDetails: 'Show details',
        contextMenuTheme: 'Theme',
        contextMenuLanguage: 'Language',
        contextMenuKeyboard: 'Open with keyboard focus',
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
}

export type FixtureCopy = ReturnType<typeof getFixtureCopy>;

export const createThemeOptions = (locale: Locale) =>
  themeModes.map((mode) => ({
    value: mode,
    label: localize(appCopy.theme.options[mode], locale),
    path: themeGlyphPaths[mode],
  }));

export const createRuntimeOptions = (copy: FixtureCopy) =>
  [
    { value: 'native', label: copy.native },
    { value: 'remote', label: copy.remote },
  ] as const;

export const createChannelOptions = (copy: FixtureCopy) =>
  [
    { value: 'stable', label: copy.stable },
    { value: 'preview', label: copy.preview },
  ] as const;

export const terminalSegmentsFor = (
  icon: TerminalSegmentIcon,
): readonly TerminalPromptSegment[] => [
  { id: 'host', label: 'neoverse', tone: 'host', icon, iconOnly: true },
  { id: 'path', label: '~/playground', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch', icon: 'branch' },
];

export const pickNext = <T>(list: readonly T[], item: T): T =>
  list[(list.indexOf(item) + 1) % list.length] ?? item;

export const fixtureLanguageSegments = languageSegments;
