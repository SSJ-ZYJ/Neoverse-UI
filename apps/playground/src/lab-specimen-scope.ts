import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';

// A selection only scopes the visible shell. /frame and module routes keep
// rendering complete specimens for browser contracts and visual QA.
const specimenSelectionKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('specimen-selection');

export function provideSpecimenSelection(selection: ComputedRef<string | undefined>): void {
  provide(specimenSelectionKey, selection);
}

export function injectSpecimenSelection() {
  const selectedId = inject(
    specimenSelectionKey,
    computed(() => undefined),
  );
  const isFocused = computed(() => selectedId.value !== undefined);

  function matches(id: string, relatedIds: readonly string[] = []): boolean {
    const selected = selectedId.value;
    return selected === undefined || selected === id || relatedIds.includes(selected);
  }

  return { selectedId, isFocused, matches };
}

// Within one selected section, the first StateRow is the representative
// interactive specimen. Full module and /frame routes retain every row.
const representativeRowKey: InjectionKey<() => boolean> = Symbol('representative-row');

export function provideRepresentativeRows(): void {
  let seen = false;
  provide(representativeRowKey, () => {
    if (seen) return false;
    seen = true;
    return true;
  });
}

export function injectRepresentativeRow(): boolean {
  return inject(representativeRowKey, () => true, true)();
}
