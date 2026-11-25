import { lazyComponent } from './lazy-component';

export const LabBoard = lazyComponent(() => import('./LabBoard.vue'));
export const LabWorkspace = lazyComponent(() => import('./LabWorkspace.vue'));
