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
      'The copy crossfades in place. The preview and its selected control size stay active.',
      '新旧文案在原位淡入淡出，保留当前示例和已选控件尺寸。',
    ),
    action: localized('Switch to Chinese', '切换到英文'),
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
