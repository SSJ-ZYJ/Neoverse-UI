<script setup lang="ts">
import { cssVariables } from '@neoverse-ui/tokens';
import { localize, localized, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.scrollbar;

const previewItems = [
  {
    number: '01',
    label: localized('Canvas layers', '画布层'),
    detail: localized('Ambient light / surface / depth', '环境光 / 表面 / 深度'),
  },
  {
    number: '02',
    label: localized('Material surfaces', '材质表面'),
    detail: localized('Glass / opaque / overlay', '玻璃 / 不透明 / 覆盖层'),
  },
  {
    number: '03',
    label: localized('Type hierarchy', '文字层级'),
    detail: localized('Display / heading / body', '展示 / 标题 / 正文'),
  },
  {
    number: '04',
    label: localized('Interactive states', '交互状态'),
    detail: localized('Rest / hover / active', '静止 / 悬停 / 按下'),
  },
  {
    number: '05',
    label: localized('Focus treatment', '焦点处理'),
    detail: localized('Visible keyboard path', '可见的键盘路径'),
  },
  {
    number: '06',
    label: localized('Motion rhythm', '动效节奏'),
    detail: localized('Fast / standard / expressive', '快速 / 标准 / 表达'),
  },
  {
    number: '07',
    label: localized('Radius language', '圆角语言'),
    detail: localized('Control / card / panel', '控件 / 卡片 / 面板'),
  },
  {
    number: '08',
    label: localized('Shadow hierarchy', '阴影层级'),
    detail: localized('Control / raised / overlay', '控件 / 抬升 / 覆盖层'),
  },
  {
    number: '09',
    label: localized('Status signals', '状态信号'),
    detail: localized('Info / success / warning', '信息 / 成功 / 警告'),
  },
  {
    number: '10',
    label: localized('Responsive gutters', '响应式留白'),
    detail: localized('Inline / block / grid', '行内 / 块级 / 网格'),
  },
  {
    number: '11',
    label: localized('Navigation map', '导航地图'),
    detail: localized('Overview / modules / return', '总览 / 模块 / 返回'),
  },
  {
    number: '12',
    label: localized('Ready for the next layer', '准备进入下一层'),
    detail: localized('The canvas remains in view', '画布始终保持可见'),
  },
] as const;

const tokenRows = [
  { label: copy.tokens.size, variable: cssVariables.components.scrollbar.immersive.size },
  { label: copy.tokens.track, variable: cssVariables.components.scrollbar.immersive.track },
  { label: copy.tokens.thumb, variable: cssVariables.components.scrollbar.immersive.thumb },
  {
    label: copy.tokens.hover,
    variable: cssVariables.components.scrollbar.immersive.thumbHover,
  },
  {
    label: copy.tokens.active,
    variable: cssVariables.components.scrollbar.immersive.thumbActive,
  },
  { label: copy.tokens.edge, variable: cssVariables.components.scrollbar.immersive.thumbEdge },
] as const;
</script>

<template>
  <div class="grid gap-grid">
    <section class="grid gap-3" aria-labelledby="scrollbar-preview-title">
      <header class="grid gap-1">
        <h2 id="scrollbar-preview-title" class="text-subtitle font-heading tracking-heading">
          {{ localize(copy.preview.label, props.locale) }}
        </h2>
        <p class="text-caption text-secondary">
          {{ localize(copy.preview.description, props.locale) }}
        </p>
      </header>

      <div class="grid gap-grid lg:grid-cols-2">
        <article class="grid min-h-0 gap-3 rounded-card bg-surface-raised p-5 shadow-card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-label font-label text-primary">
                {{ localize(copy.preview.viewportLabel, props.locale) }}
              </h3>
              <p class="mt-1 text-caption text-secondary">
                {{ localize(copy.preview.viewportHint, props.locale) }}
              </p>
            </div>
            <code class="text-code text-muted">
              scrollbar-immersive
            </code>
          </div>

          <div
            class="scrollbar-immersive max-h-72 overflow-y-auto rounded-control bg-surface-canvas p-2"
            :aria-label="localize(copy.preview.viewportLabel, props.locale)"
          >
            <ol class="grid divide-y divide-subtle">
              <li
                v-for="item in previewItems"
                :key="item.number"
                class="flex items-center gap-3 px-3 py-3"
              >
                <span class="shrink-0 text-code text-accent-primary">{{ item.number }}</span>
                <div class="min-w-0">
                  <p class="truncate text-label font-label text-primary">
                    {{ localize(item.label, props.locale) }}
                  </p>
                  <p class="truncate text-caption text-secondary">
                    {{ localize(item.detail, props.locale) }}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </article>

        <article class="grid gap-3 rounded-card bg-surface-raised p-5 shadow-card">
          <header class="grid gap-1">
            <h3 class="text-label font-label text-primary">
              {{ localize(copy.tokens.label, props.locale) }}
            </h3>
            <p class="text-caption text-secondary">
              {{ localize(copy.tokens.description, props.locale) }}
            </p>
          </header>

          <dl class="grid divide-y divide-subtle">
            <div
              v-for="token in tokenRows"
              :key="token.variable"
              class="grid gap-1 py-3 first:pt-0 last:pb-0"
            >
              <dt class="text-label font-label text-primary">
                {{ localize(token.label, props.locale) }}
              </dt>
              <dd class="min-w-0">
                <code class="block break-all text-code text-secondary">{{ token.variable }}</code>
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  </div>
</template>
