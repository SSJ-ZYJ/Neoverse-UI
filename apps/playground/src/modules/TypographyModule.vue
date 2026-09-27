<script setup lang="ts">
import { typographyCompatibilityTokens, typographyTokens } from '../lab-data';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const scaleCopy = {
  title: localized('Semantic type scale', '语义字体层级'),
  description: localized(
    'Display, title, body, and label roles expose explicit size levels without changing legacy aliases.',
    'Display、Title、Body 与 Label 通过明确尺寸层级表达，同时保留旧有别名兼容。',
  ),
  compatibility: localized('Compatibility aliases', '兼容别名'),
  compatibilityDescription: localized(
    'Existing display, heading, subtitle, body, and label utilities continue to resolve to the new scale.',
    '现有 display、heading、subtitle、body 与 label 工具类继续映射到新的语义层级。',
  ),
  prose: localized('Prose & content semantics', '正文与内容语义'),
  proseDescription: localized(
    'The prose foundation styles semantic content without owning article width or product layout.',
    '正文 Foundation 只负责语义内容排版，不接管文章宽度或产品布局。',
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
  proseLink: localized('Inspect the reading composition', '查看正文阅读组合'),
} as const;
</script>

<template>
  <div id="foundation-typography" class="scroll-mt-24 grid gap-grid">
    <section class="grid gap-3" aria-labelledby="typography-scale-title">
      <header class="grid gap-1">
        <h2 id="typography-scale-title" class="text-title-lg font-title text-primary">
          {{ localize(scaleCopy.title, props.locale) }}
        </h2>
        <p class="text-body-sm font-body text-secondary">
          {{ localize(scaleCopy.description, props.locale) }}
        </p>
      </header>
      <div class="grid gap-3 lg:grid-cols-2">
        <article
          v-for="token in typographyTokens"
          :key="token.label.en"
          class="grid gap-3 rounded-control material-glass-subtle p-4"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-label-md font-label text-primary">
              {{ localize(token.label, props.locale) }}
            </h3>
            <code class="text-code text-secondary">{{ token.className }}</code>
          </div>
          <p :class="token.className">
            {{ localize(moduleCopy.typography.sample, props.locale) }}
          </p>
          <code class="text-code text-muted">{{ token.variables.join(' · ') }}</code>
        </article>
      </div>
    </section>

    <section
      id="foundation-prose"
      class="scroll-mt-24 grid gap-3"
      aria-labelledby="typography-prose-title"
    >
      <header class="grid gap-1">
        <h2 id="typography-prose-title" class="text-title-lg font-title text-primary">
          {{ localize(scaleCopy.prose, props.locale) }}
        </h2>
        <p class="text-body-sm font-body text-secondary">
          {{ localize(scaleCopy.proseDescription, props.locale) }}
        </p>
      </header>

      <article class="rounded-card bg-surface-subtle p-4 md:p-5">
        <div data-foundation-prose class="neoverse-prose max-w-reading">
          <h3>{{ localize(scaleCopy.prose, props.locale) }}</h3>
          <p>{{ localize(scaleCopy.proseBody, props.locale) }}</p>
          <blockquote>{{ localize(scaleCopy.proseQuote, props.locale) }}</blockquote>
          <ul>
            <li>{{ localize(scaleCopy.proseItemOne, props.locale) }}</li>
            <li>{{ localize(scaleCopy.proseItemTwo, props.locale) }}</li>
          </ul>
          <p><code>.neoverse-prose</code>+<code>max-w-reading</code></p>
          <p>
            <a href="#composition-reading">{{ localize(scaleCopy.proseLink, props.locale) }}</a>
          </p>
        </div>
      </article>
    </section>

    <section class="grid gap-3" aria-labelledby="typography-compatibility-title">
      <header class="grid gap-1">
        <h2 id="typography-compatibility-title" class="text-title-lg font-title text-primary">
          {{ localize(scaleCopy.compatibility, props.locale) }}
        </h2>
        <p class="text-body-sm font-body text-secondary">
          {{ localize(scaleCopy.compatibilityDescription, props.locale) }}
        </p>
      </header>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="token in typographyCompatibilityTokens"
          :key="token.label.en"
          class="grid gap-2 rounded-control bg-surface-subtle p-4"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-label-md font-label text-primary">
              {{ localize(token.label, props.locale) }}
            </h3>
            <code class="text-code text-secondary">{{ token.className }}</code>
          </div>
          <p :class="token.className">
            {{ localize(moduleCopy.typography.sample, props.locale) }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>
