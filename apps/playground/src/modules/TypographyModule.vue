<script setup lang="ts">
import { UiSurface } from '@neoverse-ui/vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { typographyTokens } from '../lab-data';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const scaleCopy = {
  title: localized('Semantic type scale', '语义字体层级'),
  description: localized(
    'Display, title, body, and label roles expose one explicit canonical size scale.',
    'Display、Title、Body 与 Label 通过明确尺寸层级表达，同时保留旧有别名兼容。',
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
    <LabSpecimenSection
      id="typography-scale"
      :title="localize(scaleCopy.title, props.locale)"
      :description="localize(scaleCopy.description, props.locale)"
    >
      <div class="playground-specimen-grid">
        <UiSurface
          v-for="token in typographyTokens"
          :key="token.label.en"
          as="article"
          surface="glass-subtle"
          class="playground-specimen-panel grid gap-3"
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
        </UiSurface>
      </div>
    </LabSpecimenSection>

    <LabSpecimenSection
      id="foundation-prose"
      :title="localize(scaleCopy.prose, props.locale)"
      :description="localize(scaleCopy.proseDescription, props.locale)"
    >
      <UiSurface as="article" surface="subtle" class="playground-specimen-panel">
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
      </UiSurface>
    </LabSpecimenSection>
  </div>
</template>
