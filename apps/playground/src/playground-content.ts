import { compositionModuleCopy } from './content/composition-scenes-copy';
import { controlsModuleCopy } from './content/controls-copy';
import { foundationsModuleCopy } from './content/foundations-copy';
import { localized } from './content/locale';
import { tokenCopy, workspaceModuleCopy } from './content/workspace-copy';

export {
  catalogueSecondary,
  formatLocalized,
  isLocale,
  type Locale,
  type LocalizedText,
  localize,
  localized,
  localizedTerm,
} from './content/locale';

export const appCopy = {
  pageTitle: localized('Neoverse UI Design Lab', 'Neoverse UI 设计实验室'),
  framePageTitle: localized('{title} — {theme}', '{title} — {theme}'),
  brand: localized('Neoverse UI', 'Neoverse UI'),
  designLab: localized('Design Lab', '设计实验室'),
  navigation: {
    label: localized('Explorer', '资源浏览'),
    modulesLabel: localized('Design Lab modules', '设计实验室模块'),
    open: localized('Open Explorer', '打开资源浏览'),
    close: localized('Close Explorer', '关闭资源浏览'),
    overview: localized('Overview', '总览'),
  },
  inspector: {
    label: localized('Inspector', '检查器'),
    open: localized('Open Inspector', '打开检查器'),
    close: localized('Close Inspector', '关闭检查器'),
  },
  overview: {
    eyebrow: localized('Workspace overview', '工作区总览'),
    title: localized('Design. Preview. Refine.', '设计、预览、校准。'),
    description: localized(
      'Explore tokens, components, and patterns in one interactive workspace.',
      '在同一个工作区中探索设计变量、组件与组合场景。',
    ),
  },
  module: {
    themeNames: {
      light: localized('Light', '浅色'),
      dark: localized('Dark', '深色'),
    },
  },
  theme: {
    label: localized('Playground theme', '实验室主题'),
    options: {
      system: localized('System', '跟随系统'),
      light: localized('Light', '浅色'),
      dark: localized('Dark', '深色'),
    },
  },
  language: {
    label: localized('Language', '语言'),
    options: {
      en: localized('EN', '英文'),
      zh: localized('中文', '中文'),
    },
  },
  stageBackground: {
    label: localized('Stage background', '舞台背景'),
    options: {
      canvas: localized('Solid', '纯色'),
      tint: localized('Tint', '淡色'),
      gradient: localized('Gradient', '渐变'),
      optical: localized('Optical', '光学'),
    },
  },
  frame: {
    invalidTheme: localized(
      'Frame theme must be "light" or "dark".',
      'Frame 主题必须是“light”或“dark”。',
    ),
  },
  server: {
    assetsLabel: localized('Design Lab assets', '设计实验室资源'),
    assetsUnavailable: localized('{asset} has not been built yet.', '{asset} 尚未构建。'),
    notFound: localized('Not found', '未找到。'),
  },
} as const;

export const moduleCopy = {
  ...foundationsModuleCopy,
  ...controlsModuleCopy,
  ...workspaceModuleCopy,
  composition: compositionModuleCopy,
} as const;

export { tokenCopy };
