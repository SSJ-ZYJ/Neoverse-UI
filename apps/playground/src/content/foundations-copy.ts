import { glassMaterial } from '@neoverse-ui/tokens';
import { localized } from './locale';

export const foundationsModuleCopy = {
  layoutShape: {
    label: localized('Layout & Shape', '布局与几何'),
    description: localized(
      'Spacing, radius, and border tokens are calibrated together because they jointly define component geometry.',
      '对照间距、圆角与边框如何影响布局和组件轮廓。',
    ),
  },
  materials: {
    label: localized(`Surfaces & ${glassMaterial.name.en}`, `表面与${glassMaterial.name.zh}`),
    description: localized(
      'Opaque surfaces and Aurora Glass are compared in one place to make layer hierarchy easier to judge.',
      '将不透明表面与极光玻璃集中展示，便于直接比较不同层级关系。',
    ),
  },
  colors: {
    label: localized('Colors', '色彩'),
    description: localized(
      'Primitive color scales and semantic roles from @neoverse-ui/tokens.',
      '对照 @neoverse-ui/tokens 的基础色板与语义色彩角色。',
    ),
    primitive: {
      label: localized('Primitive palettes', '基础色板'),
      description: localized(
        'Compare shades from light to dark. Each family shows the CSS variable pattern once.',
        '按色系从浅到深对照色阶。每组只标一次 CSS 变量格式。',
      ),
    },
    aliases: {
      label: localized('Semantic color roles', '语义色彩角色'),
      description: localized(
        'Look up each role by purpose, with its current theme color, CSS variable, and Tailwind utility.',
        '按用途查看语义色在当前主题下的颜色、CSS 变量和 Tailwind 工具类。',
      ),
    },
  },
  typography: {
    label: localized('Typography', '排版'),
    description: localized(
      'Compare typography roles by font size, weight, line height, and letter spacing.',
      '对照各排版角色的字号、字重、行高和字距。',
    ),
    scale: {
      label: localized('Type scale', '排版层级'),
      description: localized(
        'Compare Display, Title, Body, Label, Caption, and Code on the same line of text.',
        '用同一句文字对照 Display、Title、Body、Label、Caption 和 Code 的排版效果。',
      ),
    },
    sample: localized(
      'Neoverse UI keeps hierarchy legible across themes.',
      'Neoverse UI 在不同主题下始终保持清晰的层级关系。',
    ),
    headings: {
      label: localized('Markdown headings', 'Markdown 标题'),
      description: localized(
        'Prose headings render at six distinct sizes owned by the prose roles, so a page heading never inherits an interface title size.',
        '正文标题按六个层级区分字号，全部由正文角色控制，页面标题不会继承界面标题的字号。',
      ),
      sample: localized('Heading level sample', '标题层级示例'),
    },
    inlineSyntax: {
      label: localized('Markdown inline syntax', 'Markdown 行内语法'),
      description: localized(
        'Bold, italic, bold italic, inline code, strikethrough and links render from the same prose layer without overriding each other.',
        '加粗、倾斜、加粗倾斜、行内代码、删除线与链接共用同一层正文样式，互不覆盖。',
      ),
      sample: localized('Inline sample', '行内示例'),
      code: localized('inline-code', '行内代码'),
      link: localized('Inline link', '行内链接'),
    },
  },
  spacing: {
    label: localized('Spacing', '间距'),
    description: localized(
      'See where padding and gaps apply in a layout, then compare actual spacing lengths.',
      '先看内边距和元素间隔加在哪里，再对照各级间距的实际长度。',
    ),
    primitive: {
      label: localized('Base spacing scale', '基础间距刻度'),
      description: localized(
        'The rulers share one start. The --neoverse-space-* values advance by 0.25rem (4px at a 16px root).',
        '标尺从同一条线起算。--neoverse-space-* 每级增加 0.25rem，根字号为 16px 时相差 4px。',
      ),
    },
    aliases: {
      label: localized('Spacing in layouts', '布局中的间距'),
      description: localized(
        'Gutters leave space inside the container and respond to the viewport. Grid gap separates items.',
        '内边距留在容器边界与内容之间，随视口变化；网格间隔留在相邻元素之间。',
      ),
    },
    roles: {
      label: localized('Page layout roles', '页面布局角色'),
      description: localized(
        'Semantic page, content, reading, sidebar, and header roles sit above the primitive container and spacing scales.',
        '页面、内容、阅读区、侧栏与顶栏等语义角色建立在基础容器与间距刻度之上。',
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
    label: localized('Elevation', '层级阴影'),
    description: localized(
      'Shadow tokens are calibrated as elevation roles rather than isolated decoration.',
      '将阴影令牌作为层级关系进行校准，而不是作为孤立的装饰效果。',
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
    label: localized('Surface presets', '表面预设'),
    description: localized(
      'Opaque roles and Aurora Glass tiers share one preset grid, each labelled with its semantic preset and implementation class. The controls below reveal how the same glass samples a backdrop.',
      '不透明角色与极光玻璃档位共用同一预设网格，并标注各自的语义预设与实现类名。下方控件展示同一种玻璃如何采样背景。',
    ),
  },
  glass: {
    label: glassMaterial.name,
  },
  motion: {
    primitive: {
      description: localized(
        'Base values define fast, standard, and expressive durations; linear, standard, emphasized, and accelerate easings; plus the shared travel distances.',
        '基础值定义 fast、standard、expressive 时长，linear、standard、emphasized、accelerate 缓动，以及共享行程距离。',
      ),
    },
    presence: {
      label: localized('Presence presets', '出场入场预设'),
      description: localized(
        'One enter/exit contract for the whole library: pick a preset, and elements arrive and leave along the same path. Blur, tilt, and spring presets extend the base set, and every preset has a declared fallback you can switch to below.',
        '全库唯一的出场入场契约：选择一个预设，元素沿同一路径出现与离开。模糊、倾斜与弹簧预设扩展了基础集合，每个预设都有可直接切换的回退档位。',
      ),
      replay: localized('Replay', '重播'),
      visible: localized('Show', '显示'),
      hide: localized('Hide', '隐藏'),
      stagger: localized('Staggered list', '交错列表'),
      staggerDescription: localized(
        'Replay to see items fade and rise in sequence. Reorder to follow the same items as they slide into new positions.',
        '重播观察条目依次淡入、上移；重排观察同一条目平滑移到新位置。',
      ),
      replayEntries: localized('Replay entrance', '重播入场'),
      shuffle: localized('Shuffle', '重排'),
      fallbackLabel: localized('Fallback profile', '回退档位'),
      fallbackFull: localized('Full motion', '完整动效'),
      fallbackNoFilter: localized('No filter', '无滤镜'),
      fallbackFadeOnly: localized('Fade only', '仅淡入'),
      fallbackHint: localized(
        'Switching the profile replays the entrance. No filter drops the blur pass and keeps the arrival through scale; Fade only reproduces an engine without individual transform properties.',
        '切换档位会重播入场。无滤镜跳过模糊通道，改由缩放完成入场；仅淡入复现不具备独立变换属性的引擎。',
      ),
    },
    disclosure: {
      label: localized('Disclosure motion', '展开与收起'),
      description: localized(
        'One reusable height animation for mounted disclosure regions. Opening measures the natural height; closing guards the region with inert and aria-hidden, then applies hidden when the height reaches zero. Reversing continues from the visible frame, and reduced motion applies the target state immediately.',
        '用于已挂载披露区域的统一高度动效。展开时测量自然高度；收起时先加上 inert 与 aria-hidden，高度归零后再设置 hidden。反向切换从当前可见帧继续，减少动效时直接应用目标状态。',
      ),
      expand: localized('Expand list', '展开列表'),
      collapse: localized('Collapse list', '收起列表'),
      hint: localized(
        'The Design Lab uses this primitive for the Explorer specimen leaves. The list stays mounted, so reversing the toggle never remounts its links.',
        '设计实验室用它播放资源浏览中的示例叶子。列表保持挂载，因此反向切换不会重建其中的链接。',
      ),
      items: {
        overview: localized('Overview', '总览'),
        tokens: localized('Motion tokens', '动效令牌'),
        reduced: localized('Reduced motion', '减少动效'),
      },
    },
    page: {
      label: localized('Page transitions', '页面切换'),
      description: localized(
        'Standard page-change choreography driven by View Transitions with scoped region snapshots and directional motion, plus the experimental WebGL particle dissolve.',
        '由 View Transitions 驱动的标准页面切换编排，支持局部区域快照与方向感知动效，并附带实验性 WebGL 粒子消散。',
      ),
      replay: localized('Swap panel', '切换面板'),
      pipeline: localized('Active pipeline', '当前管线'),
      pipelineWebgl: localized(
        'WebGL particles (HTML-in-Canvas capture)',
        'WebGL 粒子（HTML-in-Canvas 捕获）',
      ),
      pipelineWebglSynthetic: localized(
        'WebGL particles (synthetic dust)',
        'WebGL 粒子（合成尘埃）',
      ),
      pipelineCrossfadeFallback: localized('Crossfade fallback', '淡入淡出回退'),
      pipelineLabel: {
        auto: localized('Auto (capture → dust → crossfade)', '自动（捕获 → 尘埃 → 淡入淡出）'),
        capture: localized('Forced HTML capture', '强制 HTML 捕获'),
        synthetic: localized('Forced synthetic dust', '强制合成尘埃'),
        crossfade: localized('Forced crossfade', '强制淡入淡出'),
      },
      panelAlpha: localized('Panel Alpha', '面板 Alpha'),
      panelBeta: localized('Panel Beta', '面板 Beta'),
    },
  },
} as const;
