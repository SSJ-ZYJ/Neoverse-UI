<script setup lang="ts">
import darkCss from '@neoverse-ui/giscus-theme/dark.css?raw';
import lightCss from '@neoverse-ui/giscus-theme/light.css?raw';
import { computed } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

const copy = {
  title: localized('Giscus widget theme', 'Giscus 评论主题'),
  description: localized(
    'The published iframe theme rendered with the CSS the comment widget actually loads. Each preview is isolated so the widget global cannot leak into the Design Lab.',
    '使用评论组件实际加载的 CSS 渲染已发布的 iframe 主题。每个预览独立隔离，组件全局样式不会影响设计实验室。',
  ),
  light: localized('Light', '浅色'),
  dark: localized('Dark', '深色'),
  author: localized('Shenshijun', 'Shenshijun'),
  time: localized('2 hours ago', '2 小时前'),
  comment: localized(
    'The Aurora Glass edge reads cleanly on this backdrop.',
    '极光玻璃边缘在这层背景上很干净。',
  ),
  placeholder: localized('Write a comment…', '写下评论…'),
  write: localized('Write', '编写'),
  preview: localized('Preview', '预览'),
  submit: localized('Comment', '评论'),
  markdown: localized('Markdown is supported', '支持 Markdown'),
} as const;

type Preview = {
  id: 'light' | 'dark';
  label: string;
  css: string;
  canvas: string;
};

const canvasOf = (css: string): string =>
  /--color-canvas-overlay:\s*(#[0-9a-f]{6})/i.exec(css)?.[1] ?? 'transparent';

const baseCss = (canvas: string): string => `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.giscus-preview-surface { min-block-size: 100vh; padding: 18px; background: ${canvas}; }
.gsc-main { display: grid; gap: 14px; font-size: 14px; line-height: 1.5; }
.gsc-comment { display: grid; gap: 12px; padding: 16px; }
.gsc-comment-header { display: flex; align-items: center; gap: 10px; }
.gsc-comment-author-avatar { flex: none; inline-size: 32px; block-size: 32px; }
.avatar {
  display: grid;
  place-items: center;
  inline-size: 32px;
  block-size: 32px;
  background: linear-gradient(135deg, #0ea5e9, #34c99a);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}
.gsc-comment-author { display: grid; gap: 1px; font-size: 13px; }
.gsc-comment-author .link-secondary { color: var(--color-fg-subtle); font-size: 12px; }
.gsc-comment-content p { margin: 0; }
.gsc-reactions { display: flex; align-items: center; gap: 8px; }
.gsc-reactions-button, .gsc-social-reaction-summary-item {
  padding: 3px 10px;
  border: 1px solid var(--color-border-muted);
  background: transparent;
  color: var(--color-fg-default);
  font: inherit;
  font-size: 12px;
}
.gsc-comment-box { display: grid; }
.gsc-comment-box-tabs { display: flex; gap: 2px; padding: 8px 10px 0; }
.gsc-comment-box-tab {
  padding: 6px 12px;
  border: 0;
  background: transparent;
  color: var(--color-fg-muted);
  font: inherit;
  font-size: 13px;
}
.gsc-comment-box-tab-active { color: var(--color-fg-default); background: var(--color-canvas-inset); }
.gsc-comment-box-main { padding: 10px 12px; }
.gsc-comment-box-textarea {
  inline-size: 100%;
  min-block-size: 76px;
  padding: 10px 12px;
  font: inherit;
  font-size: 13px;
  resize: none;
}
.gsc-comment-box-textarea-extras { padding: 6px 12px; font-size: 11px; color: var(--color-fg-subtle); }
.gsc-comment-box-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px 12px;
}
.gsc-comment-box-md-toolbar { display: flex; gap: 2px; }
.gsc-toolbar-item {
  padding: 4px 7px;
  border: 0;
  background: transparent;
  color: var(--color-fg-muted);
  font: inherit;
  font-size: 12px;
}
.btn { padding: 8px 14px; border: 1px solid var(--color-btn-primary-border); font: inherit; font-size: 13px; font-weight: 600; }
.btn-primary {
  color: var(--color-btn-primary-text);
  background: var(--color-btn-primary-bg);
  box-shadow: var(--color-btn-primary-shadow), var(--color-btn-primary-inset-shadow);
}
`;

const bodyHtml = (): string => `
<div class="giscus-preview-surface">
  <main class="gsc-main">
    <div class="gsc-comment">
      <div class="gsc-comment-header">
        <div class="gsc-comment-author-avatar"><div class="avatar">SJ</div></div>
        <div class="gsc-comment-author">
          <strong>${localize(copy.author, props.locale)}</strong>
          <span class="link-secondary">${localize(copy.time, props.locale)}</span>
        </div>
      </div>
      <div class="gsc-comment-content"><p>${localize(copy.comment, props.locale)}</p></div>
      <div class="gsc-reactions">
        <button class="gsc-reactions-button" type="button">👍 4</button>
        <button class="gsc-social-reaction-summary-item" type="button">🎉 2</button>
      </div>
    </div>
    <div class="gsc-comment-box">
      <div class="gsc-comment-box-tabs">
        <button class="gsc-comment-box-tab gsc-comment-box-tab-active" type="button">${localize(copy.write, props.locale)}</button>
        <button class="gsc-comment-box-tab" type="button">${localize(copy.preview, props.locale)}</button>
      </div>
      <div class="gsc-comment-box-main">
        <div class="gsc-comment-box-write">
          <textarea class="gsc-comment-box-textarea" readonly placeholder="${localize(copy.placeholder, props.locale)}"></textarea>
          <div class="gsc-comment-box-textarea-extras">${localize(copy.markdown, props.locale)}</div>
        </div>
      </div>
      <div class="gsc-comment-box-bottom">
        <div class="gsc-comment-box-md-toolbar">
          <button class="gsc-toolbar-item" type="button">B</button>
          <button class="gsc-toolbar-item" type="button"><em>I</em></button>
          <button class="gsc-toolbar-item" type="button">&lt;/&gt;</button>
        </div>
        <button class="btn btn-primary" type="button">${localize(copy.submit, props.locale)}</button>
      </div>
    </div>
  </main>
</div>
`;

const previews = computed<readonly Preview[]>(() => [
  {
    id: 'light',
    label: localize(copy.light, props.locale),
    css: lightCss,
    canvas: canvasOf(lightCss),
  },
  {
    id: 'dark',
    label: localize(copy.dark, props.locale),
    css: darkCss,
    canvas: canvasOf(darkCss),
  },
]);

const documentFor = (preview: Preview): string => {
  const language = props.locale === 'zh' ? 'zh-CN' : 'en';
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><style>${preview.css}</style><style>${baseCss(preview.canvas)}</style></head><body>${bodyHtml()}</body></html>`;
};
</script>

<template>
  <LabSpecimenSection
    id="giscus-themes"
    :title="localize(copy.title, props.locale)"
    :description="localize(copy.description, props.locale)"
  >
    <div class="grid gap-4 xl:grid-cols-2">
      <figure
        v-for="preview in previews"
        :key="preview.id"
        class="grid min-w-0 gap-2"
        :data-giscus-theme="preview.id"
      >
        <figcaption class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-label-sm font-label text-secondary">{{ preview.label }}</span>
          <code class="text-caption text-muted">{{ preview.canvas }}</code>
        </figcaption>
        <iframe
          :data-giscus-preview="preview.id"
          :title="`${localize(copy.title, props.locale)} — ${preview.label}`"
          class="block w-full rounded-card border border-subtle"
          height="420"
          loading="lazy"
          :srcdoc="documentFor(preview)"
        />
      </figure>
    </div>
  </LabSpecimenSection>
</template>
