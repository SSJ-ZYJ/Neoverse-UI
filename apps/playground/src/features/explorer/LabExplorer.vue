<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { UiIconButton, UiInput, UiNavigationItem } from '@neoverse-ui/vue';
import { computed, reactive, ref, watch } from 'vue';
import {
  appCopy,
  catalogueSecondary,
  formatLocalized,
  type Locale,
  localize,
  localized,
} from '../../content/playground-content';
import {
  browsableSpecimens,
  type LabModule,
  type LabSpecimen,
  labModules,
  type ModuleGroup,
  moduleGroups,
  type ResolvedLabHash,
} from '../catalogue/lab-modules';
import LabIcon from '../workspace/LabIcon.vue';
import CatalogueLabel from './CatalogueLabel.vue';
import LabDisclosureList from './LabDisclosureList.vue';

type ExplorerModule = LabModule & { readonly specimens: readonly LabSpecimen[] };
type ExplorerSection = ModuleGroup & { readonly modules: readonly ExplorerModule[] };
type ResultModule = ExplorerModule & { readonly leaves: readonly LabSpecimen[] };
type ResultSection = ModuleGroup & { readonly modules: readonly ResultModule[] };

const props = defineProps<{
  locale: Locale;
  persistent: boolean;
  route: ResolvedLabHash | null;
  homeHref: string;
}>();
const emit = defineEmits<{ close: []; navigate: [event: MouseEvent, hash: string | null] }>();

const searchLabel = localized('Search modules and specimens', '搜索模块与示例');
const searchHint = localized('Name, API, or tag…', '名称、API 或标签…');
const noResults = localized(
  'No modules or specimens match your search.',
  '没有与搜索匹配的模块或示例。',
);
const toggleModuleLabel = localized(
  '{module}: toggle {count} specimens',
  '{module}：展开或收起 {count} 个示例',
);
const search = ref('');
const terms = computed(() => search.value.toLowerCase().trim().split(/\s+/).filter(Boolean));
const searching = computed(() => terms.value.length > 0);
const collapsed = reactive(new Set<string>());
const expandedModules = reactive(new Set<string>(props.route ? [props.route.moduleId] : []));

const groups: ExplorerSection[] = moduleGroups.map((group) => ({
  ...group,
  modules: group.moduleIds.flatMap((id) => {
    const module = labModules.find((entry) => entry.id === id);
    return module === undefined ? [] : [{ ...module, specimens: browsableSpecimens(id) }];
  }),
}));

function matches(values: readonly string[]): boolean {
  const text = values.join(' ').toLowerCase();
  return terms.value.every((term) => text.includes(term));
}

function specimenTerms(specimen: LabSpecimen): string[] {
  return [
    specimen.id,
    specimen.label.en,
    specimen.label.zh,
    ...specimen.apiNames,
    ...specimen.tags,
    ...(specimen.tags.includes('glass') ? [glassMaterial.name.en, glassMaterial.name.zh] : []),
  ];
}

function repeatsModuleLabel(module: ExplorerModule): boolean {
  const only = module.specimens[0];
  return (
    module.specimens.length === 1 &&
    only !== undefined &&
    only.label.en === module.label.en &&
    only.label.zh === module.label.zh
  );
}

function moduleTargetHash(module: ExplorerModule): string {
  const sole = module.specimens[0];
  if (repeatsModuleLabel(module) && sole !== undefined && typeof sole.preview === 'object') {
    return sole.id;
  }
  return module.id;
}

function isModuleLinkActive(module: ExplorerModule): boolean {
  if (props.route?.moduleId !== module.id) return false;
  if (props.route.specimenId === undefined) return true;
  const sole = module.specimens[0];
  return repeatsModuleLabel(module) && sole !== undefined && props.route.specimenId === sole.id;
}

const results = computed<ResultSection[]>(() => {
  return groups.flatMap((group) => {
    const modules = group.modules.flatMap((module) => {
      // A single specimen whose label matches the module is the module row
      // itself. A differently named specimen stays a leaf so its editable
      // session can be inspected without repeating the module label.
      const direct = repeatsModuleLabel(module);
      if (!searching.value) {
        return [{ ...module, leaves: direct ? [] : module.specimens }];
      }
      const names = [module.id, module.label.en, module.label.zh, group.label.en, group.label.zh];
      const leaves = module.specimens.filter((specimen) => matches(specimenTerms(specimen)));
      if (leaves.length === 0 && !matches(names)) return [];
      return [{ ...module, leaves: direct ? [] : leaves }];
    });
    return modules.length > 0 ? [{ ...group, modules }] : [];
  });
});

function groupCount(group: ResultSection): number {
  // Counts describe the tree: a direct destination counts once, a family
  // counts its visible specimens, which shrink to the matches while searching.
  return group.modules.reduce(
    (total, module) => total + (module.leaves.length > 0 ? module.leaves.length : 1),
    0,
  );
}

function groupActive(group: ResultSection): boolean {
  return group.modules.some((module) => module.id === props.route?.moduleId);
}

watch(searching, (active) => {
  if (active) collapsed.clear();
});
watch(
  () => props.route?.moduleId,
  (id) => {
    const group = groups.find((entry) => entry.modules.some((module) => module.id === id));
    if (group !== undefined) collapsed.delete(group.id);
    if (id !== undefined) expandedModules.add(id);
  },
);

function toggle(id: string): void {
  if (!collapsed.delete(id)) collapsed.add(id);
}

function moduleExpanded(id: string): boolean {
  return searching.value || expandedModules.has(id);
}

function toggleModule(id: string): void {
  if (!expandedModules.delete(id)) expandedModules.add(id);
}
</script>

<template>
  <header class="playground-shell__panel-header">
    <div class="playground-shell__panel-title">
      <h2 id="explorer-title" class="text-title-sm font-title text-primary">
        {{ localize(appCopy.navigation.label, locale) }}
      </h2>
      <UiIconButton
        v-if="!persistent"
        variant="ghost"
        surface="none"
        size="sm"
        :label="localize(appCopy.navigation.close, locale)"
        @click="emit('close')"
      >
        <LabIcon name="close" />
      </UiIconButton>
    </div>
    <UiInput
      v-model="search"
      data-specimen-search
      type="search"
      :aria-label="localize(searchLabel, locale)"
      :placeholder="localize(searchHint, locale)"
    />
  </header>

  <nav
    class="playground-shell__panel-body playground-explorer scrollbar-immersive"
    :aria-label="localize(appCopy.navigation.modulesLabel, locale)"
  >
    <UiNavigationItem
      :href="homeHref"
      tabindex="0"
      :label="localize(appCopy.navigation.overview, locale)"
      :active="route === null"
      stretch
      indicator-placement="start"
      class="playground-explorer__link playground-explorer__overview"
      @click="emit('navigate', $event, null)"
    >
      <template #icon><LabIcon name="home" /></template>
    </UiNavigationItem>

    <p v-if="results.length === 0" role="status" class="px-2 py-3 text-body-sm text-secondary">
      {{ localize(noResults, locale) }}
    </p>

    <section
      v-for="group in results"
      :key="group.id"
      class="playground-explorer__section"
      :data-kind="group.kind"
      :data-active="groupActive(group) || undefined"
      :aria-labelledby="`explorer-group-${group.id}`"
    >
      <h3 class="playground-explorer__heading">
        <button
          :id="`explorer-group-${group.id}`"
          type="button"
          class="playground-explorer__section-toggle"
          :aria-controls="`explorer-items-${group.id}`"
          :aria-expanded="!collapsed.has(group.id)"
          @click="toggle(group.id)"
        >
          <CatalogueLabel
            :label="group.label"
            :locale="locale"
            class="playground-explorer__section-label"
          />
          <span v-if="groupCount(group) > 0" class="playground-explorer__count" aria-hidden="true">
            {{ groupCount(group) }}
          </span>
          <LabIcon name="chevron" class="playground-explorer__chevron" />
        </button>
      </h3>

      <ul v-show="!collapsed.has(group.id)" :id="`explorer-items-${group.id}`">
        <li
          v-for="module in group.modules"
          :key="module.id"
          class="playground-explorer__module"
          :data-active="route?.moduleId === module.id || undefined"
        >
          <div class="playground-explorer__module-row">
            <UiNavigationItem
              :href="`#${moduleTargetHash(module)}`"
              tabindex="0"
              :label="localize(module.label, locale)"
              :active="isModuleLinkActive(module)"
              stretch
              indicator-placement="start"
              class="playground-explorer__link playground-explorer__module-link"
              @click="emit('navigate', $event, moduleTargetHash(module))"
            >
              <template v-if="catalogueSecondary(module.label, locale)" #suffix>
                <span class="playground-catalogue-label__secondary" lang="en" aria-hidden="true">
                  {{ catalogueSecondary(module.label, locale) }}
                </span>
              </template>
            </UiNavigationItem>
            <button
              v-if="module.specimens.length > 1 && !searching"
              :id="`explorer-module-${module.id}`"
              type="button"
              class="playground-explorer__disclosure"
              :aria-controls="`explorer-specimens-${module.id}`"
              :aria-expanded="moduleExpanded(module.id)"
              :aria-label="
                formatLocalized(toggleModuleLabel, locale, {
                  module: localize(module.label, locale),
                  count: module.specimens.length,
                })
              "
              @click="toggleModule(module.id)"
            >
              <span class="playground-explorer__count">{{ module.specimens.length }}</span>
              <LabIcon name="chevron" class="playground-explorer__chevron" />
            </button>
          </div>

          <LabDisclosureList
            v-if="module.leaves.length > 0"
            :id="`explorer-specimens-${module.id}`"
            :expanded="module.specimens.length === 1 || moduleExpanded(module.id)"
            class="playground-explorer__specimens"
          >
            <li v-for="specimen in module.leaves" :key="specimen.id">
              <UiNavigationItem
                :href="`#${specimen.id}`"
                tabindex="0"
                :label="localize(specimen.label, locale)"
                :active="route?.specimenId === specimen.id"
                :aria-current="route?.specimenId === specimen.id ? 'location' : undefined"
                stretch
                indicator-placement="start"
                class="playground-explorer__link playground-explorer__leaf"
                @click="emit('navigate', $event, specimen.id)"
              >
                <template v-if="catalogueSecondary(specimen.label, locale)" #suffix>
                  <span class="playground-catalogue-label__secondary" lang="en" aria-hidden="true">
                    {{ catalogueSecondary(specimen.label, locale) }}
                  </span>
                </template>
              </UiNavigationItem>
            </li>
          </LabDisclosureList>
        </li>
      </ul>
    </section>
  </nav>
</template>
