<script setup lang="ts">
import { UiButton, UiSurface } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const tab = ref(0);
const copy = computed(() =>
  props.locale === 'zh'
    ? {
        title: '正文阅读组合',
        description: '正文保持安静，复制、导航和折叠提供明确反馈。',
        content: '正文语义',
        widthRole: '正文样式只负责排版语义，阅读宽度由 max-w-reading 单独控制。',
        code: '代码示例',
        copy: '复制',
        copied: '已复制',
        failed: '复制失败，请重试',
        quote: '共享材质负责一致性，内容组件负责阅读语义。',
        details: '实现说明',
        detail: '表格和长代码在各自容器内滚动，不撑宽文章。',
        columns: ['组件', '共享职责', '产品职责'],
        rows: [
          ['代码块', '颜色、边框和复制按钮', '高亮、文件标题、长代码降级与语言渲染'],
          ['导航卡片', 'Surface 与焦点反馈', '站内路由、外链目标、内容布局、分析与权限处理'],
        ],
        notes: [
          '提示：保留代码中的空行。',
          '建议：使用语义 Token。',
          '重要：正文不叠加多层模糊。',
          '警告：表格内容可能超出视口。',
          '注意：复制需要浏览器剪贴板权限。',
        ],
        next: '查看 Surface 契约',
      }
    : {
        title: 'Article reading composition',
        description: 'Quiet content with clear copy, navigation, and disclosure feedback.',
        content: 'Content semantics',
        widthRole: 'Prose owns reading semantics; max-w-reading controls line length separately.',
        code: 'Code examples',
        copy: 'Copy',
        copied: 'Copied',
        failed: 'Copy failed; try again',
        quote: 'Shared materials own consistency; content components own reading semantics.',
        details: 'Implementation notes',
        detail:
          'Tables and long code scroll inside their own containers without widening the article.',
        columns: ['Component', 'Shared responsibility', 'Product responsibility'],
        rows: [
          [
            'Code block',
            'Colors, borders, and copy control',
            'Highlighting, file titles, long-code fallback, and language-specific rendering',
          ],
          [
            'Navigation card',
            'Surface and focus feedback',
            'Internal routes, external destinations, content layout, analytics, and permissions',
          ],
        ],
        notes: [
          'Note: preserve blank lines in code.',
          'Tip: use semantic tokens.',
          'Important: avoid stacking backdrop filters.',
          'Warning: table content can exceed the viewport.',
          'Caution: copying requires clipboard access.',
        ],
        next: 'Read the Surface contract',
      },
);
const snippets = [
  'const theme = "system";\n\nconst readingPreferences = { lineLength: 72, preserveBlankLines: true, overflow: "local" };\n\nexport { theme, readingPreferences };',
  'export const theme: string = "system";\n\nexport const readingPreferences: Readonly<Record<string, string | number | boolean>> = { lineLength: 72, preserveBlankLines: true, overflow: "local" };',
];
const feedback = ref<'copied' | 'failed' | null>(null);
async function copyCode() {
  try {
    await navigator.clipboard.writeText(snippets[tab.value] ?? '');
    feedback.value = 'copied';
  } catch {
    feedback.value = 'failed';
  }
}
function selectTab(index: number) {
  tab.value = index;
  feedback.value = null;
}
function onTabKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  selectTab(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - tab.value);
  const group = (event.currentTarget as HTMLElement).parentElement;
  group?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[tab.value]?.focus();
}
</script>

<template>
  <section
    id="composition-reading"
    class="scroll-mt-24 grid min-w-0 gap-4 md:col-span-2"
    data-reading-composition
  >
    <header class="grid gap-2">
      <h3 class="text-title-sm text-primary">{{ copy.title }}</h3>
      <p class="text-body text-secondary">{{ copy.description }}</p>
    </header>
    <UiSurface surface="subtle" class="relative min-w-0 overflow-hidden rounded-control">
      <div role="tablist" :aria-label="copy.code" class="flex gap-2 border-b border-subtle p-2">
        <UiButton
          v-for="(language, index) in ['JavaScript', 'TypeScript']"
          :id="`reading-tab-${index}`"
          :key="language"
          role="tab"
          surface="none"
          variant="ghost"
          size="sm"
          :aria-selected="tab === index"
          :tabindex="tab === index ? 0 : -1"
          aria-controls="reading-panel"
          @click="selectTab(index)"
          @keydown="onTabKey"
          >{{ language }}</UiButton
        >
      </div>
      <div
        id="reading-panel"
        role="tabpanel"
        :aria-labelledby="`reading-tab-${tab}`"
        class="min-w-0"
      >
        <div class="flex items-center justify-between gap-2 border-b border-subtle px-4 py-2">
          <code class="text-code text-secondary">{{ tab === 0 ? 'theme.js' : 'theme.ts' }}</code>
          <UiButton variant="ghost" surface="none" size="sm" @click="copyCode">
            {{ copy.copy }}
          </UiButton>
        </div>
        <pre
          class="scrollbar-immersive max-w-full overflow-auto p-4 text-code text-primary"
        ><code>{{ snippets[tab] }}</code></pre>
        <p class="sr-only" aria-live="polite">
          {{ feedback ? copy[feedback] : '' }}
        </p>
      </div>
    </UiSurface>
    <UiSurface as="article" surface="subtle" class="rounded-card p-4 md:p-5">
      <div data-reading-prose class="neoverse-prose max-w-reading">
        <h4>{{ copy.content }}</h4>
        <p>{{ copy.widthRole }} <code>max-w-reading</code></p>

        <blockquote>{{ copy.quote }}</blockquote>

        <ul>
          <li v-for="note in copy.notes" :key="note">{{ note }}</li>
        </ul>

        <UiSurface
          as="section"
          surface="none"
          data-reading-table-scroll
          class="max-w-full overflow-x-auto"
          tabindex="0"
          :aria-label="copy.content"
        >
          <table>
            <thead>
              <tr>
                <th v-for="column in copy.columns" :key="column">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in copy.rows" :key="row[0]">
                <td v-for="cell in row" :key="cell">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </UiSurface>

        <details>
          <summary>{{ copy.details }}</summary>
          <p>{{ copy.detail }}</p>
        </details>

        <p>
          <a data-reading-surface-link href="#materials-surface">{{ copy.next }}</a>
        </p>
      </div>
    </UiSurface>
  </section>
</template>
