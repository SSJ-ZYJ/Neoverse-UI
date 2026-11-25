import { glassMaterial } from '@neoverse-ui/tokens';
import { localized, localizedTerm } from './locale';

export const workspaceModuleCopy = {
  scrollbar: {
    label: localized('Scrollbar', '滚动条'),
    description: localized(
      'A quiet Aurora Glass rail keeps scrolling visible without bringing back the browser chrome.',
      '克制的极光玻璃轨道让滚动状态保持可见，同时不带回浏览器默认的厚重控件。',
    ),
    preview: {
      label: localized('Immersive scrollbar', '沉浸式滚动条'),
      description: localized(
        'One neutral ink replaces the former gradient rail: the grip brightens and widens on hover, and accent only enters it while dragging.',
        '单一中性墨色取代此前的渐变轨道：悬停时滑块提亮并加宽，仅在拖拽时渗入强调色。',
      ),
      viewportLabel: localized('Scrollable viewport', '可滚动视口'),
      viewportHint: localized(
        'Hover the thumb to compare its lift and width with the overlay above.',
        '将指针移到滑块上，对照上方浮层的提亮与加宽效果。',
      ),
    },
    tokens: {
      label: localized('Semantic hooks', '语义 hooks'),
      description: localized(
        'The utility consumes a theme-aware token family so the treatment follows light and dark surfaces.',
        '该工具类使用主题感知的 token 家族，使样式跟随浅色与深色表面。',
      ),
      size: localized('Thickness', '厚度'),
      thumbWidth: localized('Resting width', '静止宽度'),
      thumbWidthHover: localized('Hover width', '悬停宽度'),
      track: localized('Track', '轨道'),
      thumb: localized('Resting thumb', '静止滑块'),
      hover: localized('Hover thumb', '悬停滑块'),
      active: localized('Active thumb', '按下滑块'),
      edge: localized('Edge highlight', '边缘高光'),
    },
  },
  action: {
    label: localized('Action', '操作链接'),
    description: localized(
      'Semantic destination controls keep link behavior, Aurora Glass treatment, and comfortable action geometry together.',
      '语义目标控件将链接行为、极光玻璃与舒适的操作尺寸统一在一起。',
    ),
    states: {
      default: {
        label: localized('Variants', '变体'),
        hint: localized(
          'Real links with leading and trailing icon slots.',
          '带有前置与后置图标插槽的真实链接。',
        ),
      },
      sizes: {
        label: localized('Sizes', '尺寸'),
        hint: localized(
          'Destination controls stay taller than compact command buttons.',
          '目标控件比紧凑的命令按钮保留更舒适的高度。',
        ),
      },
      hover: {
        label: localized('Hover', '悬停'),
        hint: localized('Move the pointer over the action.', '将指针移到操作链接上。'),
      },
      active: {
        label: localized('Active', '按下'),
        hint: localized('Press and hold the action.', '按住操作链接。'),
      },
      focus: {
        label: localized('Focus', '焦点'),
        hint: localized('Tab to the action.', '使用 Tab 键将焦点移到操作链接。'),
      },
      disabled: { label: localized('Disabled', '禁用') },
    },
    controls: {
      primary: localized('Visit website', '访问网站'),
      secondary: localized('Read the journal', '阅读日志'),
      ghost: localized('Open profile', '打开资料'),
      small: localized('Small', '小'),
      medium: localized('Medium', '中'),
      large: localized('Large', '大'),
      hover: localized('Hover me', '悬停查看'),
      active: localized('Press and hold', '按住不放'),
      focus: localized('Keyboard focus', '键盘焦点'),
      disabled: localized('Unavailable link', '不可用链接'),
    },
  },
  navigationItem: {
    label: localized('NavigationItem', '导航项'),
    description: localized(
      'Destination semantics, active-page state, icon-label rhythm, and compact accessibility in one item.',
      '在单个导航项中统一目标语义、当前页状态、图标标签节奏与紧凑模式无障碍。',
    ),
    states: {
      default: {
        label: localized('Default and active', '默认与当前项'),
        hint: localized(
          'The active item exposes aria-current and a stable selection indicator.',
          '当前项通过 aria-current 和稳定的选中指示器表达状态。',
        ),
      },
      compact: {
        label: localized('Compact', '紧凑'),
        hint: localized(
          'Labels remain available to assistive technology when visually hidden.',
          '标签在视觉隐藏时仍对辅助技术可用。',
        ),
      },
      hover: {
        label: localized('Hover', '悬停'),
        hint: localized('Move the pointer over the destination.', '将指针移到导航目标上。'),
      },
      focus: {
        label: localized('Focus', '焦点'),
        hint: localized('Tab to the destination.', '使用 Tab 键将焦点移到导航目标。'),
      },
      disabled: { label: localized('Disabled', '禁用') },
    },
    controls: {
      home: localized('Home', '主页'),
      projects: localized('Projects', '项目'),
      focus: localized('Focus', '专注'),
      activity: localized('Pulse', '动态'),
      hover: localized('Hover destination', '悬停目标'),
      keyboardFocus: localized('Keyboard focus', '键盘焦点'),
      disabled: localized('Archive', '归档'),
    },
  },
  statusIndicator: {
    label: localized('StatusIndicator', '状态指示器'),
    description: localized(
      'A compact semantic status dot with caller-owned announcement behavior and reduced-motion pulse.',
      '紧凑的语义状态点，播报行为由调用方负责，并提供减弱动效的脉冲回退。',
    ),
    states: {
      statuses: {
        label: localized('Semantic statuses', '语义状态'),
        hint: localized(
          'Status colors come from shared semantic roles.',
          '状态颜色来自共享语义角色。',
        ),
      },
      live: {
        label: localized('Live status', '实时状态'),
        hint: localized(
          'Pulse adds a quiet signal; the caller chooses role=status when updates are live.',
          '脉冲提供克制提示；实时更新时由调用方选择 role=status。',
        ),
      },
      sizes: { label: localized('Sizes', '尺寸') },
    },
    controls: {
      neutral: localized('Idle', '空闲'),
      info: localized('Syncing', '同步中'),
      success: localized('Online', '在线'),
      warning: localized('Degraded', '性能下降'),
      danger: localized('Offline', '离线'),
      available: localized('Available for collaboration', '可参与协作'),
      small: localized('Small status', '小状态'),
      medium: localized('Medium status', '中状态'),
    },
  },
  controlSurface: {
    label: localized('ControlSurface', '控件表面'),
    description: localized(
      'A single Aurora Glass chrome boundary groups related controls and owns optional trailing separation.',
      '单一极光玻璃边界用于分组相关控件，并负责可选尾部区域的分隔关系。',
    ),
    states: {
      toolbar: {
        label: localized('Toolbar', '工具栏'),
        hint: localized(
          'Interactive semantics stay on the controls; the surface owns grouping geometry.',
          '交互语义保留在控件上；表面只负责分组几何。',
        ),
      },
      variants: {
        label: localized('Material variants', '材质变体'),
        hint: localized(
          'Choose one material at the composition boundary.',
          '在组合边界选择一种材质。',
        ),
      },
      trailing: {
        label: localized('Trailing group', '尾部分组'),
        hint: localized(
          'The surface inserts the separator only when trailing content exists.',
          '仅在存在尾部内容时由表面插入分隔线。',
        ),
      },
    },
    controls: {
      toolbar: localized('Workspace tools', '工作区工具'),
      add: localized('Add item', '添加项目'),
      confirm: localized('Confirm changes', '确认更改'),
      publish: localized('Publish', '发布'),
      view: localized('View controls', '视图控件'),
      canvas: localized('Canvas', '画布'),
    },
  },
  dock: {
    label: localized('Dock', '导航栏'),
    description: localized(
      'A reusable floating navigation shell built from ControlSurface, NavigationItem, and optional trailing controls.',
      '由 ControlSurface、NavigationItem 与可选尾部控件组成的可复用悬浮导航外壳。',
    ),
    states: {
      standard: {
        label: localized('Standard', '标准'),
        hint: localized(
          'Uses the consumer’s md scale with shared shell, label, icon, and trailing-control sizing. The default lg scale remains available for larger navigation.',
          '使用消费项目的 md 档，外壳、文字、图标和尾部控件统一缩放；需要更大导航时可使用默认的 lg 档。',
        ),
      },
      compact: {
        label: localized('Compact', '紧凑'),
        hint: localized(
          'Compact mode keeps the same component contract while allowing icon-only navigation and tighter trailing controls.',
          '紧凑模式保持同一组件契约，同时允许纯图标导航与更紧凑的尾部控件。',
        ),
      },
    },
    ariaLabel: localized('Dock navigation', 'Dock 导航'),
    languageLabel: localized('Language', '语言'),
    items: {
      home: localized('Home', '主页'),
      projects: localized('Projects', '项目'),
      focus: localized('Focus', '专注'),
      activity: localized('Activity', '动态'),
    },
  },
  giscus: {
    label: localized('Giscus theme', 'Giscus 主题'),
    description: localized(
      'The published iframe theme for the Giscus comment widget, previewed with the CSS the widget actually loads.',
      '用于 Giscus 评论组件的已发布 iframe 主题，使用组件实际加载的 CSS 预览。',
    ),
  },
  consumerParity: {
    label: localized('Contract Lab', '契约实验室'),
    description: localized(
      'Audits component coverage and framework/runtime contracts, then validates them against controlled Neoverse product patterns.',
      '审计组件覆盖、框架与 Runtime 契约，并使用可控 Neoverse 产品模式进行实际校验。',
    ),
    hero: {
      label: localized('Hero Actions', 'Hero 操作区'),
      description: localized(
        'Six destination links preserve the approved icon-label rhythm and comfortable action height.',
        '六个目标链接保留已确认的图标标签节奏与舒适操作高度。',
      ),
      status: localized('Available for new collaborations', '可参与新的协作'),
      title: localized(
        'Building calm systems for ambitious interfaces.',
        '为有野心的界面构建平静的系统。',
      ),
      summary: localized(
        'Design systems, developer tooling, and thoughtful digital spaces.',
        '设计系统、开发者工具与经过深思熟虑的数字空间。',
      ),
    },
    navigation: {
      label: localized('Floating Navigation', '悬浮导航'),
      description: localized(
        'Four semantic navigation items share one control surface with an English / 中文 switch.',
        '四个语义导航项与 English / 中文 切换器共享一个控件表面。',
      ),
      ariaLabel: localized('Primary navigation', '主导航'),
      languageLabel: localized('Language', '语言'),
      items: {
        home: localized('Home', '主页'),
        projects: localized('Projects', '项目'),
        focus: localized('Focus', '专注'),
        pulse: localized('Pulse', '动态'),
      },
    },
  },
} as const;

export const tokenCopy = {
  colorGroups: {
    surface: localizedTerm('Surface', '表面'),
    text: localizedTerm('Text', '文字'),
    border: localizedTerm('Border', '边框'),
    accent: localizedTerm('Accent', '强调色'),
    action: localizedTerm('Action', '操作'),
    status: localizedTerm('Status', '状态'),
    focusOverlay: localizedTerm('Focus / Overlay', '焦点与浮层'),
  },
  colors: {
    canvas: localizedTerm('Canvas', '画布'),
    subtle: localizedTerm('Subtle', '低强调'),
    raised: localizedTerm('Raised', '抬升'),
    glass: localizedTerm(glassMaterial.name.en, glassMaterial.name.zh),
    overlay: localizedTerm('Overlay', '浮层'),
    primary: localizedTerm('Primary', '主要'),
    secondary: localizedTerm('Secondary', '次要'),
    muted: localizedTerm('Muted', '弱化'),
    disabled: localizedTerm('Disabled', '禁用'),
    inverse: localizedTerm('Inverse', '反色'),
    onAccent: localizedTerm('On accent', '强调色上的文字'),
    default: localizedTerm('Default', '默认'),
    strong: localizedTerm('Strong', '加深'),
    interactive: localizedTerm('Interactive', '交互'),
    primaryForeground: localizedTerm('Primary foreground', '主色前景'),
    secondaryForeground: localizedTerm('Secondary foreground', '次色前景'),
    tertiary: localizedTerm('Tertiary', '第三强调色'),
    tertiaryForeground: localizedTerm('Tertiary foreground', '第三强调色前景'),
    soft: localizedTerm('Soft', '柔和'),
    primaryHover: localizedTerm('Primary hover', '主操作悬停'),
    primaryActive: localizedTerm('Primary active', '主操作按下'),
    secondaryHover: localizedTerm('Secondary hover', '次操作悬停'),
    secondaryActive: localizedTerm('Secondary active', '次操作按下'),
    disabledForeground: localizedTerm('Disabled foreground', '禁用前景'),
    info: localizedTerm('Info', '信息'),
    infoForeground: localizedTerm('Info foreground', '信息前景'),
    success: localizedTerm('Success', '成功'),
    successForeground: localizedTerm('Success foreground', '成功前景'),
    warning: localizedTerm('Warning', '警告'),
    warningForeground: localizedTerm('Warning foreground', '警告前景'),
    danger: localizedTerm('Danger', '危险'),
    dangerForeground: localizedTerm('Danger foreground', '危险前景'),
    focusRing: localizedTerm('Focus ring', '焦点环'),
    scrim: localizedTerm('Scrim', '遮罩'),
  },
  typography: {
    caption: localizedTerm('Caption', '辅助说明'),
    code: localizedTerm('Code', '代码'),
  },
  spacing: {
    inlineGutter: localizedTerm('Inline gutter', '横向内边距'),
    blockGutter: localizedTerm('Block gutter', '纵向内边距'),
    gridGap: localizedTerm('Grid gap', '网格间隔'),
  },
  surface: {
    canvas: localized('Canvas', '画布'),
    subtle: localized('Subtle', '弱化'),
    raised: localized('Raised', '抬升'),
    overlay: localized('Overlay', '覆盖层'),
  },
  glassVariants: {
    subtle: localized(
      `${glassMaterial.name.en} · ${glassMaterial.tiers.subtle.en}`,
      `${glassMaterial.name.zh} · ${glassMaterial.tiers.subtle.zh}`,
    ),
    elevated: localized(
      `${glassMaterial.name.en} · ${glassMaterial.tiers.elevated.en}`,
      `${glassMaterial.name.zh} · ${glassMaterial.tiers.elevated.zh}`,
    ),
    immersive: localized(
      `${glassMaterial.name.en} · ${glassMaterial.tiers.immersive.en}`,
      `${glassMaterial.name.zh} · ${glassMaterial.tiers.immersive.zh}`,
    ),
  },
  motion: {
    durations: localized('Durations', '时长'),
    easings: localized('Easings', '缓动'),
    distances: localized('Distances', '行程'),
  },
} as const;
