import { localized } from './locale';

export const controlsModuleCopy = {
  controls: {
    label: localized('Core Controls', '核心控件'),
    description: localized(
      'Interactive controls share one calibration module so the Design Lab stays focused instead of fragmenting every primitive into its own category.',
      '交互控件集中在一个校准模块中，避免设计实验室将每个基础组件拆成独立分类。',
    ),
  },
  overlays: {
    label: localized('Overlays & Menus', '弹层与菜单'),
    description: localized(
      'Popover, dropdown, and cursor menus share one top-layer runtime, one dismiss and focus contract, and one Aurora Glass surface.',
      '弹层、下拉菜单与右键菜单共用同一套顶层定位、关闭与焦点契约，以及同一种极光玻璃表面。',
    ),
  },
  statusFeedback: {
    label: localized('Status & Feedback', '状态与反馈'),
    description: localized(
      'Badges, status indicators, and loading skeletons share one module for non-primary interaction feedback.',
      '徽章、状态指示器与加载骨架集中展示，用于校准非主要交互反馈。',
    ),
  },
  dataDisplay: {
    label: localized('Data & Disclosure', '数据与渐进披露'),
    description: localized(
      'Tables and disclosures share native semantics, inset material hierarchy, and local overflow without relying on prose-only styling.',
      '表格与折叠披露共享原生语义、内嵌材质层级和局部溢出处理，不再依赖仅限正文的样式。',
    ),
  },
  button: {
    label: localized('Button', '按钮'),
    description: localized(
      'Real UiButton instances; hover and active are browser states, disabled and loading use component props.',
      '真实的 UiButton 实例；悬停与按下由浏览器状态呈现，禁用与加载由组件属性控制。',
    ),
    states: {
      circular: {
        label: localized('Circular buttons', '圆形按钮'),
        hint: localized(
          'The same circular icon button used in Surfaces & Aurora Glass, in sm, md, and lg sizes.',
          '复用“表面与极光玻璃”中的圆形图标按钮，展示 sm、md、lg 三档尺寸。',
        ),
      },
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
      stretch: {
        label: localized('Stretch', '撑满'),
        hint: localized(
          'Fill a fixed-height flex row instead of using a fixed control height.',
          '填满固定高度的弹性行，而不使用固定控件高度。',
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
      stretchPrimary: localized('Stretch', '撑满'),
      stretchSecondary: localized('Ghost stretch', '幽灵撑满'),
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
      'Non-interactive status markers with shared background blur and semantic status tints.',
      '非交互式状态标记；共用背景模糊与语义状态色。',
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
      large: localized('Large', '大'),
    },
  },
  card: {
    label: localized('Card', '卡片'),
    description: localized(
      'UiCard owns standard card geometry and uses shared Aurora Glass · Standard (glass-elevated) by default; transparent cards require an explicit surface="none" opt-out.',
      'UiCard 负责标准卡片几何，并默认复用共享的极光玻璃 · 标准（glass-elevated）；透明卡片必须显式设置 surface="none" 才会启用。',
    ),
    surfaceLabel: localized('Surface presets', '表面预设'),
    surfaceDescription: localized(
      'Compare the same card with different surface presets. Its content and layout stay the same.',
      '比较同一张卡片的不同表面预设，内容和布局保持不变。',
    ),
    defaultExample: {
      label: localized('Default card', '默认卡片'),
      description: localized(
        'Omit the surface prop to use the component default.',
        '省略 surface 属性，使用组件默认材质。',
      ),
    },
    reference: localized('Reference card', '参考卡片'),
    ready: localized('Ready', '就绪'),
    body: localized(
      'The research summary is ready to share with your team.',
      '研究摘要已就绪，可以分享给团队。',
    ),
    continue: localized('Continue', '继续'),
    elevatedExample: {
      label: localized('Elevated card', '抬升卡片'),
      description: localized(
        'Choose surface="elevated" for an opaque card.',
        '使用 surface="elevated" 获得不透明卡片。',
      ),
    },
    transparentExample: {
      label: localized('Transparent card', '透明卡片'),
      description: localized(
        'Choose surface="none" to let the parent surface supply the material.',
        '使用 surface="none" 后，卡片的材质由父级表面提供。',
      ),
    },
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
      aria: localized('Accessible names', '无障碍名称'),
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
      sectionA: localized('A', 'A'),
      sectionB: localized('B', 'B'),
      sectionC: localized('C', 'C'),
    },
    controls: {
      small: localized('Small control', '小尺寸控件'),
      disabled: localized('Disabled control', '禁用控件'),
      loading: localized('Loading control', '加载中控件'),
      selected: localized('Selected: {value}', '已选择：{value}'),
      sectionA: localized('Section A', '区域 A'),
      sectionB: localized('Section B', '区域 B'),
      sectionC: localized('Section C', '区域 C'),
    },
  },
  forms: {
    label: localized('Form Controls', '表单控件'),
    description: localized(
      'Native text, multiline, and selection controls share one inset surface, focus contract, and disabled treatment.',
      '原生文本、多行文本与选择控件共享同一套内嵌表面、焦点契约与禁用状态。',
    ),
  },
  density: {
    label: localized('Control Density', '控件密度'),
    description: localized(
      'The same compact controls gain a transparent hit area for coarse pointers without changing their painted geometry.',
      '同一组紧凑控件在粗指针下增加透明命中区域，同时保持视觉几何不变。',
    ),
    profiles: {
      desktop: {
        label: localized('Desktop / fine pointer', '桌面 / 精细指针'),
        hint: localized(
          'Compact visual size with keyboard and focus-visible support.',
          '保持紧凑视觉尺寸，同时支持键盘与 focus-visible。',
        ),
      },
      touch: {
        label: localized('Touch / coarse pointer', '触控 / 粗指针'),
        hint: localized(
          'The hit area expands invisibly; the painted control stays the same size.',
          '命中区域透明扩展，控件的视觉尺寸保持不变。',
        ),
      },
    },
    controls: {
      button: localized('Action', '操作'),
      iconButton: localized('Add', '添加'),
      segment: localized('View', '视图'),
      overview: localized('Overview', '总览'),
      details: localized('Details', '详情'),
      activity: localized('Activity', '活动'),
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
