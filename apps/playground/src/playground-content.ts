export type Locale = 'en' | 'zh';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh';
}

export interface LocalizedText {
  readonly en: string;
  readonly zh: string;
}

export const localized = (en: string, zh: string): LocalizedText => ({ en, zh });

export function localize(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

export function formatLocalized(
  value: LocalizedText,
  locale: Locale,
  replacements: Record<string, string | number> = {},
): string {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    localize(value, locale),
  );
}

export const appCopy = {
  pageTitle: localized('Neoverse UI Design Lab', 'Neoverse UI 设计实验室'),
  framePageTitle: localized('{title} — {theme}', '{title} — {theme}'),
  brand: localized('Neoverse UI', 'Neoverse UI'),
  designLab: localized('Design Lab', '设计实验室'),
  sidebarDescription: localized(
    'A visual calibration surface for tokens, materials, motion, and core components.',
    '用于校准设计令牌、材质、动效与核心组件的视觉参考界面。',
  ),
  navigation: {
    label: localized('Design Lab navigation', '设计实验室导航'),
    modulesLabel: localized('Design Lab modules', '设计实验室模块'),
    open: localized('Open navigation', '打开导航'),
    close: localized('Close navigation', '关闭导航'),
    overview: localized('Overview', '总览'),
  },
  overview: {
    eyebrow: localized('Workspace overview', '工作区总览'),
    title: localized('Explore the system by discipline', '按设计领域探索系统'),
    description: localized(
      'Open one focused module at a time while keeping the complete Design Lab map within reach.',
      '一次专注查看一个模块，同时随时掌握设计实验室的完整结构。',
    ),
    moduleCount: localized('{count} modules', '{count} 个模块'),
    openGroup: localized('Open {group}', '打开{group}'),
  },
  module: {
    backToOverview: localized('Back to overview', '返回总览'),
    frameTitle: localized('{label} {theme} theme preview', '{label} {theme}主题预览'),
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

export const groupCopy = {
  foundations: {
    label: localized('Foundations', '基础'),
    description: localized(
      'Core tokens for color, type, rhythm, geometry, borders, and depth.',
      '覆盖色彩、字体、节奏、几何、边框与深度的核心设计令牌。',
    ),
  },
  surfaces: {
    label: localized('Surfaces', '表面材质'),
    description: localized(
      'Opaque and translucent materials that establish layer hierarchy.',
      '建立层级关系的不透明与半透明材质。',
    ),
  },
  motion: {
    label: localized('Motion', '动效'),
    description: localized(
      'Durations, easings, and transitions for responsive interface movement.',
      '用于构建响应式界面动效的时长、缓动与过渡。',
    ),
  },
  components: {
    label: localized('Components', '组件'),
    description: localized(
      'Core Vue components rendered across interactive and loading states.',
      '覆盖交互与加载状态的核心 Vue 组件。',
    ),
  },
} as const;

export const moduleCopy = {
  colors: {
    label: localized('Colors', '色彩'),
    description: localized(
      'Primitive color scales and semantic roles from @neoverse-ui/tokens.',
      '来自 @neoverse-ui/tokens 的基础色彩刻度与语义角色。',
    ),
    primitive: {
      label: localized('Primitive color scales', '基础色彩刻度'),
      description: localized(
        'Primitive palettes provide neutral, blue, cyan, mint, red, amber, green, and utility colors.',
        '基础色板提供 neutral、blue、cyan、mint、red、amber、green 与实用色。',
      ),
    },
    aliases: {
      label: localized('Semantic color roles', '语义色彩角色'),
      description: localized(
        'Semantic roles map surfaces, text, borders, accents, actions, statuses, focus, and overlay behavior to the primitive palette.',
        '语义角色将表面、文本、边框、强调色、操作、状态、焦点与遮罩映射到基础色板。',
      ),
    },
  },
  typography: {
    label: localized('Typography', '字体排印'),
    description: localized(
      'Typography roles preserve the token-defined size, weight, leading, and tracking.',
      '字体排印角色保留令牌定义的字号、字重、行高与字距。',
    ),
    sample: localized(
      'Neoverse UI keeps hierarchy legible across themes.',
      'Neoverse UI 在不同主题下始终保持清晰的层级关系。',
    ),
  },
  spacing: {
    label: localized('Spacing', '间距'),
    description: localized(
      'Base spacing tokens and layout aliases used by the workspace.',
      '工作区使用基础间距刻度与布局别名。',
    ),
    primitive: {
      label: localized('Base spacing scale', '基础间距刻度'),
      description: localized(
        'The four-pixel base scale runs from 0 through 32.',
        '基础间距刻度采用 4px 节奏，从 0 到 32。',
      ),
    },
    aliases: {
      label: localized('Layout aliases', '布局别名'),
      description: localized(
        'Layout aliases: px-gutter-inline=responsive, py-gutter-block=responsive, gap-grid=space-4.',
        '布局别名对应：px-gutter-inline=响应式、py-gutter-block=响应式、gap-grid=space-4。',
      ),
    },
  },
  radius: {
    label: localized('Radius', '圆角'),
    description: localized(
      'Base radius tokens and semantic role aliases.',
      '基础圆角刻度与语义角色别名。',
    ),
    primitive: {
      label: localized('Base radius scale', '基础圆角刻度'),
      description: localized(
        'The base scale defines none, xs, sm, md, lg, xl, and 2xl.',
        '基础刻度包含 none、xs、sm、md、lg、xl 与 2xl。',
      ),
    },
    aliases: {
      label: localized('Semantic aliases', '语义别名'),
      description: localized(
        'Semantic aliases include pill=9999px, control=md (12px), controlInner=control - 0.18rem (9.12px), card=lg (16px), and panel=xl (24px).',
        '语义别名包括 pill=9999px、control=md（12px）、controlInner=control - 0.18rem（9.12px）、card=lg（16px）与 panel=xl（24px）。',
      ),
    },
  },
  border: {
    label: localized('Border', '边框'),
    description: localized(
      'Token-backed border widths and styles. Width controls thickness; style controls the stroke pattern.',
      '由令牌驱动的边框宽度与样式。宽度控制粗细，样式控制描边模式。',
    ),
    width: {
      label: localized('Border width', '边框宽度'),
      description: localized(
        'Controls stroke thickness while the solid style and default semantic border color stay fixed.',
        '控制描边粗细，同时保持实线样式与默认语义边框色不变。',
      ),
    },
    style: {
      label: localized('Border style', '边框样式'),
      description: localized(
        'Controls the stroke pattern. This token set currently exposes solid only; the preview uses the strong width so the style remains visible.',
        '控制描边模式。当前令牌集仅提供实线；预览使用强调宽度以确保样式清晰可见。',
      ),
    },
  },
  shadow: {
    label: localized('Shadow', '阴影'),
    description: localized(
      'Primitive depth tokens and semantic aliases, previewed on theme surfaces.',
      '在主题表面上呈现基础深度令牌与语义别名。',
    ),
    primitive: {
      label: localized('Primitive shadows', '基础阴影'),
      description: localized(
        'Geometry tokens define the depth scale from none through inset.',
        '几何令牌定义从 none 到 inset 的深度刻度。',
      ),
    },
    aliases: {
      label: localized('Semantic aliases', '语义别名'),
      description: localized(
        'Role aliases reuse the scale: control=xs, raised=sm, card=md, overlay=lg, modal=xl.',
        '角色别名复用基础刻度：control=xs、raised=sm、card=md、overlay=lg、modal=xl。',
      ),
    },
  },
  surface: {
    label: localized('Surface', '表面'),
    description: localized(
      'Opaque surface roles remain the fallback foundation for every material.',
      '不透明表面角色是所有材质的基础回退层。',
    ),
  },
  glass: {
    label: localized('Glass', '玻璃材质'),
    description: localized(
      'Each sample uses one real UiGlassSurface material utility; nested Glass is intentionally absent.',
      '每个示例都使用真实的 UiGlassSurface 材质工具类；刻意不展示嵌套 Glass。',
    ),
    sampleDescription: localized(
      'Token-backed transparency, border, blur, saturation, and refraction.',
      '由设计令牌驱动的透明度、边框、模糊、饱和度与折射效果。',
    ),
  },
  motion: {
    label: localized('Motion', '动效'),
    description: localized(
      'Base motion values and semantic transition aliases, shown with their CSS variables.',
      '展示基础动效值与语义过渡别名，并列出对应 CSS 变量。',
    ),
    primitive: {
      label: localized('Base motion values', '基础动效值'),
      description: localized(
        'Base values define fast, standard, and expressive durations plus linear, standard, and emphasized easings.',
        '基础值定义 fast、standard、expressive 时长，以及 linear、standard、emphasized 缓动。',
      ),
    },
    aliases: {
      label: localized('Semantic transitions', '语义过渡'),
      description: localized(
        'Transition aliases reuse base values: micro=fast+standard, state=standard+standard, spatial=expressive+emphasized.',
        '过渡别名复用基础值：micro=fast+standard、state=standard+standard、spatial=expressive+emphasized。',
      ),
    },
    cssVariables: localized('{label} CSS variables', '{label} CSS 变量'),
  },
  button: {
    label: localized('Button', '按钮'),
    description: localized(
      'Real UiButton instances; hover and active are browser states, disabled and loading use component props.',
      '真实的 UiButton 实例；悬停与按下由浏览器状态呈现，禁用与加载由组件属性控制。',
    ),
    states: {
      default: {
        label: localized('Default', '默认'),
        hint: localized('Primary, secondary, and ghost variants.', '主、次与幽灵变体。'),
      },
      hover: {
        label: localized('Hover', '悬停'),
        hint: localized('Move the pointer over the control.', '将指针移到控件上。'),
      },
      active: {
        label: localized('Active', '按下'),
        hint: localized('Press and hold the control.', '按住控件。'),
      },
      focus: {
        label: localized('Focus', '焦点'),
        hint: localized('Tab to the control.', '使用 Tab 键将焦点移到控件。'),
      },
      disabled: { label: localized('Disabled', '禁用') },
      loading: {
        label: localized('Loading', '加载中'),
        hint: localized(
          'Loading preserves the label and leading slot geometry.',
          '加载状态会保留标签与前置插槽的几何尺寸。',
        ),
      },
    },
    controls: {
      default: localized('Default', '默认'),
      secondary: localized('Secondary', '次要'),
      ghost: localized('Ghost', '幽灵'),
      hover: localized('Hover me', '悬停查看'),
      active: localized('Press and hold', '按住不放'),
      focus: localized('Keyboard focus', '键盘焦点'),
      disabled: localized('Disabled', '禁用'),
      loading: localized('Saving', '保存中'),
    },
  },
  iconButton: {
    label: localized('IconButton', '图标按钮'),
    description: localized(
      'Real UiIconButton instances with required accessible labels and icon slots.',
      '真实的 UiIconButton 实例，包含必需的无障碍标签与图标插槽。',
    ),
    states: {
      default: { label: localized('Default', '默认') },
      hover: {
        label: localized('Hover', '悬停'),
        hint: localized('Move the pointer over the control.', '将指针移到控件上。'),
      },
      active: {
        label: localized('Active', '按下'),
        hint: localized('Press and hold the control.', '按住控件。'),
      },
      focus: {
        label: localized('Focus', '焦点'),
        hint: localized('Tab to the control.', '使用 Tab 键将焦点移到控件。'),
      },
      disabled: { label: localized('Disabled', '禁用') },
      loading: { label: localized('Loading', '加载中') },
    },
    controls: {
      addItem: localized('Add item', '添加项目'),
      confirm: localized('Confirm', '确认'),
      openDetails: localized('Open details', '打开详情'),
      hover: localized('Hover icon button', '悬停查看图标按钮'),
      active: localized('Press and hold', '按住不放'),
      focus: localized('Keyboard focus', '键盘焦点'),
      disabled: localized('Disabled', '禁用'),
      loading: localized('Loading', '加载中'),
    },
  },
  badge: {
    label: localized('Badge', '徽章'),
    description: localized(
      'Non-interactive status markers; variants consume surface and status semantic colors.',
      '非交互式状态标记；不同变体使用表面与状态语义色。',
    ),
    variants: localized('Variants', '变体'),
    sizes: localized('Sizes', '尺寸'),
    controls: {
      neutral: localized('Neutral', '中性'),
      info: localized('Info', '信息'),
      success: localized('Success', '成功'),
      warning: localized('Warning', '警告'),
      danger: localized('Danger', '危险'),
      small: localized('Small', '小'),
      medium: localized('Medium', '中'),
    },
  },
  card: {
    label: localized('Card', '卡片'),
    description: localized(
      'UiCard provides the fixed raised surface; content hierarchy remains consumer-owned.',
      'UiCard 提供固定的抬升表面；内容层级仍由使用方负责。',
    ),
    reference: localized('Reference card', '参考卡片'),
    ready: localized('Ready', '就绪'),
    body: localized(
      'Card owns depth and radius. The content and layout stay with the consumer.',
      '卡片负责深度与圆角；内容及布局由使用方决定。',
    ),
    continue: localized('Continue', '继续'),
    externalClass: localized('External class', '外部类名'),
    externalBody: localized(
      'This card demonstrates layout customization without redefining card tokens.',
      '此卡片展示如何定制布局，而无需重新定义卡片令牌。',
    ),
  },
  segmentedControl: {
    label: localized('SegmentedControl', '分段控件'),
    description: localized(
      'Real controlled value, disabled option, roving focus, keyboard navigation, and loading state.',
      '真实的受控值、禁用选项、焦点游移、键盘导航与加载状态。',
    ),
    aria: {
      view: localized('Design Lab view', '设计实验室视图'),
    },
    states: {
      default: localized('Default', '默认'),
      sizes: localized('Sizes', '尺寸'),
      disabled: localized('Disabled', '禁用'),
      loading: localized('Loading', '加载中'),
    },
    hints: {
      keyboard: localized(
        'Use ArrowLeft / ArrowRight, Home, and End.',
        '使用 ArrowLeft / ArrowRight、Home 与 End 键。',
      ),
      loading: localized(
        'Options remain visible while selection is blocked.',
        '选择被阻止时，选项仍保持可见。',
      ),
    },
    options: {
      overview: localized('Overview', '总览'),
      details: localized('Details', '详情'),
      activity: localized('Activity', '活动'),
    },
    controls: {
      small: localized('Small control', '小尺寸控件'),
      large: localized('Large control', '大尺寸控件'),
      disabled: localized('Disabled control', '禁用控件'),
      loading: localized('Loading control', '加载中控件'),
      selected: localized('Selected: {value}', '已选择：{value}'),
    },
  },
  skeleton: {
    label: localized('Skeleton', '骨架屏'),
    description: localized(
      'Neutral placeholder surfaces with shimmer, pulse, edge highlight, and reduced-motion support.',
      '中性占位表面提供 shimmer、pulse、边缘高光，并支持 reduced-motion。',
    ),
    controls: {
      text: localized('Text', '文本'),
      title: localized('Title', '标题'),
      rect: localized('Rect', '矩形'),
      avatar: localized('Avatar', '头像'),
      circle: localized('Circle', '圆形'),
      pulse: localized('Pulse', '脉冲'),
      static: localized('Static', '静态'),
    },
    body: localized(
      'Skeleton is aria-hidden by default; the loading relationship belongs to the surrounding content container.',
      'Skeleton 默认设置为 aria-hidden；加载关系应由外层内容容器负责。',
    ),
  },
} as const;

export const tokenCopy = {
  colorGroups: {
    surface: localized('Surface', '表面'),
    text: localized('Text', '文本'),
    border: localized('Border', '边框'),
    accent: localized('Accent', '强调色'),
    action: localized('Action', '操作'),
    status: localized('Status', '状态'),
    focusOverlay: localized('Focus / Overlay', '焦点 / 遮罩'),
  },
  colors: {
    canvas: localized('Canvas', '画布'),
    subtle: localized('Subtle', '弱化'),
    raised: localized('Raised', '抬升'),
    glass: localized('Glass', '玻璃'),
    overlay: localized('Overlay', '覆盖层'),
    primary: localized('Primary', '主要'),
    secondary: localized('Secondary', '次要'),
    muted: localized('Muted', '弱化'),
    disabled: localized('Disabled', '禁用'),
    inverse: localized('Inverse', '反色'),
    onAccent: localized('On accent', '强调色前景'),
    default: localized('Default', '默认'),
    strong: localized('Strong', '强'),
    interactive: localized('Interactive', '交互'),
    primaryForeground: localized('Primary foreground', '主色前景'),
    secondaryForeground: localized('Secondary foreground', '次要色前景'),
    tertiary: localized('Tertiary', '三级'),
    tertiaryForeground: localized('Tertiary foreground', '三级色前景'),
    soft: localized('Soft', '柔和'),
    primaryHover: localized('Primary hover', '主色悬停'),
    primaryActive: localized('Primary active', '主色按下'),
    secondaryHover: localized('Secondary hover', '次要色悬停'),
    secondaryActive: localized('Secondary active', '次要色按下'),
    disabledForeground: localized('Disabled foreground', '禁用色前景'),
    info: localized('Info', '信息'),
    infoForeground: localized('Info foreground', '信息色前景'),
    success: localized('Success', '成功'),
    successForeground: localized('Success foreground', '成功色前景'),
    warning: localized('Warning', '警告'),
    warningForeground: localized('Warning foreground', '警告色前景'),
    danger: localized('Danger', '危险'),
    dangerForeground: localized('Danger foreground', '危险色前景'),
    focusRing: localized('Focus ring', '焦点环'),
    scrim: localized('Scrim', '遮罩'),
  },
  typography: {
    display: localized('Display', '展示'),
    heading: localized('Heading', '标题'),
    subtitle: localized('Subtitle', '副标题'),
    body: localized('Body', '正文'),
    label: localized('Label', '标签'),
    caption: localized('Caption', '辅助说明'),
    code: localized('Code', '代码'),
  },
  spacing: {
    inlineGutter: localized('Inline gutter', '行内留白'),
    blockGutter: localized('Block gutter', '块级留白'),
    gridGap: localized('Grid gap', '网格间距'),
  },
  surface: {
    canvas: localized('Canvas', '画布'),
    subtle: localized('Subtle', '弱化'),
    raised: localized('Raised', '抬升'),
    overlay: localized('Overlay', '覆盖层'),
  },
  glassVariants: {
    subtle: localized('Subtle', '弱化'),
    elevated: localized('Elevated', '抬升'),
    immersive: localized('Immersive', '沉浸'),
  },
  motion: {
    durations: localized('Durations', '时长'),
    easings: localized('Easings', '缓动'),
    micro: localized('Micro', '微动效'),
    state: localized('State', '状态'),
    spatial: localized('Spatial', '空间'),
  },
} as const;
