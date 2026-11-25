import { localized } from './locale';

export const compositionModuleCopy = {
  label: localized('Scenes and modes', '场景与模式'),
  description: localized(
    'Real interface compositions combine type, surface, material, spacing, and core controls in one calibration view.',
    '真实界面组合在同一个校准视图中结合字体、表面、材质、间距与核心控件。',
  ),
  previewModes: {
    standard: {
      label: localized('Aurora Glass mode', '极光玻璃模式'),
      description: localized(
        'Normal product compositions keep translucent, backdrop-filtered Aurora Glass surfaces with edge depth and refraction.',
        '正常产品组合统一使用半透明、带背景模糊与边缘层次的极光玻璃表面。',
      ),
    },
    accessibility: {
      label: localized('Accessibility fallback', '无障碍适配预览'),
      description: localized(
        'Reduced-transparency mode keeps the same semantic surfaces but replaces backdrop sampling with an opaque readable fallback.',
        '降低透明度模式保持相同语义表面，但以不采样背景的高可读性不透明回退替代极光玻璃的背景模糊。',
      ),
      cardTitle: localized('Readable project summary', '高可读性项目摘要'),
      cardBody: localized(
        'The material hierarchy stays intact without blur or refraction when reduced transparency is requested.',
        '请求降低透明度后，材质层级仍然保留，但不再使用模糊与折射。',
      ),
      toolbarTitle: localized('Accessible control surface', '无障碍控件表面'),
      toolbarBody: localized(
        'Control semantics, grouping, and focus feedback remain while backdrop sampling is removed.',
        '控件语义、分组与焦点反馈保持不变，只移除透明背景采样。',
      ),
      fallbackBadge: localized('Reduced transparency', '降低透明度'),
      summary: localized('Summary', '摘要'),
      details: localized('Details', '详情'),
      continue: localized('Continue', '继续'),
      apply: localized('Apply', '应用'),
    },
  },
  scenes: {
    controlCluster: {
      label: localized('Neoverse Control Cluster', 'Neoverse 控件集群'),
      description: localized(
        'A compact workspace control group keeps state, mode, and actions on one rhythm.',
        '紧凑的工作区控件组让状态、模式与操作保持在同一节奏上。',
      ),
      workspace: localized('Atlas workspace', 'Atlas 工作区'),
      status: localized('Synced', '已同步'),
      modes: {
        focus: localized('Focus', '聚焦'),
        review: localized('Review', '审阅'),
        archive: localized('Archive', '归档'),
      },
      modesLabel: localized('Workspace modes', '工作区模式'),
      apply: localized('Apply', '应用'),
      more: localized('More workspace actions', '更多工作区操作'),
    },
    projectCard: {
      label: localized('Project Card', '项目卡片'),
      description: localized(
        'A project summary balances status, progress, metadata, and a clear next action.',
        '项目摘要平衡状态、进度、元数据与明确的下一步操作。',
      ),
      project: localized('Aurora Atlas', 'Aurora Atlas'),
      category: localized('Design systems', '设计系统'),
      summary: localized('A calm handoff for the next release.', '为下一次发布准备的平稳交接。'),
      progress: localized('Delivery', '交付进度'),
      updated: localized('Updated 8m ago', '8 分钟前更新'),
      open: localized('Open project', '打开项目'),
      more: localized('More project actions', '更多项目操作'),
    },
    floatingToolbar: {
      label: localized('Floating Toolbar', '悬浮工具栏'),
      description: localized(
        'A floating action surface keeps high-frequency tools compact without flattening hierarchy.',
        '悬浮操作表面让高频工具保持紧凑，同时不削弱层级关系。',
      ),
      modes: {
        canvas: localized('Canvas', '画布'),
        inspect: localized('Inspect', '检查'),
        history: localized('History', '历史'),
      },
      modesLabel: localized('Canvas view', '画布视图'),
      highlight: localized('Highlight selection', '高亮选择'),
      add: localized('Add canvas item', '添加画布项目'),
      confirm: localized('Confirm canvas changes', '确认画布变更'),
      more: localized('More canvas actions', '更多画布操作'),
      share: localized('Share', '分享'),
      publish: localized('Publish', '发布'),
    },
    docsArticleHeader: {
      label: localized('Docs Article Header', '文档文章头部'),
      description: localized(
        'An article header establishes reading order before metadata and supporting actions.',
        '文章头部先建立阅读顺序，再安排元数据与辅助操作。',
      ),
      eyebrow: localized('Guide', '指南'),
      title: localized('Build a calm interface', '构建平静的界面'),
      summary: localized(
        'Use semantic layers to make dense product surfaces feel clear, quiet, and intentional.',
        '使用语义层，让高密度产品表面保持清晰、克制且有目的。',
      ),
      meta: localized('8 min read · Updated today', '阅读约 8 分钟 · 今日更新'),
      save: localized('Save', '保存'),
      more: localized('More article actions', '更多文章操作'),
      author: localized('Neoverse UI editorial', 'Neoverse UI 编辑组'),
    },
    docsNavigationGroup: {
      label: localized('Docs Navigation Group', '文档导航组'),
      description: localized(
        'A documentation group uses quiet selection, nested rhythm, and a small count signal.',
        '文档导航组使用克制的选中态、嵌套节奏与简洁的数量提示。',
      ),
      group: localized('In this chapter', '本章内容'),
      count: localized('4 items', '4 项'),
      navigationLabel: localized('Documentation navigation', '文档导航'),
      links: {
        foundations: localized('Foundations', '基础'),
        tokens: localized('Tokens', '令牌'),
        materials: localized('Materials', '材质'),
        controls: localized('Controls', '控件'),
      },
    },
    docsContentSurface: {
      label: localized('Docs Content Surface', '文档内容表面'),
      description: localized(
        'A readable content surface keeps long-form type, references, and navigation actions in balance.',
        '可读的内容表面平衡长篇文字、引用信息与导航操作。',
      ),
      eyebrow: localized('Foundations', '基础'),
      title: localized('Semantic layers make density legible', '语义层让密度清晰可读'),
      body: localized(
        'When every layer has a role, spacing can stay compact without making the interface feel crowded.',
        '当每一层都有明确职责时，间距可以保持紧凑，同时不会让界面显得拥挤。',
      ),
      detail: localized(
        'The same semantic roles can support a quiet reading surface and a dense control surface without introducing a one-off component.',
        '同一组语义角色既能支撑克制的阅读表面，也能支撑高密度的控件表面，而无需引入一次性组件。',
      ),
      reference: localized('Token reference', '令牌引用'),
      previous: localized('Previous', '上一节'),
      next: localized('Next', '下一节'),
    },
    docsToolbar: {
      label: localized('Docs Toolbar', '文档工具栏'),
      description: localized(
        'A documentation toolbar keeps reading mode, saved state, and utility actions aligned.',
        '文档工具栏对齐阅读模式、保存状态与实用操作。',
      ),
      workspace: localized('Docs workspace', '文档工作区'),
      modes: {
        read: localized('Read', '阅读'),
        edit: localized('Edit', '编辑'),
        preview: localized('Preview', '预览'),
      },
      modesLabel: localized('Documentation mode', '文档模式'),
      saved: localized('Saved just now', '刚刚保存'),
      copyLink: localized('Copy link', '复制链接'),
      more: localized('More documentation actions', '更多文档操作'),
    },
  },
} as const;
