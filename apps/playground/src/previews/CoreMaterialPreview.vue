<script setup lang="ts">
import type { MaterialMode } from '@neoverse-ui/tokens';
import {
  UiButton,
  UiCard,
  UiControlSurface,
  UiDialog,
  UiDock,
  UiField,
  UiInput,
  UiNavigationItem,
  UiSegmentedControl,
  UiSelect,
  UiTable,
  UiTabs,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabIcon from '../LabIcon.vue';
import { type Locale, localize, localized } from '../playground-content';
import { resolvedTheme } from '../theme-state';

const props = defineProps<{ mode: MaterialMode; locale: Locale }>();
const copy = {
  title: localized('Release workspace', '发布工作区'),
  name: localized('Project name', '项目名称'),
  channel: localized('Channel', '渠道'),
  stable: localized('Stable', '稳定版'),
  preview: localized('Preview', '预览版'),
  overview: localized('Overview', '概览'),
  activity: localized('Activity', '活动'),
  dock: localized('Workspace navigation', '工作区导航'),
  actions: localized('Release actions', '发布操作'),
  publish: localized('Review', '检查'),
  draft: localized('Save draft', '存草稿'),
  reset: localized('Reset', '重置'),
  readiness: localized('Readiness', '就绪状态'),
  check: localized('Check', '检查项'),
  status: localized('Status', '状态'),
  build: localized('Build', '构建'),
  tests: localized('Tests', '测试'),
  passed: localized('Passed', '通过'),
  pending: localized('Pending', '等待中'),
  review: localized('Review release', '检查发布版本'),
  description: localized(
    'Check the name and channel before continuing.',
    '继续之前请确认名称和渠道。',
  ),
  close: localized('Close', '关闭'),
} as const;
const appearance = {
  glass: {
    light: localized('Glass Light', '浅色极光玻璃'),
    dark: localized('Glass Dark', '深色极光玻璃'),
  },
  solid: { light: localized('Solid Light', '浅色实体'), dark: localized('Solid Dark', '深色实体') },
} as const;
const text = (key: keyof typeof copy) => localize(copy[key], props.locale);
const segments = computed(() => [
  { value: 'overview', label: text('overview') },
  { value: 'activity', label: text('activity') },
]);
const channels = computed(() => [
  { value: 'stable', label: text('stable') },
  { value: 'preview', label: text('preview') },
]);
const project = ref('Aurora Studio');
const channel = ref<string | number>('stable');
const segment = ref('overview');
const destination = ref('overview');
const dialogOpen = ref(false);
const draft = ref(project.value);
function reset() {
  project.value = draft.value;
  channel.value = 'stable';
  segment.value = 'overview';
  destination.value = 'overview';
}
</script>
<template>
  <section
    :data-neoverse-material="mode"
    :data-core-material="mode"
    class="playground-core-material grid min-w-0 content-start gap-4 rounded-card p-3 sm:p-5"
    :aria-label="localize(appearance[mode][resolvedTheme], locale)"
  >
    <h3 class="text-label font-label text-primary">
      {{ localize(appearance[mode][resolvedTheme], locale) }}
    </h3>
    <UiCard class="grid gap-4" data-core-role="card">
      <h4 class="text-subtitle font-heading text-primary">{{ text('title') }}</h4>
      <UiField
        :label="text('name')"
        :control-id="`material-${mode}-name`"
        v-slot="{ controlAttrs }"
      >
        <UiInput v-bind="controlAttrs" v-model="project" data-core-role="input" />
      </UiField>
      <UiField :label="text('channel')" v-slot="{ controlAttrs }">
        <UiSelect
          :data-neoverse-material="mode"
          v-bind="controlAttrs"
          v-model="channel"
          :aria-label="text('channel')"
          :options="channels"
          data-core-role="select"
        />
      </UiField>
      <UiSegmentedControl
        v-model="segment"
        :options="segments"
        :aria-label="text('title')"
        class="justify-self-start"
        data-core-role="segmented"
      />
      <UiTabs :options="segments" v-bind="{ ariaLabel: text('dock') }" data-core-role="tabs" />
      <UiTabs
        :options="segments"
        v-bind="{ ariaLabel: text('dock') }"
        variant="glass"
        data-core-role="explicit-glass-tabs"
      />
      <UiControlSurface class="flex-wrap" :aria-label="text('actions')" data-core-role="group">
        <UiButton size="sm" data-core-role="primary" @click="dialogOpen = true">{{
          text('publish')
        }}</UiButton>
        <UiButton
          size="sm"
          variant="secondary"
          data-core-role="secondary"
          @click="draft = project"
          >{{
            text('draft')
          }}</UiButton
        >
        <UiButton size="sm" variant="ghost" data-core-role="ghost" @click="reset">{{
          text('reset')
        }}</UiButton>
      </UiControlSurface>
    </UiCard>
    <UiTable :caption="text('readiness')" data-core-role="table">
      <thead>
        <tr>
          <th scope="col">{{ text('check') }}</th>
          <th scope="col">{{ text('status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ text('build') }}</td>
          <td>{{ text('passed') }}</td>
        </tr>
        <tr>
          <td>{{ text('tests') }}</td>
          <td>{{ text('pending') }}</td>
        </tr>
      </tbody>
    </UiTable>
    <UiDock scale="md" :aria-label="text('dock')" data-core-role="dock">
      <UiNavigationItem
        v-for="item in segments"
        as="button"
        :key="item.value"
        :label="item.label"
        :active="destination === item.value"
        @click="destination = item.value"
      >
        <template #icon
          ><LabIcon :name="item.value === 'overview' ? 'home' : 'activity'" /></template
        >
      </UiNavigationItem>
    </UiDock>
    <UiDialog
      v-model:open="dialogOpen"
      :title="text('review')"
      :description="text('description')"
      data-core-role="dialog"
    >
      <p>{{ project }} · {{ channels.find((item) => item.value === channel)?.label }}</p>
      <template #footer
        ><UiButton @click="dialogOpen = false">{{ text('close') }}</UiButton></template
      >
    </UiDialog>
  </section>
</template>
