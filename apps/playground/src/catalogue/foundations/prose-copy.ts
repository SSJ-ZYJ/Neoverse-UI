import { localized } from '../../content/playground-content';

export const proseCopy = {
  prose: localized('Prose & content semantics', '正文与内容语义'),
  proseDescription: localized(
    'The prose foundation styles semantic content without owning article width or product layout.',
    'Prose 负责标题、段落等内容的排版，不决定文章宽度或页面布局。',
  ),
  proseBody: localized(
    'Use one semantic content layer for headings, paragraphs, links, lists, code, quotes, tables, and disclosures.',
    '标题、段落、链接、列表、代码、引用、表格与折叠内容统一使用一层语义内容样式。',
  ),
  proseQuote: localized(
    'Typography and line length are separate contracts so the same content language can serve docs, blog posts, and product help.',
    '排版语义与阅读宽度保持独立，因此同一套内容语言可以服务文档、博客与产品帮助内容。',
  ),
  proseItemOne: localized(
    'Pair .neoverse-prose with max-w-reading for standard articles.',
    '标准文章将 .neoverse-prose 与 max-w-reading 组合使用。',
  ),
  proseItemTwo: localized(
    'Use max-w-reading-wide only when content density needs more room.',
    '仅在内容密度需要更大空间时使用 max-w-reading-wide。',
  ),
  materialHeading: localized('Material scope', '材质作用域'),
  materialExample: localized('Glass or Solid', '极光玻璃或实体'),
  keyboardHeading: localized('Keyboard controls', '键盘操作'),
  proseLink: localized('Inspect the reading composition', '查看正文阅读组合'),
} as const;
