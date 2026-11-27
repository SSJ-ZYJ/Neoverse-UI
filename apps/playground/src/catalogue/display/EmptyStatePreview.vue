<script setup lang="ts">
import { type EmptyStateProps, UiButton, UiEmptyState } from '@neoverse-ui/vue';
import { computed } from 'vue';
import { type Locale, localize, localized } from '../../content/playground-content';
import LabIcon from '../../features/workspace/LabIcon.vue';

const props = withDefaults(
  defineProps<{
    locale: Locale;
    category?: 'all' | 'onboarding' | 'search' | 'activity' | 'access';
    variant?: 'scenario' | NonNullable<EmptyStateProps['variant']>;
  }>(),
  { category: 'all', variant: 'scenario' },
);
const projectCreated = defineModel<boolean>('projectCreated', { default: false });
const filterActive = defineModel<boolean>('filterActive', { default: true });
const variantOverride = computed(() => (props.variant === 'scenario' ? undefined : props.variant));
const copy = {
  projects: localized('No projects yet', '暂无项目'),
  projectHint: localized('Create a project to get started.', '创建第一个项目，开始整理工作。'),
  createProject: localized('Create project', '创建项目'),
  project: localized('Untitled project', '未命名项目'),
  removeProject: localized('Remove project', '移除项目'),
  search: localized('No matching files', '没有匹配的文件'),
  searchHint: localized('No files match the current filter.', '当前筛选条件下没有匹配的文件。'),
  clearFilter: localized('Clear filter', '清除筛选'),
  file: localized('Project brief', '项目简报'),
  restoreFilter: localized('Restore filter', '恢复筛选'),
  activity: localized('No recent activity', '暂无近期活动'),
  activityHint: localized('Updates will appear here as they happen.', '有新动态时会显示在这里。'),
  access: localized('Shared files are restricted', '共享文件不可见'),
  accessHint: localized(
    'Ask a workspace administrator for access.',
    '如需查看，请联系工作区管理员。',
  ),
};
</script>

<template>
  <div
    class="playground-preview-columns mx-auto [--neoverse-playground-preview-column-min-width:18rem]"
    :class="props.category === 'all' ? 'max-w-reading' : 'max-w-container-sm'"
  >
    <div
      v-if="props.category === 'all' || props.category === 'onboarding'"
      class="grid self-stretch"
      data-empty-state-case="onboarding"
      aria-live="polite"
    >
      <UiEmptyState
        v-if="!projectCreated"
        :title="localize(copy.projects, props.locale)"
        :description="localize(copy.projectHint, props.locale)"
        :variant="variantOverride ?? 'default'"
        data-empty-state-sample="onboarding"
      >
        <template #icon><LabIcon name="folder" /></template>
        <template #action>
          <UiButton size="sm" @click="projectCreated = true">
            {{ localize(copy.createProject, props.locale) }}
          </UiButton>
        </template>
      </UiEmptyState>
      <div v-else class="grid content-center justify-items-center gap-3 p-4 text-center">
        <p class="text-body-sm text-primary">{{ localize(copy.project, props.locale) }}</p>
        <UiButton size="sm" variant="secondary" @click="projectCreated = false">
          {{ localize(copy.removeProject, props.locale) }}
        </UiButton>
      </div>
    </div>

    <div
      v-if="props.category === 'all' || props.category === 'search'"
      class="grid self-stretch"
      data-empty-state-case="search"
      aria-live="polite"
    >
      <UiEmptyState
        v-if="filterActive"
        :title="localize(copy.search, props.locale)"
        :description="localize(copy.searchHint, props.locale)"
        :variant="variantOverride ?? 'outlined'"
        data-empty-state-sample="search"
      >
        <template #icon><LabIcon name="search" /></template>
        <template #action>
          <UiButton size="sm" variant="secondary" @click="filterActive = false">
            {{ localize(copy.clearFilter, props.locale) }}
          </UiButton>
        </template>
      </UiEmptyState>
      <div v-else class="grid content-center justify-items-center gap-3 p-4 text-center">
        <p class="text-body-sm text-primary">{{ localize(copy.file, props.locale) }}</p>
        <UiButton size="sm" variant="secondary" @click="filterActive = true">
          {{ localize(copy.restoreFilter, props.locale) }}
        </UiButton>
      </div>
    </div>

    <UiEmptyState
      v-if="props.category === 'all' || props.category === 'activity'"
      :title="localize(copy.activity, props.locale)"
      :description="localize(copy.activityHint, props.locale)"
      :variant="variantOverride ?? 'compact'"
      data-empty-state-case="activity"
      data-empty-state-sample="activity"
    >
      <template #icon><LabIcon name="activity" /></template>
    </UiEmptyState>

    <UiEmptyState
      v-if="props.category === 'all' || props.category === 'access'"
      :title="localize(copy.access, props.locale)"
      :description="localize(copy.accessHint, props.locale)"
      :variant="variantOverride ?? 'subtle'"
      data-empty-state-case="access"
      data-empty-state-sample="access"
    >
      <template #icon><LabIcon name="lock" /></template>
    </UiEmptyState>
  </div>
</template>
