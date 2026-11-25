import { localized } from '../playground-content';

export const motionPlaygroundCopy = {
  label: localized('Transitions', '切换动效'),
  description: localized(
    'Try the same theme, language, and control size transitions used throughout the Design Lab.',
    '体验设计实验室实际使用的主题、语言与控件尺寸动效。',
  ),
  theme: {
    label: localized('Soft theme reveal', '柔边主题扩散'),
    description: localized(
      'The new palette expands from the button with a soft edge. Compare it with the original crossfade.',
      '新配色从按钮中心沿柔和的圆形边缘扩散。可与原有的淡入淡出对比。',
    ),
    reveal: localized('Reveal theme', '扩散切换主题'),
    fade: localized('Crossfade theme', '淡化切换主题'),
  },
  locale: {
    label: localized('Language crossfade', '语言淡入淡出'),
    description: localized(
      'The copy crossfades in place while the brand, navigation, and preference boxes reconcile their widths on the spatial role. The preview and its selected control size stay active.',
      '新旧文案在原位淡入淡出，标识、导航与偏好盒子按 spatial 角色同步伸缩。保留当前示例和已选控件尺寸。',
    ),
    action: localized('Switch to Chinese', '切换到英文'),
    brand: localized('Neoverse UI', 'Neoverse UI'),
    brandSubtitle: localized('Design Lab · Layout primitives', '设计实验室 · 布局原语'),
    navOverview: localized('Overview', '总览'),
    navMotion: localized('Motion', '动效'),
    navComponents: localized('Components', '组件'),
    preferenceLabel: localized('Preferences', '偏好'),
    preferenceValue: localized('System theme', '跟随系统'),
    hint: localized(
      'Only the box widths move: the selected background keeps its own slide, and a rapid second switch continues from the visible edge instead of snapping back to an endpoint.',
      '只有盒子宽度在变化：选中背景保留自身滑动，快速再次切换会从可见边沿接续，而不是弹回端点。',
    ),
  },
  size: {
    label: localized('Control size motion', '控件尺寸动效'),
    description: localized(
      'Choose a size to see a text button and an icon button resize in the same layout.',
      '选择尺寸，观察文字按钮和图标按钮在同一布局中伸缩。',
    ),
    sample: localized('Preview action', '示例操作'),
    icon: localized('Preview icon', '示例图标'),
  },
} as const;
