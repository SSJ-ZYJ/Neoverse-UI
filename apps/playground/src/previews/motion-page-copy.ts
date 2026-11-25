import { localized } from '../playground-content';

export const motionPageCopy = {
  presets: {
    label: localized('Standard choreography', '标准页面切换动效'),
    description: localized(
      'Zero-experimental transitions built on baseline View Transitions with a WAAPI fallback for scoped outlets. When pages share a background, content-focused presets leave the background still while whole-page presets animate the full surface.',
      '基于标准 View Transitions 与局部 WAAPI 回退打造。当相邻页面背景相同时，非整体预设仅过渡前景内容而不移动背景，保持网站一体性；滑动、推入、光幕、光圈则作为整体页面效果带动画布切换。',
    ),
    variants: {
      fade: {
        label: localized('Fade', '淡隐淡现'),
        summary: localized(
          'Asymmetric fade-through on content only when backgrounds match, avoiding background flash and text ghosting.',
          '同背景时仅对内容执行先退后入淡隐淡现：背景稳固不动，且杜绝文字叠放重影。',
        ),
      },
      glide: {
        label: localized('Glide', '轻滑浮入'),
        summary: localized(
          'Shared-axis content glide inside a stationary surface frame when backgrounds match.',
          '同背景保持画布与边框静止，仅由内容沿导航轴先退后入轻滑，减少页面整体晃动。',
        ),
      },
      slide: {
        label: localized('Slide', '方向滑动'),
        summary: localized(
          'Whole-page edge-to-edge travel for sequential steps, tabs, and slide decks.',
          '整体端到端连续滑动，适合步骤流、分页视图与幻灯片整页切换。',
        ),
      },
      push: {
        label: localized('Push', '视差推入'),
        summary: localized(
          'Whole-page layered sheet glides over a dimmed recessed backdrop and reverses on return.',
          '整体新页面如独立图层推入覆盖退后旧页，返回时对称抽离还原。',
        ),
      },
      depth: {
        label: localized('Depth', '景深缩放'),
        summary: localized(
          'Subtle Z-axis content zoom over an anchored backdrop, keeping shared surfaces grounded.',
          '在静止背景之上进行细腻的 Z 轴景深切换，区分层级钻入而不牵动背景容器。',
        ),
      },
      veil: {
        label: localized('Veil', '柔雾聚焦'),
        summary: localized(
          'Focus pull on foreground content over a motionless shared surface.',
          '前景内容经柔和光学虚焦拉近聚焦，同背景底板始终清晰稳固。',
        ),
      },
      curtain: {
        label: localized('Curtain', '光幕揭开'),
        summary: localized(
          'Whole-page directional linear wipe with a narrow feathered optical edge.',
          '整体沿导航方向扫过的窄羽化光学光幕，带来连贯的整页揭示感。',
        ),
      },
      iris: {
        label: localized('Iris', '光圈展开'),
        summary: localized(
          'Whole-page radial reveal anchored to the launching control or stage center.',
          '从触发控件中心或舞台原点径向展开整个新页，回退时收拢回原点。',
        ),
      },
      morph: {
        label: localized('Morph', '平滑切换'),
        summary: localized(
          'PPT-style Morph: matching elements glide and reshape across pages while matching backdrops stay fixed.',
          '模仿 PPT 平滑移动：带有共同标识的元素跨页平滑位移并重塑几何尺寸，同背景底板保持静止，其余文案淡隐切换。',
        ),
      },
    },
    directionLabel: localized('Direction', '方向'),
    directions: {
      forward: localized('Forward', '前进'),
      backward: localized('Backward', '后退'),
      up: localized('Up', '向上'),
      down: localized('Down', '向下'),
    },
    scopeLabel: localized('Scope', '范围'),
    scopes: {
      region: localized('Region', '局部容器'),
      document: localized('Document', '整页文档'),
    },
    backgroundLabel: localized('Page backdrop', '背景关系'),
    backgrounds: {
      shared: localized('Same canvas', '同背景'),
      surface: localized('Distinct', '异背景'),
    },
    behaviorShared: localized(
      'Shared backdrop locked: background and card plate stay motionless while only content transitions.',
      '当前为同背景内容过渡：卡片底板与页面背景完全静止，仅前景内容切换。',
    ),
    behaviorWholePage: localized(
      'Whole-page effect: animates the entire page surface even when adjacent backdrops match.',
      '当前为整体页面切换效果：带动完整页面表面一同运动或揭示。',
    ),
    behaviorDistinct: localized(
      'Distinct opaque scene surfaces cross-composite synchronously with zero canvas flash.',
      '当前为异背景独立场景切换：不透明页面底板与内容同步叠化过渡，无空洞闪烁。',
    ),
    previous: localized('Previous', '上一页'),
    next: localized('Next', '下一页'),
    pageCounter: localized('Page {current} / {total}', '第 {current} / {total} 页'),
    directionHintNeutral: localized(
      'This preset resolves directly between layouts; direction applies to Glide, Slide, Push, Depth, Curtain, and Iris.',
      '当前预设按原位或匹配元素几何坐标过渡；方向控制适用于轻滑、滑动、推入、景深、光幕与光圈。',
    ),
    pages: [
      {
        id: 'workspace',
        eyebrow: localized('01 · Workspace', '01 · 工作区'),
        title: localized('Aurora Glass Surfaces', '极光玻璃表面层级'),
        badge: localized('Material', '材质系统'),
        status: localized('Edge tracking active', '边缘跟踪运行中'),
        body: localized(
          'Translucent layers preserve backdrop color and specular rim lighting across light and dark themes.',
          '半透明表面在浅色与深色主题下保持背景透色与定向边缘高光。',
        ),
        cta: localized('Open reading view', '进入阅读视图'),
      },
      {
        id: 'reading',
        eyebrow: localized('02 · Documentation', '02 · 文档阅读'),
        title: localized('Spatial Motion Cadence', '空间动效节律'),
        badge: localized('Docs', '文档排版'),
        status: localized('Reduced-motion ready', '已适配减少动效'),
        body: localized(
          'Emphasized deceleration settles arriving views cleanly while departures accelerate smoothly out of the way.',
          '入场采用强调减速曲线平稳落位，离场采用加速曲线干脆退出，互不阻塞交互。',
        ),
        cta: localized('Inspect pipeline', '查看切换管线'),
      },
      {
        id: 'pipeline',
        eyebrow: localized('03 · Runtime', '03 · 运行时'),
        title: localized('Interruptible Choreography', '可中断编排管线'),
        badge: localized('Slides', '演示视图'),
        status: localized('Zero experimental API', '零实验性特性依赖'),
        body: localized(
          'Standard View Transitions and scoped WAAPI fallbacks cancel cleanly on rapid clicks so navigation never queues.',
          '标准 View Transitions 与局部 WAAPI 回退在快速连击时即时接管并清理，绝不排队阻塞。',
        ),
        cta: localized('Return to workspace', '返回工作区'),
      },
    ],
  },
  dissolve: {
    label: localized('Particle dissolve (experimental)', '页面消散（实验性）'),
    description: localized(
      'WebGL2 dust erosion powered by experimental HTML-in-Canvas capture when supported, falling back to synthetic dust or crossfade.',
      '基于实验性 HTML-in-Canvas 捕获（支持时）或合成尘埃的 WebGL2 粒子侵蚀动效，不支持时回退为淡入淡出。',
    ),
  },
} as const;
